import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Dimensions, Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { collection, getDocs } from 'firebase/firestore';
import { db, auth } from '../../../src/firebaseconfig';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');

export default function Home() {
  const [alerts, setAlerts] = useState(2);
  const [safeZones, setSafeZones] = useState(5);
  const [currentTime, setCurrentTime] = useState('');
  const [greeting, setGreeting] = useState('');
  const [activities, setActivities] = useState([
    { title: 'School Pickup', time: '10:30 AM', icon: '🏫', status: 'completed' },
    { title: 'Playground Check', time: '2:00 PM', icon: '🛝', status: 'pending' },
    { title: 'Home Arrival', time: '4:15 PM', icon: '🏠', status: 'pending' },
  ]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours();
      const mins = now.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHour = hours % 12 || 12;
      setCurrentTime(`${displayHour}:${mins} ${ampm}`);
      if (hours < 12) setGreeting('Good morning');
      else if (hours < 17) setGreeting('Good afternoon');
      else setGreeting('Good evening');
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const alertsSnapshot = await getDocs(collection(db, 'alerts'));
        setAlerts(alertsSnapshot.docs.length);
        const zonesSnapshot = await getDocs(collection(db, 'safeZones'));
        setSafeZones(zonesSnapshot.docs.length || 5);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, []);

  return (
    <View style={styles.root}>
      {/* Background image */}
      <Image
        source={require('../../../assets/images/kids-hero.png')}
        style={styles.bgImage}
        resizeMode="cover"
      />
      <View style={styles.overlay} />

      {/* Decorative orbs */}
      <View style={[styles.orb, styles.orbTop]} />
      <View style={[styles.orb, styles.orbMid]} />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── HEADER ── */}
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>{greeting} 👋</Text>
              <Text style={styles.headerTitle}>Safe Kids Kenya</Text>
            </View>
            <View style={styles.timeBadge}>
              <Text style={styles.timeText}>{currentTime}</Text>
            </View>
          </View>

          {/* ── HERO STATS ── */}
          <BlurView intensity={30} tint="dark" style={styles.heroCard}>
            <View style={styles.heroCardInner}>
              <Text style={styles.heroCardLabel}>Child Safety Overview</Text>
              <View style={styles.statsRow}>
                {/* Safe Zones */}
                <TouchableOpacity
                  style={styles.statCard}
                  onPress={() => router.push('/map')}
                  activeOpacity={0.8}
                >
                  <View style={[styles.statIcon, { backgroundColor: 'rgba(167,243,208,0.15)' }]}>
                    <Text style={styles.statEmoji}>📍</Text>
                  </View>
                  <Text style={styles.statValue}>{safeZones}</Text>
                  <Text style={styles.statTitle}>Safe Zones</Text>
                  <Text style={styles.statSub}>Active Locations</Text>
                </TouchableOpacity>

                {/* Divider */}
                <View style={styles.statDivider} />

                {/* Alerts */}
                <TouchableOpacity
                  style={styles.statCard}
                  onPress={() => router.push('/security')}
                  activeOpacity={0.8}
                >
                  <View style={[styles.statIcon, { backgroundColor: 'rgba(56,189,248,0.15)' }]}>
                    <Text style={styles.statEmoji}>🔔</Text>
                  </View>
                  <Text style={[styles.statValue, alerts > 0 && styles.statValueAlert]}>
                    {alerts}
                  </Text>
                  <Text style={styles.statTitle}>Alerts</Text>
                  <Text style={styles.statSub}>Pending Alerts</Text>
                </TouchableOpacity>
              </View>
            </View>
          </BlurView>

          {/* ── ACTION BUTTONS ── */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnPrimary]}
              onPress={() => router.push('/map')}
              activeOpacity={0.85}
            >
              <Text style={styles.actionIcon}>🗺️</Text>
              <Text style={styles.actionBtnText}>View Map</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnSecondary]}
              onPress={() => router.push('/report')}
              activeOpacity={0.85}
            >
              <Text style={styles.actionIcon}>🚨</Text>
              <Text style={styles.actionBtnTextDark}>Report Incident</Text>
            </TouchableOpacity>
          </View>

          {/* ── RECENT ACTIVITY ── */}
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <BlurView intensity={25} tint="dark" style={styles.glassCard}>
            {activities.map((activity, index) => (
              <View key={index}>
                <TouchableOpacity style={styles.activityRow} activeOpacity={0.7}>
                  <View style={styles.activityIconWrap}>
                    <Text style={styles.activityEmoji}>{activity.icon}</Text>
                  </View>
                  <View style={styles.activityInfo}>
                    <Text style={styles.activityTitle}>{activity.title}</Text>
                    <Text style={styles.activityTime}>{activity.time}</Text>
                  </View>
                  <View style={[
                    styles.activityStatus,
                    activity.status === 'completed'
                      ? styles.statusCompleted
                      : styles.statusPending
                  ]}>
                    <Text style={styles.activityStatusText}>
                      {activity.status === 'completed' ? '✓ Done' : '• Soon'}
                    </Text>
                  </View>
                </TouchableOpacity>
                {index < activities.length - 1 && <View style={styles.activityDivider} />}
              </View>
            ))}
          </BlurView>

          {/* ── SAFETY RESOURCES ── */}
          <Text style={styles.sectionTitle}>Safety Resources</Text>
          <TouchableOpacity activeOpacity={0.8}>
            <BlurView intensity={25} tint="dark" style={[styles.glassCard, styles.resourceCard]}>
              <View style={[styles.resourceIcon, { backgroundColor: 'rgba(167,243,208,0.15)' }]}>
                <Text style={{ fontSize: 22 }}>👨‍👩‍👧</Text>
              </View>
              <View style={styles.resourceInfo}>
                <Text style={styles.resourceTitle}>Parental Guidance</Text>
                <Text style={styles.resourceSub}>Tips for Online Safety</Text>
              </View>
              <Text style={styles.resourceArrow}>›</Text>
            </BlurView>
          </TouchableOpacity>

          {/* ── EMERGENCY CONTACTS ── */}
          <Text style={styles.sectionTitle}>Emergency Contacts</Text>
          <BlurView intensity={25} tint="dark" style={styles.glassCard}>
            <View style={styles.emergencyHeader}>
              <View style={[styles.resourceIcon, { backgroundColor: 'rgba(251,113,133,0.15)' }]}>
                <Text style={{ fontSize: 22 }}>📞</Text>
              </View>
              <View>
                <Text style={styles.resourceTitle}>Hotline</Text>
                <Text style={[styles.resourceSub, { color: '#38BDF8' }]}>0800 123 456</Text>
              </View>
            </View>
            <View style={styles.contactGrid}>
              {['Family', 'Friends', 'Police', 'Fire', 'Ambulance'].map((contact) => (
                <TouchableOpacity key={contact} style={styles.contactChip} activeOpacity={0.7}>
                  <Text style={styles.contactChipText}>{contact}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </BlurView>

          {/* ── GET HELP CTA ── */}
          <TouchableOpacity
            style={styles.helpBtn}
            onPress={() => router.push('/help')}
            activeOpacity={0.85}
          >
            <Text style={styles.helpBtnText}>🆘  Get Help Now</Text>
          </TouchableOpacity>

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
    backgroundColor: 'rgba(10, 8, 35, 0.88)',
  },
  orb: { position: 'absolute', borderRadius: 999, opacity: 0.15 },
  orbTop: { width: 220, height: 220, backgroundColor: '#0284C7', top: -60, right: -40 },
  orbMid: { width: 160, height: 160, backgroundColor: '#0369A1', top: 300, left: -50 },
  safeArea: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 32 },

  // Header
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingTop: 12, marginBottom: 20,
  },
  greeting: { fontSize: 13, color: 'rgba(186,230,253,0.7)', marginBottom: 2 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#F5F3FF', letterSpacing: -0.5 },
  timeBadge: {
    backgroundColor: 'rgba(2,132,199,0.25)', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1, borderColor: 'rgba(56,189,248,0.3)',
  },
  timeText: { color: '#38BDF8', fontWeight: '700', fontSize: 14 },

  // Hero card
  heroCard: {
    borderRadius: 24, overflow: 'hidden', marginBottom: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  heroCardInner: { padding: 20 },
  heroCardLabel: {
    fontSize: 13, color: 'rgba(186,230,253,0.6)',
    fontWeight: '600', letterSpacing: 0.5, marginBottom: 16,
  },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  statCard: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  statIcon: {
    width: 48, height: 48, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  statEmoji: { fontSize: 22 },
  statValue: { fontSize: 36, fontWeight: '900', color: '#F5F3FF', letterSpacing: -1 },
  statValueAlert: { color: '#38BDF8' },
  statTitle: { fontSize: 14, color: '#BAE6FD', fontWeight: '600', marginTop: 2 },
  statSub: { fontSize: 11, color: 'rgba(186,230,253,0.4)', marginTop: 2 },
  statDivider: { width: 1, height: 80, backgroundColor: 'rgba(255,255,255,0.08)' },

  // Action buttons
  actionRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  actionBtn: {
    flex: 1, borderRadius: 16, paddingVertical: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  actionBtnPrimary: {
    backgroundColor: '#0284C7',
    shadowColor: '#0284C7', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
  },
  actionBtnSecondary: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },
  actionIcon: { fontSize: 16 },
  actionBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  actionBtnTextDark: { color: '#E9D5FF', fontWeight: '700', fontSize: 14 },

  // Section title
  sectionTitle: {
    fontSize: 16, fontWeight: '700', color: '#F5F3FF',
    marginBottom: 10, marginTop: 4, letterSpacing: -0.3,
  },

  // Glass card
  glassCard: {
    borderRadius: 20, overflow: 'hidden', marginBottom: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    padding: 16,
  },

  // Activity
  activityRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  activityIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  activityEmoji: { fontSize: 18 },
  activityInfo: { flex: 1 },
  activityTitle: { color: '#F5F3FF', fontWeight: '600', fontSize: 14 },
  activityTime: { color: 'rgba(186,230,253,0.5)', fontSize: 12, marginTop: 2 },
  activityStatus: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  statusCompleted: { backgroundColor: 'rgba(167,243,208,0.15)' },
  statusPending: { backgroundColor: 'rgba(56,189,248,0.15)' },
  activityStatusText: { fontSize: 11, color: '#BAE6FD', fontWeight: '600' },
  activityDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginVertical: 2 },

  // Resources
  resourceCard: { flexDirection: 'row', alignItems: 'center' },
  resourceIcon: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  resourceInfo: { flex: 1 },
  resourceTitle: { color: '#F5F3FF', fontWeight: '600', fontSize: 14 },
  resourceSub: { color: 'rgba(186,230,253,0.5)', fontSize: 12, marginTop: 2 },
  resourceArrow: { color: 'rgba(186,230,253,0.4)', fontSize: 22, fontWeight: '300' },

  // Emergency
  emergencyHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  contactGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  contactChip: {
    backgroundColor: 'rgba(2,132,199,0.2)', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1, borderColor: 'rgba(56,189,248,0.2)',
  },
  contactChipText: { color: '#38BDF8', fontSize: 13, fontWeight: '600' },

  // Help button
  helpBtn: {
    backgroundColor: '#0284C7', borderRadius: 18,
    paddingVertical: 18, alignItems: 'center', marginTop: 8,
    shadowColor: '#0284C7', shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5, shadowRadius: 20, elevation: 12,
  },
  helpBtnText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },
});
