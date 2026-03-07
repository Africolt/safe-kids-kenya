import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Image, Switch, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { BlurView } from 'expo-blur';
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../../src/firebaseconfig';

const MENU_SECTIONS = [
  {
    title: 'Account',
    items: [
      { icon: '👤', label: 'Edit Profile', route: '/edit-profile' },
      { icon: '🔔', label: 'Notifications', route: '/notifications', toggle: true },
      { icon: '📍', label: 'Safe Zones', route: '/zones' },
      { icon: '👨‍👩‍👧', label: 'Family Members', route: '/family' },
    ],
  },
  {
    title: 'Safety',
    items: [
      { icon: '🛡️', label: 'Security Settings', route: '/security-settings' },
      { icon: '📞', label: 'Emergency Contacts', route: '/emergency' },
      { icon: '🗺️', label: 'Location Sharing', route: '/location', toggle: true },
    ],
  },
  {
    title: 'Support',
    items: [
      { icon: '❓', label: 'Help & FAQ', route: '/help' },
      { icon: '⭐', label: 'Rate the App', route: '/rate' },
      { icon: '📋', label: 'Privacy Policy', route: '/privacy' },
    ],
  },
];

export default function ProfileScreen() {
  const [userData, setUserData] = useState<{ email: string; role: string } | null>(null);
  const [notifications, setNotifications] = useState(true);
  const [locationSharing, setLocationSharing] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const snap = await getDoc(doc(db, 'users', user.uid));
          if (snap.exists()) {
            setUserData(snap.data() as { email: string; role: string });
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out', style: 'destructive',
        onPress: async () => {
          await signOut(auth);
        },
      },
    ]);
  };

  const getInitials = (email: string) =>
    email ? email.substring(0, 2).toUpperCase() : 'SK';

  const getToggleValue = (label: string) => {
    if (label === 'Notifications') return notifications;
    if (label === 'Location Sharing') return locationSharing;
    return false;
  };

  const handleToggle = (label: string, val: boolean) => {
    if (label === 'Notifications') setNotifications(val);
    if (label === 'Location Sharing') setLocationSharing(val);
  };

  return (
    <View style={styles.root}>
      <Image
        source={require('../../../assets/images/kids-hero.png')}
        style={styles.bgImage}
        resizeMode="cover"
      />
      <View style={styles.overlay} />
      <View style={[styles.orb, styles.orbTop]} />
      <View style={[styles.orb, styles.orbBottom]} />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── HEADER ── */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Profile</Text>
            <TouchableOpacity style={styles.editBtn} activeOpacity={0.8}>
              <Text style={styles.editBtnText}>✏️ Edit</Text>
            </TouchableOpacity>
          </View>

          {/* ── PROFILE CARD ── */}
          <BlurView intensity={35} tint="dark" style={styles.profileCard}>
            {/* Avatar */}
            <View style={styles.avatarWrap}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {userData ? getInitials(userData.email) : 'SK'}
                </Text>
              </View>
              <View style={styles.avatarBadge}>
                <Text style={styles.avatarBadgeText}>🛡️</Text>
              </View>
            </View>

            {/* User info */}
            <Text style={styles.userName}>
              {loading ? 'Loading...' : userData?.email?.split('@')[0] ?? 'Safe Kids User'}
            </Text>
            <Text style={styles.userEmail}>
              {userData?.email ?? ''}
            </Text>

            {/* Role badge */}
            <View style={styles.roleBadge}>
              <Text style={styles.roleEmoji}>
                {userData?.role === 'parent' ? '👨‍👩‍👧' : '🤝'}
              </Text>
              <Text style={styles.roleText}>
                {userData?.role
                  ? userData.role.charAt(0).toUpperCase() + userData.role.slice(1)
                  : 'Member'}
              </Text>
            </View>

            {/* Stats row */}
            <View style={styles.statsRow}>
              {[
                { value: '5', label: 'Safe Zones' },
                { value: '2', label: 'Alerts' },
                { value: '3', label: 'Caregivers' },
              ].map((stat, i) => (
                <View key={i} style={styles.statItem}>
                  {i > 0 && <View style={styles.statDivider} />}
                  <View style={styles.statContent}>
                    <Text style={styles.statValue}>{stat.value}</Text>
                    <Text style={styles.statLabel}>{stat.label}</Text>
                  </View>
                </View>
              ))}
            </View>
          </BlurView>

          {/* ── MENU SECTIONS ── */}
          {MENU_SECTIONS.map((section) => (
            <View key={section.title} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <BlurView intensity={25} tint="dark" style={styles.menuCard}>
                {section.items.map((item, index) => (
                  <View key={item.label}>
                    <TouchableOpacity
                      style={styles.menuRow}
                      activeOpacity={item.toggle ? 1 : 0.7}
                      onPress={() => !item.toggle && router.push(item.route as any)}
                    >
                      <View style={styles.menuIconWrap}>
                        <Text style={styles.menuIcon}>{item.icon}</Text>
                      </View>
                      <Text style={styles.menuLabel}>{item.label}</Text>
                      {item.toggle ? (
                        <Switch
                          value={getToggleValue(item.label)}
                          onValueChange={(val) => handleToggle(item.label, val)}
                          trackColor={{ false: 'rgba(255,255,255,0.1)', true: 'rgba(2,132,199,0.6)' }}
                          thumbColor={getToggleValue(item.label) ? '#38BDF8' : '#6B7280'}
                        />
                      ) : (
                        <Text style={styles.menuArrow}>›</Text>
                      )}
                    </TouchableOpacity>
                    {index < section.items.length - 1 && <View style={styles.menuDivider} />}
                  </View>
                ))}
              </BlurView>
            </View>
          ))}

          {/* ── SIGN OUT ── */}
          <TouchableOpacity
            style={styles.signOutBtn}
            onPress={handleSignOut}
            activeOpacity={0.85}
          >
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>

          {/* Version */}
          <Text style={styles.version}>Safe Kids Kenya v1.0.0</Text>

          <View style={{ height: 32 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0F0C29' },
  bgImage: { position: 'absolute', width: '100%', height: '100%' },
  overlay: {
    position: 'absolute', width: '100%', height: '100%',
    backgroundColor: 'rgba(10, 8, 35, 0.9)',
  },
  orb: { position: 'absolute', borderRadius: 999, opacity: 0.12 },
  orbTop: { width: 220, height: 220, backgroundColor: '#0284C7', top: -60, right: -60 },
  orbBottom: { width: 180, height: 180, backgroundColor: '#0369A1', bottom: 80, left: -60 },
  safeArea: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 24 },

  // Header
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingTop: 12, marginBottom: 20,
  },
  headerTitle: { fontSize: 26, fontWeight: '900', color: '#F5F3FF', letterSpacing: -0.8 },
  editBtn: {
    backgroundColor: 'rgba(2,132,199,0.25)', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1, borderColor: 'rgba(56,189,248,0.3)',
  },
  editBtnText: { color: '#38BDF8', fontWeight: '700', fontSize: 13 },

  // Profile card
  profileCard: {
    borderRadius: 24, overflow: 'hidden', marginBottom: 24,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    padding: 24, alignItems: 'center',
  },
  avatarWrap: { position: 'relative', marginBottom: 14 },
  avatar: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: 'rgba(2,132,199,0.3)',
    borderWidth: 2, borderColor: 'rgba(56,189,248,0.4)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 28, fontWeight: '800', color: '#38BDF8' },
  avatarBadge: {
    position: 'absolute', bottom: -4, right: -4,
    width: 26, height: 26, borderRadius: 8,
    backgroundColor: '#0284C7', alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#0F0C29',
  },
  avatarBadgeText: { fontSize: 12 },
  userName: {
    fontSize: 22, fontWeight: '800', color: '#F5F3FF',
    letterSpacing: -0.5, marginBottom: 4,
  },
  userEmail: {
    fontSize: 13, color: 'rgba(186,230,253,0.5)', marginBottom: 12,
  },
  roleBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(2,132,199,0.2)', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 6, marginBottom: 20,
    borderWidth: 1, borderColor: 'rgba(56,189,248,0.2)',
  },
  roleEmoji: { fontSize: 14 },
  roleText: { color: '#38BDF8', fontSize: 13, fontWeight: '700' },

  // Stats
  statsRow: {
    flexDirection: 'row', width: '100%',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16, overflow: 'hidden',
  },
  statItem: { flex: 1, flexDirection: 'row' },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.06)' },
  statContent: { flex: 1, alignItems: 'center', paddingVertical: 14 },
  statValue: { fontSize: 22, fontWeight: '900', color: '#38BDF8', letterSpacing: -0.5 },
  statLabel: { fontSize: 10, color: 'rgba(186,230,253,0.5)', marginTop: 2, fontWeight: '600' },

  // Sections
  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 13, fontWeight: '700', color: 'rgba(186,230,253,0.5)',
    letterSpacing: 1, marginBottom: 10, marginLeft: 4,
  },
  menuCard: {
    borderRadius: 20, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  menuRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
  },
  menuIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(2,132,199,0.15)',
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  menuIcon: { fontSize: 16 },
  menuLabel: { flex: 1, color: '#F5F3FF', fontSize: 14, fontWeight: '500' },
  menuArrow: { color: 'rgba(186,230,253,0.3)', fontSize: 22, fontWeight: '300' },
  menuDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginLeft: 64 },

  // Sign out
  signOutBtn: {
    borderRadius: 16, paddingVertical: 16, alignItems: 'center',
    backgroundColor: 'rgba(248,113,133,0.1)',
    borderWidth: 1, borderColor: 'rgba(248,113,133,0.25)',
    marginBottom: 16,
  },
  signOutText: { color: '#F87171', fontSize: 15, fontWeight: '700' },

  // Version
  version: {
    textAlign: 'center', color: 'rgba(186,230,253,0.25)',
    fontSize: 11, marginBottom: 8,
  },
});
