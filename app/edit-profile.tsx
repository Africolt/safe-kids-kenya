import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import { auth, db, storage } from '../src/firebaseconfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../src/lib/ThemeContext';

export default function EditProfile() {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [photoURL, setPhotoURL] = useState('');

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
          setPhotoURL(d.photoURL ?? '');
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handlePickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow photo access to upload a profile picture.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setUploadingPhoto(true);
      try {
        const uid = auth.currentUser?.uid;
        if (!uid) return;
        const uri = result.assets[0].uri;
        const response = await fetch(uri);
        const blob = await response.blob();
        const storageRef = ref(storage, `profiles/${uid}/avatar.jpg`);
        await uploadBytes(storageRef, blob);
        const url = await getDownloadURL(storageRef);
        setPhotoURL(url);
        await updateDoc(doc(db, 'users', uid), { photoURL: url });
        Alert.alert('Photo updated ✅', 'Your profile photo has been saved.');
      } catch (e) {
        Alert.alert('Error', 'Could not upload photo. Try again.');
      } finally {
        setUploadingPhoto(false);
      }
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) return;
      await updateDoc(doc(db, 'users', uid), {
        firstName, lastName, phone, location,
        displayName: `${firstName} ${lastName}`.trim(),
      });
      Alert.alert('Saved ✅', 'Your profile has been updated.');
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
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          
          {/* Photo Upload */}
          <TouchableOpacity onPress={handlePickPhoto} style={styles.photoWrap} activeOpacity={0.85}>
            {photoURL ? (
              <Image source={{ uri: photoURL }} style={styles.photo} />
            ) : (
              <View style={[styles.photoPlaceholder, { backgroundColor: theme.surface }]}>
                <Text style={styles.photoPlaceholderText}>👤</Text>
              </View>
            )}
            <View style={[styles.photoBadge, { backgroundColor: theme.accent }]}>
              {uploadingPhoto ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.photoBadgeText}>📷</Text>
              )}
            </View>
          </TouchableOpacity>
          <Text style={[styles.photoHint, { color: theme.textMuted }]}>Tap to change profile photo</Text>

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
  content: { paddingHorizontal: 16, paddingTop: 24, gap: 12 },
  photoWrap: { alignSelf: 'center', marginBottom: 8, position: 'relative' },
  photo: { width: 90, height: 90, borderRadius: 45 },
  photoPlaceholder: { width: 90, height: 90, borderRadius: 45, alignItems: 'center', justifyContent: 'center' },
  photoPlaceholderText: { fontSize: 36 },
  photoBadge: { position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  photoBadgeText: { fontSize: 14 },
  photoHint: { textAlign: 'center', fontSize: 12, marginBottom: 8 },
  fieldCard: { borderRadius: 16, overflow: 'hidden', padding: 16, borderWidth: 1 },
  fieldLabel: { fontSize: 12, fontWeight: '700', marginBottom: 8, letterSpacing: 0.5 },
  fieldInput: { fontSize: 15, fontWeight: '500' },
});
