import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../../src/firebaseconfig';

const SERVICES = ['After School Care', 'School Pickup/Dropoff', 'Full Day Care', 'Tutoring', 'Special Needs Care', 'Overnight Care'];
const AGE_GROUPS = ['Infants (0-1)', 'Toddlers (1-3)', 'Pre-School (3-5)', 'School Age (5-12)', 'Teens (12-17)'];
const LANGUAGES = ['English', 'Swahili', 'Kikuyu', 'Luo', 'Kamba', 'Luhya'];
const CERTIFICATIONS = ['First Aid', 'Child Protection', 'Early Childhood', 'Special Needs', 'Food Safety'];

export default function CaregiverProfile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Profile fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [rate, setRate] = useState('350');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [verificationStatus, setVerificationStatus] = useState('pending');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedAges, setSelectedAges] = useState<string[]>([]);
  const [selectedLangs, setSelectedLangs] = useState<string[]>(['English', 'Swahili']);
  const [selectedCerts, setSelectedCerts] = useState<string[]>([]);

  // Load from Firestore on mount
  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    getDoc(doc(db, 'users', uid)).then(snap => {
      const d = snap.data();
      if (d) {
        setFirstName(d.firstName ?? '');
        setLastName(d.lastName ?? '');
        setEmail(auth.currentUser?.email ?? '');
        setBio(d.bio ?? '');
        setRate(d.rate?.toString() ?? '350');
        setPhone(d.phone ?? '');
        setLocation(d.location ?? '');
        setVerificationStatus(d.verificationStatus ?? 'pending');
        setSelectedServices(d.services ?? []);
        setSelectedAges(d.ageGroups ?? []);
        setSelectedLangs(d.languages ?? ['English', 'Swahili']);
        setSelectedCerts(d.certifications ?? []);
      }
    }).finally(() => setLoading(false));
  }, []);

  const toggle = (item: string, list: string[], setList: (v: string[]) => void) => {
    setList(list.includes(item) ? list.filter(i => i !== item) : [...list, item]);
  };

  const handleSave = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', uid), {
        firstName,
        lastName,
        bio,
        rate: parseInt(rate) || 350,
        phone,
        location,
        services: selectedServices,
        ageGroups: selectedAges,
        languages: selectedLangs,
        certifications: selectedCerts,
      });
      Alert.alert('✅ Saved', 'Your profile has been updated');
    } catch (e) {
      Alert.alert('Error', 'Could not save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out', style: 'destructive',
        onPress: async () => {
            try {
              await auth.signOut();
              router.replace('/(auth)/onboarding' as any);
            } catch (e) {
              router.replace('/(auth)/onboarding' as any);
            }
          }
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your caregiver profile, verification documents and all data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Forever', style: 'destructive',
          onPress: async () => {
            try {
              const user = auth.currentUser;
              if (!user) return;
              const { doc, deleteDoc } = await import('firebase/firestore');
              await deleteDoc(doc(db, 'users', user.uid));
              await user.delete();
            } catch (e: any) {
              Alert.alert('Error', 'Could not delete account. Please sign out and sign back in first, then try again.');
            }
          },
        },
      ]
    );
  };

  const verificationConfig: Record<string, { color: string; bg: string; label: string }> = {
    pending:  { color: '#FBBF24', bg: 'rgba(251,191,36,0.12)', label: '⏳ Verification Pending' },
    verified: { color: '#34D399', bg: 'rgba(52,211,153,0.12)', label: '✓ Verified Caregiver' },
    rejected: { color: '#F87171', bg: 'rgba(248,113,113,0.12)', label: '✕ Verification Rejected' },
  };
  const vc = verificationConfig[verificationStatus] ?? verificationConfig.pending;

  if (loading) return (
    <View style={[styles.root, { alignItems: 'center', justifyContent: 'center' }]}>
      <ActivityIndicator color="#34D399" size="large" />
    </View>
  );

  return (
    <View style={styles.root}>
      <View style={styles.overlay} />
      <View style={[styles.orb, styles.orbTop]} />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>My Profile</Text>
            <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
              <Text style={styles.signOutText}>Sign Out</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={handleDeleteAccount}
                activeOpacity={0.85}
              >
                <Text style={styles.deleteBtnText}>🗑 Delete Account</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.legalBtn}
                onPress={() => router.push('/(app)/caregiver-agreement' as any)}
                activeOpacity={0.85}
              >
                <Text style={styles.legalBtnText}>📋 Caregiver Agreement</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.legalBtn}
                onPress={() => router.push('/(app)/privacy-policy' as any)}
                activeOpacity={0.85}
              >
                <Text style={styles.legalBtnText}>🔒 Privacy Policy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.legalBtn}
                onPress={() => router.push('/(app)/terms-of-service' as any)}
                activeOpacity={0.85}
              >
                <Text style={styles.legalBtnText}>📄 Terms of Service</Text>
            </TouchableOpacity>
          </View>

          {/* Avatar + verification */}
          <BlurView intensity={24} tint="dark" style={styles.avatarCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {firstName ? firstName[0].toUpperCase() : '?'}
              </Text>
            </View>
            <View style={styles.avatarInfo}>
              <Text style={styles.avatarName}>
                {firstName} {lastName}
              </Text>
              <Text style={styles.avatarEmail}>{email}</Text>
              <View style={[styles.verifiedBadge, { backgroundColor: vc.bg }]}>
                <Text style={[styles.verifiedText, { color: vc.color }]}>{vc.label}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.docsBtn}
              onPress={() => router.push('/(caregiver)/id-verification' as any)}
            >
              <Text style={styles.docsBtnText}>📋 Docs</Text>
            </TouchableOpacity>
          </BlurView>

          {/* Basic info */}
          <Text style={styles.sectionTitle}>Basic Info</Text>
          <BlurView intensity={20} tint="dark" style={styles.formCard}>
            {[
              { label: 'FIRST NAME', key: 'first', icon: '👤', value: firstName, setter: setFirstName, placeholder: 'First name' },
              { label: 'LAST NAME', key: 'last', icon: '👤', value: lastName, setter: setLastName, placeholder: 'Last name' },
              { label: 'PHONE', key: 'phone', icon: '📞', value: phone, setter: setPhone, placeholder: '+254 7XX XXX XXX' },
              { label: 'LOCATION', key: 'location', icon: '📍', value: location, setter: setLocation, placeholder: 'e.g. Westlands, Nairobi' },
              { label: 'HOURLY RATE (KSH)', key: 'rate', icon: '💰', value: rate, setter: setRate, placeholder: '350', keyboardType: 'numeric' },
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
                  placeholder="Describe your experience..."
                  placeholderTextColor="rgba(186,230,253,0.3)"
                  multiline
                  textAlignVertical="top"
                  onFocus={() => setFocusedField('bio')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
            </View>
          </BlurView>

          {/* Services */}
          <Text style={styles.sectionTitle}>Services</Text>
          <BlurView intensity={20} tint="dark" style={styles.chipCard}>
            <View style={styles.chipWrap}>
              {SERVICES.map(s => (
                <TouchableOpacity
                  key={s}
                  style={[styles.chip, selectedServices.includes(s) && styles.chipActive]}
                  onPress={() => toggle(s, selectedServices, setSelectedServices)}
                >
                  <Text style={[styles.chipText, selectedServices.includes(s) && styles.chipTextActive]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </BlurView>

          {/* Age groups */}
          <Text style={styles.sectionTitle}>Age Groups</Text>
          <BlurView intensity={20} tint="dark" style={styles.chipCard}>
            <View style={styles.chipWrap}>
              {AGE_GROUPS.map(a => (
                <TouchableOpacity
                  key={a}
                  style={[styles.chip, selectedAges.includes(a) && styles.chipActiveGreen]}
                  onPress={() => toggle(a, selectedAges, setSelectedAges)}
                >
                  <Text style={[styles.chipText, selectedAges.includes(a) && styles.chipTextGreen]}>{a}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </BlurView>

          {/* Languages */}
          <Text style={styles.sectionTitle}>Languages</Text>
          <BlurView intensity={20} tint="dark" style={styles.chipCard}>
            <View style={styles.chipWrap}>
              {LANGUAGES.map(l => (
                <TouchableOpacity
                  key={l}
                  style={[styles.chip, selectedLangs.includes(l) && styles.chipActiveYellow]}
                  onPress={() => toggle(l, selectedLangs, setSelectedLangs)}
                >
                  <Text style={[styles.chipText, selectedLangs.includes(l) && styles.chipTextYellow]}>{l}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </BlurView>

          {/* Certifications */}
          <Text style={styles.sectionTitle}>Certifications</Text>
          <BlurView intensity={20} tint="dark" style={styles.chipCard}>
            <View style={styles.chipWrap}>
              {CERTIFICATIONS.map(c => (
                <TouchableOpacity
                  key={c}
                  style={[styles.chip, selectedCerts.includes(c) && styles.chipActivePurple]}
                  onPress={() => toggle(c, selectedCerts, setSelectedCerts)}
                >
                  <Text style={[styles.chipText, selectedCerts.includes(c) && styles.chipTextPurple]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </BlurView>

          {/* Save */}
          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnLoading]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.85}
          >
            <Text style={styles.saveBtnText}>{saving ? 'Saving...' : '✅ Save Profile'}</Text>
          </TouchableOpacity>

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
  orbTop: { width: 200, height: 200, backgroundColor: '#34D399', top: -60, right: -40 },
  safeArea: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 8 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  headerTitle: { fontSize: 24, fontWeight: '900', color: '#F0F9FF' },
  signOutBtn: { backgroundColor: 'rgba(248,113,113,0.1)', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 7, borderWidth: 1, borderColor: 'rgba(248,113,113,0.2)' },
  signOutText: { color: '#F87171', fontSize: 13, fontWeight: '600' },
  deleteBtn: { backgroundColor: 'rgba(239,68,68,0.08)', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)', marginTop: 8, alignItems: 'center' },
  deleteBtnText: { color: '#EF4444', fontSize: 13, fontWeight: '600' },
  legalBtn: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', marginTop: 8, alignItems: 'center' },
  legalBtnText: { color: 'rgba(186,230,253,0.5)', fontSize: 13, fontWeight: '600' },
  avatarCard: { borderRadius: 20, overflow: 'hidden', padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  avatar: { width: 56, height: 56, borderRadius: 18, backgroundColor: 'rgba(52,211,153,0.15)', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 24, fontWeight: '800', color: '#34D399' },
  avatarInfo: { flex: 1 },
  avatarName: { color: '#F0F9FF', fontWeight: '800', fontSize: 16 },
  avatarEmail: { color: 'rgba(186,230,253,0.4)', fontSize: 12, marginTop: 2 },
  verifiedBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, marginTop: 6, alignSelf: 'flex-start' },
  verifiedText: { fontSize: 11, fontWeight: '700' },
  docsBtn: { backgroundColor: 'rgba(56,189,248,0.1)', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7, borderWidth: 1, borderColor: 'rgba(56,189,248,0.2)' },
  docsBtnText: { color: '#38BDF8', fontSize: 11, fontWeight: '700' },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: '#F0F9FF', marginBottom: 10 },
  formCard: { borderRadius: 20, overflow: 'hidden', padding: 16, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  fieldBlock: { marginBottom: 14 },
  fieldLabel: { color: 'rgba(186,230,253,0.5)', fontSize: 11, fontWeight: '700', letterSpacing: 1.2, marginBottom: 8 },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 13, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 14, height: 50 },
  inputFocused: { borderColor: '#34D399', backgroundColor: 'rgba(52,211,153,0.06)' },
  textArea: { height: 110, alignItems: 'flex-start', paddingTop: 12 },
  inputIcon: { fontSize: 16, marginRight: 10 },
  input: { flex: 1, color: '#F0F9FF', fontSize: 14 },
  chipCard: { borderRadius: 18, overflow: 'hidden', padding: 14, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderRadius: 10, paddingHorizontal: 13, paddingVertical: 7, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.08)' },
  chipText: { color: 'rgba(186,230,253,0.5)', fontSize: 12, fontWeight: '600' },
  chipActive: { borderColor: '#38BDF8', backgroundColor: 'rgba(56,189,248,0.1)' },
  chipTextActive: { color: '#38BDF8' },
  chipActiveGreen: { borderColor: '#34D399', backgroundColor: 'rgba(52,211,153,0.1)' },
  chipTextGreen: { color: '#34D399' },
  chipActiveYellow: { borderColor: '#FBBF24', backgroundColor: 'rgba(251,191,36,0.1)' },
  chipTextYellow: { color: '#FBBF24' },
  chipActivePurple: { borderColor: '#A78BFA', backgroundColor: 'rgba(167,139,250,0.1)' },
  chipTextPurple: { color: '#A78BFA' },
  saveBtn: { backgroundColor: '#34D399', borderRadius: 16, paddingVertical: 16, alignItems: 'center', shadowColor: '#34D399', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 8 },
  saveBtnLoading: { opacity: 0.7 },
  saveBtnText: { color: '#080C14', fontWeight: '800', fontSize: 15 },
});
