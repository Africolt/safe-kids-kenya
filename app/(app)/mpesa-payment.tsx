import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, Alert, Dimensions, TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { router, useLocalSearchParams } from 'expo-router';
import { db } from '../../src/firebaseconfig';
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';

const { height } = Dimensions.get('window');

type PaymentState = 'input' | 'processing' | 'success' | 'failed';

export default function MpesaPayment() {
  const { amount, caregiverId, bookingId } = useLocalSearchParams<{ 
    amount: string;
    caregiverId: string;
    bookingId: string; 
  }>();
  const totalAmount = parseInt(amount ?? '0');

  const [paymentState, setPaymentState] = useState<PaymentState>('input');
  const [phone, setPhone] = useState('');
  const [countdown, setCountdown] = useState(30);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const successAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Pulse animation for processing state
  useEffect(() => {
    if (paymentState === 'processing') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.15, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      ).start();

      // Countdown timer
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            // Simulate success after countdown
            setPaymentState('success');
            Animated.spring(successAnim, {
              toValue: 1, tension: 60, friction: 8, useNativeDriver: true
            }).start();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [paymentState]);

  const handleSendSTK = () => {
    if (!phone || phone.length < 9) {
      return Alert.alert('Invalid number', 'Please enter a valid Safaricom number');
    }
    setPaymentState('processing');
    setCountdown(30);
  };

  const handleRetry = () => {
    setPaymentState('input');
    setCountdown(30);
    pulseAnim.setValue(1);
  };

  const handleDone = async () => {
    // Update booking status to confirmed + save payment info
    if (bookingId) {
      try {
        await updateDoc(doc(db, 'bookings', bookingId), {
          status: 'confirmed',
          paymentStatus: 'paid',
          paymentPhone:`+254${phone}`,
          paymentRef: `SKK${Date.now().toString().slice(-8)}`,
          paidAt: serverTimestamp(),
        });
      } catch (e) {
        console.error('Failed to update booking:', e);
      }
    }
    router.replace(`/(app)/booking-confirmation?amount=${totalAmount}&caregiverId=${caregiverId}&bookingId=${bookingId}` as any);
  };

  const formatPhone = (text: string) => {
    const digits = text.replace(/\D/g, '');
    setPhone(digits);
  };

  const displayPhone = phone
    ? `+254 ${phone.slice(0, 3)} ${phone.slice(3, 6)} ${phone.slice(6)}`
    : '';

  return (
    <View style={styles.root}>
      <View style={styles.overlay} />
      <View style={[styles.orb, styles.orbTop]} />
      <View style={[styles.orb, styles.orbBottom]} />

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        {paymentState === 'input' && (
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Text style={styles.backBtnText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>M-Pesa Payment</Text>
            <View style={{ width: 60 }} />
          </View>
        )}

        <View style={styles.content}>

          {/* ── INPUT STATE ── */}
          {paymentState === 'input' && (
            <Animated.View style={{ opacity: fadeAnim }}>
              {/* Amount display */}
              <BlurView intensity={30} tint="dark" style={styles.amountCard}>
                <Text style={styles.amountLabel}>Amount to Pay</Text>
                <Text style={styles.amountValue}>KSh {totalAmount.toLocaleString()}</Text>
                <View style={styles.amountDivider} />
                <View style={styles.mpesaBadge}>
                  <Text style={styles.mpesaBadgeEmoji}>📱</Text>
                  <Text style={styles.mpesaBadgeText}>M-Pesa</Text>
                  <View style={styles.mpesaSecure}>
                    <Text style={styles.mpesaSecureText}>🔒 Secure</Text>
                  </View>
                </View>
              </BlurView>

              {/* Phone input */}
              <BlurView intensity={25} tint="dark" style={styles.card}>
                <Text style={styles.cardTitle}>Safaricom Number</Text>
                <Text style={styles.cardSub}>Enter the M-Pesa registered number</Text>

                <View style={styles.phoneInputRow}>
                  <View style={styles.countryCode}>
                    <Text style={styles.countryCodeText}>🇰🇪 +254</Text>
                  </View>
                  <TextInput
                    style={styles.phoneInput}
                    placeholder="712 345 678"
                    placeholderTextColor="rgba(186,230,253,0.3)"
                    value={phone}
                    onChangeText={formatPhone}
                    keyboardType="phone-pad"
                    maxLength={9}
                  />
                </View>

                <Text style={styles.phoneHint}>
                  💡 An STK push will be sent to this number
                </Text>

                {/* Network logos */}
                <View style={styles.networksRow}>
                  {['Safaricom', 'M-Pesa'].map((n, i) => (
                    <View key={i} style={[styles.networkChip, i === 0 && styles.networkChipActive]}>
                      <Text style={styles.networkChipText}>{n}</Text>
                    </View>
                  ))}
                </View>
              </BlurView>

              {/* How it works */}
              <BlurView intensity={20} tint="dark" style={styles.howItWorks}>
                <Text style={styles.howTitle}>How it works</Text>
                {[
                  { step: '1', text: 'Enter your Safaricom number above' },
                  { step: '2', text: 'Tap "Send Payment Request"' },
                  { step: '3', text: 'Check your phone for M-Pesa prompt' },
                  { step: '4', text: 'Enter your M-Pesa PIN to confirm' },
                ].map((item) => (
                  <View key={item.step} style={styles.howRow}>
                    <View style={styles.howDot}>
                      <Text style={styles.howDotText}>{item.step}</Text>
                    </View>
                    <Text style={styles.howText}>{item.text}</Text>
                  </View>
                ))}
              </BlurView>
            </Animated.View>
          )}

          {/* ── PROCESSING STATE ── */}
          {paymentState === 'processing' && (
            <View style={styles.centerContent}>
              <Animated.View style={[styles.pulseOuter, { transform: [{ scale: pulseAnim }] }]}>
                <View style={styles.pulseMiddle}>
                  <View style={styles.pulseInner}>
                    <Text style={styles.pulseEmoji}>📱</Text>
                  </View>
                </View>
              </Animated.View>

              <Text style={styles.processingTitle}>Waiting for Payment</Text>
              <Text style={styles.processingPhone}>
                STK push sent to{'\n'}+254 {phone.slice(0, 3)} *** {phone.slice(6)}
              </Text>

              {/* Countdown */}
              <BlurView intensity={25} tint="dark" style={styles.countdownCard}>
                <Text style={styles.countdownLabel}>Expires in</Text>
                <Text style={styles.countdownValue}>{countdown}s</Text>
                <View style={styles.countdownBar}>
                  <View style={[styles.countdownFill, { width: `${(countdown / 30) * 100}%` }]} />
                </View>
              </BlurView>

              <Text style={styles.processingHint}>
                Open M-Pesa on your phone and enter your PIN to complete payment
              </Text>

              <TouchableOpacity style={styles.cancelBtn} onPress={handleRetry}>
                <Text style={styles.cancelBtnText}>Cancel & Retry</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── SUCCESS STATE ── */}
          {paymentState === 'success' && (
            <Animated.View style={[styles.centerContent, {
              opacity: successAnim,
              transform: [{ scale: successAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) }]
            }]}>
              <View style={styles.successCircle}>
                <Text style={styles.successEmoji}>✓</Text>
              </View>

              <Text style={styles.successTitle}>Payment Successful!</Text>
              <Text style={styles.successSub}>Your booking has been confirmed</Text>

              <BlurView intensity={25} tint="dark" style={styles.receiptCard}>
                <Text style={styles.receiptTitle}>Receipt</Text>
                {[
                  { label: 'Amount Paid', value: `KSh ${totalAmount.toLocaleString()}` },
                  { label: 'Transaction ID', value: `SKK${Date.now().toString().slice(-8)}` },
                  { label: 'Phone', value: `+254 ${phone.slice(0, 3)}***${phone.slice(6)}` },
                  { label: 'Status', value: '✓ Confirmed' },
                ].map((item, i) => (
                  <View key={i} style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>{item.label}</Text>
                    <Text style={[styles.receiptValue, item.label === 'Status' && { color: '#34D399' }]}>
                      {item.value}
                    </Text>
                  </View>
                ))}
              </BlurView>

              <TouchableOpacity style={styles.doneBtn} onPress={handleDone} activeOpacity={0.85}>
                <Text style={styles.doneBtnText}>View Booking →</Text>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* ── FAILED STATE ── */}
          {paymentState === 'failed' && (
            <View style={styles.centerContent}>
              <View style={styles.failedCircle}>
                <Text style={styles.failedEmoji}>✕</Text>
              </View>
              <Text style={styles.failedTitle}>Payment Failed</Text>
              <Text style={styles.failedSub}>The payment request was not completed</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={handleRetry} activeOpacity={0.85}>
                <Text style={styles.retryBtnText}>Try Again →</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.back()}>
                <Text style={styles.goBackText}>Go back</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Bottom CTA — only on input state */}
        {paymentState === 'input' && (
          <BlurView intensity={40} tint="dark" style={styles.bottomBar}>
            <TouchableOpacity
              style={[styles.payBtn, (!phone || phone.length < 9) && styles.payBtnDisabled]}
              onPress={handleSendSTK}
              disabled={!phone || phone.length < 9}
              activeOpacity={0.85}
            >
              <Text style={styles.payBtnText}>Send Payment Request — KSh {totalAmount}</Text>
            </TouchableOpacity>
          </BlurView>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#080C14' },
  overlay: { position: 'absolute', width: '100%', height: '100%', backgroundColor: 'rgba(8,12,20,0.95)' },
  orb: { position: 'absolute', borderRadius: 999, opacity: 0.1 },
  orbTop: { width: 200, height: 200, backgroundColor: '#34D399', top: -60, right: -60 },
  orbBottom: { width: 160, height: 160, backgroundColor: '#0284C7', bottom: 100, left: -40 },
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, marginBottom: 16 },
  backBtn: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8 },
  backBtnText: { color: '#BAE6FD', fontSize: 14 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#F0F9FF' },
  content: { flex: 1, paddingHorizontal: 16 },

  // Amount card
  amountCard: { borderRadius: 24, overflow: 'hidden', padding: 24, alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: 'rgba(52,211,153,0.2)' },
  amountLabel: { color: 'rgba(186,230,253,0.5)', fontSize: 13, marginBottom: 8 },
  amountValue: { fontSize: 40, fontWeight: '900', color: '#F0F9FF', letterSpacing: -1, marginBottom: 16 },
  amountDivider: { width: '100%', height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginBottom: 16 },
  mpesaBadge: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  mpesaBadgeEmoji: { fontSize: 20 },
  mpesaBadgeText: { color: '#34D399', fontWeight: '700', fontSize: 14 },
  mpesaSecure: { backgroundColor: 'rgba(52,211,153,0.1)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  mpesaSecureText: { color: '#34D399', fontSize: 11 },

  // Card
  card: { borderRadius: 24, overflow: 'hidden', marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', padding: 20 },
  cardTitle: { fontSize: 18, fontWeight: '800', color: '#F0F9FF', marginBottom: 4 },
  cardSub: { color: 'rgba(186,230,253,0.5)', fontSize: 13, marginBottom: 20 },

  // Phone input
  phoneInputRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  countryCode: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 14, height: 52, justifyContent: 'center' },
  countryCodeText: { color: '#BAE6FD', fontSize: 14, fontWeight: '600' },
  phoneInput: { flex: 1, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, borderWidth: 1.5, borderColor: 'rgba(56,189,248,0.3)', paddingHorizontal: 16, height: 52, color: '#F0F9FF', fontSize: 18, fontWeight: '600', letterSpacing: 1 },
  phoneHint: { color: 'rgba(186,230,253,0.4)', fontSize: 12, marginBottom: 16 },
  networksRow: { flexDirection: 'row', gap: 8 },
  networkChip: { borderRadius: 10, paddingHorizontal: 14, paddingVertical: 7, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  networkChipActive: { borderColor: '#34D399', backgroundColor: 'rgba(52,211,153,0.1)' },
  networkChipText: { color: '#BAE6FD', fontSize: 12, fontWeight: '600' },

  // How it works
  howItWorks: { borderRadius: 20, overflow: 'hidden', padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', marginBottom: 100 },
  howTitle: { color: '#F0F9FF', fontWeight: '700', fontSize: 14, marginBottom: 12 },
  howRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  howDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(56,189,248,0.15)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(56,189,248,0.3)' },
  howDotText: { color: '#38BDF8', fontSize: 11, fontWeight: '700' },
  howText: { color: 'rgba(186,230,253,0.6)', fontSize: 13, flex: 1 },

  // Processing
  centerContent: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  pulseOuter: { width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(52,211,153,0.08)', alignItems: 'center', justifyContent: 'center', marginBottom: 32 },
  pulseMiddle: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(52,211,153,0.12)', alignItems: 'center', justifyContent: 'center' },
  pulseInner: { width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(52,211,153,0.2)', alignItems: 'center', justifyContent: 'center' },
  pulseEmoji: { fontSize: 32 },
  processingTitle: { fontSize: 24, fontWeight: '800', color: '#F0F9FF', marginBottom: 8 },
  processingPhone: { color: 'rgba(186,230,253,0.5)', fontSize: 14, textAlign: 'center', marginBottom: 24, lineHeight: 22 },
  countdownCard: { borderRadius: 20, overflow: 'hidden', padding: 20, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', width: '100%', marginBottom: 20 },
  countdownLabel: { color: 'rgba(186,230,253,0.5)', fontSize: 12, marginBottom: 8 },
  countdownValue: { fontSize: 36, fontWeight: '900', color: '#38BDF8', marginBottom: 12 },
  countdownBar: { width: '100%', height: 4, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' },
  countdownFill: { height: '100%', backgroundColor: '#38BDF8', borderRadius: 2 },
  processingHint: { color: 'rgba(186,230,253,0.4)', fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  cancelBtn: { borderRadius: 14, paddingHorizontal: 24, paddingVertical: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  cancelBtnText: { color: 'rgba(186,230,253,0.5)', fontSize: 14 },

  // Success
  successCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(52,211,153,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 24, borderWidth: 2, borderColor: '#34D399' },
  successEmoji: { fontSize: 44, color: '#34D399', fontWeight: '800' },
  successTitle: { fontSize: 28, fontWeight: '900', color: '#F0F9FF', marginBottom: 8 },
  successSub: { color: 'rgba(186,230,253,0.5)', fontSize: 15, marginBottom: 28 },
  receiptCard: { borderRadius: 20, overflow: 'hidden', padding: 16, borderWidth: 1, borderColor: 'rgba(52,211,153,0.2)', width: '100%', marginBottom: 28 },
  receiptTitle: { color: '#F0F9FF', fontWeight: '700', fontSize: 14, marginBottom: 12 },
  receiptRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  receiptLabel: { color: 'rgba(186,230,253,0.5)', fontSize: 13 },
  receiptValue: { color: '#F0F9FF', fontSize: 13, fontWeight: '600' },
  doneBtn: { backgroundColor: '#0284C7', borderRadius: 16, paddingHorizontal: 32, paddingVertical: 16, shadowColor: '#0284C7', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
  doneBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  // Failed
  failedCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(239,68,68,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 24, borderWidth: 2, borderColor: '#EF4444' },
  failedEmoji: { fontSize: 44, color: '#EF4444', fontWeight: '800' },
  failedTitle: { fontSize: 28, fontWeight: '900', color: '#F0F9FF', marginBottom: 8 },
  failedSub: { color: 'rgba(186,230,253,0.5)', fontSize: 15, marginBottom: 28 },
  retryBtn: { backgroundColor: '#0284C7', borderRadius: 16, paddingHorizontal: 32, paddingVertical: 16, marginBottom: 16 },
  retryBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  goBackText: { color: 'rgba(186,230,253,0.4)', fontSize: 14 },

  // Bottom bar
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, overflow: 'hidden', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)', padding: 16, paddingBottom: 28 },
  payBtn: { backgroundColor: '#0284C7', borderRadius: 16, paddingVertical: 16, alignItems: 'center', shadowColor: '#0284C7', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
  payBtnDisabled: { backgroundColor: 'rgba(255,255,255,0.08)', shadowOpacity: 0 },
  payBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
