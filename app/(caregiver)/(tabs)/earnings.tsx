import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../../../src/firebaseconfig';

const PLATFORM_FEE = 50;
const MONTHS = ['This Month', 'Last Month', 'All Time'];

export default function CaregiverEarnings() {
  const [activeMonth, setActiveMonth] = useState('This Month');
  const [withdrawing, setWithdrawing] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const q = query(
      collection(db, 'bookings'),
      where('caregiverId', '==', uid),
    );

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
      setTransactions(data);
      setLoading(false);
    });

    return unsub;
  }, []);

  // Filter by month
  const filtered = transactions.filter(t => {
    if (activeMonth === 'All Time') return true;
    const created = t.createdAt?.toDate?.() ?? new Date(0);
    const now = new Date();
    if (activeMonth === 'This Month') {
      return created.getMonth() === now.getMonth() &&
             created.getFullYear() === now.getFullYear();
    }
    if (activeMonth === 'Last Month') {
      const last = new Date(now.getFullYear(), now.getMonth() - 1);
      return created.getMonth() === last.getMonth() &&
             created.getFullYear() === last.getFullYear();
    }
    return true;
  });

  // Earnings calculations — caregiver gets amount minus platform fee
  const completed = filtered.filter(t => t.status === 'completed');
  const pending = filtered.filter(t => t.status === 'confirmed' || t.status === 'in_progress');
  const totalEarned = completed.reduce((s: number, t: any) => s + ((t.amount ?? 0) - PLATFORM_FEE), 0);
  const pendingAmount = pending.reduce((s: number, t: any) => s + ((t.amount ?? 0) - PLATFORM_FEE), 0);
  const available = totalEarned; // simplified — no withdrawal tracking yet

  // Weekly bar chart data from completed bookings
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const weeklyData = days.map(day => {
    const dayEarnings = completed
      .filter((t: any) => {
        const d = t.createdAt?.toDate?.() ?? new Date(0);
        return d.toLocaleDateString('en-KE', { weekday: 'short' }) === day;
      })
      .reduce((s: number, t: any) => s + ((t.amount ?? 0) - PLATFORM_FEE), 0);
    return { day, amount: dayEarnings };
  });
  const maxWeekly = Math.max(...weeklyData.map(d => d.amount), 1);
  const weekTotal = weeklyData.reduce((s, d) => s + d.amount, 0);

  const handleWithdraw = () => {
    if (available === 0) return Alert.alert('No balance', 'You have no available balance to withdraw');
    Alert.alert(
      'Withdraw to M-Pesa',
      `Withdraw KSh ${available.toLocaleString()} to your registered M-Pesa number?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Withdraw',
          onPress: () => {
            setWithdrawing(true);
            setTimeout(() => {
              setWithdrawing(false);
              Alert.alert('✅ Success', `KSh ${available.toLocaleString()} sent to your M-Pesa`);
            }, 2000);
          },
        },
      ]
    );
  };

  return (
    <View style={styles.root}>
      <View style={styles.overlay} />
      <View style={[styles.orb, styles.orbTop]} />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          <Text style={styles.headerTitle}>Earnings</Text>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="#34D399" size="large" />
              <Text style={styles.loadingText}>Loading earnings...</Text>
            </View>
          ) : (
            <>
              {/* Balance card */}
              <BlurView intensity={28} tint="dark" style={styles.balanceCard}>
                <Text style={styles.balanceLabel}>Available Balance</Text>
                <Text style={styles.balanceAmount}>KSh {available.toLocaleString()}</Text>
                <View style={styles.balanceDivider} />
                <View style={styles.balanceStats}>
                  {[
                    { label: 'Total Earned', value: `KSh ${totalEarned.toLocaleString()}`, color: '#34D399' },
                    { label: 'Pending', value: `KSh ${pendingAmount.toLocaleString()}`, color: '#FBBF24' },
                    { label: 'Sessions', value: completed.length.toString(), color: '#38BDF8' },
                  ].map((s, i) => (
                    <View key={i} style={styles.balanceStat}>
                      {i > 0 && <View style={styles.balanceStatDivider} />}
                      <Text style={[styles.balanceStatValue, { color: s.color }]}>{s.value}</Text>
                      <Text style={styles.balanceStatLabel}>{s.label}</Text>
                    </View>
                  ))}
                </View>
                <TouchableOpacity
                  style={[styles.withdrawBtn, (withdrawing || available === 0) && styles.withdrawBtnLoading]}
                  onPress={handleWithdraw}
                  disabled={withdrawing || available === 0}
                  activeOpacity={0.85}
                >
                  <Text style={styles.withdrawBtnText}>
                    {withdrawing ? 'Processing...' : '📱 Withdraw to M-Pesa'}
                  </Text>
                </TouchableOpacity>
              </BlurView>

              {/* Monthly selector + bar chart */}
              <BlurView intensity={22} tint="dark" style={styles.chartCard}>
                <View style={styles.chartHeader}>
                  <Text style={styles.chartTitle}>Overview</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.monthsRow}>
                    {MONTHS.map(m => (
                      <TouchableOpacity
                        key={m}
                        style={[styles.monthChip, activeMonth === m && styles.monthChipActive]}
                        onPress={() => setActiveMonth(m)}
                      >
                        <Text style={[styles.monthChipText, activeMonth === m && styles.monthChipTextActive]}>{m}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {weekTotal === 0 ? (
                  <View style={styles.chartEmpty}>
                    <Text style={styles.chartEmptyText}>No completed sessions yet</Text>
                  </View>
                ) : (
                  <>
                    <View style={styles.barChart}>
                      {weeklyData.map((bar, i) => (
                        <View key={i} style={styles.barItem}>
                          <View style={styles.barTrack}>
                            <View style={[styles.barFill, { height: `${(bar.amount / maxWeekly) * 100}%` }]} />
                          </View>
                          <Text style={styles.barLabel}>{bar.day}</Text>
                        </View>
                      ))}
                    </View>
                    <Text style={styles.chartTotal}>
                      Week total: KSh {weekTotal.toLocaleString()}
                    </Text>
                  </>
                )}
              </BlurView>

              {/* Transactions */}
              <Text style={styles.sectionTitle}>Transaction History</Text>
              {filtered.length === 0 ? (
                <BlurView intensity={20} tint="dark" style={styles.emptyCard}>
                  <Text style={styles.emptyEmoji}>💸</Text>
                  <Text style={styles.emptyTitle}>No transactions yet</Text>
                  <Text style={styles.emptySub}>Completed sessions will appear here</Text>
                </BlurView>
              ) : (
                <BlurView intensity={20} tint="dark" style={styles.transactionsCard}>
                  {filtered.map((t: any, i: number) => {
                    const net = (t.amount ?? 0) - PLATFORM_FEE;
                    const statusEmoji = t.status === 'completed' ? '💰' :
                      t.status === 'confirmed' ? '⏳' : '📋';
                    const amountColor = t.status === 'completed' ? '#34D399' :
                      t.status === 'confirmed' ? '#FBBF24' : 'rgba(186,230,253,0.4)';
                    return (
                      <View key={t.id} style={[styles.transRow, i < filtered.length - 1 && styles.transDivider]}>
                        <View style={styles.transIcon}>
                          <Text style={styles.transIconText}>{statusEmoji}</Text>
                        </View>
                        <View style={styles.transInfo}>
                          <Text style={styles.transService}>{t.service}</Text>
                          <Text style={styles.transDate}>{t.dateLabel ?? 'Upcoming'}</Text>
                        </View>
                        <View style={styles.transRight}>
                          <Text style={[styles.transAmount, { color: amountColor }]}>
                            +KSh {net.toLocaleString()}
                          </Text>
                          <Text style={styles.transStatus}>{t.status}</Text>
                        </View>
                      </View>
                    );
                  })}
                </BlurView>
              )}

              {/* Platform fee note */}
              <BlurView intensity={18} tint="dark" style={styles.feeNote}>
                <Text style={styles.feeNoteText}>
                  💡 Safe Kids Kenya charges a KSh {PLATFORM_FEE} platform fee per booking. Your earnings shown are after this deduction.
                </Text>
              </BlurView>
            </>
          )}

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
  orbTop: { width: 200, height: 200, backgroundColor: '#34D399', top: -60, right: -40 },
  safeArea: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16 },
  headerTitle: { fontSize: 26, fontWeight: '900', color: '#F0F9FF', marginBottom: 16 },
  loadingContainer: { alignItems: 'center', paddingTop: 80, gap: 12 },
  loadingText: { color: 'rgba(186,230,253,0.5)', fontSize: 14 },
  balanceCard: { borderRadius: 24, overflow: 'hidden', padding: 22, marginBottom: 14, borderWidth: 1, borderColor: 'rgba(52,211,153,0.2)' },
  balanceLabel: { color: 'rgba(186,230,253,0.5)', fontSize: 12, letterSpacing: 1, marginBottom: 6 },
  balanceAmount: { fontSize: 38, fontWeight: '900', color: '#F0F9FF', marginBottom: 16 },
  balanceDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginBottom: 16 },
  balanceStats: { flexDirection: 'row', marginBottom: 18 },
  balanceStat: { flex: 1, alignItems: 'center', flexDirection: 'row', gap: 0 },
  balanceStatDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginRight: 12, height: '100%' },
  balanceStatValue: { fontWeight: '800', fontSize: 13 },
  balanceStatLabel: { color: 'rgba(186,230,253,0.4)', fontSize: 10, marginTop: 2 },
  withdrawBtn: { backgroundColor: '#34D399', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  withdrawBtnLoading: { opacity: 0.5 },
  withdrawBtnText: { color: '#080C14', fontWeight: '800', fontSize: 14 },
  chartCard: { borderRadius: 20, overflow: 'hidden', padding: 16, marginBottom: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  chartHeader: { marginBottom: 16 },
  chartTitle: { color: '#F0F9FF', fontWeight: '800', fontSize: 15, marginBottom: 10 },
  monthsRow: { gap: 8 },
  monthChip: { borderRadius: 10, paddingHorizontal: 14, paddingVertical: 7, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  monthChipActive: { borderColor: '#34D399', backgroundColor: 'rgba(52,211,153,0.1)' },
  monthChipText: { color: 'rgba(186,230,253,0.5)', fontSize: 12, fontWeight: '600' },
  monthChipTextActive: { color: '#34D399' },
  chartEmpty: { paddingVertical: 24, alignItems: 'center' },
  chartEmptyText: { color: 'rgba(186,230,253,0.4)', fontSize: 13 },
  barChart: { flexDirection: 'row', alignItems: 'flex-end', height: 80, gap: 6, marginBottom: 10 },
  barItem: { flex: 1, alignItems: 'center', gap: 4 },
  barTrack: { width: '100%', flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden', justifyContent: 'flex-end' },
  barFill: { width: '100%', backgroundColor: '#34D399', borderRadius: 4 },
  barLabel: { color: 'rgba(186,230,253,0.4)', fontSize: 9 },
  chartTotal: { color: 'rgba(186,230,253,0.5)', fontSize: 12, textAlign: 'right' },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#F0F9FF', marginBottom: 10 },
  emptyCard: { borderRadius: 18, overflow: 'hidden', padding: 28, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', marginBottom: 14 },
  emptyEmoji: { fontSize: 36, marginBottom: 12 },
  emptyTitle: { color: '#F0F9FF', fontWeight: '700', fontSize: 16, marginBottom: 6 },
  emptySub: { color: 'rgba(186,230,253,0.4)', fontSize: 13 },
  transactionsCard: { borderRadius: 20, overflow: 'hidden', padding: 4, marginBottom: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  transRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  transDivider: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  transIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' },
  transIconText: { fontSize: 18 },
  transInfo: { flex: 1 },
  transService: { color: '#F0F9FF', fontWeight: '600', fontSize: 13 },
  transDate: { color: 'rgba(186,230,253,0.4)', fontSize: 11, marginTop: 2 },
  transRight: { alignItems: 'flex-end' },
  transAmount: { fontWeight: '800', fontSize: 14 },
  transStatus: { color: 'rgba(186,230,253,0.35)', fontSize: 10, marginTop: 2 },
  feeNote: { borderRadius: 14, overflow: 'hidden', padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  feeNoteText: { color: 'rgba(186,230,253,0.5)', fontSize: 12, lineHeight: 19 },
});
