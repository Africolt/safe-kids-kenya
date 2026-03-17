import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { router, useLocalSearchParams } from 'expo-router';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../src/firebaseconfig';

export default function BookingDetail() {
  const { id, action } = useLocalSearchParams<{ id: string; action?: string }>();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!id) return;
    getDoc(doc(db, 'bookings', id)).then(snap => {
      if (snap.exists()) setBooking({ id: snap.id, ...snap.data() });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  const updateStatus = async (newStatus: string) => {
    setProcessing(true);
    try {
      await updateDoc(doc(db, 'bookings', id!), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });
      setBooking((prev: any) => ({ ...prev, status: newStatus }));
    } catch {
      Alert.alert('Error', 'Could not update booking. Try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleAccept = () => {
    Alert.alert('Accept Booking', 'Confirm this session?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Accept', onPress: () => updateStatus('confirmed') },
    ]);
  };

  const handleDecline = () => {
    Alert.alert('Decline Booking', 'Are you sure? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Decline', style: 'destructive', onPress: () => updateStatus('cancelled') },
    ]);
  };

  const handleCheckin = () => {
    Alert.alert('Check In', 'Confirm you have started this session?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Check In', onPress: () => {
        updateStatus('in_progress');
        Alert.alert('✅ Checked In', 'Parent has been notified');
      }},
    ]);
  };

  const handleComplete = () => {
    Alert.alert('Complete Session', 'Mark this session as completed?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Complete', onPress: () => updateStatus('completed') },
    ]);
  };

  const statusColors: Record<string, { color: string; bg: string }> = {
    pending:     { color: '#FBBF24', bg: 'rgba(251,191,36,0.12)' },
    confirmed:   { color: '#38BDF8', bg: 'rgba(56,189,248,0.12)' },
    in_progress: { color: '#A78BFA', bg: 'rgba(167,139,250,0.12)' },
    completed:   { color: '#34D399', bg: 'rgba(52,211,153,0.12)' },
    cancelled:   { color: '#F87171', bg: 'rgba(248,113,113,0.12)' },
  };

  if (loading) return (
    <View style={[styles.root, { alignItems: 'center', justifyContent: 'center' }]}>
      <ActivityIndicator color="#38BDF8" size="large" />
    </View>
  );

  if (!booking) return (
    <View style={[styles.root, { alignItems: 'center', justifyContent: 'center' }]}>
      <Text style={{ color: '#F87171', fontSize: 16 }}>Booking not found</Text>
      <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
        <Text style={{ color: '#38BDF8' }}>← Go Back</Text>
      </TouchableOpacity>
    </View>
  );

  const sc = statusColors[booking.status] ?? statusColors.pending;
  const statusLabel = booking.status.charAt(0).toUpperCase() + booking.status.slice(1).replace('_', ' ');

  return (
    <View style={styles.root}>
      <View style={styles.overlay} />
      <View style={[styles.orb, styles.orbTop]} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Booking Detail</Text>
          <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
            <Text style={[styles.statusText, { color: sc.color }]}>{statusLabel}</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* Service summary */}
          <BlurView intensity={24} tint="dark" style={styles.serviceCard}>
            <Text style={styles.serviceEmoji}>🛎️</Text>
            <View style={styles.serviceInfo}>
              <Text style={styles.serviceName}>{booking.service}</Text>
              <Text style={styles.serviceParent}>Booking ref: SKK-{booking.id?.slice(-6).toUpperCase()}</Text>
            </View>
          </BlurView>

          {/* Details */}
          <Text style={styles.sectionTitle}>Session Details</Text>
          <BlurView intensity={20} tint="dark" style={styles.detailsCard}>
            {[
              { emoji: '📅', label: 'Date', value: booking.dateLabel },
              { emoji: '🕐', label: 'Time', value: booking.time },
              { emoji: '⏱️', label: 'Duration', value: `${booking.duration} hours` },
              { emoji: '🔄', label: 'Recurring', value: booking.recurring ? 'Yes — Weekly' : 'No' },
              ...(booking.pickupPoint ? [{ emoji: '📍', label: 'Pickup', value: booking.pickupPoint }] : []),
            ].map((item, i, arr) => (
              <View key={i} style={[styles.detailRow, i < arr.length - 1 && styles.detailDivider]}>
                <Text style={styles.detailEmoji}>{item.emoji}</Text>
                <Text style={styles.detailLabel}>{item.label}</Text>
                <Text style={styles.detailValue}>{item.value}</Text>
              </View>
            ))}
          </BlurView>

          {/* Notes */}
          {booking.notes ? (
            <>
              <Text style={styles.sectionTitle}>Parent Notes</Text>
              <BlurView intensity={20} tint="dark" style={styles.notesCard}>
                <Text style={styles.notesText}>⚠️ {booking.notes}</Text>
              </BlurView>
            </>
          ) : null}

          {/* Payment */}
          <Text style={styles.sectionTitle}>Payment</Text>
          <BlurView intensity={20} tint="dark" style={styles.payCard}>
            <View style={styles.payRow}>
              <Text style={styles.payLabel}>Session Fee</Text>
              <Text style={styles.payValue}>KSh {booking.amount?.toLocaleString()}</Text>
            </View>
            <View style={[styles.payRow, styles.payDivider]}>
              <Text style={styles.payLabel}>Platform Fee</Text>
              <Text style={[styles.payValue, { color: '#F87171' }]}>- KSh {booking.platformFee}</Text>
            </View>
            <View style={styles.payRow}>
              <Text style={styles.payTotal}>You Receive</Text>
              <Text style={styles.payTotalValue}>KSh {(booking.amount - booking.platformFee)?.toLocaleString()}</Text>
            </View>
          </BlurView>

          {/* Actions */}
          {booking.status === 'pending' && (
            <View style={styles.actionsRow}>
              <TouchableOpacity style={styles.declineBtn} onPress={handleDecline} disabled={processing}>
                <Text style={styles.declineBtnText}>{processing ? '...' : '✕ Decline'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.acceptBtn} onPress={handleAccept} disabled={processing}>
                <Text style={styles.acceptBtnText}>{processing ? 'Processing...' : '✓ Accept'}</Text>
              </TouchableOpacity>
            </View>
          )}

          {(booking.status === 'confirmed' || booking.status === 'in_progress') && (
            <View style={styles.actionsCol}>
              {booking.status === 'confirmed' && (
                <TouchableOpacity style={styles.checkinBtn} onPress={handleCheckin} disabled={processing}>
                  <Text style={styles.checkinBtnText}>📍 Check In — Start Session</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.completeBtn} onPress={handleComplete} disabled={processing}>
                <Text style={styles.completeBtnText}>{processing ? 'Processing...' : '✅ Mark as Completed'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.emergencyBtn}
                onPress={() => router.push('/(caregiver)/medical-emergency' as any)}
              >
                <Text style={styles.emergencyBtnText}>🚨 Medical Emergency</Text>
              </TouchableOpacity>
            </View>
          )}

          {booking.status === 'completed' && (
            <BlurView intensity={20} tint="dark" style={styles.completedBanner}>
              <Text style={styles.completedText}>
                ✅ Session completed — Payment will be processed within 24hrs
              </Text>
            </BlurView>
          )}

          {booking.status === 'cancelled' && (
            <BlurView intensity={20} tint="dark" style={styles.cancelledBanner}>
              <Text style={styles.cancelledText}>✕ This booking was declined</Text>
            </BlurView>
          )}

          <TouchableOpacity
            style={styles.chatBtn}
            onPress={() => router.push(`/(app)/chat?caregiverId=${id}` as any)}
          >
            <Text style={styles.chatBtnText}>💬 Message Parent</Text>
          </TouchableOpacity>

          <View style={{ height: 60 }} />
        </ScrollView>
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
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, marginBottom: 16, gap: 8 },
  backBtn: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8 },
  backBtnText: { color: '#BAE6FD', fontSize: 14 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: '#F0F9FF' },
  statusBadge: { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 5 },
  statusText: { fontSize: 12, fontWeight: '700' },
  scrollContent: { paddingHorizontal: 16 },
  serviceCard: { borderRadius: 20, overflow: 'hidden', padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(56,189,248,0.2)' },
  serviceEmoji: { fontSize: 32 },
  serviceInfo: { flex: 1 },
  serviceName: { color: '#F0F9FF', fontWeight: '800', fontSize: 17 },
  serviceParent: { color: 'rgba(186,230,253,0.4)', fontSize: 12, marginTop: 3 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#F0F9FF', marginBottom: 10 },
  detailsCard: { borderRadius: 20, overflow: 'hidden', padding: 16, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  detailRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 10 },
  detailDivider: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  detailEmoji: { fontSize: 16 },
  detailLabel: { color: 'rgba(186,230,253,0.4)', fontSize: 12, width: 80 },
  detailValue: { flex: 1, color: '#F0F9FF', fontSize: 13, fontWeight: '600', textAlign: 'right' },
  notesCard: { borderRadius: 16, overflow: 'hidden', padding: 14, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(251,191,36,0.2)' },
  notesText: { color: '#FBBF24', fontSize: 13, lineHeight: 20 },
  payCard: { borderRadius: 20, overflow: 'hidden', padding: 16, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  payRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 },
  payDivider: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  payLabel: { color: 'rgba(186,230,253,0.5)', fontSize: 13 },
  payValue: { color: '#F0F9FF', fontSize: 13, fontWeight: '600' },
  payTotal: { color: '#F0F9FF', fontWeight: '800', fontSize: 15 },
  payTotalValue: { color: '#34D399', fontWeight: '900', fontSize: 18 },
  actionsRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  declineBtn: { flex: 1, borderRadius: 14, paddingVertical: 14, alignItems: 'center', backgroundColor: 'rgba(248,113,113,0.1)', borderWidth: 1, borderColor: 'rgba(248,113,113,0.25)' },
  declineBtnText: { color: '#F87171', fontWeight: '700', fontSize: 14 },
  acceptBtn: { flex: 2, borderRadius: 14, paddingVertical: 14, alignItems: 'center', backgroundColor: '#0284C7' },
  acceptBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  actionsCol: { gap: 10, marginBottom: 12 },
  checkinBtn: { borderRadius: 14, paddingVertical: 14, alignItems: 'center', backgroundColor: 'rgba(52,211,153,0.1)', borderWidth: 1, borderColor: 'rgba(52,211,153,0.25)' },
  checkinBtnText: { color: '#34D399', fontWeight: '700', fontSize: 14 },
  completeBtn: { borderRadius: 14, paddingVertical: 14, alignItems: 'center', backgroundColor: '#0284C7' },
  completeBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  emergencyBtn: { borderRadius: 14, paddingVertical: 14, alignItems: 'center', backgroundColor: 'rgba(248,113,113,0.1)', borderWidth: 1, borderColor: 'rgba(248,113,113,0.3)' },
  emergencyBtnText: { color: '#F87171', fontWeight: '700', fontSize: 14 },
  completedBanner: { borderRadius: 14, overflow: 'hidden', padding: 14, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(52,211,153,0.2)' },
  completedText: { color: '#34D399', fontSize: 13, lineHeight: 20 },
  cancelledBanner: { borderRadius: 14, overflow: 'hidden', padding: 14, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(248,113,113,0.2)' },
  cancelledText: { color: '#F87171', fontSize: 13 },
  chatBtn: { borderRadius: 14, paddingVertical: 14, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginBottom: 12 },
  chatBtnText: { color: 'rgba(186,230,253,0.6)', fontWeight: '600', fontSize: 14 },
});
