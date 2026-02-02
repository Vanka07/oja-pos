import { useSubscriptionStore, type PlanType, PLAN_LEVEL } from '@/store/subscriptionStore';

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

  // GROWTH (₦2,500/mo)
  unlimited_products: 'growth',
  cloud_sync: 'growth',
  advanced_reports: 'growth', // week/month/year views

  // BUSINESS (₦5,000/mo)
  multi_staff: 'business', // multiple staff accounts
  payroll: 'business',
  low_stock_alerts: 'business',
  receipt_printer: 'business',
};

export const FREE_PRODUCT_LIMIT = 50;

/**
 * Check if the user's current plan can access a feature.
 * Plan hierarchy: starter < growth < business
 */
// TODO: Re-enable gating after testing — currently all features are unlocked
export function canAccess(_feature: string): boolean {
  return true;
  // Original gating logic (preserved for re-enabling):
  // const requiredPlan = FEATURE_ACCESS[feature];
  // if (!requiredPlan) return true;
  // if (requiredPlan === 'starter') return true;
  // const { plan } = useSubscriptionStore.getState();
  // const isPremium = useSubscriptionStore.getState().isPremium();
  // if (!isPremium && plan !== 'starter') return false; // expired paid plan
  // return PLAN_LEVEL[plan] >= PLAN_LEVEL[requiredPlan];
}

/**
 * Get the minimum plan required for a feature.
 */
export function getRequiredPlan(feature: string): PlanType {
  return FEATURE_ACCESS[feature] || 'starter';
}

export const FEATURE_DESCRIPTIONS: Record<string, { name: string; description: string }> = {
  unlimited_products: {
    name: 'Unlimited Products',
    description: 'Add unlimited products to your inventory. Free plan allows up to 50.',
  },
  cloud_sync: {
    name: 'Cloud Sync & Backup',
    description: 'Back up your data and sync across multiple devices automatically.',
  },
  advanced_reports: {
    name: 'Advanced Reports',
    description: 'View weekly, monthly, and yearly sales reports with charts and trends.',
  },
  multi_staff: {
    name: 'Multiple Staff Accounts',
    description: 'Add unlimited staff members with role-based access and activity tracking.',
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
};

export { FEATURE_ACCESS };
