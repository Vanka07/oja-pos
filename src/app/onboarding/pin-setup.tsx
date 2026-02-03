import { View, Text, Pressable, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Lock, Delete, Shield, MessageCircle, ArrowRight } from 'lucide-react-native';
import Animated, { FadeInDown, useSharedValue, useAnimatedStyle, withSequence, withTiming } from 'react-native-reanimated';
import { useColorScheme } from 'nativewind';
import { useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useOnboardingStore } from '@/store/onboardingStore';
import { useAuthStore } from '@/store/authStore';
import * as Haptics from 'expo-haptics';

type Step = 'enter' | 'confirm' | 'recovery';

export default function PinSetupScreen() {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const completeOnboarding = useOnboardingStore((s) => s.completeOnboarding);
  const setPin = useAuthStore((s) => s.setPin);
  const generateRecoveryCode = useAuthStore((s) => s.generateRecoveryCode);

  const [step, setStep] = useState<Step>('enter');
  const [entered, setEntered] = useState('');
  const [firstPin, setFirstPin] = useState('');
  const [error, setError] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');

  const shakeX = useSharedValue(0);
  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  const triggerShake = useCallback(() => {
    shakeX.value = withSequence(
      withTiming(-12, { duration: 50 }),
      withTiming(12, { duration: 50 }),
      withTiming(-12, { duration: 50 }),
      withTiming(12, { duration: 50 }),
      withTiming(0, { duration: 50 })
    );
  }, [shakeX]);

  const handlePress = useCallback((digit: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setError('');
    const next = entered + digit;
    if (next.length <= 4) {
      setEntered(next);
      if (next.length === 4) {
        if (step === 'enter') {
          // Save first PIN and move to confirm
          setFirstPin(next);
          setEntered('');
          setStep('confirm');
        } else if (step === 'confirm') {
          if (next === firstPin) {
            // Match! Set PIN and generate recovery code
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setPin(next);
            const code = generateRecoveryCode();
            setRecoveryCode(code);
            setStep('recovery');
          } else {
            // Mismatch
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            setError("PINs don't match, try again");
            triggerShake();
            setTimeout(() => {
              setEntered('');
              setFirstPin('');
              setStep('enter');
            }, 400);
          }
        }
      }
    }
  }, [entered, step, firstPin, setPin, generateRecoveryCode, triggerShake]);

  const handleDelete = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEntered((prev) => prev.slice(0, -1));
    setError('');
  }, []);

  const handleSaveToWhatsApp = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const message = `🔐 Oja POS Recovery Code: ${recoveryCode}\n\nKeep this message safe! You'll need this code if you forget your PIN.\n\nDo NOT share this code with anyone.`;
    const encoded = encodeURIComponent(message);
    Linking.openURL(`https://wa.me/?text=${encoded}`).catch(() => {
      // Fallback if WhatsApp isn't installed
      Linking.openURL(`whatsapp://send?text=${encoded}`).catch(() => {});
    });
  }, [recoveryCode]);

  const handleContinue = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    completeOnboarding();
    router.replace('/(tabs)');
  }, [completeOnboarding, router]);

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

  const renderKeypad = () => (
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
  );

  return (
    <View className="flex-1 bg-stone-50 dark:bg-stone-950">
      <LinearGradient
        colors={isDark ? ['#292524', '#1c1917', '#0c0a09'] : ['#f5f5f4', '#fafaf9', '#ffffff']}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
      />

      <View className="flex-1 items-center justify-center" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
        {step === 'recovery' ? (
          /* Recovery Code Screen */
          <Animated.View entering={FadeInDown.duration(600)} className="items-center px-6 w-full">
            <View className="w-16 h-16 rounded-full bg-emerald-500/20 items-center justify-center mb-6">
              <Shield size={28} color="#10b981" />
            </View>
            <Text style={{ fontFamily: 'Poppins-Bold' }} className="text-stone-900 dark:text-white text-2xl font-bold mb-2 text-center">
              Save Your Recovery Code
            </Text>
            <Text className="text-stone-500 dark:text-stone-400 text-sm mb-8 text-center leading-5">
              If you forget your PIN, you'll need this code to reset it
            </Text>

            {/* Recovery Code Display */}
            <View className="bg-stone-100 dark:bg-stone-900 border-2 border-dashed border-orange-500/50 rounded-2xl py-6 px-10 mb-8">
              <Text className="text-orange-500 text-4xl font-bold tracking-[8px] text-center">
                {recoveryCode}
              </Text>
            </View>

            {/* Save to WhatsApp Button */}
            <Pressable
              onPress={handleSaveToWhatsApp}
              className="w-full active:scale-[0.98] mb-3"
            >
              <LinearGradient
                colors={['#25D366', '#128C7E']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ borderRadius: 16, padding: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 }}
              >
                <MessageCircle size={22} color="white" />
                <Text className="text-white text-lg font-semibold">Save to WhatsApp</Text>
              </LinearGradient>
            </Pressable>

            {/* Continue Button */}
            <Pressable
              onPress={handleContinue}
              className="w-full active:scale-[0.98]"
            >
              <View className="bg-stone-200 dark:bg-stone-800 rounded-2xl py-4 px-6 flex-row items-center justify-center gap-2">
                <Text className="text-stone-700 dark:text-stone-300 text-base font-semibold">I've saved it, continue</Text>
                <ArrowRight size={18} color={isDark ? '#d6d3d1' : '#44403c'} />
              </View>
            </Pressable>

            <Text className="text-stone-400 dark:text-stone-600 text-xs text-center mt-4">
              Make sure you've saved your code before continuing!
            </Text>
          </Animated.View>
        ) : (
          /* PIN Entry Screens */
          <Animated.View entering={FadeInDown.duration(600)} className="items-center">
            <View className="w-16 h-16 rounded-full bg-orange-500/20 items-center justify-center mb-6">
              <Lock size={28} color="#e05e1b" />
            </View>
            <Text style={{ fontFamily: 'Poppins-Bold' }} className="text-stone-900 dark:text-white text-2xl font-bold mb-2">
              {step === 'enter' ? 'Secure Your App' : 'Confirm Your PIN'}
            </Text>
            <Text className="text-stone-500 dark:text-stone-400 text-sm mb-8">
              {step === 'enter' ? 'Choose a 4-digit PIN' : 'Enter the same PIN again'}
            </Text>

            {/* PIN dots */}
            <Animated.View style={shakeStyle} className="flex-row gap-4 mb-6">
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

            {error ? (
              <Text className="text-red-400 text-sm mb-4">{error}</Text>
            ) : (
              <View className="mb-4 h-5" />
            )}

            {renderKeypad()}
          </Animated.View>
        )}
      </View>
    </View>
  );
}
