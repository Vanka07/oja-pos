import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { useFonts } from 'expo-font';
import { Poppins_500Medium } from '@expo-google-fonts/poppins/500Medium';
import { useOnboardingStore } from '@/store/onboardingStore';
import { useAuthStore } from '@/store/authStore';
import { useStaffStore, isAppRole } from '@/store/staffStore';
import { useCloudAuthStore } from '@/store/cloudAuthStore';
import { useThemeStore } from '@/store/themeStore';
import { syncAll, startAutoSync, stopAutoSync } from '@/lib/syncService';
import { track, trackDailyActive } from '@/lib/analytics';
import { useEffect, useState } from 'react';
import { View, Appearance, Platform, AppState, AppStateStatus } from 'react-native';
import LockScreen from './lock';
import InstallPrompt from '@/components/InstallPrompt';
import OfflineBar from '@/components/OfflineBar';
import SkeletonLoader from '@/components/SkeletonLoader';

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
  const staff = useStaffStore((s) => s.staff);
  const currentStaff = useStaffStore((s) => s.currentStaff);
  const hasAppStaff = staff.some((s) => s.active && isAppRole(s.role) && s.pin?.length);
  const hasAnyPin = pin !== null || hasAppStaff;
  const isCloudAuthenticated = useCloudAuthStore((s) => s.isAuthenticated);
  const shopId = useCloudAuthStore((s) => s.shopId);
  const cloudSession = useCloudAuthStore((s) => s.session);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Longer delay to ensure stores are fully hydrated from storage
    const timer = setTimeout(() => {
      // Allow store hydration to settle before showing UI
      setIsReady(true);
      SplashScreen.hideAsync();
    }, 300);

    return () => {
      clearTimeout(timer);
    };
  }, []);



  // Initialize cloud auth and auto-sync
  useEffect(() => {
    // Track app open
    track('app_open');
    
    const cloudAuth = useCloudAuthStore.getState();
    cloudAuth.initialize();

    return () => {
      stopAutoSync();
    };
  }, []);

  useEffect(() => {
    if (isCloudAuthenticated && shopId && cloudSession) {
      // Track daily active user
      trackDailyActive(shopId);
      syncAll(shopId).catch(() => {});
      startAutoSync(shopId);
    } else {
      stopAutoSync();
    }

    return () => {
      stopAutoSync();
    };
  }, [isCloudAuthenticated, shopId, cloudSession]);

  // Lock app when going to background (only if PIN is set)
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      // 'background' or 'inactive' on native
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        const authState = useAuthStore.getState();
        const staffState = useStaffStore.getState();
        const hasPinOrStaff = authState.pin !== null || staffState.staff.some(
          (s) => s.active && isAppRole(s.role) && s.pin?.length
        );
        if (hasPinOrStaff) {
          authState.lock();
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Web-specific: lock when tab becomes hidden (user switches away)
    let isPageUnloading = false;
    const handleBeforeUnload = () => {
      isPageUnloading = true;
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        if (isPageUnloading) return;
        const sessionAuthenticated = typeof sessionStorage !== 'undefined' && sessionStorage.getItem('oja_authenticated') === 'true';
        if (sessionAuthenticated) return;
        const authState = useAuthStore.getState();
        const staffState = useStaffStore.getState();
        const hasPinOrStaff = authState.pin !== null || staffState.staff.some(
          (s) => s.active && isAppRole(s.role) && s.pin?.length
        );
        if (hasPinOrStaff) {
          authState.lock();
        }
      }
    };

    if (Platform.OS === 'web') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('beforeunload', handleBeforeUnload);
    }

    return () => {
      subscription.remove();
      if (Platform.OS === 'web') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('beforeunload', handleBeforeUnload);
      }
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
    return <SkeletonLoader />;
  }

  // Show lock screen if any PIN exists (legacy or staff) and app is locked
  if (hasAnyPin && isLocked) {
    return <LockScreen />;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <View style={{ flex: 1 }}>
        <OfflineBar />
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
          <Stack.Screen name="subscription" options={{ presentation: 'modal', headerShown: false }} />
          <Stack.Screen name="activate" options={{ presentation: 'modal', headerShown: false }} />
          <Stack.Screen name="language" options={{ presentation: 'modal', headerShown: false }} />
          <Stack.Screen name="pay" options={{ headerShown: false }} />
          <Stack.Screen name="activity-log" options={{ presentation: 'modal', headerShown: false }} />
          <Stack.Screen name="sale-detail" options={{ presentation: 'modal', headerShown: false }} />
        </Stack>
        {Platform.OS === 'web' && <InstallPrompt />}
      </View>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'Poppins-Medium': Poppins_500Medium,
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
