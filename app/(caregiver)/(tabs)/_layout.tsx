import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';

function TabIcon({ emoji, label, focused }: { emoji: string; label: string; focused: boolean }) {
  return (
    <View style={styles.tabItem}>
      <Text style={[styles.tabEmoji, focused && styles.tabEmojiFocused]}>{emoji}</Text>
      <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]}>{label}</Text>
    </View>
  );
}

export default function CaregiverTabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarStyle: styles.tabBar, tabBarShowLabel: false }}>
      <Tabs.Screen name="home" options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" label="Home" focused={focused} /> }} />
      <Tabs.Screen name="bookings" options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="📅" label="Bookings" focused={focused} /> }} />
      <Tabs.Screen name="earnings" options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="💰" label="Earnings" focused={focused} /> }} />
      <Tabs.Screen name="profile" options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="👤" label="Profile" focused={focused} /> }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: 'rgba(8,12,20,0.97)',
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)',
    height: 70, paddingBottom: 8, paddingTop: 8,
  },
  tabItem: { alignItems: 'center', justifyContent: 'center', gap: 3 },
  tabEmoji: { fontSize: 22, opacity: 0.4 },
  tabEmojiFocused: { opacity: 1 },
  tabLabel: { fontSize: 10, color: 'rgba(186,230,253,0.35)', fontWeight: '600' },
  tabLabelFocused: { color: '#34D399' },
});
