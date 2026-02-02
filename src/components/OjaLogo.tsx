import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { useColorScheme } from 'nativewind';

interface OjaLogoProps {
  size?: number;
  showText?: boolean;
  textSize?: number;
}

/**
 * Oja Logo — A bold shopping cart icon with burnt orange accent.
 * Works at small (24px) and large (80px) sizes.
 */
export function OjaLogo({ size = 32, showText = false, textSize }: OjaLogoProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const mainColor = isDark ? '#ffffff' : '#1c1917';
  const accentColor = '#e05e1b'; // burnt orange

  const resolvedTextSize = textSize ?? size * 0.75;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: size * 0.15 }}>
      <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        {/* Cart basket */}
        <Path
          d="M6 8H12L18 32H36L42 14H16"
          stroke={mainColor}
          strokeWidth={3.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Accent stripe on basket */}
        <Path
          d="M16 20H38.5"
          stroke={accentColor}
          strokeWidth={3}
          strokeLinecap="round"
        />
        {/* Cart wheels */}
        <Circle cx={21} cy={38} r={3} fill={accentColor} />
        <Circle cx={33} cy={38} r={3} fill={accentColor} />
      </Svg>
      {showText && (
        <Text
          style={{
            fontSize: resolvedTextSize,
            fontFamily: 'Poppins-ExtraBold',
            fontWeight: '800',
            color: mainColor,
            letterSpacing: -0.5,
          }}
        >
          <Text style={{ color: accentColor }}>O</Text>
          <Text>ja</Text>
        </Text>
      )}
    </View>
  );
}

/**
 * OjaWordmark — The "Oja" text with burnt orange "O" accent. No icon.
 */
export function OjaWordmark({ size = 28 }: { size?: number }) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const mainColor = isDark ? '#ffffff' : '#1c1917';

  return (
    <Text style={{ fontSize: size, fontFamily: 'Poppins-ExtraBold', fontWeight: '800', letterSpacing: -0.5 }}>
      <Text style={{ color: '#e05e1b' }}>O</Text>
      <Text style={{ color: mainColor }}>ja</Text>
    </Text>
  );
}

export default OjaLogo;
