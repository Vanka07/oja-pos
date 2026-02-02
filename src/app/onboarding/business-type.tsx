import { View, Text, Pressable, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowRight } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useColorScheme } from 'nativewind';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useOnboardingStore } from '@/store/onboardingStore';
import * as Haptics from 'expo-haptics';

interface BusinessType {
  key: string;
  emoji: string;
  title: string;
  subtitle: string;
}

const businessTypes: BusinessType[] = [
  { key: 'supermarket', emoji: '🛒', title: 'Supermarket/Provision Store', subtitle: 'Groceries, drinks & household items' },
  { key: 'salon', emoji: '💇‍♀️', title: 'Hair Salon/Barber', subtitle: 'Hair styling, cuts & treatments' },
  { key: 'pharmacy', emoji: '💊', title: 'Pharmacy/Chemist', subtitle: 'Medicines & health products' },
  { key: 'fashion', emoji: '👗', title: 'Fashion/Boutique', subtitle: 'Clothing, fabrics & accessories' },
  { key: 'restaurant', emoji: '🍛', title: 'Restaurant/Food', subtitle: 'Meals, drinks & food service' },
  { key: 'electronics', emoji: '📱', title: 'Electronics/Phone', subtitle: 'Gadgets, accessories & repairs' },
  { key: 'other', emoji: '🏪', title: 'Other (Custom)', subtitle: 'Set up your own categories' },
];

export default function BusinessTypeScreen() {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const setBusinessType = useOnboardingStore((s) => s.setBusinessType);
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (key: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelected(key);
  };

  const handleContinue = () => {
    if (!selected) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setBusinessType(selected);
    router.push('/onboarding/setup');
  };

  return (
    <View className="flex-1 bg-stone-50 dark:bg-stone-950">
      <LinearGradient
        colors={isDark ? ['#292524', '#1c1917', '#0c0a09'] : ['#f5f5f4', '#fafaf9', '#ffffff']}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 px-6" style={{ paddingTop: insets.top + 40 }}>
          {/* Header */}
          <Animated.View entering={FadeInDown.delay(100).duration(600)}>
            <Text className="text-stone-900 dark:text-white text-3xl font-bold mb-2">
              What kind of business{'\n'}do you run?
            </Text>
            <Text className="text-stone-500 dark:text-stone-400 text-base leading-6 mb-8">
              We'll set up sample products for you
            </Text>
          </Animated.View>

          {/* Grid */}
          <View className="flex-row flex-wrap justify-between">
            {businessTypes.map((type, index) => {
              const isSelected = selected === type.key;
              const isLastOdd = index === businessTypes.length - 1 && businessTypes.length % 2 === 1;

              return (
                <Animated.View
                  key={type.key}
                  entering={FadeInDown.delay(150 + index * 80).duration(500)}
                  style={{ width: isLastOdd ? '100%' : '48%', marginBottom: 12 }}
                >
                  <Pressable
                    onPress={() => handleSelect(type.key)}
                    className="active:scale-95"
                    style={{
                      backgroundColor: isDark
                        ? isSelected ? '#2c1a0e' : '#292524'
                        : isSelected ? '#fef3ec' : '#ffffff',
                      borderWidth: 2,
                      borderColor: isSelected ? '#e05e1b' : isDark ? '#44403c' : '#e7e5e4',
                      borderRadius: 16,
                      padding: 16,
                      minHeight: 120,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 36, marginBottom: 8 }}>{type.emoji}</Text>
                    <Text
                      className="text-stone-900 dark:text-white font-bold text-center"
                      style={{ fontSize: 13, lineHeight: 18 }}
                    >
                      {type.title}
                    </Text>
                    <Text
                      className="text-stone-500 dark:text-stone-400 text-center mt-1"
                      style={{ fontSize: 11, lineHeight: 15 }}
                    >
                      {type.subtitle}
                    </Text>
                  </Pressable>
                </Animated.View>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Button */}
      <Animated.View
        entering={FadeInDown.delay(800).duration(600)}
        className="px-6"
        style={{ paddingBottom: insets.bottom + 20, paddingTop: 12 }}
      >
        <Pressable
          onPress={handleContinue}
          disabled={!selected}
          className="active:scale-98"
          style={{ opacity: selected ? 1 : 0.4 }}
        >
          <LinearGradient
            colors={['#e05e1b', '#b84a15']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              borderRadius: 16,
              padding: 18,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <Text className="text-white text-lg font-semibold">Continue</Text>
            <ArrowRight size={20} color="white" />
          </LinearGradient>
        </Pressable>
      </Animated.View>
    </View>
  );
}
