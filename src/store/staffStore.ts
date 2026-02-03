import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from '@/lib/storage';

// Types
export type StaffRole = 'owner' | 'manager' | 'cashier' | 'employee';

export interface StaffMember {
  id: string;
  name: string;
  phone: string;
  pin: string; // 4-digit PIN (empty string for employees — they don't log in)
  role: StaffRole;
  active: boolean;
  createdAt: string;
}

export interface StaffActivity {
  id: string;
  staffId: string;
  staffName: string;
  action: 'sale' | 'restock' | 'price_change' | 'expense' | 'credit_payment' | 'login' | 'product_add' | 'product_delete';
  description: string;
  amount?: number;
  saleId?: string;
  createdAt: string;
}

// Permissions map — employee has NO app permissions (payroll-only)
const PERMISSIONS: Record<string, StaffRole[]> = {
  sell: ['owner', 'manager', 'cashier'],
  view_inventory: ['owner', 'manager', 'cashier'],
  edit_product: ['owner', 'manager'],
  delete_product: ['owner'],
  add_product: ['owner', 'manager'],
  restock: ['owner', 'manager'],
  view_reports: ['owner', 'manager'],
  add_expense: ['owner', 'manager'],
  manage_customers: ['owner', 'manager'],
  manage_staff: ['owner'],
  view_activity: ['owner', 'manager'],
  manage_payroll: ['owner'],
  manage_shop: ['owner', 'manager'],
  export_data: ['owner'],
  manage_cloud: ['owner'],
  manage_alerts: ['owner', 'manager'],
  cash_register: ['owner', 'manager'],
  manage_categories: ['owner', 'manager'],
  manage_catalog: ['owner', 'manager'],
  manage_subscription: ['owner'],
};

// Roles that can log into the app (have PINs)
export const APP_ROLES: StaffRole[] = ['owner', 'manager', 'cashier'];
export const isAppRole = (role: StaffRole) => APP_ROLES.includes(role);

export function hasPermission(role: StaffRole, action: string): boolean {
  const allowed = PERMISSIONS[action];
  if (!allowed) return false;
  return allowed.includes(role);
}

const generateId = () => Math.random().toString(36).substring(2, 15) + Date.now().toString(36);

interface StaffState {
  staff: StaffMember[];
  currentStaff: StaffMember | null;
  activities: StaffActivity[];

  addStaff: (staff: Omit<StaffMember, 'id' | 'createdAt'>) => void;
  updateStaff: (id: string, updates: Partial<StaffMember>) => void;
  removeStaff: (id: string) => void;
  switchStaff: (pin: string) => boolean;
  logActivity: (action: StaffActivity['action'], description: string, amount?: number, saleId?: string) => void;
  getActivitiesToday: () => StaffActivity[];
  getActivitiesByStaff: (staffId: string) => StaffActivity[];
  logout: () => void;
}

export const useStaffStore = create<StaffState>()(
  persist(
    (set, get) => ({
      staff: [],
      currentStaff: null,
      activities: [],

      addStaff: (staffData) => {
        const state = get();
        // Auto-create owner: if no owner exists, force role to 'owner'
        const hasOwner = state.staff.some((s) => s.role === 'owner');
        const role = !hasOwner ? 'owner' : staffData.role;

        const newStaff: StaffMember = {
          ...staffData,
          role,
          id: generateId(),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ staff: [...state.staff, newStaff] }));
      },

      updateStaff: (id, updates) => {
        set((state) => ({
          staff: state.staff.map((s) =>
            s.id === id ? { ...s, ...updates } : s
          ),
          // Also update currentStaff if it's the same person
          currentStaff: state.currentStaff?.id === id
            ? { ...state.currentStaff, ...updates }
            : state.currentStaff,
        }));
      },

      removeStaff: (id) => {
        set((state) => ({
          staff: state.staff.filter((s) => s.id !== id),
          currentStaff: state.currentStaff?.id === id ? null : state.currentStaff,
        }));
      },

      switchStaff: (pin) => {
        const state = get();
        // Only match app roles (not employees — they can't log in)
        const member = state.staff.find((s) => s.pin === pin && s.active && isAppRole(s.role));
        if (!member) return false;

        set({ currentStaff: member });

        // Log login activity
        const activity: StaffActivity = {
          id: generateId(),
          staffId: member.id,
          staffName: member.name,
          action: 'login',
          description: `${member.name} logged in`,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ activities: [activity, ...state.activities] }));

        return true;
      },

      logActivity: (action, description, amount, saleId) => {
        const state = get();
        const current = state.currentStaff;

        const activity: StaffActivity = {
          id: generateId(),
          staffId: current?.id || 'owner',
          staffName: current?.name || 'Owner',
          action,
          description,
          amount,
          saleId,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ activities: [activity, ...state.activities] }));
      },

      getActivitiesToday: () => {
        const d = new Date();
        const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        return get().activities.filter((a) => a.createdAt.startsWith(today));
      },

      getActivitiesByStaff: (staffId) => {
        return get().activities.filter((a) => a.staffId === staffId);
      },

      logout: () => {
        set({ currentStaff: null });
      },
    }),
    {
      name: 'oja-staff-storage',
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);
