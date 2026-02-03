import React, { useEffect, useState } from 'react';
import { Platform, View, Text } from 'react-native';
import { Tabs } from 'expo-router';
import { LayoutDashboard, ShoppingCart, Package, Users, Settings, BarChart3 } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import * as Haptics from 'expo-haptics';
import { useRetailStore } from '@/store/retailStore';
import { getOverdueCustomers } from '@/lib/creditIntelligence';

function TabBarIcon({ icon: Icon, color, focused }: { icon: React.ComponentType<{ size: number; color: string }>; color: string; focused: boolean }) {
  const iconSize = Platform.OS === 'web' ? 22 : 28;
  const boxSize = Platform.OS === 'web' ? 40 : 52;
  return (
    <View
      className={`items-center justify-center rounded-2xl ${focused ? 'bg-orange-500/15' : ''}`}
      style={{ width: boxSize, height: boxSize }}
    >
      <Icon size={iconSize} color={color} />
    </View>
  );
}

function useIsMobileWeb() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const check = () => setIsMobile(window.innerWidth <= 768);
      check();
      window.addEventListener('resize', check);
      // Add viewport-fit=cover for Safari safe areas
      const meta = document.querySelector('meta[name="viewport"]');
      if (meta && !meta.getAttribute('content')?.includes('viewport-fit')) {
        meta.setAttribute('content', meta.getAttribute('content') + ', viewport-fit=cover');
      }
      return () => window.removeEventListener('resize', check);
    }
  }, []);
  return isMobile;
}

export default function TabLayout() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const isMobileWeb = useIsMobileWeb();

  const customers = useRetailStore((s) => s.customers);
  const overdueCount = getOverdueCustomers(customers).length;

  const handleTabPress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  // Mobile web needs extra bottom padding for Safari toolbar
  const tabBarHeight = Platform.OS === 'web' ? (isMobileWeb ? 80 : 64) : 96;
  const tabBarPaddingBottom = Platform.OS === 'web' ? (isMobileWeb ? 20 : 8) : 28;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#e05e1b',
        tabBarInactiveTintColor: isDark ? '#78716c' : '#a8a29e',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: isDark ? '#1c1917' : '#ffffff',
          borderTopColor: isDark ? '#292524' : '#e7e5e4',
          borderTopWidth: 1,
          height: tabBarHeight,
          paddingTop: Platform.OS === 'web' ? 8 : 12,
          paddingBottom: tabBarPaddingBottom,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginTop: 2,
        },
        tabBarIconStyle: {
          marginBottom: Platform.OS === 'web' ? -2 : 0,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon icon={LayoutDashboard} color={color} focused={focused} />
          ),
        }}
        listeners={{ tabPress: handleTabPress }}
      />
      <Tabs.Screen
        name="summary"
        options={{
          title: 'Summary',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon icon={BarChart3} color={color} focused={focused} />
          ),
        }}
        listeners={{ tabPress: handleTabPress }}
      />
      <Tabs.Screen
        name="pos"
        options={{
          title: 'Sell',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon icon={ShoppingCart} color={color} focused={focused} />
          ),
        }}
        listeners={{ tabPress: handleTabPress }}
      />
      <Tabs.Screen
        name="inventory"
        options={{
          title: 'Stock',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon icon={Package} color={color} focused={focused} />
          ),
        }}
        listeners={{ tabPress: handleTabPress }}
      />
      <Tabs.Screen
        name="customers"
        options={{
          title: 'Credit Book',
          tabBarBadge: overdueCount > 0 ? overdueCount : undefined,
          tabBarBadgeStyle: overdueCount > 0 ? { backgroundColor: '#ef4444', fontSize: 10, minWidth: 18, height: 18, lineHeight: 18 } : undefined,
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon icon={Users} color={color} focused={focused} />
          ),
        }}
        listeners={{ tabPress: handleTabPress }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon icon={Settings} color={color} focused={focused} />
          ),
        }}
        listeners={{ tabPress: handleTabPress }}
      />
      {/* Hidden screens */}
      <Tabs.Screen name="reports" options={{ href: null }} />
    </Tabs>
  );
}
