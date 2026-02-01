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
  createdAt: string;
  synced: boolean;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  creditLimit: number;
  currentCredit: number;
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
  profit: number;
}

interface RetailState {
  // Products
  products: Product[];
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  getProductByBarcode: (barcode: string) => Product | undefined;
  adjustStock: (id: string, adjustment: number, reason?: string) => void;

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
  completeSale: (paymentMethod: Sale['paymentMethod'], customerId?: string) => Sale | null;
  getSalesToday: () => Sale[];
  getSalesByDateRange: (startDate: string, endDate: string) => Sale[];

  // Customers
  customers: Customer[];
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'currentCredit'>) => void;
  updateCustomerCredit: (customerId: string, amount: number) => void;

  // Analytics
  getDailySummary: (date: string) => DailySummary;
  getLowStockProducts: () => Product[];
  getTopSellingProducts: (days: number) => { product: Product; totalSold: number }[];

  // Sync status
  pendingSyncCount: number;
  lastSyncTime: string | null;
}

const generateId = () => Math.random().toString(36).substring(2, 15) + Date.now().toString(36);

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

// Sample products for demo
const sampleProducts: Product[] = [
  {
    id: '1',
    name: 'Peak Milk 400g',
    barcode: '5000112546415',
    category: 'Dairy',
    costPrice: 2800,
    sellingPrice: 3200,
    quantity: 45,
    unit: 'tin',
    lowStockThreshold: 10,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Indomie Chicken 70g',
    barcode: '8994903100011',
    category: 'Provisions',
    costPrice: 180,
    sellingPrice: 250,
    quantity: 200,
    unit: 'pack',
    lowStockThreshold: 50,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'Coca-Cola 50cl',
    barcode: '5449000000996',
    category: 'Beverages',
    costPrice: 200,
    sellingPrice: 300,
    quantity: 120,
    unit: 'bottle',
    lowStockThreshold: 24,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '4',
    name: 'Golden Penny Semovita 1kg',
    barcode: '6181108000051',
    category: 'Grains & Cereals',
    costPrice: 1200,
    sellingPrice: 1500,
    quantity: 35,
    unit: 'pack',
    lowStockThreshold: 15,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '5',
    name: 'Dettol Soap 110g',
    barcode: '6281006480100',
    category: 'Toiletries',
    costPrice: 450,
    sellingPrice: 600,
    quantity: 60,
    unit: 'bar',
    lowStockThreshold: 20,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '6',
    name: 'Milo 400g',
    barcode: '7613036256445',
    category: 'Beverages',
    costPrice: 2500,
    sellingPrice: 3000,
    quantity: 28,
    unit: 'tin',
    lowStockThreshold: 10,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '7',
    name: 'Kings Oil 1L',
    barcode: '6181108000068',
    category: 'Provisions',
    costPrice: 2000,
    sellingPrice: 2400,
    quantity: 40,
    unit: 'bottle',
    lowStockThreshold: 12,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '8',
    name: 'Dangote Sugar 1kg',
    barcode: '6181100000012',
    category: 'Provisions',
    costPrice: 1100,
    sellingPrice: 1350,
    quantity: 55,
    unit: 'pack',
    lowStockThreshold: 20,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const useRetailStore = create<RetailState>()(
  persist(
    (set, get) => ({
      // Initial state
      products: sampleProducts,
      categories: defaultCategories,
      cart: [],
      cartDiscount: 0,
      sales: [],
      customers: [],
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

      adjustStock: (id, adjustment) => {
        set((state) => ({
          products: state.products.map((p) =>
            p.id === id
              ? { ...p, quantity: Math.max(0, p.quantity + adjustment), updatedAt: new Date().toISOString() }
              : p
          ),
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
      completeSale: (paymentMethod, customerId) => {
        const state = get();
        if (state.cart.length === 0) return null;

        const subtotal = state.cart.reduce(
          (sum, item) => sum + item.product.sellingPrice * item.quantity,
          0
        );
        const total = subtotal - state.cartDiscount;

        const sale: Sale = {
          id: generateId(),
          items: [...state.cart],
          subtotal,
          discount: state.cartDiscount,
          total,
          paymentMethod,
          customerId,
          createdAt: new Date().toISOString(),
          synced: false,
        };

        // Update stock
        state.cart.forEach((item) => {
          state.adjustStock(item.product.id, -item.quantity);
        });

        // Update customer credit if applicable
        if (paymentMethod === 'credit' && customerId) {
          state.updateCustomerCredit(customerId, total);
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

      // Customer actions
      addCustomer: (customer) => {
        const newCustomer: Customer = {
          ...customer,
          id: generateId(),
          currentCredit: 0,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ customers: [...state.customers, newCustomer] }));
      },

      updateCustomerCredit: (customerId, amount) => {
        set((state) => ({
          customers: state.customers.map((c) =>
            c.id === customerId ? { ...c, currentCredit: c.currentCredit + amount } : c
          ),
        }));
      },

      // Analytics
      getDailySummary: (date) => {
        const sales = get().sales.filter((s) => s.createdAt.startsWith(date));
        const products = get().products;

        const summary: DailySummary = {
          date,
          totalSales: sales.reduce((sum, s) => sum + s.total, 0),
          totalTransactions: sales.length,
          cashSales: sales.filter((s) => s.paymentMethod === 'cash').reduce((sum, s) => sum + s.total, 0),
          transferSales: sales.filter((s) => s.paymentMethod === 'transfer').reduce((sum, s) => sum + s.total, 0),
          posSales: sales.filter((s) => s.paymentMethod === 'pos').reduce((sum, s) => sum + s.total, 0),
          creditSales: sales.filter((s) => s.paymentMethod === 'credit').reduce((sum, s) => sum + s.total, 0),
          profit: sales.reduce((sum, s) => {
            return sum + s.items.reduce((itemSum, item) => {
              const product = products.find((p) => p.id === item.product.id);
              if (!product) return itemSum;
              return itemSum + (item.product.sellingPrice - item.product.costPrice) * item.quantity;
            }, 0);
          }, 0),
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
    }),
    {
      name: 'retail-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        products: state.products,
        categories: state.categories,
        sales: state.sales,
        customers: state.customers,
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
