import React, { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, ScrollView, Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { router, useLocalSearchParams } from 'expo-router';

const { height } = Dimensions.get('window');

const CAREGIVER_NAMES: Record<string, string> = {
  '1': 'Amina Wanjiku',
  '2': 'Brian Otieno',
  '3': 'Grace Muthoni',
  '4': 'David Kamau',
};

export default function BookingConfirmation() {
  const { amount, caregiverId } = useLocalSearchParams<{ amount: string; caregiverId: string }>();
  const caregiverName = CAREGIVER_NAMES[caregiverId ?? '1'] ?? 'Your Caregiver';
  const totalAmount = parseInt(amount ?? '0');
  const bookingRef = `SKK-${Date.now().toString().slice(-6)}`;

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const checkAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Sequence: checkmark pops → card fades in → content slides up
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 7, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, tension: 70, friction: 10, useNativeDriver: true }),
      ]),
    ]).start();

    // Checkmark draw animation
    Animated.spring(checkAnim, {
      toValue: 1, tension: 50, friction: 6, delay: 200, useNativeDriver: true
    }).start();
  }, []);

  const details = [
    { label: 'Booking Ref', value: bookingRef, highlight: true },
    { label: 'Caregiver', value: caregiverName },
    { label: 'Amount Paid', value: `KSh ${totalAmount.toLocaleString()}` },
    { label: 'Date', value: 'Tomorrow, 3:00 PM' },
    { label: 'Service', value: 'After School Care' },
    { label: 'Status', value: '✓ Confirmed', success: true },
  ];

  const nextSteps = [
    { emoji: '📲', title: 'Caregiver Notified', sub: 'Amina has been sent your booking details' },
    { emoji: '💬', title: 'Chat Opens', sub: 'You can now message your caregiver directly' },
    { emoji: '📍', title: 'Live Tracking', sub: 'Track your caregiver on the day of service' },
    { emoji: '⭐', title: 'Rate After', sub: 'Leave a review after the session ends' },
  ];

  return (
    <View style={styles.root}>
      <View style={styles.overlay} />
      <View style={[styles.orb, styles.orbTop]} />
      <View style={[styles.orb, styles.orbBottom]} />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── SUCCESS HERO ── */}
          <View style={styles.heroSection}>
            {/* Animated checkmark */}
            <Animated.View style={[styles.checkOuter, { transform: [{ scale: scaleAnim }] }]}>
              <View style={styles.checkMiddle}>
                <Animated.View style={[styles.checkInner, { transform: [{ scale: checkAnim }] }]}>
                  <Text style={styles.checkText}>✓</Text>
                </Animated.View>
              </View>
            </Animated.View>

            <Text style={styles.heroTitle}>Booking Confirmed!</Text>
            <Text style={styles.heroSub}>
              Your session with {caregiverName.split(' ')[0]} is all set
            </Text>

            {/* Ref badge */}
            <View style={styles.refBadge}>
              <Text style={styles.refLabel}>Booking Reference</Text>
              <Text style={styles.refValue}>{bookingRef}</Text>
            </View>
          </View>

          {/* ── BOOKING DETAILS ── */}
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            <BlurView intensity={25} tint="dark" style={styles.card}>
              <Text style={styles.cardTitle}>Booking Details</Text>
              {details.map((item, i) => (
                <View key={i} style={[styles.detailRow, i < details.length - 1 && styles.detailDivider]}>
                  <Text style={styles.detailLabel}>{item.label}</Text>
                  <Text style={[
                    styles.detailValue,
                    item.highlight && styles.detailHighlight,
                    item.success && styles.detailSuccess,
                  ]}>
                    {item.value}
                  </Text>
                </View>
              ))}
            </BlurView>

            {/* ── NEXT STEPS ── */}
            <BlurView intensity={25} tint="dark" style={styles.card}>
              <Text style={styles.cardTitle}>What happens next</Text>
              {nextSteps.map((step, i) => (
                <View key={i} style={[styles.nextStepRow, i < nextSteps.length - 1 && styles.nextStepDivider]}>
                  <View style={styles.nextStepEmojiBg}>
                    <Text style={styles.nextStepEmoji}>{step.emoji}</Text>
                  </View>
                  <View style={styles.nextStepContent}>
                    <Text style={styles.nextStepTitle}>{step.title}</Text>
                    <Text style={styles.nextStepSub}>{step.sub}</Text>
                  </View>
                </View>
              ))}
            </BlurView>

            {/* ── QUICK ACTIONS ── */}
            <View style={styles.actionsGrid}>
              {[
                { emoji: '💬', label: 'Message\nCaregiver', route: '/(app)/chat' },
                { emoji: '📋', label: 'My\nBookings', route: '/(app)/(tabs)/home' },
                { emoji: '🗺️', label: 'View\nMap', route: '/(app)/map' },
                { emoji: '🆘', label: 'Emergency\nContacts', route: '/(app)/emergency' },
              ].map((action, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.actionCard}
                  onPress={() => router.push(action.route as any)}
                  activeOpacity={0.8}
                >
                  <BlurView intensity={20} tint="dark" style={styles.actionCardInner}>
                    <Text style={styles.actionEmoji}>{action.emoji}</Text>
                    <Text style={styles.actionLabel}>{action.label}</Text>
                  </BlurView>
                </TouchableOpacity>
              ))}
            </View>

            {/* ── CANCEL NOTICE ── */}
            <BlurView intensity={15} tint="dark" style={styles.cancelNotice}>
              <Text style={styles.cancelNoticeEmoji}>ℹ️</Text>
              <Text style={styles.cancelNoticeText}>
                Free cancellation up to 2 hours before the session starts.
                After that a 50% cancellation fee applies.
              </Text>
            </BlurView>

            <View style={{ height: 100 }} />
          </Animated.View>
        </ScrollView>

        {/* ── BOTTOM BAR ── */}
        <BlurView intensity={40} tint="dark" style={styles.bottomBar}>
          <View style={styles.bottomBarInner}>
            <TouchableOpacity
              style={styles.homeBtn}
              onPress={() => router.replace('/(app)/(tabs)/home')}
              activeOpacity={0.85}
            >
              <Text style={styles.homeBtnText}>Back to Home</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.chatBtn}
              onPress={() => router.push('/(app)/chat' as any)}
              activeOpacity={0.85}
            >
              <Text style={styles.chatBtnText}>💬 Chat →</Text>
            </TouchableOpacity>
          </View>
        </BlurView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#080C14' },
  overlay: { position: 'absolute', width: '100%', height: '100%', backgroundColor: 'rgba(8,12,20,0.95)' },
  orb: { position: 'absolute', borderRadius: 999, opacity: 0.1 },
  orbTop: { width: 240, height: 240, backgroundColor: '#34D399', top: -80, right: -60 },
  orbBottom: { width: 180, height: 180, backgroundColor: '#0284C7', bottom: 80, left: -60 },
  safeArea: { flex: 1 },
  scrollContent: { paddingHorizontal: 16 },

  // Hero
  heroSection: { alignItems: 'center', paddingTop: 32, paddingBottom: 28 },
  checkOuter: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(52,211,153,0.1)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 24, borderWidth: 1.5,
    borderColor: 'rgba(52,211,153,0.3)',
  },
  checkMiddle: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: 'rgba(52,211,153,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  checkInner: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(52,211,153,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  checkText: { fontSize: 32, color: '#34D399', fontWeight: '900' },
  heroTitle: { fontSize: 28, fontWeight: '900', color: '#F0F9FF', letterSpacing: -0.5, marginBottom: 8 },
  heroSub: { color: 'rgba(186,230,253,0.6)', fontSize: 15, marginBottom: 20 },
  refBadge: {
    backgroundColor: 'rgba(56,189,248,0.1)', borderRadius: 14,
    paddingHorizontal: 20, paddingVertical: 10,
    borderWidth: 1, borderColor: 'rgba(56,189,248,0.2)',
    alignItems: 'center',
  },
  refLabel: { color: 'rgba(186,230,253,0.4)', fontSize: 10, letterSpacing: 1.5, marginBottom: 4 },
  refValue: { color: '#38BDF8', fontSize: 18, fontWeight: '800', letterSpacing: 2 },

  // Card
  card: { borderRadius: 24, overflow: 'hidden', marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', padding: 20 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#F0F9FF', marginBottom: 16 },

  // Details
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 },
  detailDivider: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  detailLabel: { color: 'rgba(186,230,253,0.5)', fontSize: 13 },
  detailValue: { color: '#F0F9FF', fontSize: 13, fontWeight: '600' },
  detailHighlight: { color: '#38BDF8', fontWeight: '700', letterSpacing: 0.5 },
  detailSuccess: { color: '#34D399' },

  // Next steps
  nextStepRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12 },
  nextStepDivider: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  nextStepEmojiBg: {
    width: 44, height: 44, borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },
  nextStepEmoji: { fontSize: 22 },
  nextStepContent: { flex: 1 },
  nextStepTitle: { color: '#F0F9FF', fontWeight: '600', fontSize: 14, marginBottom: 3 },
  nextStepSub: { color: 'rgba(186,230,253,0.5)', fontSize: 12 },

  // Actions grid
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  actionCard: { width: '47%', borderRadius: 18, overflow: 'hidden' },
  actionCardInner: { padding: 16, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  actionEmoji: { fontSize: 26, marginBottom: 8 },
  actionLabel: { color: 'rgba(186,230,253,0.7)', fontSize: 12, fontWeight: '600', textAlign: 'center', lineHeight: 18 },

  // Cancel notice
  cancelNotice: {
    borderRadius: 16, overflow: 'hidden', padding: 14,
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  cancelNoticeEmoji: { fontSize: 16 },
  cancelNoticeText: { flex: 1, color: 'rgba(186,230,253,0.4)', fontSize: 12, lineHeight: 18 },

  // Bottom bar
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, overflow: 'hidden', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)' },
  bottomBarInner: { flexDirection: 'row', gap: 10, padding: 16, paddingBottom: 28 },
  homeBtn: { flex: 1, borderRadius: 16, paddingVertical: 14, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  homeBtnText: { color: 'rgba(186,230,253,0.7)', fontWeight: '600', fontSize: 14 },
  chatBtn: { flex: 1, borderRadius: 16, paddingVertical: 14, alignItems: 'center', backgroundColor: '#0284C7', shadowColor: '#0284C7', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
  chatBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
