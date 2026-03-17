import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { auth, db } from '../../../src/firebaseconfig';

type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

interface Booking {
  id: string;
  parentId: string;
  caregiverId: string;
  caregiverName: string;
  service: string;
  dateLabel: string;
  time: string;
  duration: number;
  total: number;
  location?: string;
  notes?: string;
  status: BookingStatus;
  createdAt: any;
}

const STATUS_CONFIG: Record<BookingStatus, { label: string; color: string; bg: string }> = {
  pending:   { label: 'Pending',   color: '#FBBF24', bg: 'rgba(251,191,36,0.12)' },
  confirmed: { label: 'Confirmed', color: '#38BDF8', bg: 'rgba(56,189,248,0.12)' },
  completed: { label: 'Completed', color: '#34D399', bg: 'rgba(52,211,153,0.12)' },
  cancelled: { label: 'Cancelled', color: '#F87171', bg: 'rgba(248,113,113,0.12)' },
};

const FILTERS: { label: string; value: BookingStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
];

export default function CaregiverBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<BookingStatus | 'all'>('all');

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    // Real-time listener for this caregiver's bookings
    const q = query(
      collection(db, 'bookings'),
      where('caregiverId', '==', uid),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
      setBookings(data);
      setLoading(false);
    }, () => setLoading(false));

    return unsub;
  }, []);

  const filtered = activeFilter === 'all' ? bookings : bookings.filter(b => b.status === activeFilter);

  const counts = {
    pending:   bookings.filter(b => b.status === 'pending').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    completed: bookings.filter(b => b.status === 'completed').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
  };

  return (
    <View style={styles.root}>
      <View style={styles.overlay} />
      <View style={[styles.orb, styles.orbTop]} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Bookings</Text>
          <View style={styles.totalBadge}>
            <Text style={styles.totalBadgeText}>{bookings.length} total</Text>
          </View>
        </View>

        {/* Summary */}
        <View style={styles.summaryRow}>
          {Object.entries(counts).map(([status, count]) => {
            const config = STATUS_CONFIG[status as BookingStatus];
            return (
              <BlurView key={status} intensity={20} tint="dark" style={styles.summaryCard}>
                <Text style={[styles.summaryCount, { color: config.color }]}>{count}</Text>
                <Text style={styles.summaryLabel}>{config.label}</Text>
              </BlurView>
            );
          })}
        </View>

        {/* Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {FILTERS.map(f => (
            <TouchableOpacity
              key={f.value}
              style={[styles.filterChip, activeFilter === f.value && styles.filterChipActive]}
              onPress={() => setActiveFilter(f.value)}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterChipText, activeFilter === f.value && styles.filterChipTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color="#38BDF8" size="large" />
            <Text style={styles.loadingText}>Loading bookings...</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {filtered.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>📅</Text>
                <Text style={styles.emptyTitle}>No bookings yet</Text>
                <Text style={styles.emptySub}>
                  {activeFilter === 'all'
                    ? 'When parents book you, they will appear here'
                    : `No ${activeFilter} bookings`}
                </Text>
              </View>
            ) : (
              filtered.map(b => {
                const config = STATUS_CONFIG[b.status];
                return (
                  <TouchableOpacity
                    key={b.id}
                    onPress={() => router.push(`/(caregiver)/booking-detail?id=${b.id}` as any)}
                    activeOpacity={0.85}
                  >
                    <BlurView intensity={20} tint="dark" style={styles.bookingCard}>
                      <View style={styles.bookingTop}>
                        <View style={styles.childAvatar}>
                          <Text style={styles.childAvatarText}>👦</Text>
                        </View>
                        <View style={styles.bookingInfo}>
                          <Text style={styles.bookingService}>{b.service}</Text>
                          <Text style={styles.bookingParent}>Parent booking</Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
                          <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
                        </View>
                      </View>
                      <View style={styles.bookingMeta}>
                        {[
                          { emoji: '📅', text: `${b.dateLabel} · ${b.time}` },
                          { emoji: '⏱️', text: `${b.duration} hours` },
                          { emoji: '💰', text: `KSh ${b.total?.toLocaleString()}` },
                        ].map((d, i) => (
                          <View key={i} style={styles.metaRow}>
                            <Text style={styles.metaEmoji}>{d.emoji}</Text>
                            <Text style={styles.metaText}>{d.text}</Text>
                          </View>
                        ))}
                      </View>
                      {b.status === 'pending' && (
                        <View style={styles.actionsRow}>
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
                      )}
                    </BlurView>
                  </TouchableOpacity>
                );
              })
            )}
            <View style={{ height: 80 }} />
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#080C14' },
  overlay: { position: 'absolute', width: '100%', height: '100%', backgroundColor: 'rgba(8,12,20,0.95)' },
  orb: { position: 'absolute', borderRadius: 999, opacity: 0.1 },
  orbTop: { width: 200, height: 200, backgroundColor: '#38BDF8', top: -60, right: -40 },
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingTop: 16, marginBottom: 16 },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#F0F9FF', flex: 1 },
  totalBadge: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 5 },
  totalBadgeText: { color: 'rgba(186,230,253,0.5)', fontSize: 12 },
  summaryRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 14 },
  summaryCard: { flex: 1, borderRadius: 14, overflow: 'hidden', padding: 10, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  summaryCount: { fontSize: 18, fontWeight: '900' },
  summaryLabel: { color: 'rgba(186,230,253,0.4)', fontSize: 9, marginTop: 2 },
  filterRow: { paddingHorizontal: 16, gap: 8, paddingBottom: 14 },
  filterChip: { borderRadius: 12, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.08)' },
  filterChipActive: { borderColor: '#38BDF8', backgroundColor: 'rgba(56,189,248,0.12)' },
  filterChipText: { color: 'rgba(186,230,253,0.5)', fontSize: 13, fontWeight: '600' },
  filterChipTextActive: { color: '#38BDF8' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: 'rgba(186,230,253,0.5)', fontSize: 14 },
  scrollContent: { paddingHorizontal: 16 },
  emptyState: { alignItems: 'center', paddingTop: 80 },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { color: '#F0F9FF', fontSize: 20, fontWeight: '800', marginBottom: 8 },
  emptySub: { color: 'rgba(186,230,253,0.4)', fontSize: 14, textAlign: 'center' },
  bookingCard: { borderRadius: 20, overflow: 'hidden', marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', padding: 16 },
  bookingTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  childAvatar: { width: 44, height: 44, borderRadius: 13, backgroundColor: 'rgba(56,189,248,0.12)', alignItems: 'center', justifyContent: 'center' },
  childAvatarText: { fontSize: 22 },
  bookingInfo: { flex: 1 },
  bookingService: { color: '#F0F9FF', fontWeight: '700', fontSize: 14 },
  bookingParent: { color: 'rgba(186,230,253,0.5)', fontSize: 12, marginTop: 2 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: 11, fontWeight: '700' },
  bookingMeta: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 10, gap: 6, marginBottom: 12 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metaEmoji: { fontSize: 13 },
  metaText: { color: 'rgba(186,230,253,0.6)', fontSize: 12 },
  actionsRow: { flexDirection: 'row', gap: 10 },
  declineBtn: { flex: 1, borderRadius: 10, paddingVertical: 10, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  declineBtnText: { color: 'rgba(186,230,253,0.5)', fontSize: 12, fontWeight: '600' },
  acceptBtn: { flex: 2, borderRadius: 10, paddingVertical: 10, alignItems: 'center', backgroundColor: '#0284C7' },
  acceptBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
});
