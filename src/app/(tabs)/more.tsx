import { View, Text, ScrollView, Pressable, TextInput, Modal, KeyboardAvoidingView, Platform, Linking, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Settings,
  Receipt,
  Wallet,
  Plus,
  X,
  ChevronRight,
  Store,
  Info,
  Download,
  Calculator,
  Banknote,
  Zap,
  Fuel,
  Users as UsersIcon,
  Truck,
  Wrench,
  Smartphone,
  FileText,
  HelpCircle,
  Shield,
  UserCircle,
  Clock
} from 'lucide-react-native';
import { useRetailStore, formatNaira, expenseCategories, type Expense } from '@/store/retailStore';
import { useOnboardingStore } from '@/store/onboardingStore';
import { useStaffStore, hasPermission } from '@/store/staffStore';
import { APP_VERSION } from '@/store/updateStore';
import { useRouter } from 'expo-router';
import { useState, useMemo, useCallback } from 'react';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const expenseIcons: Record<string, React.ReactNode> = {
  'Rent': <Store size={18} color="#f97316" />,
  'Electricity (NEPA)': <Zap size={18} color="#eab308" />,
  'Generator Fuel': <Fuel size={18} color="#ef4444" />,
  'Staff Salary': <UsersIcon size={18} color="#3b82f6" />,
  'Transport': <Truck size={18} color="#8b5cf6" />,
  'Shop Supplies': <Receipt size={18} color="#10b981" />,
  'Repairs': <Wrench size={18} color="#f59e0b" />,
  'Phone/Data': <Smartphone size={18} color="#06b6d4" />,
  'Taxes/Levy': <FileText size={18} color="#64748b" />,
  'Other': <HelpCircle size={18} color="#78716c" />,
};

export default function MoreScreen() {
  const insets = useSafeAreaInsets();
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showExpensesListModal, setShowExpensesListModal] = useState(false);
  const [showCashModal, setShowCashModal] = useState(false);
  const [showCalculatorModal, setShowCalculatorModal] = useState(false);
  const [cashAmount, setCashAmount] = useState('');
  const [closingNote, setClosingNote] = useState('');

  // Calculator state
  const [costPrice, setCostPrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [targetMargin, setTargetMargin] = useState('20');

  // Expense form
  const [expenseForm, setExpenseForm] = useState({
    category: 'Other',
    description: '',
    amount: '',
    paymentMethod: 'cash' as 'cash' | 'transfer' | 'pos',
  });

  const router = useRouter();
  const shopInfo = useOnboardingStore((s) => s.shopInfo);
  const staffMembers = useStaffStore((s) => s.staff);
  const currentStaff = useStaffStore((s) => s.currentStaff);
  const staffActivities = useStaffStore((s) => s.activities);
  const canManageStaff = !currentStaff || hasPermission(currentStaff.role, 'manage_staff');
  const canAddExpense = !currentStaff || hasPermission(currentStaff.role, 'add_expense');
  const canViewActivity = !currentStaff || hasPermission(currentStaff.role, 'view_activity');
  const hasStaff = staffMembers.length > 0;
  const recentActivities = staffActivities.slice(0, 5);
  const expenses = useRetailStore((s) => s.expenses);
  const addExpense = useRetailStore((s) => s.addExpense);
  const getExpensesToday = useRetailStore((s) => s.getExpensesToday);
  const currentCashSession = useRetailStore((s) => s.currentCashSession);
  const openCashSession = useRetailStore((s) => s.openCashSession);
  const closeCashSession = useRetailStore((s) => s.closeCashSession);
  const getExpectedCash = useRetailStore((s) => s.getExpectedCash);

  const todayExpenses = useMemo(() => getExpensesToday(), [getExpensesToday, expenses]);
  const todayExpenseTotal = useMemo(() =>
    todayExpenses.reduce((sum, e) => sum + e.amount, 0),
    [todayExpenses]
  );
  const expectedCash = useMemo(() => getExpectedCash(), [getExpectedCash, currentCashSession]);

  // Calculator logic
  const calculatedMargin = useMemo(() => {
    const cost = parseFloat(costPrice) || 0;
    const sell = parseFloat(sellingPrice) || 0;
    if (cost === 0 || sell === 0) return null;
    const profit = sell - cost;
    const margin = (profit / sell) * 100;
    return { profit, margin };
  }, [costPrice, sellingPrice]);

  const suggestedPrice = useMemo(() => {
    const cost = parseFloat(costPrice) || 0;
    const margin = parseFloat(targetMargin) || 20;
    if (cost === 0) return null;
    return cost / (1 - margin / 100);
  }, [costPrice, targetMargin]);

  const handleAddExpense = useCallback(() => {
    if (!expenseForm.amount) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addExpense({
      category: expenseForm.category,
      description: expenseForm.description.trim() || expenseForm.category,
      amount: parseFloat(expenseForm.amount) || 0,
      paymentMethod: expenseForm.paymentMethod,
    });

    setExpenseForm({
      category: 'Other',
      description: '',
      amount: '',
      paymentMethod: 'cash',
    });
    setShowExpenseModal(false);
  }, [expenseForm, addExpense]);

  const handleCashSession = useCallback(() => {
    const amount = parseFloat(cashAmount) || 0;

    if (currentCashSession) {
      // Closing
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      closeCashSession(amount, closingNote || undefined);
    } else {
      // Opening
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      openCashSession(amount);
    }

    setCashAmount('');
    setClosingNote('');
    setShowCashModal(false);
  }, [cashAmount, closingNote, currentCashSession, openCashSession, closeCashSession]);

  return (
    <View className="flex-1 bg-stone-950">
      <LinearGradient
        colors={['#292524', '#1c1917', '#0c0a09']}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ paddingTop: insets.top + 8 }} className="px-5">
          <Animated.View entering={FadeInDown.delay(100).duration(600)}>
            <Text className="text-stone-500 text-sm font-medium tracking-wide uppercase mb-1">
              Settings & Tools
            </Text>
            <Text className="text-white text-3xl font-bold tracking-tight">
              More
            </Text>
          </Animated.View>
        </View>

        {/* Cash Management Card */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(600)}
          className="mx-5 mt-6"
        >
          <Pressable
            onPress={() => setShowCashModal(true)}
            className="active:scale-[0.99]"
          >
            <LinearGradient
              colors={currentCashSession ? ['#059669', '#047857'] : ['#3b82f6', '#2563eb']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ borderRadius: 20, padding: 20 }}
            >
              <View className="flex-row items-center gap-3 mb-3">
                <Wallet size={24} color="white" />
                <Text className="text-white/90 font-medium">Cash Register</Text>
              </View>
              {currentCashSession ? (
                <>
                  <Text className="text-white/70 text-sm mb-1">Session Open</Text>
                  <Text className="text-white text-2xl font-bold mb-2">
                    Expected: {formatNaira(expectedCash)}
                  </Text>
                  <Text className="text-white/70 text-sm">
                    Opened at {new Date(currentCashSession.openedAt).toLocaleTimeString('en-NG', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })} with {formatNaira(currentCashSession.openingCash)}
                  </Text>
                </>
              ) : (
                <>
                  <Text className="text-white text-xl font-bold mb-1">Start Day</Text>
                  <Text className="text-white/70 text-sm">Tap to count opening cash</Text>
                </>
              )}
            </LinearGradient>
          </Pressable>
        </Animated.View>

        {/* Quick Actions */}
        <Animated.View
          entering={FadeInDown.delay(300).duration(600)}
          className="flex-row mx-5 mt-4 gap-3"
        >
          {canAddExpense && (
            <Pressable
              onPress={() => setShowExpenseModal(true)}
              className="flex-1 bg-stone-900/80 rounded-xl p-4 border border-stone-800 active:scale-98"
            >
              <View className="w-10 h-10 rounded-xl bg-red-500/20 items-center justify-center mb-3">
                <Receipt size={20} color="#ef4444" />
              </View>
              <Text className="text-white font-medium">Add Expense</Text>
              <Text className="text-stone-500 text-xs mt-1">Record costs</Text>
            </Pressable>
          )}

          <Pressable
            onPress={() => setShowCalculatorModal(true)}
            className="flex-1 bg-stone-900/80 rounded-xl p-4 border border-stone-800 active:scale-98"
          >
            <View className="w-10 h-10 rounded-xl bg-emerald-500/20 items-center justify-center mb-3">
              <Calculator size={20} color="#10b981" />
            </View>
            <Text className="text-white font-medium">Price Calculator</Text>
            <Text className="text-stone-500 text-xs mt-1">Set margins</Text>
          </Pressable>
        </Animated.View>

        {/* Today's Expenses */}
        <Animated.View
          entering={FadeInDown.delay(400).duration(600)}
          className="mx-5 mt-6"
        >
          <Pressable
            onPress={() => setShowExpensesListModal(true)}
            className="bg-stone-900/80 rounded-xl p-4 border border-stone-800 active:opacity-90"
          >
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-stone-500 text-xs uppercase tracking-wide">Today's Expenses</Text>
                <Text className="text-red-400 text-2xl font-bold mt-1">{formatNaira(todayExpenseTotal)}</Text>
                <Text className="text-stone-500 text-sm">{todayExpenses.length} expense{todayExpenses.length !== 1 ? 's' : ''}</Text>
              </View>
              <ChevronRight size={20} color="#57534e" />
            </View>
          </Pressable>
        </Animated.View>

        {/* Staff Section */}
        <Animated.View
          entering={FadeInDown.delay(500).duration(600)}
          className="mx-5 mt-6"
        >
          <Text className="text-stone-500 text-xs uppercase tracking-wide mb-3">Staff</Text>
          <View className="bg-stone-900/60 rounded-xl border border-stone-800 overflow-hidden">
            {hasStaff && (
              <Pressable
                onPress={() => router.push('/staff-switch')}
                className="flex-row items-center p-4 border-b border-stone-800 active:bg-stone-800/50"
              >
                <View className="w-10 h-10 rounded-xl bg-orange-500/20 items-center justify-center mr-3">
                  <UserCircle size={20} color="#f97316" />
                </View>
                <View className="flex-1">
                  <Text className="text-white font-medium">Switch Staff</Text>
                  <Text className="text-stone-500 text-sm">
                    {currentStaff ? `Current: ${currentStaff.name}` : 'No one logged in'}
                  </Text>
                </View>
                <ChevronRight size={20} color="#57534e" />
              </Pressable>
            )}

            {canManageStaff && (
              <Pressable
                onPress={() => router.push('/staff')}
                className="flex-row items-center p-4 active:bg-stone-800/50"
              >
                <View className="w-10 h-10 rounded-xl bg-amber-500/20 items-center justify-center mr-3">
                  <Shield size={20} color="#f59e0b" />
                </View>
                <View className="flex-1">
                  <Text className="text-white font-medium">Staff Management</Text>
                  <Text className="text-stone-500 text-sm">{staffMembers.length} staff member{staffMembers.length !== 1 ? 's' : ''}</Text>
                </View>
                <ChevronRight size={20} color="#57534e" />
              </Pressable>
            )}
          </View>
        </Animated.View>

        {/* Activity Log Preview */}
        {canViewActivity && recentActivities.length > 0 && (
          <Animated.View
            entering={FadeInDown.delay(550).duration(600)}
            className="mx-5 mt-4"
          >
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-stone-500 text-xs uppercase tracking-wide">Recent Activity</Text>
              {canManageStaff && (
                <Pressable onPress={() => router.push('/staff')} className="active:opacity-70">
                  <Text className="text-orange-500 text-xs font-medium">View All</Text>
                </Pressable>
              )}
            </View>
            <View className="bg-stone-900/60 rounded-xl border border-stone-800 overflow-hidden">
              {recentActivities.map((activity, index) => (
                <View
                  key={activity.id}
                  className={`flex-row items-center p-3 ${index < recentActivities.length - 1 ? 'border-b border-stone-800' : ''}`}
                >
                  <View className="w-7 h-7 rounded-full bg-stone-800 items-center justify-center mr-3">
                    <Text className="text-white text-xs font-bold">{activity.staffName.charAt(0)}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-stone-300 text-sm" numberOfLines={1}>{activity.description}</Text>
                    <Text className="text-stone-600 text-xs">
                      {activity.staffName} • {new Date(activity.createdAt).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                  {activity.amount !== undefined && (
                    <Text className="text-stone-400 text-sm font-medium">{formatNaira(activity.amount)}</Text>
                  )}
                </View>
              ))}
            </View>
          </Animated.View>
        )}

        {/* Menu Items */}
        <Animated.View
          entering={FadeInDown.delay(600).duration(600)}
          className="mx-5 mt-6"
        >
          <Text className="text-stone-500 text-xs uppercase tracking-wide mb-3">Shop Settings</Text>
          <View className="bg-stone-900/60 rounded-xl border border-stone-800 overflow-hidden">
            <Pressable className="flex-row items-center p-4 border-b border-stone-800 active:bg-stone-800/50">
              <View className="w-10 h-10 rounded-xl bg-orange-500/20 items-center justify-center mr-3">
                <Store size={20} color="#f97316" />
              </View>
              <View className="flex-1">
                <Text className="text-white font-medium">Shop Profile</Text>
                <Text className="text-stone-500 text-sm">{shopInfo?.name || 'Set up your shop'}</Text>
              </View>
              <ChevronRight size={20} color="#57534e" />
            </Pressable>

            <Pressable className="flex-row items-center p-4 active:bg-stone-800/50">
              <View className="w-10 h-10 rounded-xl bg-blue-500/20 items-center justify-center mr-3">
                <Download size={20} color="#3b82f6" />
              </View>
              <View className="flex-1">
                <Text className="text-white font-medium">Export Data</Text>
                <Text className="text-stone-500 text-sm">Backup your records</Text>
              </View>
              <ChevronRight size={20} color="#57534e" />
            </Pressable>
          </View>
        </Animated.View>

        {/* About */}
        <Animated.View
          entering={FadeInDown.delay(600).duration(600)}
          className="mx-5 mt-6"
        >
          <Text className="text-stone-500 text-xs uppercase tracking-wide mb-3">About</Text>
          <View className="bg-stone-900/60 rounded-xl border border-stone-800 overflow-hidden">
            <View className="flex-row items-center p-4">
              <View className="w-10 h-10 rounded-xl bg-stone-800 items-center justify-center mr-3">
                <Info size={20} color="#78716c" />
              </View>
              <View className="flex-1">
                <Text className="text-white font-medium">Oja POS</Text>
                <Text className="text-stone-500 text-sm">Version {APP_VERSION}</Text>
              </View>
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Add Expense Modal */}
      <Modal
        visible={showExpenseModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowExpenseModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <Pressable
            className="flex-1 bg-black/60"
            onPress={() => setShowExpenseModal(false)}
          />
          <View className="bg-stone-900 rounded-t-3xl" style={{ paddingBottom: insets.bottom + 20 }}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="p-6">
                <View className="flex-row items-center justify-between mb-6">
                  <Text className="text-white text-xl font-bold">Add Expense</Text>
                  <Pressable onPress={() => setShowExpenseModal(false)}>
                    <X size={24} color="#78716c" />
                  </Pressable>
                </View>

                <View className="gap-4">
                  <View>
                    <Text className="text-stone-400 text-sm mb-2">Category</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
                      {expenseCategories.map((cat) => (
                        <Pressable
                          key={cat}
                          onPress={() => setExpenseForm({ ...expenseForm, category: cat })}
                          className={`mr-2 px-3 py-2 rounded-lg border flex-row items-center gap-2 ${
                            expenseForm.category === cat
                              ? 'bg-orange-500/20 border-orange-500'
                              : 'bg-stone-800 border-stone-700'
                          }`}
                        >
                          {expenseIcons[cat]}
                          <Text className={expenseForm.category === cat ? 'text-orange-400 font-medium' : 'text-stone-400'}>
                            {cat}
                          </Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>

                  <View>
                    <Text className="text-stone-400 text-sm mb-2">Amount (₦) *</Text>
                    <TextInput
                      className="bg-stone-800 rounded-xl px-4 py-4 text-white text-center text-2xl font-bold"
                      placeholder="0"
                      placeholderTextColor="#57534e"
                      keyboardType="numeric"
                      value={expenseForm.amount}
                      onChangeText={(text) => setExpenseForm({ ...expenseForm, amount: text })}
                    />
                  </View>

                  <View>
                    <Text className="text-stone-400 text-sm mb-2">Description (Optional)</Text>
                    <TextInput
                      className="bg-stone-800 rounded-xl px-4 py-3 text-white"
                      placeholder="e.g. Diesel for generator"
                      placeholderTextColor="#57534e"
                      value={expenseForm.description}
                      onChangeText={(text) => setExpenseForm({ ...expenseForm, description: text })}
                    />
                  </View>

                  <View>
                    <Text className="text-stone-400 text-sm mb-2">Paid With</Text>
                    <View className="flex-row gap-2">
                      {(['cash', 'transfer', 'pos'] as const).map((method) => (
                        <Pressable
                          key={method}
                          onPress={() => setExpenseForm({ ...expenseForm, paymentMethod: method })}
                          className={`flex-1 py-3 rounded-lg border ${
                            expenseForm.paymentMethod === method
                              ? 'bg-orange-500/20 border-orange-500'
                              : 'bg-stone-800 border-stone-700'
                          }`}
                        >
                          <Text className={`text-center font-medium capitalize ${
                            expenseForm.paymentMethod === method ? 'text-orange-400' : 'text-stone-400'
                          }`}>
                            {method}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>

                  <Pressable
                    onPress={handleAddExpense}
                    className="bg-red-500 py-4 rounded-xl active:opacity-90 mt-2"
                  >
                    <Text className="text-white font-semibold text-center text-lg">Record Expense</Text>
                  </Pressable>
                </View>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Cash Session Modal */}
      <Modal
        visible={showCashModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCashModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <Pressable
            className="flex-1 bg-black/60"
            onPress={() => setShowCashModal(false)}
          />
          <View className="bg-stone-900 rounded-t-3xl" style={{ paddingBottom: insets.bottom + 20 }}>
            <View className="p-6">
              <View className="flex-row items-center justify-between mb-6">
                <Text className="text-white text-xl font-bold">
                  {currentCashSession ? 'Close Cash Register' : 'Open Cash Register'}
                </Text>
                <Pressable onPress={() => setShowCashModal(false)}>
                  <X size={24} color="#78716c" />
                </Pressable>
              </View>

              {currentCashSession && (
                <View className="bg-stone-800/50 rounded-xl p-4 mb-4">
                  <View className="flex-row justify-between mb-2">
                    <Text className="text-stone-400">Opening Cash</Text>
                    <Text className="text-white font-medium">{formatNaira(currentCashSession.openingCash)}</Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-stone-400">Expected Cash</Text>
                    <Text className="text-emerald-400 font-bold">{formatNaira(expectedCash)}</Text>
                  </View>
                </View>
              )}

              <View className="gap-4">
                <View>
                  <Text className="text-stone-400 text-sm mb-2">
                    {currentCashSession ? 'Count Your Cash (₦)' : 'Opening Cash (₦)'}
                  </Text>
                  <TextInput
                    className="bg-stone-800 rounded-xl px-4 py-4 text-white text-center text-2xl font-bold"
                    placeholder="0"
                    placeholderTextColor="#57534e"
                    keyboardType="numeric"
                    value={cashAmount}
                    onChangeText={setCashAmount}
                    autoFocus
                  />
                </View>

                {currentCashSession && (
                  <View>
                    <Text className="text-stone-400 text-sm mb-2">Note (Optional)</Text>
                    <TextInput
                      className="bg-stone-800 rounded-xl px-4 py-3 text-white"
                      placeholder="e.g. Short by 500 - gave change"
                      placeholderTextColor="#57534e"
                      value={closingNote}
                      onChangeText={setClosingNote}
                    />
                  </View>
                )}

                <Pressable
                  onPress={handleCashSession}
                  className={`py-4 rounded-xl active:opacity-90 ${
                    currentCashSession ? 'bg-red-500' : 'bg-emerald-500'
                  }`}
                >
                  <Text className="text-white font-semibold text-center text-lg">
                    {currentCashSession ? 'Close Register' : 'Open Register'}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Expenses List Modal */}
      <Modal
        visible={showExpensesListModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowExpensesListModal(false)}
      >
        <Pressable
          className="flex-1 bg-black/60"
          onPress={() => setShowExpensesListModal(false)}
        />
        <View className="bg-stone-900 rounded-t-3xl max-h-[70%]" style={{ paddingBottom: insets.bottom + 20 }}>
          <View className="p-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-white text-xl font-bold">Today's Expenses</Text>
              <Pressable onPress={() => setShowExpensesListModal(false)}>
                <X size={24} color="#78716c" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {todayExpenses.length === 0 ? (
                <View className="py-8 items-center">
                  <Receipt size={40} color="#57534e" />
                  <Text className="text-stone-500 mt-3">No expenses recorded today</Text>
                </View>
              ) : (
                <View className="gap-2">
                  {todayExpenses.map((expense) => (
                    <View
                      key={expense.id}
                      className="bg-stone-800/50 rounded-xl p-4 flex-row items-center"
                    >
                      <View className="w-10 h-10 rounded-xl bg-stone-800 items-center justify-center mr-3">
                        {expenseIcons[expense.category] || expenseIcons['Other']}
                      </View>
                      <View className="flex-1">
                        <Text className="text-white font-medium">{expense.description}</Text>
                        <Text className="text-stone-500 text-xs">
                          {expense.category} • {expense.paymentMethod}
                        </Text>
                      </View>
                      <Text className="text-red-400 font-bold">{formatNaira(expense.amount)}</Text>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Price Calculator Modal */}
      <Modal
        visible={showCalculatorModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCalculatorModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <Pressable
            className="flex-1 bg-black/60"
            onPress={() => setShowCalculatorModal(false)}
          />
          <View className="bg-stone-900 rounded-t-3xl" style={{ paddingBottom: insets.bottom + 20 }}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="p-6">
                <View className="flex-row items-center justify-between mb-6">
                  <Text className="text-white text-xl font-bold">Price Calculator</Text>
                  <Pressable onPress={() => setShowCalculatorModal(false)}>
                    <X size={24} color="#78716c" />
                  </Pressable>
                </View>

                <View className="gap-4">
                  {/* Calculate Margin */}
                  <View className="bg-stone-800/50 rounded-xl p-4">
                    <Text className="text-white font-medium mb-3">Calculate Profit Margin</Text>
                    <View className="flex-row gap-3 mb-3">
                      <View className="flex-1">
                        <Text className="text-stone-400 text-xs mb-1">Cost Price</Text>
                        <TextInput
                          className="bg-stone-800 rounded-lg px-3 py-2 text-white"
                          placeholder="0"
                          placeholderTextColor="#57534e"
                          keyboardType="numeric"
                          value={costPrice}
                          onChangeText={setCostPrice}
                        />
                      </View>
                      <View className="flex-1">
                        <Text className="text-stone-400 text-xs mb-1">Selling Price</Text>
                        <TextInput
                          className="bg-stone-800 rounded-lg px-3 py-2 text-white"
                          placeholder="0"
                          placeholderTextColor="#57534e"
                          keyboardType="numeric"
                          value={sellingPrice}
                          onChangeText={setSellingPrice}
                        />
                      </View>
                    </View>
                    {calculatedMargin && (
                      <View className="bg-stone-800 rounded-lg p-3 flex-row justify-between">
                        <View>
                          <Text className="text-stone-400 text-xs">Profit</Text>
                          <Text className="text-emerald-400 font-bold">{formatNaira(calculatedMargin.profit)}</Text>
                        </View>
                        <View className="items-end">
                          <Text className="text-stone-400 text-xs">Margin</Text>
                          <Text className="text-emerald-400 font-bold">{calculatedMargin.margin.toFixed(1)}%</Text>
                        </View>
                      </View>
                    )}
                  </View>

                  {/* Suggest Price */}
                  <View className="bg-stone-800/50 rounded-xl p-4">
                    <Text className="text-white font-medium mb-3">Suggest Selling Price</Text>
                    <View className="flex-row gap-3 mb-3">
                      <View className="flex-1">
                        <Text className="text-stone-400 text-xs mb-1">Cost Price</Text>
                        <TextInput
                          className="bg-stone-800 rounded-lg px-3 py-2 text-white"
                          placeholder="0"
                          placeholderTextColor="#57534e"
                          keyboardType="numeric"
                          value={costPrice}
                          onChangeText={setCostPrice}
                        />
                      </View>
                      <View className="flex-1">
                        <Text className="text-stone-400 text-xs mb-1">Target Margin %</Text>
                        <TextInput
                          className="bg-stone-800 rounded-lg px-3 py-2 text-white"
                          placeholder="20"
                          placeholderTextColor="#57534e"
                          keyboardType="numeric"
                          value={targetMargin}
                          onChangeText={setTargetMargin}
                        />
                      </View>
                    </View>
                    {suggestedPrice && (
                      <View className="bg-emerald-500/20 rounded-lg p-3 border border-emerald-500/30">
                        <Text className="text-emerald-400 text-xs mb-1">Suggested Selling Price</Text>
                        <Text className="text-emerald-400 text-2xl font-bold">{formatNaira(Math.ceil(suggestedPrice / 10) * 10)}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
