import { getStorageItem, setStorageItem } from './storage';
import { supabase } from './supabase';
import { useRetailStore } from '@/store/retailStore';
import type { Product, Sale, Customer, Expense, StockMovement } from '@/store/retailStore';

const LAST_SYNC_KEY = 'oja_last_sync_time';
const SYNCED_SALES_KEY = 'oja_synced_sale_ids';

let autoSyncInterval: ReturnType<typeof setInterval> | null = null;
let isSyncing = false;

type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';
type SyncListener = (status: SyncStatus, message?: string) => void;

const listeners: Set<SyncListener> = new Set();

export function addSyncListener(listener: SyncListener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notifyListeners(status: SyncStatus, message?: string) {
  listeners.forEach((l) => l(status, message));
}

// ── Product Sync ──────────────────────────────────────────────────────

async function syncProducts(shopId: string): Promise<void> {
  const store = useRetailStore.getState();
  const localProducts = store.products;

  // Push all local products (upsert)
  if (localProducts.length > 0) {
    const rows = localProducts.map((p) => ({
      id: p.id,
      shop_id: shopId,
      name: p.name,
      category: p.category || null,
      cost_price: p.costPrice,
      selling_price: p.sellingPrice,
      stock: p.quantity,
      min_stock: p.lowStockThreshold,
      unit: p.unit,
      barcode: p.barcode || null,
      image: p.imageUrl || null,
      active: true,
      created_at: p.createdAt,
      updated_at: p.updatedAt,
    }));

    const { error } = await supabase
      .from('products')
      .upsert(rows, { onConflict: 'id' });

    if (error) console.warn('Product push error:', error.message);
  }

  // Pull remote products
  const lastSync = getStorageItem(LAST_SYNC_KEY);
  let query = supabase
    .from('products')
    .select('*')
    .eq('shop_id', shopId);

  if (lastSync) {
    query = query.gt('updated_at', lastSync);
  }

  const { data: remoteProducts, error } = await query;
  if (error) {
    console.warn('Product pull error:', error.message);
    return;
  }

  if (remoteProducts && remoteProducts.length > 0) {
    const localIds = new Set(localProducts.map((p) => p.id));

    for (const rp of remoteProducts) {
      const localProduct: Product = {
        id: rp.id,
        name: rp.name,
        category: rp.category || '',
        costPrice: Number(rp.cost_price) || 0,
        sellingPrice: Number(rp.selling_price) || 0,
        quantity: rp.stock || 0,
        lowStockThreshold: rp.min_stock || 5,
        unit: rp.unit || 'pcs',
        barcode: rp.barcode || '',
        imageUrl: rp.image || undefined,
        createdAt: rp.created_at,
        updatedAt: rp.updated_at,
      };

      if (localIds.has(rp.id)) {
        // Update if remote is newer
        const existing = localProducts.find((p) => p.id === rp.id);
        if (existing && rp.updated_at > existing.updatedAt) {
          store.updateProduct(rp.id, localProduct);
        }
      } else {
        // New product from cloud — add locally
        useRetailStore.setState((state) => ({
          products: [...state.products, localProduct],
        }));
      }
    }
  }
}

// ── Sales Sync (append-only) ──────────────────────────────────────────

async function syncSales(shopId: string): Promise<void> {
  const store = useRetailStore.getState();
  const localSales = store.sales;

  // Get already-synced sale IDs
  const syncedRaw = getStorageItem(SYNCED_SALES_KEY);
  const syncedIds = new Set<string>(syncedRaw ? JSON.parse(syncedRaw) : []);

  // Push unsynced sales
  const unsyncedSales = localSales.filter((s) => !syncedIds.has(s.id));

  if (unsyncedSales.length > 0) {
    const rows = unsyncedSales.map((s) => ({
      id: s.id,
      shop_id: shopId,
      staff_id: s.staffId || null,
      staff_name: s.staffName || null,
      items: s.items.map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        sellingPrice: item.product.sellingPrice,
        costPrice: item.product.costPrice,
        quantity: item.quantity,
      })),
      subtotal: s.subtotal,
      discount: s.discount,
      total: s.total,
      payment_method: s.paymentMethod,
      customer_id: s.customerId || null,
      customer_name: s.customerName || null,
      cash_received: s.cashReceived || null,
      change_given: s.changeGiven || null,
      created_at: s.createdAt,
    }));

    const { error } = await supabase
      .from('sales')
      .upsert(rows, { onConflict: 'id' });

    if (error) {
      console.warn('Sales push error:', error.message);
    } else {
      // Mark as synced
      unsyncedSales.forEach((s) => syncedIds.add(s.id));
      setStorageItem(SYNCED_SALES_KEY, JSON.stringify([...syncedIds]));

      // Update synced flag in store
      useRetailStore.setState((state) => ({
        sales: state.sales.map((s) =>
          syncedIds.has(s.id) ? { ...s, synced: true } : s
        ),
        pendingSyncCount: state.sales.filter((s) => !syncedIds.has(s.id)).length,
      }));
    }
  }

  // Pull remote sales not in local
  const lastSync = getStorageItem(LAST_SYNC_KEY);
  let query = supabase
    .from('sales')
    .select('*')
    .eq('shop_id', shopId);

  if (lastSync) {
    query = query.gt('created_at', lastSync);
  }

  const { data: remoteSales, error: pullError } = await query;
  if (pullError) {
    console.warn('Sales pull error:', pullError.message);
    return;
  }

  if (remoteSales && remoteSales.length > 0) {
    const localIds = new Set(localSales.map((s) => s.id));
    const newSales: Sale[] = [];

    for (const rs of remoteSales) {
      if (!localIds.has(rs.id)) {
        newSales.push({
          id: rs.id,
          items: (rs.items as any[]).map((item: any) => ({
            product: {
              id: item.productId,
              name: item.productName,
              sellingPrice: item.sellingPrice,
              costPrice: item.costPrice,
              barcode: '',
              category: '',
              quantity: 0,
              unit: 'pcs',
              lowStockThreshold: 5,
              createdAt: rs.created_at,
              updatedAt: rs.created_at,
            },
            quantity: item.quantity,
          })),
          subtotal: Number(rs.subtotal) || 0,
          discount: Number(rs.discount) || 0,
          total: Number(rs.total) || 0,
          paymentMethod: rs.payment_method,
          customerId: rs.customer_id || undefined,
          customerName: rs.customer_name || undefined,
          staffId: rs.staff_id || undefined,
          staffName: rs.staff_name || undefined,
          cashReceived: rs.cash_received ? Number(rs.cash_received) : undefined,
          changeGiven: rs.change_given ? Number(rs.change_given) : undefined,
          createdAt: rs.created_at,
          synced: true,
        });
        syncedIds.add(rs.id);
      }
    }

    if (newSales.length > 0) {
      useRetailStore.setState((state) => ({
        sales: [...newSales, ...state.sales].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ),
      }));
      setStorageItem(SYNCED_SALES_KEY, JSON.stringify([...syncedIds]));
    }
  }
}

// ── Customer Sync ─────────────────────────────────────────────────────

async function syncCustomers(shopId: string): Promise<void> {
  const store = useRetailStore.getState();
  const localCustomers = store.customers;

  if (localCustomers.length > 0) {
    const rows = localCustomers.map((c) => ({
      id: c.id,
      shop_id: shopId,
      name: c.name,
      phone: c.phone || null,
      credit_limit: c.creditLimit,
      current_credit: c.currentCredit,
      transactions: c.transactions,
      created_at: c.createdAt,
      updated_at: c.createdAt,
    }));

    const { error } = await supabase
      .from('customers')
      .upsert(rows, { onConflict: 'id' });

    if (error) console.warn('Customer push error:', error.message);
  }

  // Pull remote
  const lastSync = getStorageItem(LAST_SYNC_KEY);
  let query = supabase
    .from('customers')
    .select('*')
    .eq('shop_id', shopId);

  if (lastSync) {
    query = query.gt('updated_at', lastSync);
  }

  const { data: remoteCustomers, error } = await query;
  if (error) {
    console.warn('Customer pull error:', error.message);
    return;
  }

  if (remoteCustomers && remoteCustomers.length > 0) {
    const localIds = new Set(localCustomers.map((c) => c.id));

    for (const rc of remoteCustomers) {
      if (!localIds.has(rc.id)) {
        const newCustomer: Customer = {
          id: rc.id,
          name: rc.name,
          phone: rc.phone || '',
          creditLimit: Number(rc.credit_limit) || 0,
          currentCredit: Number(rc.current_credit) || 0,
          transactions: rc.transactions || [],
          createdAt: rc.created_at,
        };
        useRetailStore.setState((state) => ({
          customers: [...state.customers, newCustomer],
        }));
      }
    }
  }
}

// ── Expense Sync ──────────────────────────────────────────────────────

async function syncExpenses(shopId: string): Promise<void> {
  const store = useRetailStore.getState();
  const localExpenses = store.expenses;

  if (localExpenses.length > 0) {
    const rows = localExpenses.map((e) => ({
      id: e.id,
      shop_id: shopId,
      category: e.category,
      description: e.description,
      amount: e.amount,
      payment_method: e.paymentMethod,
      created_at: e.createdAt,
    }));

    const { error } = await supabase
      .from('expenses')
      .upsert(rows, { onConflict: 'id' });

    if (error) console.warn('Expense push error:', error.message);
  }

  // Pull remote
  const lastSync = getStorageItem(LAST_SYNC_KEY);
  let query = supabase
    .from('expenses')
    .select('*')
    .eq('shop_id', shopId);

  if (lastSync) {
    query = query.gt('created_at', lastSync);
  }

  const { data: remoteExpenses, error } = await query;
  if (error) {
    console.warn('Expense pull error:', error.message);
    return;
  }

  if (remoteExpenses && remoteExpenses.length > 0) {
    const localIds = new Set(localExpenses.map((e) => e.id));

    for (const re of remoteExpenses) {
      if (!localIds.has(re.id)) {
        const newExpense: Expense = {
          id: re.id,
          category: re.category || '',
          description: re.description || '',
          amount: Number(re.amount) || 0,
          paymentMethod: re.payment_method || 'cash',
          createdAt: re.created_at,
        };
        useRetailStore.setState((state) => ({
          expenses: [newExpense, ...state.expenses],
        }));
      }
    }
  }
}

// ── Stock Movement Sync ───────────────────────────────────────────────

async function syncStockMovements(shopId: string): Promise<void> {
  const store = useRetailStore.getState();
  const localMovements = store.stockMovements;

  if (localMovements.length > 0) {
    const rows = localMovements.map((m) => ({
      id: m.id,
      shop_id: shopId,
      product_id: m.productId,
      type: m.type,
      quantity: m.quantity,
      previous_stock: m.previousQuantity,
      new_stock: m.newQuantity,
      reason: m.reason || null,
      supplier_id: m.supplierId || null,
      cost_per_unit: m.costPerUnit || null,
      created_at: m.createdAt,
    }));

    const { error } = await supabase
      .from('stock_movements')
      .upsert(rows, { onConflict: 'id' });

    if (error) console.warn('Stock movement push error:', error.message);
  }
}

// ── Sync All ──────────────────────────────────────────────────────────

export async function syncAll(shopId: string): Promise<boolean> {
  if (isSyncing) return false;
  isSyncing = true;
  notifyListeners('syncing');

  try {
    await syncProducts(shopId);
    await syncSales(shopId);
    await syncCustomers(shopId);
    await syncExpenses(shopId);
    await syncStockMovements(shopId);

    // Update last sync time
    const now = new Date().toISOString();
    setStorageItem(LAST_SYNC_KEY, now);

    useRetailStore.setState({ lastSyncTime: now });

    notifyListeners('success');
    isSyncing = false;
    return true;
  } catch (err: any) {
    console.warn('Sync error:', err.message);
    notifyListeners('error', err.message);
    isSyncing = false;
    return false;
  }
}

// ── Auto Sync ─────────────────────────────────────────────────────────

export function startAutoSync(shopId: string) {
  stopAutoSync();
  // Sync every 5 minutes
  autoSyncInterval = setInterval(() => {
    syncAll(shopId);
  }, 5 * 60 * 1000);
}

export function stopAutoSync() {
  if (autoSyncInterval) {
    clearInterval(autoSyncInterval);
    autoSyncInterval = null;
  }
}

export async function getLastSyncTime(): Promise<string | null> {
  return getStorageItem(LAST_SYNC_KEY);
}
