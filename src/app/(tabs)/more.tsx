import { View, Text, ScrollView, Pressable, TextInput, Modal, KeyboardAvoidingView, Platform, Linking, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Receipt,
  Wallet,
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
  Clock,
  Cloud,
  RefreshCw,
  LogOut,
  Sun,
  Moon,
  Monitor,
  Printer,
  CheckCircle2,
  Lock,
  Globe,
  Crown,
  ShoppingBag,
  LayoutGrid,
  Trash2,
} from 'lucide-react-native';
import { useRetailStore, formatNaira, expenseCategories } from '@/store/retailStore';
import { checkAndSendLowStockAlerts } from '@/lib/lowStockAlerts';
import { useOnboardingStore } from '@/store/onboardingStore';
import { useAuthStore } from '@/store/authStore';
import { useStaffStore, hasPermission } from '@/store/staffStore';
import { usePrinterStore, type PaperSize } from '@/store/printerStore';
import { printTestReceipt } from '@/lib/printerService';
import { APP_VERSION } from '@/store/updateStore';
import { useCloudAuthStore } from '@/store/cloudAuthStore';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { canAccess, FEATURE_DESCRIPTIONS } from '@/lib/premiumFeatures';
import PremiumUpsell from '@/components/PremiumUpsell';
import { useThemeStore } from '@/store/themeStore';
import { useLanguageStore } from '@/store/languageStore';
import { useCatalogStore } from '@/store/catalogStore';
import { LANGUAGES } from '@/i18n';
import { syncAll } from '@/lib/syncService';
import { useRouter } from 'expo-router';
import { useState, useMemo, useCallback } from 'react';
import { useColorScheme } from 'nativewind';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const expenseIcons: Record<string, React.ReactNode> = {
  'Rent': <Store size={18} color="#e05e1b" />,
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
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showExpensesListModal, setShowExpensesListModal] = useState(false);
  const [showCashModal, setShowCashModal] = useState(false);
  const [showCalculatorModal, setShowCalculatorModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [cashAmount, setCashAmount] = useState('');
  const [closingNote, setClosingNote] = useState('');

  const [isPrintingTest, setIsPrintingTest] = useState(false);
  const [showUpsell, setShowUpsell] = useState(false);
  const [upsellFeature, setUpsellFeature] = useState<string>('cloud_sync');

  // Subscription
  const isPremium = useSubscriptionStore((s) => s.isPremium)();
  const subscriptionPlan = useSubscriptionStore((s) => s.plan);
  const daysRemaining = useSubscriptionStore((s) => s.daysRemaining)();

  const showPremiumUpsell = useCallback((feature: string) => {
    setUpsellFeature(feature);
    setShowUpsell(true);
  }, []);

  // Printer
  const paperSize = usePrinterStore((s) => s.paperSize);
  const setPaperSize = usePrinterStore((s) => s.setPaperSize);

  // Theme
  const themePreference = useThemeStore((s) => s.preference);
  const setThemePreference = useThemeStore((s) => s.setPreference);

  // Language
  const currentLanguage = useLanguageStore((s) => s.language);
  const currentLanguageName = LANGUAGES.find((l) => l.code === currentLanguage)?.nativeName || 'English';

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
  const lockApp = useAuthStore((s) => s.lock);
  const hasAnyPin = useAuthStore((s) => s.hasPin)();
  const cloudAuth = useCloudAuthStore();
  const shopInfo = useOnboardingStore((s) => s.shopInfo);
  const staffMembers = useStaffStore((s) => s.staff);
  const currentStaff = useStaffStore((s) => s.currentStaff);
  const staffActivities = useStaffStore((s) => s.activities);
  const canManageStaff = !currentStaff || hasPermission(currentStaff.role, 'manage_staff');
  const canAddExpense = !currentStaff || hasPermission(currentStaff.role, 'add_expense');
  const canViewActivity = !currentStaff || hasPermission(currentStaff.role, 'view_activity');
  const canManagePayroll = !currentStaff || hasPermission(currentStaff.role, 'manage_payroll');
  const canManageShop = !currentStaff || hasPermission(currentStaff.role, 'manage_shop');
  const canExportData = !currentStaff || hasPermission(currentStaff.role, 'export_data');
  const canManageCloud = !currentStaff || hasPermission(currentStaff.role, 'manage_cloud');
  const canManageAlerts = !currentStaff || hasPermission(currentStaff.role, 'manage_alerts');
  const canCashRegister = !currentStaff || hasPermission(currentStaff.role, 'cash_register');
  const canManageCategories = !currentStaff || hasPermission(currentStaff.role, 'manage_categories');
  const canManageCatalog = !currentStaff || hasPermission(currentStaff.role, 'manage_catalog');
  const canManageSub = !currentStaff || hasPermission(currentStaff.role, 'manage_subscription');
  const hasStaff = staffMembers.length > 0;
  const recentActivities = staffActivities.slice(0, 5);
  const products = useRetailStore((s) => s.products);
  const sales = useRetailStore((s) => s.sales);
  const allCustomers = useRetailStore((s) => s.customers);
  const allCashSessions = useRetailStore((s) => s.cashSessions);
  const stockMovements = useRetailStore((s) => s.stockMovements);
  const expenses = useRetailStore((s) => s.expenses);
  const addExpense = useRetailStore((s) => s.addExpense);
  const getExpensesToday = useRetailStore((s) => s.getExpensesToday);
  const currentCashSession = useRetailStore((s) => s.currentCashSession);
  const openCashSession = useRetailStore((s) => s.openCashSession);
  const closeCashSession = useRetailStore((s) => s.closeCashSession);
  const getExpectedCash = useRetailStore((s) => s.getExpectedCash);

  // Inventory Alerts
  const whatsAppAlertsEnabled = useRetailStore((s) => s.whatsAppAlertsEnabled);
  const setWhatsAppAlertsEnabled = useRetailStore((s) => s.setWhatsAppAlertsEnabled);
  const alertPhoneNumber = useRetailStore((s) => s.alertPhoneNumber);
  const setAlertPhoneNumber = useRetailStore((s) => s.setAlertPhoneNumber);
  const defaultLowStockThreshold = useRetailStore((s) => s.defaultLowStockThreshold);
  const setDefaultLowStockThreshold = useRetailStore((s) => s.setDefaultLowStockThreshold);

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

  const handleTestPrint = useCallback(async () => {
    if (!shopInfo) return;
    setIsPrintingTest(true);
    try {
      await printTestReceipt(shopInfo, paperSize);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      // Test print failed — Alert shown below
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Print Error', 'Could not print test receipt. Please try again.');
    } finally {
      setIsPrintingTest(false);
    }
  }, [shopInfo, paperSize]);

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

  const handleExportData = useCallback(async () => {
    try {
      setIsExporting(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const backupData = {
        exportedAt: new Date().toISOString(),
        appVersion: APP_VERSION,
        shopInfo,
        products,
        sales,
        customers: allCustomers,
        expenses,
        cashSessions: allCashSessions,
        stockMovements,
      };

      const jsonString = JSON.stringify(backupData, null, 2);
      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `oja-backup-${dateStr}.json`;

      if (Platform.OS === 'web') {
        // Web: use Blob download
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        // Native: use expo-file-system + expo-sharing
        const FileSystem = await import('expo-file-system');
        const Sharing = await import('expo-sharing');
        const filePath = FileSystem.documentDirectory + filename;

        await FileSystem.writeAsStringAsync(filePath, jsonString, {
          encoding: FileSystem.EncodingType.UTF8,
        });

        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(filePath, {
            mimeType: 'application/json',
            dialogTitle: 'Export Oja POS Backup',
            UTI: 'public.json',
          });
        } else {
          Alert.alert('Export Complete', 'Backup file saved but sharing is not available on this device.');
        }
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Alert.alert('Export Failed', 'Could not export data. Please try again.');
      // Export failed — Alert shown above
    } finally {
      setIsExporting(false);
    }
  }, [shopInfo, products, sales, allCustomers, expenses, allCashSessions, stockMovements]);

  const handleSyncNow = useCallback(async () => {
    if (!cloudAuth.shopId || isSyncing) return;
    setIsSyncing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await syncAll(cloudAuth.shopId);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSyncing(false);
    }
  }, [cloudAuth.shopId, isSyncing]);

  const handleCloudSignOut = useCallback(async () => {
    Alert.alert('Sign Out', 'You will stop syncing data to the cloud. Your local data is safe.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => cloudAuth.signOut(),
      },
    ]);
  }, [cloudAuth]);

  const handleSendAlertNow = useCallback(async () => {
    if (!alertPhoneNumber) {
      Alert.alert('Missing Number', 'Please enter a WhatsApp number first.');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const sent = await checkAndSendLowStockAlerts(alertPhoneNumber);
    if (!sent) {
      Alert.alert('No Low Stock', 'All products are above their low stock threshold.');
    }
  }, [alertPhoneNumber]);

  const catalogEnabled = useCatalogStore((s) => s.catalogEnabled);

  const lastSyncTime = useRetailStore((s) => s.lastSyncTime);
  const lastSyncDisplay = lastSyncTime
    ? new Date(lastSyncTime).toLocaleString('en-NG', {
        hour: '2-digit',
        minute: '2-digit',
        day: 'numeric',
        month: 'short',
      })
    : 'Never';

  const gradientColors: [string, string, string] = isDark
    ? ['#292524', '#1c1917', '#0c0a09']
    : ['#f5f5f4', '#fafaf9', '#ffffff'];

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
        <View style={{ paddingTop: insets.top + 8 }} className="px-5">
          <Animated.View entering={FadeInDown.delay(100).duration(600)}>
            <Text className="text-stone-500 dark:text-stone-500 text-sm font-semibold tracking-wide mb-1">
              Settings & Tools
            </Text>
            <Text style={{ fontFamily: 'Poppins-ExtraBold' }} className="text-stone-900 dark:text-white text-3xl font-extrabold tracking-tight">
              More
            </Text>
          </Animated.View>
        </View>

        {/* Cash Management Card */}
        {canCashRegister && (
        <Animated.View
          entering={FadeInDown.delay(200).duration(600)}
          className="mx-5 mt-6"
        >
          <Pressable
            onPress={() => setShowCashModal(true)}
            className="active:scale-[0.99]"
          >
            <LinearGradient
              colors={currentCashSession ? ['#059669', '#047857'] : ['#e05e1b', '#b84a15']}
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
        )}

        {/* Quick Actions */}
        <Animated.View
          entering={FadeInDown.delay(300).duration(600)}
          className="flex-row mx-5 mt-4 gap-3"
        >
          {canAddExpense && (
            <Pressable
              onPress={() => setShowExpenseModal(true)}
              className="flex-1 bg-white/80 dark:bg-stone-900/80 rounded-xl p-4 border border-stone-200 dark:border-stone-800 active:scale-98"
            >
              <View className="w-10 h-10 rounded-xl bg-red-500/20 items-center justify-center mb-3">
                <Receipt size={20} color="#ef4444" />
              </View>
              <Text className="text-stone-900 dark:text-white font-medium">Add Expense</Text>
              <Text className="text-stone-500 dark:text-stone-500 text-xs mt-1">Record costs</Text>
            </Pressable>
          )}

          <Pressable
            onPress={() => setShowCalculatorModal(true)}
            className="flex-1 bg-white/80 dark:bg-stone-900/80 rounded-xl p-4 border border-stone-200 dark:border-stone-800 active:scale-98"
          >
            <View className="w-10 h-10 rounded-xl bg-emerald-500/20 items-center justify-center mb-3">
              <Calculator size={20} color="#10b981" />
            </View>
            <Text className="text-stone-900 dark:text-white font-medium">Price Calculator</Text>
            <Text className="text-stone-500 dark:text-stone-500 text-xs mt-1">Set margins</Text>
          </Pressable>
        </Animated.View>

        {/* Today's Expenses */}
        {canAddExpense && (
        <Animated.View
          entering={FadeInDown.delay(400).duration(600)}
          className="mx-5 mt-6"
        >
          <Pressable
            onPress={() => setShowExpensesListModal(true)}
            className="bg-white/80 dark:bg-stone-900/80 rounded-xl p-4 border border-stone-200 dark:border-stone-800 active:opacity-90"
          >
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-stone-500 dark:text-stone-500 text-xs font-semibold tracking-wide">Today's Expenses</Text>
                <Text className="text-red-400 text-2xl font-bold mt-1">{formatNaira(todayExpenseTotal)}</Text>
                <Text className="text-stone-500 dark:text-stone-500 text-sm">{todayExpenses.length} expense{todayExpenses.length !== 1 ? 's' : ''}</Text>
              </View>
              <ChevronRight size={20} color="#57534e" />
            </View>
          </Pressable>
        </Animated.View>
        )}

        {/* Staff Section */}
        <Animated.View
          entering={FadeInDown.delay(500).duration(600)}
          className="mx-5 mt-6"
        >
          <Text className="text-stone-500 dark:text-stone-500 text-xs font-semibold tracking-wide mb-3">Staff</Text>
          <View className="bg-white/60 dark:bg-stone-900/60 rounded-xl border border-stone-200 dark:border-stone-800 overflow-hidden">
            {hasStaff && (
              <Pressable
                onPress={() => router.push('/staff-switch')}
                className="flex-row items-center p-4 border-b border-stone-200 dark:border-stone-800 active:bg-stone-200/50 dark:active:bg-stone-800/50"
              >
                <View className="w-10 h-10 rounded-xl bg-orange-500/20 items-center justify-center mr-3">
                  <UserCircle size={20} color="#e05e1b" />
                </View>
                <View className="flex-1">
                  <Text className="text-stone-900 dark:text-white font-medium">Switch Staff</Text>
                  <Text className="text-stone-500 dark:text-stone-500 text-sm">
                    {currentStaff ? `Current: ${currentStaff.name}` : 'No one logged in'}
                  </Text>
                </View>
                <ChevronRight size={20} color="#57534e" />
              </Pressable>
            )}

            {canManageStaff && (
              <Pressable
                onPress={() => router.push('/staff')}
                className="flex-row items-center p-4 border-b border-stone-200 dark:border-stone-800 active:bg-stone-200/50 dark:active:bg-stone-800/50"
              >
                <View className="w-10 h-10 rounded-xl bg-amber-500/20 items-center justify-center mr-3">
                  <Shield size={20} color="#f59e0b" />
                </View>
                <View className="flex-1">
                  <Text className="text-stone-900 dark:text-white font-medium">Staff Management</Text>
                  <Text className="text-stone-500 dark:text-stone-500 text-sm">{staffMembers.length} staff member{staffMembers.length !== 1 ? 's' : ''}</Text>
                </View>
                <ChevronRight size={20} color="#57534e" />
              </Pressable>
            )}

            {canManagePayroll && (
              <Pressable
                onPress={() => {
                  if (!canAccess('payroll')) {
                    showPremiumUpsell('payroll');
                  } else {
                    router.push('/payroll');
                  }
                }}
                className="flex-row items-center p-4 active:bg-stone-200/50 dark:active:bg-stone-800/50"
              >
                <View className="w-10 h-10 rounded-xl bg-green-500/20 items-center justify-center mr-3">
                  <Banknote size={20} color="#22c55e" />
                </View>
                <View className="flex-1">
                  <Text className="text-stone-900 dark:text-white font-medium">Payroll</Text>
                  <Text className="text-stone-500 dark:text-stone-500 text-sm">
                    {canAccess('payroll') ? 'Track staff salaries' : 'Upgrade to Business to unlock'}
                  </Text>
                </View>
                {!canAccess('payroll') ? (
                  <View className="bg-orange-500/20 px-2 py-1 rounded-full">
                    <Text className="text-orange-400 text-xs font-semibold">🔒</Text>
                  </View>
                ) : (
                  <ChevronRight size={20} color="#57534e" />
                )}
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
              <Text className="text-stone-500 dark:text-stone-500 text-xs font-semibold tracking-wide">Recent Activity</Text>
              {canViewActivity && (
                <Pressable onPress={() => router.push('/activity-log')} className="active:opacity-70">
                  <Text className="text-orange-500 text-xs font-medium">View All</Text>
                </Pressable>
              )}
            </View>
            <View className="bg-white/60 dark:bg-stone-900/60 rounded-xl border border-stone-200 dark:border-stone-800 overflow-hidden">
              {recentActivities.map((activity, index) => (
                <View
                  key={activity.id}
                  className={`flex-row items-center p-3 ${index < recentActivities.length - 1 ? 'border-b border-stone-200 dark:border-stone-800' : ''}`}
                >
                  <View className="w-7 h-7 rounded-full bg-stone-200 dark:bg-stone-800 items-center justify-center mr-3">
                    <Text className="text-stone-900 dark:text-white text-xs font-bold">{activity.staffName.charAt(0)}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-stone-600 dark:text-stone-300 text-sm" numberOfLines={1}>{activity.description}</Text>
                    <Text className="text-stone-400 dark:text-stone-600 text-xs">
                      {activity.staffName} • {new Date(activity.createdAt).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                  {activity.amount !== undefined && (
                    <Text className="text-stone-500 dark:text-stone-400 text-sm font-medium">{formatNaira(activity.amount)}</Text>
                  )}
                </View>
              ))}
            </View>
          </Animated.View>
        )}

        {/* Appearance Section */}
        <Animated.View
          entering={FadeInDown.delay(540).duration(600)}
          className="mx-5 mt-6"
        >
          <Text className="text-stone-500 dark:text-stone-500 text-xs font-semibold tracking-wide mb-3">Appearance</Text>
          <View className="bg-white/60 dark:bg-stone-900/60 rounded-xl border border-stone-200 dark:border-stone-800 p-3">
            <View className="flex-row gap-2">
              {([
                { key: 'dark' as const, label: 'Dark', icon: <Moon size={16} color={themePreference === 'dark' ? '#fff' : (isDark ? '#a8a29e' : '#57534e')} /> },
                { key: 'light' as const, label: 'Light', icon: <Sun size={16} color={themePreference === 'light' ? '#fff' : (isDark ? '#a8a29e' : '#57534e')} /> },
                { key: 'system' as const, label: 'System', icon: <Monitor size={16} color={themePreference === 'system' ? '#fff' : (isDark ? '#a8a29e' : '#57534e')} /> },
              ]).map((item) => (
                <Pressable
                  key={item.key}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setThemePreference(item.key);
                  }}
                  className={`flex-1 flex-row items-center justify-center gap-2 py-3 rounded-lg ${
                    themePreference === item.key
                      ? 'bg-orange-500'
                      : 'bg-stone-200 dark:bg-stone-800'
                  }`}
                >
                  {item.icon}
                  <Text className={`font-medium text-sm ${
                    themePreference === item.key
                      ? 'text-white'
                      : 'text-stone-600 dark:text-stone-400'
                  }`}>
                    {item.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </Animated.View>

        {/* Cloud Sync Section */}
        {canManageCloud && (
        <Animated.View
          entering={FadeInDown.delay(550).duration(600)}
          className="mx-5 mt-6"
        >
          <View className="flex-row items-center gap-2 mb-3">
            <Text className="text-stone-500 dark:text-stone-500 text-xs font-semibold tracking-wide">Cloud Sync</Text>
            {!canAccess('cloud_sync') && (
              <View className="bg-orange-500/20 px-2 py-0.5 rounded-full">
                <Text className="text-orange-400 text-[10px] font-semibold">🔒 Business</Text>
              </View>
            )}
          </View>
          <View className="bg-white/60 dark:bg-stone-900/60 rounded-xl border border-stone-200 dark:border-stone-800 overflow-hidden">
            {!canAccess('cloud_sync') ? (
              <Pressable
                onPress={() => showPremiumUpsell('cloud_sync')}
                className="flex-row items-center p-4 active:bg-stone-200/50 dark:active:bg-stone-800/50"
              >
                <View className="w-10 h-10 rounded-xl bg-blue-500/20 items-center justify-center mr-3">
                  <Cloud size={20} color="#3b82f6" />
                </View>
                <View className="flex-1">
                  <Text className="text-stone-900 dark:text-white font-medium">Enable Cloud Sync</Text>
                  <Text className="text-stone-500 dark:text-stone-500 text-sm">Upgrade to Business to unlock</Text>
                </View>
                <View className="bg-orange-500/20 px-2 py-1 rounded-full">
                  <Text className="text-orange-400 text-xs font-semibold">🔒</Text>
                </View>
              </Pressable>
            ) : cloudAuth.isAuthenticated ? (
              <>
                {/* Sync Status */}
                <View className="p-4 border-b border-stone-200 dark:border-stone-800">
                  <View className="flex-row items-center gap-3 mb-2">
                    <View className={`w-3 h-3 rounded-full ${isSyncing ? 'bg-orange-400' : 'bg-emerald-400'}`} />
                    <Text className="text-stone-900 dark:text-white font-medium">
                      {isSyncing ? 'Syncing...' : 'Connected'}
                    </Text>
                  </View>
                  <Text className="text-stone-500 dark:text-stone-500 text-sm">Last synced: {lastSyncDisplay}</Text>
                </View>

                {/* Sync Now */}
                <Pressable
                  onPress={handleSyncNow}
                  disabled={isSyncing}
                  className="flex-row items-center p-4 border-b border-stone-200 dark:border-stone-800 active:bg-stone-200/50 dark:active:bg-stone-800/50"
                >
                  <View className="w-10 h-10 rounded-xl bg-blue-500/20 items-center justify-center mr-3">
                    {isSyncing ? (
                      <ActivityIndicator size="small" color="#3b82f6" />
                    ) : (
                      <RefreshCw size={20} color="#3b82f6" />
                    )}
                  </View>
                  <View className="flex-1">
                    <Text className="text-stone-900 dark:text-white font-medium">Sync Now</Text>
                    <Text className="text-stone-500 dark:text-stone-500 text-sm">Push & pull latest data</Text>
                  </View>
                </Pressable>

                {/* Sign Out */}
                <Pressable
                  onPress={handleCloudSignOut}
                  className="flex-row items-center p-4 active:bg-stone-200/50 dark:active:bg-stone-800/50"
                >
                  <View className="w-10 h-10 rounded-xl bg-red-500/20 items-center justify-center mr-3">
                    <LogOut size={20} color="#ef4444" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-red-400 font-medium">Sign Out</Text>
                    <Text className="text-stone-500 dark:text-stone-500 text-sm">Stop cloud sync</Text>
                  </View>
                </Pressable>
              </>
            ) : (
              <Pressable
                onPress={() => router.push('/cloud-auth')}
                className="flex-row items-center p-4 active:bg-stone-200/50 dark:active:bg-stone-800/50"
              >
                <View className="w-10 h-10 rounded-xl bg-blue-500/20 items-center justify-center mr-3">
                  <Cloud size={20} color="#3b82f6" />
                </View>
                <View className="flex-1">
                  <Text className="text-stone-900 dark:text-white font-medium">Enable Cloud Sync</Text>
                  <Text className="text-stone-500 dark:text-stone-500 text-sm">Back up & sync across devices</Text>
                </View>
                <ChevronRight size={20} color="#57534e" />
              </Pressable>
            )}
          </View>
        </Animated.View>
        )}

        {/* Receipt Printer Section */}
        <Animated.View
          entering={FadeInDown.delay(580).duration(600)}
          className="mx-5 mt-6"
        >
          <View className="flex-row items-center gap-2 mb-3">
            <Text className="text-stone-500 dark:text-stone-500 text-xs font-semibold tracking-wide">Receipt Printer</Text>
            {!canAccess('receipt_printer') && (
              <View className="bg-orange-500/20 px-2 py-0.5 rounded-full">
                <Text className="text-orange-400 text-[10px] font-semibold">🔒 Business</Text>
              </View>
            )}
          </View>
          {!canAccess('receipt_printer') ? (
          <View className="bg-white/60 dark:bg-stone-900/60 rounded-xl border border-stone-200 dark:border-stone-800 overflow-hidden">
            <Pressable
              onPress={() => showPremiumUpsell('receipt_printer')}
              className="flex-row items-center p-4 active:bg-stone-200/50 dark:active:bg-stone-800/50"
            >
              <View className="w-10 h-10 rounded-xl bg-orange-500/20 items-center justify-center mr-3">
                <Printer size={20} color="#e05e1b" />
              </View>
              <View className="flex-1">
                <Text className="text-stone-900 dark:text-white font-medium">Receipt Printer</Text>
                <Text className="text-stone-500 dark:text-stone-500 text-sm">Upgrade to Business to unlock</Text>
              </View>
              <View className="bg-orange-500/20 px-2 py-1 rounded-full">
                <Text className="text-orange-400 text-xs font-semibold">🔒</Text>
              </View>
            </Pressable>
          </View>
          ) : (
          <View className="bg-white/60 dark:bg-stone-900/60 rounded-xl border border-stone-200 dark:border-stone-800 overflow-hidden">
            {/* Paper Size */}
            <View className="p-4 border-b border-stone-200 dark:border-stone-800">
              <Text className="text-stone-900 dark:text-white font-medium mb-3">Paper Size</Text>
              <View className="flex-row gap-2">
                {(['58mm', '80mm'] as PaperSize[]).map((size) => (
                  <Pressable
                    key={size}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setPaperSize(size);
                    }}
                    className={`flex-1 flex-row items-center justify-center gap-2 py-3 rounded-lg ${
                      paperSize === size
                        ? 'bg-orange-500'
                        : 'bg-stone-200 dark:bg-stone-800'
                    }`}
                  >
                    {paperSize === size && <CheckCircle2 size={16} color="#fff" />}
                    <Text className={`font-medium text-sm ${
                      paperSize === size
                        ? 'text-white'
                        : 'text-stone-600 dark:text-stone-400'
                    }`}>
                      {size}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Test Print */}
            <Pressable
              onPress={handleTestPrint}
              disabled={isPrintingTest}
              className="flex-row items-center p-4 active:bg-stone-200/50 dark:active:bg-stone-800/50"
            >
              <View className="w-10 h-10 rounded-xl bg-orange-500/20 items-center justify-center mr-3">
                {isPrintingTest ? (
                  <ActivityIndicator size="small" color="#e05e1b" />
                ) : (
                  <Printer size={20} color="#e05e1b" />
                )}
              </View>
              <View className="flex-1">
                <Text className="text-stone-900 dark:text-white font-medium">
                  {isPrintingTest ? 'Printing...' : 'Test Print'}
                </Text>
                <Text className="text-stone-500 dark:text-stone-500 text-sm">Print a sample receipt</Text>
              </View>
              <ChevronRight size={20} color="#57534e" />
            </Pressable>
          </View>
          )}
        </Animated.View>

        {/* Inventory Alerts Section */}
        {canManageAlerts && (
        <Animated.View
          entering={FadeInDown.delay(590).duration(600)}
          className="mx-5 mt-6"
        >
          <View className="flex-row items-center gap-2 mb-3">
            <Text className="text-stone-500 dark:text-stone-500 text-xs font-semibold tracking-wide">Inventory Alerts</Text>
            {!canAccess('low_stock_alerts') && (
              <View className="bg-orange-500/20 px-2 py-0.5 rounded-full">
                <Text className="text-orange-400 text-[10px] font-semibold">🔒 Business</Text>
              </View>
            )}
          </View>
          {!canAccess('low_stock_alerts') ? (
          <View className="bg-white/60 dark:bg-stone-900/60 rounded-xl border border-stone-200 dark:border-stone-800 overflow-hidden">
            <Pressable
              onPress={() => showPremiumUpsell('low_stock_alerts')}
              className="flex-row items-center p-4 active:bg-stone-200/50 dark:active:bg-stone-800/50"
            >
              <View className="w-10 h-10 rounded-xl bg-green-500/20 items-center justify-center mr-3">
                <Banknote size={20} color="#22c55e" />
              </View>
              <View className="flex-1">
                <Text className="text-stone-900 dark:text-white font-medium">WhatsApp Low Stock Alerts</Text>
                <Text className="text-stone-500 dark:text-stone-500 text-sm">Upgrade to Business to unlock</Text>
              </View>
              <View className="bg-orange-500/20 px-2 py-1 rounded-full">
                <Text className="text-orange-400 text-xs font-semibold">🔒</Text>
              </View>
            </Pressable>
          </View>
          ) : (
          <View className="bg-white/60 dark:bg-stone-900/60 rounded-xl border border-stone-200 dark:border-stone-800 overflow-hidden">
            {/* Toggle */}
            <View className="flex-row items-center justify-between p-4 border-b border-stone-200 dark:border-stone-800">
              <View className="flex-row items-center gap-3 flex-1">
                <View className="w-10 h-10 rounded-xl bg-green-500/20 items-center justify-center">
                  <Banknote size={20} color="#22c55e" />
                </View>
                <View>
                  <Text className="text-stone-900 dark:text-white font-medium">WhatsApp Low Stock Alerts</Text>
                  <Text className="text-stone-500 dark:text-stone-500 text-sm">
                    {whatsAppAlertsEnabled ? 'Enabled' : 'Disabled'}
                  </Text>
                </View>
              </View>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setWhatsAppAlertsEnabled(!whatsAppAlertsEnabled);
                }}
                className={`w-12 h-7 rounded-full justify-center ${whatsAppAlertsEnabled ? 'bg-orange-500 items-end' : 'bg-stone-300 dark:bg-stone-700 items-start'}`}
              >
                <View className="w-5 h-5 rounded-full bg-white mx-1" />
              </Pressable>
            </View>

            {whatsAppAlertsEnabled && (
              <>
                {/* Phone Number */}
                <View className="p-4 border-b border-stone-200 dark:border-stone-800">
                  <Text className="text-stone-500 dark:text-stone-400 text-sm mb-2">WhatsApp Number</Text>
                  <TextInput
                    className="bg-stone-100 dark:bg-stone-800 rounded-lg px-3 py-2 text-stone-900 dark:text-white"
                    placeholder="e.g. 2348012345678"
                    placeholderTextColor="#57534e"
                    keyboardType="phone-pad"
                    value={alertPhoneNumber}
                    onChangeText={setAlertPhoneNumber}
                  />
                </View>

                {/* Default Threshold */}
                <View className="p-4 border-b border-stone-200 dark:border-stone-800">
                  <Text className="text-stone-500 dark:text-stone-400 text-sm mb-2">Default Low Stock Threshold</Text>
                  <TextInput
                    className="bg-stone-100 dark:bg-stone-800 rounded-lg px-3 py-2 text-stone-900 dark:text-white"
                    placeholder="10"
                    placeholderTextColor="#57534e"
                    keyboardType="numeric"
                    value={defaultLowStockThreshold.toString()}
                    onChangeText={(text) => setDefaultLowStockThreshold(parseInt(text) || 10)}
                  />
                </View>

                {/* Send Alert Now */}
                <Pressable
                  onPress={handleSendAlertNow}
                  className="flex-row items-center p-4 active:bg-stone-200/50 dark:active:bg-stone-800/50"
                >
                  <View className="w-10 h-10 rounded-xl bg-emerald-500/20 items-center justify-center mr-3">
                    <Zap size={20} color="#10b981" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-stone-900 dark:text-white font-medium">Send Alert Now</Text>
                    <Text className="text-stone-500 dark:text-stone-500 text-sm">Manually check & send low stock alert</Text>
                  </View>
                  <ChevronRight size={20} color="#57534e" />
                </Pressable>
              </>
            )}
          </View>
          )}
        </Animated.View>
        )}

        {/* Menu Items */}
        <Animated.View
          entering={FadeInDown.delay(600).duration(600)}
          className="mx-5 mt-6"
        >
          <Text className="text-stone-500 dark:text-stone-500 text-xs font-semibold tracking-wide mb-3">Shop Settings</Text>
          <View className="bg-white/60 dark:bg-stone-900/60 rounded-xl border border-stone-200 dark:border-stone-800 overflow-hidden">
            {/* Subscription Row — owner only */}
            {canManageSub && (
              <Pressable
                onPress={() => router.push('/subscription')}
                className="flex-row items-center p-4 border-b border-stone-200 dark:border-stone-800 active:bg-stone-200/50 dark:active:bg-stone-800/50"
              >
                <View className="w-10 h-10 rounded-xl bg-orange-500/20 items-center justify-center mr-3">
                  <Crown size={20} color="#e05e1b" />
                </View>
                <View className="flex-1">
                  <Text className="text-stone-900 dark:text-white font-medium">Subscription</Text>
                  <Text className="text-stone-500 dark:text-stone-500 text-sm">
                    {isPremium
                      ? (subscriptionPlan === 'growth' ? 'Growth Plan' : 'Business Plan')
                      : 'Starter Plan (Free)'}
                  </Text>
                </View>
                {isPremium ? (
                  <View className="bg-emerald-500/20 px-3 py-1 rounded-full mr-2">
                    <Text className="text-emerald-400 text-xs font-semibold">
                      Active • {daysRemaining}d
                    </Text>
                  </View>
                ) : (
                  <View className="bg-orange-500/20 px-3 py-1 rounded-full mr-2">
                    <Text className="text-orange-400 text-xs font-semibold">Upgrade</Text>
                  </View>
                )}
                <ChevronRight size={20} color="#57534e" />
              </Pressable>
            )}

            {/* Manage Categories — owner/manager only */}
            {canManageCategories && (
              <Pressable
                onPress={() => router.push('/categories')}
                className="flex-row items-center p-4 border-b border-stone-200 dark:border-stone-800 active:bg-stone-200/50 dark:active:bg-stone-800/50"
              >
                <View className="w-10 h-10 rounded-xl bg-purple-500/20 items-center justify-center mr-3">
                  <LayoutGrid size={20} color="#a855f7" />
                </View>
                <View className="flex-1">
                  <Text className="text-stone-900 dark:text-white font-medium">Manage Categories</Text>
                  <Text className="text-stone-500 dark:text-stone-500 text-sm">Add, edit, or remove categories</Text>
                </View>
                <ChevronRight size={20} color="#57534e" />
              </Pressable>
            )}

            {/* WhatsApp Catalog — owner/manager only */}
            {canManageCatalog && (
              <Pressable
                onPress={() => router.push('/catalog')}
                className="flex-row items-center p-4 border-b border-stone-200 dark:border-stone-800 active:bg-stone-200/50 dark:active:bg-stone-800/50"
              >
                <View className="w-10 h-10 rounded-xl bg-green-500/20 items-center justify-center mr-3">
                  <ShoppingBag size={20} color="#22c55e" />
                </View>
                <View className="flex-1">
                  <Text className="text-stone-900 dark:text-white font-medium">WhatsApp Catalog</Text>
                  <Text className="text-stone-500 dark:text-stone-500 text-sm">Share products online</Text>
                </View>
                <View className={`px-2 py-1 rounded-full mr-2 ${catalogEnabled ? 'bg-emerald-500/20' : 'bg-stone-200 dark:bg-stone-800'}`}>
                  <Text className={`text-xs font-semibold ${catalogEnabled ? 'text-emerald-400' : 'text-stone-500'}`}>
                    {catalogEnabled ? 'Enabled' : 'Disabled'}
                  </Text>
                </View>
                <ChevronRight size={20} color="#57534e" />
              </Pressable>
            )}

            {canManageShop && (
              <Pressable
                onPress={() => router.push('/shop-profile')}
                className="flex-row items-center p-4 border-b border-stone-200 dark:border-stone-800 active:bg-stone-200/50 dark:active:bg-stone-800/50"
              >
                <View className="w-10 h-10 rounded-xl bg-orange-500/20 items-center justify-center mr-3">
                  <Store size={20} color="#e05e1b" />
                </View>
                <View className="flex-1">
                  <Text className="text-stone-900 dark:text-white font-medium">Shop Profile</Text>
                  <Text className="text-stone-500 dark:text-stone-500 text-sm">{shopInfo?.name || 'Set up your shop'}</Text>
                </View>
                <ChevronRight size={20} color="#57534e" />
              </Pressable>
            )}

            <Pressable
              onPress={() => router.push('/language')}
              className="flex-row items-center p-4 border-b border-stone-200 dark:border-stone-800 active:bg-stone-200/50 dark:active:bg-stone-800/50"
            >
              <View className="w-10 h-10 rounded-xl bg-violet-500/20 items-center justify-center mr-3">
                <Globe size={20} color="#8b5cf6" />
              </View>
              <View className="flex-1">
                <Text className="text-stone-900 dark:text-white font-medium">Language</Text>
                <Text className="text-stone-500 dark:text-stone-500 text-sm">{currentLanguageName}</Text>
              </View>
              <ChevronRight size={20} color="#57534e" />
            </Pressable>

            {canExportData && (
              <Pressable
                onPress={handleExportData}
                disabled={isExporting}
                className="flex-row items-center p-4 border-b border-stone-200 dark:border-stone-800 active:bg-stone-200/50 dark:active:bg-stone-800/50"
              >
                <View className="w-10 h-10 rounded-xl bg-blue-500/20 items-center justify-center mr-3">
                  {isExporting ? (
                    <ActivityIndicator size="small" color="#3b82f6" />
                  ) : (
                    <Download size={20} color="#3b82f6" />
                  )}
                </View>
                <View className="flex-1">
                  <Text className="text-stone-900 dark:text-white font-medium">{isExporting ? 'Exporting...' : 'Export Data'}</Text>
                  <Text className="text-stone-500 dark:text-stone-500 text-sm">Backup your records</Text>
                </View>
                <ChevronRight size={20} color="#57534e" />
              </Pressable>
            )}

            {hasAnyPin && (
              <Pressable
                onPress={() => {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                  lockApp();
                }}
                className="flex-row items-center p-4 active:bg-stone-200/50 dark:active:bg-stone-800/50"
              >
                <View className="w-10 h-10 rounded-xl bg-red-500/20 items-center justify-center mr-3">
                  <Lock size={20} color="#ef4444" />
                </View>
                <View className="flex-1">
                  <Text className="text-red-400 font-medium">Lock App</Text>
                  <Text className="text-stone-500 dark:text-stone-500 text-sm">
                    {currentStaff ? `Logged in as ${currentStaff.name}` : 'Require PIN to re-enter'}
                  </Text>
                </View>
              </Pressable>
            )}
          </View>
        </Animated.View>

        {/* About */}
        <Animated.View
          entering={FadeInDown.delay(600).duration(600)}
          className="mx-5 mt-6"
        >
          {/* Reset All Data — owner only */}
          {canManageSub && (
            <View className="mb-6">
              <Text className="text-stone-500 dark:text-stone-500 text-xs font-semibold tracking-wide mb-3">Danger Zone</Text>
              <View className="bg-white/60 dark:bg-stone-900/60 rounded-xl border border-red-500/30 overflow-hidden">
                <Pressable
                  onPress={() => {
                    Alert.alert(
                      'Reset All Data',
                      'This will permanently delete ALL your data — products, sales, customers, staff, everything. This cannot be undone.\n\nAre you sure?',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Reset Everything',
                          style: 'destructive',
                          onPress: () => {
                            Alert.alert(
                              'Final Confirmation',
                              'Last chance. All data will be erased and the app will restart from scratch.',
                              [
                                { text: 'Cancel', style: 'cancel' },
                                {
                                  text: 'Yes, Delete All',
                                  style: 'destructive',
                                  onPress: async () => {
                                    // Clear all persisted stores
                                    const storeKeys = [
                                      'retail-store', 'oja-staff-storage', 'auth-store',
                                      'catalog-store', 'onboarding-store', 'oja-payroll-storage',
                                      'printer-store', 'subscription-store', 'cloud-auth-store',
                                      'oja-language', 'oja-theme', 'update-store',
                                    ];
                                    if (typeof window !== 'undefined' && window.localStorage) {
                                      storeKeys.forEach((key) => window.localStorage.removeItem(key));
                                    }
                                    // Also try AsyncStorage keys
                                    try {
                                      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
                                      await AsyncStorage.multiRemove(storeKeys);
                                    } catch {}
                                    // Reload the app
                                    if (typeof window !== 'undefined') {
                                      window.location.href = '/';
                                    }
                                  },
                                },
                              ]
                            );
                          },
                        },
                      ]
                    );
                  }}
                  className="flex-row items-center p-4 active:bg-red-500/10"
                >
                  <View className="w-10 h-10 rounded-xl bg-red-500/20 items-center justify-center mr-3">
                    <Trash2 size={20} color="#ef4444" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-red-500 font-medium">Reset All Data</Text>
                    <Text className="text-stone-500 dark:text-stone-500 text-sm">Delete everything and start fresh</Text>
                  </View>
                  <ChevronRight size={20} color="#ef4444" />
                </Pressable>
              </View>
            </View>
          )}

          <Text className="text-stone-500 dark:text-stone-500 text-xs font-semibold tracking-wide mb-3">About</Text>
          <View className="bg-white/60 dark:bg-stone-900/60 rounded-xl border border-stone-200 dark:border-stone-800 overflow-hidden">
            <View className="flex-row items-center p-4">
              <View className="w-10 h-10 rounded-xl bg-stone-200 dark:bg-stone-800 items-center justify-center mr-3">
                <Info size={20} color="#78716c" />
              </View>
              <View className="flex-1">
                <Text className="text-stone-900 dark:text-white font-medium">Oja POS</Text>
                <Text className="text-stone-500 dark:text-stone-500 text-sm">Version {APP_VERSION}</Text>
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
          <View className="bg-white dark:bg-stone-900 rounded-t-3xl" style={{ paddingBottom: insets.bottom + 20 }}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="p-6">
                <View className="flex-row items-center justify-between mb-6">
                  <Text className="text-stone-900 dark:text-white text-xl font-bold">Add Expense</Text>
                  <Pressable onPress={() => setShowExpenseModal(false)}>
                    <X size={24} color="#78716c" />
                  </Pressable>
                </View>

                <View className="gap-4">
                  <View>
                    <Text className="text-stone-500 dark:text-stone-400 text-sm mb-2">Category</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
                      {expenseCategories.map((cat) => (
                        <Pressable
                          key={cat}
                          onPress={() => setExpenseForm({ ...expenseForm, category: cat })}
                          className={`mr-2 px-3 py-2 rounded-lg border flex-row items-center gap-2 ${
                            expenseForm.category === cat
                              ? 'bg-orange-500/20 border-orange-500'
                              : 'bg-stone-200 dark:bg-stone-800 border-stone-300 dark:border-stone-700'
                          }`}
                        >
                          {expenseIcons[cat]}
                          <Text className={expenseForm.category === cat ? 'text-orange-400 font-medium' : 'text-stone-600 dark:text-stone-400'}>
                            {cat}
                          </Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>

                  <View>
                    <Text className="text-stone-500 dark:text-stone-400 text-sm mb-2">Amount (₦) *</Text>
                    <TextInput
                      className="bg-stone-100 dark:bg-stone-800 rounded-xl px-4 py-4 text-stone-900 dark:text-white text-center text-2xl font-bold"
                      placeholder="0"
                      placeholderTextColor="#57534e"
                      keyboardType="numeric"
                      value={expenseForm.amount}
                      onChangeText={(text) => setExpenseForm({ ...expenseForm, amount: text })}
                    />
                  </View>

                  <View>
                    <Text className="text-stone-500 dark:text-stone-400 text-sm mb-2">Description (Optional)</Text>
                    <TextInput
                      className="bg-stone-100 dark:bg-stone-800 rounded-xl px-4 py-3 text-stone-900 dark:text-white"
                      placeholder="e.g. Diesel for generator"
                      placeholderTextColor="#57534e"
                      value={expenseForm.description}
                      onChangeText={(text) => setExpenseForm({ ...expenseForm, description: text })}
                    />
                  </View>

                  <View>
                    <Text className="text-stone-500 dark:text-stone-400 text-sm mb-2">Paid With</Text>
                    <View className="flex-row gap-2">
                      {(['cash', 'transfer', 'pos'] as const).map((method) => (
                        <Pressable
                          key={method}
                          onPress={() => setExpenseForm({ ...expenseForm, paymentMethod: method })}
                          className={`flex-1 py-3 rounded-lg border ${
                            expenseForm.paymentMethod === method
                              ? 'bg-orange-500/20 border-orange-500'
                              : 'bg-stone-200 dark:bg-stone-800 border-stone-300 dark:border-stone-700'
                          }`}
                        >
                          <Text className={`text-center font-medium capitalize ${
                            expenseForm.paymentMethod === method ? 'text-orange-400' : 'text-stone-600 dark:text-stone-400'
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
          <View className="bg-white dark:bg-stone-900 rounded-t-3xl" style={{ paddingBottom: insets.bottom + 20 }}>
            <View className="p-6">
              <View className="flex-row items-center justify-between mb-6">
                <Text className="text-stone-900 dark:text-white text-xl font-bold">
                  {currentCashSession ? 'Close Cash Register' : 'Open Cash Register'}
                </Text>
                <Pressable onPress={() => setShowCashModal(false)}>
                  <X size={24} color="#78716c" />
                </Pressable>
              </View>

              {currentCashSession && (
                <View className="bg-stone-100/50 dark:bg-stone-800/50 rounded-xl p-4 mb-4">
                  <View className="flex-row justify-between mb-2">
                    <Text className="text-stone-500 dark:text-stone-400">Opening Cash</Text>
                    <Text className="text-stone-900 dark:text-white font-medium">{formatNaira(currentCashSession.openingCash)}</Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-stone-500 dark:text-stone-400">Expected Cash</Text>
                    <Text className="text-emerald-400 font-bold">{formatNaira(expectedCash)}</Text>
                  </View>
                </View>
              )}

              <View className="gap-4">
                <View>
                  <Text className="text-stone-500 dark:text-stone-400 text-sm mb-2">
                    {currentCashSession ? 'Count Your Cash (₦)' : 'Opening Cash (₦)'}
                  </Text>
                  <TextInput
                    className="bg-stone-100 dark:bg-stone-800 rounded-xl px-4 py-4 text-stone-900 dark:text-white text-center text-2xl font-bold"
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
                    <Text className="text-stone-500 dark:text-stone-400 text-sm mb-2">Note (Optional)</Text>
                    <TextInput
                      className="bg-stone-100 dark:bg-stone-800 rounded-xl px-4 py-3 text-stone-900 dark:text-white"
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
        <View className="bg-white dark:bg-stone-900 rounded-t-3xl max-h-[70%]" style={{ paddingBottom: insets.bottom + 20 }}>
          <View className="p-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-stone-900 dark:text-white text-xl font-bold">Today's Expenses</Text>
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
                      className="bg-stone-100/50 dark:bg-stone-800/50 rounded-xl p-4 flex-row items-center"
                    >
                      <View className="w-10 h-10 rounded-xl bg-stone-200 dark:bg-stone-800 items-center justify-center mr-3">
                        {expenseIcons[expense.category] || expenseIcons['Other']}
                      </View>
                      <View className="flex-1">
                        <Text className="text-stone-900 dark:text-white font-medium">{expense.description}</Text>
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
          <View className="bg-white dark:bg-stone-900 rounded-t-3xl" style={{ paddingBottom: insets.bottom + 20 }}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="p-6">
                <View className="flex-row items-center justify-between mb-6">
                  <Text className="text-stone-900 dark:text-white text-xl font-bold">Price Calculator</Text>
                  <Pressable onPress={() => setShowCalculatorModal(false)}>
                    <X size={24} color="#78716c" />
                  </Pressable>
                </View>

                <View className="gap-4">
                  {/* Calculate Margin */}
                  <View className="bg-stone-100/50 dark:bg-stone-800/50 rounded-xl p-4">
                    <Text className="text-stone-900 dark:text-white font-medium mb-3">Calculate Profit Margin</Text>
                    <View className="flex-row gap-3 mb-3">
                      <View className="flex-1">
                        <Text className="text-stone-500 dark:text-stone-400 text-xs mb-1">Cost Price</Text>
                        <TextInput
                          className="bg-stone-200 dark:bg-stone-800 rounded-lg px-3 py-2 text-stone-900 dark:text-white"
                          placeholder="0"
                          placeholderTextColor="#57534e"
                          keyboardType="numeric"
                          value={costPrice}
                          onChangeText={setCostPrice}
                        />
                      </View>
                      <View className="flex-1">
                        <Text className="text-stone-500 dark:text-stone-400 text-xs mb-1">Selling Price</Text>
                        <TextInput
                          className="bg-stone-200 dark:bg-stone-800 rounded-lg px-3 py-2 text-stone-900 dark:text-white"
                          placeholder="0"
                          placeholderTextColor="#57534e"
                          keyboardType="numeric"
                          value={sellingPrice}
                          onChangeText={setSellingPrice}
                        />
                      </View>
                    </View>
                    {calculatedMargin && (
                      <View className="bg-stone-200 dark:bg-stone-800 rounded-lg p-3 flex-row justify-between">
                        <View>
                          <Text className="text-stone-500 dark:text-stone-400 text-xs">Profit</Text>
                          <Text className="text-emerald-400 font-bold">{formatNaira(calculatedMargin.profit)}</Text>
                        </View>
                        <View className="items-end">
                          <Text className="text-stone-500 dark:text-stone-400 text-xs">Margin</Text>
                          <Text className="text-emerald-400 font-bold">{calculatedMargin.margin.toFixed(1)}%</Text>
                        </View>
                      </View>
                    )}
                  </View>

                  {/* Suggest Price */}
                  <View className="bg-stone-100/50 dark:bg-stone-800/50 rounded-xl p-4">
                    <Text className="text-stone-900 dark:text-white font-medium mb-3">Suggest Selling Price</Text>
                    <View className="flex-row gap-3 mb-3">
                      <View className="flex-1">
                        <Text className="text-stone-500 dark:text-stone-400 text-xs mb-1">Cost Price</Text>
                        <TextInput
                          className="bg-stone-200 dark:bg-stone-800 rounded-lg px-3 py-2 text-stone-900 dark:text-white"
                          placeholder="0"
                          placeholderTextColor="#57534e"
                          keyboardType="numeric"
                          value={costPrice}
                          onChangeText={setCostPrice}
                        />
                      </View>
                      <View className="flex-1">
                        <Text className="text-stone-500 dark:text-stone-400 text-xs mb-1">Target Margin %</Text>
                        <TextInput
                          className="bg-stone-200 dark:bg-stone-800 rounded-lg px-3 py-2 text-stone-900 dark:text-white"
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

      <PremiumUpsell
        visible={showUpsell}
        onClose={() => setShowUpsell(false)}
        featureName={FEATURE_DESCRIPTIONS[upsellFeature]?.name || 'Premium Feature'}
        featureDescription={FEATURE_DESCRIPTIONS[upsellFeature]?.description || 'This feature requires the Business plan.'}
      />
    </View>
  );
}
