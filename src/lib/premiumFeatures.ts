import { useSubscriptionStore, type PlanType } from '@/store/subscriptionStore';

const FEATURE_ACCESS: Record<string, PlanType> = {
  // FREE (Starter)
  sell: 'starter',
  view_inventory: 'starter',
  add_product: 'starter', // limit to 50 products on free
  basic_reports: 'starter', // only today view
  credit_book: 'starter',
  whatsapp_receipts: 'starter',
  single_staff: 'starter', // owner only, no additional staff
  pin_lock: 'starter',
  export_data: 'starter',

  // PREMIUM (Business)
  multi_staff: 'business', // multiple staff accounts
  advanced_reports: 'business', // week/month/year views
  cloud_sync: 'business',
  payroll: 'business',
  low_stock_alerts: 'business',
  receipt_printer: 'business',
  unlimited_products: 'business',
};

export const FREE_PRODUCT_LIMIT = 50;

export function canAccess(feature: string): boolean {
  const requiredPlan = FEATURE_ACCESS[feature];
  if (!requiredPlan) return true; // Unknown features default to accessible
  if (requiredPlan === 'starter') return true; // Free features always accessible
  // Premium feature — check subscription
  return useSubscriptionStore.getState().isPremium();
}

export const FEATURE_DESCRIPTIONS: Record<string, { name: string; description: string }> = {
  multi_staff: {
    name: 'Multiple Staff Accounts',
    description: 'Add unlimited staff members with role-based access and activity tracking.',
  },
  advanced_reports: {
    name: 'Advanced Reports',
    description: 'View weekly, monthly, and yearly sales reports with charts and trends.',
  },
  cloud_sync: {
    name: 'Cloud Sync',
    description: 'Back up your data and sync across multiple devices automatically.',
  },
  payroll: {
    name: 'Payroll Management',
    description: 'Track staff salaries, advances, and payment history.',
  },
  low_stock_alerts: {
    name: 'Low Stock Alerts',
    description: 'Get WhatsApp notifications when products are running low.',
  },
  receipt_printer: {
    name: 'Receipt Printer',
    description: 'Print professional receipts via Bluetooth thermal printer.',
  },
  unlimited_products: {
    name: 'Unlimited Products',
    description: 'Add unlimited products to your inventory. Free plan allows up to 50.',
  },
};

export { FEATURE_ACCESS };
