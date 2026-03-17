import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import { auth, db } from '../../src/firebaseconfig';
import { doc, setDoc } from 'firebase/firestore';

const SERVICES = ['After School Care', 'School Pickup/Dropoff', 'Full Day Care', 'Tutoring', 'Special Needs Care', 'Overnight Care'];
const AGE_GROUPS = ['Infants (0-1)', 'Toddlers (1-3)', 'Pre-School (3-5)', 'School Age (5-12)', 'Teens (12-17)'];
const LANGUAGES = ['English', 'Swahili', 'Kikuyu', 'Luo', 'Kamba', 'Luhya'];

type Step = 'welcome' | 'basic' | 'services' | 'docs' | 'done';

export default function CaregiverOnboarding() {
  const [step, setStep] = useState<Step>('welcome');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [rate, setRate] = useState('350');
  const [bio, setBio] = useState('');
  const [experience, setExperience] = useState('');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedAges, setSelectedAges] = useState<string[]>([]);
  const [selectedLangs, setSelectedLangs] = useState<string[]>(['English', 'Swahili']);
  const [saving, setSaving] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const steps: Step[] = ['welcome', 'basic', 'services', 'docs', 'done'];
  const stepIndex = steps.indexOf(step);

  const toggle = (item: string, list: string[], setList: (v: string[]) => void) => {
    setList(list.includes(item) ? list.filter(i => i !== item) : [...list, item]);
  };

  const handleNext = () => {
    if (step === 'basic') {
      if (!firstName || !phone || !location) return Alert.alert('Required', 'Please fill in your name, phone and location');
    }
    if (step === 'services') {
      if (selectedServices.length === 0) return Alert.alert('Required', 'Select at least one service');
      if (selectedAges.length === 0) return Alert.alert('Required', 'Select at least one age group');
    }
    const next = steps[stepIndex + 1];
    if (next) setStep(next);
  };

  const handleComplete = async () => {
    setSaving(true);
    try {
      const uid = auth.currentUser?.uid;
      if (uid) {
        await setDoc(doc(db, 'users', uid), {
          role: 'caregiver',
          firstName, lastName, phone, location,
          rate: parseInt(rate), bio, experience,
          services: selectedServices,
          ageGroups: selectedAges,
          languages: selectedLangs,
          verificationStatus: 'pending',
          available: false,
          createdAt: new Date(),
        }, { merge: true });
      }
      setStep('done');
    } catch (e) {
      Alert.alert('Error', 'Could not save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.overlay} />
      <View style={[styles.orb, styles.orbTop]} />
      <View style={[styles.orb, styles.orbBottom]} />

      <SafeAreaView style={styles.safeArea}>
        {/* Progress dots */}
        {step !== 'welcome' && step !== 'done' && (
          <View style={styles.progressDots}>
            {(['basic', 'services', 'docs'] as Step[]).map((s, i) => (
              <View key={s} style={[styles.dot, stepIndex > i + 1 && styles.dotDone, step === s && styles.dotActive]} />
            ))}
          </View>
        )}

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* ── WELCOME ── */}
          {step === 'welcome' && (
            <View style={styles.welcomeContent}>
              <Text style={styles.welcomeEmoji}>🛡️</Text>
              <Text style={styles.welcomeTitle}>Become a Safe Kids Caregiver</Text>
              <Text style={styles.welcomeSub}>Join our network of verified caregivers and start earning by caring for children of working parents across Nairobi.</Text>

              <View style={styles.benefitsList}>
                {[
                  { emoji: '💰', title: 'Earn KSh 300–500/hr', sub: 'Set your own rate and schedule' },
                  { emoji: '🛡️', title: 'Safe & Trusted Platform', sub: 'Verified by Safe Kids Kenya' },
                  { emoji: '📱', title: 'M-Pesa Payments', sub: 'Get paid directly to your phone' },
                  { emoji: '🌍', title: 'Work Near You', sub: 'Find families in your neighbourhood' },
                ].map((b, i) => (
                  <BlurView key={i} intensity={20} tint="dark" style={styles.benefitCard}>
                    <Text style={styles.benefitEmoji}>{b.emoji}</Text>
                    <View>
                      <Text style={styles.benefitTitle}>{b.title}</Text>
                      <Text style={styles.benefitSub}>{b.sub}</Text>
                    </View>
                  </BlurView>
                ))}
              </View>

              <BlurView intensity={18} tint="dark" style={styles.requirementsBox}>
                <Text style={styles.requirementsTitle}>You will need:</Text>
                <Text style={styles.requirementsItem}>🪪 Kenya National ID</Text>
                <Text style={styles.requirementsItem}>📋 Certificate of Good Conduct (DCI — KSh 1,050)</Text>
                <Text style={styles.requirementsItem}>📸 Clear profile photo</Text>
                <Text style={styles.requirementsSub}>Documents can be uploaded within 48 hours of signup</Text>
              </BlurView>

              <TouchableOpacity style={styles.nextBtn} onPress={() => setStep('basic')} activeOpacity={0.85}>
                <Text style={styles.nextBtnText}>Get Started →</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── BASIC INFO ── */}
          {step === 'basic' && (
            <>
              <Text style={styles.stepTitle}>Tell us about yourself</Text>
              <Text style={styles.stepSub}>This information will be shown to parents</Text>

              <BlurView intensity={20} tint="dark" style={styles.formCard}>
                {[
                  { label: 'FIRST NAME', key: 'first', icon: '👤', value: firstName, setter: setFirstName, placeholder: 'Your first name' },
                  { label: 'LAST NAME', key: 'last', icon: '👤', value: lastName, setter: setLastName, placeholder: 'Your last name' },
                  { label: 'PHONE NUMBER', key: 'phone', icon: '📞', value: phone, setter: setPhone, placeholder: '+254 7XX XXX XXX' },
                  { label: 'LOCATION', key: 'location', icon: '📍', value: location, setter: setLocation, placeholder: 'e.g. Westlands, Nairobi' },
                  { label: 'HOURLY RATE (KSH)', key: 'rate', icon: '💰', value: rate, setter: setRate, placeholder: '350', keyboardType: 'numeric' },
                  { label: 'YEARS OF EXPERIENCE', key: 'exp', icon: '📅', value: experience, setter: setExperience, placeholder: 'e.g. 3 years', keyboardType: 'numeric' },
                ].map((f) => (
                  <View key={f.key} style={styles.fieldBlock}>
                    <Text style={styles.fieldLabel}>{f.label}</Text>
                    <View style={[styles.inputRow, focusedField === f.key && styles.inputFocused]}>
                      <Text style={styles.inputIcon}>{f.icon}</Text>
                      <TextInput
                        style={styles.input}
                        value={f.value}
                        onChangeText={f.setter}
                        placeholder={f.placeholder}
                        placeholderTextColor="rgba(186,230,253,0.3)"
                        onFocus={() => setFocusedField(f.key)}
                        onBlur={() => setFocusedField(null)}
                        keyboardType={(f as any).keyboardType ?? 'default'}
                      />
                    </View>
                  </View>
                ))}

                <View style={styles.fieldBlock}>
                  <Text style={styles.fieldLabel}>BIO</Text>
                  <View style={[styles.inputRow, styles.textArea, focusedField === 'bio' && styles.inputFocused]}>
                    <TextInput
                      style={[styles.input, { height: 90 }]}
                      value={bio}
                      onChangeText={setBio}
                      placeholder="Describe your experience and why parents should trust you with their children..."
                      placeholderTextColor="rgba(186,230,253,0.3)"
                      multiline
                      textAlignVertical="top"
                      onFocus={() => setFocusedField('bio')}
                      onBlur={() => setFocusedField(null)}
                    />
                  </View>
                </View>
              </BlurView>
            </>
          )}

          {/* ── SERVICES ── */}
          {step === 'services' && (
            <>
              <Text style={styles.stepTitle}>Your Services</Text>
              <Text style={styles.stepSub}>Tell parents what you can offer</Text>

              <Text style={styles.subSectionLabel}>SERVICES OFFERED</Text>
              <BlurView intensity={20} tint="dark" style={styles.chipCard}>
                <View style={styles.chipWrap}>
                  {SERVICES.map(s => (
                    <TouchableOpacity key={s} style={[styles.chip, selectedServices.includes(s) && styles.chipActive]} onPress={() => toggle(s, selectedServices, setSelectedServices)} activeOpacity={0.8}>
                      <Text style={[styles.chipText, selectedServices.includes(s) && styles.chipTextActive]}>{s}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </BlurView>

              <Text style={styles.subSectionLabel}>AGE GROUPS</Text>
              <BlurView intensity={20} tint="dark" style={styles.chipCard}>
                <View style={styles.chipWrap}>
                  {AGE_GROUPS.map(a => (
                    <TouchableOpacity key={a} style={[styles.chip, selectedAges.includes(a) && styles.chipActiveGreen]} onPress={() => toggle(a, selectedAges, setSelectedAges)} activeOpacity={0.8}>
                      <Text style={[styles.chipText, selectedAges.includes(a) && styles.chipTextGreen]}>{a}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </BlurView>

              <Text style={styles.subSectionLabel}>LANGUAGES</Text>
              <BlurView intensity={20} tint="dark" style={styles.chipCard}>
                <View style={styles.chipWrap}>
                  {LANGUAGES.map(l => (
                    <TouchableOpacity key={l} style={[styles.chip, selectedLangs.includes(l) && styles.chipActiveYellow]} onPress={() => toggle(l, selectedLangs, setSelectedLangs)} activeOpacity={0.8}>
                      <Text style={[styles.chipText, selectedLangs.includes(l) && styles.chipTextYellow]}>{l}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </BlurView>
            </>
          )}

          {/* ── DOCS ── */}
          {step === 'docs' && (
            <>
              <Text style={styles.stepTitle}>Verification Documents</Text>
              <Text style={styles.stepSub}>Required to start receiving bookings</Text>

              <BlurView intensity={20} tint="dark" style={styles.docsInfoCard}>
                <Text style={styles.docsInfoText}>
                  📋 You have 48 hours to upload your documents. Your profile will show as "Pending" until verified by our team.
                </Text>
              </BlurView>

              {[
                { emoji: '🪪', label: 'National ID', desc: 'Front and back of your Kenya National ID', required: true },
                { emoji: '📋', label: 'Certificate of Good Conduct', desc: 'From DCI Kenya — costs KSh 1,050 via eCitizen', required: true },
                { emoji: '📸', label: 'Profile Photo', desc: 'Clear headshot with neutral background', required: true },
              ].map((doc, i) => (
                <BlurView key={i} intensity={20} tint="dark" style={styles.docCard}>
                  <View style={styles.docHeader}>
                    <Text style={styles.docEmoji}>{doc.emoji}</Text>
                    <View style={styles.docText}>
                      <Text style={styles.docLabel}>{doc.label} {doc.required && <Text style={styles.docRequired}>*</Text>}</Text>
                      <Text style={styles.docDesc}>{doc.desc}</Text>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.uploadBtn} onPress={() => router.push('/(caregiver)/id-verification' as any)}>
                    <Text style={styles.uploadBtnText}>📤 Upload Later in Profile</Text>
                  </TouchableOpacity>
                </BlurView>
              ))}
            </>
          )}

          {/* ── DONE ── */}
          {step === 'done' && (
            <View style={styles.doneContent}>
              <Text style={styles.doneEmoji}>🎉</Text>
              <Text style={styles.doneTitle}>You're all set!</Text>
              <Text style={styles.doneSub}>Your caregiver profile has been created. Upload your documents within 48 hours to start receiving bookings.</Text>

              <BlurView intensity={20} tint="dark" style={styles.doneSteps}>
                {[
                  { emoji: '📤', text: 'Upload your documents in Profile → ID Verification' },
                  { emoji: '⏳', text: 'Safe Kids team reviews within 48 hours' },
                  { emoji: '🛡️', text: 'Get verified and go live to parents' },
                  { emoji: '💰', text: 'Start receiving bookings and earning' },
                ].map((s, i) => (
                  <View key={i} style={[styles.doneStep, i < 3 && styles.doneStepDivider]}>
                    <Text style={styles.doneStepEmoji}>{s.emoji}</Text>
                    <Text style={styles.doneStepText}>{s.text}</Text>
                  </View>
                ))}
              </BlurView>

              <TouchableOpacity style={styles.nextBtn} onPress={() => router.replace('/(caregiver)/(tabs)/home' as any)} activeOpacity={0.85}>
                <Text style={styles.nextBtnText}>Go to Dashboard →</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Bottom CTA */}
        {step !== 'welcome' && step !== 'done' && (
          <BlurView intensity={40} tint="dark" style={styles.bottomBar}>
            <TouchableOpacity
              style={[styles.nextBtn, saving && styles.nextBtnLoading]}
              onPress={step === 'docs' ? handleComplete : handleNext}
              disabled={saving}
              activeOpacity={0.85}
            >
              <Text style={styles.nextBtnText}>
                {saving ? 'Saving...' : step === 'docs' ? '✅ Complete Setup' : 'Continue →'}
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
  orbTop: { width: 220, height: 220, backgroundColor: '#34D399', top: -70, right: -50 },
  orbBottom: { width: 180, height: 180, backgroundColor: '#0284C7', bottom: 60, left: -50 },
  safeArea: { flex: 1 },
  progressDots: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingTop: 12, marginBottom: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.1)' },
  dotActive: { backgroundColor: '#34D399', width: 24 },
  dotDone: { backgroundColor: 'rgba(52,211,153,0.4)' },
  scrollContent: { paddingHorizontal: 20 },
  welcomeContent: { alignItems: 'center', paddingTop: 24 },
  welcomeEmoji: { fontSize: 56, marginBottom: 16 },
  welcomeTitle: { fontSize: 26, fontWeight: '900', color: '#F0F9FF', textAlign: 'center', marginBottom: 10, letterSpacing: -0.5 },
  welcomeSub: { color: 'rgba(186,230,253,0.55)', fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  benefitsList: { width: '100%', gap: 10, marginBottom: 20 },
  benefitCard: { borderRadius: 16, overflow: 'hidden', padding: 14, flexDirection: 'row', gap: 14, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  benefitEmoji: { fontSize: 28 },
  benefitTitle: { color: '#F0F9FF', fontWeight: '700', fontSize: 14 },
  benefitSub: { color: 'rgba(186,230,253,0.45)', fontSize: 12, marginTop: 2 },
  requirementsBox: { borderRadius: 18, overflow: 'hidden', padding: 16, borderWidth: 1, borderColor: 'rgba(56,189,248,0.2)', width: '100%', marginBottom: 24 },
  requirementsTitle: { color: '#F0F9FF', fontWeight: '700', fontSize: 13, marginBottom: 10 },
  requirementsItem: { color: 'rgba(186,230,253,0.7)', fontSize: 13, marginBottom: 6 },
  requirementsSub: { color: 'rgba(186,230,253,0.4)', fontSize: 11, marginTop: 6, fontStyle: 'italic' },
  stepTitle: { fontSize: 24, fontWeight: '900', color: '#F0F9FF', paddingTop: 16, marginBottom: 6 },
  stepSub: { color: 'rgba(186,230,253,0.5)', fontSize: 13, marginBottom: 20 },
  formCard: { borderRadius: 22, overflow: 'hidden', padding: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', marginBottom: 16 },
  fieldBlock: { marginBottom: 14 },
  fieldLabel: { color: 'rgba(186,230,253,0.5)', fontSize: 11, fontWeight: '700', letterSpacing: 1.2, marginBottom: 8 },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 13, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 14, height: 50 },
  inputFocused: { borderColor: '#34D399', backgroundColor: 'rgba(52,211,153,0.06)' },
  textArea: { height: 112, alignItems: 'flex-start', paddingTop: 12 },
  inputIcon: { fontSize: 16, marginRight: 10 },
  input: { flex: 1, color: '#F0F9FF', fontSize: 14 },
  subSectionLabel: { color: 'rgba(186,230,253,0.5)', fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 8 },
  chipCard: { borderRadius: 18, overflow: 'hidden', padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', marginBottom: 16 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderRadius: 10, paddingHorizontal: 13, paddingVertical: 7, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.08)' },
  chipText: { color: 'rgba(186,230,253,0.5)', fontSize: 12, fontWeight: '600' },
  chipActive: { borderColor: '#38BDF8', backgroundColor: 'rgba(56,189,248,0.1)' },
  chipTextActive: { color: '#38BDF8' },
  chipActiveGreen: { borderColor: '#34D399', backgroundColor: 'rgba(52,211,153,0.1)' },
  chipTextGreen: { color: '#34D399' },
  chipActiveYellow: { borderColor: '#FBBF24', backgroundColor: 'rgba(251,191,36,0.1)' },
  chipTextYellow: { color: '#FBBF24' },
  docsInfoCard: { borderRadius: 16, overflow: 'hidden', padding: 14, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(56,189,248,0.2)' },
  docsInfoText: { color: 'rgba(186,230,253,0.65)', fontSize: 13, lineHeight: 20 },
  docCard: { borderRadius: 18, overflow: 'hidden', padding: 16, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  docHeader: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', marginBottom: 12 },
  docEmoji: { fontSize: 24 },
  docText: { flex: 1 },
  docLabel: { color: '#F0F9FF', fontWeight: '700', fontSize: 14 },
  docRequired: { color: '#F87171' },
  docDesc: { color: 'rgba(186,230,253,0.45)', fontSize: 12, marginTop: 3, lineHeight: 18 },
  uploadBtn: { borderRadius: 12, paddingVertical: 10, alignItems: 'center', borderWidth: 1.5, borderColor: 'rgba(56,189,248,0.2)', borderStyle: 'dashed' },
  uploadBtnText: { color: '#38BDF8', fontSize: 13, fontWeight: '600' },
  doneContent: { alignItems: 'center', paddingTop: 32 },
  doneEmoji: { fontSize: 64, marginBottom: 20 },
  doneTitle: { fontSize: 30, fontWeight: '900', color: '#F0F9FF', marginBottom: 10 },
  doneSub: { color: 'rgba(186,230,253,0.55)', fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  doneSteps: { borderRadius: 20, overflow: 'hidden', padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', width: '100%', marginBottom: 28 },
  doneStep: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  doneStepDivider: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  doneStepEmoji: { fontSize: 22 },
  doneStepText: { flex: 1, color: 'rgba(186,230,253,0.65)', fontSize: 13, lineHeight: 19 },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, overflow: 'hidden', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)', padding: 16, paddingBottom: 28 },
  nextBtn: { backgroundColor: '#34D399', borderRadius: 16, paddingVertical: 16, alignItems: 'center', width: '100%', shadowColor: '#34D399', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 8 },
  nextBtnLoading: { opacity: 0.7 },
  nextBtnText: { color: '#080C14', fontWeight: '800', fontSize: 15 },
});
