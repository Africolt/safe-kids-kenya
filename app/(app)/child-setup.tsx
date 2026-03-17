import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Image, Alert, Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import { auth, db } from '../../src/firebaseconfig';
import { collection, addDoc, doc, setDoc } from 'firebase/firestore';

const { height } = Dimensions.get('window');

const AGE_GROUPS = [
  { label: 'Infant', range: '0–1 yr', emoji: '👶' },
  { label: 'Toddler', range: '2–3 yrs', emoji: '🧒' },
  { label: 'Pre-school', range: '4–5 yrs', emoji: '🎨' },
  { label: 'Primary', range: '6–12 yrs', emoji: '📚' },
  { label: 'Teen', range: '13–17 yrs', emoji: '🎒' },
];

const SERVICES_NEEDED = [
  { id: 'pickup', label: 'School Pickup', emoji: '🚗' },
  { id: 'afterschool', label: 'After School', emoji: '🏠' },
  { id: 'fullday', label: 'Full Day', emoji: '☀️' },
  { id: 'overnight', label: 'Overnight', emoji: '🌙' },
  { id: 'tutoring', label: 'Tutoring', emoji: '📖' },
  { id: 'dropoff', label: 'School Drop-off', emoji: '🎒' },
];

interface Child {
  name: string;
  age: string;
  ageGroup: string;
  school: string;
  pickupPoint: string;
  services: string[];
  specialNeeds: string;
}

const emptyChild: Child = {
  name: '',
  age: '',
  ageGroup: '',
  school: '',
  pickupPoint: '',
  services: [],
  specialNeeds: '',
};

export default function ChildProfileSetup() {
  const [step, setStep] = useState(1); // 1=basic, 2=school, 3=services
  const [child, setChild] = useState<Child>({ ...emptyChild });
  const [children, setChildren] = useState<Child[]>([]);
  const [saving, setSaving] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const totalSteps = 3;

  const updateChild = (field: keyof Child, value: any) => {
    setChild(prev => ({ ...prev, [field]: value }));
  };

  const toggleService = (id: string) => {
    setChild(prev => ({
      ...prev,
      services: prev.services.includes(id)
        ? prev.services.filter(s => s !== id)
        : [...prev.services, id],
    }));
  };

  const handleNext = () => {
    if (step === 1) {
      if (!child.name || !child.age || !child.ageGroup) {
        return Alert.alert('Missing info', 'Please fill in your child\'s name, age and age group');
      }
    }
    if (step === 2) {
      if (!child.school) {
        return Alert.alert('Missing info', 'Please enter the school name');
      }
    }
    if (step < totalSteps) setStep(step + 1);
  };

  const handleAddAnother = async () => {
    if (child.services.length === 0) {
      return Alert.alert('Missing info', 'Please select at least one service');
    }
    setChildren(prev => [...prev, child]);
    setChild({ ...emptyChild });
    setStep(1);
  };

  const handleSave = async () => {
    if (child.services.length === 0 && children.length === 0) {
      return Alert.alert('Missing info', 'Please select at least one service');
    }
    setSaving(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not logged in');
      const allChildren = child.name ? [...children, child] : children;
      for (const c of allChildren) {
        await addDoc(collection(db, 'users', user.uid, 'children'), c);
      }

      // Mark parent as having children set up
      await setDoc(doc(db, 'users', user.uid), { hasChildren: true }, { merge: true });

      router.replace('/(app)/(tabs)/home');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    router.replace('/(app)/(tabs)/home');
  };

  return (
    <View style={styles.root}>
      <Image
        source={require('../../assets/images/kids-hero.png')}
        style={styles.bgImage}
        resizeMode="cover"
      />
      <View style={styles.overlay} />
      <View style={[styles.orb, styles.orbTop]} />
      <View style={[styles.orb, styles.orbBottom]} />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── HEADER ── */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerSub}>Step {step} of {totalSteps}</Text>
              <Text style={styles.headerTitle}>
                {step === 1 ? 'Child Details' : step === 2 ? 'School Info' : 'Services Needed'}
              </Text>
            </View>
            <TouchableOpacity onPress={handleSkip} style={styles.skipBtn}>
              <Text style={styles.skipText}>Skip for now</Text>
            </TouchableOpacity>
          </View>

          {/* ── PROGRESS BAR ── */}
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${(step / totalSteps) * 100}%` }]} />
          </View>

          {/* ── CHILDREN ADDED ── */}
          {children.length > 0 && (
            <View style={styles.addedRow}>
              {children.map((c, i) => (
                <View key={i} style={styles.addedChip}>
                  <Text style={styles.addedChipText}>👧 {c.name}</Text>
                </View>
              ))}
            </View>
          )}

          {/* ── STEP 1: BASIC INFO ── */}
          {step === 1 && (
            <BlurView intensity={30} tint="dark" style={styles.card}>
              <Text style={styles.cardTitle}>
                {children.length > 0 ? 'Add Another Child' : "Your Child's Info"}
              </Text>
              <Text style={styles.cardSub}>Basic details to match the right caregiver</Text>

              <Text style={styles.fieldLabel}>CHILD'S NAME</Text>
              <View style={[styles.inputWrapper, focusedField === 'name' && styles.inputFocused]}>
                <Text style={styles.inputIcon}>👤</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Amani"
                  placeholderTextColor="rgba(186,230,253,0.3)"
                  value={child.name}
                  onChangeText={v => updateChild('name', v)}
                  onFocus={() => setFocusedField('name')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>

              <Text style={styles.fieldLabel}>AGE</Text>
              <View style={[styles.inputWrapper, focusedField === 'age' && styles.inputFocused]}>
                <Text style={styles.inputIcon}>🎂</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 7"
                  placeholderTextColor="rgba(186,230,253,0.3)"
                  value={child.age}
                  onChangeText={v => updateChild('age', v)}
                  keyboardType="numeric"
                  onFocus={() => setFocusedField('age')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>

              <Text style={styles.fieldLabel}>AGE GROUP</Text>
              <View style={styles.ageGroupGrid}>
                {AGE_GROUPS.map((g) => (
                  <TouchableOpacity
                    key={g.label}
                    style={[
                      styles.ageGroupCard,
                      child.ageGroup === g.label && styles.ageGroupCardActive,
                    ]}
                    onPress={() => updateChild('ageGroup', g.label)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.ageGroupEmoji}>{g.emoji}</Text>
                    <Text style={[
                      styles.ageGroupLabel,
                      child.ageGroup === g.label && styles.ageGroupLabelActive
                    ]}>
                      {g.label}
                    </Text>
                    <Text style={styles.ageGroupRange}>{g.range}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>SPECIAL NEEDS (OPTIONAL)</Text>
              <View style={[styles.inputWrapper, focusedField === 'needs' && styles.inputFocused]}>
                <Text style={styles.inputIcon}>💝</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Any medical or special requirements"
                  placeholderTextColor="rgba(186,230,253,0.3)"
                  value={child.specialNeeds}
                  onChangeText={v => updateChild('specialNeeds', v)}
                  onFocus={() => setFocusedField('needs')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
            </BlurView>
          )}

          {/* ── STEP 2: SCHOOL INFO ── */}
          {step === 2 && (
            <BlurView intensity={30} tint="dark" style={styles.card}>
              <Text style={styles.cardTitle}>School Information</Text>
              <Text style={styles.cardSub}>For pickup/drop-off coordination</Text>

              <Text style={styles.fieldLabel}>SCHOOL NAME</Text>
              <View style={[styles.inputWrapper, focusedField === 'school' && styles.inputFocused]}>
                <Text style={styles.inputIcon}>🏫</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Nairobi Primary School"
                  placeholderTextColor="rgba(186,230,253,0.3)"
                  value={child.school}
                  onChangeText={v => updateChild('school', v)}
                  onFocus={() => setFocusedField('school')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>

              <Text style={styles.fieldLabel}>PICKUP POINT</Text>
              <View style={[styles.inputWrapper, focusedField === 'pickup' && styles.inputFocused]}>
                <Text style={styles.inputIcon}>📍</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Main gate, Westlands"
                  placeholderTextColor="rgba(186,230,253,0.3)"
                  value={child.pickupPoint}
                  onChangeText={v => updateChild('pickupPoint', v)}
                  onFocus={() => setFocusedField('pickup')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>

              {/* Map placeholder for pickup point */}
              <BlurView intensity={20} tint="dark" style={styles.mapPlaceholder}>
                <Text style={styles.mapPlaceholderEmoji}>🗺️</Text>
                <Text style={styles.mapPlaceholderText}>
                  Tap to pin pickup location on map
                </Text>
                <Text style={styles.mapPlaceholderSub}>
                  Coming soon — use address for now
                </Text>
              </BlurView>
            </BlurView>
          )}

          {/* ── STEP 3: SERVICES ── */}
          {step === 3 && (
            <BlurView intensity={30} tint="dark" style={styles.card}>
              <Text style={styles.cardTitle}>Services Needed</Text>
              <Text style={styles.cardSub}>Select all that apply for {child.name || 'your child'}</Text>

              <View style={styles.servicesGrid}>
                {SERVICES_NEEDED.map((s) => {
                  const active = child.services.includes(s.id);
                  return (
                    <TouchableOpacity
                      key={s.id}
                      style={[styles.serviceCard, active && styles.serviceCardActive]}
                      onPress={() => toggleService(s.id)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.serviceEmoji}>{s.emoji}</Text>
                      <Text style={[styles.serviceLabel, active && styles.serviceLabelActive]}>
                        {s.label}
                      </Text>
                      {active && (
                        <View style={styles.serviceCheck}>
                          <Text style={styles.serviceCheckText}>✓</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Add another child option */}
              <TouchableOpacity
                style={styles.addAnotherBtn}
                onPress={handleAddAnother}
                activeOpacity={0.8}
              >
                <Text style={styles.addAnotherText}>+ Add Another Child</Text>
              </TouchableOpacity>
            </BlurView>
          )}

          {/* ── NAVIGATION BUTTONS ── */}
          <View style={styles.btnRow}>
            {step > 1 && (
              <TouchableOpacity
                style={styles.backBtn}
                onPress={() => setStep(step - 1)}
                activeOpacity={0.8}
              >
                <Text style={styles.backBtnText}>← Back</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.nextBtn, step === 1 && { flex: 1 }]}
              onPress={step === totalSteps ? handleSave : handleNext}
              disabled={saving}
              activeOpacity={0.85}
            >
              <Text style={styles.nextBtnText}>
                {saving ? 'Saving...' : step === totalSteps ? 'Save & Continue →' : 'Next →'}
              </Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#080C14' },
  bgImage: { position: 'absolute', width: '100%', height: '100%' },
  overlay: {
    position: 'absolute', width: '100%', height: '100%',
    backgroundColor: 'rgba(8,12,20,0.9)',
  },
  orb: { position: 'absolute', borderRadius: 999, opacity: 0.12 },
  orbTop: { width: 200, height: 200, backgroundColor: '#0284C7', top: -60, right: -40 },
  orbBottom: { width: 160, height: 160, backgroundColor: '#0369A1', bottom: 80, left: -40 },
  safeArea: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 40 },

  // Header
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingTop: 12, marginBottom: 16,
  },
  headerSub: { fontSize: 12, color: 'rgba(186,230,253,0.5)', marginBottom: 2 },
  headerTitle: { fontSize: 24, fontWeight: '900', color: '#F0F9FF', letterSpacing: -0.5 },
  skipBtn: {
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  skipText: { color: 'rgba(186,230,253,0.5)', fontSize: 13 },

  // Progress
  progressBg: {
    height: 4, backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 2, marginBottom: 20, overflow: 'hidden',
  },
  progressFill: {
    height: '100%', backgroundColor: '#38BDF8', borderRadius: 2,
  },

  // Added children
  addedRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  addedChip: {
    backgroundColor: 'rgba(56,189,248,0.15)', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: 'rgba(56,189,248,0.3)',
  },
  addedChipText: { color: '#38BDF8', fontSize: 12, fontWeight: '600' },

  // Card
  card: {
    borderRadius: 24, overflow: 'hidden', marginBottom: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', padding: 20,
  },
  cardTitle: { fontSize: 20, fontWeight: '800', color: '#F0F9FF', marginBottom: 4 },
  cardSub: { color: 'rgba(186,230,253,0.5)', fontSize: 13, marginBottom: 24 },

  // Fields
  fieldLabel: {
    color: 'rgba(186,230,253,0.6)', fontSize: 11,
    fontWeight: '700', letterSpacing: 1.5, marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 14, height: 52, marginBottom: 18,
  },
  inputFocused: { borderColor: '#38BDF8', backgroundColor: 'rgba(56,189,248,0.08)' },
  inputIcon: { fontSize: 16, marginRight: 10 },
  input: { flex: 1, color: '#F0F9FF', fontSize: 15 },

  // Age groups
  ageGroupGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 },
  ageGroupCard: {
    width: '30%', borderRadius: 14, padding: 12, alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.08)',
  },
  ageGroupCardActive: {
    borderColor: '#38BDF8', backgroundColor: 'rgba(56,189,248,0.12)',
  },
  ageGroupEmoji: { fontSize: 22, marginBottom: 4 },
  ageGroupLabel: { color: 'rgba(186,230,253,0.6)', fontSize: 12, fontWeight: '700' },
  ageGroupLabelActive: { color: '#38BDF8' },
  ageGroupRange: { color: 'rgba(186,230,253,0.35)', fontSize: 10, marginTop: 2 },

  // Map placeholder
  mapPlaceholder: {
    borderRadius: 16, overflow: 'hidden', padding: 24,
    alignItems: 'center', marginTop: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  mapPlaceholderEmoji: { fontSize: 32, marginBottom: 8 },
  mapPlaceholderText: { color: '#BAE6FD', fontSize: 14, fontWeight: '600', marginBottom: 4 },
  mapPlaceholderSub: { color: 'rgba(186,230,253,0.4)', fontSize: 12 },

  // Services
  servicesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  serviceCard: {
    width: '47%', borderRadius: 16, padding: 16, alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.08)',
    position: 'relative',
  },
  serviceCardActive: {
    borderColor: '#38BDF8', backgroundColor: 'rgba(56,189,248,0.12)',
  },
  serviceEmoji: { fontSize: 28, marginBottom: 8 },
  serviceLabel: { color: 'rgba(186,230,253,0.6)', fontSize: 13, fontWeight: '600' },
  serviceLabelActive: { color: '#38BDF8' },
  serviceCheck: {
    position: 'absolute', top: 8, right: 8,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: '#38BDF8', alignItems: 'center', justifyContent: 'center',
  },
  serviceCheckText: { color: '#fff', fontSize: 10, fontWeight: '800' },

  // Add another
  addAnotherBtn: {
    borderRadius: 14, paddingVertical: 14, alignItems: 'center',
    borderWidth: 1.5, borderColor: 'rgba(56,189,248,0.3)',
    backgroundColor: 'rgba(56,189,248,0.08)',
  },
  addAnotherText: { color: '#38BDF8', fontSize: 14, fontWeight: '700' },

  // Nav buttons
  btnRow: { flexDirection: 'row', gap: 10 },
  backBtn: {
    borderRadius: 16, paddingVertical: 16, paddingHorizontal: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
  },
  backBtnText: { color: 'rgba(186,230,253,0.6)', fontSize: 14, fontWeight: '600' },
  nextBtn: {
    flex: 2, borderRadius: 16, paddingVertical: 16, alignItems: 'center',
    backgroundColor: '#0284C7',
    shadowColor: '#0284C7', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4, shadowRadius: 16, elevation: 8,
  },
  nextBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
