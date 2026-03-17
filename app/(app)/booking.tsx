import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Alert, Dimensions,
  TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { router, useLocalSearchParams } from 'expo-router';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../src/firebaseconfig';

const { width } = Dimensions.get('window');

const SERVICES = [
  { id: 'afterschool', label: 'After School Care', emoji: '🏠', rate: 350, desc: '3:00 PM – 6:00 PM pickup & care' },
  { id: 'pickup', label: 'School Pickup', emoji: '🚌', rate: 350, desc: 'Collect from school gate' },
  { id: 'fullday', label: 'Full Day Care', emoji: '☀️', rate: 350, desc: '8:00 AM – 5:00 PM full supervision' },
  { id: 'tutoring', label: 'Tutoring', emoji: '📚', rate: 350, desc: 'Academic support & homework help' },
  { id: 'overnight', label: 'Overnight Care', emoji: '🌙', rate: 500, desc: 'Evening through morning' },
  { id: 'special', label: 'Special Needs Care', emoji: '💙', rate: 500, desc: 'Specialist care & support' },
];

const DURATIONS = [1, 1.5, 2, 3, 4, 5, 6, 8];

const DATES = Array.from({ length: 14 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() + i + 1);
  return {
    label: d.toLocaleDateString('en-KE', { weekday: 'short', day: 'numeric', month: 'short' }),
    value: d.toISOString().split('T')[0],
    day: d.toLocaleDateString('en-KE', { weekday: 'short' }),
    date: d.getDate().toString(),
  };
});

const TIME_SLOTS = ['7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '3:30 PM', '4:00 PM', '5:00 PM'];

const PLATFORM_FEE = 50;

type Step = 'service' | 'schedule' | 'details' | 'payment';

export default function Booking() {
  const { id: caregiverId, name: caregiverName } = useLocalSearchParams<{ id: string; name?: string }>();

  const [step, setStep] = useState<Step>('service');
  const [selectedService, setSelectedService] = useState<typeof SERVICES[0] | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<number>(3);
  const [selectedDate, setSelectedDate] = useState<typeof DATES[0] | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [recurring, setRecurring] = useState(false);
  const [pickupPoint, setPickupPoint] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const steps: Step[] = ['service', 'schedule', 'details', 'payment'];
  const stepIndex = steps.indexOf(step);

  const total = selectedService
    ? Math.round(selectedService.rate * selectedDuration) + PLATFORM_FEE
    : PLATFORM_FEE;

  const handleNext = () => {
    if (step === 'service' && !selectedService) return Alert.alert('Select a service', 'Please choose a service type');
    if (step === 'schedule' && (!selectedDate || !selectedTime)) return Alert.alert('Select date & time', 'Please choose a date and time slot');
    const next = steps[stepIndex + 1];
    if (next) setStep(next);
  };

  const handleProceedToPayment = async () => {
    if (!selectedService || !selectedDate || !selectedTime) return;
    setSaving(true);
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) throw new Error('Not authenticated');

      // Save booking to Firestore
      const bookingRef = await addDoc(collection(db, 'bookings'), {
        parentId: uid,
        caregiverId: caregiverId ?? null,
        caregiverName: caregiverName ?? 'Caregiver',
        service: selectedService.label,
        serviceId: selectedService.id,
        date: selectedDate.value,
        dateLabel: selectedDate.label,
        time: selectedTime,
        duration: selectedDuration,
        amount: total - PLATFORM_FEE,
        platformFee: PLATFORM_FEE,
        total,
        pickupPoint,
        notes,
        recurring,
        status: 'pending',
        createdAt: serverTimestamp(),
      });

      // Route to M-Pesa with booking reference
      router.push(`/(app)/mpesa-payment?amount=${total}&caregiverId=${caregiverId}&bookingId=${bookingRef.id}` as any);
    } catch (e) {
      Alert.alert('Error', 'Could not save booking. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.overlay} />
      <View style={[styles.orb, styles.orbTop]} />
      <SafeAreaView style={styles.safeArea}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => stepIndex === 0 ? router.back() : setStep(steps[stepIndex - 1])}
            style={styles.backBtn}
          >
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Book Session</Text>
          <Text style={styles.headerStep}>{stepIndex + 1}/4</Text>
        </View>

        {/* Progress bar */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${((stepIndex + 1) / 4) * 100}%` }]} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* ── STEP 1: SERVICE ── */}
          {step === 'service' && (
            <>
              <Text style={styles.stepTitle}>Choose a Service</Text>
              <Text style={styles.stepSub}>Booking with {caregiverName ?? 'your caregiver'}</Text>
              {SERVICES.map(s => (
                <TouchableOpacity
                  key={s.id}
                  onPress={() => setSelectedService(s)}
                  activeOpacity={0.85}
                >
                  <BlurView intensity={20} tint="dark" style={[styles.serviceCard, selectedService?.id === s.id && styles.serviceCardActive]}>
                    <Text style={styles.serviceEmoji}>{s.emoji}</Text>
                    <View style={styles.serviceInfo}>
                      <Text style={[styles.serviceLabel, selectedService?.id === s.id && styles.serviceLabelActive]}>{s.label}</Text>
                      <Text style={styles.serviceDesc}>{s.desc}</Text>
                      <Text style={[styles.serviceRate, selectedService?.id === s.id && { color: '#34D399' }]}>KSh {s.rate}/hr</Text>
                    </View>
                    {selectedService?.id === s.id && (
                      <View style={styles.serviceCheck}><Text style={styles.serviceCheckText}>✓</Text></View>
                    )}
                  </BlurView>
                </TouchableOpacity>
              ))}

              {selectedService && (
                <BlurView intensity={20} tint="dark" style={styles.durationCard}>
                  <Text style={styles.durationTitle}>Duration</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.durationRow}>
                    {DURATIONS.map(d => (
                      <TouchableOpacity
                        key={d}
                        style={[styles.durationChip, selectedDuration === d && styles.durationChipActive]}
                        onPress={() => setSelectedDuration(d)}
                      >
                        <Text style={[styles.durationChipText, selectedDuration === d && styles.durationChipTextActive]}>{d}hr</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  <View style={styles.costRow}>
                    <Text style={styles.costLabel}>Estimated cost</Text>
                    <Text style={styles.costValue}>KSh {Math.round(selectedService.rate * selectedDuration).toLocaleString()}</Text>
                  </View>
                </BlurView>
              )}
            </>
          )}

          {/* ── STEP 2: SCHEDULE ── */}
          {step === 'schedule' && (
            <>
              <Text style={styles.stepTitle}>Choose Date & Time</Text>
              <Text style={styles.stepSub}>Select when you need care</Text>

              <Text style={styles.subLabel}>DATE</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateRow}>
                {DATES.map(d => (
                  <TouchableOpacity
                    key={d.value}
                    style={[styles.dateChip, selectedDate?.value === d.value && styles.dateChipActive]}
                    onPress={() => setSelectedDate(d)}
                  >
                    <Text style={[styles.dateDay, selectedDate?.value === d.value && styles.dateDayActive]}>{d.day}</Text>
                    <Text style={[styles.dateNum, selectedDate?.value === d.value && styles.dateNumActive]}>{d.date}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.subLabel}>TIME SLOT</Text>
              <View style={styles.timeSlotsGrid}>
                {TIME_SLOTS.map(t => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.timeSlot, selectedTime === t && styles.timeSlotActive]}
                    onPress={() => setSelectedTime(t)}
                  >
                    <Text style={[styles.timeSlotText, selectedTime === t && styles.timeSlotTextActive]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <BlurView intensity={20} tint="dark" style={styles.recurringCard}>
                <View style={styles.recurringRow}>
                  <View>
                    <Text style={styles.recurringTitle}>Recurring weekly</Text>
                    <Text style={styles.recurringSub}>Book same slot every week</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.toggle, recurring && styles.toggleOn]}
                    onPress={() => setRecurring(!recurring)}
                  >
                    <View style={[styles.toggleThumb, recurring && styles.toggleThumbOn]} />
                  </TouchableOpacity>
                </View>
              </BlurView>
            </>
          )}

          {/* ── STEP 3: DETAILS ── */}
          {step === 'details' && (
            <>
              <Text style={styles.stepTitle}>Session Details</Text>
              <Text style={styles.stepSub}>Help your caregiver prepare</Text>

              <BlurView intensity={20} tint="dark" style={styles.formCard}>
                <Text style={styles.subLabel}>PICKUP POINT</Text>
                <View style={styles.inputRow}>
                  <Text style={styles.inputIcon}>📍</Text>
                  <TextInput
                    style={styles.input}
                    value={pickupPoint}
                    onChangeText={setPickupPoint}
                    placeholder="e.g. Westlands Primary School gate"
                    placeholderTextColor="rgba(186,230,253,0.3)"
                  />
                </View>
          
                <Text style={styles.subLabel}>NOTES FOR CAREGIVER</Text>
                <View style={[styles.inputRow, styles.textArea]}>
                  <TextInput
                    style={[styles.input, { height: 80 }]}
                    value={notes}
                    onChangeText={setNotes}
                    placeholder='Allergies, routines, special instructions...'
                    placeholderTextColor='rgba(186,230,253,0.3)'
                    multiline={true}
                    textAlignVertical='top'
                  />
                </View>
              </BlurView>

              {/* Booking summary */}
              <Text style={styles.subLabel}>BOOKING SUMMARY</Text>
              <BlurView intensity={20} tint="dark" style={styles.summaryCard}>
                {[
                  { label: 'Service', value: selectedService?.label ?? '' },
                  { label: 'Date', value: selectedDate?.label ?? '' },
                  { label: 'Time', value: selectedTime ?? '' },
                  { label: 'Duration', value: `${selectedDuration} hours` },
                  { label: 'Recurring', value: recurring ? 'Yes — Weekly' : 'No' },
                  { label: 'Caregiver', value: caregiverName ?? 'Selected caregiver' },
                ].map((row, i) => (
                  <View key={i} style={[styles.summaryRow, i < 5 && styles.summaryDivider]}>
                    <Text style={styles.summaryLabel}>{row.label}</Text>
                    <Text style={styles.summaryValue}>{row.value}</Text>
                  </View>
                ))}
              </BlurView>
            </>
          )}

          {/* ── STEP 4: PAYMENT ── */}
          {step === 'payment' && (
            <>
              <Text style={styles.stepTitle}>Payment</Text>
              <Text style={styles.stepSub}>Review and pay via M-Pesa</Text>

              <BlurView intensity={24} tint="dark" style={styles.paymentCard}>
                <View style={styles.mpesaHeader}>
                  <Text style={styles.mpesaEmoji}>📱</Text>
                  <View>
                    <Text style={styles.mpesaTitle}>M-Pesa Payment</Text>
                    <Text style={styles.mpesaSub}>STK push to your phone</Text>
                  </View>
                </View>

                <View style={styles.payBreakdown}>
                  {[
                    { label: 'Session Fee', value: `KSh ${(total - PLATFORM_FEE).toLocaleString()}` },
                    { label: 'Platform Fee', value: `KSh ${PLATFORM_FEE}` },
                  ].map((row, i) => (
                    <View key={i} style={[styles.payRow, styles.payDivider]}>
                      <Text style={styles.payLabel}>{row.label}</Text>
                      <Text style={[styles.payValue, i === 1 && { color: '#F87171' }]}>{row.value}</Text>
                    </View>
                  ))}
                  <View style={styles.payRow}>
                    <Text style={styles.payTotal}>Total</Text>
                    <Text style={styles.payTotalValue}>KSh {total.toLocaleString()}</Text>
                  </View>
                </View>
              </BlurView>

              <BlurView intensity={18} tint="dark" style={styles.infoBox}>
                <Text style={styles.infoText}>
                  💡 You will receive an M-Pesa STK push on your registered number. Enter your PIN to complete payment. The caregiver is notified only after payment is confirmed.
                </Text>
              </BlurView>
            </>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Bottom CTA */}
        <BlurView intensity={40} tint="dark" style={styles.bottomBar}>
          {step !== 'payment' ? (
            <TouchableOpacity style={styles.nextBtn} onPress={handleNext} activeOpacity={0.85}>
              <Text style={styles.nextBtnText}>Continue →</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.payBtn, saving && styles.payBtnLoading]}
              onPress={handleProceedToPayment}
              disabled={saving}
              activeOpacity={0.85}
            >
              <Text style={styles.payBtnText}>
                {saving ? 'Saving...' : `Pay KSh ${total.toLocaleString()} via M-Pesa →`}
              </Text>
            </TouchableOpacity>
          )}
        </BlurView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#080C14' },
  overlay: { position: 'absolute', width: '100%', height: '100%', backgroundColor: 'rgba(8,12,20,0.95)' },
  orb: { position: 'absolute', borderRadius: 999, opacity: 0.1 },
  orbTop: { width: 200, height: 200, backgroundColor: '#0284C7', top: -60, right: -40 },
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, marginBottom: 8 },
  backBtn: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8 },
  backBtnText: { color: '#BAE6FD', fontSize: 14 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: '#F0F9FF', textAlign: 'center' },
  headerStep: { color: 'rgba(186,230,253,0.4)', fontSize: 13 },
  progressTrack: { height: 3, backgroundColor: 'rgba(255,255,255,0.06)', marginHorizontal: 16, marginBottom: 16, borderRadius: 2 },
  progressFill: { height: 3, backgroundColor: '#0284C7', borderRadius: 2 },
  scrollContent: { paddingHorizontal: 16 },
  stepTitle: { fontSize: 22, fontWeight: '900', color: '#F0F9FF', marginBottom: 4 },
  stepSub: { color: 'rgba(186,230,253,0.5)', fontSize: 13, marginBottom: 20 },
  subLabel: { color: 'rgba(186,230,253,0.5)', fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 10 },
  serviceCard: { borderRadius: 18, overflow: 'hidden', padding: 16, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', flexDirection: 'row', alignItems: 'center', gap: 14 },
  serviceCardActive: { borderColor: '#0284C7', backgroundColor: 'rgba(2,132,199,0.08)' },
  serviceEmoji: { fontSize: 28 },
  serviceInfo: { flex: 1 },
  serviceLabel: { color: 'rgba(186,230,253,0.7)', fontWeight: '700', fontSize: 14 },
  serviceLabelActive: { color: '#F0F9FF' },
  serviceDesc: { color: 'rgba(186,230,253,0.4)', fontSize: 12, marginTop: 2 },
  serviceRate: { color: 'rgba(186,230,253,0.5)', fontSize: 12, fontWeight: '600', marginTop: 4 },
  serviceCheck: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#0284C7', alignItems: 'center', justifyContent: 'center' },
  serviceCheckText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  durationCard: { borderRadius: 18, overflow: 'hidden', padding: 16, marginTop: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  durationTitle: { color: '#F0F9FF', fontWeight: '700', fontSize: 14, marginBottom: 12 },
  durationRow: { gap: 8, paddingBottom: 12 },
  durationChip: { borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.08)' },
  durationChipActive: { borderColor: '#0284C7', backgroundColor: 'rgba(2,132,199,0.12)' },
  durationChipText: { color: 'rgba(186,230,253,0.5)', fontSize: 13, fontWeight: '600' },
  durationChipTextActive: { color: '#38BDF8' },
  costRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' },
  costLabel: { color: 'rgba(186,230,253,0.5)', fontSize: 13 },
  costValue: { color: '#34D399', fontWeight: '800', fontSize: 18 },
  dateRow: { gap: 8, paddingBottom: 16 },
  dateChip: { borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.08)', alignItems: 'center', minWidth: 56 },
  dateChipActive: { borderColor: '#0284C7', backgroundColor: 'rgba(2,132,199,0.12)' },
  dateDay: { color: 'rgba(186,230,253,0.4)', fontSize: 11, fontWeight: '600' },
  dateDayActive: { color: '#38BDF8' },
  dateNum: { color: '#F0F9FF', fontSize: 18, fontWeight: '900', marginTop: 2 },
  dateNumActive: { color: '#38BDF8' },
  timeSlotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  timeSlot: { borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.08)' },
  timeSlotActive: { borderColor: '#0284C7', backgroundColor: 'rgba(2,132,199,0.12)' },
  timeSlotText: { color: 'rgba(186,230,253,0.5)', fontSize: 12, fontWeight: '600' },
  timeSlotTextActive: { color: '#38BDF8' },
  recurringCard: { borderRadius: 16, overflow: 'hidden', padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  recurringRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  recurringTitle: { color: '#F0F9FF', fontWeight: '700', fontSize: 14 },
  recurringSub: { color: 'rgba(186,230,253,0.4)', fontSize: 12, marginTop: 2 },
  toggle: { width: 44, height: 24, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', paddingHorizontal: 2 },
  toggleOn: { backgroundColor: '#0284C7' },
  toggleThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(186,230,253,0.4)' },
  toggleThumbOn: { backgroundColor: '#fff', alignSelf: 'flex-end' },
  formCard: { borderRadius: 20, overflow: 'hidden', padding: 16, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 13, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 14, minHeight: 50, marginBottom: 16 },
  textArea: { minHeight: 100, alignItems: 'flex-start', paddingTop: 12 },
  inputIcon: { fontSize: 16, marginRight: 10 },
  input: { flex: 1, color: '#F0F9FF', fontSize: 14 },
  inputPlaceholder: { color: 'rgba(186,230,253,0.3)' },
  summaryCard: { borderRadius: 20, overflow: 'hidden', padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 },
  summaryDivider: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  summaryLabel: { color: 'rgba(186,230,253,0.5)', fontSize: 13 },
  summaryValue: { color: '#F0F9FF', fontSize: 13, fontWeight: '600' },
  paymentCard: { borderRadius: 22, overflow: 'hidden', padding: 20, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(2,132,199,0.25)' },
  mpesaHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20 },
  mpesaEmoji: { fontSize: 36 },
  mpesaTitle: { color: '#F0F9FF', fontWeight: '800', fontSize: 16 },
  mpesaSub: { color: 'rgba(186,230,253,0.4)', fontSize: 12, marginTop: 3 },
  payBreakdown: { gap: 0 },
  payRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 },
  payDivider: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  payLabel: { color: 'rgba(186,230,253,0.5)', fontSize: 13 },
  payValue: { color: '#F0F9FF', fontSize: 13, fontWeight: '600' },
  payTotal: { color: '#F0F9FF', fontWeight: '800', fontSize: 16 },
  payTotalValue: { color: '#34D399', fontWeight: '900', fontSize: 22 },
  infoBox: { borderRadius: 16, overflow: 'hidden', padding: 14, borderWidth: 1, borderColor: 'rgba(56,189,248,0.15)' },
  infoText: { color: 'rgba(186,230,253,0.6)', fontSize: 13, lineHeight: 20 },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, overflow: 'hidden', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)', padding: 16, paddingBottom: 28 },
  nextBtn: { backgroundColor: '#0284C7', borderRadius: 16, paddingVertical: 16, alignItems: 'center', shadowColor: '#0284C7', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 8 },
  nextBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  payBtn: { backgroundColor: '#34D399', borderRadius: 16, paddingVertical: 16, alignItems: 'center', shadowColor: '#34D399', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 8 },
  payBtnLoading: { opacity: 0.7 },
  payBtnText: { color: '#080C14', fontWeight: '800', fontSize: 15 },
});
