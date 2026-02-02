import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from '@/lib/storage';

// Types
export interface Product {
  id: string;
  name: string;
  barcode: string;
  category: string;
  costPrice: number;
  sellingPrice: number;
  quantity: number;
  unit: string;
  lowStockThreshold: number;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Sale {
  id: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: 'cash' | 'transfer' | 'pos' | 'credit';
  customerId?: string;
  customerName?: string;
  staffId?: string;
  staffName?: string;
  cashReceived?: number;
  changeGiven?: number;
  createdAt: string;
  synced: boolean;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  creditLimit: number;
  currentCredit: number;
  creditFrozen?: boolean;
  lastReminderSent?: string;
  transactions: CreditTransaction[];
  createdAt: string;
}

export interface CreditTransaction {
  id: string;
  type: 'credit' | 'payment';
  amount: number;
  saleId?: string;
  note?: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  paymentMethod: 'cash' | 'transfer' | 'pos';
  createdAt: string;
}

export interface CashSession {
  id: string;
  openingCash: number;
  closingCash?: number;
  expectedCash?: number;
  difference?: number;
  status: 'open' | 'closed';
  openedAt: string;
  closedAt?: string;
  note?: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  address?: string;
  products: string[]; // Product IDs they supply
  createdAt: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  type: 'purchase' | 'sale' | 'adjustment' | 'return' | 'damage';
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  reason?: string;
  supplierId?: string;
  costPerUnit?: number;
  createdAt: string;
}

export interface DailySummary {
  date: string;
  totalSales: number;
  totalTransactions: number;
  cashSales: number;
  transferSales: number;
  posSales: number;
  creditSales: number;
  totalExpenses: number;
  profit: number;
  netCashFlow: number;
}

interface RetailState {
  // Products
  products: Product[];
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  getProductByBarcode: (barcode: string) => Product | undefined;
  adjustStock: (id: string, adjustment: number, reason?: string, supplierId?: string, costPerUnit?: number) => void;

  // Inventory Alerts
  whatsAppAlertsEnabled: boolean;
  alertPhoneNumber: string;
  lastAlertSentAt: string | null;
  defaultLowStockThreshold: number;
  setWhatsAppAlertsEnabled: (enabled: boolean) => void;
  setAlertPhoneNumber: (phone: string) => void;
  setLastAlertSentAt: (timestamp: string) => void;
  setDefaultLowStockThreshold: (threshold: number) => void;

  // Categories
  categories: Category[];
  addCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (id: string, updates: Partial<Omit<Category, 'id'>>) => void;
  deleteCategory: (id: string) => void;

  // Cart
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  cartDiscount: number;
  setCartDiscount: (discount: number) => void;

  // Sales
  sales: Sale[];
  completeSale: (paymentMethod: Sale['paymentMethod'], customerId?: string, cashReceived?: number, staffId?: string, staffName?: string) => Sale | null;
  getSalesToday: () => Sale[];
  getSalesByDateRange: (startDate: string, endDate: string) => Sale[];

  // Customers / Credit Book
  customers: Customer[];
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'currentCredit' | 'transactions'>) => void;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  recordCreditPayment: (customerId: string, amount: number, note?: string) => void;
  getCustomerById: (id: string) => Customer | undefined;
  getTotalOutstandingCredit: () => number;
  freezeCustomerCredit: (id: string, frozen: boolean) => void;
  setLastReminderSent: (id: string) => void;

  // Expenses
  expenses: Expense[];
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => void;
  deleteExpense: (id: string) => void;
  getExpensesToday: () => Expense[];
  getExpensesByDateRange: (startDate: string, endDate: string) => Expense[];

  // Cash Management
  cashSessions: CashSession[];
  currentCashSession: CashSession | null;
  openCashSession: (openingCash: number) => void;
  closeCashSession: (closingCash: number, note?: string) => void;
  getExpectedCash: () => number;

  // Suppliers
  suppliers: Supplier[];
  addSupplier: (supplier: Omit<Supplier, 'id' | 'createdAt'>) => void;
  updateSupplier: (id: string, updates: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;

  // Stock Movements
  stockMovements: StockMovement[];
  getStockMovementsByProduct: (productId: string) => StockMovement[];

  // Analytics
  getDailySummary: (date: string) => DailySummary;
  getLowStockProducts: () => Product[];
  getTopSellingProducts: (days: number) => { product: Product; totalSold: number }[];
  getTopCustomers: () => { customer: Customer; totalPurchases: number }[];

  // Sync status
  pendingSyncCount: number;
  lastSyncTime: string | null;

  // Demo
  demoLoaded: boolean;
  loadDemoData: () => void;
}

const generateId = () => Math.random().toString(36).substring(2, 15) + Date.now().toString(36);

// Expense categories common in Nigerian retail
export const expenseCategories = [
  'Rent',
  'Electricity (NEPA)',
  'Generator Fuel',
  'Staff Salary',
  'Transport',
  'Shop Supplies',
  'Repairs',
  'Phone/Data',
  'Taxes/Levy',
  'Other',
];

// Default categories for Nigerian retail
const defaultCategories: Category[] = [
  { id: '1', name: 'Beverages', color: '#E67E22', icon: 'coffee' },
  { id: '2', name: 'Provisions', color: '#27AE60', icon: 'package' },
  { id: '3', name: 'Dairy', color: '#3498DB', icon: 'droplet' },
  { id: '4', name: 'Grains & Cereals', color: '#F39C12', icon: 'wheat' },
  { id: '5', name: 'Toiletries', color: '#9B59B6', icon: 'sparkles' },
  { id: '6', name: 'Frozen Foods', color: '#1ABC9C', icon: 'snowflake' },
  { id: '7', name: 'Snacks', color: '#E74C3C', icon: 'cookie' },
  { id: '8', name: 'Household', color: '#34495E', icon: 'home' },
];

// ── Demo Data (auto-populates on first load) ────────────────────────────

const today = () => new Date().toISOString().split('T')[0];
const todayAt = (h: number, m: number) => {
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toISOString();
};
const daysAgoAt = (daysAgo: number, h: number, m: number) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
};

const DEMO_PRODUCTS: Product[] = [
  { id: 'dp1',  name: 'Peak Milk 400g',           barcode: '5000112345601', category: 'Dairy',            costPrice: 2800, sellingPrice: 3500, quantity: 80,  unit: 'tin',    lowStockThreshold: 10, createdAt: todayAt(7,0), updatedAt: todayAt(7,0) },
  { id: 'dp2',  name: 'Indomie Chicken 70g',       barcode: '5390002012345', category: 'Provisions',       costPrice: 180,  sellingPrice: 230,  quantity: 200, unit: 'pack',   lowStockThreshold: 30, createdAt: todayAt(7,0), updatedAt: todayAt(7,0) },
  { id: 'dp3',  name: 'Coca-Cola 50cl',             barcode: '5449000000996', category: 'Beverages',        costPrice: 200,  sellingPrice: 250,  quantity: 120, unit: 'bottle', lowStockThreshold: 20, createdAt: todayAt(7,0), updatedAt: todayAt(7,0) },
  { id: 'dp4',  name: 'Milo 400g',                  barcode: '7613036254670', category: 'Beverages',        costPrice: 2200, sellingPrice: 2700, quantity: 45,  unit: 'tin',    lowStockThreshold: 8,  createdAt: todayAt(7,0), updatedAt: todayAt(7,0) },
  { id: 'dp5',  name: 'Golden Penny Semovita 1kg',  barcode: '5060000000012', category: 'Grains & Cereals', costPrice: 900,  sellingPrice: 1100, quantity: 60,  unit: 'pack',   lowStockThreshold: 10, createdAt: todayAt(7,0), updatedAt: todayAt(7,0) },
  { id: 'dp6',  name: 'Dangote Sugar 1kg',          barcode: '5060000000029', category: 'Provisions',       costPrice: 1200, sellingPrice: 1500, quantity: 55,  unit: 'pack',   lowStockThreshold: 10, createdAt: todayAt(7,0), updatedAt: todayAt(7,0) },
  { id: 'dp7',  name: 'Kings Oil 1L',               barcode: '5060000000036', category: 'Provisions',       costPrice: 1800, sellingPrice: 2200, quantity: 40,  unit: 'bottle', lowStockThreshold: 8,  createdAt: todayAt(7,0), updatedAt: todayAt(7,0) },
  { id: 'dp8',  name: 'Dettol Soap 110g',           barcode: '5010044017072', category: 'Toiletries',       costPrice: 350,  sellingPrice: 450,  quantity: 90,  unit: 'bar',    lowStockThreshold: 15, createdAt: todayAt(7,0), updatedAt: todayAt(7,0) },
  { id: 'dp9',  name: 'Minimie Chinchin 50g',       barcode: '5060000000043', category: 'Snacks',           costPrice: 100,  sellingPrice: 150,  quantity: 150, unit: 'pack',   lowStockThreshold: 20, createdAt: todayAt(7,0), updatedAt: todayAt(7,0) },
  { id: 'dp10', name: 'Harpic Toilet Cleaner 500ml', barcode: '5060000000050', category: 'Household',       costPrice: 750,  sellingPrice: 950,  quantity: 30,  unit: 'bottle', lowStockThreshold: 5,  createdAt: todayAt(7,0), updatedAt: todayAt(7,0) },
  { id: 'dp11', name: 'Okin Biscuit 50g',           barcode: '5060000000067', category: 'Snacks',           costPrice: 80,   sellingPrice: 100,  quantity: 180, unit: 'pack',   lowStockThreshold: 25, createdAt: todayAt(7,0), updatedAt: todayAt(7,0) },
  { id: 'dp12', name: 'Chi Exotic Juice 1L',        barcode: '5060000000074', category: 'Beverages',        costPrice: 850,  sellingPrice: 1050, quantity: 35,  unit: 'pack',   lowStockThreshold: 5,  createdAt: todayAt(7,0), updatedAt: todayAt(7,0) },
];

const DEMO_CUSTOMERS: Customer[] = [
  {
    id: 'dc1', name: 'Mama Ngozi', phone: '08031234567', creditLimit: 50000, currentCredit: 8200,
    transactions: [
      { id: 'dt1', type: 'credit', amount: 8200, saleId: 'ds7', createdAt: todayAt(15, 30) },
    ],
    createdAt: todayAt(7, 0),
  },
  {
    id: 'dc2', name: 'Alhaji Musa', phone: '08061234568', creditLimit: 100000, currentCredit: 0,
    transactions: [
      { id: 'dt2', type: 'credit', amount: 12000, createdAt: new Date(Date.now() - 3 * 86400000).toISOString() },
      { id: 'dt3', type: 'payment', amount: 12000, note: 'Paid in full', createdAt: new Date(Date.now() - 1 * 86400000).toISOString() },
    ],
    createdAt: todayAt(7, 0),
  },
  {
    id: 'dc3', name: 'Mrs. Adebayo', phone: '08091234569', creditLimit: 30000, currentCredit: 4750,
    transactions: [
      { id: 'dt4', type: 'credit', amount: 4750, saleId: 'ds8', createdAt: todayAt(17, 0) },
    ],
    createdAt: todayAt(7, 0),
  },
  {
    id: 'dc4', name: 'Brother Emeka', phone: '07031234570', creditLimit: 20000, currentCredit: 0,
    transactions: [],
    createdAt: todayAt(7, 0),
  },
];

const _dp = (id: string) => DEMO_PRODUCTS.find(p => p.id === id)!;

const DEMO_SALES: Sale[] = [
  // ── 6 days ago (1 sale) ─────────────────────────────
  { id: 'ds20', items: [{ product: _dp('dp2'), quantity: 10 }, { product: _dp('dp3'), quantity: 4 }],
    subtotal: 3300, discount: 0, total: 3300, paymentMethod: 'cash', cashReceived: 3500, changeGiven: 200, createdAt: daysAgoAt(6, 10, 30), synced: true },

  // ── 5 days ago (2 sales) ────────────────────────────
  { id: 'ds21', items: [{ product: _dp('dp1'), quantity: 2 }, { product: _dp('dp9'), quantity: 6 }],
    subtotal: 7900, discount: 0, total: 7900, paymentMethod: 'transfer', createdAt: daysAgoAt(5, 9, 15), synced: true },
  { id: 'ds22', items: [{ product: _dp('dp6'), quantity: 3 }],
    subtotal: 4500, discount: 0, total: 4500, paymentMethod: 'cash', cashReceived: 5000, changeGiven: 500, createdAt: daysAgoAt(5, 14, 0), synced: true },

  // ── 4 days ago (1 sale) ─────────────────────────────
  { id: 'ds23', items: [{ product: _dp('dp8'), quantity: 5 }, { product: _dp('dp11'), quantity: 10 }],
    subtotal: 3250, discount: 0, total: 3250, paymentMethod: 'pos', createdAt: daysAgoAt(4, 11, 45), synced: true },

  // ── 3 days ago (3 sales) ────────────────────────────
  { id: 'ds24', items: [{ product: _dp('dp4'), quantity: 1 }, { product: _dp('dp12'), quantity: 2 }],
    subtotal: 4800, discount: 0, total: 4800, paymentMethod: 'cash', cashReceived: 5000, changeGiven: 200, createdAt: daysAgoAt(3, 8, 30), synced: true },
  { id: 'ds25', items: [{ product: _dp('dp7'), quantity: 2 }, { product: _dp('dp5'), quantity: 2 }],
    subtotal: 6600, discount: 100, total: 6500, paymentMethod: 'transfer', createdAt: daysAgoAt(3, 12, 0), synced: true },
  { id: 'ds26', items: [{ product: _dp('dp3'), quantity: 8 }],
    subtotal: 2000, discount: 0, total: 2000, paymentMethod: 'cash', cashReceived: 2000, changeGiven: 0, createdAt: daysAgoAt(3, 16, 30), synced: true },

  // ── 2 days ago (2 sales) ────────────────────────────
  { id: 'ds27', items: [{ product: _dp('dp1'), quantity: 3 }, { product: _dp('dp2'), quantity: 8 }],
    subtotal: 12340, discount: 0, total: 12340, paymentMethod: 'cash', cashReceived: 13000, changeGiven: 660, createdAt: daysAgoAt(2, 9, 0), synced: true },
  { id: 'ds28', items: [{ product: _dp('dp10'), quantity: 2 }, { product: _dp('dp6'), quantity: 1 }],
    subtotal: 3400, discount: 0, total: 3400, paymentMethod: 'transfer', createdAt: daysAgoAt(2, 15, 30), synced: true },

  // ── Yesterday (2 sales) ─────────────────────────────
  { id: 'ds29', items: [{ product: _dp('dp5'), quantity: 4 }, { product: _dp('dp9'), quantity: 10 }],
    subtotal: 5900, discount: 0, total: 5900, paymentMethod: 'cash', cashReceived: 6000, changeGiven: 100, createdAt: daysAgoAt(1, 10, 0), synced: true },
  { id: 'ds30', items: [{ product: _dp('dp4'), quantity: 1 }, { product: _dp('dp7'), quantity: 1 }],
    subtotal: 4900, discount: 0, total: 4900, paymentMethod: 'pos', createdAt: daysAgoAt(1, 14, 20), synced: true },

  // ── Today (busiest – 5 sales) ───────────────────────
  // Sale 1 – 8:15 AM – cash
  { id: 'ds1', items: [{ product: _dp('dp1'), quantity: 1 }, { product: _dp('dp2'), quantity: 5 }, { product: _dp('dp3'), quantity: 6 }],
    subtotal: 6150, discount: 0, total: 6150, paymentMethod: 'cash', cashReceived: 7000, changeGiven: 850, createdAt: todayAt(8,15), synced: true },
  // Sale 2 – 9:40 AM – transfer
  { id: 'ds2', items: [{ product: _dp('dp4'), quantity: 2 }],
    subtotal: 5400, discount: 0, total: 5400, paymentMethod: 'transfer', createdAt: todayAt(9,40), synced: true },
  // Sale 3 – 10:55 AM – cash
  { id: 'ds3', items: [{ product: _dp('dp5'), quantity: 3 }, { product: _dp('dp6'), quantity: 2 }, { product: _dp('dp7'), quantity: 1 }],
    subtotal: 8500, discount: 150, total: 8350, paymentMethod: 'cash', cashReceived: 10000, changeGiven: 1650, createdAt: todayAt(10,55), synced: true },
  // Sale 4 – 12:20 PM – pos
  { id: 'ds4', items: [{ product: _dp('dp8'), quantity: 4 }, { product: _dp('dp9'), quantity: 8 }],
    subtotal: 3000, discount: 0, total: 3000, paymentMethod: 'pos', createdAt: todayAt(12,20), synced: true },
  // Sale 5 – 1:45 PM – cash
  { id: 'ds5', items: [{ product: _dp('dp1'), quantity: 2 }, { product: _dp('dp12'), quantity: 2 }, { product: _dp('dp11'), quantity: 2 }],
    subtotal: 9300, discount: 0, total: 9300, paymentMethod: 'cash', cashReceived: 10000, changeGiven: 700, createdAt: todayAt(13,45), synced: true },
  // Sale 6 – 3:00 PM – transfer
  { id: 'ds6', items: [{ product: _dp('dp7'), quantity: 3 }, { product: _dp('dp6'), quantity: 3 }],
    subtotal: 11100, discount: 100, total: 11000, paymentMethod: 'transfer', createdAt: todayAt(15,0), synced: true },
  // Sale 7 – 3:30 PM – credit (Mama Ngozi)
  { id: 'ds7', items: [{ product: _dp('dp4'), quantity: 2 }, { product: _dp('dp5'), quantity: 2 }, { product: _dp('dp9'), quantity: 4 }],
    subtotal: 8200, discount: 0, total: 8200, paymentMethod: 'credit', customerId: 'dc1', customerName: 'Mama Ngozi', createdAt: todayAt(15,30), synced: true },
  // Sale 8 – 5:00 PM – credit (Mrs. Adebayo)
  { id: 'ds8', items: [{ product: _dp('dp10'), quantity: 3 }, { product: _dp('dp8'), quantity: 2 }, { product: _dp('dp3'), quantity: 4 }],
    subtotal: 4750, discount: 0, total: 4750, paymentMethod: 'credit', customerId: 'dc3', customerName: 'Mrs. Adebayo', createdAt: todayAt(17,0), synced: true },
];

const DEMO_EXPENSES: Expense[] = [
  { id: 'de1', category: 'Generator Fuel', description: 'Diesel for generator', amount: 5000, paymentMethod: 'cash', createdAt: todayAt(7, 30) },
  { id: 'de2', category: 'Phone/Data',     description: 'MTN data bundle',       amount: 2000, paymentMethod: 'transfer', createdAt: todayAt(9, 0) },
  { id: 'de3', category: 'Transport',       description: 'Delivery bike fuel',    amount: 1500, paymentMethod: 'cash', createdAt: todayAt(11, 0) },
  { id: 'de4', category: 'Shop Supplies',   description: 'Receipt paper rolls',   amount: 800,  paymentMethod: 'cash', createdAt: todayAt(14, 0) },
];

// ── Store ────────────────────────────────────────────────────────────────

export const useRetailStore = create<RetailState>()(
  persist(
    (set, get) => ({
      // Initial state
      products: [],
      categories: defaultCategories,
      cart: [],
      cartDiscount: 0,
      sales: [],
      customers: [],
      expenses: [],
      cashSessions: [],
      currentCashSession: null,
      suppliers: [],
      stockMovements: [],
      pendingSyncCount: 0,
      lastSyncTime: null,
      demoLoaded: false,

      // Inventory Alerts
      whatsAppAlertsEnabled: false,
      alertPhoneNumber: '',
      lastAlertSentAt: null,
      defaultLowStockThreshold: 10,
      setWhatsAppAlertsEnabled: (enabled) => set({ whatsAppAlertsEnabled: enabled }),
      setAlertPhoneNumber: (phone) => set({ alertPhoneNumber: phone }),
      setLastAlertSentAt: (timestamp) => set({ lastAlertSentAt: timestamp }),
      setDefaultLowStockThreshold: (threshold) => set({ defaultLowStockThreshold: threshold }),

      // Product actions
      addProduct: (product) => {
        const newProduct: Product = {
          ...product,
          id: generateId(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((state) => ({ products: [...state.products, newProduct] }));
      },

      updateProduct: (id, updates) => {
        set((state) => ({
          products: state.products.map((p) =>
            p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
          ),
        }));
      },

      deleteProduct: (id) => {
        set((state) => ({ products: state.products.filter((p) => p.id !== id) }));
      },

      getProductByBarcode: (barcode) => {
        return get().products.find((p) => p.barcode === barcode);
      },

      adjustStock: (id, adjustment, reason, supplierId, costPerUnit) => {
        const product = get().products.find((p) => p.id === id);
        if (!product) return;

        const previousQuantity = product.quantity;
        const newQuantity = Math.max(0, previousQuantity + adjustment);

        // Record stock movement
        const movement: StockMovement = {
          id: generateId(),
          productId: id,
          type: adjustment > 0 ? 'purchase' : (reason === 'sale' ? 'sale' : 'adjustment'),
          quantity: Math.abs(adjustment),
          previousQuantity,
          newQuantity,
          reason,
          supplierId,
          costPerUnit,
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          products: state.products.map((p) =>
            p.id === id
              ? { ...p, quantity: newQuantity, updatedAt: new Date().toISOString() }
              : p
          ),
          stockMovements: [movement, ...state.stockMovements],
        }));
      },

      // Category actions
      addCategory: (category) => {
        const newCategory: Category = { ...category, id: generateId() };
        set((state) => ({ categories: [...state.categories, newCategory] }));
      },

      updateCategory: (id, updates) => {
        set((state) => ({
          categories: state.categories.map((c) =>
            c.id === id ? { ...c, ...updates } : c
          ),
        }));
      },

      deleteCategory: (id) => {
        set((state) => ({
          categories: state.categories.filter((c) => c.id !== id),
        }));
      },

      // Cart actions
      addToCart: (product, quantity = 1) => {
        set((state) => {
          const currentProduct = state.products.find((p) => p.id === product.id);
          const maxStock = currentProduct?.quantity ?? product.quantity;
          const existingItem = state.cart.find((item) => item.product.id === product.id);
          if (existingItem) {
            const newQty = Math.min(existingItem.quantity + quantity, maxStock);
            if (newQty === existingItem.quantity) return state; // Already at max
            return {
              cart: state.cart.map((item) =>
                item.product.id === product.id
                  ? { ...item, quantity: newQty }
                  : item
              ),
            };
          }
          return { cart: [...state.cart, { product, quantity: Math.min(quantity, maxStock) }] };
        });
      },

      updateCartQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeFromCart(productId);
          return;
        }
        const currentProduct = get().products.find((p) => p.id === productId);
        const maxStock = currentProduct?.quantity ?? quantity;
        const cappedQuantity = Math.min(quantity, maxStock);
        set((state) => ({
          cart: state.cart.map((item) =>
            item.product.id === productId ? { ...item, quantity: cappedQuantity } : item
          ),
        }));
      },

      removeFromCart: (productId) => {
        set((state) => ({
          cart: state.cart.filter((item) => item.product.id !== productId),
        }));
      },

      clearCart: () => {
        set({ cart: [], cartDiscount: 0 });
      },

      setCartDiscount: (discount) => {
        set({ cartDiscount: discount });
      },

      // Sales actions
      completeSale: (paymentMethod, customerId, cashReceived, staffId, staffName) => {
        const state = get();
        if (state.cart.length === 0) return null;

        // Validate stock availability
        for (const item of state.cart) {
          const currentProduct = state.products.find((p) => p.id === item.product.id);
          if (currentProduct && item.quantity > currentProduct.quantity) {
            // Silently cap quantity to available stock
            if (currentProduct.quantity <= 0) return null;
          }
        }

        const subtotal = state.cart.reduce(
          (sum, item) => sum + item.product.sellingPrice * item.quantity,
          0
        );
        const total = subtotal - state.cartDiscount;
        const customer = customerId ? state.customers.find(c => c.id === customerId) : undefined;

        const sale: Sale = {
          id: generateId(),
          items: [...state.cart],
          subtotal,
          discount: state.cartDiscount,
          total,
          paymentMethod,
          customerId,
          customerName: customer?.name,
          staffId,
          staffName,
          cashReceived: paymentMethod === 'cash' ? cashReceived : undefined,
          changeGiven: paymentMethod === 'cash' && cashReceived ? cashReceived - total : undefined,
          createdAt: new Date().toISOString(),
          synced: false,
        };

        // Update stock for each item
        state.cart.forEach((item) => {
          state.adjustStock(item.product.id, -item.quantity, 'sale');
        });

        // Update customer credit if applicable
        if (paymentMethod === 'credit' && customerId) {
          const creditTransaction: CreditTransaction = {
            id: generateId(),
            type: 'credit',
            amount: total,
            saleId: sale.id,
            createdAt: new Date().toISOString(),
          };

          set((state) => ({
            customers: state.customers.map((c) =>
              c.id === customerId
                ? {
                    ...c,
                    currentCredit: c.currentCredit + total,
                    transactions: [creditTransaction, ...c.transactions],
                  }
                : c
            ),
          }));
        }

        set((state) => ({
          sales: [sale, ...state.sales],
          cart: [],
          cartDiscount: 0,
          pendingSyncCount: state.pendingSyncCount + 1,
        }));

        return sale;
      },

      getSalesToday: () => {
        const today = new Date().toISOString().split('T')[0];
        return get().sales.filter((s) => s.createdAt.startsWith(today));
      },

      getSalesByDateRange: (startDate, endDate) => {
        return get().sales.filter((s) => {
          const saleDate = s.createdAt.split('T')[0];
          return saleDate >= startDate && saleDate <= endDate;
        });
      },

      // Customer / Credit Book actions
      addCustomer: (customer) => {
        const newCustomer: Customer = {
          ...customer,
          id: generateId(),
          currentCredit: 0,
          transactions: [],
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ customers: [...state.customers, newCustomer] }));
      },

      updateCustomer: (id, updates) => {
        set((state) => ({
          customers: state.customers.map((c) =>
            c.id === id ? { ...c, ...updates } : c
          ),
        }));
      },

      deleteCustomer: (id) => {
        set((state) => ({ customers: state.customers.filter((c) => c.id !== id) }));
      },

      recordCreditPayment: (customerId, amount, note) => {
        const transaction: CreditTransaction = {
          id: generateId(),
          type: 'payment',
          amount,
          note,
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          customers: state.customers.map((c) =>
            c.id === customerId
              ? {
                  ...c,
                  currentCredit: Math.max(0, c.currentCredit - amount),
                  transactions: [transaction, ...c.transactions],
                }
              : c
          ),
        }));
      },

      getCustomerById: (id) => {
        return get().customers.find((c) => c.id === id);
      },

      getTotalOutstandingCredit: () => {
        return get().customers.reduce((sum, c) => sum + c.currentCredit, 0);
      },

      freezeCustomerCredit: (id, frozen) => {
        set((state) => ({
          customers: state.customers.map((c) =>
            c.id === id ? { ...c, creditFrozen: frozen } : c
          ),
        }));
      },

      setLastReminderSent: (id) => {
        set((state) => ({
          customers: state.customers.map((c) =>
            c.id === id ? { ...c, lastReminderSent: new Date().toISOString() } : c
          ),
        }));
      },

      // Expense actions
      addExpense: (expense) => {
        const newExpense: Expense = {
          ...expense,
          id: generateId(),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ expenses: [newExpense, ...state.expenses] }));
      },

      deleteExpense: (id) => {
        set((state) => ({ expenses: state.expenses.filter((e) => e.id !== id) }));
      },

      getExpensesToday: () => {
        const today = new Date().toISOString().split('T')[0];
        return get().expenses.filter((e) => e.createdAt.startsWith(today));
      },

      getExpensesByDateRange: (startDate, endDate) => {
        return get().expenses.filter((e) => {
          const expenseDate = e.createdAt.split('T')[0];
          return expenseDate >= startDate && expenseDate <= endDate;
        });
      },

      // Cash Management
      openCashSession: (openingCash) => {
        const session: CashSession = {
          id: generateId(),
          openingCash,
          status: 'open',
          openedAt: new Date().toISOString(),
        };
        set({ currentCashSession: session });
      },

      closeCashSession: (closingCash, note) => {
        const state = get();
        if (!state.currentCashSession) return;

        const expectedCash = state.getExpectedCash();
        const difference = closingCash - expectedCash;

        const closedSession: CashSession = {
          ...state.currentCashSession,
          closingCash,
          expectedCash,
          difference,
          status: 'closed',
          closedAt: new Date().toISOString(),
          note,
        };

        set((state) => ({
          cashSessions: [closedSession, ...state.cashSessions],
          currentCashSession: null,
        }));
      },

      getExpectedCash: () => {
        const state = get();
        if (!state.currentCashSession) return 0;

        const sessionStart = state.currentCashSession.openedAt;
        const cashSales = state.sales
          .filter((s) => s.createdAt >= sessionStart && s.paymentMethod === 'cash')
          .reduce((sum, s) => sum + s.total, 0);

        const cashExpenses = state.expenses
          .filter((e) => e.createdAt >= sessionStart && e.paymentMethod === 'cash')
          .reduce((sum, e) => sum + e.amount, 0);

        const creditPayments = state.customers
          .flatMap((c) => c.transactions)
          .filter((t) => t.type === 'payment' && t.createdAt >= sessionStart)
          .reduce((sum, t) => sum + t.amount, 0);

        return state.currentCashSession.openingCash + cashSales + creditPayments - cashExpenses;
      },

      // Supplier actions
      addSupplier: (supplier) => {
        const newSupplier: Supplier = {
          ...supplier,
          id: generateId(),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ suppliers: [...state.suppliers, newSupplier] }));
      },

      updateSupplier: (id, updates) => {
        set((state) => ({
          suppliers: state.suppliers.map((s) =>
            s.id === id ? { ...s, ...updates } : s
          ),
        }));
      },

      deleteSupplier: (id) => {
        set((state) => ({ suppliers: state.suppliers.filter((s) => s.id !== id) }));
      },

      // Stock Movements
      getStockMovementsByProduct: (productId) => {
        return get().stockMovements.filter((m) => m.productId === productId);
      },

      // Analytics
      getDailySummary: (date) => {
        const sales = get().sales.filter((s) => s.createdAt.startsWith(date));
        const expenses = get().expenses.filter((e) => e.createdAt.startsWith(date));
        const products = get().products;

        const totalSales = sales.reduce((sum, s) => sum + s.total, 0);
        const cashSales = sales.filter((s) => s.paymentMethod === 'cash').reduce((sum, s) => sum + s.total, 0);
        const transferSales = sales.filter((s) => s.paymentMethod === 'transfer').reduce((sum, s) => sum + s.total, 0);
        const posSales = sales.filter((s) => s.paymentMethod === 'pos').reduce((sum, s) => sum + s.total, 0);
        const creditSales = sales.filter((s) => s.paymentMethod === 'credit').reduce((sum, s) => sum + s.total, 0);
        const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

        const profit = sales.reduce((sum, s) => {
          return sum + s.items.reduce((itemSum, item) => {
            return itemSum + (item.product.sellingPrice - item.product.costPrice) * item.quantity;
          }, 0);
        }, 0);

        const summary: DailySummary = {
          date,
          totalSales,
          totalTransactions: sales.length,
          cashSales,
          transferSales,
          posSales,
          creditSales,
          totalExpenses,
          profit: profit - totalExpenses,
          netCashFlow: cashSales - expenses.filter(e => e.paymentMethod === 'cash').reduce((sum, e) => sum + e.amount, 0),
        };

        return summary;
      },

      getLowStockProducts: () => {
        return get().products.filter((p) => p.quantity <= p.lowStockThreshold);
      },

      getTopSellingProducts: (days) => {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        const startDateStr = startDate.toISOString().split('T')[0];

        const sales = get().sales.filter((s) => s.createdAt >= startDateStr);
        const productSales: Record<string, number> = {};

        sales.forEach((sale) => {
          sale.items.forEach((item) => {
            productSales[item.product.id] = (productSales[item.product.id] || 0) + item.quantity;
          });
        });

        const products = get().products;
        return Object.entries(productSales)
          .map(([productId, totalSold]) => ({
            product: products.find((p) => p.id === productId)!,
            totalSold,
          }))
          .filter((item) => item.product)
          .sort((a, b) => b.totalSold - a.totalSold)
          .slice(0, 10);
      },

      getTopCustomers: () => {
        const sales = get().sales;
        const customers = get().customers;
        const customerPurchases: Record<string, number> = {};

        sales.forEach((sale) => {
          if (sale.customerId) {
            customerPurchases[sale.customerId] = (customerPurchases[sale.customerId] || 0) + sale.total;
          }
        });

        return Object.entries(customerPurchases)
          .map(([customerId, totalPurchases]) => ({
            customer: customers.find((c) => c.id === customerId)!,
            totalPurchases,
          }))
          .filter((item) => item.customer)
          .sort((a, b) => b.totalPurchases - a.totalPurchases)
          .slice(0, 10);
      },
      // Demo data loader
      loadDemoData: () => {
        set({
          products: DEMO_PRODUCTS,
          customers: DEMO_CUSTOMERS,
          sales: DEMO_SALES,
          expenses: DEMO_EXPENSES,
          demoLoaded: true,
        });
      },
    }),
    {
      name: 'retail-store',
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({
        products: state.products,
        categories: state.categories,
        sales: state.sales,
        customers: state.customers,
        expenses: state.expenses,
        cashSessions: state.cashSessions,
        currentCashSession: state.currentCashSession,
        suppliers: state.suppliers,
        stockMovements: state.stockMovements,
        pendingSyncCount: state.pendingSyncCount,
        lastSyncTime: state.lastSyncTime,
        demoLoaded: state.demoLoaded,
        whatsAppAlertsEnabled: state.whatsAppAlertsEnabled,
        alertPhoneNumber: state.alertPhoneNumber,
        lastAlertSentAt: state.lastAlertSentAt,
        defaultLowStockThreshold: state.defaultLowStockThreshold,
      }),
      onRehydrateStorage: () => (state) => {
        if (state && !state.demoLoaded) {
          state.loadDemoData();
        }
      },
    }
  )
);

// Naira formatter
export const formatNaira = (amount: number): string => {
  return '₦' + amount.toLocaleString('en-NG');
};

// Generate receipt text for WhatsApp sharing
export const generateReceiptText = (sale: Sale, shopName: string, shopPhone?: string): string => {
  const lines = [
    `*${shopName}*`,
    shopPhone ? `Tel: ${shopPhone}` : '',
    '',
    `Receipt #${sale.id.slice(-6).toUpperCase()}`,
    `Date: ${new Date(sale.createdAt).toLocaleString('en-NG')}`,
    '',
    '━━━━━━━━━━━━━━━━',
    '',
    ...sale.items.map((item) =>
      `${item.product.name}\n${item.quantity} x ${formatNaira(item.product.sellingPrice)} = ${formatNaira(item.product.sellingPrice * item.quantity)}`
    ),
    '',
    '━━━━━━━━━━━━━━━━',
    `Subtotal: ${formatNaira(sale.subtotal)}`,
    sale.discount > 0 ? `Discount: -${formatNaira(sale.discount)}` : '',
    `*TOTAL: ${formatNaira(sale.total)}*`,
    '',
    `Payment: ${sale.paymentMethod.charAt(0).toUpperCase() + sale.paymentMethod.slice(1)}`,
    sale.cashReceived ? `Cash Received: ${formatNaira(sale.cashReceived)}` : '',
    sale.changeGiven ? `Change: ${formatNaira(sale.changeGiven)}` : '',
    '',
    'Thank you for your patronage! 🙏',
    '',
    '━━━━━━━━━━━━━━━━',
    '_Powered by Oja POS_',
    'Download Oja: https://ojapos.app',
  ].filter(Boolean);

  return lines.join('\n');
};
