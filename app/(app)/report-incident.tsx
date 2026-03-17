import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, TextInput, Alert, Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');

const INCIDENT_TYPES = [
  { id: 'abuse', label: 'Child Abuse', emoji: '🚨', color: '#F87171', severity: 'high' },
  { id: 'neglect', label: 'Neglect', emoji: '⚠️', color: '#FBBF24', severity: 'high' },
  { id: 'caregiver', label: 'Caregiver Misconduct', emoji: '👤', color: '#F87171', severity: 'high' },
  { id: 'missing', label: 'Missing Child', emoji: '🔍', color: '#F87171', severity: 'critical' },
  { id: 'injury', label: 'Injury / Accident', emoji: '🏥', color: '#FBBF24', severity: 'medium' },
  { id: 'suspicious', label: 'Suspicious Activity', emoji: '👁️', color: '#FBBF24', severity: 'medium' },
  { id: 'bullying', label: 'Bullying', emoji: '😔', color: '#38BDF8', severity: 'medium' },
  { id: 'other', label: 'Other Concern', emoji: '📋', color: '#A78BFA', severity: 'low' },
];

const LOCATIONS = [
  'At Home', 'At School', 'In Transit', 'At Caregiver\'s Location', 'Public Place', 'Online', 'Other'
];

type Step = 'type' | 'details' | 'review' | 'submitted';

export default function ReportIncident() {
  const [step, setStep] = useState<Step>('type');
  const [incidentType, setIncidentType] = useState<string | null>(null);
  const [location, setLocation] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [childName, setChildName] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isUrgent, setIsUrgent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const selectedType = INCIDENT_TYPES.find(t => t.id === incidentType);
  const isCritical = selectedType?.severity === 'critical' || selectedType?.severity === 'high';

  const handleNext = () => {
    if (step === 'type') {
      if (!incidentType) return Alert.alert('Select type', 'Please select the type of incident');
      setStep('details');
    } else if (step === 'details') {
      if (!description || description.length < 20) {
        return Alert.alert('More detail needed', 'Please describe the incident in at least 20 characters');
      }
      setStep('review');
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    // Simulate submission
    setTimeout(() => {
      setSubmitting(false);
      setStep('submitted');
    }, 2000);
  };

  const handleEmergency = () => {
    Alert.alert(
      '🚨 Emergency',
      'This will call emergency services immediately. Proceed?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call 999', style: 'destructive', onPress: () => {} },
      ]
    );
  };

  return (
    <View style={styles.root}>
      <View style={styles.overlay} />
      <View style={[styles.orb, styles.orbTop]} />
      <View style={[styles.orb, styles.orbBottom]} />

      <SafeAreaView style={styles.safeArea}>
        {step !== 'submitted' && (
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => {
                if (step === 'type') router.back();
                else if (step === 'details') setStep('type');
                else if (step === 'review') setStep('details');
              }}
              style={styles.backBtn}
            >
              <Text style={styles.backBtnText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Report Incident</Text>
            <TouchableOpacity onPress={handleEmergency} style={styles.emergencyBtn}>
              <Text style={styles.emergencyBtnText}>🚨 SOS</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Progress */}
        {step !== 'submitted' && (
          <View style={styles.progressRow}>
            {(['type', 'details', 'review'] as Step[]).map((s, i) => (
              <View key={s} style={styles.progressItem}>
                <View style={[
                  styles.progressDot,
                  (step === s || (i < ['type','details','review'].indexOf(step))) && styles.progressDotActive,
                  i < ['type','details','review'].indexOf(step) && styles.progressDotDone,
                ]}>
                  <Text style={styles.progressDotText}>
                    {i < ['type','details','review'].indexOf(step) ? '✓' : `${i + 1}`}
                  </Text>
                </View>
                {i < 2 && <View style={[styles.progressLine, i < ['type','details','review'].indexOf(step) && styles.progressLineDone]} />}
              </View>
            ))}
          </View>
        )}

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── STEP 1: TYPE ── */}
          {step === 'type' && (
            <>
              {/* Emergency banner */}
              <TouchableOpacity onPress={handleEmergency} activeOpacity={0.85}>
                <BlurView intensity={25} tint="dark" style={styles.emergencyBanner}>
                  <Text style={styles.emergencyBannerEmoji}>🚨</Text>
                  <View style={styles.emergencyBannerText}>
                    <Text style={styles.emergencyBannerTitle}>Is this an emergency?</Text>
                    <Text style={styles.emergencyBannerSub}>Tap to call 999 immediately</Text>
                  </View>
                  <Text style={styles.emergencyBannerArrow}>→</Text>
                </BlurView>
              </TouchableOpacity>

              <BlurView intensity={22} tint="dark" style={styles.card}>
                <Text style={styles.cardTitle}>Type of Incident</Text>
                <Text style={styles.cardSub}>Select the category that best describes the concern</Text>
                <View style={styles.typesGrid}>
                  {INCIDENT_TYPES.map(type => {
                    const active = incidentType === type.id;
                    return (
                      <TouchableOpacity
                        key={type.id}
                        style={[
                          styles.typeCard,
                          active && { borderColor: type.color, backgroundColor: `${type.color}12` },
                        ]}
                        onPress={() => setIncidentType(type.id)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.typeEmoji}>{type.emoji}</Text>
                        <Text style={[styles.typeLabel, active && { color: type.color }]}>
                          {type.label}
                        </Text>
                        {type.severity === 'critical' && (
                          <View style={styles.criticalTag}>
                            <Text style={styles.criticalTagText}>CRITICAL</Text>
                          </View>
                        )}
                        {active && (
                          <View style={[styles.typeCheck, { backgroundColor: type.color }]}>
                            <Text style={styles.typeCheckText}>✓</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </BlurView>
            </>
          )}

          {/* ── STEP 2: DETAILS ── */}
          {step === 'details' && (
            <BlurView intensity={22} tint="dark" style={styles.card}>
              <Text style={styles.cardTitle}>Incident Details</Text>
              <Text style={styles.cardSub}>Provide as much detail as possible</Text>

              {isCritical && (
                <View style={styles.urgentBanner}>
                  <Text style={styles.urgentBannerText}>
                    ⚠️ This type of incident will be escalated to our safety team immediately
                  </Text>
                </View>
              )}

              <Text style={styles.fieldLabel}>CHILD'S NAME (OPTIONAL)</Text>
              <View style={[styles.inputWrapper, focusedField === 'child' && styles.inputFocused]}>
                <Text style={styles.inputIcon}>👤</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Which child is involved?"
                  placeholderTextColor="rgba(186,230,253,0.3)"
                  value={childName}
                  onChangeText={setChildName}
                  onFocus={() => setFocusedField('child')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>

              <Text style={styles.fieldLabel}>LOCATION</Text>
              <View style={styles.locationsWrap}>
                {LOCATIONS.map(loc => (
                  <TouchableOpacity
                    key={loc}
                    style={[styles.locationChip, location === loc && styles.locationChipActive]}
                    onPress={() => setLocation(loc)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.locationChipText, location === loc && styles.locationChipTextActive]}>
                      {loc}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>DESCRIPTION</Text>
              <View style={[
                styles.inputWrapper, styles.textArea,
                focusedField === 'desc' && styles.inputFocused,
              ]}>
                <TextInput
                  style={[styles.input, styles.textAreaInput]}
                  placeholder="Describe what happened in detail. Include time, people involved, and any other relevant information..."
                  placeholderTextColor="rgba(186,230,253,0.3)"
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  maxLength={1000}
                  onFocus={() => setFocusedField('desc')}
                  onBlur={() => setFocusedField(null)}
                  textAlignVertical="top"
                />
              </View>
              <Text style={styles.charCount}>{description.length}/1000</Text>

              {/* Options */}
              <View style={styles.optionsRow}>
                <TouchableOpacity
                  style={styles.optionToggle}
                  onPress={() => setIsAnonymous(!isAnonymous)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.checkbox, isAnonymous && styles.checkboxActive]}>
                    {isAnonymous && <Text style={styles.checkboxText}>✓</Text>}
                  </View>
                  <View>
                    <Text style={styles.optionLabel}>Report anonymously</Text>
                    <Text style={styles.optionSub}>Your identity will be protected</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.optionToggle}
                  onPress={() => setIsUrgent(!isUrgent)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.checkbox, isUrgent && styles.checkboxUrgent]}>
                    {isUrgent && <Text style={styles.checkboxText}>✓</Text>}
                  </View>
                  <View>
                    <Text style={styles.optionLabel}>Mark as urgent</Text>
                    <Text style={styles.optionSub}>Requires immediate attention</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </BlurView>
          )}

          {/* ── STEP 3: REVIEW ── */}
          {step === 'review' && (
            <BlurView intensity={22} tint="dark" style={styles.card}>
              <Text style={styles.cardTitle}>Review Report</Text>
              <Text style={styles.cardSub}>Please confirm before submitting</Text>

              {[
                { label: 'Incident Type', value: selectedType?.label ?? '' },
                { label: 'Location', value: location ?? 'Not specified' },
                { label: 'Child', value: childName || 'Not specified' },
                { label: 'Anonymous', value: isAnonymous ? 'Yes' : 'No' },
                { label: 'Urgent', value: isUrgent ? 'Yes — Immediate attention' : 'No' },
              ].map((item, i) => (
                <View key={i} style={styles.reviewRow}>
                  <Text style={styles.reviewLabel}>{item.label}</Text>
                  <Text style={[
                    styles.reviewValue,
                    item.label === 'Urgent' && isUrgent && { color: '#F87171' },
                  ]}>
                    {item.value}
                  </Text>
                </View>
              ))}

              <View style={styles.reviewDivider} />
              <Text style={styles.reviewDescLabel}>Description</Text>
              <Text style={styles.reviewDescText}>{description}</Text>

              <BlurView intensity={15} tint="dark" style={styles.disclaimerBox}>
                <Text style={styles.disclaimerText}>
                  🔒 This report will be reviewed by our safety team within 2 hours.
                  For immediate emergencies please call 999 or the Childline Kenya hotline 0800 720 581.
                </Text>
              </BlurView>
            </BlurView>
          )}

          {/* ── SUBMITTED ── */}
          {step === 'submitted' && (
            <View style={styles.submittedContent}>
              <View style={styles.submittedCircle}>
                <Text style={styles.submittedEmoji}>✓</Text>
              </View>
              <Text style={styles.submittedTitle}>Report Submitted</Text>
              <Text style={styles.submittedSub}>
                Your report has been received and will be reviewed by our safety team shortly.
              </Text>

              <BlurView intensity={22} tint="dark" style={styles.refCard}>
                <Text style={styles.refLabel}>Report Reference</Text>
                <Text style={styles.refValue}>RPT-{Date.now().toString().slice(-7)}</Text>
              </BlurView>

              <BlurView intensity={22} tint="dark" style={styles.nextStepsCard}>
                <Text style={styles.nextStepsTitle}>What happens next</Text>
                {[
                  { emoji: '👁️', text: 'Safety team reviews within 2 hours' },
                  { emoji: '📞', text: 'You may be contacted for more details' },
                  { emoji: '🔔', text: 'Updates sent via notifications' },
                  { emoji: '🛡️', text: 'Child\'s safety is our top priority' },
                ].map((item, i) => (
                  <View key={i} style={styles.nextStepRow}>
                    <Text style={styles.nextStepEmoji}>{item.emoji}</Text>
                    <Text style={styles.nextStepText}>{item.text}</Text>
                  </View>
                ))}
              </BlurView>

              <TouchableOpacity
                style={styles.homeBtn}
                onPress={() => router.replace('/(app)/(tabs)/home')}
                activeOpacity={0.85}
              >
                <Text style={styles.homeBtnText}>Back to Home</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleEmergency}
                style={styles.emergencyLink}
              >
                <Text style={styles.emergencyLinkText}>🚨 Still need emergency help?</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Bottom CTA */}
        {step !== 'submitted' && (
          <BlurView intensity={40} tint="dark" style={styles.bottomBar}>
            <TouchableOpacity
              style={[styles.nextBtn, submitting && styles.nextBtnLoading]}
              onPress={step === 'review' ? handleSubmit : handleNext}
              disabled={submitting}
              activeOpacity={0.85}
            >
              <Text style={styles.nextBtnText}>
                {submitting ? 'Submitting...' :
                 step === 'review' ? '🚨 Submit Report' : 'Continue →'}
              </Text>
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
  orbTop: { width: 200, height: 200, backgroundColor: '#F87171', top: -60, right: -40 },
  orbBottom: { width: 160, height: 160, backgroundColor: '#0284C7', bottom: 80, left: -40 },
  safeArea: { flex: 1 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, marginBottom: 12 },
  backBtn: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8 },
  backBtnText: { color: '#BAE6FD', fontSize: 14 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#F0F9FF' },
  emergencyBtn: { backgroundColor: 'rgba(248,113,113,0.15)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: 'rgba(248,113,113,0.3)' },
  emergencyBtnText: { color: '#F87171', fontSize: 13, fontWeight: '700' },

  progressRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 16, paddingHorizontal: 16 },
  progressItem: { flexDirection: 'row', alignItems: 'center' },
  progressDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.1)' },
  progressDotActive: { borderColor: '#F87171', backgroundColor: 'rgba(248,113,113,0.12)' },
  progressDotDone: { backgroundColor: '#F87171', borderColor: '#F87171' },
  progressDotText: { color: '#BAE6FD', fontSize: 11, fontWeight: '700' },
  progressLine: { width: 40, height: 1.5, backgroundColor: 'rgba(255,255,255,0.08)', marginHorizontal: 4 },
  progressLineDone: { backgroundColor: '#F87171' },

  scrollContent: { paddingHorizontal: 16 },

  emergencyBanner: { borderRadius: 18, overflow: 'hidden', padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16, borderWidth: 1.5, borderColor: 'rgba(248,113,113,0.3)' },
  emergencyBannerEmoji: { fontSize: 28 },
  emergencyBannerText: { flex: 1 },
  emergencyBannerTitle: { color: '#F87171', fontWeight: '800', fontSize: 15 },
  emergencyBannerSub: { color: 'rgba(248,113,113,0.6)', fontSize: 12, marginTop: 2 },
  emergencyBannerArrow: { color: '#F87171', fontSize: 18, fontWeight: '700' },

  card: { borderRadius: 24, overflow: 'hidden', marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', padding: 20 },
  cardTitle: { fontSize: 20, fontWeight: '800', color: '#F0F9FF', marginBottom: 4 },
  cardSub: { color: 'rgba(186,230,253,0.5)', fontSize: 13, marginBottom: 20 },

  urgentBanner: { backgroundColor: 'rgba(248,113,113,0.1)', borderRadius: 12, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(248,113,113,0.2)' },
  urgentBannerText: { color: '#F87171', fontSize: 13, lineHeight: 20 },

  typesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  typeCard: { width: '47%', borderRadius: 16, padding: 14, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.08)', position: 'relative' },
  typeEmoji: { fontSize: 26, marginBottom: 8 },
  typeLabel: { color: 'rgba(186,230,253,0.6)', fontSize: 12, fontWeight: '600', textAlign: 'center' },
  criticalTag: { backgroundColor: 'rgba(248,113,113,0.15)', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, marginTop: 6 },
  criticalTagText: { color: '#F87171', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  typeCheck: { position: 'absolute', top: 8, right: 8, width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  typeCheckText: { color: '#fff', fontSize: 10, fontWeight: '800' },

  fieldLabel: { color: 'rgba(186,230,253,0.6)', fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 8 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 14, height: 52, marginBottom: 18 },
  inputFocused: { borderColor: '#F87171', backgroundColor: 'rgba(248,113,113,0.06)' },
  inputIcon: { fontSize: 16, marginRight: 10 },
  input: { flex: 1, color: '#F0F9FF', fontSize: 15 },
  textArea: { height: 120, alignItems: 'flex-start', paddingTop: 12 },
  textAreaInput: { height: 100 },
  charCount: { color: 'rgba(186,230,253,0.3)', fontSize: 11, textAlign: 'right', marginTop: -14, marginBottom: 18 },

  locationsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 },
  locationChip: { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.08)' },
  locationChipActive: { borderColor: '#F87171', backgroundColor: 'rgba(248,113,113,0.1)' },
  locationChipText: { color: 'rgba(186,230,253,0.5)', fontSize: 12, fontWeight: '600' },
  locationChipTextActive: { color: '#F87171' },

  optionsRow: { gap: 12 },
  optionToggle: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  checkboxActive: { backgroundColor: '#0284C7', borderColor: '#0284C7' },
  checkboxUrgent: { backgroundColor: '#F87171', borderColor: '#F87171' },
  checkboxText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  optionLabel: { color: '#F0F9FF', fontSize: 13, fontWeight: '600' },
  optionSub: { color: 'rgba(186,230,253,0.4)', fontSize: 11, marginTop: 2 },

  reviewRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  reviewLabel: { color: 'rgba(186,230,253,0.5)', fontSize: 13 },
  reviewValue: { color: '#F0F9FF', fontSize: 13, fontWeight: '600' },
  reviewDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginVertical: 14 },
  reviewDescLabel: { color: 'rgba(186,230,253,0.5)', fontSize: 12, marginBottom: 8 },
  reviewDescText: { color: '#F0F9FF', fontSize: 14, lineHeight: 22, marginBottom: 16 },
  disclaimerBox: { borderRadius: 14, overflow: 'hidden', padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  disclaimerText: { color: 'rgba(186,230,253,0.5)', fontSize: 12, lineHeight: 20 },

  submittedContent: { alignItems: 'center', paddingTop: 32, paddingHorizontal: 8 },
  submittedCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(52,211,153,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 24, borderWidth: 2, borderColor: '#34D399' },
  submittedEmoji: { fontSize: 44, color: '#34D399', fontWeight: '800' },
  submittedTitle: { fontSize: 28, fontWeight: '900', color: '#F0F9FF', marginBottom: 8 },
  submittedSub: { color: 'rgba(186,230,253,0.6)', fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  refCard: { borderRadius: 16, overflow: 'hidden', padding: 16, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(56,189,248,0.2)', marginBottom: 20, width: '100%' },
  refLabel: { color: 'rgba(186,230,253,0.4)', fontSize: 11, letterSpacing: 1.5, marginBottom: 6 },
  refValue: { color: '#38BDF8', fontSize: 22, fontWeight: '800', letterSpacing: 2 },
  nextStepsCard: { borderRadius: 20, overflow: 'hidden', padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', marginBottom: 24, width: '100%' },
  nextStepsTitle: { color: '#F0F9FF', fontWeight: '700', fontSize: 14, marginBottom: 14 },
  nextStepRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  nextStepEmoji: { fontSize: 20 },
  nextStepText: { color: 'rgba(186,230,253,0.6)', fontSize: 13 },
  homeBtn: { backgroundColor: '#0284C7', borderRadius: 16, paddingHorizontal: 40, paddingVertical: 16, marginBottom: 16, width: '100%', alignItems: 'center' },
  homeBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  emergencyLink: { paddingVertical: 8 },
  emergencyLinkText: { color: '#F87171', fontSize: 14, fontWeight: '600' },

  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, overflow: 'hidden', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)', padding: 16, paddingBottom: 28 },
  nextBtn: { backgroundColor: '#F87171', borderRadius: 16, paddingVertical: 16, alignItems: 'center', shadowColor: '#F87171', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 8 },
  nextBtnLoading: { opacity: 0.7 },
  nextBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
