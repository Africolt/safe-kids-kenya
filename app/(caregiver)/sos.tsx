import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Vibration, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';

type SOSState = 'idle' | 'countdown' | 'active' | 'sent';

export default function CaregiverSOS() {
  const [sosState, setSOSState] = useState<SOSState>('idle');
  const [countdown, setCountdown] = useState(3);
  const [alertsSent, setAlertsSent] = useState<string[]>([]);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const pulseLoop = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (sosState === 'countdown') {
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();
      Vibration.vibrate([0, 200, 100, 200]);
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) { clearInterval(timer); triggerSOS(); return 0; }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [sosState]);

  useEffect(() => {
    if (sosState === 'active') {
      pulseLoop.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.3, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      );
      pulseLoop.current.start();
      Vibration.vibrate([0, 500, 200, 500, 200, 500]);
    } else {
      pulseLoop.current?.stop();
      pulseAnim.setValue(1);
    }
  }, [sosState]);

  const triggerSOS = () => {
    setSOSState('active');
    const alerts = [
      '📞 Calling 999...',
      '📲 Alerting parent — Jane Mwangi',
      '📲 Alerting Safe Kids team',
      '📍 Sharing your live location',
      '🔒 Session audit trail saved',
    ];
    let delay = 0;
    alerts.forEach(a => { setTimeout(() => setAlertsSent(prev => [...prev, a]), delay); delay += 800; });
    setTimeout(() => setSOSState('sent'), alerts.length * 800 + 400);
  };

  const handleCancel = () => {
    setSOSState('idle'); setCountdown(3); setAlertsSent([]);
    Vibration.cancel(); pulseLoop.current?.stop(); pulseAnim.setValue(1);
  };

  return (
    <View style={styles.root}>
      <View style={[styles.overlay, sosState === 'active' && styles.overlayActive, sosState === 'sent' && styles.overlaySent]} />
      <View style={[styles.orb, styles.orbTop]} />
      <View style={[styles.orb, styles.orbBottom]} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => sosState === 'idle' ? router.back() : handleCancel()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>{sosState === 'idle' ? '← Back' : '✕ Cancel'}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Caregiver SOS</Text>
          <TouchableOpacity style={styles.medBtn} onPress={() => router.push('/(caregiver)/medical-emergency' as any)}>
            <Text style={styles.medBtnText}>🏥 Medical</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {sosState === 'idle' && (
            <>
              <Text style={styles.idleTitle}>Emergency Alert</Text>
              <Text style={styles.idleSub}>Use if you or the child are in immediate danger. This alerts the parent and emergency services simultaneously.</Text>
              <Animated.View style={[styles.sosOuter, { transform: [{ scale: pulseAnim }, { translateX: shakeAnim }] }]}>
                <View style={styles.sosMiddle}>
                  <TouchableOpacity style={styles.sosBtn} onPress={() => { setCountdown(3); setSOSState('countdown'); }} activeOpacity={0.85}>
                    <Text style={styles.sosBtnText}>SOS</Text>
                    <Text style={styles.sosBtnSub}>Tap to activate</Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
              <BlurView intensity={20} tint="dark" style={styles.infoCard}>
                <Text style={styles.infoTitle}>This will:</Text>
                {['📞 Call 999 immediately', '📲 Alert child\'s parent instantly', '📍 Share your live location', '🛡️ Notify Safe Kids safety team', '🔒 Log a full session audit trail'].map((t, i) => (
                  <View key={i} style={styles.infoRow}><Text style={styles.infoText}>{t}</Text></View>
                ))}
              </BlurView>
              <TouchableOpacity style={styles.medEmergencyLink} onPress={() => router.push('/(caregiver)/medical-emergency' as any)}>
                <Text style={styles.medEmergencyLinkText}>🏥 Medical emergency only? Use Medical Emergency instead</Text>
              </TouchableOpacity>
            </>
          )}

          {sosState === 'countdown' && (
            <View style={styles.centerContent}>
              <Animated.View style={[styles.countdownOuter, { transform: [{ translateX: shakeAnim }] }]}>
                <View style={styles.countdownMiddle}>
                  <View style={styles.countdownInner}>
                    <Text style={styles.countdownNumber}>{countdown}</Text>
                  </View>
                </View>
              </Animated.View>
              <Text style={styles.countdownTitle}>Sending SOS in {countdown}...</Text>
              <Text style={styles.countdownSub}>Tap cancel to stop</Text>
              <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}><Text style={styles.cancelBtnText}>✕ Cancel SOS</Text></TouchableOpacity>
            </View>
          )}

          {sosState === 'active' && (
            <View style={styles.centerContent}>
              <Animated.View style={[styles.activeOuter, { transform: [{ scale: pulseAnim }] }]}>
                <View style={styles.activeMiddle}>
                  <View style={styles.activeInner}><Text style={styles.activeEmoji}>🚨</Text></View>
                </View>
              </Animated.View>
              <Text style={styles.activeTitle}>SOS ACTIVE</Text>
              <BlurView intensity={20} tint="dark" style={styles.alertsCard}>
                {alertsSent.map((a, i) => (
                  <View key={i} style={styles.alertRow}>
                    <Text style={styles.alertCheck}>✓</Text>
                    <Text style={styles.alertText}>{a}</Text>
                  </View>
                ))}
              </BlurView>
              <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}><Text style={styles.cancelBtnText}>✕ Cancel SOS</Text></TouchableOpacity>
            </View>
          )}

          {sosState === 'sent' && (
            <View style={styles.centerContent}>
              <View style={styles.sentCircle}><Text style={styles.sentEmoji}>✓</Text></View>
              <Text style={styles.sentTitle}>Alerts Sent!</Text>
              <Text style={styles.sentSub}>Parent and emergency services have been notified. Stay calm and wait for help.</Text>
              <BlurView intensity={20} tint="dark" style={styles.alertsCard}>
                {alertsSent.map((a, i) => (
                  <View key={i} style={styles.alertRow}>
                    <Text style={styles.alertCheck}>✓</Text>
                    <Text style={styles.alertText}>{a}</Text>
                  </View>
                ))}
              </BlurView>
              <TouchableOpacity style={styles.call999Btn} onPress={() => Linking.openURL('tel:999')}>
                <Text style={styles.call999BtnText}>📞 Call 999 Again</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.homeBtn} onPress={() => { handleCancel(); router.replace('/(caregiver)/(tabs)/home' as any); }}>
                <Text style={styles.homeBtnText}>Back to Home</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#080C14' },
  overlay: { position: 'absolute', width: '100%', height: '100%', backgroundColor: 'rgba(8,12,20,0.95)' },
  overlayActive: { backgroundColor: 'rgba(30,8,8,0.97)' },
  overlaySent: { backgroundColor: 'rgba(8,20,12,0.97)' },
  orb: { position: 'absolute', borderRadius: 999, opacity: 0.12 },
  orbTop: { width: 220, height: 220, backgroundColor: '#F87171', top: -80, right: -60 },
  orbBottom: { width: 180, height: 180, backgroundColor: '#F87171', bottom: 60, left: -60 },
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, marginBottom: 8 },
  backBtn: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8 },
  backBtnText: { color: '#BAE6FD', fontSize: 14 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#F0F9FF' },
  medBtn: { backgroundColor: 'rgba(251,191,36,0.12)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: 'rgba(251,191,36,0.25)' },
  medBtnText: { color: '#FBBF24', fontSize: 12, fontWeight: '700' },
  content: { flex: 1, alignItems: 'center', paddingHorizontal: 20, paddingTop: 8 },
  idleTitle: { fontSize: 26, fontWeight: '900', color: '#F0F9FF', textAlign: 'center', marginBottom: 10 },
  idleSub: { color: 'rgba(186,230,253,0.5)', fontSize: 13, textAlign: 'center', lineHeight: 21, marginBottom: 32 },
  sosOuter: { width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(248,113,113,0.08)', alignItems: 'center', justifyContent: 'center', marginBottom: 28, borderWidth: 1.5, borderColor: 'rgba(248,113,113,0.2)' },
  sosMiddle: { width: 158, height: 158, borderRadius: 79, backgroundColor: 'rgba(248,113,113,0.12)', alignItems: 'center', justifyContent: 'center' },
  sosBtn: { width: 118, height: 118, borderRadius: 59, backgroundColor: '#DC2626', alignItems: 'center', justifyContent: 'center', shadowColor: '#F87171', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.6, shadowRadius: 20, elevation: 12 },
  sosBtnText: { color: '#fff', fontSize: 28, fontWeight: '900', letterSpacing: 2 },
  sosBtnSub: { color: 'rgba(255,255,255,0.7)', fontSize: 10, marginTop: 4 },
  infoCard: { borderRadius: 20, overflow: 'hidden', padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', width: '100%', marginBottom: 14 },
  infoTitle: { color: '#F0F9FF', fontWeight: '700', fontSize: 13, marginBottom: 10 },
  infoRow: { paddingVertical: 4 },
  infoText: { color: 'rgba(186,230,253,0.65)', fontSize: 13 },
  medEmergencyLink: { paddingVertical: 10 },
  medEmergencyLinkText: { color: '#FBBF24', fontSize: 12, textAlign: 'center', lineHeight: 20 },
  centerContent: { flex: 1, alignItems: 'center', justifyContent: 'center', width: '100%' },
  countdownOuter: { width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(248,113,113,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 24, borderWidth: 2, borderColor: 'rgba(248,113,113,0.3)' },
  countdownMiddle: { width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(248,113,113,0.15)', alignItems: 'center', justifyContent: 'center' },
  countdownInner: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#DC2626', alignItems: 'center', justifyContent: 'center' },
  countdownNumber: { color: '#fff', fontSize: 52, fontWeight: '900' },
  countdownTitle: { fontSize: 22, fontWeight: '800', color: '#F87171', marginBottom: 6 },
  countdownSub: { color: 'rgba(186,230,253,0.4)', fontSize: 14, marginBottom: 28 },
  cancelBtn: { borderRadius: 16, paddingHorizontal: 32, paddingVertical: 14, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.15)', backgroundColor: 'rgba(255,255,255,0.06)' },
  cancelBtnText: { color: '#F0F9FF', fontSize: 15, fontWeight: '700' },
  activeOuter: { width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(248,113,113,0.12)', alignItems: 'center', justifyContent: 'center', marginBottom: 20, borderWidth: 2, borderColor: 'rgba(248,113,113,0.4)' },
  activeMiddle: { width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(248,113,113,0.18)', alignItems: 'center', justifyContent: 'center' },
  activeInner: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#DC2626', alignItems: 'center', justifyContent: 'center' },
  activeEmoji: { fontSize: 44 },
  activeTitle: { fontSize: 28, fontWeight: '900', color: '#F87171', letterSpacing: 2, marginBottom: 16 },
  alertsCard: { borderRadius: 18, overflow: 'hidden', padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', width: '100%', marginBottom: 18 },
  alertRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  alertCheck: { color: '#34D399', fontSize: 14, fontWeight: '800' },
  alertText: { color: 'rgba(186,230,253,0.7)', fontSize: 13 },
  sentCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(52,211,153,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 18, borderWidth: 2, borderColor: '#34D399' },
  sentEmoji: { fontSize: 44, color: '#34D399', fontWeight: '800' },
  sentTitle: { fontSize: 28, fontWeight: '900', color: '#34D399', marginBottom: 8 },
  sentSub: { color: 'rgba(186,230,253,0.6)', fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 20 },
  call999Btn: { borderRadius: 16, paddingHorizontal: 32, paddingVertical: 14, backgroundColor: '#DC2626', marginBottom: 10, width: '100%', alignItems: 'center' },
  call999BtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  homeBtn: { borderRadius: 16, paddingHorizontal: 32, paddingVertical: 14, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', width: '100%', alignItems: 'center' },
  homeBtnText: { color: 'rgba(186,230,253,0.6)', fontSize: 14, fontWeight: '600' },
});
