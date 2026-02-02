import { useState, useRef, useCallback } from 'react';
import { View, Text, TextInput, Pressable, Keyboard } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, KeyRound, Sparkles, CheckCircle2, XCircle } from 'lucide-react-native';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { useColorScheme } from 'nativewind';
import { useRouter } from 'expo-router';
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeIn,
  ZoomIn,
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';

export default function ActivateScreen() {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();

  const [segments, setSegments] = useState(['', '', '']);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ message: string; days: number; expiresAt: string } | null>(null);
  const [isActivating, setIsActivating] = useState(false);

  const inputRefs = useRef<(TextInput | null)[]>([]);

  const activateWithCode = useSubscriptionStore((s) => s.activateWithCode);

  // Shake animation for error
  const shakeX = useSharedValue(0);
  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  const triggerShake = useCallback(() => {
    shakeX.value = withSequence(
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(0, { duration: 50 })
    );
  }, []);

  // Scale animation for success
  const successScale = useSharedValue(0);
  const successStyle = useAnimatedStyle(() => ({
    transform: [{ scale: successScale.value }],
    opacity: successScale.value,
  }));

  const VALID_CHARS = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

  const handleSegmentChange = (index: number, value: string) => {
    const cleaned = value
      .toUpperCase()
      .split('')
      .filter((c) => VALID_CHARS.includes(c))
      .join('')
      .slice(0, index === 0 ? 3 : 4);

    // First segment is always 'OJA', so we use segments 1 and 2 for input
    const newSegments = [...segments];
    newSegments[index] = cleaned;
    setSegments(newSegments);
    setError(null);

    // Auto-advance to next segment
    const maxLen = index === 0 ? 3 : 4;
    if (cleaned.length === maxLen && index < 2) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (index: number, key: string) => {
    if (key === 'Backspace' && segments[index] === '' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const getFullCode = () => {
    return `OJA-${segments[1]}-${segments[2]}`;
  };

  const isCodeComplete = segments[1].length === 4 && segments[2].length === 4;

  const handleActivate = () => {
    if (!isCodeComplete) return;

    Keyboard.dismiss();
    setIsActivating(true);
    setError(null);

    // Small delay for UX
    setTimeout(() => {
      const code = getFullCode();
      const result = activateWithCode(code);

      if (result.success) {
        const store = useSubscriptionStore.getState();
        setSuccess({
          message: result.message,
          days: store.daysRemaining(),
          expiresAt: store.expiresAt || '',
        });
        successScale.value = withSpring(1, { damping: 12, stiffness: 100 });
      } else {
        setError(result.message);
        triggerShake();
      }
      setIsActivating(false);
    }, 600);
  };

  const gradientColors: [string, string, string] = isDark
    ? ['#292524', '#1c1917', '#0c0a09']
    : ['#f5f5f4', '#fafaf9', '#ffffff'];

  if (success) {
    return (
      <View className="flex-1 bg-stone-50 dark:bg-stone-950">
        <LinearGradient
          colors={gradientColors}
          style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
        />
        <View style={{ paddingTop: insets.top + 40 }} className="flex-1 items-center justify-center px-8">
          <Animated.View entering={ZoomIn.duration(500)} className="items-center">
            <View className="w-24 h-24 rounded-full bg-emerald-500/20 items-center justify-center mb-6">
              <CheckCircle2 size={56} color="#10b981" />
            </View>
          </Animated.View>

          <Animated.Text
            entering={FadeInUp.delay(300).duration(500)}
            style={{ fontFamily: 'Poppins-ExtraBold' }}
            className="text-stone-900 dark:text-white text-3xl font-extrabold text-center mb-2"
          >
            Activated! 🎉
          </Animated.Text>

          <Animated.Text
            entering={FadeInUp.delay(400).duration(500)}
            className="text-stone-500 dark:text-stone-400 text-center text-base mb-8"
          >
            {success.message}
          </Animated.Text>

          <Animated.View entering={FadeInUp.delay(500).duration(500)} className="w-full">
            <View className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-5 mb-6">
              <View className="flex-row justify-between mb-3">
                <Text className="text-stone-500 dark:text-stone-400 text-sm">Plan</Text>
                <Text className="text-emerald-400 font-semibold">Business</Text>
              </View>
              <View className="flex-row justify-between mb-3">
                <Text className="text-stone-500 dark:text-stone-400 text-sm">Duration</Text>
                <Text className="text-emerald-400 font-semibold">{success.days} days</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-stone-500 dark:text-stone-400 text-sm">Expires</Text>
                <Text className="text-emerald-400 font-semibold">
                  {new Date(success.expiresAt).toLocaleDateString('en-NG', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </Text>
              </View>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(700).duration(500)} className="w-full">
            <Pressable
              onPress={() => router.replace('/(tabs)')}
              className="bg-[#e05e1b] py-4 rounded-2xl items-center active:opacity-90"
            >
              <Text className="text-white font-semibold text-base">Start Using Business</Text>
            </Pressable>
          </Animated.View>
        </View>
      </View>
    );
  }

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
              <Text className="text-stone-500 text-sm font-medium tracking-wide uppercase">Redeem</Text>
              <Text
                style={{ fontFamily: 'Poppins-ExtraBold' }}
                className="text-stone-900 dark:text-white text-2xl font-bold tracking-tight"
              >
                Activation Code
              </Text>
            </View>
          </View>
        </Animated.View>
      </View>

      <View className="flex-1 px-5">
        {/* Icon */}
        <Animated.View entering={FadeInDown.delay(200).duration(600)} className="items-center mt-8 mb-6">
          <View className="w-20 h-20 rounded-full bg-orange-500/15 items-center justify-center mb-4">
            <KeyRound size={40} color="#e05e1b" />
          </View>
          <Text className="text-stone-500 dark:text-stone-400 text-center text-sm leading-5">
            Enter the activation code you received{'\n'}to unlock your Business plan.
          </Text>
        </Animated.View>

        {/* Code Input */}
        <Animated.View entering={FadeInDown.delay(300).duration(600)}>
          <Animated.View style={shakeStyle} className="flex-row items-center justify-center gap-2 mb-2">
            {/* OJA prefix (non-editable) */}
            <View className="bg-stone-200 dark:bg-stone-800 rounded-xl px-4 py-3.5 min-w-[60px] items-center">
              <Text
                style={{ fontFamily: 'Poppins-Bold' }}
                className="text-stone-500 dark:text-stone-500 text-lg font-bold tracking-widest"
              >
                OJA
              </Text>
            </View>

            <Text className="text-stone-400 text-2xl font-bold">-</Text>

            {/* Segment 1 */}
            <TextInput
              ref={(el) => { inputRefs.current[1] = el; }}
              value={segments[1]}
              onChangeText={(v) => handleSegmentChange(1, v)}
              onKeyPress={(e) => handleKeyPress(1, e.nativeEvent.key)}
              maxLength={4}
              autoCapitalize="characters"
              autoCorrect={false}
              className={`bg-white dark:bg-stone-900 border-2 ${
                error ? 'border-red-500' : segments[1].length === 4 ? 'border-emerald-500' : 'border-stone-200 dark:border-stone-700'
              } rounded-xl px-4 py-3 min-w-[80px] text-center text-lg font-bold tracking-widest text-stone-900 dark:text-white`}
              style={{ fontFamily: 'Poppins-Bold' }}
              placeholderTextColor="#78716c"
              placeholder="····"
            />

            <Text className="text-stone-400 text-2xl font-bold">-</Text>

            {/* Segment 2 */}
            <TextInput
              ref={(el) => { inputRefs.current[2] = el; }}
              value={segments[2]}
              onChangeText={(v) => handleSegmentChange(2, v)}
              onKeyPress={(e) => handleKeyPress(2, e.nativeEvent.key)}
              maxLength={4}
              autoCapitalize="characters"
              autoCorrect={false}
              className={`bg-white dark:bg-stone-900 border-2 ${
                error ? 'border-red-500' : segments[2].length === 4 ? 'border-emerald-500' : 'border-stone-200 dark:border-stone-700'
              } rounded-xl px-4 py-3 min-w-[80px] text-center text-lg font-bold tracking-widest text-stone-900 dark:text-white`}
              style={{ fontFamily: 'Poppins-Bold' }}
              placeholderTextColor="#78716c"
              placeholder="····"
            />
          </Animated.View>

          {/* Error message */}
          {error && (
            <Animated.View entering={FadeIn.duration(300)} className="flex-row items-center justify-center gap-2 mt-3">
              <XCircle size={16} color="#ef4444" />
              <Text className="text-red-500 text-sm font-medium">{error}</Text>
            </Animated.View>
          )}
        </Animated.View>

        {/* Activate Button */}
        <Animated.View entering={FadeInDown.delay(400).duration(600)} className="mt-8">
          <Pressable
            onPress={handleActivate}
            disabled={!isCodeComplete || isActivating}
            className={`py-4 rounded-2xl flex-row items-center justify-center gap-2 active:opacity-90 ${
              isCodeComplete && !isActivating ? 'bg-[#e05e1b]' : 'bg-stone-300 dark:bg-stone-800'
            }`}
          >
            <Sparkles size={20} color="white" />
            <Text className="text-white font-semibold text-base">
              {isActivating ? 'Activating...' : 'Activate Code'}
            </Text>
          </Pressable>
        </Animated.View>

        {/* Help text */}
        <Animated.View entering={FadeInDown.delay(500).duration(600)} className="mt-6">
          <Text className="text-stone-400 dark:text-stone-600 text-xs text-center leading-4">
            Activation codes are provided after payment.{'\n'}
            Each code can only be used once.
          </Text>
        </Animated.View>
      </View>
    </View>
  );
}
