import React from 'react';
import { Platform, View } from 'react-native';
import { Tabs } from 'expo-router';
import { LayoutDashboard, ShoppingCart, Package, Users, Settings } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import * as Haptics from 'expo-haptics';

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

export default function TabLayout() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const handleTabPress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

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
          height: Platform.OS === 'web' ? 64 : 96,
          paddingTop: Platform.OS === 'web' ? 8 : 12,
          paddingBottom: Platform.OS === 'web' ? 8 : 28,
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
