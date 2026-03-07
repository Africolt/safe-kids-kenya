import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Image, Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { BlurView } from 'expo-blur';

const SEVERITY = {
  high: { color: '#F87171', bg: 'rgba(248,113,113,0.12)', dot: '#F87171', label: 'High' },
  medium: { color: '#FBBF24', bg: 'rgba(251,191,36,0.12)', dot: '#FBBF24', label: 'Medium' },
  low: { color: '#BAE6FD', bg: 'rgba(186,230,253,0.12)', dot: '#BAE6FD', label: 'Low' },
};

const anomalyAlerts = [
  { id: 1, title: 'Potential Anomaly Detected', desc: 'Unusual pattern in login behavior', time: '2:11 PM', severity: 'high', icon: '⚠️' },
  { id: 2, title: 'Unusual Login Attempt', desc: 'Login from unrecognized device', time: '2:11 PM', severity: 'medium', icon: '🔐' },
  { id: 3, title: 'Device Location Mismatch', desc: 'Device reported in 2 locations', time: '1:11 PM', severity: 'medium', icon: '📍' },
  { id: 4, title: 'Unauthorized Attempt', desc: 'Failed access 3 times', time: '1:01 PM', severity: 'high', icon: '🚫' },
  { id: 5, title: 'Device Connection Delay', desc: 'Device offline for 12 minutes', time: '0:41 PM', severity: 'low', icon: '📶' },
];

export default function SecurityHub() {
  const [dismissed, setDismissed] = useState<number[]>([]);

  const activeAlerts = anomalyAlerts.filter(a => !dismissed.includes(a.id));
  const highCount = activeAlerts.filter(a => a.severity === 'high').length;
  const medCount = activeAlerts.filter(a => a.severity === 'medium').length;

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
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── HEADER ── */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerSub}>Monitoring active</Text>
              <Text style={styles.headerTitle}>Security Hub</Text>
            </View>
            <BlurView intensity={30} tint="dark" style={styles.scoreBadge}>
              <Text style={styles.scoreEmoji}>🛡️</Text>
              <Text style={styles.scoreText}>4.8/5</Text>
            </BlurView>
          </View>

          {/* ── THREAT SUMMARY CARD ── */}
          <BlurView intensity={30} tint="dark" style={styles.summaryCard}>
            <View style={styles.summaryTop}>
              <View>
                <Text style={styles.summaryLabel}>Active Threats</Text>
                <Text style={styles.summaryCount}>{activeAlerts.length}</Text>
              </View>
              <View style={styles.summaryBadges}>
                <View style={[styles.severityBadge, { backgroundColor: SEVERITY.high.bg }]}>
                  <View style={[styles.severityDot, { backgroundColor: SEVERITY.high.color }]} />
                  <Text style={[styles.severityText, { color: SEVERITY.high.color }]}>
                    {highCount} High
                  </Text>
                </View>
                <View style={[styles.severityBadge, { backgroundColor: SEVERITY.medium.bg }]}>
                  <View style={[styles.severityDot, { backgroundColor: SEVERITY.medium.color }]} />
                  <Text style={[styles.severityText, { color: SEVERITY.medium.color }]}>
                    {medCount} Medium
                  </Text>
                </View>
              </View>
            </View>

            {/* Threat bar */}
            <View style={styles.threatBarBg}>
              <View style={[styles.threatBarFill, {
                width: `${Math.min((activeAlerts.length / 8) * 100, 100)}%`,
                backgroundColor: highCount > 1 ? '#F87171' : '#FBBF24'
              }]} />
            </View>
            <Text style={styles.threatBarLabel}>
              {highCount > 1 ? 'Elevated risk — review alerts below' : 'Moderate — stay vigilant'}
            </Text>
          </BlurView>

          {/* ── ALERTS LIST ── */}
          <Text style={styles.sectionTitle}>Anomaly Alerts</Text>

          {activeAlerts.length === 0 ? (
            <BlurView intensity={25} tint="dark" style={styles.emptyCard}>
              <Text style={styles.emptyEmoji}>✅</Text>
              <Text style={styles.emptyText}>All clear — no active threats</Text>
            </BlurView>
          ) : (
            activeAlerts.map((alert, index) => {
              const sev = SEVERITY[alert.severity as keyof typeof SEVERITY];
              return (
                <BlurView
                  key={alert.id}
                  intensity={25}
                  tint="dark"
                  style={[styles.alertCard, { borderLeftColor: sev.color }]}
                >
                  <View style={styles.alertRow}>
                    {/* Icon */}
                    <View style={[styles.alertIconWrap, { backgroundColor: sev.bg }]}>
                      <Text style={styles.alertEmoji}>{alert.icon}</Text>
                    </View>

                    {/* Content */}
                    <View style={styles.alertContent}>
                      <View style={styles.alertTitleRow}>
                        <Text style={styles.alertTitle}>{alert.title}</Text>
                        <View style={[styles.severityPill, { backgroundColor: sev.bg }]}>
                          <Text style={[styles.severityPillText, { color: sev.color }]}>
                            {sev.label}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.alertDesc}>{alert.desc}</Text>
                      <Text style={styles.alertTime}>{alert.time}</Text>
                    </View>
                  </View>

                  {/* Actions */}
                  <View style={styles.alertActions}>
                    <TouchableOpacity
                      style={styles.alertActionBtn}
                      onPress={() => setDismissed(prev => [...prev, alert.id])}
                    >
                      <Text style={styles.alertActionText}>Dismiss</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.alertActionBtn, styles.alertActionBtnPrimary]}>
                      <Text style={styles.alertActionTextPrimary}>Review →</Text>
                    </TouchableOpacity>
                  </View>
                </BlurView>
              );
            })
          )}

          {/* ── QUICK ACTIONS ── */}
          <Text style={styles.sectionTitle}>Quick Actions</Text>
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
              <Text style={styles.actionIcon}>📋</Text>
              <Text style={styles.actionBtnTextLight}>Report</Text>
            </TouchableOpacity>
          </View>

          {/* ── EMERGENCY CTA ── */}
          <TouchableOpacity style={styles.emergencyBtn} activeOpacity={0.85}>
            <Text style={styles.emergencyBtnText}>🆘  Emergency — Get Help Now</Text>
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
    backgroundColor: 'rgba(10, 8, 35, 0.9)',
  },
  orb: { position: 'absolute', borderRadius: 999, opacity: 0.12 },
  orbTop: { width: 200, height: 200, backgroundColor: '#F87171', top: -50, right: -50 },
  orbBottom: { width: 180, height: 180, backgroundColor: '#0284C7', bottom: 100, left: -60 },
  safeArea: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 40 },

  // Header
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingTop: 12, marginBottom: 20,
  },
  headerSub: { fontSize: 12, color: 'rgba(186,230,253,0.6)', marginBottom: 2 },
  headerTitle: { fontSize: 26, fontWeight: '900', color: '#F5F3FF', letterSpacing: -0.8 },
  scoreBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: 14, overflow: 'hidden', paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  scoreEmoji: { fontSize: 16 },
  scoreText: { color: '#38BDF8', fontWeight: '700', fontSize: 14 },

  // Summary card
  summaryCard: {
    borderRadius: 22, overflow: 'hidden', marginBottom: 24,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', padding: 20,
  },
  summaryTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 16,
  },
  summaryLabel: { color: 'rgba(186,230,253,0.6)', fontSize: 12, marginBottom: 4 },
  summaryCount: { fontSize: 42, fontWeight: '900', color: '#F5F3FF', letterSpacing: -2 },
  summaryBadges: { gap: 8, alignItems: 'flex-end' },
  severityBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5,
  },
  severityDot: { width: 6, height: 6, borderRadius: 3 },
  severityText: { fontSize: 12, fontWeight: '600' },
  threatBarBg: {
    height: 4, backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 2, marginBottom: 8, overflow: 'hidden',
  },
  threatBarFill: { height: '100%', borderRadius: 2 },
  threatBarLabel: { color: 'rgba(186,230,253,0.5)', fontSize: 11 },

  // Section title
  sectionTitle: {
    fontSize: 16, fontWeight: '700', color: '#F5F3FF',
    marginBottom: 12, letterSpacing: -0.3,
  },

  // Alert card
  alertCard: {
    borderRadius: 18, overflow: 'hidden', marginBottom: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    borderLeftWidth: 3, padding: 14,
  },
  alertRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  alertIconWrap: {
    width: 42, height: 42, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  alertEmoji: { fontSize: 20 },
  alertContent: { flex: 1 },
  alertTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  alertTitle: { color: '#F5F3FF', fontWeight: '700', fontSize: 13, flex: 1, marginRight: 8 },
  severityPill: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  severityPillText: { fontSize: 10, fontWeight: '700' },
  alertDesc: { color: 'rgba(186,230,253,0.6)', fontSize: 12, marginBottom: 4 },
  alertTime: { color: 'rgba(186,230,253,0.35)', fontSize: 11 },
  alertActions: { flexDirection: 'row', gap: 8 },
  alertActionBtn: {
    flex: 1, borderRadius: 10, paddingVertical: 8,
    alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.06)',
  },
  alertActionBtnPrimary: { backgroundColor: 'rgba(2,132,199,0.3)' },
  alertActionText: { color: 'rgba(186,230,253,0.6)', fontSize: 12, fontWeight: '600' },
  alertActionTextPrimary: { color: '#38BDF8', fontSize: 12, fontWeight: '700' },

  // Empty state
  emptyCard: {
    borderRadius: 18, overflow: 'hidden', padding: 32,
    alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    marginBottom: 16,
  },
  emptyEmoji: { fontSize: 36, marginBottom: 12 },
  emptyText: { color: 'rgba(186,230,253,0.6)', fontSize: 14 },

  // Actions
  actionRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
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
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  actionIcon: { fontSize: 16 },
  actionBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  actionBtnTextLight: { color: '#E9D5FF', fontWeight: '700', fontSize: 14 },

  // Emergency
  emergencyBtn: {
    backgroundColor: 'rgba(248,113,113,0.2)', borderRadius: 18,
    paddingVertical: 18, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(248,113,113,0.3)',
    marginTop: 4,
  },
  emergencyBtnText: { color: '#F87171', fontSize: 15, fontWeight: '800' },
});
