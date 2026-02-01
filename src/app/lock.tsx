import { View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/authStore';
import { useStaffStore } from '@/store/staffStore';
import { useState, useCallback, useEffect } from 'react';
import { Lock, Delete, UserCheck } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown, useSharedValue, useAnimatedStyle, withSequence, withTiming } from 'react-native-reanimated';
import { useColorScheme } from 'nativewind';

export default function LockScreen() {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [entered, setEntered] = useState('');
  const [error, setError] = useState(false);
  const [welcomeName, setWelcomeName] = useState<string | null>(null);
  const unlock = useAuthStore((s) => s.unlock);
  const staff = useStaffStore((s) => s.staff);
  const currentStaff = useStaffStore((s) => s.currentStaff);
  const hasStaff = staff.length > 0;
  const shakeX = useSharedValue(0);

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  // Clear welcome message after a delay
  useEffect(() => {
    if (welcomeName) {
      const timer = setTimeout(() => setWelcomeName(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [welcomeName]);

  const handlePress = useCallback((digit: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setError(false);
    const next = entered + digit;
    if (next.length <= 4) {
      setEntered(next);
      if (next.length === 4) {
        const success = unlock(next);
        if (success) {
          // Show welcome with staff name if staff system is active
          const staffState = useStaffStore.getState();
          if (staffState.currentStaff) {
            setWelcomeName(staffState.currentStaff.name);
          }
        } else {
          setError(true);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          shakeX.value = withSequence(
            withTiming(-12, { duration: 50 }),
            withTiming(12, { duration: 50 }),
            withTiming(-12, { duration: 50 }),
            withTiming(12, { duration: 50 }),
            withTiming(0, { duration: 50 })
          );
          setTimeout(() => setEntered(''), 400);
        }
      }
    }
  }, [entered, unlock, shakeX]);

  const handleDelete = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEntered((prev) => prev.slice(0, -1));
    setError(false);
  }, []);

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

  return (
    <View className="flex-1 bg-stone-50 dark:bg-stone-950 items-center justify-center" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <Animated.View entering={FadeIn.duration(600)} className="items-center">
        <View className="w-16 h-16 rounded-full bg-orange-500/20 items-center justify-center mb-6">
          <Lock size={28} color="#f97316" />
        </View>
        <Text className="text-stone-900 dark:text-white text-2xl font-bold mb-2">Enter PIN</Text>
        <Text className="text-stone-500 text-sm mb-8">
          {hasStaff
            ? 'Enter your staff PIN to unlock'
            : 'Enter your 4-digit PIN to unlock'}
        </Text>

        {/* PIN dots */}
        <Animated.View style={shakeStyle} className="flex-row gap-4 mb-10">
          {[0, 1, 2, 3].map((i) => (
            <View
              key={i}
              className={`w-4 h-4 rounded-full ${
                i < entered.length
                  ? error
                    ? 'bg-red-500'
                    : 'bg-orange-500'
                  : 'bg-stone-300 dark:bg-stone-700'
              }`}
            />
          ))}
        </Animated.View>

        {error && (
          <Text className="text-red-400 text-sm mb-4">Wrong PIN. Try again.</Text>
        )}

        {/* Keypad */}
        <View className="w-72">
          <View className="flex-row flex-wrap">
            {keys.map((key, index) => (
              <View key={index} className="w-1/3 p-2">
                {key === '' ? (
                  <View className="h-16" />
                ) : key === 'del' ? (
                  <Pressable
                    onPress={handleDelete}
                    className="h-16 rounded-2xl items-center justify-center active:bg-stone-200 dark:active:bg-stone-800"
                  >
                    <Delete size={24} color="#a8a29e" />
                  </Pressable>
                ) : (
                  <Pressable
                    onPress={() => handlePress(key)}
                    className="h-16 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 items-center justify-center active:bg-stone-200 dark:active:bg-stone-800"
                  >
                    <Text className="text-stone-900 dark:text-white text-2xl font-medium">{key}</Text>
                  </Pressable>
                )}
              </View>
            ))}
          </View>
        </View>
      </Animated.View>
    </View>
  );
}
