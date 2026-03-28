import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import { collection, query, where, onSnapshot, doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../../src/firebaseconfig';

const { width } = Dimensions.get('window');

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function CaregiverHome() {
  const [time, setTime] = useState(new Date());
  const [available, setAvailable] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [pendingBookings, setPendingBookings] = useState<any[]>([]);
  const [upcomingBookings, setUpcomingBookings] = useState<any[]>([]);
  const [monthlyEarnings, setMonthlyEarnings] = useState(0);
  const [totalBookings, setTotalBookings] = useState(0);
  const [rating, setRating] = useState<number | null>(null);
  const [togglingAvailable, setTogglingAvailable] = useState(false);

  // Clock
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  // Fetch caregiver profile
  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    getDoc(doc(db, 'users', uid)).then(snap => {
      const data = snap.data();
      if (data) {
        setFirstName(data.firstName ?? auth.currentUser?.email?.split('@')[0] ?? 'Caregiver');
        setAvailable(data.available ?? false);
        setRating(data.rating ?? null);
      }
    });
  }, []);

  // Fetch bookings — real time
  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const q = query(
      collection(db, 'bookings'),
      where('caregiverId', '==', uid),
    );

    const unsub = onSnapshot(q, (snap) => {
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];

      // Pending — needs response
      setPendingBookings(all.filter(b => b.status === 'pending'));

      // Upcoming — confirmed sessions
      setUpcomingBookings(all.filter(b => b.status === 'confirmed' || b.status === 'in_progress'));

      // Stats
      setTotalBookings(all.filter(b => b.status !== 'cancelled').length);

      // Monthly earnings — completed bookings this month
      const now = new Date();
      const thisMonth = all.filter(b => {
        if (b.status !== 'completed') return false;
        const created = b.createdAt?.toDate?.() ?? new Date(0);
        return created.getMonth() === now.getMonth() &&
               created.getFullYear() === now.getFullYear();
      });
      const earnings = thisMonth.reduce((sum: number, b: any) =>
        sum + ((b.amount ?? 0) - (b.platformFee ?? 50)), 0);
      setMonthlyEarnings(earnings);
    });

    return unsub;
  }, []);

  const handleToggleAvailable = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    setTogglingAvailable(true);
    try {
      await updateDoc(doc(db, 'users', uid), { available: !available });
      setAvailable(prev => !prev);
    } catch (e) {
      console.error('Toggle failed:', e);
    } finally {
      setTogglingAvailable(false);
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.overlay} />
      <View style={[styles.orb, styles.orbTop]} />
      <View style={[styles.orb, styles.orbBottom]} />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8}}>
              <Image
                source={require('../../../assets/images/safe-totos-logo.png')}
                style={{ width:32, height: 32, resizeMode: 'contain'}}
              />
              <Text style={styles.greeting}>{getGreeting()}, {firstName} 👋</Text>
              <Text style={styles.date}>{new Date().toLocaleDateString('en-KE', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.headerBtn} onPress={() => router.push('/(app)/notifications' as any)}>
                <Text style={styles.headerBtnEmoji}>🔔</Text>
                {pendingBookings.length > 0 && <View style={styles.notifDot} />}
              </TouchableOpacity>
              <TouchableOpacity style={styles.sosHeaderBtn} onPress={() => router.push('/(caregiver)/sos' as any)}>
                <Text style={styles.headerBtnEmoji}>🚨</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            {[
              { label: 'This Month', value: monthlyEarnings > 0 ? `KSh ${monthlyEarnings.toLocaleString()}` : 'KSh 0', emoji: '💰', color: '#34D399' },
              { label: 'Bookings', value: totalBookings.toString(), emoji: '📅', color: '#38BDF8' },
              { label: 'Rating', value: rating ? `${rating} ⭐` : 'New', emoji: '🏆', color: '#FBBF24' },
            ].map((s, i) => (
              <BlurView key={i} intensity={22} tint="dark" style={styles.statCard}>
                <Text style={styles.statEmoji}>{s.emoji}</Text>
                <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </BlurView>
            ))}
          </View>

          {/* Availability toggle */}
          <BlurView intensity={22} tint="dark" style={[styles.availCard, available && styles.availCardOn]}>
            <View style={styles.availLeft}>
              <Text style={styles.availEmoji}>{available ? '🟢' : '⚫'}</Text>
              <View>
                <Text style={styles.availTitle}>{available ? 'You are Available' : 'You are Unavailable'}</Text>
                <Text style={styles.availSub}>{available ? 'Parents can book you now' : 'Hidden from parent search'}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.availToggle, available && styles.availToggleOn]}
              onPress={handleToggleAvailable}
              disabled={togglingAvailable}
            >
              <View style={[styles.availThumb, available && styles.availThumbOn]} />
            </TouchableOpacity>
          </BlurView>

          {/* Pending bookings */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Pending Requests</Text>
            {pendingBookings.length > 0 && (
              <View style={styles.pendingBadge}>
                <Text style={styles.pendingBadgeText}>{pendingBookings.length}</Text>
              </View>
            )}
          </View>

          {pendingBookings.length === 0 ? (
            <BlurView intensity={20} tint="dark" style={styles.emptyCard}>
              <Text style={styles.emptyEmoji}>📭</Text>
              <Text style={styles.emptyText}>No pending requests</Text>
            </BlurView>
          ) : (
            pendingBookings.map(b => (
              <BlurView key={b.id} intensity={20} tint="dark" style={styles.bookingCard}>
                <View style={styles.bookingTop}>
                  <View style={styles.childAvatar}>
                    <Text style={styles.childAvatarText}>👦</Text>
                  </View>
                  <View style={styles.bookingInfo}>
                    <Text style={styles.bookingService}>{b.service}</Text>
                    <Text style={styles.bookingMeta}>📅 {b.dateLabel} · {b.time}</Text>
                    <Text style={styles.bookingMeta}>⏱️ {b.duration}hrs · 💰 KSh {b.total?.toLocaleString()}</Text>
                  </View>
                </View>
                <View style={styles.bookingActions}>
                  <TouchableOpacity
                    style={styles.declineBtn}
                    onPress={() => router.push(`/(caregiver)/booking-detail?id=${b.id}&action=decline` as any)}
                  >
                    <Text style={styles.declineBtnText}>Decline</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.acceptBtn}
                    onPress={() => router.push(`/(caregiver)/booking-detail?id=${b.id}&action=accept` as any)}
                  >
                    <Text style={styles.acceptBtnText}>Accept →</Text>
                  </TouchableOpacity>
                </View>
              </BlurView>
            ))
          )}

          {/* Upcoming sessions */}
          {upcomingBookings.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Upcoming Sessions</Text>
              {upcomingBookings.map(b => (
                <TouchableOpacity
                  key={b.id}
                  onPress={() => router.push(`/(caregiver)/booking-detail?id=${b.id}` as any)}
                  activeOpacity={0.85}
                >
                  <BlurView intensity={20} tint="dark" style={[styles.bookingCard, styles.confirmedCard]}>
                    <View style={styles.bookingTop}>
                      <View style={[styles.childAvatar, { backgroundColor: 'rgba(52,211,153,0.12)' }]}>
                        <Text style={styles.childAvatarText}>👦</Text>
                      </View>
                      <View style={styles.bookingInfo}>
                        <Text style={styles.bookingService}>{b.service}</Text>
                        <Text style={styles.bookingMeta}>📅 {b.dateLabel} · {b.time}</Text>
                        <Text style={styles.bookingMeta}>💰 KSh {b.total?.toLocaleString()}</Text>
                      </View>
                      <View style={styles.confirmedBadge}>
                        <Text style={styles.confirmedBadgeText}>Confirmed</Text>
                      </View>
                    </View>
                  </BlurView>
                </TouchableOpacity>
              ))}
            </>
          )}

          {/* Quick actions */}
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickGrid}>
            {[
              { emoji: '📅', label: 'Availability', route: '/(caregiver)/availability' },
              { emoji: '🪪', label: 'Verify Docs', route: '/(caregiver)/id-verification' },
              { emoji: '💬', label: 'Messages', route: '/(caregiver)/(tabs)/bookings' },
              { emoji: '🏥', label: 'Medical', route: '/(caregiver)/medical-emergency' },
            ].map((a, i) => (
              <TouchableOpacity
                key={i}
                style={styles.quickBtn}
                onPress={() => router.push(a.route as any)}
                activeOpacity={0.8}
              >
                <BlurView intensity={20} tint="dark" style={styles.quickBtnInner}>
                  <Text style={styles.quickEmoji}>{a.emoji}</Text>
                  <Text style={styles.quickLabel}>{a.label}</Text>
                </BlurView>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ height: 80 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#080C14' },
  overlay: { position: 'absolute', width: '100%', height: '100%', backgroundColor: 'rgba(8,12,20,0.95)' },
  orb: { position: 'absolute', borderRadius: 999, opacity: 0.1 },
  orbTop: { width: 220, height: 220, backgroundColor: '##0284C7', top: -70, right: -50 },
  orbBottom: { width: 180, height: 180, backgroundColor: '#0284C7', bottom: 60, left: -50 },
  safeArea: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 8 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  greeting: { fontSize: 20, fontWeight: '800', color: '#F0F9FF' },
  date: { color: 'rgba(186,230,253,0.45)', fontSize: 12, marginTop: 3 },
  headerActions: { flexDirection: 'row', gap: 8 },
  headerBtn: { backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 12, width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  sosHeaderBtn: { backgroundColor: 'rgba(248,113,113,0.12)', borderRadius: 12, width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerBtnEmoji: { fontSize: 18 },
  notifDot: { position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: 4, backgroundColor: '#F87171' },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard: { flex: 1, borderRadius: 16, overflow: 'hidden', padding: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  statEmoji: { fontSize: 20, marginBottom: 4 },
  statValue: { fontSize: 14, fontWeight: '900' },
  statLabel: { color: 'rgba(186,230,253,0.4)', fontSize: 9, marginTop: 2 },
  availCard: { borderRadius: 18, overflow: 'hidden', padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  availCardOn: { borderColor: 'rgba(52,211,153,0.25)' },
  availLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  availEmoji: { fontSize: 22 },
  availTitle: { color: '#F0F9FF', fontWeight: '700', fontSize: 14 },
  availSub: { color: 'rgba(186,230,253,0.4)', fontSize: 11, marginTop: 2 },
  availToggle: { width: 48, height: 26, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', paddingHorizontal: 2 },
  availToggleOn: { backgroundColor: '#34D399' },
  availThumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(186,230,253,0.3)' },
  availThumbOn: { backgroundColor: '#fff', alignSelf: 'flex-end' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#F0F9FF', marginBottom: 10 },
  pendingBadge: { backgroundColor: '#DC2626', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  pendingBadgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  emptyCard: { borderRadius: 16, overflow: 'hidden', padding: 20, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', marginBottom: 16, flexDirection: 'row', justifyContent: 'center', gap: 10 },
  emptyEmoji: { fontSize: 20 },
  emptyText: { color: 'rgba(186,230,253,0.4)', fontSize: 13 },
  bookingCard: { borderRadius: 18, overflow: 'hidden', padding: 14, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  confirmedCard: { borderColor: 'rgba(52,211,153,0.2)' },
  bookingTop: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', marginBottom: 12 },
  childAvatar: { width: 42, height: 42, borderRadius: 13, backgroundColor: 'rgba(56,189,248,0.12)', alignItems: 'center', justifyContent: 'center' },
  childAvatarText: { fontSize: 22 },
  bookingInfo: { flex: 1 },
  bookingService: { color: '#F0F9FF', fontWeight: '700', fontSize: 14, marginBottom: 4 },
  bookingMeta: { color: 'rgba(186,230,253,0.5)', fontSize: 12, marginBottom: 2 },
  bookingActions: { flexDirection: 'row', gap: 8 },
  declineBtn: { flex: 1, borderRadius: 10, paddingVertical: 10, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  declineBtnText: { color: 'rgba(186,230,253,0.5)', fontSize: 12, fontWeight: '600' },
  acceptBtn: { flex: 2, borderRadius: 10, paddingVertical: 10, alignItems: 'center', backgroundColor: '#0284C7' },
  acceptBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  confirmedBadge: { backgroundColor: 'rgba(52,211,153,0.12)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  confirmedBadgeText: { color: '#34D399', fontSize: 11, fontWeight: '700' },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quickBtn: { width: (width - 42) / 2 },
  quickBtnInner: { borderRadius: 16, overflow: 'hidden', padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', alignItems: 'center', gap: 8 },
  quickEmoji: { fontSize: 26 },
  quickLabel: { color: 'rgba(186,230,253,0.6)', fontSize: 12, fontWeight: '600' },
});
