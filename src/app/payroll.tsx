import { View, Text, ScrollView, Pressable, TextInput, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Banknote,
  Plus,
  X,
  Users,
  Wallet,
  Calendar,
} from 'lucide-react-native';
import { usePayrollStore, type StaffSalaryRecord } from '@/store/payrollStore';
import { useStaffStore, hasPermission } from '@/store/staffStore';
import { formatNaira } from '@/store/retailStore';
import { useState, useMemo, useCallback, useEffect } from 'react';
import { useColorScheme } from 'nativewind';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

function getPaymentsThisMonth(payments: { date: string; amount: number }[]) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  return payments.filter((p) => {
    const d = new Date(p.date);
    return d.getFullYear() === year && d.getMonth() === month;
  });
}

function getPaymentStatus(record: StaffSalaryRecord): 'paid' | 'partial' | 'unpaid' {
  const paidThisMonth = getPaymentsThisMonth(record.paymentHistory).reduce((s, p) => s + p.amount, 0);
  if (paidThisMonth >= record.monthlySalary) return 'paid';
  if (paidThisMonth > 0) return 'partial';
  return 'unpaid';
}

const STATUS_STYLES = {
  paid: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: 'Paid' },
  partial: { bg: 'bg-orange-500/20', text: 'text-orange-400', label: 'Partial' },
  unpaid: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Unpaid' },
};

export default function PayrollScreen() {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const currentStaff = useStaffStore((s) => s.currentStaff);
  const canManagePayroll = !currentStaff || hasPermission(currentStaff.role, 'manage_payroll');

  useEffect(() => {
    if (!canManagePayroll) router.back();
  }, [canManagePayroll, router]);

  const salaryRecords = usePayrollStore((s) => s.salaryRecords);
  const addStaffSalary = usePayrollStore((s) => s.addStaffSalary);
  const recordPayment = usePayrollStore((s) => s.recordPayment);
  const deleteStaffSalary = usePayrollStore((s) => s.deleteStaffSalary);
  const getTotalPaidThisMonth = usePayrollStore((s) => s.getTotalPaidThisMonth);
  const getTotalMonthlySalary = usePayrollStore((s) => s.getTotalMonthlySalary);

  const staffMembers = useStaffStore((s) => s.staff);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<StaffSalaryRecord | null>(null);

  // Payment form
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer'>('cash');
  const [paymentNote, setPaymentNote] = useState('');

  // Add salary form
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [newSalary, setNewSalary] = useState('');

  const totalMonthlySalary = useMemo(() => getTotalMonthlySalary(), [salaryRecords, getTotalMonthlySalary]);
  const totalPaidThisMonth = useMemo(() => getTotalPaidThisMonth(), [salaryRecords, getTotalPaidThisMonth]);

  // Staff not yet in payroll
  const availableStaff = useMemo(() => {
    const payrollStaffIds = salaryRecords.map((r) => r.staffId);
    return staffMembers.filter((s) => !payrollStaffIds.includes(s.id));
  }, [staffMembers, salaryRecords]);

  const handleOpenPayment = useCallback((record: StaffSalaryRecord) => {
    setSelectedRecord(record);
    const paidThisMonth = getPaymentsThisMonth(record.paymentHistory).reduce((s, p) => s + p.amount, 0);
    const remaining = Math.max(0, record.monthlySalary - paidThisMonth);
    setPaymentAmount(remaining.toString());
    setPaymentMethod('cash');
    setPaymentNote('');
    setShowPaymentModal(true);
  }, []);

  const handleRecordPayment = useCallback(() => {
    if (!selectedRecord || !paymentAmount) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    recordPayment(selectedRecord.id, parseFloat(paymentAmount) || 0, paymentMethod, paymentNote);
    setShowPaymentModal(false);
    setSelectedRecord(null);
  }, [selectedRecord, paymentAmount, paymentMethod, paymentNote, recordPayment]);

  const handleAddStaffSalary = useCallback(() => {
    if (!selectedStaffId || !newSalary) return;
    const staff = staffMembers.find((s) => s.id === selectedStaffId);
    if (!staff) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addStaffSalary(staff.id, staff.name, parseFloat(newSalary) || 0);
    setSelectedStaffId('');
    setNewSalary('');
    setShowAddModal(false);
  }, [selectedStaffId, newSalary, staffMembers, addStaffSalary]);

  const gradientColors: [string, string, string] = isDark
    ? ['#292524', '#1c1917', '#0c0a09']
    : ['#f5f5f4', '#fafaf9', '#ffffff'];

  const currentMonth = new Date().toLocaleString('en-NG', { month: 'long', year: 'numeric' });

  return (
    <View className="flex-1 bg-stone-50 dark:bg-stone-950">
      <LinearGradient
        colors={gradientColors}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ paddingTop: insets.top + 8 }} className="px-5 pb-4">
          <Animated.View entering={FadeInDown.delay(100).duration(600)}>
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-3">
                <Pressable
                  onPress={() => router.back()}
                  className="w-10 h-10 rounded-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 items-center justify-center"
                >
                  <ChevronLeft size={20} color="#a8a29e" />
                </Pressable>
                <View>
                  <Text className="text-stone-600 dark:text-stone-400 text-sm font-medium tracking-wide uppercase">
                    Staff & Tools
                  </Text>
                  <Text className="text-stone-900 dark:text-white text-2xl font-bold tracking-tight">
                    Payroll
                  </Text>
                </View>
              </View>
              {availableStaff.length > 0 && (
                <Pressable
                  onPress={() => setShowAddModal(true)}
                  className="bg-orange-500 w-10 h-10 rounded-full items-center justify-center active:scale-95"
                >
                  <Plus size={20} color="white" />
                </Pressable>
              )}
            </View>
          </Animated.View>
        </View>

        {/* Summary Cards */}
        <Animated.View entering={FadeInDown.delay(200).duration(600)} className="flex-row mx-5 mt-2 gap-3">
          <View className="flex-1 bg-white/80 dark:bg-stone-900/80 rounded-xl p-4 border border-stone-200 dark:border-stone-800">
            <View className="w-10 h-10 rounded-xl bg-orange-500/20 items-center justify-center mb-3">
              <Wallet size={20} color="#f97316" />
            </View>
            <Text className="text-stone-600 dark:text-stone-400 text-sm">Total Monthly Salary</Text>
            <Text className="text-stone-900 dark:text-white text-xl font-bold mt-1">
              {formatNaira(totalMonthlySalary)}
            </Text>
          </View>
          <View className="flex-1 bg-white/80 dark:bg-stone-900/80 rounded-xl p-4 border border-stone-200 dark:border-stone-800">
            <View className="w-10 h-10 rounded-xl bg-emerald-500/20 items-center justify-center mb-3">
              <Banknote size={20} color="#10b981" />
            </View>
            <Text className="text-stone-600 dark:text-stone-400 text-sm">Paid This Month</Text>
            <Text className="text-emerald-400 text-xl font-bold mt-1">
              {formatNaira(totalPaidThisMonth)}
            </Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(250).duration(600)} className="mx-5 mt-3">
          <View className="flex-row items-center gap-2">
            <Calendar size={14} color="#78716c" />
            <Text className="text-stone-600 dark:text-stone-400 text-sm">{currentMonth}</Text>
          </View>
        </Animated.View>

        {/* Staff Salary List */}
        <View className="mx-5 mt-6">
          {salaryRecords.length === 0 ? (
            <Animated.View entering={FadeIn.duration(400)} className="items-center py-16">
              <Users size={48} color="#57534e" />
              <Text className="text-stone-600 dark:text-stone-400 text-lg mt-4 mb-2">No salaries set up yet</Text>
              <Text className="text-stone-600 dark:text-stone-400 text-center mb-6">
                Add staff salary records to track payments
              </Text>
              {availableStaff.length > 0 ? (
                <Pressable
                  onPress={() => setShowAddModal(true)}
                  className="bg-orange-500 px-6 py-3 rounded-xl active:opacity-90"
                >
                  <Text className="text-white font-semibold">Add Staff Salary</Text>
                </Pressable>
              ) : (
                <Text className="text-stone-600 dark:text-stone-400 text-sm text-center">
                  Add staff members first in Staff Management
                </Text>
              )}
            </Animated.View>
          ) : (
            <View className="gap-3">
              {salaryRecords.map((record, index) => {
                const status = getPaymentStatus(record);
                const styles = STATUS_STYLES[status];
                const paidThisMonth = getPaymentsThisMonth(record.paymentHistory).reduce((s, p) => s + p.amount, 0);
                const remaining = Math.max(0, record.monthlySalary - paidThisMonth);
                const isExpanded = expandedId === record.id;

                return (
                  <Animated.View
                    key={record.id}
                    entering={FadeIn.delay(100 + index * 50).duration(400)}
                  >
                    <Pressable
                      onPress={() => setExpandedId(isExpanded ? null : record.id)}
                      className="bg-white/80 dark:bg-stone-900/80 rounded-xl border border-stone-200 dark:border-stone-800 overflow-hidden active:opacity-95"
                    >
                      {/* Staff Row */}
                      <View className="p-4">
                        <View className="flex-row items-center justify-between">
                          <View className="flex-row items-center gap-3 flex-1">
                            <View className="w-12 h-12 rounded-full bg-stone-200 dark:bg-stone-800 items-center justify-center">
                              <Text className="text-stone-900 dark:text-white text-lg font-bold">
                                {record.staffName.charAt(0).toUpperCase()}
                              </Text>
                            </View>
                            <View className="flex-1">
                              <View className="flex-row items-center gap-2">
                                <Text className="text-stone-900 dark:text-white font-medium text-base">
                                  {record.staffName}
                                </Text>
                                <View className={`px-2 py-0.5 rounded ${styles.bg}`}>
                                  <Text className={`text-xs font-medium ${styles.text}`}>{styles.label}</Text>
                                </View>
                              </View>
                              <Text className="text-stone-600 dark:text-stone-400 text-sm">
                                Salary: {formatNaira(record.monthlySalary)}
                              </Text>
                            </View>
                          </View>
                          <View className="items-end">
                            <Text className="text-stone-600 dark:text-stone-400 text-xs">Remaining</Text>
                            <Text className={`font-bold text-lg ${remaining > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                              {formatNaira(remaining)}
                            </Text>
                            {isExpanded ? (
                              <ChevronUp size={16} color="#78716c" />
                            ) : (
                              <ChevronDown size={16} color="#78716c" />
                            )}
                          </View>
                        </View>

                        {/* Progress bar */}
                        <View className="mt-3 h-2 bg-stone-200 dark:bg-stone-800 rounded-full overflow-hidden">
                          <View
                            className={`h-full rounded-full ${
                              status === 'paid' ? 'bg-emerald-500' : status === 'partial' ? 'bg-orange-500' : 'bg-stone-400'
                            }`}
                            style={{ width: `${Math.min(100, (paidThisMonth / record.monthlySalary) * 100)}%` }}
                          />
                        </View>
                        <View className="flex-row justify-between mt-1">
                          <Text className="text-stone-600 dark:text-stone-400 text-xs">
                            Paid: {formatNaira(paidThisMonth)}
                          </Text>
                          <Text className="text-stone-600 dark:text-stone-400 text-xs">
                            {Math.round((paidThisMonth / record.monthlySalary) * 100)}%
                          </Text>
                        </View>
                      </View>

                      {/* Expanded Section */}
                      {isExpanded && (
                        <View className="px-4 pb-4 border-t border-stone-200 dark:border-stone-800">
                          {/* Payment History */}
                          <Text className="text-stone-600 dark:text-stone-400 text-sm font-semibold tracking-wide mt-3 mb-2">
                            Payment History
                          </Text>
                          {record.paymentHistory.length === 0 ? (
                            <Text className="text-stone-400 text-sm py-2">No payments recorded yet</Text>
                          ) : (
                            <View className="gap-2">
                              {record.paymentHistory.slice(0, 5).map((payment) => (
                                <View
                                  key={payment.id}
                                  className="flex-row items-center justify-between bg-stone-100/50 dark:bg-stone-800/50 rounded-lg p-3"
                                >
                                  <View>
                                    <Text className="text-stone-900 dark:text-white font-medium">
                                      {formatNaira(payment.amount)}
                                    </Text>
                                    <Text className="text-stone-600 dark:text-stone-400 text-xs">
                                      {payment.method === 'cash' ? '💵 Cash' : '📱 Transfer'}
                                      {payment.note ? ` • ${payment.note}` : ''}
                                    </Text>
                                  </View>
                                  <Text className="text-stone-400 text-xs">
                                    {new Date(payment.date).toLocaleDateString('en-NG', {
                                      day: 'numeric',
                                      month: 'short',
                                    })}
                                  </Text>
                                </View>
                              ))}
                            </View>
                          )}

                          {/* Actions */}
                          <View className="flex-row gap-3 mt-4">
                            <Pressable
                              onPress={() => handleOpenPayment(record)}
                              className="flex-1 bg-orange-500 py-3 rounded-xl active:opacity-90"
                            >
                              <Text className="text-white font-semibold text-center">Record Payment</Text>
                            </Pressable>
                            <Pressable
                              onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                deleteStaffSalary(record.id);
                              }}
                              className="bg-red-500/20 border border-red-500/30 px-4 py-3 rounded-xl active:opacity-90"
                            >
                              <Text className="text-red-400 font-medium">Remove</Text>
                            </Pressable>
                          </View>
                        </View>
                      )}
                    </Pressable>
                  </Animated.View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Record Payment Modal */}
      <Modal
        visible={showPaymentModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <KeyboardAvoidingView style={{ flex: 1 }}>
          <Pressable
            className="flex-1 bg-black/60"
            onPress={() => setShowPaymentModal(false)}
          />
          <View className="bg-white dark:bg-stone-900 rounded-t-3xl" style={{ paddingBottom: insets.bottom + 20 }}>
            <View className="p-6">
              <View className="flex-row items-center justify-between mb-6">
                <Text className="text-stone-900 dark:text-white text-xl font-bold">Record Payment</Text>
                <Pressable onPress={() => setShowPaymentModal(false)}>
                  <X size={24} color="#78716c" />
                </Pressable>
              </View>

              {selectedRecord && (
                <View className="bg-stone-100/50 dark:bg-stone-800/50 rounded-xl p-3 mb-4">
                  <Text className="text-stone-900 dark:text-white font-medium">{selectedRecord.staffName}</Text>
                  <Text className="text-stone-600 dark:text-stone-400 text-sm">
                    Monthly salary: {formatNaira(selectedRecord.monthlySalary)}
                  </Text>
                </View>
              )}

              <View className="gap-4">
                <View>
                  <Text className="text-stone-600 dark:text-stone-400 text-sm mb-2">Amount (₦) *</Text>
                  <TextInput
                    className="bg-stone-100 dark:bg-stone-800 rounded-xl px-4 py-4 text-stone-900 dark:text-white text-center text-2xl font-bold"
                    placeholder="0"
                    placeholderTextColor="#57534e"
                    keyboardType={Platform.OS === 'web' ? 'default' : 'numeric'}
                    inputMode="numeric"
                    value={paymentAmount}
                    onChangeText={(text) => setPaymentAmount(text.replace(/[^0-9]/g, ''))}
                  />
                  {paymentAmount ? (
                    <Text className="text-orange-400 text-sm text-center mt-2">
                      {formatNaira(parseFloat(paymentAmount) || 0)}
                    </Text>
                  ) : null}
                </View>

                <View>
                  <Text className="text-stone-600 dark:text-stone-400 text-sm mb-2">Payment Method</Text>
                  <View className="flex-row gap-2">
                    {(['cash', 'transfer'] as const).map((method) => (
                      <Pressable
                        key={method}
                        onPress={() => setPaymentMethod(method)}
                        className={`flex-1 py-3 rounded-lg border ${
                          paymentMethod === method
                            ? 'bg-orange-500/20 border-orange-500'
                            : 'bg-stone-200 dark:bg-stone-800 border-stone-300 dark:border-stone-700'
                        }`}
                      >
                        <Text className={`text-center font-medium capitalize ${
                          paymentMethod === method ? 'text-orange-400' : 'text-stone-600 dark:text-stone-400'
                        }`}>
                          {method}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                <View>
                  <Text className="text-stone-600 dark:text-stone-400 text-sm mb-2">Note (Optional)</Text>
                  <TextInput
                    className="bg-stone-100 dark:bg-stone-800 rounded-xl px-4 py-3 text-stone-900 dark:text-white"
                    placeholder="e.g. Half month payment"
                    placeholderTextColor="#57534e"
                    value={paymentNote}
                    onChangeText={setPaymentNote}
                  />
                </View>

                <Pressable
                  onPress={handleRecordPayment}
                  className="bg-orange-500 py-4 rounded-xl active:opacity-90 mt-2"
                >
                  <Text className="text-white font-semibold text-center text-lg">Record Payment</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Add Staff Salary Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <KeyboardAvoidingView style={{ flex: 1 }}>
          <Pressable
            className="flex-1 bg-black/60"
            onPress={() => setShowAddModal(false)}
          />
          <View className="bg-white dark:bg-stone-900 rounded-t-3xl" style={{ paddingBottom: insets.bottom + 20 }}>
            <View className="p-6">
              <View className="flex-row items-center justify-between mb-6">
                <Text className="text-stone-900 dark:text-white text-xl font-bold">Add Staff Salary</Text>
                <Pressable onPress={() => setShowAddModal(false)}>
                  <X size={24} color="#78716c" />
                </Pressable>
              </View>

              <View className="gap-4">
                <View>
                  <Text className="text-stone-600 dark:text-stone-400 text-sm mb-2">Select Staff</Text>
                  {availableStaff.length === 0 ? (
                    <View className="bg-stone-100/50 dark:bg-stone-800/50 rounded-xl p-4">
                      <Text className="text-stone-600 dark:text-stone-400 text-center">All staff already have salary records</Text>
                    </View>
                  ) : (
                    <View className="gap-2">
                      {availableStaff.map((staff) => (
                        <Pressable
                          key={staff.id}
                          onPress={() => setSelectedStaffId(staff.id)}
                          className={`flex-row items-center p-3 rounded-xl border ${
                            selectedStaffId === staff.id
                              ? 'bg-orange-500/20 border-orange-500'
                              : 'bg-stone-100 dark:bg-stone-800 border-stone-300 dark:border-stone-700'
                          }`}
                        >
                          <View className="w-8 h-8 rounded-full bg-stone-200 dark:bg-stone-700 items-center justify-center mr-3">
                            <Text className="text-stone-900 dark:text-white font-bold text-sm">
                              {staff.name.charAt(0)}
                            </Text>
                          </View>
                          <Text className={`font-medium ${
                            selectedStaffId === staff.id ? 'text-orange-400' : 'text-stone-600 dark:text-stone-400'
                          }`}>
                            {staff.name}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  )}
                </View>

                <View>
                  <Text className="text-stone-600 dark:text-stone-400 text-sm mb-2">Monthly Salary (₦) *</Text>
                  <TextInput
                    className="bg-stone-100 dark:bg-stone-800 rounded-xl px-4 py-4 text-stone-900 dark:text-white text-center text-2xl font-bold"
                    placeholder="e.g. 50000"
                    placeholderTextColor="#57534e"
                    keyboardType={Platform.OS === 'web' ? 'default' : 'numeric'}
                    inputMode="numeric"
                    value={newSalary}
                    onChangeText={(text) => setNewSalary(text.replace(/[^0-9]/g, ''))}
                  />
                  {newSalary ? (
                    <Text className="text-orange-400 text-sm text-center mt-2">
                      {formatNaira(parseFloat(newSalary) || 0)}/month
                    </Text>
                  ) : null}
                </View>

                <Pressable
                  onPress={handleAddStaffSalary}
                  disabled={!selectedStaffId || !newSalary}
                  className={`py-4 rounded-xl active:opacity-90 mt-2 ${
                    selectedStaffId && newSalary ? 'bg-orange-500' : 'bg-stone-300 dark:bg-stone-700'
                  }`}
                >
                  <Text className={`font-semibold text-center text-lg ${
                    selectedStaffId && newSalary ? 'text-white' : 'text-stone-600 dark:text-stone-400'
                  }`}>Add Salary Record</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
