import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import { auth, db } from '../../src/firebaseconfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useTheme } from '../../src/lib/ThemeContext';

export default function EditProfile() {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const uid = auth.currentUser?.uid;
        if (!uid) return;
        const snap = await getDoc(doc(db, 'users', uid));
        const d = snap.data();
        if (d) {
          setFirstName(d.firstName ?? '');
          setLastName(d.lastName ?? '');
          setPhone(d.phone ?? '');
          setLocation(d.location ?? '');
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) return;
      await updateDoc(doc(db, 'users', uid), {
        firstName, lastName, phone, location,
        displayName: `${firstName} ${lastName}`.trim(),
      });
      Alert.alert('Saved!', 'Your profile has been updated.');
      router.back();
    } catch (e) {
      Alert.alert('Error', 'Could not save profile. Try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <View style={[styles.root, { backgroundColor: theme.bg, alignItems: 'center', justifyContent: 'center' }]}>
      <ActivityIndicator color={theme.accent} />
    </View>
  );

  return (
    <View style={[styles.root, { backgroundColor: theme.bg }]}>
      <SafeAreaView style={styles.safe}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: theme.surface }]}>
            <Text style={[styles.backText, { color: theme.accent }]}>←</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Edit Profile</Text>
          <TouchableOpacity onPress={handleSave} disabled={saving} style={[styles.saveBtn, { backgroundColor: theme.accent }]}>
            <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save'}</Text>
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.content}>
          {[
            { label: 'First Name', value: firstName, set: setFirstName, placeholder: 'Enter first name' },
            { label: 'Last Name', value: lastName, set: setLastName, placeholder: 'Enter last name' },
            { label: 'Phone Number', value: phone, set: setPhone, placeholder: '+254 7XX XXX XXX', keyboard: 'phone-pad' },
            { label: 'Location', value: location, set: setLocation, placeholder: 'e.g. Westlands, Nairobi' },
          ].map((field, i) => (
            <BlurView key={i} intensity={18} tint={theme.blurTint} style={[styles.fieldCard, { borderColor: theme.border }]}>
              <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>{field.label}</Text>
              <TextInput
                value={field.value}
                onChangeText={field.set}
                placeholder={field.placeholder}
                placeholderTextColor={theme.textFaint}
                keyboardType={(field.keyboard as any) ?? 'default'}
                style={[styles.fieldInput, { color: theme.text }]}
              />
            </BlurView>
          ))}
          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  backBtn: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 18 },
  headerTitle: { fontWeight: '800', fontSize: 16 },
  saveBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  content: { padding: 16, gap: 12 },
  fieldCard: { borderRadius: 16, overflow: 'hidden', padding: 16, borderWidth: 1 },
  fieldLabel: { fontSize: 12, fontWeight: '700', marginBottom: 8, letterSpacing: 0.5 },
  fieldInput: { fontSize: 15, fontWeight: '500' },
});
