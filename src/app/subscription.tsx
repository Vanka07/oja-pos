import { View, Text, ScrollView, Pressable, Linking, TextInput, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  Crown,
  Check,
  X as XIcon,
  CreditCard,
  Sparkles,
  Mail,
  Zap,
  TrendingUp,
} from 'lucide-react-native';
import { useSubscriptionStore, PLAN_LEVEL } from '@/store/subscriptionStore';
import { maskCode } from '@/lib/activationCode';
import { useColorScheme } from 'nativewind';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { buildCheckoutUrl, generateReference } from '@/lib/paystack';
import { useCloudAuthStore } from '@/store/cloudAuthStore';
import Animated, { FadeInDown } from 'react-native-reanimated';

const STARTER_FEATURES = [
  'Point of Sale',
  'Up to 50 products',
  'Today\'s reports only',
  'Credit book',
  'WhatsApp receipts',
  '1 staff member (owner)',
  'PIN lock',
  'Export data backup',
];

const GROWTH_FEATURES = [
  'Everything in Starter',
  'Unlimited products',
  'Cloud sync & backup',
  'Advanced reports (week/month/year)',
];

const BUSINESS_FEATURES = [
  'Everything in Growth',
  'Multiple staff accounts',
  'Payroll management',
  'Low stock WhatsApp alerts',
  'Receipt printer support',
];

export default function SubscriptionScreen() {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();

  const plan = useSubscriptionStore((s) => s.plan);
  const expiresAt = useSubscriptionStore((s) => s.expiresAt);
  const isPremium = useSubscriptionStore((s) => s.isPremium)();
  const daysRemaining = useSubscriptionStore((s) => s.daysRemaining)();
  const activationCode = useSubscriptionStore((s) => s.activationCode);

  const isGrowth = plan === 'growth' && isPremium;
  const isBusiness = plan === 'business' && isPremium;

  const cloudAuth = useCloudAuthStore();
  const [email, setEmail] = useState(cloudAuth.session?.user?.email || '');
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [isLoading, setIsLoading] = useState<'growth' | 'business' | null>(null);

  const handlePayWithPaystack = (targetPlan: 'growth' | 'business') => {
    const userEmail = cloudAuth.session?.user?.email || email.trim();
    if (!userEmail) {
      setShowEmailInput(true);
      return;
    }

    setIsLoading(targetPlan);
    const reference = generateReference();
    const checkoutUrl = buildCheckoutUrl({
      email: userEmail,
      plan: targetPlan,
      reference,
      shopId: cloudAuth.shopId || undefined,
    });

    setIsLoading(null);
    router.push({
      pathname: '/pay',
      params: {
        url: encodeURIComponent(checkoutUrl),
        reference,
        email: userEmail,
      },
    });
  };

  const currentPlanLabel = isBusiness ? 'Business' : isGrowth ? 'Growth' : 'Starter';
  const currentPlanColors: [string, string] = isBusiness
    ? ['#e05e1b', '#b84a15']
    : isGrowth
    ? ['#0d9488', '#0f766e']
    : ['#78716c', '#57534e'];

  const gradientColors: [string, string, string] = isDark
    ? ['#292524', '#1c1917', '#0c0a09']
    : ['#f5f5f4', '#fafaf9', '#ffffff'];

  return (
    <View className="flex-1 bg-stone-50 dark:bg-stone-950">
      <LinearGradient
        colors={gradientColors}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
      />

      {/* Header */}
      <View style={{ paddingTop: insets.top + 8 }} className="px-5 pb-4">
        <Animated.View entering={FadeInDown.delay(100).duration(600)}>
          <View className="flex-row items-center gap-3">
            <Pressable
              onPress={() => router.back()}
              className="w-10 h-10 rounded-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 items-center justify-center"
            >
              <ChevronLeft size={20} color="#a8a29e" />
            </Pressable>
            <View>
              <Text className="text-stone-500 text-sm font-medium tracking-wide uppercase">Plan</Text>
              <Text style={{ fontFamily: 'Poppins-ExtraBold' }} className="text-stone-900 dark:text-white text-2xl font-bold tracking-tight">
                Subscription
              </Text>
            </View>
          </View>
        </Animated.View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Current Plan Badge */}
        <Animated.View entering={FadeInDown.delay(200).duration(600)} className="mx-5 mt-2">
          <LinearGradient
            colors={currentPlanColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 20, padding: 20 }}
          >
            <View className="flex-row items-center gap-3 mb-2">
              <Crown size={24} color="white" />
              <Text className="text-white/90 font-medium">Current Plan</Text>
            </View>
            <Text style={{ fontFamily: 'Poppins-Bold' }} className="text-white text-3xl font-bold">
              {currentPlanLabel}
            </Text>
            {isPremium && expiresAt ? (
              <View className="mt-2">
                <Text className="text-white/70 text-sm">
                  {daysRemaining > 0
                    ? `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining`
                    : 'Expired'}
                </Text>
                <Text className="text-white/50 text-xs mt-1">
                  Expires {new Date(expiresAt).toLocaleDateString('en-NG', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </Text>
              </View>
            ) : (
              <Text className="text-white/70 text-sm mt-1">Free forever — upgrade anytime</Text>
            )}
          </LinearGradient>
        </Animated.View>

        {/* Email input (shown when no cloud auth email) */}
        {showEmailInput && !cloudAuth.session?.user?.email && (
          <Animated.View entering={FadeInDown.delay(250).duration(600)} className="mx-5 mt-4">
            <Text className="text-stone-400 text-sm mb-2">Enter your email to continue</Text>
            <View className="flex-row items-center bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 px-4">
              <Mail size={18} color="#78716c" />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="your@email.com"
                placeholderTextColor="#57534e"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                className="flex-1 text-stone-900 dark:text-white py-3.5 ml-3 text-base"
              />
            </View>
          </Animated.View>
        )}

        {/* ── Starter Plan ── */}
        <Animated.View entering={FadeInDown.delay(300).duration(600)} className="mx-5 mt-6">
          <View className={`bg-white/80 dark:bg-stone-900/80 rounded-2xl p-5 border ${
            !isPremium ? 'border-stone-400 dark:border-stone-600' : 'border-stone-200 dark:border-stone-800'
          }`}>
            {!isPremium && (
              <View className="absolute -top-3 right-4 bg-stone-500 px-3 py-1 rounded-full">
                <Text className="text-white text-xs font-semibold">Current Plan</Text>
              </View>
            )}
            <View className="flex-row items-center gap-2 mb-1">
              <Text style={{ fontFamily: 'Poppins-SemiBold' }} className="text-stone-900 dark:text-white text-xl font-semibold">
                Starter
              </Text>
            </View>
            <Text className="text-stone-900 dark:text-white text-3xl font-bold mb-4">
              Free
            </Text>
            <View className="gap-2.5">
              {STARTER_FEATURES.map((feature) => (
                <View key={feature} className="flex-row items-center gap-3">
                  <Check size={16} color="#10b981" />
                  <Text className="text-stone-600 dark:text-stone-400 text-sm">{feature}</Text>
                </View>
              ))}
            </View>
          </View>
        </Animated.View>

        {/* ── Growth Plan ── */}
        <Animated.View entering={FadeInDown.delay(400).duration(600)} className="mx-5 mt-4">
          <View className={`bg-white/80 dark:bg-stone-900/80 rounded-2xl p-5 border-2 ${
            isGrowth ? 'border-teal-500' : 'border-teal-400/50 dark:border-teal-600/50'
          }`}>
            {/* Popular badge */}
            <View className="absolute -top-3 right-4 bg-teal-500 px-3 py-1 rounded-full flex-row items-center gap-1">
              <Zap size={10} color="white" />
              <Text className="text-white text-xs font-semibold">
                {isGrowth ? 'Current Plan' : 'Popular'}
              </Text>
            </View>
            <View className="flex-row items-center gap-2 mb-1">
              <TrendingUp size={18} color="#0d9488" />
              <Text style={{ fontFamily: 'Poppins-SemiBold' }} className="text-stone-900 dark:text-white text-xl font-semibold">
                Growth
              </Text>
            </View>
            <View className="flex-row items-baseline mb-4">
              <Text className="text-teal-600 dark:text-teal-400 text-3xl font-bold">₦2,500</Text>
              <Text className="text-stone-400 text-base">/month</Text>
            </View>
            <View className="gap-2.5">
              {GROWTH_FEATURES.map((feature) => (
                <View key={feature} className="flex-row items-center gap-3">
                  <Check size={16} color="#0d9488" />
                  <Text className="text-stone-600 dark:text-stone-400 text-sm">{feature}</Text>
                </View>
              ))}
            </View>

            {/* CTA for Growth */}
            {!isGrowth && !isBusiness && (
              <Pressable
                onPress={() => handlePayWithPaystack('growth')}
                disabled={isLoading === 'growth'}
                className="bg-teal-600 py-3.5 rounded-xl flex-row items-center justify-center gap-2 mt-5 active:opacity-90"
              >
                {isLoading === 'growth' ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <CreditCard size={18} color="white" />
                    <Text className="text-white font-semibold text-sm">Pay with Paystack — ₦2,500/mo</Text>
                  </>
                )}
              </Pressable>
            )}
          </View>
        </Animated.View>

        {/* ── Business Plan ── */}
        <Animated.View entering={FadeInDown.delay(500).duration(600)} className="mx-5 mt-4">
          <View className={`bg-white/80 dark:bg-stone-900/80 rounded-2xl p-5 border ${
            isBusiness ? 'border-emerald-500' : 'border-stone-200 dark:border-stone-800'
          }`}>
            {isBusiness && (
              <View className="absolute -top-3 right-4 bg-emerald-500 px-3 py-1 rounded-full">
                <Text className="text-white text-xs font-semibold">Current Plan</Text>
              </View>
            )}
            <View className="flex-row items-center gap-2 mb-1">
              <Sparkles size={18} color="#e05e1b" />
              <Text style={{ fontFamily: 'Poppins-SemiBold' }} className="text-stone-900 dark:text-white text-xl font-semibold">
                Business
              </Text>
            </View>
            <View className="flex-row items-baseline mb-4">
              <Text className="text-orange-500 text-3xl font-bold">₦5,000</Text>
              <Text className="text-stone-400 text-base">/month</Text>
            </View>
            <View className="gap-2.5">
              {BUSINESS_FEATURES.map((feature) => (
                <View key={feature} className="flex-row items-center gap-3">
                  <Check size={16} color="#e05e1b" />
                  <Text className="text-stone-600 dark:text-stone-400 text-sm">{feature}</Text>
                </View>
              ))}
            </View>

            {/* CTA for Business */}
            {!isBusiness && (
              <Pressable
                onPress={() => handlePayWithPaystack('business')}
                disabled={isLoading === 'business'}
                className="bg-[#e05e1b] py-3.5 rounded-xl flex-row items-center justify-center gap-2 mt-5 active:opacity-90"
              >
                {isLoading === 'business' ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <CreditCard size={18} color="white" />
                    <Text className="text-white font-semibold text-sm">Pay with Paystack — ₦5,000/mo</Text>
                  </>
                )}
              </Pressable>
            )}
          </View>
        </Animated.View>

        {/* Secure payment note */}
        {!isBusiness && (
          <Animated.View entering={FadeInDown.delay(600).duration(600)} className="mx-5 mt-4">
            <Text className="text-stone-400 text-xs text-center">
              Secure payment via card, bank transfer, or USSD
            </Text>
            <Pressable
              onPress={() => router.push('/activate')}
              className="mt-3 py-3 items-center active:opacity-70"
            >
              <Text className="text-orange-500 font-semibold text-sm">Have an activation code?</Text>
            </Pressable>
          </Animated.View>
        )}

        {/* Active subscription info */}
        {isPremium && (
          <Animated.View entering={FadeInDown.delay(600).duration(600)} className="mx-5 mt-6">
            <View className={`${isBusiness ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-teal-500/10 border-teal-500/30'} border rounded-2xl p-4`}>
              <Text className={`${isBusiness ? 'text-emerald-400' : 'text-teal-400'} font-medium text-center`}>
                ✅ You're on the {currentPlanLabel} plan. Enjoy {isBusiness ? 'all premium' : 'your upgraded'} features!
              </Text>
              {activationCode && (
                <Text className={`${isBusiness ? 'text-emerald-500/60' : 'text-teal-500/60'} text-xs text-center mt-2`}>
                  Activated with: {maskCode(activationCode)}
                </Text>
              )}
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}
