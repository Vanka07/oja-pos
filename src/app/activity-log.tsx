import { View, Text, ScrollView, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import {
  ArrowLeft,
  ShoppingCart,
  Package,
  Receipt,
  LogIn,
  DollarSign,
  CreditCard,
  Plus,
  Trash2,
  PencilLine,
  ChevronDown,
  Filter,
} from 'lucide-react-native';
import { useStaffStore, hasPermission, type StaffActivity } from '@/store/staffStore';
import { useRetailStore, formatNaira } from '@/store/retailStore';
import { useState, useMemo, useCallback } from 'react';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

// Helper to get local date string (YYYY-MM-DD) instead of UTC
const getLocalDateStr = (date: Date): string => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const FILTER_TABS = [
  { key: 'all', label: 'All' },
  { key: 'sale', label: 'Sales' },
  { key: 'restock', label: 'Restocks' },
  { key: 'expense', label: 'Expenses' },
  { key: 'login', label: 'Logins' },
] as const;

type FilterKey = typeof FILTER_TABS[number]['key'];

const ACTION_ICON_MAP: Record<StaffActivity['action'], { icon: typeof ShoppingCart; color: string; bg: string }> = {
  sale: { icon: ShoppingCart, color: '#10b981', bg: 'bg-emerald-500/20' },
  restock: { icon: Package, color: '#3b82f6', bg: 'bg-blue-500/20' },
  price_change: { icon: PencilLine, color: '#f59e0b', bg: 'bg-amber-500/20' },
  expense: { icon: Receipt, color: '#ef4444', bg: 'bg-red-500/20' },
  credit_payment: { icon: CreditCard, color: '#8b5cf6', bg: 'bg-purple-500/20' },
  login: { icon: LogIn, color: '#06b6d4', bg: 'bg-cyan-500/20' },
  product_add: { icon: Plus, color: '#22c55e', bg: 'bg-green-500/20' },
  product_delete: { icon: Trash2, color: '#ef4444', bg: 'bg-red-500/20' },
};

const FILTER_ACTION_MAP: Record<FilterKey, StaffActivity['action'][]> = {
  all: [],
  sale: ['sale'],
  restock: ['restock'],
  expense: ['expense'],
  login: ['login'],
};

export default function ActivityLogScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const currentStaff = useStaffStore((s) => s.currentStaff);
  const canView = !currentStaff || hasPermission(currentStaff.role, 'view_activity');
  const activities = useStaffStore((s) => s.activities);
  const staff = useStaffStore((s) => s.staff);
  const sales = useRetailStore((s) => s.sales);

  // Find matching sale for activities that don't have saleId (legacy)
  const findSaleId = useCallback((activity: StaffActivity): string | undefined => {
    if (activity.saleId) return activity.saleId;
    if (activity.action !== 'sale' || !activity.amount) return undefined;
    // Match by amount + close timestamp (within 5 seconds)
    const actTime = new Date(activity.createdAt).getTime();
    const match = sales.find((s) => s.total === activity.amount && Math.abs(new Date(s.createdAt).getTime() - actTime) < 5000);
    return match?.id;
  }, [sales]);

  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [showStaffDropdown, setShowStaffDropdown] = useState(false);

  const filteredActivities = useMemo(() => {
    let result = [...activities];

    // Filter by action type
    if (activeFilter !== 'all') {
      const allowedActions = FILTER_ACTION_MAP[activeFilter];
      result = result.filter((a) => allowedActions.includes(a.action));
    }

    // Filter by staff member
    if (selectedStaffId) {
      result = result.filter((a) => a.staffId === selectedStaffId);
    }

    return result;
  }, [activities, activeFilter, selectedStaffId]);

  // Group activities by date
  const groupedActivities = useMemo(() => {
    const groups: { date: string; label: string; items: StaffActivity[] }[] = [];
    const dateMap = new Map<string, StaffActivity[]>();

    for (const activity of filteredActivities) {
      const dateKey = getLocalDateStr(new Date(activity.createdAt));
      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, []);
      }
      dateMap.get(dateKey)!.push(activity);
    }

    const today = getLocalDateStr(new Date());
    const yesterday = getLocalDateStr(new Date(Date.now() - 86400000));

    for (const [date, items] of dateMap) {
      const label =
        date === today
          ? 'Today'
          : date === yesterday
          ? 'Yesterday'
          : new Date(date + 'T00:00:00').toLocaleDateString('en-NG', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
            });
      groups.push({ date, label, items });
    }

    return groups;
  }, [filteredActivities]);

  const selectedStaffName = useMemo(() => {
    if (!selectedStaffId) return 'All Staff';
    const found = staff.find((s) => s.id === selectedStaffId);
    return found?.name || 'Unknown';
  }, [selectedStaffId, staff]);

  const handleFilterChange = useCallback((key: FilterKey) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveFilter(key);
  }, []);

  const gradientColors: [string, string, string] = isDark
    ? ['#292524', '#1c1917', '#0c0a09']
    : ['#f5f5f4', '#fafaf9', '#ffffff'];

  if (!canView) {
    return (
      <View className="flex-1 bg-stone-950 items-center justify-center px-8">
        <Text className="text-white text-lg font-semibold text-center">
          You don't have permission to view activity logs.
        </Text>
        <Pressable onPress={() => router.back()} className="mt-4">
          <Text className="text-orange-500 font-medium">Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-stone-50 dark:bg-stone-950">
      <LinearGradient
        colors={gradientColors}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
      />

      {/* Header */}
      <View style={{ paddingTop: insets.top + 8 }} className="px-5 pb-4">
        <Animated.View entering={FadeInDown.delay(100).duration(600)}>
          <View className="flex-row items-center gap-3 mb-2">
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
                Activity Log
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Filter Tabs */}
        <Animated.View entering={FadeInDown.delay(200).duration(600)}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingVertical: 8 }}
          >
            {FILTER_TABS.map((tab) => (
              <Pressable
                key={tab.key}
                onPress={() => handleFilterChange(tab.key)}
                className={`mr-2 px-4 py-2 rounded-full ${
                  activeFilter === tab.key
                    ? 'bg-orange-500'
                    : 'bg-white/80 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700'
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    activeFilter === tab.key
                      ? 'text-white'
                      : 'text-stone-600 dark:text-stone-400'
                  }`}
                >
                  {tab.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Staff Filter Dropdown */}
        {staff.length > 0 && (
          <Animated.View entering={FadeInDown.delay(300).duration(600)}>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowStaffDropdown(!showStaffDropdown);
              }}
              className="flex-row items-center gap-2 bg-white/80 dark:bg-stone-800/80 self-start px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 mt-1"
            >
              <Filter size={14} color={isDark ? '#a8a29e' : '#57534e'} />
              <Text className="text-stone-600 dark:text-stone-400 text-sm font-medium">
                {selectedStaffName}
              </Text>
              <ChevronDown size={14} color={isDark ? '#a8a29e' : '#57534e'} />
            </Pressable>

            {showStaffDropdown && (
              <View className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 mt-2 overflow-hidden">
                <Pressable
                  onPress={() => {
                    setSelectedStaffId(null);
                    setShowStaffDropdown(false);
                  }}
                  className={`px-4 py-3 border-b border-stone-200 dark:border-stone-700 ${
                    !selectedStaffId ? 'bg-orange-500/10' : ''
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${
                      !selectedStaffId ? 'text-orange-500' : 'text-stone-700 dark:text-stone-300'
                    }`}
                  >
                    All Staff
                  </Text>
                </Pressable>
                {staff.map((s) => (
                  <Pressable
                    key={s.id}
                    onPress={() => {
                      setSelectedStaffId(s.id);
                      setShowStaffDropdown(false);
                    }}
                    className={`px-4 py-3 border-b border-stone-200 dark:border-stone-700 ${
                      selectedStaffId === s.id ? 'bg-orange-500/10' : ''
                    }`}
                  >
                    <Text
                      className={`text-sm font-medium ${
                        selectedStaffId === s.id
                          ? 'text-orange-500'
                          : 'text-stone-700 dark:text-stone-300'
                      }`}
                    >
                      {s.name} ({s.role})
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </Animated.View>
        )}
      </View>

      {/* Activity List */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {filteredActivities.length === 0 ? (
          <Animated.View entering={FadeInDown.delay(300).duration(600)} className="items-center py-20">
            <View className="w-16 h-16 rounded-full bg-stone-800/50 items-center justify-center mb-4">
              <Filter size={28} color="#78716c" />
            </View>
            <Text className="text-stone-500 text-base font-medium">No activities found</Text>
            <Text className="text-stone-600 text-sm mt-1">
              {activeFilter !== 'all' || selectedStaffId
                ? 'Try changing your filters'
                : 'Activities will appear here as staff use the app'}
            </Text>
          </Animated.View>
        ) : (
          groupedActivities.map((group, groupIndex) => (
            <Animated.View
              key={group.date}
              entering={FadeInDown.delay(300 + groupIndex * 100).duration(500)}
            >
              <Text className="text-stone-500 dark:text-stone-500 text-xs font-semibold tracking-wide mt-4 mb-2">
                {group.label}
              </Text>
              <View className="bg-white/60 dark:bg-stone-900/60 rounded-xl border border-stone-200 dark:border-stone-800 overflow-hidden">
                {group.items.map((activity, index) => {
                  const config = ACTION_ICON_MAP[activity.action];
                  const IconComponent = config.icon;
                  const saleId = activity.action === 'sale' ? findSaleId(activity) : undefined;
                  const isTappable = !!saleId;

                  const rowContent = (
                    <>
                      <View
                        className={`w-9 h-9 rounded-full items-center justify-center mr-3 ${config.bg}`}
                      >
                        <IconComponent size={16} color={config.color} />
                      </View>
                      <View className="flex-1 mr-2">
                        <Text
                          className="text-stone-700 dark:text-stone-300 text-sm font-medium"
                          numberOfLines={1}
                        >
                          {activity.description}
                        </Text>
                        <Text className="text-stone-400 dark:text-stone-600 text-xs mt-0.5">
                          {activity.staffName} •{' '}
                          {new Date(activity.createdAt).toLocaleTimeString('en-NG', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                          {isTappable && ' • Tap for details'}
                        </Text>
                      </View>
                      {activity.amount !== undefined && (
                        <Text className="text-stone-500 dark:text-stone-400 text-sm font-semibold">
                          {formatNaira(activity.amount)}
                        </Text>
                      )}
                    </>
                  );

                  const rowClass = `flex-row items-center p-3.5 ${
                    index < group.items.length - 1
                      ? 'border-b border-stone-200 dark:border-stone-800'
                      : ''
                  }`;

                  return isTappable ? (
                    <Pressable
                      key={activity.id}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        router.push(`/sale-detail?id=${saleId}`);
                      }}
                      className={`${rowClass} active:bg-stone-200/50 dark:active:bg-stone-800/50`}
                    >
                      {rowContent}
                    </Pressable>
                  ) : (
                    <View key={activity.id} className={rowClass}>
                      {rowContent}
                    </View>
                  );
                })}
              </View>
            </Animated.View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
