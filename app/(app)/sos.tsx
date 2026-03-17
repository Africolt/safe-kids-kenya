import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, Vibration, Alert, Linking, Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';

const { width, height } = Dimensions.get('window');

type SOSState = 'idle' | 'countdown' | 'active' | 'sent';

export default function SOSScreen() {
  const [sosState, setSOSState] = useState<SOSState>('idle');
  const [countdown, setCountdown] = useState(3);
  const [alertsSent, setAlertsSent] = useState<string[]>([]);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseLoop = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (sosState === 'countdown') {
      // Shake animation
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();

      Vibration.vibrate([0, 200, 100, 200]);

      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            triggerSOS();
            return 0;
          }
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
    // Simulate sending alerts
    const alerts = ['📞 Calling 999...', '📲 Alerting Mom (+254 712 000 001)', '📲 Alerting Dad (+254 712 000 002)', '📍 Sharing live location...', '🛡️ Safe Kids team notified'];
    let delay = 0;
    alerts.forEach(alert => {
      setTimeout(() => {
        setAlertsSent(prev => [...prev, alert]);
      }, delay);
      delay += 800;
    });

    setTimeout(() => {
      setSOSState('sent');
    }, alerts.length * 800 + 500);
  };

  const handleSOSPress = () => {
    if (sosState === 'idle') {
      setCountdown(3);
      setSOSState('countdown');
    }
  };

  const handleCancel = () => {
    setSOSState('idle');
    setCountdown(3);
    setAlertsSent([]);
    Vibration.cancel();
    pulseLoop.current?.stop();
    pulseAnim.setValue(1);
  };

  const handleCallDirectly = () => {
    Alert.alert('Call 999', 'Call emergency services now?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Call 999', style: 'destructive', onPress: () => Linking.openURL('tel:999') },
    ]);
  };

  return (
    <View style={styles.root}>
      <Animated.View style={[
        styles.overlay,
        sosState === 'active' && styles.overlayActive,
        sosState === 'sent' && styles.overlaySent,
      ]} />
      <View style={[styles.orb, styles.orbTop]} />
      <View style={[styles.orb, styles.orbBottom]} />

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => sosState === 'idle' ? router.back() : handleCancel()}
            style={styles.backBtn}
          >
            <Text style={styles.backBtnText}>
              {sosState === 'idle' ? '← Back' : '✕ Cancel'}
            </Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>SOS Emergency</Text>
          <View style={{ width: 80 }} />
        </View>

        <View style={styles.content}>

          {/* ── IDLE STATE ── */}
          {sosState === 'idle' && (
            <>
              <Text style={styles.idleTitle}>Emergency Alert</Text>
              <Text style={styles.idleSub}>
                Press and hold the SOS button to alert emergency services and your family contacts simultaneously
              </Text>

              {/* SOS Button */}
              <Animated.View style={[styles.sosOuterRing, { transform: [{ scale: pulseAnim }, { translateX: shakeAnim }] }]}>
                <View style={styles.sosMiddleRing}>
                  <TouchableOpacity
                    style={styles.sosBtn}
                    onPress={handleSOSPress}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.sosBtnText}>SOS</Text>
                    <Text style={styles.sosBtnSub}>Tap to activate</Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>

              {/* What happens */}
              <BlurView intensity={20} tint="dark" style={styles.infoCard}>
                <Text style={styles.infoTitle}>When you tap SOS:</Text>
                {[
                  { emoji: '📞', text: 'Calls 999 automatically' },
                  { emoji: '📲', text: 'Alerts all family emergency contacts' },
                  { emoji: '📍', text: 'Shares your live location' },
                  { emoji: '🛡️', text: 'Notifies Safe Kids Kenya team' },
                  { emoji: '📸', text: 'Begins silent audio recording' },
                ].map((item, i) => (
                  <View key={i} style={styles.infoRow}>
                    <Text style={styles.infoEmoji}>{item.emoji}</Text>
                    <Text style={styles.infoText}>{item.text}</Text>
                  </View>
                ))}
              </BlurView>

              <TouchableOpacity style={styles.callDirectBtn} onPress={handleCallDirectly}>
                <Text style={styles.callDirectText}>📞 Call 999 directly</Text>
              </TouchableOpacity>
            </>
          )}

          {/* ── COUNTDOWN STATE ── */}
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

              <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel} activeOpacity={0.85}>
                <Text style={styles.cancelBtnText}>✕ Cancel SOS</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── ACTIVE STATE ── */}
          {sosState === 'active' && (
            <View style={styles.centerContent}>
              <Animated.View style={[styles.activeOuter, { transform: [{ scale: pulseAnim }] }]}>
                <View style={styles.activeMiddle}>
                  <View style={styles.activeInner}>
                    <Text style={styles.activeEmoji}>🚨</Text>
                  </View>
                </View>
              </Animated.View>

              <Text style={styles.activeTitle}>SOS ACTIVE</Text>
              <Text style={styles.activeSub}>Sending alerts...</Text>

              <BlurView intensity={20} tint="dark" style={styles.alertsCard}>
                {alertsSent.map((alert, i) => (
                  <View key={i} style={styles.alertSentRow}>
                    <Text style={styles.alertSentCheck}>✓</Text>
                    <Text style={styles.alertSentText}>{alert}</Text>
                  </View>
                ))}
              </BlurView>

              <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
                <Text style={styles.cancelBtnText}>✕ Cancel SOS</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── SENT STATE ── */}
          {sosState === 'sent' && (
            <View style={styles.centerContent}>
              <View style={styles.sentCircle}>
                <Text style={styles.sentEmoji}>✓</Text>
              </View>
              <Text style={styles.sentTitle}>Alerts Sent!</Text>
              <Text style={styles.sentSub}>
                Emergency services and your family have been notified. Help is on the way.
              </Text>

              <BlurView intensity={20} tint="dark" style={styles.alertsCard}>
                {alertsSent.map((alert, i) => (
                  <View key={i} style={styles.alertSentRow}>
                    <Text style={styles.alertSentCheck}>✓</Text>
                    <Text style={styles.alertSentText}>{alert}</Text>
                  </View>
                ))}
              </BlurView>

              <TouchableOpacity style={styles.callDirectBtn} onPress={handleCallDirectly}>
                <Text style={styles.callDirectText}>📞 Call 999 again</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.homeBtn}
                onPress={() => { handleCancel(); router.replace('/(app)/(tabs)/home'); }}
              >
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

  content: { flex: 1, alignItems: 'center', paddingHorizontal: 20, paddingTop: 8 },

  // Idle
  idleTitle: { fontSize: 26, fontWeight: '900', color: '#F0F9FF', textAlign: 'center', marginBottom: 10 },
  idleSub: { color: 'rgba(186,230,253,0.5)', fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 36 },

  sosOuterRing: { width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(248,113,113,0.08)', alignItems: 'center', justifyContent: 'center', marginBottom: 32, borderWidth: 1.5, borderColor: 'rgba(248,113,113,0.2)' },
  sosMiddleRing: { width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(248,113,113,0.12)', alignItems: 'center', justifyContent: 'center' },
  sosBtn: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#DC2626', alignItems: 'center', justifyContent: 'center', shadowColor: '#F87171', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.6, shadowRadius: 20, elevation: 12 },
  sosBtnText: { color: '#fff', fontSize: 28, fontWeight: '900', letterSpacing: 2 },
  sosBtnSub: { color: 'rgba(255,255,255,0.7)', fontSize: 10, marginTop: 4 },

  infoCard: { borderRadius: 20, overflow: 'hidden', padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', width: '100%', marginBottom: 16 },
  infoTitle: { color: '#F0F9FF', fontWeight: '700', fontSize: 13, marginBottom: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  infoEmoji: { fontSize: 18 },
  infoText: { color: 'rgba(186,230,253,0.65)', fontSize: 13 },

  callDirectBtn: { borderRadius: 14, paddingHorizontal: 24, paddingVertical: 12, borderWidth: 1.5, borderColor: 'rgba(248,113,113,0.3)', backgroundColor: 'rgba(248,113,113,0.08)' },
  callDirectText: { color: '#F87171', fontSize: 14, fontWeight: '700' },

  // Center content
  centerContent: { flex: 1, alignItems: 'center', justifyContent: 'center', width: '100%' },

  // Countdown
  countdownOuter: { width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(248,113,113,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 28, borderWidth: 2, borderColor: 'rgba(248,113,113,0.3)' },
  countdownMiddle: { width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(248,113,113,0.15)', alignItems: 'center', justifyContent: 'center' },
  countdownInner: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#DC2626', alignItems: 'center', justifyContent: 'center' },
  countdownNumber: { color: '#fff', fontSize: 52, fontWeight: '900' },
  countdownTitle: { fontSize: 22, fontWeight: '800', color: '#F87171', marginBottom: 8 },
  countdownSub: { color: 'rgba(186,230,253,0.4)', fontSize: 14, marginBottom: 32 },

  cancelBtn: { borderRadius: 16, paddingHorizontal: 32, paddingVertical: 14, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.15)', backgroundColor: 'rgba(255,255,255,0.06)' },
  cancelBtnText: { color: '#F0F9FF', fontSize: 15, fontWeight: '700' },

  // Active
  activeOuter: { width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(248,113,113,0.12)', alignItems: 'center', justifyContent: 'center', marginBottom: 24, borderWidth: 2, borderColor: 'rgba(248,113,113,0.4)' },
  activeMiddle: { width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(248,113,113,0.18)', alignItems: 'center', justifyContent: 'center' },
  activeInner: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#DC2626', alignItems: 'center', justifyContent: 'center' },
  activeEmoji: { fontSize: 44 },
  activeTitle: { fontSize: 28, fontWeight: '900', color: '#F87171', letterSpacing: 2, marginBottom: 6 },
  activeSub: { color: 'rgba(186,230,253,0.5)', fontSize: 14, marginBottom: 20 },

  alertsCard: { borderRadius: 18, overflow: 'hidden', padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', width: '100%', marginBottom: 20 },
  alertSentRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  alertSentCheck: { color: '#34D399', fontSize: 14, fontWeight: '800' },
  alertSentText: { color: 'rgba(186,230,253,0.7)', fontSize: 15 },

  // Sent
  sentCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(52,211,153,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 20, borderWidth: 2, borderColor: '#34D399' },
  sentEmoji: { fontSize: 44, color: '#34D399', fontWeight: '800' },
  sentTitle: { fontSize: 28, fontWeight: '900', color: '#34D399', marginBottom: 8 },
  sentSub: { color: 'rgba(186,230,253,0.6)', fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 24 },

  homeBtn: { marginTop: 12, borderRadius: 16, paddingHorizontal: 32, paddingVertical: 14, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  homeBtnText: { color: 'rgba(186,230,253,0.6)', fontSize: 14, fontWeight: '600' },
});
