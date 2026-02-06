import { View, Text, ScrollView, Pressable, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ShoppingCart,
  Package,
  AlertTriangle,
  ArrowRight,
  Wifi,
  WifiOff,
  Banknote,
  UserCircle
} from 'lucide-react-native';
import { OjaLogo } from '@/components/OjaLogo';
import { useRetailStore, formatNaira } from '@/store/retailStore';
import { useOnboardingStore } from '@/store/onboardingStore';
import { useStaffStore, hasPermission } from '@/store/staffStore';
import { useCloudAuthStore } from '@/store/cloudAuthStore';
import { useState, useCallback, useMemo } from 'react';
import { useColorScheme } from 'nativewind';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { useRouter, Href } from 'expo-router';
import EmptyState from '@/components/EmptyState';
import { useT } from '@/store/languageStore';

// Helper to get local date string (YYYY-MM-DD) instead of UTC
const getLocalDateStr = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [refreshing, setRefreshing] = useState(false);

  const shopInfo = useOnboardingStore((s) => s.shopInfo);
  const staffMembers = useStaffStore((s) => s.staff);
  const currentStaff = useStaffStore((s) => s.currentStaff);
  const canViewReports = !currentStaff || hasPermission(currentStaff.role, 'view_reports');
  const products = useRetailStore((s) => s.products);
  const getSalesToday = useRetailStore((s) => s.getSalesToday);
  const getDailySummary = useRetailStore((s) => s.getDailySummary);
  const getLowStockProducts = useRetailStore((s) => s.getLowStockProducts);
  const pendingSyncCount = useRetailStore((s) => s.pendingSyncCount);
  const isCloudAuthenticated = useCloudAuthStore((s) => s.isAuthenticated);

  const todayDate = getLocalDateStr(new Date());
  const summary = useMemo(() => getDailySummary(todayDate), [getDailySummary, todayDate]);
  const salesToday = useMemo(() => getSalesToday(), [getSalesToday]);
  const lowStock = useMemo(() => getLowStockProducts(), [getLowStockProducts, products]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const t = useT();

  const isOnline = isCloudAuthenticated && pendingSyncCount === 0;
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? t('dashboard.goodMorning') : currentHour < 17 ? t('dashboard.goodAfternoon') : t('dashboard.goodEvening');
  const displayName = shopInfo?.ownerName?.split(' ')[0] || 'there';

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
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#e05e1b" />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ paddingTop: insets.top + 8 }} className="px-5">
          <Animated.View entering={FadeInDown.delay(100).duration(600)}>
            <View className="flex-row items-center justify-between mb-1">
              <OjaLogo size={38} showText textSize={26} />
              <View className="flex-row items-center gap-2">
                {isCloudAuthenticated ? (
                  isOnline ? (
                    <View className="flex-row items-center gap-1 bg-emerald-500/20 px-2 py-1 rounded-full">
                      <Wifi size={12} color="#10b981" />
                      <Text className="text-emerald-400 text-xs font-medium">{t('dashboard.synced')}</Text>
                    </View>
                  ) : (
                    <View className="flex-row items-center gap-1 bg-amber-500/20 px-2 py-1 rounded-full">
                      <WifiOff size={12} color="#f59e0b" />
                      <Text className="text-amber-400 text-xs font-medium">{pendingSyncCount} {t('dashboard.pending')}</Text>
                    </View>
                  )
                ) : null}
              </View>
            </View>
            <Text style={{ fontFamily: 'Poppins-ExtraBold' }} className="text-stone-900 dark:text-white text-3xl font-extrabold tracking-tight">
              {shopInfo?.name || t('tabs.dashboard')}
            </Text>
            <Text style={{ fontFamily: 'Poppins-Bold' }} className="text-stone-500 dark:text-stone-500 text-sm font-medium mt-1">
              {greeting}, {displayName} 👋
            </Text>
            {staffMembers.length > 0 && currentStaff && (
              <Pressable
                onPress={() => router.push('/staff-switch')}
                className="flex-row items-center gap-2 mt-2 bg-white/80 dark:bg-stone-900/80 self-start px-3 py-1.5 rounded-full border border-stone-200 dark:border-stone-800 active:opacity-80"
              >
                <UserCircle size={14} color="#e05e1b" />
                <Text className="text-orange-400 text-xs font-medium">
                  {currentStaff.name}
                </Text>
                <Text className="text-stone-400 dark:text-stone-600 text-xs">• {t('dashboard.switch')}</Text>
              </Pressable>
            )}
          </Animated.View>
        </View>

        {/* Today's Revenue Card */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(600)}
          className="mx-5 mt-6"
        >
          <Pressable onPress={() => canViewReports ? router.push('/(tabs)/summary') : null} className="active:opacity-90">
          <LinearGradient
            colors={['#e05e1b', '#c2410c', '#9a3412']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 24, padding: 24, overflow: 'hidden' }}
          >
            {/* Subtle wave sparkline background */}
            <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, opacity: 0.08 }}>
              <Svg width="100%" height="80" viewBox="0 0 400 80" preserveAspectRatio="none">
                <Path
                  d="M0 60 Q50 20 100 45 Q150 70 200 35 Q250 0 300 40 Q350 80 400 30 L400 80 L0 80 Z"
                  fill="white"
                />
              </Svg>
            </View>
            <View className="flex-row items-center gap-2 mb-3">
              <Banknote size={20} color="rgba(255,255,255,0.8)" />
              <Text className="text-white/80 text-sm font-medium">{t('dashboard.todaysRevenue')}</Text>
            </View>
            <Text style={{ fontFamily: 'Poppins-ExtraBold' }} className="text-white text-4xl font-extrabold tracking-tight mb-4">
              {formatNaira(summary.totalSales)}
            </Text>
            <View className="flex-row gap-6">
              <View>
                <Text className="text-white/60 text-xs tracking-wide mb-1">{t('dashboard.transactions')}</Text>
                <Text style={{ fontFamily: 'Poppins-SemiBold' }} className="text-white text-xl font-semibold">{summary.totalTransactions}</Text>
              </View>
              {canViewReports && (
                <View>
                  <Text className="text-white/60 text-xs tracking-wide mb-1">{t('dashboard.profit')}</Text>
                  <View className="flex-row items-center gap-2">
                    <Text style={{ fontFamily: 'Poppins-SemiBold' }} className="text-emerald-100 text-xl font-semibold">{formatNaira(summary.profit)}</Text>
                    {summary.totalSales > 0 && (
                      <View className="bg-white/20 px-2 py-0.5 rounded-full">
                        <Text className="text-white/90 text-xs font-medium">
                          {summary.profit > 0 ? '↑' : ''} {summary.totalSales > 0 ? ((summary.profit / summary.totalSales) * 100).toFixed(0) : 0}%
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              )}
            </View>
          </LinearGradient>
          </Pressable>
          <Text className="text-stone-500 dark:text-stone-500 text-sm text-center mt-3 font-medium">
            {summary.totalTransactions === 0
              ? 'New day, new opportunities! 🌅'
              : summary.totalSales >= 50000
                ? ['Oja dey move! 🔥', 'Money dey enter! 💰', 'Na today we shine! ✨', 'Omo, sales dey burst! 💪'][Math.floor(new Date().getMinutes() / 15) % 4]
                : ['Shop dey flow! 🚀', 'Nice start — keep going! 💪', 'Sales don land! 🎯', 'We dey move! 🔥'][Math.floor(new Date().getMinutes() / 15) % 4]}
          </Text>
        </Animated.View>

        {/* Payment Methods */}
        {canViewReports && (
        <Animated.View
          entering={FadeInDown.delay(300).duration(600)}
          className="mx-5 mt-4"
        >
          <Pressable onPress={() => router.push('/(tabs)/summary')} className="active:opacity-80">
            <View className="flex-row gap-3">
              <View className="flex-1 bg-white/80 dark:bg-stone-900/80 rounded-2xl p-4 border border-stone-200 dark:border-stone-800">
                <Text className="text-stone-500 dark:text-stone-500 text-xs font-semibold tracking-wide mb-1">{t('dashboard.cash')}</Text>
                <Text className="text-stone-900 dark:text-white text-lg font-semibold">{formatNaira(summary.cashSales)}</Text>
              </View>
              <View className="flex-1 bg-white/80 dark:bg-stone-900/80 rounded-2xl p-4 border border-stone-200 dark:border-stone-800">
                <Text className="text-stone-500 dark:text-stone-500 text-xs font-semibold tracking-wide mb-1">{t('dashboard.transfer')}</Text>
                <Text className="text-stone-900 dark:text-white text-lg font-semibold">{formatNaira(summary.transferSales)}</Text>
              </View>
              <View className="flex-1 bg-white/80 dark:bg-stone-900/80 rounded-2xl p-4 border border-stone-200 dark:border-stone-800">
                <Text className="text-stone-500 dark:text-stone-500 text-xs font-semibold tracking-wide mb-1">{t('dashboard.pos')}</Text>
                <Text className="text-stone-900 dark:text-white text-lg font-semibold">{formatNaira(summary.posSales)}</Text>
              </View>
            </View>
          </Pressable>
        </Animated.View>
        )}

        {/* Quick Stats */}
        <Animated.View
          entering={FadeInDown.delay(400).duration(600)}
          className="flex-row mx-5 mt-4 gap-3"
        >
          <Pressable
            className="flex-1 bg-white/80 dark:bg-stone-900/80 rounded-2xl p-4 border border-stone-200 dark:border-stone-800 active:scale-98"
            onPress={() => router.push('/(tabs)/inventory')}
          >
            <View className="w-10 h-10 rounded-xl bg-blue-500/20 items-center justify-center mb-3">
              <Package size={20} color="#3b82f6" />
            </View>
            <Text className="text-stone-500 dark:text-stone-500 text-xs font-semibold tracking-wide mb-1">{t('dashboard.totalProducts')}</Text>
            <Text className="text-stone-900 dark:text-white text-2xl font-bold">{products.length}</Text>
          </Pressable>

          <Pressable
            className="flex-1 bg-white/80 dark:bg-stone-900/80 rounded-2xl p-4 border border-stone-200 dark:border-stone-800 active:scale-98"
            onPress={() => canViewReports ? router.push('/(tabs)/summary') : null}
          >
            <View className="w-10 h-10 rounded-xl bg-emerald-500/20 items-center justify-center mb-3">
              <ShoppingCart size={20} color="#10b981" />
            </View>
            <Text className="text-stone-500 dark:text-stone-500 text-xs font-semibold tracking-wide mb-1">{t('dashboard.salesToday')}</Text>
            <Text className="text-stone-900 dark:text-white text-2xl font-bold">{salesToday.length}</Text>
          </Pressable>
        </Animated.View>

        {/* Low Stock Alert */}
        {lowStock.length > 0 && (
          <Animated.View
            entering={FadeInDown.delay(500).duration(600)}
            className="mx-5 mt-4"
          >
            <Pressable
              className="bg-amber-500/10 rounded-2xl p-4 border border-amber-500/30 active:opacity-80"
              onPress={() => router.push('/(tabs)/inventory')}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-3">
                  <View className="w-10 h-10 rounded-xl bg-amber-500/20 items-center justify-center">
                    <AlertTriangle size={20} color="#f59e0b" />
                  </View>
                  <View>
                    <Text className="text-amber-400 font-semibold text-base">{t('dashboard.lowStockAlert')}</Text>
                    <Text className="text-stone-500 dark:text-stone-500 text-sm">{t('dashboard.productsNeedRestocking').replace('{{count}}', String(lowStock.length))}</Text>
                  </View>
                </View>
                <ArrowRight size={20} color="#78716c" />
              </View>
            </Pressable>
          </Animated.View>
        )}

        {/* Recent Transactions */}
        <Animated.View
          entering={FadeInDown.delay(600).duration(600)}
          className="mx-5 mt-6"
        >
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-stone-900 dark:text-white text-lg font-semibold">{t('dashboard.recentSales')}</Text>
            {canViewReports && (
              <Pressable
                className="active:opacity-70"
                onPress={() => router.push('/activity-log')}
              >
                <Text className="text-orange-500 text-sm font-medium">{t('dashboard.viewAll')}</Text>
              </Pressable>
            )}
          </View>

          {salesToday.length === 0 ? (
            <View className="bg-white/60 dark:bg-stone-900/60 rounded-2xl border border-stone-200 dark:border-stone-800">
              <EmptyState
                icon={ShoppingCart}
                title={t('dashboard.noSalesYet')}
                description={t('dashboard.startFirstSale')}
                buttonLabel={t('dashboard.startSelling')}
                onButtonPress={() => router.push('/(tabs)/pos' as Href)}
              />
            </View>
          ) : (
            <View className="gap-2">
              {salesToday.slice(0, 5).map((sale, index) => (
                <Animated.View
                  key={sale.id}
                  entering={FadeInRight.delay(700 + index * 100).duration(400)}
                >
                  <Pressable
                    onPress={() => router.push({ pathname: '/sale-detail', params: { id: sale.id } })}
                    className="bg-white/60 dark:bg-stone-900/60 rounded-xl p-4 border border-stone-200 dark:border-stone-800 flex-row items-center justify-between active:opacity-80"
                  >
                    <View className="flex-row items-center gap-3">
                      <View className={`w-2 h-2 rounded-full ${
                        sale.paymentMethod === 'cash' ? 'bg-emerald-500' :
                        sale.paymentMethod === 'transfer' ? 'bg-blue-500' :
                        sale.paymentMethod === 'pos' ? 'bg-purple-500' : 'bg-amber-500'
                      }`} />
                      <View>
                        <Text className="text-stone-900 dark:text-white font-medium">
                          {sale.items.length} {sale.items.length > 1 ? t('dashboard.items') : t('dashboard.item')}
                        </Text>
                        <Text className="text-stone-500 dark:text-stone-500 text-xs">
                          {new Date(sale.createdAt).toLocaleTimeString('en-NG', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })} • {sale.paymentMethod.charAt(0).toUpperCase() + sale.paymentMethod.slice(1)}
                        </Text>
                      </View>
                    </View>
                    <Text className="text-stone-900 dark:text-white font-semibold">{formatNaira(sale.total)}</Text>
                  </Pressable>
                </Animated.View>
              ))}
            </View>
          )}
        </Animated.View>

        {/* Low Stock Items Preview */}
        {lowStock.length > 0 && (
          <Animated.View
            entering={FadeInDown.delay(800).duration(600)}
            className="mx-5 mt-6"
          >
            <Text className="text-stone-900 dark:text-white text-lg font-semibold mb-4">{t('dashboard.restockSoon')}</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: 20 }}
              style={{ flexGrow: 0 }}
            >
              {lowStock.slice(0, 5).map((product, index) => (
                <Animated.View
                  key={product.id}
                  entering={FadeInRight.delay(900 + index * 100).duration(400)}
                  className="mr-3"
                >
                  <Pressable 
                    onPress={() => router.push('/(tabs)/inventory' as Href)}
                    className="bg-white/80 dark:bg-stone-900/80 rounded-xl p-4 border border-stone-200 dark:border-stone-800 w-36 active:opacity-80"
                  >
                    <Text className="text-stone-900 dark:text-white font-medium text-sm mb-1" numberOfLines={2}>
                      {product.name}
                    </Text>
                    <Text className="text-stone-500 dark:text-stone-500 text-xs mb-2">{product.category}</Text>
                    <View className="flex-row items-center gap-1">
                      <View className="bg-red-500/20 px-2 py-0.5 rounded">
                        <Text className="text-red-400 text-xs font-medium">{product.quantity} {t('dashboard.left')}</Text>
                      </View>
                    </View>
                  </Pressable>
                </Animated.View>
              ))}
            </ScrollView>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}
