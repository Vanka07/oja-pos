import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { useColorScheme } from 'nativewind';

interface OjaLogoProps {
  size?: number;
  showText?: boolean;
  textSize?: number;
}

/**
 * Oja Logo — A stylized market bag with an orange accent stripe.
 * Works at small (24px) and large (80px) sizes.
 */
export function OjaLogo({ size = 32, showText = false, textSize }: OjaLogoProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const mainColor = isDark ? '#ffffff' : '#1c1917';
  const accentColor = '#f97316'; // orange-500

  const resolvedTextSize = textSize ?? size * 0.75;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: size * 0.25 }}>
      <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        {/* Bag handle */}
        <Path
          d="M16 16C16 10.477 20.477 6 26 6H22C17.477 6 14 10.477 14 16"
          stroke={mainColor}
          strokeWidth={3}
          strokeLinecap="round"
          fill="none"
        />
        <Path
          d="M32 16C32 10.477 27.523 6 22 6H26C30.523 6 34 10.477 34 16"
          stroke={mainColor}
          strokeWidth={3}
          strokeLinecap="round"
          fill="none"
        />
        {/* Bag body */}
        <Path
          d="M10 18C10 16.895 10.895 16 12 16H36C37.105 16 38 16.895 38 18V38C38 40.209 36.209 42 34 42H14C11.791 42 10 40.209 10 38V18Z"
          fill={mainColor}
          opacity={0.9}
        />
        {/* Orange accent stripe */}
        <Rect x={10} y={22} width={28} height={5} rx={1} fill={accentColor} />
        {/* Small circle detail (like a button/clasp) */}
        <Circle cx={24} cy={17} r={2} fill={accentColor} />
      </Svg>
      {showText && (
        <Text
          style={{
            fontSize: resolvedTextSize,
            fontWeight: '800',
            color: mainColor,
            letterSpacing: -0.5,
          }}
        >
          Oja
        </Text>
      )}
    </View>
  );
}

/**
 * OjaWordmark — The "Oja" text with orange "O" accent. No icon.
 */
export function OjaWordmark({ size = 28 }: { size?: number }) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const mainColor = isDark ? '#ffffff' : '#1c1917';

  return (
    <Text style={{ fontSize: size, fontWeight: '800', letterSpacing: -0.5 }}>
      <Text style={{ color: '#f97316' }}>O</Text>
      <Text style={{ color: mainColor }}>ja</Text>
    </Text>
  );
}

export default OjaLogo;
