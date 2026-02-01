import React from 'react';
import { Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { LayoutDashboard, ShoppingCart, Package, Users, MoreHorizontal } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';

function TabBarIcon({ icon: Icon, color, focused }: { icon: React.ComponentType<{ size: number; color: string }>; color: string; focused: boolean }) {
  const size = Platform.OS === 'web' ? 20 : 24;
  const boxSize = Platform.OS === 'web' ? 36 : 48;
  return (
    <View className={`items-center justify-center ${focused ? 'opacity-100' : 'opacity-60'}`} style={{ width: boxSize, height: boxSize }}>
      <Icon size={size} color={color} />
    </View>
  );
}

export default function TabLayout() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#f97316',
        tabBarInactiveTintColor: isDark ? '#78716c' : '#a8a29e',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: isDark ? '#1c1917' : '#ffffff',
          borderTopColor: isDark ? '#292524' : '#e7e5e4',
          borderTopWidth: 1,
          height: Platform.OS === 'web' ? 56 : 85,
          paddingTop: Platform.OS === 'web' ? 4 : 8,
          paddingBottom: Platform.OS === 'web' ? 4 : 28,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: 0,
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
      />
      <Tabs.Screen
        name="pos"
        options={{
          title: 'Sell',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon icon={ShoppingCart} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="inventory"
        options={{
          title: 'Stock',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon icon={Package} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="customers"
        options={{
          title: 'Credit Book',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon icon={Users} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon icon={MoreHorizontal} color={color} focused={focused} />
          ),
        }}
      />
      {/* Hidden screens */}
      <Tabs.Screen name="reports" options={{ href: null }} />
    </Tabs>
  );
}
