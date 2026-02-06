import { View, Text, Pressable, Platform, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useCallback, useRef, useEffect } from 'react';
import { ChevronLeft, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { verifyPayment, extractReference } from '@/lib/paystack';
import { track } from '@/lib/analytics';
import Animated, { FadeInDown } from 'react-native-reanimated';

// Conditionally import WebView for native platforms only
let WebView: any = null;
if (Platform.OS !== 'web') {
  try {
    WebView = require('react-native-webview').default;
  } catch {
    // WebView not available
  }
}

type PaymentStatus = 'loading' | 'paying' | 'verifying' | 'success' | 'failed';

export default function PayScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ url: string; reference: string; email: string; plan: string }>();

  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [status, setStatus] = useState<PaymentStatus>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const activate = useSubscriptionStore((s) => s.activate);
  const webViewRef = useRef<any>(null);
  const hasVerified = useRef(false);

  const checkoutUrl = params.url ? decodeURIComponent(params.url as string) : '';
  const paymentRef = params.reference as string || '';
  const targetPlan = (params.plan as string) === 'growth' ? 'growth' : 'business';

  const handleVerify = useCallback(async (reference: string) => {
    if (hasVerified.current || !reference) return;
    hasVerified.current = true;
    setStatus('verifying');

    try {
      const result = await verifyPayment(reference);
      if (result.success) {
        setStatus('success');
        activate(targetPlan as 'growth' | 'business', 30);
        track('subscription_started', undefined, { plan: targetPlan });
        // Auto-navigate after success
        setTimeout(() => {
          router.replace('/(tabs)');
        }, 2000);
      } else {
        setStatus('failed');
        setErrorMessage(result.message || 'Payment could not be verified.');
      }
    } catch {
      setStatus('failed');
      setErrorMessage('Network error. Please check your connection.');
    }
  }, [activate, router, targetPlan]);

  // For web platform: open in new window
  useEffect(() => {
    if (Platform.OS === 'web' && checkoutUrl) {
      setStatus('paying');
      const popup = window.open(checkoutUrl, '_blank', 'width=500,height=700');

      // Poll for popup close
      const interval = setInterval(() => {
        if (popup?.closed) {
          clearInterval(interval);
          // After popup closes, try to verify
          handleVerify(paymentRef);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [checkoutUrl, handleVerify, paymentRef]);

  const handleRetry = () => {
    hasVerified.current = false;
    setStatus('loading');
    setErrorMessage('');
    if (Platform.OS === 'web') {
      window.open(checkoutUrl, '_blank', 'width=500,height=700');
    } else if (webViewRef.current) {
      webViewRef.current.reload();
    }
  };

  // Handle WebView navigation state changes
  const handleNavigationChange = useCallback((navState: { url: string }) => {
    const { url } = navState;

    // Detect callback URL
    if (url.includes('ojapos.app/payment-callback') || url.includes('payment-callback')) {
      const reference = extractReference(url) || paymentRef;
      if (reference) {
        handleVerify(reference);
      }
    }
  }, [paymentRef, handleVerify]);

  // Status overlay screens
  if (status === 'verifying') {
    return (
      <View className="flex-1 bg-stone-50 dark:bg-stone-950 items-center justify-center px-8">
        <ActivityIndicator size="large" color="#e05e1b" />
        <Text style={{ fontFamily: 'Poppins-SemiBold' }} className="text-stone-900 dark:text-white text-xl mt-6 text-center">
          Verifying Payment...
        </Text>
        <Text className="text-stone-500 dark:text-stone-400 text-center mt-2">
          Please wait while we confirm your payment.
        </Text>
      </View>
    );
  }

  if (status === 'success') {
    return (
      <View className="flex-1 bg-stone-50 dark:bg-stone-950 items-center justify-center px-8">
        <Animated.View entering={FadeInDown.duration(600)} className="items-center">
          <View className="w-20 h-20 rounded-full bg-emerald-500/20 items-center justify-center mb-6">
            <CheckCircle size={48} color="#10b981" />
          </View>
          <Text style={{ fontFamily: 'Poppins-Bold' }} className="text-stone-900 dark:text-white text-2xl text-center">
            Payment Successful! 🎉
          </Text>
          <Text className="text-stone-500 dark:text-stone-400 text-center mt-3">
            Your {targetPlan === 'growth' ? 'Growth' : 'Business'} plan is now active for 30 days. Enjoy all premium features!
          </Text>
          <Pressable
            onPress={() => router.replace('/(tabs)')}
            className="bg-emerald-500 px-8 py-4 rounded-2xl mt-8 active:opacity-90"
          >
            <Text className="text-white font-semibold text-base">Go to Dashboard</Text>
          </Pressable>
        </Animated.View>
      </View>
    );
  }

  if (status === 'failed') {
    return (
      <View className="flex-1 bg-stone-50 dark:bg-stone-950 items-center justify-center px-8">
        <Animated.View entering={FadeInDown.duration(600)} className="items-center">
          <View className="w-20 h-20 rounded-full bg-red-500/20 items-center justify-center mb-6">
            <AlertCircle size={48} color="#ef4444" />
          </View>
          <Text style={{ fontFamily: 'Poppins-Bold' }} className="text-stone-900 dark:text-white text-2xl text-center">
            Payment Failed
          </Text>
          <Text className="text-stone-500 dark:text-stone-400 text-center mt-3">
            {errorMessage || 'Something went wrong with your payment.'}
          </Text>
          <View className="flex-row gap-3 mt-8">
            <Pressable
              onPress={handleRetry}
              className="bg-[#e05e1b] px-6 py-4 rounded-2xl flex-row items-center gap-2 active:opacity-90"
            >
              <RefreshCw size={18} color="white" />
              <Text className="text-white font-semibold">Try Again</Text>
            </Pressable>
            <Pressable
              onPress={() => router.back()}
              className="bg-stone-200 dark:bg-stone-800 px-6 py-4 rounded-2xl active:opacity-90"
            >
              <Text className="text-stone-600 dark:text-stone-300 font-semibold">Go Back</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    );
  }

  // Web platform: show waiting screen since payment is in popup
  if (Platform.OS === 'web') {
    return (
      <View className="flex-1 bg-stone-50 dark:bg-stone-950 items-center justify-center px-8">
        <ActivityIndicator size="large" color="#e05e1b" />
        <Text style={{ fontFamily: 'Poppins-SemiBold' }} className="text-stone-900 dark:text-white text-xl mt-6 text-center">
          Complete Payment
        </Text>
        <Text className="text-stone-500 dark:text-stone-400 text-center mt-2">
          A payment window has been opened. Complete your payment there.
        </Text>
        <Pressable
          onPress={() => handleVerify(paymentRef)}
          className="bg-[#e05e1b] px-6 py-4 rounded-2xl mt-8 active:opacity-90"
        >
          <Text className="text-white font-semibold">I've Completed Payment</Text>
        </Pressable>
        <Pressable
          onPress={() => router.back()}
          className="mt-4 py-3 active:opacity-70"
        >
          <Text className="text-stone-500 font-medium">Cancel</Text>
        </Pressable>
      </View>
    );
  }

  // Native platform: WebView
  return (
    <View className="flex-1 bg-stone-950">
      {/* Header */}
      <View style={{ paddingTop: insets.top + 8 }} className="px-4 pb-3 bg-stone-900 border-b border-stone-800">
        <View className="flex-row items-center gap-3">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-stone-800 items-center justify-center"
          >
            <ChevronLeft size={20} color="#a8a29e" />
          </Pressable>
          <View className="flex-1">
            <Text className="text-white font-semibold text-base">Secure Payment</Text>
            <Text className="text-stone-500 text-xs">Powered by Paystack</Text>
          </View>
          <View className="bg-emerald-500/20 px-3 py-1 rounded-full">
            <Text className="text-emerald-400 text-xs font-medium">🔒 Secure</Text>
          </View>
        </View>
      </View>

      {/* WebView */}
      {WebView && checkoutUrl ? (
        <WebView
          ref={webViewRef}
          source={{ uri: checkoutUrl }}
          onNavigationStateChange={handleNavigationChange}
          onLoadStart={() => setStatus('loading')}
          onLoadEnd={() => setStatus('paying')}
          startInLoadingState
          renderLoading={() => (
            <View className="absolute inset-0 bg-stone-950 items-center justify-center">
              <ActivityIndicator size="large" color="#e05e1b" />
              <Text className="text-stone-400 mt-4">Loading payment page...</Text>
            </View>
          )}
          style={{ flex: 1, backgroundColor: '#0c0a09' }}
          javaScriptEnabled
          domStorageEnabled
          scalesPageToFit
          originWhitelist={['*']}
          onShouldStartLoadWithRequest={(request: { url: string }) => {
            // Intercept callback URL
            if (request.url.includes('ojapos.app/payment-callback')) {
              const reference = extractReference(request.url) || paymentRef;
              if (reference) handleVerify(reference);
              return false;
            }
            return true;
          }}
        />
      ) : (
        <View className="flex-1 items-center justify-center">
          <Text className="text-stone-400">Unable to load payment page.</Text>
          <Pressable onPress={() => router.back()} className="mt-4 py-3 active:opacity-70">
            <Text className="text-orange-500 font-medium">Go Back</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
