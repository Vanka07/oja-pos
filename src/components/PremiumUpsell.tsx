import { View, Text, Pressable, Modal, TextInput, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Lock, Crown, CreditCard, X, Mail } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { buildCheckoutUrl, generateReference } from '@/lib/paystack';
import { useCloudAuthStore } from '@/store/cloudAuthStore';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';

interface PremiumUpsellProps {
  visible: boolean;
  onClose: () => void;
  featureName: string;
  featureDescription: string;
}

export default function PremiumUpsell({ visible, onClose, featureName, featureDescription }: PremiumUpsellProps) {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();

  const cloudAuth = useCloudAuthStore();
  const [email, setEmail] = useState(cloudAuth.session?.user?.email || '');
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handlePayWithPaystack = () => {
    const userEmail = cloudAuth.session?.user?.email || email.trim();
    if (!userEmail) {
      setShowEmailInput(true);
      return;
    }
    
    setIsLoading(true);
    const reference = generateReference();
    const checkoutUrl = buildCheckoutUrl({
      email: userEmail,
      reference,
      shopId: cloudAuth.shopId || undefined,
    });
    
    setIsLoading(false);
    onClose();
    setTimeout(() => {
      router.push({
        pathname: '/pay',
        params: {
          url: encodeURIComponent(checkoutUrl),
          reference,
          email: userEmail,
        },
      });
    }, 300);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable className="flex-1 bg-black/60 justify-end" onPress={onClose}>
        <Pressable onPress={() => {}} className="bg-white dark:bg-stone-900 rounded-t-3xl" style={{ paddingBottom: insets.bottom + 20 }}>
          <Animated.View entering={SlideInDown.duration(400)}>
            <View className="p-6">
              {/* Close button */}
              <Pressable onPress={onClose} className="absolute right-6 top-6 z-10">
                <X size={24} color="#78716c" />
              </Pressable>

              {/* Lock icon */}
              <View className="items-center mb-5">
                <View className="w-16 h-16 rounded-full bg-orange-500/20 items-center justify-center mb-4">
                  <Crown size={32} color="#e05e1b" />
                </View>
                <Text style={{ fontFamily: 'Poppins-Bold' }} className="text-stone-900 dark:text-white text-xl font-bold text-center">
                  Business Plan Feature
                </Text>
              </View>

              {/* Feature info */}
              <View className="bg-stone-100/50 dark:bg-stone-800/50 rounded-2xl p-4 mb-5">
                <View className="flex-row items-center gap-2 mb-2">
                  <Lock size={16} color="#e05e1b" />
                  <Text className="text-stone-900 dark:text-white font-semibold">{featureName}</Text>
                </View>
                <Text className="text-stone-500 dark:text-stone-400 text-sm leading-5">
                  {featureDescription}
                </Text>
              </View>

              {/* Price */}
              <View className="items-center mb-5">
                <Text className="text-stone-500 dark:text-stone-400 text-sm">Upgrade to Business</Text>
                <Text style={{ fontFamily: 'Poppins-ExtraBold' }} className="text-orange-500 text-3xl font-extrabold">
                  ₦5,000<Text className="text-stone-400 text-base font-normal">/mo</Text>
                </Text>
              </View>

              {/* Email input (shown when no cloud auth email) */}
              {showEmailInput && !cloudAuth.session?.user?.email && (
                <View className="mb-4">
                  <View className="flex-row items-center bg-stone-100 dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 px-4">
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
                </View>
              )}

              {/* Paystack CTA */}
              <Pressable
                onPress={handlePayWithPaystack}
                disabled={isLoading}
                className="bg-[#e05e1b] py-4 rounded-2xl flex-row items-center justify-center gap-2 mb-3 active:opacity-90"
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <CreditCard size={20} color="white" />
                    <Text className="text-white font-semibold text-base">Upgrade Now — ₦5,000/mo</Text>
                  </>
                )}
              </Pressable>

              {/* Dismiss */}
              <Pressable onPress={onClose} className="py-3 items-center active:opacity-70">
                <Text className="text-stone-500 dark:text-stone-400 font-medium">Maybe Later</Text>
              </Pressable>

              {/* Activation code link */}
              <Pressable
                onPress={() => {
                  onClose();
                  setTimeout(() => router.push('/activate'), 300);
                }}
                className="py-2 items-center active:opacity-70"
              >
                <Text className="text-orange-500 text-sm font-medium">Have a code?</Text>
              </Pressable>
            </View>
          </Animated.View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
