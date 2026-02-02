import { View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Lock, Delete } from 'lucide-react-native';
import { useStaffStore, isAppRole, type StaffMember } from '@/store/staffStore';
import { useState, useCallback, useMemo } from 'react';
import Animated, { FadeInDown, FadeIn, useSharedValue, useAnimatedStyle, withSequence, withTiming } from 'react-native-reanimated';
import { useColorScheme } from 'nativewind';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';

export default function StaffSwitchScreen() {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const staff = useStaffStore((s) => s.staff);
  const switchStaff = useStaffStore((s) => s.switchStaff);
  const currentStaff = useStaffStore((s) => s.currentStaff);

  // Only show app roles (not employees) in switch screen
  const activeStaff = staff.filter((s) => s.active && isAppRole(s.role));

  // Shake animation
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
  }, [shakeX]);

  const handlePinDigit = useCallback((digit: string) => {
    if (pin.length >= 4) return;
    const newPin = pin + digit;
    setPin(newPin);
    setError(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (newPin.length === 4) {
      // Try to authenticate
      const success = switchStaff(newPin);
      if (success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.back();
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setError(true);
        triggerShake();
        setTimeout(() => {
          setPin('');
          setError(false);
        }, 1000);
      }
    }
  }, [pin, switchStaff, router, triggerShake]);

  const handleDelete = useCallback(() => {
    if (pin.length === 0) return;
    setPin(pin.slice(0, -1));
    setError(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [pin]);

  const handleSelectStaff = useCallback((member: StaffMember) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedStaff(member);
    setPin('');
    setError(false);
  }, []);

  const PinDots = useCallback(() => (
    <Animated.View style={shakeStyle} className="flex-row gap-4 justify-center my-8">
      {[0, 1, 2, 3].map((i) => (
        <View
          key={i}
          className={`w-4 h-4 rounded-full ${
            error
              ? 'bg-red-500'
              : i < pin.length
                ? 'bg-orange-500'
                : 'bg-stone-700'
          }`}
        />
      ))}
    </Animated.View>
  ), [shakeStyle, pin, error]);

  const NumPad = useCallback(() => (
    <View className="gap-4 px-12">
      {[[1, 2, 3], [4, 5, 6], [7, 8, 9], ['', 0, 'del']].map((row, rowIndex) => (
        <View key={rowIndex} className="flex-row gap-4 justify-center">
          {row.map((digit, colIndex) => {
            if (digit === '') {
              return <View key={colIndex} className="w-20 h-16" />;
            }
            if (digit === 'del') {
              return (
                <Pressable
                  key={colIndex}
                  onPress={handleDelete}
                  className="w-20 h-16 rounded-2xl bg-stone-100/50 dark:bg-stone-800/50 items-center justify-center active:bg-stone-200 dark:active:bg-stone-700"
                >
                  <Delete size={24} color="#a8a29e" />
                </Pressable>
              );
            }
            return (
              <Pressable
                key={colIndex}
                onPress={() => handlePinDigit(String(digit))}
                className="w-20 h-16 rounded-2xl bg-stone-200/80 dark:bg-stone-800/80 items-center justify-center active:bg-stone-300 dark:active:bg-stone-700 border border-stone-300 dark:border-stone-700"
              >
                <Text className="text-stone-900 dark:text-white text-2xl font-semibold">{String(digit)}</Text>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  ), [handlePinDigit, handleDelete]);

  return (
    <View className="flex-1 bg-stone-50 dark:bg-stone-950">
      <LinearGradient
        colors={isDark ? ['#292524', '#1c1917', '#0c0a09'] : ['#f5f5f4', '#fafaf9', '#ffffff']}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
      />

      {/* Header */}
      <View style={{ paddingTop: insets.top + 8 }} className="px-5 pb-4">
        <View className="flex-row items-center justify-between">
          <Text className="text-stone-900 dark:text-white text-xl font-bold">Switch Staff</Text>
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 items-center justify-center"
          >
            <X size={20} color="#a8a29e" />
          </Pressable>
        </View>
      </View>

      {!selectedStaff ? (
        // Staff selection grid
        <View className="flex-1 px-5">
          <Text className="text-stone-500 text-sm mb-6 text-center">
            Who's working now?
          </Text>
          <View className="flex-row flex-wrap justify-center gap-6">
            {activeStaff.map((member, index) => (
              <Animated.View
                key={member.id}
                entering={FadeIn.delay(100 + index * 80).duration(400)}
              >
                <Pressable
                  onPress={() => handleSelectStaff(member)}
                  className={`items-center active:scale-95 ${
                    currentStaff?.id === member.id ? 'opacity-100' : 'opacity-80'
                  }`}
                >
                  <View className={`w-20 h-20 rounded-full items-center justify-center mb-2 ${
                    currentStaff?.id === member.id
                      ? 'bg-orange-500/30 border-2 border-orange-500'
                      : 'bg-stone-200 dark:bg-stone-800 border-2 border-stone-300 dark:border-stone-700'
                  }`}>
                    <Text className="text-stone-900 dark:text-white text-2xl font-bold">
                      {member.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <Text className="text-stone-900 dark:text-white font-medium text-sm">{member.name.split(' ')[0]}</Text>
                  <Text className="text-stone-500 text-xs capitalize">{member.role}</Text>
                </Pressable>
              </Animated.View>
            ))}
          </View>

          {activeStaff.length === 0 && (
            <View className="items-center py-16">
              <Lock size={48} color="#57534e" />
              <Text className="text-stone-500 text-lg mt-4">No active staff</Text>
              <Text className="text-stone-600 dark:text-stone-400 text-center mt-2">
                Add staff members from Settings → Staff Management
              </Text>
            </View>
          )}
        </View>
      ) : (
        // PIN entry
        <View className="flex-1">
          <Animated.View entering={FadeInDown.duration(300)} className="items-center">
            <View className={`w-24 h-24 rounded-full items-center justify-center mb-3 ${
              error ? 'bg-red-500/20 border-2 border-red-500' : 'bg-orange-500/15 border-2 border-orange-500'
            }`}>
              <Text className="text-stone-900 dark:text-white text-3xl font-bold">
                {selectedStaff.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text className="text-stone-900 dark:text-white text-xl font-bold">{selectedStaff.name}</Text>
            <Text className="text-stone-500 text-sm capitalize">{selectedStaff.role}</Text>

            {error ? (
              <Text className="text-red-400 text-sm mt-4 font-medium">Wrong PIN — try again</Text>
            ) : (
              <Text className="text-stone-500 text-sm mt-4">Enter 4-digit PIN</Text>
            )}

            <PinDots />
          </Animated.View>

          <NumPad />

          <Pressable
            onPress={() => { setSelectedStaff(null); setPin(''); setError(false); }}
            className="mt-8 py-3 items-center"
          >
            <Text className="text-stone-500 font-medium">← Back to staff list</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
