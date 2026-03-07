import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';

// ── THEME DEFINITIONS ──
export const themes = {
  dark: {
    id: 'dark',
    label: 'Dark',
    emoji: '🌙',
    bg: '#080C14',
    overlay: 'rgba(8, 12, 20, 0.88)',
    surface: 'rgba(255,255,255,0.06)',
    surfaceElevated: 'rgba(255,255,255,0.1)',
    border: 'rgba(255,255,255,0.08)',
    borderFocused: '#38BDF8',
    text: '#F0F9FF',
    textMuted: 'rgba(186,230,253,0.6)',
    textFaint: 'rgba(186,230,253,0.3)',
    accent: '#38BDF8',        // Ice blue
    accentMuted: 'rgba(56,189,248,0.2)',
    accentGlow: 'rgba(56,189,248,0.4)',
    success: '#34D399',
    danger: '#F87171',
    warning: '#FBBF24',
    orbA: '#0EA5E9',
    orbB: '#0284C7',
    tabBar: 'rgba(8,12,20,0.97)',
    blurTint: 'dark' as const,
  },
  light: {
    id: 'light',
    label: 'Light',
    emoji: '☀️',
    bg: '#F0F9FF',
    overlay: 'rgba(240,249,255,0.85)',
    surface: 'rgba(255,255,255,0.8)',
    surfaceElevated: 'rgba(255,255,255,0.95)',
    border: 'rgba(56,189,248,0.15)',
    borderFocused: '#0EA5E9',
    text: '#0C4A6E',
    textMuted: 'rgba(12,74,110,0.6)',
    textFaint: 'rgba(12,74,110,0.35)',
    accent: '#0EA5E9',
    accentMuted: 'rgba(14,165,233,0.12)',
    accentGlow: 'rgba(14,165,233,0.3)',
    success: '#059669',
    danger: '#DC2626',
    warning: '#D97706',
    orbA: '#BAE6FD',
    orbB: '#7DD3FC',
    tabBar: 'rgba(240,249,255,0.97)',
    blurTint: 'light' as const,
  },
  ocean: {
    id: 'ocean',
    label: 'Ocean',
    emoji: '🌊',
    bg: '#020617',
    overlay: 'rgba(2,6,23,0.9)',
    surface: 'rgba(255,255,255,0.05)',
    surfaceElevated: 'rgba(255,255,255,0.08)',
    border: 'rgba(103,232,249,0.1)',
    borderFocused: '#67E8F9',
    text: '#ECFEFF',
    textMuted: 'rgba(207,250,254,0.6)',
    textFaint: 'rgba(207,250,254,0.3)',
    accent: '#67E8F9',
    accentMuted: 'rgba(103,232,249,0.15)',
    accentGlow: 'rgba(103,232,249,0.35)',
    success: '#34D399',
    danger: '#F87171',
    warning: '#FBBF24',
    orbA: '#0E7490',
    orbB: '#155E75',
    tabBar: 'rgba(2,6,23,0.97)',
    blurTint: 'dark' as const,
  },
  rose: {
    id: 'rose',
    label: 'Rose',
    emoji: '🌸',
    bg: '#0F0609',
    overlay: 'rgba(15,6,9,0.88)',
    surface: 'rgba(255,255,255,0.06)',
    surfaceElevated: 'rgba(255,255,255,0.1)',
    border: 'rgba(251,113,133,0.12)',
    borderFocused: '#FB7185',
    text: '#FFF1F2',
    textMuted: 'rgba(254,205,211,0.6)',
    textFaint: 'rgba(254,205,211,0.3)',
    accent: '#FB7185',
    accentMuted: 'rgba(251,113,133,0.15)',
    accentGlow: 'rgba(251,113,133,0.35)',
    success: '#34D399',
    danger: '#F87171',
    warning: '#FBBF24',
    orbA: '#BE123C',
    orbB: '#9F1239',
    tabBar: 'rgba(15,6,9,0.97)',
    blurTint: 'dark' as const,
  },
};

export type ThemeId = keyof typeof themes;

interface ThemeContextType {
  theme: typeof themes[ThemeId];
  themeId: ThemeId;
  setTheme: (id: ThemeId) => void;
  autoMode: boolean;
  setAutoMode: (val: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: themes.dark,
  themeId: 'dark',
  setTheme: () => {},
  autoMode: true,
  setAutoMode: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [themeId, setThemeId] = useState<ThemeId>('dark');
  const [autoMode, setAutoMode] = useState(true);

  useEffect(() => {
    if (autoMode) {
      setThemeId(systemScheme === 'light' ? 'light' : 'dark');
    }
  }, [systemScheme, autoMode]);

  const setTheme = (id: ThemeId) => {
    setAutoMode(false);
    setThemeId(id);
  };

  return (
    <ThemeContext.Provider value={{
      theme: themes[themeId],
      themeId,
      setTheme,
      autoMode,
      setAutoMode,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
