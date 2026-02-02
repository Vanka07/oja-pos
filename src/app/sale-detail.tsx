import { View, Text, ScrollView, Pressable, Platform, Linking, Share } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useColorScheme } from 'nativewind';
import {
  ArrowLeft,
  Printer,
  MessageCircle,
  Share2,
  CreditCard,
  Banknote,
  Smartphone,
  Wallet,
  User,
  Clock,
  Hash,
} from 'lucide-react-native';
import { useRetailStore, formatNaira, generateReceiptText, type Sale } from '@/store/retailStore';
import { useOnboardingStore } from '@/store/onboardingStore';
import { usePrinterStore } from '@/store/printerStore';
import { printReceipt } from '@/lib/printerService';
import { useState, useMemo, useCallback } from 'react';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const PAYMENT_ICONS: Record<string, { icon: typeof Banknote; color: string; label: string }> = {
  cash: { icon: Banknote, color: '#10b981', label: 'Cash' },
  transfer: { icon: Smartphone, color: '#3b82f6', label: 'Transfer' },
  pos: { icon: CreditCard, color: '#8b5cf6', label: 'POS' },
  credit: { icon: Wallet, color: '#f59e0b', label: 'Credit' },
};

export default function SaleDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { id } = useLocalSearchParams<{ id: string }>();

  const sales = useRetailStore((s) => s.sales);
  const shopInfo = useOnboardingStore((s) => s.shopInfo);
  const paperSize = usePrinterStore((s) => s.paperSize);

  const [isPrinting, setIsPrinting] = useState(false);

  const sale = useMemo(() => sales.find((s) => s.id === id), [sales, id]);

  const handlePrintReceipt = useCallback(async () => {
    if (!sale || !shopInfo) return;
    setIsPrinting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await printReceipt(sale, shopInfo, paperSize);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsPrinting(false);
    }
  }, [sale, shopInfo, paperSize]);

  const shareReceiptWhatsApp = useCallback(() => {
    if (!sale || !shopInfo) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const receipt = generateReceiptText(sale, shopInfo.name, shopInfo.phone);
    const encoded = encodeURIComponent(receipt);
    if (Platform.OS === 'web') {
      window.open(`https://wa.me/?text=${encoded}`, '_blank');
    } else {
      const url = `whatsapp://send?text=${encoded}`;
      Linking.openURL(url).catch(() => {
        Share.share({ message: receipt });
      });
    }
  }, [sale, shopInfo]);

  const shareReceipt = useCallback(async () => {
    if (!sale || !shopInfo) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const receipt = generateReceiptText(sale, shopInfo.name, shopInfo.phone);
    try {
      await Share.share({ message: receipt });
    } catch {
      // Ignore
    }
  }, [sale, shopInfo]);

  const gradientColors: [string, string, string] = isDark
    ? ['#292524', '#1c1917', '#0c0a09']
    : ['#f5f5f4', '#fafaf9', '#ffffff'];

  if (!sale) {
    return (
      <View className="flex-1 bg-stone-950 items-center justify-center px-8">
        <Text className="text-white text-lg font-semibold text-center">Sale not found</Text>
        <Pressable onPress={() => router.back()} className="mt-4">
          <Text className="text-orange-500 font-medium">Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const paymentConfig = PAYMENT_ICONS[sale.paymentMethod] || PAYMENT_ICONS.cash;
  const PaymentIcon = paymentConfig.icon;
  const receiptNumber = sale.id.slice(-6).toUpperCase();

  return (
    <View className="flex-1 bg-stone-50 dark:bg-stone-950">
      <LinearGradient
        colors={gradientColors}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
      />

      {/* Header */}
      <View style={{ paddingTop: insets.top + 8 }} className="px-5 pb-2">
        <Animated.View entering={FadeInDown.delay(100).duration(600)}>
          <View className="flex-row items-center gap-3">
            <Pressable
              onPress={() => router.back()}
              className="w-10 h-10 rounded-full bg-white/10 dark:bg-stone-800/80 items-center justify-center active:opacity-70"
            >
              <ArrowLeft size={20} color={isDark ? '#fff' : '#1c1917'} />
            </Pressable>
            <View className="flex-1">
              <Text
                style={{ fontFamily: 'Poppins-ExtraBold' }}
                className="text-stone-900 dark:text-white text-2xl font-extrabold tracking-tight"
              >
                Sale Details
              </Text>
            </View>
          </View>
        </Animated.View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Receipt Info Card */}
        <Animated.View entering={FadeInDown.delay(200).duration(600)} className="mt-4">
          <View className="bg-white/60 dark:bg-stone-900/60 rounded-2xl border border-stone-200 dark:border-stone-800 p-5">
            <View className="flex-row items-center gap-3 mb-4">
              <View className="w-12 h-12 rounded-full bg-orange-500/20 items-center justify-center">
                <Hash size={22} color="#e05e1b" />
              </View>
              <View>
                <Text className="text-stone-900 dark:text-white text-lg font-bold">
                  #{receiptNumber}
                </Text>
                <Text className="text-stone-500 dark:text-stone-500 text-sm">Receipt Number</Text>
              </View>
            </View>

            <View className="flex-row gap-4">
              <View className="flex-1 flex-row items-center gap-2">
                <Clock size={14} color="#78716c" />
                <Text className="text-stone-500 dark:text-stone-400 text-sm">
                  {new Date(sale.createdAt).toLocaleDateString('en-NG', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}{' '}
                  at{' '}
                  {new Date(sale.createdAt).toLocaleTimeString('en-NG', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            </View>

            <View className="flex-row gap-4 mt-3">
              <View className="flex-row items-center gap-2">
                <PaymentIcon size={14} color={paymentConfig.color} />
                <Text style={{ color: paymentConfig.color }} className="text-sm font-medium">
                  {paymentConfig.label}
                </Text>
              </View>
              {sale.staffName && (
                <View className="flex-row items-center gap-2">
                  <User size={14} color="#78716c" />
                  <Text className="text-stone-500 dark:text-stone-400 text-sm">
                    {sale.staffName}
                  </Text>
                </View>
              )}
            </View>

            {sale.customerName && (
              <View className="mt-3 bg-amber-500/10 px-3 py-2 rounded-lg">
                <Text className="text-amber-400 text-sm font-medium">
                  Credit Sale — {sale.customerName}
                </Text>
              </View>
            )}
          </View>
        </Animated.View>

        {/* Items List */}
        <Animated.View entering={FadeInDown.delay(300).duration(600)} className="mt-4">
          <Text className="text-stone-500 dark:text-stone-500 text-xs font-semibold tracking-wide mb-2">
            ITEMS ({sale.items.length})
          </Text>
          <View className="bg-white/60 dark:bg-stone-900/60 rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden">
            {sale.items.map((item, index) => (
              <View
                key={`${item.product.id}-${index}`}
                className={`p-4 ${
                  index < sale.items.length - 1
                    ? 'border-b border-stone-200 dark:border-stone-800'
                    : ''
                }`}
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 mr-3">
                    <Text
                      className="text-stone-900 dark:text-white font-medium text-sm"
                      numberOfLines={2}
                    >
                      {item.product.name}
                    </Text>
                    <Text className="text-stone-500 dark:text-stone-500 text-xs mt-1">
                      {item.quantity} × {formatNaira(item.product.sellingPrice)}
                    </Text>
                  </View>
                  <Text className="text-stone-900 dark:text-white font-semibold text-sm">
                    {formatNaira(item.product.sellingPrice * item.quantity)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Totals */}
        <Animated.View entering={FadeInDown.delay(400).duration(600)} className="mt-4">
          <View className="bg-white/60 dark:bg-stone-900/60 rounded-2xl border border-stone-200 dark:border-stone-800 p-5">
            <View className="flex-row justify-between mb-2">
              <Text className="text-stone-500 dark:text-stone-400 text-sm">Subtotal</Text>
              <Text className="text-stone-900 dark:text-white font-medium">
                {formatNaira(sale.subtotal)}
              </Text>
            </View>
            {sale.discount > 0 && (
              <View className="flex-row justify-between mb-2">
                <Text className="text-stone-500 dark:text-stone-400 text-sm">Discount</Text>
                <Text className="text-orange-400 font-medium">
                  -{formatNaira(sale.discount)}
                </Text>
              </View>
            )}
            <View className="border-t border-stone-200 dark:border-stone-700 mt-2 pt-3 flex-row justify-between">
              <Text className="text-stone-900 dark:text-white text-lg font-bold">Total</Text>
              <Text className="text-orange-500 text-lg font-bold">
                {formatNaira(sale.total)}
              </Text>
            </View>

            {sale.cashReceived !== undefined && sale.cashReceived > 0 && (
              <View className="mt-3 pt-3 border-t border-stone-200 dark:border-stone-700">
                <View className="flex-row justify-between mb-1">
                  <Text className="text-stone-500 dark:text-stone-400 text-sm">Cash Received</Text>
                  <Text className="text-stone-700 dark:text-stone-300 font-medium">
                    {formatNaira(sale.cashReceived)}
                  </Text>
                </View>
                {sale.changeGiven !== undefined && sale.changeGiven > 0 && (
                  <View className="flex-row justify-between">
                    <Text className="text-stone-500 dark:text-stone-400 text-sm">Change</Text>
                    <Text className="text-stone-700 dark:text-stone-300 font-medium">
                      {formatNaira(sale.changeGiven)}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </Animated.View>

        {/* Action Buttons */}
        <Animated.View entering={FadeInDown.delay(500).duration(600)} className="mt-6 gap-3">
          <Pressable
            onPress={handlePrintReceipt}
            disabled={isPrinting}
            className="flex-row items-center justify-center gap-2 py-4 rounded-xl bg-orange-500 active:opacity-90"
          >
            <Printer size={20} color="#ffffff" />
            <Text className="text-white font-bold text-base">
              {isPrinting ? 'Printing...' : 'Print Receipt'}
            </Text>
          </Pressable>

          <Pressable
            onPress={shareReceiptWhatsApp}
            className="flex-row items-center justify-center gap-2 py-4 rounded-xl active:opacity-90"
            style={{ backgroundColor: '#25D366' }}
          >
            <MessageCircle size={20} color="#ffffff" />
            <Text className="text-white font-bold text-base">Share via WhatsApp</Text>
          </Pressable>

          <Pressable
            onPress={shareReceipt}
            className="flex-row items-center justify-center gap-2 bg-white/80 dark:bg-stone-800 py-4 rounded-xl active:opacity-90"
          >
            <Share2 size={18} color={isDark ? '#a8a29e' : '#57534e'} />
            <Text className="text-stone-600 dark:text-stone-300 font-medium">Share Other</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </View>
  );
}
