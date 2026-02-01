import { View, Text, Pressable, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ShoppingBag, Wifi, WifiOff, BarChart3, Package, ArrowRight } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useState } from 'react';
import { useRouter } from 'expo-router';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OnboardingSlide {
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient: [string, string, string];
}

const slides: OnboardingSlide[] = [
  {
    icon: <ShoppingBag size={64} color="white" />,
    title: 'Welcome to Oja',
    description: 'The complete point-of-sale system built for Nigerian retail businesses. Simple, fast, and reliable.',
    gradient: ['#ea580c', '#c2410c', '#9a3412'],
  },
  {
    icon: (
      <View className="flex-row items-center gap-2">
        <WifiOff size={48} color="white" />
        <ArrowRight size={24} color="white" opacity={0.5} />
        <Wifi size={48} color="white" />
      </View>
    ),
    title: 'Works Offline',
    description: 'No internet? No problem. Make sales, track inventory, and run your business even without network. Data syncs when you\'re back online.',
    gradient: ['#059669', '#047857', '#065f46'],
  },
  {
    icon: <Package size={64} color="white" />,
    title: 'Manage Inventory',
    description: 'Track stock levels, get low-stock alerts, and never run out of your best-selling products again.',
    gradient: ['#2563eb', '#1d4ed8', '#1e40af'],
  },
  {
    icon: <BarChart3 size={64} color="white" />,
    title: 'See Your Profits',
    description: 'Daily, weekly, and monthly reports show you exactly how your business is performing. Know your numbers.',
    gradient: ['#7c3aed', '#6d28d9', '#5b21b6'],
  },
];

export default function OnboardingWelcome() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      router.replace('/onboarding/setup');
    }
  };

  const handleSkip = () => {
    router.replace('/onboarding/setup');
  };

  const slide = slides[currentSlide];

  return (
    <View className="flex-1">
      <LinearGradient
        colors={slide.gradient}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
      />

      <View className="flex-1" style={{ paddingTop: insets.top + 20 }}>
        {/* Skip Button */}
        <View className="flex-row justify-end px-6">
          <Pressable onPress={handleSkip} className="py-2 px-4 active:opacity-70">
            <Text className="text-white/70 font-medium">Skip</Text>
          </Pressable>
        </View>

        {/* Content */}
        <View className="flex-1 justify-center items-center px-8">
          <Animated.View
            key={`icon-${currentSlide}`}
            entering={FadeInUp.duration(500)}
            className="mb-8"
          >
            <View className="w-32 h-32 rounded-full bg-white/20 items-center justify-center">
              {slide.icon}
            </View>
          </Animated.View>

          <Animated.View
            key={`text-${currentSlide}`}
            entering={FadeInDown.duration(500)}
            className="items-center"
          >
            <Text className="text-white text-3xl font-bold text-center mb-4">
              {slide.title}
            </Text>
            <Text className="text-white/80 text-lg text-center leading-7">
              {slide.description}
            </Text>
          </Animated.View>
        </View>

        {/* Bottom Section */}
        <View style={{ paddingBottom: insets.bottom + 20 }} className="px-6">
          {/* Dots */}
          <View className="flex-row justify-center gap-2 mb-8">
            {slides.map((_, index) => (
              <View
                key={index}
                className={`h-2 rounded-full ${
                  index === currentSlide ? 'w-8 bg-white' : 'w-2 bg-white/40'
                }`}
              />
            ))}
          </View>

          {/* Next Button */}
          <Pressable
            onPress={handleNext}
            className="bg-white/20 border border-white/30 rounded-2xl py-4 active:scale-98"
          >
            <Text className="text-white text-lg font-semibold text-center">
              {currentSlide === slides.length - 1 ? 'Get Started' : 'Next'}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
