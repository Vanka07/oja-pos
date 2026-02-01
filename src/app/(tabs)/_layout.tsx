import React from 'react';
import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { LayoutDashboard, ShoppingCart, Package, BarChart3 } from 'lucide-react-native';

function TabBarIcon({ icon: Icon, color, focused }: { icon: React.ComponentType<{ size: number; color: string }>; color: string; focused: boolean }) {
  return (
    <View className={`items-center justify-center ${focused ? 'opacity-100' : 'opacity-60'}`}>
      <Icon size={24} color={color} />
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#f97316',
        tabBarInactiveTintColor: '#78716c',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1c1917',
          borderTopColor: '#292524',
          borderTopWidth: 1,
          height: 85,
          paddingTop: 8,
          paddingBottom: 28,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          marginTop: 4,
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
          title: 'POS',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon icon={ShoppingCart} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="inventory"
        options={{
          title: 'Inventory',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon icon={Package} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: 'Reports',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon icon={BarChart3} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="two"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
