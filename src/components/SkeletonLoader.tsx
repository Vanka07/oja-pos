import { View } from 'react-native';
import { useColorScheme } from 'nativewind';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useEffect } from 'react';

function SkeletonBlock({ width, height, rounded = 12, className = '' }: {
  width: number | string;
  height: number;
  rounded?: number;
  className?: string;
}) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.7, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width: typeof width === 'string' ? width as any : width,
          height,
          borderRadius: rounded,
          backgroundColor: isDark ? '#292524' : '#e7e5e4',
        },
        animatedStyle,
      ]}
    />
  );
}

export default function SkeletonLoader() {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View
      className="flex-1"
      style={{ backgroundColor: isDark ? '#0c0a09' : '#fafaf9' }}
    >
      {/* Header area */}
      <View style={{ paddingTop: insets.top + 16, paddingHorizontal: 20 }}>
        <SkeletonBlock width={100} height={14} rounded={8} />
        <View style={{ height: 8 }} />
        <SkeletonBlock width={160} height={28} rounded={10} />
      </View>

      {/* Revenue card skeleton */}
      <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
        <View
          style={{
            borderRadius: 20,
            padding: 20,
            backgroundColor: isDark ? '#1c1917' : '#ffffff',
            borderWidth: 1,
            borderColor: isDark ? '#292524' : '#e7e5e4',
          }}
        >
          <SkeletonBlock width={80} height={12} rounded={6} />
          <View style={{ height: 12 }} />
          <SkeletonBlock width={180} height={32} rounded={10} />
          <View style={{ height: 16 }} />
          <View style={{ flexDirection: 'row', gap: 16 }}>
            <View style={{ flex: 1 }}>
              <SkeletonBlock width={60} height={10} rounded={6} />
              <View style={{ height: 6 }} />
              <SkeletonBlock width={100} height={20} rounded={8} />
            </View>
            <View style={{ flex: 1 }}>
              <SkeletonBlock width={60} height={10} rounded={6} />
              <View style={{ height: 6 }} />
              <SkeletonBlock width={100} height={20} rounded={8} />
            </View>
          </View>
        </View>
      </View>

      {/* Action buttons skeleton */}
      <View style={{ paddingHorizontal: 20, marginTop: 20, flexDirection: 'row', gap: 12 }}>
        {[1, 2, 3].map((i) => (
          <View
            key={i}
            style={{
              flex: 1,
              borderRadius: 16,
              padding: 16,
              backgroundColor: isDark ? '#1c1917' : '#ffffff',
              borderWidth: 1,
              borderColor: isDark ? '#292524' : '#e7e5e4',
            }}
          >
            <SkeletonBlock width={36} height={36} rounded={10} />
            <View style={{ height: 10 }} />
            <SkeletonBlock width={50} height={12} rounded={6} />
          </View>
        ))}
      </View>

      {/* List items skeleton */}
      <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
        <SkeletonBlock width={120} height={12} rounded={6} />
        <View style={{ height: 12 }} />
        {[1, 2, 3].map((i) => (
          <View
            key={i}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 14,
              borderBottomWidth: i < 3 ? 1 : 0,
              borderBottomColor: isDark ? '#292524' : '#e7e5e4',
            }}
          >
            <SkeletonBlock width={44} height={44} rounded={12} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <SkeletonBlock width={140} height={14} rounded={7} />
              <View style={{ height: 6 }} />
              <SkeletonBlock width={80} height={10} rounded={5} />
            </View>
            <SkeletonBlock width={70} height={16} rounded={8} />
          </View>
        ))}
      </View>

      {/* Tab bar skeleton */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 90 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 14,
          backgroundColor: isDark ? '#1c1917' : '#ffffff',
          borderTopWidth: 1,
          borderTopColor: isDark ? '#292524' : '#e7e5e4',
          flexDirection: 'row',
          justifyContent: 'space-around',
          alignItems: 'flex-start',
        }}
      >
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <View key={i} style={{ alignItems: 'center' }}>
            <SkeletonBlock width={28} height={28} rounded={8} />
            <View style={{ height: 6 }} />
            <SkeletonBlock width={32} height={8} rounded={4} />
          </View>
        ))}
      </View>
    </View>
  );
}
