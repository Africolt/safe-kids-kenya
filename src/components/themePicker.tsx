import React from 'react';
import {
  View, Text, TouchableOpacity, Switch, StyleSheet
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme, themes, ThemeId } from '../lib/ThemeContext';

export default function ThemePicker() {
  const { theme, themeId, setTheme, autoMode, setAutoMode } = useTheme();

  return (
    <View style={styles.container}>
      {/* Auto mode toggle */}
      <BlurView intensity={25} tint={theme.blurTint} style={[
        styles.autoCard,
        { borderColor: theme.border }
      ]}>
        <View style={styles.autoRow}>
          <View style={[styles.iconWrap, { backgroundColor: theme.accentMuted }]}>
            <Text style={styles.icon}>📱</Text>
          </View>
          <View style={styles.autoInfo}>
            <Text style={[styles.autoLabel, { color: theme.text }]}>
              Follow System
            </Text>
            <Text style={[styles.autoSub, { color: theme.textMuted }]}>
              Auto dark/light mode
            </Text>
          </View>
          <Switch
            value={autoMode}
            onValueChange={(val) => {
              setAutoMode(val);
            }}
            trackColor={{
              false: 'rgba(255,255,255,0.1)',
              true: theme.accentMuted,
            }}
            thumbColor={autoMode ? theme.accent : '#6B7280'}
          />
        </View>
      </BlurView>

      {/* Theme grid */}
      <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>
        CHOOSE THEME
      </Text>
      <View style={styles.grid}>
        {(Object.keys(themes) as ThemeId[]).map((id) => {
          const t = themes[id];
          const isActive = themeId === id && !autoMode;
          return (
            <TouchableOpacity
              key={id}
              onPress={() => setTheme(id)}
              activeOpacity={0.8}
              style={[
                styles.themeCard,
                { backgroundColor: t.bg, borderColor: isActive ? t.accent : 'transparent' },
              ]}
            >
              {/* Preview dots */}
              <View style={styles.previewRow}>
                <View style={[styles.previewDot, { backgroundColor: t.accent }]} />
                <View style={[styles.previewDot, { backgroundColor: t.success, opacity: 0.7 }]} />
                <View style={[styles.previewDot, { backgroundColor: t.danger, opacity: 0.5 }]} />
              </View>

              <Text style={styles.themeEmoji}>{t.emoji}</Text>
              <Text style={[styles.themeLabel, { color: t.text }]}>{t.label}</Text>

              {isActive && (
                <View style={[styles.activeCheck, { backgroundColor: t.accent }]}>
                  <Text style={styles.activeCheckText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 8 },

  autoCard: {
    borderRadius: 18, overflow: 'hidden',
    borderWidth: 1, marginBottom: 20, padding: 16,
  },
  autoRow: { flexDirection: 'row', alignItems: 'center' },
  iconWrap: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  icon: { fontSize: 18 },
  autoInfo: { flex: 1 },
  autoLabel: { fontSize: 15, fontWeight: '600' },
  autoSub: { fontSize: 12, marginTop: 2 },

  sectionLabel: {
    fontSize: 11, fontWeight: '700',
    letterSpacing: 1.5, marginBottom: 12, marginLeft: 4,
  },

  grid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10,
  },
  themeCard: {
    width: '47%', borderRadius: 16, padding: 16,
    borderWidth: 2, position: 'relative',
  },
  previewRow: { flexDirection: 'row', gap: 4, marginBottom: 10 },
  previewDot: { width: 8, height: 8, borderRadius: 4 },
  themeEmoji: { fontSize: 24, marginBottom: 6 },
  themeLabel: { fontSize: 14, fontWeight: '700' },
  activeCheck: {
    position: 'absolute', top: 10, right: 10,
    width: 20, height: 20, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  activeCheckText: { color: '#fff', fontSize: 11, fontWeight: '800' },
});
