import { View, Text, ScrollView, Pressable, TextInput, Modal, KeyboardAvoidingView, Platform, Linking } from 'react-native';
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
  MessageCircle
} from 'lucide-react-native';
import { useRetailStore, formatNaira, type Customer } from '@/store/retailStore';
import { useState, useMemo, useCallback } from 'react';
import Animated, { FadeInDown, FadeIn, Layout } from 'react-native-reanimated';
import { useColorScheme } from 'nativewind';
import * as Haptics from 'expo-haptics';
import EmptyState from '@/components/EmptyState';

export default function CreditBookScreen() {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNote, setPaymentNote] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    creditLimit: '50000',
  });

  const customers = useRetailStore((s) => s.customers);
  const addCustomer = useRetailStore((s) => s.addCustomer);
  const recordCreditPayment = useRetailStore((s) => s.recordCreditPayment);
  const getTotalOutstandingCredit = useRetailStore((s) => s.getTotalOutstandingCredit);

  const totalOutstanding = useMemo(() => getTotalOutstandingCredit(), [getTotalOutstandingCredit, customers]);

  const filteredCustomers = useMemo(() => {
    return customers
      .filter((c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone.includes(searchQuery)
      )
      .sort((a, b) => b.currentCredit - a.currentCredit);
  }, [customers, searchQuery]);

  const customersWithDebt = useMemo(() => {
    return customers.filter((c) => c.currentCredit > 0).length;
  }, [customers]);

  const handleAddCustomer = useCallback(() => {
    if (!formData.name.trim()) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addCustomer({
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      creditLimit: parseFloat(formData.creditLimit) || 50000,
    });

    setFormData({ name: '', phone: '', creditLimit: '50000' });
    setShowAddModal(false);
  }, [formData, addCustomer]);

  const handleRecordPayment = useCallback(() => {
    if (!selectedCustomer || !paymentAmount) return;

    const amount = parseFloat(paymentAmount) || 0;
    if (amount <= 0) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    recordCreditPayment(selectedCustomer.id, amount, paymentNote || undefined);
    setPaymentAmount('');
    setPaymentNote('');
    setShowPaymentModal(false);

    // Refresh selected customer
    const updated = customers.find((c) => c.id === selectedCustomer.id);
    if (updated) setSelectedCustomer(updated);
  }, [selectedCustomer, paymentAmount, paymentNote, recordCreditPayment, customers]);

  const openCustomerDetail = useCallback((customer: Customer) => {
    setSelectedCustomer(customer);
    setShowCustomerModal(true);
  }, []);

  const sendWhatsAppReminder = useCallback((customer: Customer) => {
    const message = `Hello ${customer.name}, this is a friendly reminder that you have an outstanding balance of ${formatNaira(customer.currentCredit)} at our shop. Please visit us to settle when convenient. Thank you!`;
    const url = `whatsapp://send?phone=234${customer.phone.slice(1)}&text=${encodeURIComponent(message)}`;
    Linking.openURL(url).catch(() => {
      // WhatsApp not installed
    });
  }, []);

  return (
    <View className="flex-1 bg-stone-50 dark:bg-stone-950">
      <LinearGradient
        colors={isDark ? ['#292524', '#1c1917', '#0c0a09'] : ['#f5f5f4', '#fafaf9', '#ffffff']}
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
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-stone-500 text-sm font-semibold tracking-wide">
                Credit Book
              </Text>
              <Pressable
                onPress={() => setShowAddModal(true)}
                className="bg-orange-500 w-8 h-8 rounded-full items-center justify-center active:scale-95"
              >
                <Plus size={18} color="white" />
              </Pressable>
            </View>
            <Text className="text-stone-900 dark:text-white text-3xl font-extrabold tracking-tight">
              Credit Book
            </Text>
          </Animated.View>
        </View>

        {/* Stats Cards */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(600)}
          className="flex-row mx-5 mt-6 gap-3"
        >
          <View className="flex-1 bg-red-500/10 rounded-2xl p-4 border border-red-500/30">
            <View className="flex-row items-center gap-2 mb-2">
              <AlertCircle size={16} color="#ef4444" />
              <Text className="text-red-400 text-xs font-semibold tracking-wide">Total Owed</Text>
            </View>
            <Text className="text-red-400 text-2xl font-bold">{formatNaira(totalOutstanding)}</Text>
          </View>
          <View className="flex-1 bg-white/80 dark:bg-stone-900/80 rounded-2xl p-4 border border-stone-200 dark:border-stone-800">
            <View className="flex-row items-center gap-2 mb-2">
              <Users size={16} color="#3b82f6" />
              <Text className="text-stone-500 text-xs font-semibold tracking-wide">With Credit</Text>
            </View>
            <Text className="text-stone-900 dark:text-white text-2xl font-bold">{customersWithDebt} / {customers.length}</Text>
          </View>
        </Animated.View>

        {/* Search */}
        <Animated.View
          entering={FadeInDown.delay(300).duration(600)}
          className="px-5 mt-4"
        >
          <View className="bg-white/80 dark:bg-stone-900/80 rounded-xl flex-row items-center px-4 border border-stone-200 dark:border-stone-800">
            <Search size={20} color="#78716c" />
            <TextInput
              className="flex-1 py-3 px-3 text-stone-900 dark:text-white text-base"
              placeholder="Search customers..."
              placeholderTextColor="#78716c"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery && (
              <Pressable onPress={() => setSearchQuery('')}>
                <X size={18} color="#78716c" />
              </Pressable>
            )}
          </View>
        </Animated.View>

        {/* Customers List */}
        <Animated.View
          entering={FadeInDown.delay(400).duration(600)}
          className="px-5 mt-4"
        >
          <Text className="text-stone-500 text-sm mb-3">
            {filteredCustomers.length} customer{filteredCustomers.length !== 1 ? 's' : ''}
          </Text>
          {filteredCustomers.length === 0 && customers.length === 0 && (
            <View className="bg-white/60 dark:bg-stone-900/60 rounded-2xl border border-stone-200 dark:border-stone-800">
              <EmptyState
                icon={Users}
                title="No customers yet"
                description="Add your first customer to start tracking credit"
                buttonLabel="Add Customer"
                onButtonPress={() => setShowAddModal(true)}
              />
            </View>
          )}
          <View className="gap-3">
            {filteredCustomers.map((customer, index) => {
              const hasDebt = customer.currentCredit > 0;
              const nearLimit = customer.currentCredit >= customer.creditLimit * 0.8;

              return (
                <Animated.View
                  key={customer.id}
                  entering={FadeIn.delay(100 + index * 30).duration(400)}
                  layout={Layout.springify()}
                >
                  <Pressable
                    onPress={() => openCustomerDetail(customer)}
                    className={`bg-white/80 dark:bg-stone-900/80 rounded-xl p-4 border ${
                      nearLimit ? 'border-red-500/50' : hasDebt ? 'border-amber-500/30' : 'border-stone-200 dark:border-stone-800'
                    } active:scale-[0.99]`}
                  >
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center gap-3 flex-1">
                        {(() => {
                          const letter = customer.name.charAt(0).toUpperCase();
                          const avatarColors: Record<string, { bg: string; text: string }> = {
                            A: { bg: 'bg-blue-500/20', text: 'text-blue-400' },
                            B: { bg: 'bg-emerald-500/20', text: 'text-emerald-400' },
                            C: { bg: 'bg-purple-500/20', text: 'text-purple-400' },
                            D: { bg: 'bg-pink-500/20', text: 'text-pink-400' },
                            E: { bg: 'bg-cyan-500/20', text: 'text-cyan-400' },
                            F: { bg: 'bg-orange-500/20', text: 'text-orange-400' },
                            G: { bg: 'bg-teal-500/20', text: 'text-teal-400' },
                            H: { bg: 'bg-indigo-500/20', text: 'text-indigo-400' },
                            I: { bg: 'bg-rose-500/20', text: 'text-rose-400' },
                            J: { bg: 'bg-amber-500/20', text: 'text-amber-400' },
                          };
                          const defaultColor = { bg: 'bg-stone-500/20', text: 'text-stone-400' };
                          const color = avatarColors[letter] || defaultColor;
                          return (
                            <View className={`w-12 h-12 rounded-full items-center justify-center ${color.bg}`}>
                              <Text className={`text-lg font-bold ${color.text}`}>{letter}</Text>
                            </View>
                          );
                        })()}
                        <View className="flex-1">
                          <Text className="text-stone-900 dark:text-white font-medium text-base">{customer.name}</Text>
                          <Text className="text-stone-500 text-sm">{customer.phone}</Text>
                        </View>
                      </View>
                      <View className="items-end">
                        {hasDebt ? (
                          <>
                            <Text className="text-red-400 font-bold text-lg">
                              {formatNaira(customer.currentCredit)}
                            </Text>
                            <Text className="text-stone-600 text-xs">
                              / {formatNaira(customer.creditLimit)}
                            </Text>
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
              );
            })}
          </View>
        </Animated.View>
      </ScrollView>

      {/* Add Customer Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <Pressable
            className="flex-1 bg-black/60"
            onPress={() => setShowAddModal(false)}
          />
          <View className="bg-white dark:bg-stone-900 rounded-t-3xl" style={{ paddingBottom: insets.bottom + 20 }}>
            <View className="p-6">
              <View className="flex-row items-center justify-between mb-6">
                <Text className="text-stone-900 dark:text-white text-xl font-bold">Add Customer</Text>
                <Pressable onPress={() => setShowAddModal(false)}>
                  <X size={24} color="#78716c" />
                </Pressable>
              </View>

              <View className="gap-4">
                <View>
                  <Text className="text-stone-400 text-sm mb-2">Customer Name *</Text>
                  <TextInput
                    className="bg-stone-100 dark:bg-stone-800 rounded-xl px-4 py-3 text-stone-900 dark:text-white"
                    placeholder="e.g. Mama Ngozi"
                    placeholderTextColor="#57534e"
                    value={formData.name}
                    onChangeText={(text) => setFormData({ ...formData, name: text })}
                  />
                </View>

                <View>
                  <Text className="text-stone-400 text-sm mb-2">Phone Number</Text>
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
                  <Text className="text-stone-400 text-sm mb-2">Credit Limit (₦)</Text>
                  <TextInput
                    className="bg-stone-100 dark:bg-stone-800 rounded-xl px-4 py-3 text-stone-900 dark:text-white"
                    placeholder="50000"
                    placeholderTextColor="#57534e"
                    keyboardType="numeric"
                    value={formData.creditLimit}
                    onChangeText={(text) => setFormData({ ...formData, creditLimit: text })}
                  />
                </View>

                <Pressable
                  onPress={handleAddCustomer}
                  className="bg-orange-500 py-4 rounded-xl active:opacity-90 mt-2"
                >
                  <Text className="text-white font-semibold text-center text-lg">Add Customer</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Customer Detail Modal */}
      <Modal
        visible={showCustomerModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCustomerModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <Pressable
            className="flex-1 bg-black/60"
            onPress={() => setShowCustomerModal(false)}
          />
          <View className="bg-white dark:bg-stone-900 rounded-t-3xl max-h-[80%]" style={{ paddingBottom: insets.bottom + 20 }}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {selectedCustomer && (
                <View className="p-6">
                  <View className="flex-row items-center justify-between mb-6">
                    <Text className="text-stone-900 dark:text-white text-xl font-bold">{selectedCustomer.name}</Text>
                    <Pressable onPress={() => setShowCustomerModal(false)}>
                      <X size={24} color="#78716c" />
                    </Pressable>
                  </View>

                  {/* Customer Info */}
                  <View className="bg-stone-100/50 dark:bg-stone-800/50 rounded-xl p-4 mb-4">
                    <View className="flex-row items-center gap-2 mb-3">
                      <Phone size={16} color="#78716c" />
                      <Text className="text-stone-600 dark:text-stone-400">{selectedCustomer.phone || 'No phone'}</Text>
                    </View>
                    <View className="flex-row justify-between">
                      <View>
                        <Text className="text-stone-500 text-xs uppercase">Outstanding</Text>
                        <Text className="text-red-400 text-2xl font-bold">
                          {formatNaira(selectedCustomer.currentCredit)}
                        </Text>
                      </View>
                      <View className="items-end">
                        <Text className="text-stone-500 text-xs uppercase">Credit Limit</Text>
                        <Text className="text-stone-900 dark:text-white text-xl font-semibold">
                          {formatNaira(selectedCustomer.creditLimit)}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Action Buttons */}
                  <View className="flex-row gap-3 mb-6">
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
                    {selectedCustomer.phone && (
                      <Pressable
                        onPress={() => sendWhatsAppReminder(selectedCustomer)}
                        className="flex-row items-center justify-center gap-2 bg-green-500/20 border border-green-500/40 px-4 py-3 rounded-xl active:opacity-90"
                      >
                        <MessageCircle size={18} color="#22c55e" />
                      </Pressable>
                    )}
                  </View>

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
                            <View className={`w-8 h-8 rounded-full items-center justify-center ${
                              tx.type === 'payment' ? 'bg-emerald-500/20' : 'bg-red-500/20'
                            }`}>
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
                              <Text className="text-stone-500 text-xs">
                                {new Date(tx.createdAt).toLocaleDateString('en-NG', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </Text>
                            </View>
                          </View>
                          <Text className={`font-bold ${
                            tx.type === 'payment' ? 'text-emerald-400' : 'text-red-400'
                          }`}>
                            {tx.type === 'payment' ? '-' : '+'}{formatNaira(tx.amount)}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Payment Modal */}
      <Modal
        visible={showPaymentModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
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
                      <Text className="text-stone-400 text-sm mb-2">Payment Amount (₦)</Text>
                      <TextInput
                        className="bg-stone-100 dark:bg-stone-800 rounded-xl px-4 py-4 text-stone-900 dark:text-white text-center text-2xl font-bold"
                        placeholder="0"
                        placeholderTextColor="#57534e"
                        keyboardType="numeric"
                        value={paymentAmount}
                        onChangeText={setPaymentAmount}
                        autoFocus
                      />
                    </View>

                    <View>
                      <Text className="text-stone-400 text-sm mb-2">Note (Optional)</Text>
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
                          <Text className="text-stone-400 text-center text-sm">
                            {amount === selectedCustomer.currentCredit ? 'Full' : formatNaira(amount)}
                          </Text>
                        </Pressable>
                      ))}
                    </View>

                    <Pressable
                      onPress={handleRecordPayment}
                      className="bg-emerald-500 py-4 rounded-xl active:opacity-90"
                    >
                      <Text className="text-white font-semibold text-center text-lg">Confirm Payment</Text>
                    </Pressable>
                  </View>
                </>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
