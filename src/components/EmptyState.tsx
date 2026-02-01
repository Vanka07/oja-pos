import { View, Text, Pressable } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useColorScheme } from 'nativewind';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  buttonLabel?: string;
  onButtonPress?: () => void;
}

export default function EmptyState({ icon: Icon, title, description, buttonLabel, onButtonPress }: EmptyStateProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  return (
    <Animated.View
      entering={FadeInDown.duration(500)}
      className="items-center justify-center py-12 px-6"
    >
      <View className="w-20 h-20 rounded-full bg-orange-500/10 items-center justify-center mb-5">
        <Icon size={36} color="#f97316" />
      </View>
      <Text className="text-stone-900 dark:text-white text-lg font-semibold text-center mb-2">
        {title}
      </Text>
      <Text className="text-stone-500 dark:text-stone-500 text-sm text-center leading-5 max-w-[260px] mb-6">
        {description}
      </Text>
      {buttonLabel && onButtonPress && (
        <Pressable
          onPress={onButtonPress}
          className="bg-orange-500 px-8 py-3.5 rounded-2xl active:scale-95"
          style={{ minWidth: 160, minHeight: 48 }}
        >
          <Text className="text-white font-semibold text-base text-center">
            {buttonLabel}
          </Text>
        </Pressable>
      )}
    </Animated.View>
  );
}
