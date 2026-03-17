import React from 'react';
import Svg, { Path, Circle, Ellipse, Line } from 'react-native-svg';
import { useTheme } from './ThemeContext';

interface Props {
  size?: number;
  colorOverride?: string;
}

export function SafeTotosLogo({ size = 120, colorOverride }: Props) {
  const { themeId } = useTheme();

// Adaptive color based on theme
  const color = colorOverride ?? (
    themeId === 'light'  ? '#0EA5E9' :  // dark teal on light bg
    themeId === 'ocean'  ? '#67E8F9' :  // cyan on ocean bg
    themeId === 'rose'   ? '#FFF1F2' :  // near-white on rose bg
                           '#2BBFBF'    // teal on dark bg (default)
  );

  // Scale everything relative to size
  const s = size / 120;

  return (
    <Svg width={size} height={size * 1.1} viewBox="0 0 120 132">
      {/* Caregiver head */}
      <Circle cx="62" cy="12" r="9" fill={color} />
      {/* Flowing hair */}
      <Path d="M67 6 Q88 2 90 12 Q80 11 72 13 Q70 8 67 6Z" fill={color} />
      {/* Torso */}
      <Path d="M56 21 Q54 42 55 52 Q62 55 69 52 Q70 42 68 21 Q65 19 62 19 Q59 19 56 21Z" fill={color} />
      {/* Backpack */}
      <Path d="M69 23 Q76 24 77 36 Q76 44 69 45 Q69 36 69 23Z" fill={color} opacity="0.7" />
      <Path d="M70 26 Q74 27 74 32 Q72 33 70 32Z" fill={color} opacity="0.5" />
      {/* Left arm to child 1 */}
      <Path d="M56 28 Q46 36 42 48" stroke={color} strokeWidth="4.5" strokeLinecap="round" fill="none" />
      {/* Right arm down to child 2*/}
      <Path d="M68 28 Q76 36 80 46" stroke={color} strokeWidth="4.5" strokeLinecap="round" fill="none" />
      {/* Legs */}
      <Path d="M59 52 Q55 68 51 82" stroke={color} strokeWidth="5" strokeLinecap="round" fill="none" />
      <Path d="M65 52 Q69 68 73 82" stroke={color} strokeWidth="5" strokeLinecap="round" fill="none" />
      {/* - Child 1 (left holding hand) - */}
      <Circle cx="36" cy="46" r="7" fill={color} />
      {/* Ponytail */}
      <Path d="M33 40 Q26 36 24 42 Q30 41 34 43Z" fill={color} />
      <Path d="M32 53 Q30 64 28 74" stroke={color} strokeWidth="4" strokeLinecap="round" fill="none" />
      <Path d="M40 53 Q42 64 44 74" stroke={color} strokeWidth="4" strokeLinecap="round" fill="none" />
      {/* Arm up */}
      <Path d="M40 50 Q41 49 42 48" stroke={color} strokeWidth="3.5" strokeLinecap="round" fill="none" />
      {/* Body */}
      <Path d="M30 53 Q29 64 30 68 Q36 70 42 68 Q43 64 40 53Z" fill={color} />

       {/* ── CHILD 2 (right, holding hand) ── */}
      <Circle cx="86" cy="44" r="7" fill={color} />
      {/* Body */}
      <Path d="M80 51 Q79 62 80 66 Q86 68 92 66 Q93 62 92 51Z" fill={color} />
      {/* Arm up */}
      <Path d="M80 49 Q80 48 80 46" stroke={color} strokeWidth="3.5" strokeLinecap="round" fill="none" />
      {/* Legs */}
      <Path d="M83 66 Q80 76 78 86" stroke={color} strokeWidth="4" strokeLinecap="round" fill="none" />
      <Path d="M89 66 Q91 76 93 86" stroke={color} strokeWidth="4" strokeLinecap="round" fill="none" />
      {/* School bag */}
      <Path d="M92 53 Q97 54 97 62 Q96 67 92 67Z" fill={color} opacity="0.65" />

      {/* Child 3 running */}
      <Circle cx="108" cy="52" r="6" fill={color} />
      {/* Ponytail running */}
      <Path d="M112 48 Q120 44 121 50 Q115 50 112 52Z" fill={color} />
      <Path d="M104 58 Q102 68 99 78" stroke={color} strokeWidth="3.5" strokeLinecap="round" fill="none" />
      <Path d="M112 58 Q115 68 118 76" stroke={color} strokeWidth="3.5" strokeLinecap="round" fill="none" />
      <Path d="M104 60 Q98 64 96 70" stroke={color} strokeWidth="3" strokeLinecap="round" fill="none" />
      <Path d="M112 60 Q118 62 120 67" stroke={color} strokeWidth="3" strokeLinecap="round" fill="none" />
      <Path d="M103 58 Q108 68 113 58Z" fill={color} />
      {/* ── GROUND LINE ── */}
      <Ellipse cx="62" cy="90" rx="55" ry="2.5" fill={color} opacity="0.25" />

    </Svg>
  );
}

// Text-only version for headers
export function SafeTotosWordmark({ size = 24, colorOverride }: Props) {
  const { themeId, theme } = useTheme();
  const color = colorOverride ?? (
    themeId === 'light'  ? '#0EA5E9' :
    themeId === 'ocean'  ? '#67E8F9' :
    themeId === 'rose'   ? '#FFF1F2' :
                           '#2BBFBF'
  );
  const { Text } = require('react-native');
  return (
    <Text style={{
      fontSize: size,
      fontWeight: '800',
      color,
      letterSpacing: 0.5,
    }}>
      Safe Totos
    </Text>
  );
}
