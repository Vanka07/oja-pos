import { View, Text, ScrollView, Pressable, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Package,
  AlertTriangle,
  ArrowRight,
  Wifi,
  WifiOff,
  Clock,
  Banknote
} from 'lucide-react-native';
import { useRetailStore, formatNaira } from '@/store/retailStore';
import { useOnboardingStore } from '@/store/onboardingStore';
import { useState, useCallback, useMemo } from 'react';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { useRouter, Href } from 'expo-router';
import EmptyState from '@/components/EmptyState';

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const shopInfo = useOnboardingStore((s) => s.shopInfo);
  const products = useRetailStore((s) => s.products);
  const getSalesToday = useRetailStore((s) => s.getSalesToday);
  const getDailySummary = useRetailStore((s) => s.getDailySummary);
  const getLowStockProducts = useRetailStore((s) => s.getLowStockProducts);
  const pendingSyncCount = useRetailStore((s) => s.pendingSyncCount);

  const todayDate = new Date().toISOString().split('T')[0];
  const summary = useMemo(() => getDailySummary(todayDate), [getDailySummary, todayDate]);
  const salesToday = useMemo(() => getSalesToday(), [getSalesToday]);
  const lowStock = useMemo(() => getLowStockProducts(), [getLowStockProducts]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const isOnline = pendingSyncCount === 0;
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Good Morning' : currentHour < 17 ? 'Good Afternoon' : 'Good Evening';
  const displayName = shopInfo?.ownerName?.split(' ')[0] || 'there';

  return (
    <View className="flex-1 bg-stone-950">
      <LinearGradient
        colors={['#292524', '#1c1917', '#0c0a09']}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f97316" />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ paddingTop: insets.top + 8 }} className="px-5">
          <Animated.View entering={FadeInDown.delay(100).duration(600)}>
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-orange-500 text-base font-bold tracking-wide">
                🛍️ Oja
              </Text>
              <View className="flex-row items-center gap-2">
                {isOnline ? (
                  <View className="flex-row items-center gap-1 bg-emerald-500/20 px-2 py-1 rounded-full">
                    <Wifi size={12} color="#10b981" />
                    <Text className="text-emerald-400 text-xs font-medium">Synced</Text>
                  </View>
                ) : (
                  <View className="flex-row items-center gap-1 bg-amber-500/20 px-2 py-1 rounded-full">
                    <WifiOff size={12} color="#f59e0b" />
                    <Text className="text-amber-400 text-xs font-medium">{pendingSyncCount} pending</Text>
                  </View>
                )}
              </View>
            </View>
            <Text className="text-white text-3xl font-bold tracking-tight">
              {shopInfo?.name || 'Dashboard'}
            </Text>
            <Text className="text-stone-500 text-sm font-medium mt-1">
              {greeting}, {displayName} 👋
            </Text>
          </Animated.View>
        </View>

        {/* Today's Revenue Card */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(600)}
          className="mx-5 mt-6"
        >
          <LinearGradient
            colors={['#ea580c', '#c2410c', '#9a3412']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 24, padding: 24 }}
          >
            <View className="flex-row items-center gap-2 mb-3">
              <Banknote size={20} color="rgba(255,255,255,0.8)" />
              <Text className="text-white/80 text-sm font-medium">Today's Revenue</Text>
            </View>
            <Text className="text-white text-4xl font-bold tracking-tight mb-4">
              {formatNaira(summary.totalSales)}
            </Text>
            <View className="flex-row gap-6">
              <View>
                <Text className="text-white/60 text-xs uppercase tracking-wide mb-1">Transactions</Text>
                <Text className="text-white text-xl font-semibold">{summary.totalTransactions}</Text>
              </View>
              <View>
                <Text className="text-white/60 text-xs uppercase tracking-wide mb-1">Profit</Text>
                <Text className="text-emerald-300 text-xl font-semibold">{formatNaira(summary.profit)}</Text>
              </View>
            </View>
          </LinearGradient>
          <Text className="text-stone-500 text-sm text-center mt-3 font-medium">
            {summary.totalTransactions === 0
              ? 'New day, new opportunities! 🌅'
              : summary.totalSales >= 50000
                ? 'Big day! Keep pushing! 💪🔥'
                : 'Nice start — keep the sales coming! 💪'}
          </Text>
        </Animated.View>

        {/* Payment Methods */}
        <Animated.View
          entering={FadeInDown.delay(300).duration(600)}
          className="mx-5 mt-4"
        >
          <View className="flex-row gap-3">
            <View className="flex-1 bg-stone-900/80 rounded-2xl p-4 border border-stone-800">
              <Text className="text-stone-500 text-xs uppercase tracking-wide mb-1">Cash</Text>
              <Text className="text-white text-lg font-semibold">{formatNaira(summary.cashSales)}</Text>
            </View>
            <View className="flex-1 bg-stone-900/80 rounded-2xl p-4 border border-stone-800">
              <Text className="text-stone-500 text-xs uppercase tracking-wide mb-1">Transfer</Text>
              <Text className="text-white text-lg font-semibold">{formatNaira(summary.transferSales)}</Text>
            </View>
            <View className="flex-1 bg-stone-900/80 rounded-2xl p-4 border border-stone-800">
              <Text className="text-stone-500 text-xs uppercase tracking-wide mb-1">POS</Text>
              <Text className="text-white text-lg font-semibold">{formatNaira(summary.posSales)}</Text>
            </View>
          </View>
        </Animated.View>

        {/* Quick Stats */}
        <Animated.View
          entering={FadeInDown.delay(400).duration(600)}
          className="flex-row mx-5 mt-4 gap-3"
        >
          <Pressable
            className="flex-1 bg-stone-900/80 rounded-2xl p-4 border border-stone-800 active:scale-98"
            onPress={() => router.push('/(tabs)/inventory')}
          >
            <View className="w-10 h-10 rounded-xl bg-blue-500/20 items-center justify-center mb-3">
              <Package size={20} color="#3b82f6" />
            </View>
            <Text className="text-stone-500 text-xs uppercase tracking-wide mb-1">Total Products</Text>
            <Text className="text-white text-2xl font-bold">{products.length}</Text>
          </Pressable>

          <Pressable
            className="flex-1 bg-stone-900/80 rounded-2xl p-4 border border-stone-800 active:scale-98"
            onPress={() => router.push('/(tabs)/pos')}
          >
            <View className="w-10 h-10 rounded-xl bg-emerald-500/20 items-center justify-center mb-3">
              <ShoppingCart size={20} color="#10b981" />
            </View>
            <Text className="text-stone-500 text-xs uppercase tracking-wide mb-1">Sales Today</Text>
            <Text className="text-white text-2xl font-bold">{salesToday.length}</Text>
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
                    <Text className="text-amber-400 font-semibold text-base">Low Stock Alert</Text>
                    <Text className="text-stone-500 text-sm">{lowStock.length} products need restocking</Text>
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
            <Text className="text-white text-lg font-semibold">Recent Sales</Text>
            <Pressable
              className="active:opacity-70"
              onPress={() => router.push('/(tabs)/reports')}
            >
              <Text className="text-orange-500 text-sm font-medium">View All</Text>
            </Pressable>
          </View>

          {salesToday.length === 0 ? (
            <View className="bg-stone-900/60 rounded-2xl border border-stone-800">
              <EmptyState
                icon={ShoppingCart}
                title="No sales yet today"
                description="Start your first sale from the Sell tab"
                buttonLabel="Start Selling"
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
                  <View className="bg-stone-900/60 rounded-xl p-4 border border-stone-800 flex-row items-center justify-between">
                    <View className="flex-row items-center gap-3">
                      <View className={`w-2 h-2 rounded-full ${
                        sale.paymentMethod === 'cash' ? 'bg-emerald-500' :
                        sale.paymentMethod === 'transfer' ? 'bg-blue-500' :
                        sale.paymentMethod === 'pos' ? 'bg-purple-500' : 'bg-amber-500'
                      }`} />
                      <View>
                        <Text className="text-white font-medium">
                          {sale.items.length} item{sale.items.length > 1 ? 's' : ''}
                        </Text>
                        <Text className="text-stone-500 text-xs">
                          {new Date(sale.createdAt).toLocaleTimeString('en-NG', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })} • {sale.paymentMethod.charAt(0).toUpperCase() + sale.paymentMethod.slice(1)}
                        </Text>
                      </View>
                    </View>
                    <Text className="text-white font-semibold">{formatNaira(sale.total)}</Text>
                  </View>
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
            <Text className="text-white text-lg font-semibold mb-4">Restock Soon</Text>
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
                  <View className="bg-stone-900/80 rounded-xl p-4 border border-stone-800 w-36">
                    <Text className="text-white font-medium text-sm mb-1" numberOfLines={2}>
                      {product.name}
                    </Text>
                    <Text className="text-stone-500 text-xs mb-2">{product.category}</Text>
                    <View className="flex-row items-center gap-1">
                      <View className="bg-red-500/20 px-2 py-0.5 rounded">
                        <Text className="text-red-400 text-xs font-medium">{product.quantity} left</Text>
                      </View>
                    </View>
                  </View>
                </Animated.View>
              ))}
            </ScrollView>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}
