import { View, Text, ScrollView, Pressable, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  Crown,
  Check,
  X as XIcon,
  MessageCircle,
  Sparkles,
} from 'lucide-react-native';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { useColorScheme } from 'nativewind';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';

const WHATSAPP_NUMBER = '2349030539254';
const WHATSAPP_MESSAGE = 'Hi! I want to upgrade my Oja POS to the Business plan.';

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

const BUSINESS_FEATURES = [
  'Everything in Starter',
  'Unlimited products',
  'Weekly/Monthly/Yearly reports',
  'Multiple staff accounts',
  'Cloud sync & backup',
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

  const handleWhatsApp = () => {
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;
    Linking.openURL(url);
  };

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
            colors={isPremium ? ['#059669', '#047857'] : ['#e05e1b', '#b84a15']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 20, padding: 20 }}
          >
            <View className="flex-row items-center gap-3 mb-2">
              <Crown size={24} color="white" />
              <Text className="text-white/90 font-medium">Current Plan</Text>
            </View>
            <Text style={{ fontFamily: 'Poppins-Bold' }} className="text-white text-3xl font-bold">
              {isPremium ? 'Business' : 'Starter'}
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

        {/* Starter Plan */}
        <Animated.View entering={FadeInDown.delay(300).duration(600)} className="mx-5 mt-6">
          <View className={`bg-white/80 dark:bg-stone-900/80 rounded-2xl p-5 border ${
            !isPremium ? 'border-orange-500' : 'border-stone-200 dark:border-stone-800'
          }`}>
            {!isPremium && (
              <View className="absolute -top-3 right-4 bg-orange-500 px-3 py-1 rounded-full">
                <Text className="text-white text-xs font-semibold">Current</Text>
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

        {/* Business Plan */}
        <Animated.View entering={FadeInDown.delay(400).duration(600)} className="mx-5 mt-4">
          <View className={`bg-white/80 dark:bg-stone-900/80 rounded-2xl p-5 border ${
            isPremium ? 'border-emerald-500' : 'border-stone-200 dark:border-stone-800'
          }`}>
            {isPremium && (
              <View className="absolute -top-3 right-4 bg-emerald-500 px-3 py-1 rounded-full">
                <Text className="text-white text-xs font-semibold">Active</Text>
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
          </View>
        </Animated.View>

        {/* CTA */}
        {!isPremium && (
          <Animated.View entering={FadeInDown.delay(500).duration(600)} className="mx-5 mt-6">
            <Pressable
              onPress={handleWhatsApp}
              className="bg-[#25D366] py-4 rounded-2xl flex-row items-center justify-center gap-2 active:opacity-90"
            >
              <MessageCircle size={20} color="white" />
              <Text className="text-white font-semibold text-base">Upgrade via WhatsApp</Text>
            </Pressable>
            <Text className="text-stone-400 text-xs text-center mt-3">
              Contact us to activate your Business plan. Pay via transfer.
            </Text>
          </Animated.View>
        )}

        {isPremium && (
          <Animated.View entering={FadeInDown.delay(500).duration(600)} className="mx-5 mt-6">
            <View className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4">
              <Text className="text-emerald-400 font-medium text-center">
                ✅ You're on the Business plan. Enjoy all premium features!
              </Text>
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}
