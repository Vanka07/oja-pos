import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from '@/lib/storage';

export interface PaymentRecord {
  id: string;
  amount: number;
  date: string;
  method: 'cash' | 'transfer';
  note: string;
}

export interface StaffSalaryRecord {
  id: string;
  staffId: string;
  staffName: string;
  monthlySalary: number;
  paymentHistory: PaymentRecord[];
}

const generateId = () => Math.random().toString(36).substring(2, 15) + Date.now().toString(36);

interface PayrollState {
  salaryRecords: StaffSalaryRecord[];

  addStaffSalary: (staffId: string, staffName: string, monthlySalary: number) => void;
  updateSalary: (id: string, monthlySalary: number) => void;
  recordPayment: (id: string, amount: number, method: 'cash' | 'transfer', note: string) => void;
  getPaymentHistory: (id: string) => PaymentRecord[];
  getTotalPaidThisMonth: (id?: string) => number;
  getTotalOwedThisMonth: () => number;
  getTotalMonthlySalary: () => number;
  deleteStaffSalary: (id: string) => void;
}

function getPaymentsThisMonth(payments: PaymentRecord[]): PaymentRecord[] {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  return payments.filter((p) => {
    const d = new Date(p.date);
    return d.getFullYear() === year && d.getMonth() === month;
  });
}

export const usePayrollStore = create<PayrollState>()(
  persist(
    (set, get) => ({
      salaryRecords: [],

      addStaffSalary: (staffId, staffName, monthlySalary) => {
        const record: StaffSalaryRecord = {
          id: generateId(),
          staffId,
          staffName,
          monthlySalary,
          paymentHistory: [],
        };
        set((state) => ({ salaryRecords: [...state.salaryRecords, record] }));
      },

      updateSalary: (id, monthlySalary) => {
        set((state) => ({
          salaryRecords: state.salaryRecords.map((r) =>
            r.id === id ? { ...r, monthlySalary } : r
          ),
        }));
      },

      recordPayment: (id, amount, method, note) => {
        const payment: PaymentRecord = {
          id: generateId(),
          amount,
          date: new Date().toISOString(),
          method,
          note,
        };
        set((state) => ({
          salaryRecords: state.salaryRecords.map((r) =>
            r.id === id
              ? { ...r, paymentHistory: [payment, ...r.paymentHistory] }
              : r
          ),
        }));
      },

      getPaymentHistory: (id) => {
        const record = get().salaryRecords.find((r) => r.id === id);
        return record?.paymentHistory ?? [];
      },

      getTotalPaidThisMonth: (id) => {
        const records = id
          ? get().salaryRecords.filter((r) => r.id === id)
          : get().salaryRecords;
        return records.reduce((sum, r) => {
          const monthPayments = getPaymentsThisMonth(r.paymentHistory);
          return sum + monthPayments.reduce((s, p) => s + p.amount, 0);
        }, 0);
      },

      getTotalOwedThisMonth: () => {
        const state = get();
        const totalSalary = state.salaryRecords.reduce((sum, r) => sum + r.monthlySalary, 0);
        const totalPaid = state.getTotalPaidThisMonth();
        return Math.max(0, totalSalary - totalPaid);
      },

      getTotalMonthlySalary: () => {
        return get().salaryRecords.reduce((sum, r) => sum + r.monthlySalary, 0);
      },

      deleteStaffSalary: (id) => {
        set((state) => ({
          salaryRecords: state.salaryRecords.filter((r) => r.id !== id),
        }));
      },
    }),
    {
      name: 'oja-payroll-storage',
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);
