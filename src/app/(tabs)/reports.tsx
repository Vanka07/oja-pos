import { View, Text, ScrollView, Pressable, Dimensions, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  TrendingUp,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  ShoppingCart,
} from 'lucide-react-native';
import { useRetailStore, formatNaira } from '@/store/retailStore';
import { useStaffStore, hasPermission } from '@/store/staffStore';
import { Lock } from 'lucide-react-native';
import { useState, useMemo } from 'react';
import { useColorScheme } from 'nativewind';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import EmptyState from '@/components/EmptyState';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

let VictoryBar: any = null;
let VictoryChart: any = null;
let VictoryTheme: any = null;
let VictoryAxis: any = null;
let VictoryPie: any = null;

if (Platform.OS !== 'web') {
  try {
    const victory = require('victory-native');
    VictoryBar = victory.VictoryBar;
    VictoryChart = victory.VictoryChart;
    VictoryTheme = victory.VictoryTheme;
    VictoryAxis = victory.VictoryAxis;
    VictoryPie = victory.VictoryPie;
  } catch (e) {}
}

type DateRange = 'today' | 'week' | 'month' | 'year';

export default function ReportsScreen() {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [dateRange, setDateRange] = useState<DateRange>('today');

  const currentStaff = useStaffStore((s) => s.currentStaff);
  const canViewReports = !currentStaff || hasPermission(currentStaff.role, 'view_reports');

  const sales = useRetailStore((s) => s.sales);
  const products = useRetailStore((s) => s.products);
  const getDailySummary = useRetailStore((s) => s.getDailySummary);
  const getTopSellingProducts = useRetailStore((s) => s.getTopSellingProducts);
  const getSalesByDateRange = useRetailStore((s) => s.getSalesByDateRange);

  const getDateRangeData = useMemo(() => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    if (dateRange === 'today') return getDailySummary(todayStr);
    const startDate = new Date();
    if (dateRange === 'week') startDate.setDate(today.getDate() - 7);
    else if (dateRange === 'month') startDate.setDate(today.getDate() - 30);
    else startDate.setDate(today.getDate() - 365);
    const rangeSales = getSalesByDateRange(startDate.toISOString().split('T')[0], todayStr);
    return {
      date: `${startDate.toLocaleDateString('en-NG', { month: 'short', day: 'numeric' })} - ${today.toLocaleDateString('en-NG', { month: 'short', day: 'numeric' })}`,
      totalSales: rangeSales.reduce((sum, s) => sum + s.total, 0),
      totalTransactions: rangeSales.length,
      cashSales: rangeSales.filter((s) => s.paymentMethod === 'cash').reduce((sum, s) => sum + s.total, 0),
      transferSales: rangeSales.filter((s) => s.paymentMethod === 'transfer').reduce((sum, s) => sum + s.total, 0),
      posSales: rangeSales.filter((s) => s.paymentMethod === 'pos').reduce((sum, s) => sum + s.total, 0),
      creditSales: rangeSales.filter((s) => s.paymentMethod === 'credit').reduce((sum, s) => sum + s.total, 0),
      profit: rangeSales.reduce((sum, s) => sum + s.items.reduce((itemSum, item) => itemSum + (item.product.sellingPrice - item.product.costPrice) * item.quantity, 0), 0),
    };
  }, [dateRange, getDailySummary, getSalesByDateRange]);

  const topProducts = useMemo(() => {
    const days = dateRange === 'today' ? 1 : dateRange === 'week' ? 7 : dateRange === 'month' ? 30 : 365;
    return getTopSellingProducts(days);
  }, [dateRange, getTopSellingProducts]);

  const recentSales = useMemo(() => sales.slice(0, 10), [sales]);

  const chartData = useMemo(() => {
    if (dateRange === 'week') {
      const data = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(); date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const summary = getDailySummary(dateStr);
        data.push({ day: date.toLocaleDateString('en-NG', { weekday: 'short' }), sales: summary.totalSales, label: dateStr });
      }
      return { data, title: 'Daily Sales (Last 7 Days)' };
    }
    if (dateRange === 'month') {
      const data = [];
      for (let i = 29; i >= 0; i--) {
        const date = new Date(); date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const summary = getDailySummary(dateStr);
        data.push({ day: date.toLocaleDateString('en-NG', { day: 'numeric' }), sales: summary.totalSales, label: dateStr });
      }
      return { data, title: 'Daily Sales (Last 30 Days)' };
    }
    const data = [];
    const today = new Date();
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthEnd = new Date(today.getFullYear(), today.getMonth() - i + 1, 0);
      const monthSales = getSalesByDateRange(monthStart.toISOString().split('T')[0], monthEnd.toISOString().split('T')[0]);
      data.push({ day: monthStart.toLocaleDateString('en-NG', { month: 'short' }), sales: monthSales.reduce((sum, s) => sum + s.total, 0), label: monthStart.toISOString().split('T')[0] });
    }
    return { data, title: 'Monthly Sales (Last 12 Months)' };
  }, [dateRange, getDailySummary, getSalesByDateRange]);

  const getPreviousPeriodChange = useMemo(() => {
    const today = new Date();
    if (dateRange === 'today') {
      const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
      const yesterdaySummary = getDailySummary(yesterday.toISOString().split('T')[0]);
      if (yesterdaySummary.totalSales === 0) return null;
      return { change: ((getDateRangeData.totalSales - yesterdaySummary.totalSales) / yesterdaySummary.totalSales) * 100, label: 'vs yesterday' };
    }
    const periodDays = dateRange === 'week' ? 7 : dateRange === 'month' ? 30 : 365;
    const currentStart = new Date(today); currentStart.setDate(today.getDate() - periodDays);
    const previousEnd = new Date(currentStart); previousEnd.setDate(previousEnd.getDate() - 1);
    const previousStart = new Date(previousEnd); previousStart.setDate(previousEnd.getDate() - periodDays);
    const previousSales = getSalesByDateRange(previousStart.toISOString().split('T')[0], previousEnd.toISOString().split('T')[0]);
    const previousTotal = previousSales.reduce((sum, s) => sum + s.total, 0);
    if (previousTotal === 0) return null;
    const label = dateRange === 'week' ? 'vs last week' : dateRange === 'month' ? 'vs last month' : 'vs last year';
    return { change: ((getDateRangeData.totalSales - previousTotal) / previousTotal) * 100, label };
  }, [dateRange, getDateRangeData, getDailySummary, getSalesByDateRange]);

  const paymentBreakdown = useMemo(() => {
    const total = getDateRangeData.totalSales || 1;
    return [
      { method: 'Cash', amount: getDateRangeData.cashSales, percentage: (getDateRangeData.cashSales / total) * 100, color: '#10b981' },
      { method: 'Transfer', amount: getDateRangeData.transferSales, percentage: (getDateRangeData.transferSales / total) * 100, color: '#3b82f6' },
      { method: 'POS', amount: getDateRangeData.posSales, percentage: (getDateRangeData.posSales / total) * 100, color: '#a855f7' },
      { method: 'Credit', amount: getDateRangeData.creditSales, percentage: (getDateRangeData.creditSales / total) * 100, color: '#f59e0b' },
    ].filter(p => p.amount > 0);
  }, [getDateRangeData]);

  const WebBarChart = () => {
    const { data, title } = chartData;
    const maxSales = Math.max(...data.map(d => d.sales), 1);
    const showLabels = data.length <= 12;
    return (
      <View className="bg-white/80 dark:bg-stone-900/80 rounded-xl p-4 border border-stone-200 dark:border-stone-800">
        <Text className="text-stone-900 dark:text-white font-semibold mb-4">{title}</Text>
        <View className="flex-row items-end justify-between" style={{ height: 140 }}>
          {data.map((item, index) => {
            const barHeight = Math.max((item.sales / maxSales) * 120, 4);
            return (
              <View key={index} className="items-center flex-1">
                {showLabels && <Text className="text-stone-500 text-[10px] mb-1">{item.sales > 0 ? `₦${(item.sales / 1000).toFixed(0)}k` : ''}</Text>}
                <View style={{ height: barHeight, backgroundColor: item.sales > 0 ? '#f97316' : (isDark ? '#44403c' : '#d6d3d1'), width: data.length > 12 ? '80%' : '60%', borderRadius: 4 }} />
                {showLabels && <Text className="text-stone-500 text-xs mt-2">{item.day}</Text>}
              </View>
            );
          })}
        </View>
        {!showLabels && (
          <View className="flex-row justify-between mt-2">
            <Text className="text-stone-500 text-xs">{data[0]?.day}</Text>
            <Text className="text-stone-500 text-xs">{data[Math.floor(data.length / 2)]?.day}</Text>
            <Text className="text-stone-500 text-xs">{data[data.length - 1]?.day}</Text>
          </View>
        )}
      </View>
    );
  };

  const WebPieChart = () => {
    if (paymentBreakdown.length === 0) return null;
    return (
      <View className="bg-white/80 dark:bg-stone-900/80 rounded-xl p-4 border border-stone-200 dark:border-stone-800 mt-4">
        <Text className="text-stone-900 dark:text-white font-semibold mb-4">Payment Breakdown</Text>
        <View className="h-6 rounded-full overflow-hidden flex-row mb-4">
          {paymentBreakdown.map((item) => <View key={item.method} style={{ width: `${item.percentage}%`, backgroundColor: item.color }} />)}
        </View>
        <View className="gap-2">
          {paymentBreakdown.map((item) => (
            <View key={item.method} className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <View className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <Text className="text-stone-600 dark:text-stone-400 text-sm">{item.method}</Text>
              </View>
              <Text className="text-stone-900 dark:text-white text-sm font-medium">{formatNaira(item.amount)} ({item.percentage.toFixed(0)}%)</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const NativeBarChart = () => {
    if (!VictoryChart || !VictoryBar || !VictoryAxis) return <WebBarChart />;
    const { data, title } = chartData;
    return (
      <View className="bg-white/80 dark:bg-stone-900/80 rounded-xl p-4 border border-stone-200 dark:border-stone-800">
        <Text className="text-stone-900 dark:text-white font-semibold mb-2">{title}</Text>
        <VictoryChart theme={VictoryTheme?.material} domainPadding={20} width={SCREEN_WIDTH - 60} height={200} padding={{ top: 20, bottom: 40, left: 50, right: 20 }}>
          <VictoryAxis style={{ axis: { stroke: isDark ? '#44403c' : '#d6d3d1' }, tickLabels: { fill: '#a8a29e', fontSize: data.length > 12 ? 7 : 10, angle: data.length > 12 ? -45 : 0 } }} />
          <VictoryAxis dependentAxis tickFormat={(t: number) => `₦${(t / 1000).toFixed(0)}k`} style={{ axis: { stroke: isDark ? '#44403c' : '#d6d3d1' }, tickLabels: { fill: '#a8a29e', fontSize: 10 }, grid: { stroke: isDark ? '#292524' : '#e7e5e4' } }} />
          <VictoryBar data={data} x="day" y="sales" style={{ data: { fill: '#f97316', borderRadius: 4 } }} cornerRadius={{ top: 4 }} />
        </VictoryChart>
      </View>
    );
  };

  const NativePieChart = () => {
    if (!VictoryPie || paymentBreakdown.length === 0) return <WebPieChart />;
    const pieData = paymentBreakdown.map((item) => ({ x: item.method, y: item.amount }));
    return (
      <View className="bg-white/80 dark:bg-stone-900/80 rounded-xl p-4 border border-stone-200 dark:border-stone-800 mt-4">
        <Text className="text-stone-900 dark:text-white font-semibold mb-2">Payment Breakdown</Text>
        <View className="items-center">
          <VictoryPie data={pieData} colorScale={paymentBreakdown.map((p) => p.color)} width={SCREEN_WIDTH - 80} height={200} innerRadius={50} labelRadius={80} style={{ labels: { fill: 'white', fontSize: 11, fontWeight: 'bold' } }} labels={({ datum }: { datum: { x: string; y: number } }) => `${datum.x}\n${((datum.y / getDateRangeData.totalSales) * 100).toFixed(0)}%`} />
        </View>
        <View className="flex-row flex-wrap gap-3 mt-2">
          {paymentBreakdown.map((item) => (
            <View key={item.method} className="flex-row items-center gap-2">
              <View className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
              <Text className="text-stone-600 dark:text-stone-400 text-sm">{item.method}: {formatNaira(item.amount)}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const gradientColors: [string, string, string] = isDark ? ['#292524', '#1c1917', '#0c0a09'] : ['#f5f5f4', '#fafaf9', '#ffffff'];

  if (!canViewReports) {
    return (
      <View className="flex-1 bg-stone-50 dark:bg-stone-950">
        <LinearGradient colors={gradientColors} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} />
        <View style={{ paddingTop: insets.top + 8 }} className="px-5">
          <Text className="text-stone-500 text-sm font-medium tracking-wide uppercase mb-1">Analytics</Text>
          <Text className="text-stone-900 dark:text-white text-3xl font-bold tracking-tight">Reports</Text>
        </View>
        <View className="flex-1 items-center justify-center px-8">
          <View className="w-20 h-20 rounded-full bg-stone-200 dark:bg-stone-800 items-center justify-center mb-4">
            <Lock size={32} color="#78716c" />
          </View>
          <Text className="text-stone-900 dark:text-white text-xl font-bold mb-2">Access Restricted</Text>
          <Text className="text-stone-500 dark:text-stone-400 text-center">You don't have permission to view reports. Ask the shop owner for access.</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-stone-50 dark:bg-stone-950">
      <LinearGradient colors={gradientColors} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} />
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        <View style={{ paddingTop: insets.top + 8 }} className="px-5">
          <Animated.View entering={FadeInDown.delay(100).duration(600)}>
            <Text className="text-stone-500 text-sm font-medium tracking-wide uppercase mb-1">Analytics</Text>
            <Text className="text-stone-900 dark:text-white text-3xl font-bold tracking-tight">Reports</Text>
          </Animated.View>
        </View>

        <Animated.View entering={FadeInDown.delay(200).duration(600)} className="px-5 mt-6">
          <View className="flex-row bg-white/80 dark:bg-stone-900/80 rounded-xl p-1 border border-stone-200 dark:border-stone-800">
            {(['today', 'week', 'month', 'year'] as DateRange[]).map((range) => (
              <Pressable key={range} onPress={() => setDateRange(range)} className={`flex-1 py-3 rounded-lg ${dateRange === range ? 'bg-orange-500' : ''}`}>
                <Text className={`text-center font-medium ${dateRange === range ? 'text-white' : 'text-stone-600 dark:text-stone-400'}`}>
                  {range === 'today' ? 'Today' : range === 'week' ? '7 Days' : range === 'month' ? '30 Days' : '1 Year'}
                </Text>
              </Pressable>
            ))}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).duration(600)} className="mx-5 mt-4">
          <LinearGradient colors={['#059669', '#047857', '#065f46']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 24, padding: 24 }}>
            <View className="flex-row items-center gap-2 mb-2">
              <TrendingUp size={20} color="rgba(255,255,255,0.8)" />
              <Text className="text-white/80 text-sm font-medium">Total Revenue</Text>
            </View>
            <Text className="text-white text-4xl font-bold tracking-tight mb-2">{formatNaira(getDateRangeData.totalSales)}</Text>
            {getPreviousPeriodChange && (
              <View className="flex-row items-center gap-1">
                {getPreviousPeriodChange.change >= 0 ? <ArrowUpRight size={16} color="#a7f3d0" /> : <ArrowDownRight size={16} color="#fca5a5" />}
                <Text className={getPreviousPeriodChange.change >= 0 ? 'text-emerald-200' : 'text-red-200'}>{Math.abs(getPreviousPeriodChange.change).toFixed(1)}% {getPreviousPeriodChange.label}</Text>
              </View>
            )}
          </LinearGradient>
        </Animated.View>

        {(dateRange === 'week' || dateRange === 'month' || dateRange === 'year') && (
          <Animated.View entering={FadeInDown.delay(350).duration(600)} className="mx-5 mt-4">
            {Platform.OS === 'web' ? <WebBarChart /> : <NativeBarChart />}
          </Animated.View>
        )}

        {paymentBreakdown.length > 0 && (
          <Animated.View entering={FadeInDown.delay(380).duration(600)} className="mx-5">
            {Platform.OS === 'web' ? <WebPieChart /> : <NativePieChart />}
          </Animated.View>
        )}

        <Animated.View entering={FadeInDown.delay(400).duration(600)} className="flex-row mx-5 mt-4 gap-3">
          <View className="flex-1 bg-white/80 dark:bg-stone-900/80 rounded-xl p-4 border border-stone-200 dark:border-stone-800">
            <View className="w-8 h-8 rounded-lg bg-blue-500/20 items-center justify-center mb-2">
              <ShoppingCart size={16} color="#3b82f6" />
            </View>
            <Text className="text-stone-500 text-xs uppercase tracking-wide">Transactions</Text>
            <Text className="text-stone-900 dark:text-white text-2xl font-bold">{getDateRangeData.totalTransactions}</Text>
          </View>
          <View className="flex-1 bg-white/80 dark:bg-stone-900/80 rounded-xl p-4 border border-stone-200 dark:border-stone-800">
            <View className="w-8 h-8 rounded-lg bg-emerald-500/20 items-center justify-center mb-2">
              <DollarSign size={16} color="#10b981" />
            </View>
            <Text className="text-stone-500 text-xs uppercase tracking-wide">Profit</Text>
            <Text className="text-emerald-400 text-2xl font-bold">{formatNaira(getDateRangeData.profit)}</Text>
          </View>
        </Animated.View>

        {paymentBreakdown.length > 0 && (
          <Animated.View entering={FadeInDown.delay(500).duration(600)} className="mx-5 mt-4">
            <View className="bg-white/80 dark:bg-stone-900/80 rounded-xl p-4 border border-stone-200 dark:border-stone-800">
              <Text className="text-stone-900 dark:text-white font-semibold mb-4">Payment Methods</Text>
              <View className="h-4 rounded-full overflow-hidden flex-row mb-4">
                {paymentBreakdown.map((item) => <View key={item.method} style={{ width: `${item.percentage}%`, backgroundColor: item.color }} />)}
              </View>
              <View className="flex-row flex-wrap gap-3">
                {paymentBreakdown.map((item) => (
                  <View key={item.method} className="flex-row items-center gap-2">
                    <View className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <Text className="text-stone-600 dark:text-stone-400 text-sm">{item.method}: {formatNaira(item.amount)} ({item.percentage.toFixed(0)}%)</Text>
                  </View>
                ))}
              </View>
            </View>
          </Animated.View>
        )}

        <Animated.View entering={FadeInDown.delay(600).duration(600)} className="mx-5 mt-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-stone-900 dark:text-white text-lg font-semibold">Top Selling Products</Text>
            <View className="flex-row items-center gap-1">
              <BarChart3 size={16} color="#f97316" />
              <Text className="text-orange-500 text-sm">By quantity</Text>
            </View>
          </View>
          {topProducts.length === 0 ? (
            <View className="bg-white/60 dark:bg-stone-900/60 rounded-xl border border-stone-200 dark:border-stone-800">
              <EmptyState icon={BarChart3} title="No data yet" description="Make some sales to see your reports come alive" />
            </View>
          ) : (
            <View className="gap-3">
              {topProducts.slice(0, 5).map((item, index) => (
                <Animated.View key={item.product.id} entering={FadeInRight.delay(700 + index * 100).duration(400)}>
                  <View className="bg-white/60 dark:bg-stone-900/60 rounded-xl p-4 border border-stone-200 dark:border-stone-800">
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center gap-3 flex-1">
                        <View className={`w-8 h-8 rounded-lg items-center justify-center ${index === 0 ? 'bg-amber-500/20' : index === 1 ? 'bg-stone-500/20' : index === 2 ? 'bg-orange-800/20' : 'bg-stone-200 dark:bg-stone-800'}`}>
                          <Text className={`font-bold ${index === 0 ? 'text-amber-400' : index === 1 ? 'text-stone-400 dark:text-stone-300' : index === 2 ? 'text-orange-700' : 'text-stone-500'}`}>#{index + 1}</Text>
                        </View>
                        <View className="flex-1">
                          <Text className="text-stone-900 dark:text-white font-medium" numberOfLines={1}>{item.product.name}</Text>
                          <Text className="text-stone-500 text-xs">{item.product.category}</Text>
                        </View>
                      </View>
                      <View className="items-end">
                        <Text className="text-stone-900 dark:text-white font-bold">{item.totalSold}</Text>
                        <Text className="text-stone-500 text-xs">units sold</Text>
                      </View>
                    </View>
                  </View>
                </Animated.View>
              ))}
            </View>
          )}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(800).duration(600)} className="mx-5 mt-6">
          <Text className="text-stone-900 dark:text-white text-lg font-semibold mb-4">Recent Transactions</Text>
          {recentSales.length === 0 ? (
            <View className="bg-white/60 dark:bg-stone-900/60 rounded-xl border border-stone-200 dark:border-stone-800">
              <EmptyState icon={ShoppingCart} title="No transactions yet" description="Your sales will appear here as you make them" />
            </View>
          ) : (
            <View className="gap-2">
              {recentSales.map((sale, index) => (
                <Animated.View key={sale.id} entering={FadeInRight.delay(900 + index * 50).duration(400)}>
                  <View className="bg-white/60 dark:bg-stone-900/60 rounded-xl p-4 border border-stone-200 dark:border-stone-800">
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center gap-3">
                        <View className={`w-2 h-2 rounded-full ${sale.paymentMethod === 'cash' ? 'bg-emerald-500' : sale.paymentMethod === 'transfer' ? 'bg-blue-500' : sale.paymentMethod === 'pos' ? 'bg-purple-500' : 'bg-amber-500'}`} />
                        <View>
                          <Text className="text-stone-900 dark:text-white font-medium">{sale.items.length} item{sale.items.length > 1 ? 's' : ''}</Text>
                          <Text className="text-stone-500 text-xs">{new Date(sale.createdAt).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} • {sale.paymentMethod.charAt(0).toUpperCase() + sale.paymentMethod.slice(1)}</Text>
                        </View>
                      </View>
                      <Text className="text-stone-900 dark:text-white font-semibold">{formatNaira(sale.total)}</Text>
                    </View>
                  </View>
                </Animated.View>
              ))}
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}
