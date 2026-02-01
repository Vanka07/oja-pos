import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Mail, Lock, Cloud, ArrowLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { useCloudAuthStore } from '@/store/cloudAuthStore';
import { useOnboardingStore } from '@/store/onboardingStore';
import { useStaffStore, hasPermission } from '@/store/staffStore';
import { syncAll } from '@/lib/syncService';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useColorScheme } from 'nativewind';
import * as Haptics from 'expo-haptics';

export default function CloudAuthScreen() {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const currentStaff = useStaffStore((s) => s.currentStaff);
  const canManageCloud = !currentStaff || hasPermission(currentStaff.role, 'manage_cloud');

  useEffect(() => {
    if (!canManageCloud) router.back();
  }, [canManageCloud, router]);

  const [mode, setMode] = useState<'signin' | 'signup'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const shopInfo = useOnboardingStore((s) => s.shopInfo);
  const { signUp, signIn, loading, error } = useCloudAuthStore();

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) return;
    if (password.length < 6) {
      useCloudAuthStore.setState({ error: 'Password must be at least 6 characters' });
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    let success = false;
    if (mode === 'signup') {
      success = await signUp(email.trim(), password, shopInfo?.name || 'My Shop', shopInfo?.ownerName);
    } else {
      success = await signIn(email.trim(), password);
    }

    if (success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Trigger initial sync
      const shopId = useCloudAuthStore.getState().shopId;
      if (shopId) {
        syncAll(shopId).catch(console.warn);
      }

      router.back();
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  return (
    <View className="flex-1 bg-stone-50 dark:bg-stone-950">
      <LinearGradient
        colors={isDark ? ['#292524', '#1c1917', '#0c0a09'] : ['#f5f5f4', '#fafaf9', '#ffffff']}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={{ paddingTop: insets.top + 8 }} className="px-5 flex-row items-center">
            <Pressable
              onPress={() => router.back()}
              className="w-10 h-10 rounded-full bg-stone-100/50 dark:bg-stone-800/50 items-center justify-center mr-3"
            >
              <ArrowLeft size={20} color="#a8a29e" />
            </Pressable>
            <Text className="text-stone-900 dark:text-white text-lg font-semibold">Cloud Sync</Text>
          </View>

          {/* Icon & Description */}
          <Animated.View entering={FadeInDown.delay(100).duration(600)} className="items-center mt-10 px-5">
            <View className="w-20 h-20 rounded-3xl bg-blue-500/20 items-center justify-center mb-5">
              <Cloud size={40} color="#3b82f6" />
            </View>
            <Text className="text-stone-900 dark:text-white text-2xl font-bold text-center mb-2">
              {mode === 'signup' ? 'Create Account' : 'Welcome Back'}
            </Text>
            <Text className="text-stone-500 dark:text-stone-400 text-center text-base leading-6">
              {mode === 'signup'
                ? 'Sync your shop data across devices. Your data stays safe even if you lose your phone.'
                : 'Sign in to sync your shop data to the cloud.'}
            </Text>
          </Animated.View>

          {/* Form */}
          <Animated.View entering={FadeInDown.delay(200).duration(600)} className="px-5 mt-8 gap-4">
            {/* Email */}
            <View>
              <Text className="text-stone-500 dark:text-stone-400 text-sm mb-2">Email</Text>
              <View className="flex-row items-center bg-stone-200/80 dark:bg-stone-800/80 rounded-xl border border-stone-300 dark:border-stone-700 px-4">
                <Mail size={18} color="#78716c" />
                <TextInput
                  className="flex-1 py-4 pl-3 text-stone-900 dark:text-white text-base"
                  placeholder="your@email.com"
                  placeholderTextColor="#57534e"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            </View>

            {/* Password */}
            <View>
              <Text className="text-stone-500 dark:text-stone-400 text-sm mb-2">Password</Text>
              <View className="flex-row items-center bg-stone-200/80 dark:bg-stone-800/80 rounded-xl border border-stone-300 dark:border-stone-700 px-4">
                <Lock size={18} color="#78716c" />
                <TextInput
                  className="flex-1 py-4 pl-3 text-stone-900 dark:text-white text-base"
                  placeholder="Min 6 characters"
                  placeholderTextColor="#57534e"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
              </View>
            </View>

            {/* Error */}
            {error && (
              <View className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
                <Text className="text-red-400 text-sm">{error}</Text>
              </View>
            )}

            {/* Submit */}
            <Pressable
              onPress={handleSubmit}
              disabled={loading || !email.trim() || !password.trim()}
              className={`py-4 rounded-xl mt-2 ${
                loading ? 'bg-blue-500/50' : 'bg-blue-500'
              } active:opacity-90`}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-semibold text-center text-lg">
                  {mode === 'signup' ? 'Create Account & Sync' : 'Sign In'}
                </Text>
              )}
            </Pressable>

            {/* Toggle mode */}
            <Pressable
              onPress={() => {
                setMode(mode === 'signup' ? 'signin' : 'signup');
                useCloudAuthStore.setState({ error: null });
              }}
              className="py-3"
            >
              <Text className="text-stone-500 dark:text-stone-400 text-center">
                {mode === 'signup' ? (
                  <>Already have an account? <Text className="text-blue-400 font-medium">Sign In</Text></>
                ) : (
                  <>New here? <Text className="text-blue-400 font-medium">Create Account</Text></>
                )}
              </Text>
            </Pressable>
          </Animated.View>

          {/* Info */}
          <Animated.View entering={FadeInDown.delay(300).duration(600)} className="px-5 mt-6">
            <View className="bg-stone-100/30 dark:bg-stone-800/30 rounded-xl p-4 border border-stone-200 dark:border-stone-800">
              <Text className="text-stone-500 text-xs leading-5">
                ☁️ Your data is encrypted and stored securely.{'\n'}
                📱 Works offline — syncs when you're back online.{'\n'}
                🔄 Access your shop from any device.
              </Text>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
