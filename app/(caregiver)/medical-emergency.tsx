import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Animated, Linking, Alert, Vibration } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';

type MedState = 'idle' | 'notifying' | 'waiting' | 'escalated' | 'resolved';

const WAIT_SECONDS = 180; // 3 minutes

export default function MedicalEmergency() {
  const [medState, setMedState] = useState<MedState>('idle');
  const [timeLeft, setTimeLeft] = useState(WAIT_SECONDS);
  const [logs, setLogs] = useState<{ time: string; text: string }[]>([]);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const addLog = (text: string) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs(prev => [...prev, { time: timeStr, text }]);
  };

  useEffect(() => {
    if (medState === 'waiting') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.15, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      ).start();

      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setMedState('escalated');
            addLog('⚠️ No parent response — caregiver authorized to call ambulance');
            Vibration.vibrate([0, 300, 100, 300]);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timerRef.current!);
    }
  }, [medState]);

  const handleNotifyParent = () => {
    setMedState('notifying');
    addLog('🚨 Medical emergency reported');
    setTimeout(() => {
      addLog('📲 Push notification sent to Jane Mwangi');
      addLog('📞 Automated call placed to +254 712 000 001');
      addLog('📲 SMS backup sent to parent');
      addLog('🛡️ Safe Kids team alerted');
      setMedState('waiting');
      setTimeLeft(WAIT_SECONDS);
    }, 2000);
  };

  const handleParentResponded = () => {
    clearInterval(timerRef.current!);
    addLog('✅ Parent responded — taking over');
    setMedState('resolved');
  };

  const handleCallAmbulance = () => {
    Alert.alert(
      '🚑 Call Ambulance',
      'Call 999 for an ambulance now?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call 999',
          style: 'destructive',
          onPress: () => {
            addLog('🚑 Ambulance called — 999');
            addLog('📲 Parent notified of ambulance call');
            Linking.openURL('tel:999');
            setMedState('resolved');
          },
        },
      ]
    );
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const timerColor = timeLeft > 120 ? '#34D399' : timeLeft > 60 ? '#FBBF24' : '#F87171';

  return (
    <View style={styles.root}>
      <View style={styles.overlay} />
      <View style={[styles.orb, styles.orbTop]} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Medical Emergency</Text>
          <TouchableOpacity style={styles.sosLink} onPress={() => router.replace('/(caregiver)/sos' as any)}>
            <Text style={styles.sosLinkText}>🚨 SOS</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* ── IDLE ── */}
          {medState === 'idle' && (
            <>
              <BlurView intensity={24} tint="dark" style={styles.heroCard}>
                <Text style={styles.heroEmoji}>🏥</Text>
                <View style={styles.heroText}>
                  <Text style={styles.heroTitle}>Child needs medical attention?</Text>
                  <Text style={styles.heroSub}>Tap below to alert the parent immediately. If no response in 3 minutes, you are authorized to call an ambulance.</Text>
                </View>
              </BlurView>

              <Text style={styles.sectionTitle}>How this works</Text>
              <BlurView intensity={20} tint="dark" style={styles.stepsCard}>
                {[
                  { emoji: '1️⃣', title: 'You report the emergency', sub: 'App instantly alerts parent via push, call, and SMS' },
                  { emoji: '2️⃣', title: 'Parent has 3 minutes to respond', sub: 'A countdown timer tracks the response window' },
                  { emoji: '3️⃣', title: 'No response — you are authorized', sub: 'App explicitly authorizes you to call 999 for an ambulance' },
                  { emoji: '4️⃣', title: 'Full audit trail saved', sub: 'Every action is timestamped and logged for accountability' },
                ].map((s, i) => (
                  <View key={i} style={[styles.stepRow, i < 3 && styles.stepDivider]}>
                    <Text style={styles.stepEmoji}>{s.emoji}</Text>
                    <View style={styles.stepText}>
                      <Text style={styles.stepTitle}>{s.title}</Text>
                      <Text style={styles.stepSub}>{s.sub}</Text>
                    </View>
                  </View>
                ))}
              </BlurView>

              <BlurView intensity={18} tint="dark" style={styles.childCard}>
                <Text style={styles.childCardLabel}>Current Session</Text>
                <Text style={styles.childCardName}>👦 Amani, 7 years old</Text>
                <Text style={styles.childCardParent}>Parent: Jane Mwangi · +254 712 000 001</Text>
              </BlurView>

              <TouchableOpacity style={styles.notifyBtn} onPress={handleNotifyParent} activeOpacity={0.85}>
                <Text style={styles.notifyBtnText}>🚨 Alert Parent Now</Text>
              </TouchableOpacity>
            </>
          )}

          {/* ── NOTIFYING ── */}
          {medState === 'notifying' && (
            <View style={styles.centerContent}>
              <Animated.View style={[styles.notifyingCircle, { transform: [{ scale: pulseAnim }] }]}>
                <Text style={styles.notifyingEmoji}>📲</Text>
              </Animated.View>
              <Text style={styles.notifyingTitle}>Alerting Parent...</Text>
              <Text style={styles.notifyingSub}>Sending push notification, call and SMS</Text>
            </View>
          )}

          {/* ── WAITING ── */}
          {medState === 'waiting' && (
            <>
              <BlurView intensity={24} tint="dark" style={[styles.timerCard, { borderColor: `${timerColor}33` }]}>
                <Text style={styles.timerLabel}>Parent Response Window</Text>
                <Animated.Text style={[styles.timerValue, { color: timerColor, transform: [{ scale: pulseAnim }] }]}>
                  {formatTime(timeLeft)}
                </Animated.Text>
                <Text style={styles.timerSub}>
                  {timeLeft > 60
                    ? 'Waiting for parent to respond...'
                    : timeLeft > 0
                    ? '⚠️ Running out of time...'
                    : 'Time expired'}
                </Text>
                <View style={styles.timerTrack}>
                  <View style={[styles.timerFill, { width: `${(timeLeft / WAIT_SECONDS) * 100}%`, backgroundColor: timerColor }]} />
                </View>
              </BlurView>

              <BlurView intensity={20} tint="dark" style={styles.alertsSentCard}>
                <Text style={styles.alertsSentTitle}>Alerts Sent ✓</Text>
                <Text style={styles.alertsSentItem}>📲 Push notification — Jane Mwangi</Text>
                <Text style={styles.alertsSentItem}>📞 Automated call placed</Text>
                <Text style={styles.alertsSentItem}>💬 SMS backup sent</Text>
                <Text style={styles.alertsSentItem}>🛡️ Safe Kids team alerted</Text>
              </BlurView>

              <TouchableOpacity style={styles.respondedBtn} onPress={handleParentResponded} activeOpacity={0.85}>
                <Text style={styles.respondedBtnText}>✅ Parent Has Responded</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.callNowBtn} onPress={handleCallAmbulance} activeOpacity={0.85}>
                <Text style={styles.callNowBtnText}>🚑 Call Ambulance Now (Don't Wait)</Text>
              </TouchableOpacity>
            </>
          )}

          {/* ── ESCALATED ── */}
          {medState === 'escalated' && (
            <>
              <BlurView intensity={24} tint="dark" style={styles.escalatedCard}>
                <Text style={styles.escalatedEmoji}>⚠️</Text>
                <Text style={styles.escalatedTitle}>Parent Unreachable</Text>
                <Text style={styles.escalatedSub}>3 minutes have passed with no response. You are now authorized to call emergency services on behalf of the child.</Text>
              </BlurView>

              <TouchableOpacity style={styles.ambulanceBtn} onPress={handleCallAmbulance} activeOpacity={0.85}>
                <Text style={styles.ambulanceBtnText}>🚑 Call Ambulance — 999</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.respondedBtn} onPress={handleParentResponded}>
                <Text style={styles.respondedBtnText}>✅ Parent Just Responded</Text>
              </TouchableOpacity>
            </>
          )}

          {/* ── RESOLVED ── */}
          {medState === 'resolved' && (
            <>
              <BlurView intensity={24} tint="dark" style={styles.resolvedCard}>
                <Text style={styles.resolvedEmoji}>✅</Text>
                <Text style={styles.resolvedTitle}>Situation Handled</Text>
                <Text style={styles.resolvedSub}>The incident has been logged and the parent has been kept informed throughout.</Text>
              </BlurView>

              <Text style={styles.sectionTitle}>Audit Trail</Text>
              <BlurView intensity={20} tint="dark" style={styles.auditCard}>
                {logs.map((log, i) => (
                  <View key={i} style={[styles.auditRow, i < logs.length - 1 && styles.auditDivider]}>
                    <Text style={styles.auditTime}>{log.time}</Text>
                    <Text style={styles.auditText}>{log.text}</Text>
                  </View>
                ))}
              </BlurView>

              <TouchableOpacity style={styles.homeBtn} onPress={() => router.replace('/(caregiver)/(tabs)/home' as any)}>
                <Text style={styles.homeBtnText}>Back to Home</Text>
              </TouchableOpacity>
            </>
          )}

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
  orbTop: { width: 220, height: 220, backgroundColor: '#FBBF24', top: -70, right: -50 },
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, marginBottom: 16 },
  backBtn: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8 },
  backBtnText: { color: '#BAE6FD', fontSize: 14 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#F0F9FF' },
  sosLink: { backgroundColor: 'rgba(248,113,113,0.1)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: 'rgba(248,113,113,0.25)' },
  sosLinkText: { color: '#F87171', fontSize: 12, fontWeight: '700' },
  scrollContent: { paddingHorizontal: 16 },
  heroCard: { borderRadius: 20, overflow: 'hidden', padding: 16, flexDirection: 'row', gap: 14, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(251,191,36,0.25)', alignItems: 'flex-start' },
  heroEmoji: { fontSize: 36 },
  heroText: { flex: 1 },
  heroTitle: { color: '#F0F9FF', fontWeight: '800', fontSize: 15, marginBottom: 6 },
  heroSub: { color: 'rgba(186,230,253,0.55)', fontSize: 13, lineHeight: 20 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#F0F9FF', marginBottom: 10 },
  stepsCard: { borderRadius: 20, overflow: 'hidden', padding: 16, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  stepRow: { flexDirection: 'row', gap: 12, paddingVertical: 12, alignItems: 'flex-start' },
  stepDivider: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  stepEmoji: { fontSize: 20 },
  stepText: { flex: 1 },
  stepTitle: { color: '#F0F9FF', fontWeight: '700', fontSize: 13, marginBottom: 3 },
  stepSub: { color: 'rgba(186,230,253,0.5)', fontSize: 12, lineHeight: 18 },
  childCard: { borderRadius: 18, overflow: 'hidden', padding: 14, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(56,189,248,0.2)' },
  childCardLabel: { color: 'rgba(186,230,253,0.4)', fontSize: 11, letterSpacing: 1.2, marginBottom: 6 },
  childCardName: { color: '#F0F9FF', fontWeight: '800', fontSize: 16, marginBottom: 4 },
  childCardParent: { color: 'rgba(186,230,253,0.5)', fontSize: 12 },
  notifyBtn: { backgroundColor: '#DC2626', borderRadius: 16, paddingVertical: 16, alignItems: 'center', shadowColor: '#F87171', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 14, elevation: 8 },
  notifyBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  centerContent: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  notifyingCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(251,191,36,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 24, borderWidth: 2, borderColor: 'rgba(251,191,36,0.3)' },
  notifyingEmoji: { fontSize: 50 },
  notifyingTitle: { fontSize: 22, fontWeight: '800', color: '#FBBF24', marginBottom: 8 },
  notifyingSub: { color: 'rgba(186,230,253,0.5)', fontSize: 14 },
  timerCard: { borderRadius: 24, overflow: 'hidden', padding: 24, marginBottom: 16, borderWidth: 2, alignItems: 'center' },
  timerLabel: { color: 'rgba(186,230,253,0.5)', fontSize: 12, letterSpacing: 1.2, marginBottom: 10 },
  timerValue: { fontSize: 64, fontWeight: '900', letterSpacing: -2, marginBottom: 8 },
  timerSub: { color: 'rgba(186,230,253,0.5)', fontSize: 13, marginBottom: 16 },
  timerTrack: { width: '100%', height: 6, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' },
  timerFill: { height: 6, borderRadius: 3 },
  alertsSentCard: { borderRadius: 18, overflow: 'hidden', padding: 16, marginBottom: 14, borderWidth: 1, borderColor: 'rgba(52,211,153,0.2)', gap: 8 },
  alertsSentTitle: { color: '#34D399', fontWeight: '800', fontSize: 13, marginBottom: 4 },
  alertsSentItem: { color: 'rgba(186,230,253,0.65)', fontSize: 13 },
  respondedBtn: { borderRadius: 16, paddingVertical: 14, alignItems: 'center', backgroundColor: 'rgba(52,211,153,0.1)', borderWidth: 1, borderColor: 'rgba(52,211,153,0.25)', marginBottom: 10 },
  respondedBtnText: { color: '#34D399', fontWeight: '700', fontSize: 14 },
  callNowBtn: { borderRadius: 16, paddingVertical: 14, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  callNowBtnText: { color: 'rgba(186,230,253,0.6)', fontWeight: '600', fontSize: 14 },
  escalatedCard: { borderRadius: 22, overflow: 'hidden', padding: 24, marginBottom: 20, borderWidth: 2, borderColor: 'rgba(248,113,113,0.35)', alignItems: 'center' },
  escalatedEmoji: { fontSize: 48, marginBottom: 14 },
  escalatedTitle: { color: '#F87171', fontWeight: '900', fontSize: 22, marginBottom: 10 },
  escalatedSub: { color: 'rgba(186,230,253,0.6)', fontSize: 14, textAlign: 'center', lineHeight: 22 },
  ambulanceBtn: { borderRadius: 16, paddingVertical: 16, alignItems: 'center', backgroundColor: '#DC2626', marginBottom: 10, shadowColor: '#F87171', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 14, elevation: 8 },
  ambulanceBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  resolvedCard: { borderRadius: 22, overflow: 'hidden', padding: 24, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(52,211,153,0.25)', alignItems: 'center' },
  resolvedEmoji: { fontSize: 48, marginBottom: 14 },
  resolvedTitle: { color: '#34D399', fontWeight: '900', fontSize: 22, marginBottom: 8 },
  resolvedSub: { color: 'rgba(186,230,253,0.6)', fontSize: 14, textAlign: 'center', lineHeight: 22 },
  auditCard: { borderRadius: 18, overflow: 'hidden', padding: 16, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  auditRow: { flexDirection: 'row', gap: 12, paddingVertical: 9, alignItems: 'flex-start' },
  auditDivider: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  auditTime: { color: '#38BDF8', fontSize: 11, fontWeight: '700', width: 70 },
  auditText: { flex: 1, color: 'rgba(186,230,253,0.65)', fontSize: 13 },
  homeBtn: { borderRadius: 16, paddingVertical: 14, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  homeBtnText: { color: 'rgba(186,230,253,0.6)', fontSize: 14, fontWeight: '600' },
});
