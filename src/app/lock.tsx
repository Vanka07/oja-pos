import { View, Text, Pressable, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/authStore';
import { useStaffStore } from '@/store/staffStore';
import { useState, useCallback, useEffect } from 'react';
import { Lock, Delete, KeyRound } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown, useSharedValue, useAnimatedStyle, withSequence, withTiming } from 'react-native-reanimated';

type RecoveryStep = 'code' | 'newPin' | 'confirmPin';

export default function LockScreen() {
  const insets = useSafeAreaInsets();
  const [entered, setEntered] = useState('');
  const [error, setError] = useState(false);
  const [welcomeName, setWelcomeName] = useState<string | null>(null);
  const unlock = useAuthStore((s) => s.unlock);
  const resetWithRecovery = useAuthStore((s) => s.resetWithRecovery);
  const recoveryCode = useAuthStore((s) => s.recoveryCode);
  const staff = useStaffStore((s) => s.staff);
  const hasStaff = staff.length > 0;
  const shakeX = useSharedValue(0);

  // Recovery state
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryStep, setRecoveryStep] = useState<RecoveryStep>('code');
  const [recoveryEntered, setRecoveryEntered] = useState('');
  const [recoveryFirstPin, setRecoveryFirstPin] = useState('');
  const [recoveryError, setRecoveryError] = useState('');

  const recoveryShakeX = useSharedValue(0);
  const recoveryShakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: recoveryShakeX.value }],
  }));

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  const triggerShake = useCallback((shakeVal: typeof shakeX) => {
    shakeVal.value = withSequence(
      withTiming(-12, { duration: 50 }),
      withTiming(12, { duration: 50 }),
      withTiming(-12, { duration: 50 }),
      withTiming(12, { duration: 50 }),
      withTiming(0, { duration: 50 })
    );
  }, []);

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
          triggerShake(shakeX);
          setTimeout(() => setEntered(''), 400);
        }
      }
    }
  }, [entered, unlock, shakeX, triggerShake]);

  const handleDelete = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEntered((prev) => prev.slice(0, -1));
    setError(false);
  }, []);

  // Recovery handlers
  const maxDigits = recoveryStep === 'code' ? 6 : 4;

  const resetRecoveryState = useCallback(() => {
    setRecoveryStep('code');
    setRecoveryEntered('');
    setRecoveryFirstPin('');
    setRecoveryError('');
  }, []);

  const handleRecoveryPress = useCallback((digit: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRecoveryError('');
    const next = recoveryEntered + digit;
    if (next.length <= maxDigits) {
      setRecoveryEntered(next);
      if (next.length === maxDigits) {
        if (recoveryStep === 'code') {
          // Validate recovery code
          if (next === recoveryCode) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setRecoveryEntered('');
            setRecoveryStep('newPin');
          } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            setRecoveryError('Invalid recovery code');
            triggerShake(recoveryShakeX);
            setTimeout(() => setRecoveryEntered(''), 400);
          }
        } else if (recoveryStep === 'newPin') {
          setRecoveryFirstPin(next);
          setRecoveryEntered('');
          setRecoveryStep('confirmPin');
        } else if (recoveryStep === 'confirmPin') {
          if (next === recoveryFirstPin) {
            // Reset PIN
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            resetWithRecovery(recoveryCode!, next);
            setShowRecovery(false);
            resetRecoveryState();
          } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            setRecoveryError("PINs don't match, try again");
            triggerShake(recoveryShakeX);
            setTimeout(() => {
              setRecoveryEntered('');
              setRecoveryFirstPin('');
              setRecoveryStep('newPin');
            }, 400);
          }
        }
      }
    }
  }, [recoveryEntered, recoveryStep, recoveryCode, recoveryFirstPin, maxDigits, resetWithRecovery, triggerShake, recoveryShakeX, resetRecoveryState]);

  const handleRecoveryDelete = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRecoveryEntered((prev) => prev.slice(0, -1));
    setRecoveryError('');
  }, []);

  const handleForgotPin = useCallback(() => {
    if (!recoveryCode) return; // No recovery code set
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    resetRecoveryState();
    setShowRecovery(true);
  }, [recoveryCode, resetRecoveryState]);

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

  const renderKeypad = (onPress: (d: string) => void, onDelete: () => void) => (
    <View className="w-72">
      <View className="flex-row flex-wrap">
        {keys.map((key, index) => (
          <View key={index} className="w-1/3 p-2">
            {key === '' ? (
              <View className="h-16" />
            ) : key === 'del' ? (
              <Pressable
                onPress={onDelete}
                className="h-16 rounded-2xl items-center justify-center active:bg-stone-200 dark:active:bg-stone-800"
              >
                <Delete size={24} color="#a8a29e" />
              </Pressable>
            ) : (
              <Pressable
                onPress={() => onPress(key)}
                className="h-16 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 items-center justify-center active:bg-stone-200 dark:active:bg-stone-800"
              >
                <Text className="text-stone-900 dark:text-white text-2xl font-medium">{key}</Text>
              </Pressable>
            )}
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-stone-50 dark:bg-stone-950 items-center justify-center" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <Animated.View entering={FadeIn.duration(600)} className="items-center">
        <View className="w-16 h-16 rounded-full bg-orange-500/20 items-center justify-center mb-6">
          <Lock size={28} color="#e05e1b" />
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
        {renderKeypad(handlePress, handleDelete)}

        {/* Forgot PIN link */}
        {recoveryCode && !hasStaff && (
          <Pressable onPress={handleForgotPin} className="mt-6 active:opacity-70">
            <Text className="text-orange-500 text-sm font-medium">Forgot PIN?</Text>
          </Pressable>
        )}
      </Animated.View>

      {/* Recovery Modal */}
      <Modal
        visible={showRecovery}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <View className="flex-1 bg-stone-50 dark:bg-stone-950 items-center justify-center" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
          <Animated.View entering={FadeInDown.duration(600)} className="items-center">
            <View className="w-16 h-16 rounded-full bg-blue-500/20 items-center justify-center mb-6">
              <KeyRound size={28} color="#3b82f6" />
            </View>
            <Text className="text-stone-900 dark:text-white text-2xl font-bold mb-2">
              {recoveryStep === 'code' ? 'Recovery Code' : recoveryStep === 'newPin' ? 'New PIN' : 'Confirm PIN'}
            </Text>
            <Text className="text-stone-500 text-sm mb-8">
              {recoveryStep === 'code'
                ? 'Enter your 6-digit recovery code'
                : recoveryStep === 'newPin'
                ? 'Choose a new 4-digit PIN'
                : 'Enter the same PIN again'}
            </Text>

            {/* Dots */}
            <Animated.View style={recoveryShakeStyle} className="flex-row gap-4 mb-6">
              {Array.from({ length: maxDigits }).map((_, i) => (
                <View
                  key={i}
                  className={`w-4 h-4 rounded-full ${
                    i < recoveryEntered.length
                      ? recoveryError
                        ? 'bg-red-500'
                        : 'bg-blue-500'
                      : 'bg-stone-300 dark:bg-stone-700'
                  }`}
                />
              ))}
            </Animated.View>

            {recoveryError ? (
              <Text className="text-red-400 text-sm mb-4">{recoveryError}</Text>
            ) : (
              <View className="mb-4 h-5" />
            )}

            {renderKeypad(handleRecoveryPress, handleRecoveryDelete)}

            <Pressable
              onPress={() => {
                setShowRecovery(false);
                resetRecoveryState();
              }}
              className="mt-6 active:opacity-70"
            >
              <Text className="text-stone-500 text-sm font-medium">Cancel</Text>
            </Pressable>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}
