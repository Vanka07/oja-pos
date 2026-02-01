import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { useFonts } from 'expo-font';
import { useOnboardingStore } from '@/store/onboardingStore';
import { useAuthStore } from '@/store/authStore';
import { useStaffStore } from '@/store/staffStore';
import { useCloudAuthStore } from '@/store/cloudAuthStore';
import { useThemeStore } from '@/store/themeStore';
import { syncAll, startAutoSync, stopAutoSync } from '@/lib/syncService';
import { useEffect, useState } from 'react';
import { View, Appearance } from 'react-native';
import LockScreen from './lock';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav({ colorScheme }: { colorScheme: 'light' | 'dark' | null | undefined }) {
  const router = useRouter();
  const segments = useSegments();
  const hasCompletedOnboarding = useOnboardingStore((s) => s.hasCompletedOnboarding);
  const pin = useAuthStore((s) => s.pin);
  const isLocked = useAuthStore((s) => s.isLocked);
  const staffCount = useStaffStore((s) => s.staff.length);
  const hasAnyPin = pin !== null || staffCount > 0;
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Small delay to ensure store is hydrated
    const timer = setTimeout(() => {
      setIsReady(true);
      SplashScreen.hideAsync();
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Initialize cloud auth and auto-sync
  useEffect(() => {
    const cloudAuth = useCloudAuthStore.getState();
    cloudAuth.initialize().then(() => {
      const { shopId, isAuthenticated } = useCloudAuthStore.getState();
      if (isAuthenticated && shopId) {
        syncAll(shopId).catch(() => {});
        startAutoSync(shopId);
      }
    });

    return () => {
      stopAutoSync();
    };
  }, []);

  useEffect(() => {
    if (!isReady) return;

    const inOnboarding = segments[0] === 'onboarding';

    if (!hasCompletedOnboarding && !inOnboarding) {
      router.replace('/onboarding');
    } else if (hasCompletedOnboarding && inOnboarding) {
      router.replace('/(tabs)');
    }
  }, [hasCompletedOnboarding, segments, isReady, router]);

  if (!isReady) {
    return <View className="flex-1 bg-stone-50 dark:bg-stone-950" />;
  }

  // Show lock screen if any PIN exists (legacy or staff) and app is locked
  if (hasAnyPin && isLocked) {
    return <LockScreen />;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        <Stack.Screen name="product-edit" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="staff" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="staff-switch" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="shop-profile" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="cloud-auth" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="payroll" options={{ presentation: 'modal', headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'Poppins-Bold': require('../../assets/fonts/Poppins-Bold.ttf'),
    'Poppins-SemiBold': require('../../assets/fonts/Poppins-SemiBold.ttf'),
    'Poppins-ExtraBold': require('../../assets/fonts/Poppins-ExtraBold.ttf'),
  });

  const { colorScheme, setColorScheme } = useColorScheme();
  const themePreference = useThemeStore((s) => s.preference);

  // Apply theme preference
  useEffect(() => {
    if (themePreference === 'system') {
      const systemScheme = Appearance.getColorScheme() || 'dark';
      setColorScheme(systemScheme);
    } else {
      setColorScheme(themePreference);
    }
  }, [themePreference, setColorScheme]);

  // Listen for system theme changes when set to 'system'
  useEffect(() => {
    if (themePreference !== 'system') return;
    const subscription = Appearance.addChangeListener(({ colorScheme: newScheme }) => {
      setColorScheme(newScheme || 'dark');
    });
    return () => subscription.remove();
  }, [themePreference, setColorScheme]);

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <KeyboardProvider>
          <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
          <RootLayoutNav colorScheme={colorScheme} />
        </KeyboardProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
