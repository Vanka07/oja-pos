/**
 * Credit Intelligence — Risk scoring, overdue detection, smart reminders
 */
import type { Customer } from '@/store/retailStore';

export type CreditRisk = 'low' | 'medium' | 'high' | 'critical';

export interface CreditRiskResult {
  level: CreditRisk;
  score: number; // 0-100 (100 = worst)
  daysOverdue: number;
  label: string;
  color: string; // tailwind-compatible
  bgColor: string;
  borderColor: string;
}

export interface CreditSummary {
  totalOwed: number;
  overdueCount: number;
  overdueAmount: number;
  highRiskCount: number;
  frozenCount: number;
  avgDaysOverdue: number;
}

/**
 * Calculate days since last payment or first unpaid credit.
 * If customer has outstanding credit:
 *   - If they've made payments, days since last payment
 *   - If never paid, days since first credit transaction
 * If no outstanding credit, returns 0.
 */
function getDaysOverdue(customer: Customer): number {
  if (customer.currentCredit <= 0) return 0;
  if (customer.transactions.length === 0) return 0;

  // Find last payment
  const lastPayment = customer.transactions.find((t) => t.type === 'payment');
  if (lastPayment) {
    const daysSincePayment = Math.floor(
      (Date.now() - new Date(lastPayment.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysSincePayment;
  }

  // Never paid — days since first credit
  const creditTransactions = customer.transactions.filter((t) => t.type === 'credit');
  if (creditTransactions.length === 0) return 0;

  const oldest = creditTransactions[creditTransactions.length - 1]; // transactions are newest-first
  const daysSinceFirst = Math.floor(
    (Date.now() - new Date(oldest.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );
  return daysSinceFirst;
}

/**
 * Calculate credit risk for a customer.
 */
export function getCreditRisk(customer: Customer): CreditRiskResult {
  if (customer.currentCredit <= 0) {
    return {
      level: 'low',
      score: 0,
      daysOverdue: 0,
      label: 'Good standing',
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/20',
      borderColor: 'border-emerald-500/30',
    };
  }

  const daysOverdue = getDaysOverdue(customer);
  const creditRatio = customer.creditLimit > 0 ? customer.currentCredit / customer.creditLimit : 0;

  // Score components
  let score = 0;

  // Days overdue (0-50 points)
  if (daysOverdue >= 30) score += 50;
  else if (daysOverdue >= 14) score += 35;
  else if (daysOverdue >= 7) score += 20;
  else score += Math.min(daysOverdue * 2, 15);

  // Credit ratio (0-30 points)
  if (creditRatio >= 1) score += 30;
  else if (creditRatio >= 0.8) score += 20;
  else if (creditRatio >= 0.6) score += 10;
  else score += Math.round(creditRatio * 10);

  // Payment history (0-20 points)
  const payments = customer.transactions.filter((t) => t.type === 'payment');
  if (payments.length === 0 && customer.transactions.length > 0) {
    score += 20; // Never paid = high risk
  } else if (payments.length < customer.transactions.filter((t) => t.type === 'credit').length * 0.3) {
    score += 10; // Rarely pays
  }

  // Determine level
  let level: CreditRisk;
  let label: string;
  let color: string;
  let bgColor: string;
  let borderColor: string;

  if (score >= 60 || daysOverdue >= 30 || creditRatio >= 1) {
    level = 'critical';
    label = daysOverdue >= 30 ? `🔴 ${daysOverdue} days overdue` : 'Exceeded limit';
    color = 'text-red-400';
    bgColor = 'bg-red-500/20';
    borderColor = 'border-red-500/50';
  } else if (score >= 40 || daysOverdue >= 14) {
    level = 'high';
    label = `⚠️ ${daysOverdue} days overdue`;
    color = 'text-orange-400';
    bgColor = 'bg-orange-500/20';
    borderColor = 'border-orange-500/40';
  } else if (score >= 20 || daysOverdue >= 7) {
    level = 'medium';
    label = daysOverdue > 0 ? `${daysOverdue} days since payment` : 'Nearing limit';
    color = 'text-amber-400';
    bgColor = 'bg-amber-500/20';
    borderColor = 'border-amber-500/30';
  } else {
    level = 'low';
    label = 'Recent credit';
    color = 'text-emerald-400';
    bgColor = 'bg-emerald-500/20';
    borderColor = 'border-emerald-500/30';
  }

  return { level, score, daysOverdue, label, color, bgColor, borderColor };
}

/**
 * Get all overdue customers (7+ days with outstanding credit).
 */
export function getOverdueCustomers(customers: Customer[]): Customer[] {
  return customers.filter((c) => {
    if (c.currentCredit <= 0) return false;
    return getDaysOverdue(c) >= 7;
  });
}

/**
 * Get credit summary stats.
 */
export function getCreditSummary(customers: Customer[]): CreditSummary {
  const withDebt = customers.filter((c) => c.currentCredit > 0);
  const overdue = getOverdueCustomers(customers);
  const overdueAmount = overdue.reduce((sum, c) => sum + c.currentCredit, 0);
  const highRisk = customers.filter((c) => {
    const risk = getCreditRisk(c);
    return risk.level === 'high' || risk.level === 'critical';
  });
  const frozenCount = customers.filter((c) => c.creditFrozen).length;

  const totalDaysOverdue = withDebt.reduce((sum, c) => sum + getDaysOverdue(c), 0);
  const avgDaysOverdue = withDebt.length > 0 ? Math.round(totalDaysOverdue / withDebt.length) : 0;

  return {
    totalOwed: customers.reduce((sum, c) => sum + c.currentCredit, 0),
    overdueCount: overdue.length,
    overdueAmount,
    highRiskCount: highRisk.length,
    frozenCount,
    avgDaysOverdue,
  };
}

/**
 * Check if customer should be auto-frozen.
 */
export function shouldFreezeCredit(customer: Customer): { frozen: boolean; reason: string } {
  const daysOverdue = getDaysOverdue(customer);

  if (customer.creditLimit > 0 && customer.currentCredit >= customer.creditLimit) {
    return { frozen: true, reason: 'Credit limit exceeded' };
  }
  if (daysOverdue >= 30) {
    return { frozen: true, reason: `${daysOverdue} days without payment` };
  }
  return { frozen: false, reason: '' };
}

/**
 * Generate WhatsApp reminder with Nigerian tone.
 * Tone escalates based on how overdue.
 */
export function generateReminderMessage(
  customer: Customer,
  shopName: string
): string {
  const amount = `₦${customer.currentCredit.toLocaleString()}`;
  const daysOverdue = getDaysOverdue(customer);
  const name = customer.name.split(' ')[0]; // First name

  if (daysOverdue < 7) {
    // Very early — just a gentle nudge
    return `Good afternoon ${name} 🙏\nJust a gentle reminder that you have a balance of ${amount} at ${shopName}. No rush — just whenever it's convenient for you. Thank you and God bless!`;
  }

  if (daysOverdue < 14) {
    // 7-13 days — polite first real reminder
    return `Hello ${name} 🙏\nHope you're doing well! This is a friendly reminder about your outstanding balance of ${amount} at ${shopName}. It's been about ${daysOverdue} days now. We'd really appreciate it if you could settle when convenient. Thank you for your patronage!`;
  }

  if (daysOverdue < 30) {
    // 14-29 days — follow-up, still warm
    return `Hello ${name}, hope all is well 🙏\nThis is a follow-up regarding your ${amount} balance at ${shopName}. It's been ${daysOverdue} days now. Kindly let us know when you plan to settle so we can continue serving you well. We value your business! Thank you.`;
  }

  // 30+ days — firm but respectful
  return `Dear ${name},\nYour outstanding balance of ${amount} at ${shopName} has been pending for ${daysOverdue} days. We kindly request that you make arrangements to settle this balance as soon as possible so we can continue doing business together. Thank you for your understanding 🙏`;
}

/**
 * Check if reminder was sent recently (within 3 days).
 */
export function wasRemindedRecently(customer: Customer): boolean {
  if (!customer.lastReminderSent) return false;
  const daysSince = Math.floor(
    (Date.now() - new Date(customer.lastReminderSent).getTime()) / (1000 * 60 * 60 * 24)
  );
  return daysSince < 3;
}

/**
 * Get days since last reminder.
 */
export function daysSinceReminder(customer: Customer): number | null {
  if (!customer.lastReminderSent) return null;
  return Math.floor(
    (Date.now() - new Date(customer.lastReminderSent).getTime()) / (1000 * 60 * 60 * 24)
  );
}
