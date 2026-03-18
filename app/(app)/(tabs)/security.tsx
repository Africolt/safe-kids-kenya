import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { BlurView } from 'expo-blur';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, serverTimestamp, addDoc } from 'firebase/firestore';
import { auth, db } from '../../../src/firebaseconfig';

const SEVERITY = {
  high:   { color: '#F87171', bg: 'rgba(248,113,113,0.12)', label: 'High' },
  medium: { color: '#FBBF24', bg: 'rgba(251,191,36,0.12)',  label: 'Medium' },
  low:    { color: '#BAE6FD', bg: 'rgba(186,230,253,0.12)', label: 'Low' },
};

function timeAgo(ts: any): string {
  if (!ts) return '';
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  return `${Math.floor(diff/86400)}d ago`;
}

export default function SecurityHub() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [safetyScore] = useState(87);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) { setLoading(false); return; }
    const q = query(
      collection(db, 'alerts'),
      where('userId', '==', uid),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        time: timeAgo(d.data().createdAt),
      }));
      setAlerts(data);
      setLoading(false);
    }, () => setLoading(false));
    return unsub;
  }, []);

  const activeAlerts = alerts.filter(a => !dismissed.includes(a.id));
  const highCount = activeAlerts.filter(a => a.severity === 'high').length;
  const medCount = activeAlerts.filter(a => a.severity === 'medium').length;

  const dismissAlert = async (id: string) => {
    setDismissed(prev => [...prev, id]);
    await updateDoc(doc(db, 'alerts', id), { dismissed: true });
  };

  return (
    <View style={styles.root}>
      <View style={styles.overlay} />
      <View style={[styles.orb, styles.orbTop]} />
      <View style={[styles.orb, styles.orbBottom]} />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Text style={styles.backText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Security Hub</Text>
            <View style={{ width: 36 }} />
          </View>

          {/* Safety Score */}
          <BlurView intensity={25} tint="dark" style={styles.scoreCard}>
            <Text style={styles.scoreEmoji}>🛡️</Text>
            <Text style={styles.scoreValue}>{safetyScore}</Text>
            <Text style={styles.scoreLabel}>Safety Score</Text>
            <View style={styles.scoreBar}>
              <View style={[styles.scoreBarFill, { width: `${safetyScore}%` as any }]} />
            </View>
            <Text style={styles.scoreStatus}>
              {safetyScore >= 80 ? '✅ Good standing' : safetyScore >= 60 ? '⚠️ Needs attention' : '🚨 Action required'}
            </Text>
          </BlurView>

          {/* Alert Summary */}
          <View style={styles.summaryRow}>
            <BlurView intensity={20} tint="dark" style={[styles.summaryCard, { borderColor: 'rgba(248,113,113,0.3)' }]}>
              <Text style={styles.summaryCount}>{highCount}</Text>
              <Text style={styles.summaryLabel}>High Risk</Text>
            </BlurView>
            <BlurView intensity={20} tint="dark" style={[styles.summaryCard, { borderColor: 'rgba(251,191,36,0.3)' }]}>
              <Text style={styles.summaryCount}>{medCount}</Text>
              <Text style={styles.summaryLabel}>Medium Risk</Text>
            </BlurView>
            <BlurView intensity={20} tint="dark" style={[styles.summaryCard, { borderColor: 'rgba(52,211,153,0.3)' }]}>
              <Text style={styles.summaryCount}>{activeAlerts.length - highCount - medCount}</Text>
              <Text style={styles.summaryLabel}>Low Risk</Text>
            </BlurView>
          </View>

          {/* Emergency Button */}
          <TouchableOpacity style={styles.emergencyBtn} onPress={() => router.push('/(app)/emergency' as any)} activeOpacity={0.85}>
            <Text style={styles.emergencyBtnText}>🆘 Emergency — Get Help Now</Text>
          </TouchableOpacity>

          {/* Alerts */}
          <Text style={styles.sectionTitle}>
            {loading ? 'Loading alerts...' : activeAlerts.length === 0 ? 'No Active Alerts' : `Active Alerts (${activeAlerts.length})`}
          </Text>

          {loading ? (
            <ActivityIndicator color="#38BDF8" style={{ marginTop: 20 }} />
          ) : activeAlerts.length === 0 ? (
            <BlurView intensity={18} tint="dark" style={styles.emptyCard}>
              <Text style={styles.emptyEmoji}>✅</Text>
              <Text style={styles.emptyText}>All clear! No active alerts.</Text>
            </BlurView>
          ) : (
            activeAlerts.map(alert => {
              const sv = SEVERITY[alert.severity as keyof typeof SEVERITY] ?? SEVERITY.low;
              return (
                <BlurView key={alert.id} intensity={18} tint="dark" style={[styles.alertCard, { borderColor: sv.color + '40' }]}>
                  <View style={[styles.alertIconWrap, { backgroundColor: sv.bg }]}>
                    <Text style={styles.alertIcon}>{alert.icon ?? '⚠️'}</Text>
                  </View>
                  <View style={styles.alertBody}>
                    <View style={styles.alertTop}>
                      <Text style={styles.alertTitle}>{alert.title}</Text>
                      <View style={[styles.severityBadge, { backgroundColor: sv.bg }]}>
                        <Text style={[styles.severityText, { color: sv.color }]}>{sv.label}</Text>
                      </View>
                    </View>
                    <Text style={styles.alertDesc}>{alert.desc}</Text>
                    <View style={styles.alertFooter}>
                      <Text style={styles.alertTime}>{alert.time}</Text>
                      <TouchableOpacity onPress={() => dismissAlert(alert.id)} style={styles.dismissBtn}>
                        <Text style={styles.dismissText}>Dismiss</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </BlurView>
              );
            })
          )}

          {/* Quick Actions */}
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {[
              { emoji: '📍', label: 'Safe Zones', route: '/(app)/map' },
              { emoji: '📞', label: 'Emergency Contacts', route: '/(app)/emergency' },
              { emoji: '📋', label: 'Report Incident', route: '/(app)/report-incident' },
              { emoji: '🔔', label: 'Notifications', route: '/(app)/notifications' },
            ].map((action, i) => (
              <TouchableOpacity key={i} style={styles.actionBtn} onPress={() => router.push(action.route as any)} activeOpacity={0.85}>
                <BlurView intensity={20} tint="dark" style={styles.actionBtnInner}>
                  <Text style={styles.actionEmoji}>{action.emoji}</Text>
                  <Text style={styles.actionLabel}>{action.label}</Text>
                </BlurView>
              </TouchableOpacity>
            ))}
          </View>
          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#080C14' },
  overlay: { position: 'absolute', width: '100%', height: '100%', backgroundColor: 'rgba(8,12,20,0.95)' },
  orb: { position: 'absolute', borderRadius: 999, opacity: 0.15 },
  orbTop: { width: 220, height: 220, backgroundColor: '#0284C7', top: -70, right: -50 },
  orbBottom: { width: 180, height: 180, backgroundColor: '#0369A1', bottom: 60, left: -50 },
  safeArea: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, marginBottom: 16 },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
  backText: { color: '#BAE6FD', fontSize: 18 },
  headerTitle: { color: '#F0F9FF', fontWeight: '800', fontSize: 18 },
  scoreCard: { borderRadius: 20, overflow: 'hidden', padding: 24, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', marginBottom: 16 },
  scoreEmoji: { fontSize: 36, marginBottom: 8 },
  scoreValue: { fontSize: 56, fontWeight: '900', color: '#F0F9FF', lineHeight: 60 },
  scoreLabel: { color: 'rgba(186,230,253,0.6)', fontSize: 14, marginBottom: 16 },
  scoreBar: { width: '100%', height: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden', marginBottom: 8 },
  scoreBarFill: { height: '100%', backgroundColor: '#34D399', borderRadius: 3 },
  scoreStatus: { color: 'rgba(186,230,253,0.7)', fontSize: 13 },
  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  summaryCard: { flex: 1, borderRadius: 14, overflow: 'hidden', padding: 14, alignItems: 'center', borderWidth: 1 },
  summaryCount: { fontSize: 28, fontWeight: '900', color: '#F0F9FF' },
  summaryLabel: { color: 'rgba(186,230,253,0.6)', fontSize: 11, fontWeight: '600', marginTop: 2 },
  emergencyBtn: { backgroundColor: 'rgba(248,113,113,0.15)', borderRadius: 16, paddingVertical: 16, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(248,113,113,0.3)', marginBottom: 24 },
  emergencyBtnText: { color: '#F87171', fontSize: 16, fontWeight: '800' },
  sectionTitle: { color: '#F0F9FF', fontWeight: '800', fontSize: 16, marginBottom: 12 },
  emptyCard: { borderRadius: 16, overflow: 'hidden', padding: 24, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  emptyEmoji: { fontSize: 36, marginBottom: 8 },
  emptyText: { color: 'rgba(186,230,253,0.6)', fontSize: 14 },
  alertCard: { borderRadius: 16, overflow: 'hidden', padding: 14, marginBottom: 10, borderWidth: 1, flexDirection: 'row', gap: 12 },
  alertIconWrap: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  alertIcon: { fontSize: 20 },
  alertBody: { flex: 1 },
  alertTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  alertTitle: { color: '#F0F9FF', fontWeight: '700', fontSize: 13, flex: 1, marginRight: 8 },
  severityBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  severityText: { fontSize: 11, fontWeight: '700' },
  alertDesc: { color: 'rgba(186,230,253,0.6)', fontSize: 12, lineHeight: 18, marginBottom: 8 },
  alertFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  alertTime: { color: 'rgba(186,230,253,0.4)', fontSize: 11 },
  dismissBtn: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  dismissText: { color: 'rgba(186,230,253,0.6)', fontSize: 12, fontWeight: '600' },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionBtn: { width: '47%' },
  actionBtnInner: { borderRadius: 16, overflow: 'hidden', padding: 16, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  actionEmoji: { fontSize: 28, marginBottom: 8 },
  actionLabel: { color: 'rgba(186,230,253,0.7)', fontSize: 13, fontWeight: '600', textAlign: 'center' },
});
