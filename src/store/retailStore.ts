import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

  // Categories
  categories: Category[];
  addCategory: (category: Omit<Category, 'id'>) => void;

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
  completeSale: (paymentMethod: Sale['paymentMethod'], customerId?: string, cashReceived?: number) => Sale | null;
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

      // Cart actions
      addToCart: (product, quantity = 1) => {
        set((state) => {
          const existingItem = state.cart.find((item) => item.product.id === product.id);
          if (existingItem) {
            return {
              cart: state.cart.map((item) =>
                item.product.id === product.id
                  ? { ...item, quantity: item.quantity + quantity }
                  : item
              ),
            };
          }
          return { cart: [...state.cart, { product, quantity }] };
        });
      },

      updateCartQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeFromCart(productId);
          return;
        }
        set((state) => ({
          cart: state.cart.map((item) =>
            item.product.id === productId ? { ...item, quantity } : item
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
      completeSale: (paymentMethod, customerId, cashReceived) => {
        const state = get();
        if (state.cart.length === 0) return null;

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
    }),
    {
      name: 'retail-store',
      storage: createJSONStorage(() => AsyncStorage),
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
      }),
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
  ].filter(Boolean);

  return lines.join('\n');
};
