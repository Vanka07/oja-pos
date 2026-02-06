import { View, Text, ScrollView, Pressable, TextInput, Modal, KeyboardAvoidingView, Platform, Linking, Share, RefreshControl, FlatList } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Search,
  Plus,
  Users,
  Phone,
  X,
  ChevronRight,
  AlertCircle,
  Banknote,
  TrendingDown,
  TrendingUp,
  MessageCircle,
  Lock,
  ShieldOff,
  ShieldCheck,
  Clock,
  Filter,
  CreditCard,
  Smartphone,
  CheckCircle,
  FileText,
} from 'lucide-react-native';
import { useRetailStore, formatNaira, generatePaymentReceiptText, type Customer } from '@/store/retailStore';
import { generatePaymentReceiptPdf } from '@/lib/receiptPdf';
import { useOnboardingStore } from '@/store/onboardingStore';
import { getPlaceholders } from '@/lib/placeholderConfig';
import { useStaffStore, hasPermission } from '@/store/staffStore';
import { getCreditRisk, getCreditSummary, generateReminderMessage, wasRemindedRecently, daysSinceReminder, shouldFreezeCredit, getOverdueCustomers } from '@/lib/creditIntelligence';
import { useState, useMemo, useCallback } from 'react';
import Animated, { FadeInDown, FadeIn, Layout } from 'react-native-reanimated';
import { useColorScheme } from 'nativewind';
import * as Haptics from 'expo-haptics';
import EmptyState from '@/components/EmptyState';

type FilterMode = 'all' | 'overdue' | 'frozen';

export default function CreditBookScreen() {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const currentStaff = useStaffStore((s) => s.currentStaff);
  const canManageCustomers = !currentStaff || hasPermission(currentStaff.role, 'manage_customers');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | 'pos'>('cash');
  const [paymentSuccess, setPaymentSuccess] = useState<{
    amountPaid: number;
    previousBalance: number;
    newBalance: number;
    paymentMethod: string;
  } | null>(null);

  const [refreshing, setRefreshing] = useState(false);
  const [showFreezeConfirm, setShowFreezeConfirm] = useState(false);
  const [freezeTarget, setFreezeTarget] = useState<Customer | null>(null);
  const [showReminderInfo, setShowReminderInfo] = useState(false);
  const [reminderInfoDays, setReminderInfoDays] = useState(0);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    creditLimit: '',
  });

  const shopInfo = useOnboardingStore((s) => s.shopInfo);
  const businessType = useOnboardingStore((s) => s.businessType);
  const placeholders = getPlaceholders(businessType);
  const customers = useRetailStore((s) => s.customers);
  const addCustomer = useRetailStore((s) => s.addCustomer);
  const recordCreditPayment = useRetailStore((s) => s.recordCreditPayment);
  const freezeCustomerCredit = useRetailStore((s) => s.freezeCustomerCredit);
  const setLastReminderSent = useRetailStore((s) => s.setLastReminderSent);

  const creditSummary = useMemo(() => getCreditSummary(customers), [customers]);
  const overdueCustomers = useMemo(() => getOverdueCustomers(customers), [customers]);

  const filteredCustomers = useMemo(() => {
    let filtered = customers;

    // Apply filter mode
    if (filterMode === 'overdue') {
      filtered = overdueCustomers;
    } else if (filterMode === 'frozen') {
      filtered = customers.filter((c) => c.creditFrozen);
    }

    // Apply search
    if (searchQuery) {
      filtered = filtered.filter((c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone.includes(searchQuery)
      );
    }

    // Sort by risk (highest first)
    return filtered.sort((a, b) => {
      const riskA = getCreditRisk(a).score;
      const riskB = getCreditRisk(b).score;
      return riskB - riskA;
    });
  }, [customers, overdueCustomers, searchQuery, filterMode]);

  const handleAddCustomer = useCallback(() => {
    if (!formData.name.trim()) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addCustomer({
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      creditLimit: parseFloat(formData.creditLimit) || 50000,
    });

    setFormData({ name: '', phone: '', creditLimit: '' });
    setShowAddModal(false);
  }, [formData, addCustomer]);

  const handleRecordPayment = useCallback(() => {
    if (!selectedCustomer || !paymentAmount) return;

    const amount = parseFloat(paymentAmount) || 0;
    if (amount <= 0) return;

    const previousBalance = selectedCustomer.currentCredit;
    const newBalance = Math.max(0, previousBalance - amount);

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    recordCreditPayment(selectedCustomer.id, amount, paymentNote || undefined, paymentMethod);

    // Show success state
    setPaymentSuccess({
      amountPaid: amount,
      previousBalance,
      newBalance,
      paymentMethod,
    });

    // Refresh selected customer
    setTimeout(() => {
      const freshCustomers = useRetailStore.getState().customers;
      const updated = freshCustomers.find((c) => c.id === selectedCustomer.id);
      if (updated) setSelectedCustomer(updated);
    }, 0);
  }, [selectedCustomer, paymentAmount, paymentNote, paymentMethod, recordCreditPayment]);

  const handleSharePaymentReceipt = useCallback(() => {
    if (!selectedCustomer || !paymentSuccess || !shopInfo) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const receipt = generatePaymentReceiptText(
      selectedCustomer.name,
      paymentSuccess.amountPaid,
      paymentSuccess.previousBalance,
      paymentSuccess.newBalance,
      paymentSuccess.paymentMethod,
      shopInfo.name,
      shopInfo.phone
    );
    const encoded = encodeURIComponent(receipt);
    if (Platform.OS === 'web') {
      window.open(`https://wa.me/?text=${encoded}`, '_blank');
    } else {
      const url = `whatsapp://send?text=${encoded}`;
      Linking.openURL(url).catch(() => {
        Share.share({ message: receipt });
      });
    }
  }, [selectedCustomer, paymentSuccess, shopInfo]);

  const handleSharePaymentPdf = useCallback(async () => {
    if (!selectedCustomer || !paymentSuccess || !shopInfo) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await generatePaymentReceiptPdf({
        customerName: selectedCustomer.name,
        amountPaid: paymentSuccess.amountPaid,
        previousBalance: paymentSuccess.previousBalance,
        newBalance: paymentSuccess.newBalance,
        paymentMethod: paymentSuccess.paymentMethod,
        shopName: shopInfo.name,
        shopPhone: shopInfo.phone,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [selectedCustomer, paymentSuccess, shopInfo]);

  const handleClosePaymentModal = useCallback(() => {
    setPaymentAmount('');
    setPaymentNote('');
    setPaymentMethod('cash');
    setPaymentSuccess(null);
    setShowPaymentModal(false);
  }, []);

  const openCustomerDetail = useCallback((customer: Customer) => {
    // Refresh from store to avoid stale data
    const fresh = useRetailStore.getState().customers.find((c) => c.id === customer.id);
    setSelectedCustomer(fresh || customer);
    setShowCustomerModal(true);
  }, []);

  const sendWhatsAppReminder = useCallback((customer: Customer) => {
    const shopName = shopInfo?.name || 'our shop';
    const message = generateReminderMessage(customer, shopName);

    // Normalize phone
    let phone = customer.phone.replace(/[\s\-\(\)]/g, '');
    if (phone.startsWith('+')) phone = phone.slice(1);
    else if (phone.startsWith('0')) phone = '234' + phone.slice(1);
    else if (!phone.startsWith('234')) phone = '234' + phone;

    const url = `whatsapp://send?phone=${phone}&text=${encodeURIComponent(message)}`;
    Linking.openURL(url).then(() => {
      // Mark reminder as sent
      setLastReminderSent(customer.id);
      // Refresh selected customer
      setTimeout(() => {
        const fresh = useRetailStore.getState().customers.find((c) => c.id === customer.id);
        if (fresh) setSelectedCustomer(fresh);
      }, 100);
    }).catch(() => {
      // WhatsApp not installed — try web
      const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
      Linking.openURL(waUrl).catch(() => {});
    });
  }, [shopInfo, setLastReminderSent]);

  const handleToggleFreeze = useCallback((customer: Customer) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (!customer.creditFrozen) {
      setFreezeTarget(customer);
      setShowFreezeConfirm(true);
    } else {
      freezeCustomerCredit(customer.id, false);
      const fresh = useRetailStore.getState().customers.find((c) => c.id === customer.id);
      if (fresh) setSelectedCustomer(fresh);
    }
  }, [freezeCustomerCredit]);

  const confirmFreeze = useCallback(() => {
    if (!freezeTarget) return;
    freezeCustomerCredit(freezeTarget.id, true);
    const fresh = useRetailStore.getState().customers.find((c) => c.id === freezeTarget.id);
    if (fresh) setSelectedCustomer(fresh);
    setShowFreezeConfirm(false);
    setFreezeTarget(null);
  }, [freezeTarget, freezeCustomerCredit]);

  const gradientColors: [string, string, string] = isDark
    ? ['#292524', '#1c1917', '#0c0a09']
    : ['#f5f5f4', '#fafaf9', '#ffffff'];

  if (!canManageCustomers) {
    return (
      <View className="flex-1 bg-stone-50 dark:bg-stone-950">
        <LinearGradient colors={gradientColors} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} />
        <View style={{ paddingTop: insets.top + 8 }} className="px-5">
          <Text className="text-stone-500 dark:text-stone-500 text-sm font-semibold tracking-wide uppercase mb-1">Customers</Text>
          <Text style={{ fontFamily: 'Poppins-ExtraBold' }} className="text-stone-900 dark:text-white text-3xl font-extrabold tracking-tight">Credit Book</Text>
        </View>
        <View className="flex-1 items-center justify-center px-8">
          <View className="w-20 h-20 rounded-full bg-stone-200 dark:bg-stone-800 items-center justify-center mb-4">
            <Lock size={32} color="#78716c" />
          </View>
          <Text className="text-stone-900 dark:text-white text-xl font-bold mb-2">Access Restricted</Text>
          <Text className="text-stone-500 dark:text-stone-400 text-center">You don't have permission to manage customers. Ask the shop owner for access.</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-stone-50 dark:bg-stone-950">
      <LinearGradient
        colors={gradientColors}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
      />

      <FlatList
        className="flex-1"
        data={filteredCustomers}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        initialNumToRender={15}
        maxToRenderPerBatch={10}
        windowSize={5}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              setTimeout(() => setRefreshing(false), 500);
            }}
            tintColor="#e05e1b"
            colors={['#e05e1b']}
          />
        }
        ListHeaderComponent={
          <>
            {/* Header */}
            <View style={{ paddingTop: insets.top + 8 }} className="px-5">
              <Animated.View entering={FadeInDown.delay(100).duration(600)}>
                <View className="flex-row items-center justify-between mb-1">
                  <Text className="text-stone-500 dark:text-stone-500 text-sm font-semibold tracking-wide">
                    Customers
                  </Text>
                  <Pressable
                    onPress={() => setShowAddModal(true)}
                    accessibilityLabel="Add customer"
                    accessibilityRole="button"
                    className="bg-orange-500 w-8 h-8 rounded-full items-center justify-center active:scale-95"
                  >
                    <Plus size={18} color="white" />
                  </Pressable>
                </View>
                <Text style={{ fontFamily: 'Poppins-ExtraBold' }} className="text-stone-900 dark:text-white text-3xl font-extrabold tracking-tight">
                  Credit Book
                </Text>
              </Animated.View>
            </View>

            {/* Stats Cards — 3 columns */}
            <Animated.View
              entering={FadeInDown.delay(200).duration(600)}
              className="flex-row mx-5 mt-6 gap-2"
            >
              <View className="flex-1 bg-red-500/10 rounded-2xl p-3 border border-red-500/30">
                <View className="flex-row items-center gap-1 mb-1">
                  <AlertCircle size={14} color="#ef4444" />
                  <Text className="text-red-400 text-xs font-semibold">Total Owed</Text>
                </View>
                <Text className="text-red-400 text-lg font-bold">{formatNaira(creditSummary.totalOwed)}</Text>
                {creditSummary.overdueAmount > 0 && (
                  <Text className="text-red-400/60 text-xs mt-1">
                    {formatNaira(creditSummary.overdueAmount)} overdue
                  </Text>
                )}
              </View>
              <View className={`flex-1 rounded-2xl p-3 border ${creditSummary.overdueCount > 0 ? 'bg-amber-500/10 border-amber-500/30' : 'bg-white/80 dark:bg-stone-900/80 border-stone-200 dark:border-stone-800'}`}>
                <View className="flex-row items-center gap-1 mb-1">
                  <Clock size={14} color={creditSummary.overdueCount > 0 ? '#f59e0b' : '#78716c'} />
                  <Text className={`text-xs font-semibold ${creditSummary.overdueCount > 0 ? 'text-amber-400' : 'text-stone-500'}`}>Overdue</Text>
                </View>
                <Text className={`text-lg font-bold ${creditSummary.overdueCount > 0 ? 'text-amber-400' : 'text-stone-900 dark:text-white'}`}>
                  {creditSummary.overdueCount}
                </Text>
                {creditSummary.avgDaysOverdue > 0 && (
                  <Text className="text-stone-500 text-xs mt-1">
                    ~{creditSummary.avgDaysOverdue}d avg
                  </Text>
                )}
              </View>
              <View className="flex-1 bg-white/80 dark:bg-stone-900/80 rounded-2xl p-3 border border-stone-200 dark:border-stone-800">
                <View className="flex-row items-center gap-1 mb-1">
                  <ShieldOff size={14} color="#78716c" />
                  <Text className="text-stone-500 dark:text-stone-500 text-xs font-semibold">At Risk</Text>
                </View>
                <Text className="text-stone-900 dark:text-white text-lg font-bold">
                  {creditSummary.highRiskCount}
                </Text>
                {creditSummary.frozenCount > 0 && (
                  <Text className="text-red-400 text-xs mt-1">
                    {creditSummary.frozenCount} frozen
                  </Text>
                )}
              </View>
            </Animated.View>

            {/* Filter Tabs */}
            <Animated.View entering={FadeInDown.delay(250).duration(600)} className="px-5 mt-4">
              <View className="flex-row gap-2">
                {(['all', 'overdue', 'frozen'] as FilterMode[]).map((mode) => {
                  const isActive = filterMode === mode;
                  const count = mode === 'overdue' ? overdueCustomers.length : mode === 'frozen' ? customers.filter((c) => c.creditFrozen).length : customers.length;
                  const accessibilityLabel = mode === 'all' ? 'All customers' : mode === 'overdue' ? `Overdue customers, ${count} items` : `Frozen customers, ${count} items`;
                  return (
                    <Pressable
                      key={mode}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setFilterMode(mode);
                      }}
                      accessibilityLabel={accessibilityLabel}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isActive }}
                      className={`px-4 py-2 rounded-full flex-row items-center gap-1.5 ${isActive ? 'bg-orange-500' : 'bg-stone-200 dark:bg-stone-800'}`}
                    >
                      <Text className={`text-sm font-medium capitalize ${isActive ? 'text-white' : 'text-stone-600 dark:text-stone-400'}`}>
                        {mode}
                      </Text>
                      {count > 0 && (mode === 'overdue' || mode === 'frozen') && (
                        <View className={`px-1.5 py-0.5 rounded-full min-w-[20px] items-center ${isActive ? 'bg-white/30' : mode === 'overdue' ? 'bg-amber-500/30' : 'bg-red-500/30'}`}>
                          <Text className={`text-xs font-bold ${isActive ? 'text-white' : mode === 'overdue' ? 'text-amber-500' : 'text-red-500'}`}>
                            {count}
                          </Text>
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </Animated.View>

            {/* Search */}
            <Animated.View entering={FadeInDown.delay(300).duration(600)} className="px-5 mt-4">
              <View className="bg-white/80 dark:bg-stone-900/80 rounded-xl flex-row items-center px-4 border border-stone-200 dark:border-stone-800">
                <Search size={20} color="#78716c" />
                <TextInput
                  accessibilityLabel="Search customers"
                  className="flex-1 py-3 px-3 text-stone-900 dark:text-white text-base"
                  placeholder="Search customers..."
                  placeholderTextColor="#78716c"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery ? (
                  <Pressable onPress={() => setSearchQuery('')} accessibilityLabel="Clear search" accessibilityRole="button">
                    <X size={18} color="#78716c" />
                  </Pressable>
                ) : null}
              </View>
            </Animated.View>

            {/* Customer count */}
            <View className="px-5 mt-4">
              <Text className="text-stone-500 dark:text-stone-500 text-sm mb-3">
                {filteredCustomers.length} customer{filteredCustomers.length !== 1 ? 's' : ''}
              </Text>
            </View>
          </>
        }
        ListEmptyComponent={
          customers.length === 0 ? (
            <View className="mx-5 bg-white/60 dark:bg-stone-900/60 rounded-2xl border border-stone-200 dark:border-stone-800">
              <EmptyState
                icon={Users}
                title="No customers yet"
                description="Add your first customer to start tracking credit"
                buttonLabel="Add Customer"
                onButtonPress={() => setShowAddModal(true)}
              />
            </View>
          ) : filteredCustomers.length === 0 ? (
            <View className="mx-5 bg-white/60 dark:bg-stone-900/60 rounded-2xl border border-stone-200 dark:border-stone-800 p-6 items-center">
              <Text className="text-stone-500 text-sm">No {filterMode === 'all' ? 'matching' : filterMode} customers</Text>
            </View>
          ) : null
        }
        renderItem={({ item: customer, index }) => {
          const risk = getCreditRisk(customer);
          const hasDebt = customer.currentCredit > 0;
          const isFrozen = customer.creditFrozen;

          return (
            <View className="px-5 mb-3">
              <Animated.View
                entering={FadeIn.delay(Math.min(index * 30, 300)).duration(400)}
                layout={Layout.springify()}
              >
                <Pressable
                  onPress={() => openCustomerDetail(customer)}
                  className={`bg-white/80 dark:bg-stone-900/80 rounded-xl p-4 border-l-4 border ${risk.borderColor} active:scale-[0.99]`}
                  style={{ borderRightWidth: 1, borderTopWidth: 1, borderBottomWidth: 1, borderRightColor: isDark ? '#292524' : '#e7e5e4', borderTopColor: isDark ? '#292524' : '#e7e5e4', borderBottomColor: isDark ? '#292524' : '#e7e5e4' }}
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-3 flex-1">
                      {(() => {
                        const letter = customer.name.charAt(0).toUpperCase();
                        return (
                          <View className={`w-12 h-12 rounded-full items-center justify-center ${risk.bgColor}`}>
                            <Text className={`text-lg font-bold ${risk.color}`}>{letter}</Text>
                          </View>
                        );
                      })()}
                      <View className="flex-1">
                        <View className="flex-row items-center gap-2">
                          <Text className="text-stone-900 dark:text-white font-medium text-base">{customer.name}</Text>
                          {isFrozen && (
                            <View className="bg-red-500/20 px-2 py-0.5 rounded-full">
                              <Text className="text-red-400 text-[10px] font-bold">FROZEN</Text>
                            </View>
                          )}
                        </View>
                        {hasDebt ? (
                          <Text className={`text-xs mt-0.5 ${risk.color}`}>{risk.label}</Text>
                        ) : (
                          <Text className="text-stone-500 text-xs mt-0.5">{customer.phone || 'No phone'}</Text>
                        )}
                      </View>
                    </View>
                    <View className="items-end">
                      {hasDebt ? (
                        <>
                          <Text style={{ fontFamily: 'Poppins-Bold' }} className="text-red-400 font-bold text-lg">{formatNaira(customer.currentCredit)}</Text>
                          <Text className="text-stone-500 dark:text-stone-400 text-xs">/ {formatNaira(customer.creditLimit)}</Text>
                        </>
                      ) : (
                        <View className="bg-emerald-500/20 px-2 py-1 rounded">
                          <Text className="text-emerald-400 text-xs font-medium">Clear</Text>
                        </View>
                      )}
                    </View>
                    <ChevronRight size={20} color="#57534e" className="ml-2" />
                  </View>
                </Pressable>
              </Animated.View>
            </View>
          );
        }}
      />

      {/* Add Customer Modal */}
      <Modal visible={showAddModal} transparent animationType="slide" onRequestClose={() => setShowAddModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
          <Pressable className="flex-1 bg-black/60" onPress={() => setShowAddModal(false)} />
          <View className="bg-white dark:bg-stone-900 rounded-t-3xl" style={{ paddingBottom: insets.bottom + 20 }}>
            <View className="p-6">
              <View className="flex-row items-center justify-between mb-6">
                <Text className="text-stone-900 dark:text-white text-xl font-bold">Add Customer</Text>
                <Pressable onPress={() => setShowAddModal(false)} accessibilityLabel="Close" accessibilityRole="button">
                  <X size={24} color="#78716c" />
                </Pressable>
              </View>
              <View className="gap-4">
                <View>
                  <Text className="text-stone-500 dark:text-stone-400 text-sm mb-2">Customer Name *</Text>
                  <TextInput
                    className="bg-stone-100 dark:bg-stone-800 rounded-xl px-4 py-3 text-stone-900 dark:text-white"
                    placeholder={placeholders.customerName}
                    placeholderTextColor="#57534e"
                    value={formData.name}
                    onChangeText={(text) => setFormData({ ...formData, name: text })}
                  />
                </View>
                <View>
                  <Text className="text-stone-500 dark:text-stone-400 text-sm mb-2">Phone Number</Text>
                  <TextInput
                    className="bg-stone-100 dark:bg-stone-800 rounded-xl px-4 py-3 text-stone-900 dark:text-white"
                    placeholder="e.g. 08012345678"
                    placeholderTextColor="#57534e"
                    keyboardType="phone-pad"
                    value={formData.phone}
                    onChangeText={(text) => setFormData({ ...formData, phone: text })}
                  />
                </View>
                <View>
                  <Text className="text-stone-500 dark:text-stone-400 text-sm mb-2">Credit Limit (₦)</Text>
                  <TextInput
                    className="bg-stone-100 dark:bg-stone-800 rounded-xl px-4 py-3 text-stone-900 dark:text-white"
                    placeholder="e.g. 50000"
                    placeholderTextColor="#57534e"
                    keyboardType="numeric"
                    value={formData.creditLimit}
                    onChangeText={(text) => setFormData({ ...formData, creditLimit: text })}
                  />
                </View>
                <Pressable onPress={handleAddCustomer} className="bg-orange-500 py-4 rounded-xl active:opacity-90 mt-2">
                  <Text className="text-white font-semibold text-center text-lg">Add Customer</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Customer Detail Modal */}
      <Modal visible={showCustomerModal} transparent animationType="slide" onRequestClose={() => setShowCustomerModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
          <Pressable className="flex-1 bg-black/60" onPress={() => setShowCustomerModal(false)} />
          <View className="bg-white dark:bg-stone-900 rounded-t-3xl max-h-[85%]" style={{ paddingBottom: insets.bottom + 20 }}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {selectedCustomer && (() => {
                const risk = getCreditRisk(selectedCustomer);
                const freezeCheck = shouldFreezeCredit(selectedCustomer);
                const recentlyReminded = wasRemindedRecently(selectedCustomer);
                const reminderDays = daysSinceReminder(selectedCustomer);

                return (
                  <View className="p-6">
                    <View className="flex-row items-center justify-between mb-4">
                      <View className="flex-row items-center gap-3">
                        <Text className="text-stone-900 dark:text-white text-xl font-bold">{selectedCustomer.name}</Text>
                        {selectedCustomer.creditFrozen && (
                          <View className="bg-red-500/20 px-2 py-1 rounded-full">
                            <Text className="text-red-400 text-xs font-bold">FROZEN</Text>
                          </View>
                        )}
                      </View>
                      <Pressable onPress={() => setShowCustomerModal(false)} accessibilityLabel="Close" accessibilityRole="button">
                        <X size={24} color="#78716c" />
                      </Pressable>
                    </View>

                    {/* Risk Badge */}
                    {selectedCustomer.currentCredit > 0 && (
                      <View className={`${risk.bgColor} rounded-xl p-3 mb-4 flex-row items-center gap-2`}>
                        <AlertCircle size={16} color={risk.color.includes('red') ? '#ef4444' : risk.color.includes('orange') ? '#f97316' : risk.color.includes('amber') ? '#f59e0b' : '#10b981'} />
                        <Text className={`${risk.color} text-sm font-medium flex-1`}>{risk.label}</Text>
                        <Text className={`${risk.color} text-xs`}>Score: {risk.score}/100</Text>
                      </View>
                    )}

                    {/* Customer Info */}
                    <View className="bg-stone-100/50 dark:bg-stone-800/50 rounded-xl p-4 mb-4">
                      <View className="flex-row items-center gap-2 mb-3">
                        <Phone size={16} color="#78716c" />
                        <Text className="text-stone-600 dark:text-stone-400">{selectedCustomer.phone || 'No phone'}</Text>
                      </View>
                      <View className="flex-row justify-between">
                        <View>
                          <Text className="text-stone-500 dark:text-stone-500 text-xs uppercase">Outstanding</Text>
                          <Text style={{ fontFamily: 'Poppins-Bold' }} className="text-red-400 text-2xl font-bold">{formatNaira(selectedCustomer.currentCredit)}</Text>
                        </View>
                        <View className="items-end">
                          <Text className="text-stone-500 dark:text-stone-500 text-xs uppercase">Credit Limit</Text>
                          <Text className="text-stone-900 dark:text-white text-xl font-semibold">{formatNaira(selectedCustomer.creditLimit)}</Text>
                        </View>
                      </View>
                    </View>

                    {/* Credit Freeze */}
                    <View className={`rounded-xl p-4 mb-4 border ${selectedCustomer.creditFrozen ? 'bg-red-500/10 border-red-500/30' : 'bg-stone-100/50 dark:bg-stone-800/50 border-stone-200 dark:border-stone-800'}`}>
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center gap-3 flex-1">
                          {selectedCustomer.creditFrozen ? (
                            <ShieldOff size={20} color="#ef4444" />
                          ) : (
                            <ShieldCheck size={20} color="#10b981" />
                          )}
                          <View>
                            <Text className="text-stone-900 dark:text-white font-medium">
                              {selectedCustomer.creditFrozen ? 'Credit Frozen' : 'Credit Active'}
                            </Text>
                            <Text className="text-stone-500 text-xs">
                              {selectedCustomer.creditFrozen
                                ? 'Cannot buy on credit'
                                : freezeCheck.frozen
                                  ? `⚠️ Suggested: ${freezeCheck.reason}`
                                  : 'Can buy on credit'}
                            </Text>
                          </View>
                        </View>
                        <Pressable
                          onPress={() => handleToggleFreeze(selectedCustomer)}
                          className={`px-4 py-2 rounded-lg ${selectedCustomer.creditFrozen ? 'bg-emerald-500' : 'bg-red-500'}`}
                        >
                          <Text className="text-white text-sm font-semibold">
                            {selectedCustomer.creditFrozen ? 'Unfreeze' : 'Freeze'}
                          </Text>
                        </Pressable>
                      </View>
                    </View>

                    {/* Action Buttons */}
                    <View className="flex-row gap-3 mb-4">
                      <Pressable
                        onPress={() => {
                          setShowCustomerModal(false);
                          setShowPaymentModal(true);
                        }}
                        className="flex-1 flex-row items-center justify-center gap-2 bg-emerald-500/20 border border-emerald-500/40 py-3 rounded-xl active:opacity-90"
                      >
                        <Banknote size={18} color="#10b981" />
                        <Text className="text-emerald-400 font-semibold">Record Payment</Text>
                      </Pressable>
                      {selectedCustomer.phone && selectedCustomer.currentCredit > 0 && (
                        <Pressable
                          onPress={() => {
                            if (recentlyReminded) {
                              setReminderInfoDays(reminderDays ?? 0);
                              setShowReminderInfo(true);
                              return;
                            }
                            sendWhatsAppReminder(selectedCustomer);
                          }}
                          className={`flex-row items-center justify-center gap-2 px-4 py-3 rounded-xl ${recentlyReminded ? 'bg-stone-200 dark:bg-stone-800 border border-stone-300 dark:border-stone-700' : 'bg-green-500/20 border border-green-500/40'} active:opacity-90`}
                        >
                          <MessageCircle size={18} color={recentlyReminded ? '#78716c' : '#22c55e'} />
                          {recentlyReminded && (
                            <Text className="text-stone-500 text-xs">{reminderDays}d ago</Text>
                          )}
                        </Pressable>
                      )}
                    </View>

                    {/* Last Reminded */}
                    {selectedCustomer.lastReminderSent && (
                      <Text className="text-stone-400 text-xs mb-4">
                        Last reminded: {new Date(selectedCustomer.lastReminderSent).toLocaleDateString('en-NG', { month: 'short', day: 'numeric' })}
                        {reminderDays !== null && ` (${reminderDays}d ago)`}
                      </Text>
                    )}

                    {/* Transaction History */}
                    <Text className="text-stone-900 dark:text-white font-semibold mb-3">Transaction History</Text>
                    {selectedCustomer.transactions.length === 0 ? (
                      <View className="bg-stone-100/30 dark:bg-stone-800/30 rounded-xl p-4 items-center">
                        <Text className="text-stone-500">No transactions yet</Text>
                      </View>
                    ) : (
                      <View className="gap-2">
                        {selectedCustomer.transactions.map((tx) => (
                          <View
                            key={tx.id}
                            className="bg-stone-100/30 dark:bg-stone-800/30 rounded-xl p-3 flex-row items-center justify-between"
                          >
                            <View className="flex-row items-center gap-3">
                              <View className={`w-8 h-8 rounded-full items-center justify-center ${tx.type === 'payment' ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
                                {tx.type === 'payment' ? (
                                  <TrendingDown size={16} color="#10b981" />
                                ) : (
                                  <TrendingUp size={16} color="#ef4444" />
                                )}
                              </View>
                              <View>
                                <Text className="text-stone-900 dark:text-white font-medium">
                                  {tx.type === 'payment' ? 'Payment' : 'Credit'}
                                </Text>
                                <Text className="text-stone-500 dark:text-stone-500 text-xs">
                                  {new Date(tx.createdAt).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </Text>
                              </View>
                            </View>
                            <Text className={`font-bold ${tx.type === 'payment' ? 'text-emerald-400' : 'text-red-400'}`}>
                              {tx.type === 'payment' ? '-' : '+'}{formatNaira(tx.amount)}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                );
              })()}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Payment Modal */}
      <Modal visible={showPaymentModal} transparent animationType="slide" onRequestClose={handleClosePaymentModal}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
          <Pressable className="flex-1 bg-black/60" onPress={handleClosePaymentModal} />
          <View className="bg-white dark:bg-stone-900 rounded-t-3xl" style={{ paddingBottom: insets.bottom + 20 }}>
            <View className="p-6">
              {paymentSuccess ? (
                /* ── Success State ── */
                <View>
                  <View className="items-center mb-6">
                    <View className="w-16 h-16 rounded-full bg-emerald-500/20 items-center justify-center mb-3">
                      <CheckCircle size={36} color="#10b981" />
                    </View>
                    <Text className="text-stone-900 dark:text-white text-xl font-bold mb-1">Payment Recorded!</Text>
                    <Text className="text-stone-500 dark:text-stone-400 text-sm">
                      {selectedCustomer?.name}
                    </Text>
                  </View>

                  <View className="bg-stone-100/50 dark:bg-stone-800/50 rounded-xl p-4 mb-4">
                    <View className="flex-row justify-between mb-2">
                      <Text className="text-stone-500 dark:text-stone-400 text-sm">Amount Paid</Text>
                      <Text className="text-emerald-400 font-bold text-lg">{formatNaira(paymentSuccess.amountPaid)}</Text>
                    </View>
                    <View className="flex-row justify-between mb-2">
                      <Text className="text-stone-500 dark:text-stone-400 text-sm">Method</Text>
                      <Text className="text-stone-900 dark:text-white font-medium text-sm">
                        {paymentSuccess.paymentMethod.charAt(0).toUpperCase() + paymentSuccess.paymentMethod.slice(1)}
                      </Text>
                    </View>
                    <View className="border-t border-stone-200 dark:border-stone-700 mt-2 pt-2">
                      <View className="flex-row justify-between mb-1">
                        <Text className="text-stone-400 text-xs">Previous Balance</Text>
                        <Text className="text-stone-400 text-xs">{formatNaira(paymentSuccess.previousBalance)}</Text>
                      </View>
                      <View className="flex-row justify-between">
                        <Text className="text-stone-900 dark:text-white font-bold text-sm">Remaining Balance</Text>
                        <Text className={`font-bold text-sm ${paymentSuccess.newBalance <= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {paymentSuccess.newBalance <= 0 ? '✅ Cleared!' : formatNaira(paymentSuccess.newBalance)}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View className="gap-3">
                    <Pressable
                      onPress={handleSharePaymentReceipt}
                      className="flex-row items-center justify-center gap-2 py-4 rounded-xl active:opacity-90"
                      style={{ backgroundColor: '#25D366' }}
                    >
                      <MessageCircle size={20} color="#ffffff" />
                      <Text className="text-white font-semibold text-base">Share via WhatsApp</Text>
                    </Pressable>
                    <Pressable
                      onPress={handleSharePaymentPdf}
                      className="flex-row items-center justify-center gap-2 bg-white/80 dark:bg-stone-800 py-4 rounded-xl active:opacity-90 border border-orange-200 dark:border-orange-900/40"
                    >
                      <FileText size={18} color="#e05e1b" />
                      <Text className="text-orange-600 dark:text-orange-400 font-medium">Share as PDF</Text>
                    </Pressable>
                    <Pressable
                      onPress={handleClosePaymentModal}
                      className="bg-stone-200 dark:bg-stone-800 py-4 rounded-xl active:opacity-90"
                    >
                      <Text className="text-stone-900 dark:text-white font-semibold text-center text-base">Done</Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                /* ── Payment Form ── */
                <View>
                  <View className="flex-row items-center justify-between mb-6">
                    <Text className="text-stone-900 dark:text-white text-xl font-bold">Record Payment</Text>
                    <Pressable onPress={handleClosePaymentModal} accessibilityLabel="Close" accessibilityRole="button">
                      <X size={24} color="#78716c" />
                    </Pressable>
                  </View>
                  {selectedCustomer && (
                    <>
                      <View className="bg-stone-100/50 dark:bg-stone-800/50 rounded-xl p-4 mb-4">
                        <Text className="text-stone-400 text-sm mb-1">{selectedCustomer.name}</Text>
                        <Text className="text-stone-900 dark:text-white text-lg">
                          Outstanding: <Text className="text-red-400 font-bold">{formatNaira(selectedCustomer.currentCredit)}</Text>
                        </Text>
                      </View>
                      <View className="gap-4">
                        <View>
                          <Text className="text-stone-500 dark:text-stone-400 text-sm mb-2">Payment Amount (₦)</Text>
                          <TextInput
                            style={{ fontFamily: 'Poppins-Bold' }}
                            className="bg-stone-100 dark:bg-stone-800 rounded-xl px-4 py-4 text-stone-900 dark:text-white text-center text-2xl font-bold"
                            placeholder="₦0"
                            placeholderTextColor="#57534e"
                            keyboardType="numeric"
                            value={paymentAmount}
                            onChangeText={setPaymentAmount}
                            autoFocus
                          />
                        </View>
                        <View>
                          <Text className="text-stone-500 dark:text-stone-400 text-sm mb-2">Note (Optional)</Text>
                          <TextInput
                            className="bg-stone-100 dark:bg-stone-800 rounded-xl px-4 py-3 text-stone-900 dark:text-white"
                            placeholder="e.g. Partial payment"
                            placeholderTextColor="#57534e"
                            value={paymentNote}
                            onChangeText={setPaymentNote}
                          />
                        </View>
                        {/* Quick amounts */}
                        <View className="flex-row gap-2">
                          {[5000, 10000, selectedCustomer.currentCredit].map((amount) => (
                            <Pressable
                              key={amount}
                              onPress={() => setPaymentAmount(amount.toString())}
                              className="flex-1 bg-stone-200 dark:bg-stone-800 py-2 rounded-lg active:opacity-70"
                            >
                              <Text className="text-stone-600 dark:text-stone-400 text-center text-sm">
                                {amount === selectedCustomer.currentCredit ? 'Full' : formatNaira(amount)}
                              </Text>
                            </Pressable>
                          ))}
                        </View>
                        {/* Payment Method */}
                        <View>
                          <Text className="text-stone-500 dark:text-stone-400 text-sm mb-2">Payment Method</Text>
                          <View className="flex-row gap-2">
                            {([
                              { key: 'cash' as const, label: 'Cash', icon: Banknote, color: '#10b981' },
                              { key: 'transfer' as const, label: 'Transfer', icon: Smartphone, color: '#3b82f6' },
                              { key: 'pos' as const, label: 'POS', icon: CreditCard, color: '#8b5cf6' },
                            ]).map((method) => {
                              const isActive = paymentMethod === method.key;
                              const IconComp = method.icon;
                              return (
                                <Pressable
                                  key={method.key}
                                  onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    setPaymentMethod(method.key);
                                  }}
                                  className={`flex-1 flex-row items-center justify-center gap-2 py-3 rounded-xl border ${
                                    isActive
                                      ? 'border-emerald-500 bg-emerald-500/10'
                                      : 'border-stone-300 dark:border-stone-700 bg-stone-100 dark:bg-stone-800'
                                  }`}
                                >
                                  <IconComp size={16} color={isActive ? method.color : '#78716c'} />
                                  <Text className={`text-sm font-medium ${isActive ? 'text-emerald-400' : 'text-stone-500 dark:text-stone-400'}`}>
                                    {method.label}
                                  </Text>
                                </Pressable>
                              );
                            })}
                          </View>
                        </View>
                        <Pressable onPress={handleRecordPayment} className="bg-emerald-500 py-4 rounded-xl active:opacity-90">
                          <Text className="text-white font-semibold text-center text-lg">Confirm Payment</Text>
                        </Pressable>
                      </View>
                    </>
                  )}
                </View>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Freeze Confirmation Modal */}
      <Modal
        visible={showFreezeConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFreezeConfirm(false)}
      >
        <Pressable
          className="flex-1 bg-black/60 items-center justify-center px-8"
          onPress={() => setShowFreezeConfirm(false)}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View className="bg-white dark:bg-stone-900 rounded-2xl p-6 w-full items-center">
              <View className="w-14 h-14 rounded-full bg-red-500/20 items-center justify-center mb-4">
                <ShieldOff size={28} color="#ef4444" />
              </View>
              <Text className="text-stone-900 dark:text-white text-lg font-bold mb-2">Freeze Credit?</Text>
              <Text className="text-stone-500 dark:text-stone-400 text-center text-sm mb-6">
                Stop credit sales to {freezeTarget?.name}? They won't be able to buy on credit until you unfreeze.
              </Text>
              <View className="flex-row gap-3 w-full">
                <Pressable
                  onPress={() => setShowFreezeConfirm(false)}
                  className="flex-1 bg-stone-200 dark:bg-stone-800 py-3.5 rounded-xl active:opacity-90"
                >
                  <Text className="text-stone-900 dark:text-white font-semibold text-center">Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={confirmFreeze}
                  className="flex-1 bg-red-500 py-3.5 rounded-xl active:opacity-90"
                >
                  <Text className="text-white font-semibold text-center">Freeze</Text>
                </Pressable>
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Reminder Info Modal */}
      <Modal
        visible={showReminderInfo}
        transparent
        animationType="fade"
        onRequestClose={() => setShowReminderInfo(false)}
      >
        <Pressable
          className="flex-1 bg-black/60 items-center justify-center px-8"
          onPress={() => setShowReminderInfo(false)}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View className="bg-white dark:bg-stone-900 rounded-2xl p-6 w-full items-center">
              <View className="w-14 h-14 rounded-full bg-amber-500/20 items-center justify-center mb-4">
                <Clock size={28} color="#f59e0b" />
              </View>
              <Text className="text-stone-900 dark:text-white text-lg font-bold mb-2">Reminded Recently</Text>
              <Text className="text-stone-500 dark:text-stone-400 text-center text-sm mb-6">
                Last reminder was {reminderInfoDays} day{reminderInfoDays !== 1 ? 's' : ''} ago. Wait a bit before sending another.
              </Text>
              <Pressable
                onPress={() => setShowReminderInfo(false)}
                className="bg-orange-500 w-full py-3.5 rounded-xl active:opacity-90"
              >
                <Text className="text-white font-semibold text-center">Got it</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
