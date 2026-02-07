import { View, Text, Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Check } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { LANGUAGES } from '@/i18n';
import { useLanguageStore } from '@/store/languageStore';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function LanguageScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const language = useLanguageStore((s) => s.language);
  const setLanguage = useLanguageStore((s) => s.setLanguage);

  const gradientColors: [string, string, string] = isDark
    ? ['#292524', '#1c1917', '#0c0a09']
    : ['#f5f5f4', '#fafaf9', '#ffffff'];

  const handleSelect = (code: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLanguage(code);
    router.back();
  };

  return (
    <View className="flex-1 bg-stone-50 dark:bg-stone-950">
      <LinearGradient
        colors={gradientColors}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
      />

      {/* Header */}
      <View style={{ paddingTop: insets.top + 8 }} className="px-5 pb-4">
        <Animated.View entering={FadeInDown.delay(100).duration(600)}>
          <Pressable
            onPress={() => router.back()}
            className="flex-row items-center gap-2 mb-4 active:opacity-70"
          >
            <ArrowLeft size={24} color={isDark ? '#fff' : '#1c1917'} />
            <Text className="text-stone-900 dark:text-white text-base font-medium">Back</Text>
          </Pressable>
          <Text
            style={{ fontFamily: 'Poppins-ExtraBold' }}
            className="text-stone-900 dark:text-white text-3xl font-extrabold tracking-tight"
          >
            Language
          </Text>
          <Text className="text-stone-600 dark:text-stone-400 text-sm mt-1">
            Choose your preferred language
          </Text>
        </Animated.View>
      </View>

      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          entering={FadeInDown.delay(200).duration(600)}
          className="bg-white/60 dark:bg-stone-900/60 rounded-xl border border-stone-200 dark:border-stone-800 overflow-hidden"
        >
          {LANGUAGES.map((lang, index) => {
            const isActive = language === lang.code;
            return (
              <Pressable
                key={lang.code}
                onPress={() => handleSelect(lang.code)}
                className={`flex-row items-center p-4 active:bg-stone-200/50 dark:active:bg-stone-800/50 ${
                  index < LANGUAGES.length - 1
                    ? 'border-b border-stone-200 dark:border-stone-800'
                    : ''
                }`}
                style={isActive ? { backgroundColor: isDark ? 'rgba(224,94,27,0.1)' : 'rgba(224,94,27,0.08)' } : undefined}
              >
                <Text className="text-2xl mr-4">{lang.flag}</Text>
                <View className="flex-1">
                  <Text
                    className="text-base font-semibold"
                    style={{ color: isActive ? '#e05e1b' : (isDark ? '#fff' : '#1c1917') }}
                  >
                    {lang.nativeName}
                  </Text>
                  {lang.nativeName !== lang.name && (
                    <Text className="text-stone-600 dark:text-stone-400 text-sm">
                      {lang.name}
                    </Text>
                  )}
                </View>
                {isActive && (
                  <Check size={22} color="#e05e1b" />
                )}
              </Pressable>
            );
          })}
        </Animated.View>
      </ScrollView>
    </View>
  );
}
