import { View, Text, Pressable, Modal, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Lock, Crown, MessageCircle, X } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';

interface PremiumUpsellProps {
  visible: boolean;
  onClose: () => void;
  featureName: string;
  featureDescription: string;
}

const WHATSAPP_NUMBER = '2349030539254';
const WHATSAPP_MESSAGE = 'Hi! I want to upgrade my Oja POS to the Business plan.';

export default function PremiumUpsell({ visible, onClose, featureName, featureDescription }: PremiumUpsellProps) {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const handleWhatsApp = () => {
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;
    Linking.openURL(url);
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

              {/* WhatsApp CTA */}
              <Pressable
                onPress={handleWhatsApp}
                className="bg-[#25D366] py-4 rounded-2xl flex-row items-center justify-center gap-2 mb-3 active:opacity-90"
              >
                <MessageCircle size={20} color="white" />
                <Text className="text-white font-semibold text-base">Upgrade via WhatsApp</Text>
              </Pressable>

              {/* Dismiss */}
              <Pressable onPress={onClose} className="py-3 items-center active:opacity-70">
                <Text className="text-stone-500 dark:text-stone-400 font-medium">Maybe Later</Text>
              </Pressable>
            </View>
          </Animated.View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
