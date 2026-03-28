import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Linking, Alert, Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');

const EMERGENCY_NUMBERS = [
  {
    id: '1', name: 'Police', number: '999', shortcode: '999',
    emoji: '👮', color: '#3B82F6', bg: 'rgba(59,130,246,0.12)',
    description: 'Kenya Police Service — crime, violence, immediate danger',
    available: '24/7',
  },
  {
    id: '2', name: 'Ambulance', number: '999', shortcode: '999',
    emoji: '🚑', color: '#F87171', bg: 'rgba(248,113,113,0.12)',
    description: 'Medical emergency, injury, unconscious person',
    available: '24/7',
  },
  {
    id: '3', name: 'Fire Brigade', number: '999', shortcode: '999',
    emoji: '🚒', color: '#FB923C', bg: 'rgba(251,146,60,0.12)',
    description: 'Fire, gas leak, hazardous situations',
    available: '24/7',
  },
  {
    id: '4', name: 'Childline Kenya', number: '116', shortcode: '116',
    emoji: '🧒', color: '#34D399', bg: 'rgba(52,211,153,0.12)',
    description: 'Child abuse, neglect, exploitation — free & confidential',
    available: '24/7 Free',
  },
  {
    id: '5', name: 'Gender Violence Hotline', number: '0800720601', shortcode: '0800 720 601',
    emoji: '💜', color: '#A78BFA', bg: 'rgba(167,139,250,0.12)',
    description: 'Domestic violence, gender-based violence, free & confidential',
    available: '24/7 Free',
  },
  {
    id: '6', name: 'Safe Kids Helpline', number: '0800123456', shortcode: '0800 123 456',
    emoji: '🛡️', color: '#38BDF8', bg: 'rgba(56,189,248,0.12)',
    description: 'Safe Kids Kenya support line — booking issues, safety concerns',
    available: '6AM–10PM',
  },
];

const FAMILY_CONTACTS = [
  { name: 'Mom', number: '+254 712 000 001', emoji: '👩' },
  { name: 'Dad', number: '+254 712 000 002', emoji: '👨' },
  { name: 'Aunt Sarah', number: '+254 712 000 003', emoji: '👩' },
];

const TIPS = [
  { emoji: '📍', tip: 'Always know your child\'s location before an emergency happens' },
  { emoji: '🗣️', tip: 'Teach children to shout "FIRE" instead of "HELP" — more people respond' },
  { emoji: '📱', tip: 'Save emergency numbers in your child\'s phone under ICE (In Case of Emergency)' },
  { emoji: '🏠', tip: 'Teach children your home address and a nearby landmark' },
  { emoji: '✋', tip: 'Teach the "Stranger Danger" rule — never get in a car with strangers' },
];

export default function EmergencyScreen() {
  const [calling, setCalling] = useState<string | null>(null);

  const handleCall = (number: string, name: string) => {
    Alert.alert(
      `Call ${name}`,
      `Dial ${number}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: `Call ${number}`,
          style: 'destructive',
          onPress: () => {
            setCalling(number);
            Linking.openURL(`tel:${number}`).finally(() => setCalling(null));
          },
        },
      ]
    );
  };

  return (
    <View style={styles.root}>
      <View style={styles.overlay} />
      <View style={[styles.orb, styles.orbTop]} />
      <View style={[styles.orb, styles.orbBottom]} />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Emergency Contacts</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Hero */}
          <BlurView intensity={25} tint="dark" style={styles.heroCard}>
            <Text style={styles.heroEmoji}>🚨</Text>
            <View style={styles.heroText}>
              <Text style={styles.heroTitle}>In an emergency, act fast</Text>
              <Text style={styles.heroSub}>Tap any number to call immediately</Text>
            </View>
          </BlurView>

          {/* Emergency numbers */}
          <Text style={styles.sectionLabel}>EMERGENCY SERVICES</Text>
          {EMERGENCY_NUMBERS.map(contact => (
            <TouchableOpacity
              key={contact.id}
              onPress={() => handleCall(contact.number, contact.name)}
              activeOpacity={0.8}
            >
              <BlurView intensity={20} tint="dark" style={styles.contactCard}>
                <View style={[styles.contactIcon, { backgroundColor: contact.bg }]}>
                  <Text style={styles.contactEmoji}>{contact.emoji}</Text>
                </View>
                <View style={styles.contactInfo}>
                  <View style={styles.contactNameRow}>
                    <Text style={styles.contactName}>{contact.name}</Text>
                    <View style={styles.availableBadge}>
                      <Text style={styles.availableText}>{contact.available}</Text>
                    </View>
                  </View>
                  <Text style={styles.contactDesc}>{contact.description}</Text>
                </View>
                <View style={[styles.callBtn, { backgroundColor: contact.bg }]}>
                  <Text style={[styles.callBtnNumber, { color: contact.color }]}>
                    {contact.shortcode}
                  </Text>
                  <Text style={[styles.callBtnIcon, { color: contact.color }]}>📞</Text>
                </View>
              </BlurView>
            </TouchableOpacity>
          ))}

          {/* Family contacts */}
          <Text style={styles.sectionLabel}>FAMILY CONTACTS</Text>
          <BlurView intensity={20} tint="dark" style={styles.familyCard}>
            {FAMILY_CONTACTS.map((contact, i) => (
              <View key={i}>
                <View style={styles.familyRow}>
                  <View style={styles.familyAvatar}>
                    <Text style={styles.familyAvatarText}>{contact.emoji}</Text>
                  </View>
                  <View style={styles.familyInfo}>
                    <Text style={styles.familyName}>{contact.name}</Text>
                    <Text style={styles.familyNumber}>{contact.number}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.familyCallBtn}
                    onPress={() => handleCall(contact.number.replace(/\s/g, ''), contact.name)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.familyCallEmoji}>📞</Text>
                  </TouchableOpacity>
                </View>
                {i < FAMILY_CONTACTS.length - 1 && <View style={styles.familyDivider} />}
              </View>
            ))}
            <TouchableOpacity style={styles.addContactBtn} onPress={() => Alert.alert('Coming Soon', 'Custom emergency contacts will be available in the next update.')}>
              <Text style={styles.addContactText}>+ Add Emergency Contact</Text>
            </TouchableOpacity>
          </BlurView>

          {/* Safety tips */}
          <Text style={styles.sectionLabel}>SAFETY TIPS</Text>
          <BlurView intensity={20} tint="dark" style={styles.tipsCard}>
            {TIPS.map((item, i) => (
              <View key={i} style={[styles.tipRow, i < TIPS.length - 1 && styles.tipDivider]}>
                <Text style={styles.tipEmoji}>{item.emoji}</Text>
                <Text style={styles.tipText}>{item.tip}</Text>
              </View>
            ))}
          </BlurView>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#080C14' },
  overlay: { position: 'absolute', width: '100%', height: '100%', backgroundColor: 'rgba(8,12,20,0.95)' },
  orb: { position: 'absolute', borderRadius: 999, opacity: 0.1 },
  orbTop: { width: 200, height: 200, backgroundColor: '#F87171', top: -60, right: -40 },
  orbBottom: { width: 160, height: 160, backgroundColor: '#3B82F6', bottom: 80, left: -40 },
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, marginBottom: 16 },
  backBtn: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8 },
  backBtnText: { color: '#BAE6FD', fontSize: 14 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#F0F9FF' },
  scrollContent: { paddingHorizontal: 16 },

  heroCard: { borderRadius: 20, overflow: 'hidden', padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20, borderWidth: 1.5, borderColor: 'rgba(248,113,113,0.25)' },
  heroEmoji: { fontSize: 36 },
  heroText: { flex: 1 },
  heroTitle: { color: '#F0F9FF', fontWeight: '800', fontSize: 16 },
  heroSub: { color: 'rgba(186,230,253,0.5)', fontSize: 12, marginTop: 3 },

  sectionLabel: { color: 'rgba(186,230,253,0.4)', fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 10 },

  contactCard: { borderRadius: 18, overflow: 'hidden', marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  contactIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  contactEmoji: { fontSize: 24 },
  contactInfo: { flex: 1 },
  contactNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  contactName: { color: '#F0F9FF', fontWeight: '700', fontSize: 14 },
  availableBadge: { backgroundColor: 'rgba(52,211,153,0.12)', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  availableText: { color: '#34D399', fontSize: 10, fontWeight: '600' },
  contactDesc: { color: 'rgba(186,230,253,0.5)', fontSize: 11, lineHeight: 16 },
  callBtn: { borderRadius: 12, padding: 10, alignItems: 'center', minWidth: 56 },
  callBtnNumber: { fontSize: 13, fontWeight: '800' },
  callBtnIcon: { fontSize: 14, marginTop: 2 },

  familyCard: { borderRadius: 20, overflow: 'hidden', marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', padding: 16 },
  familyRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  familyDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)' },
  familyAvatar: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(56,189,248,0.12)', alignItems: 'center', justifyContent: 'center' },
  familyAvatarText: { fontSize: 20 },
  familyInfo: { flex: 1 },
  familyName: { color: '#F0F9FF', fontWeight: '600', fontSize: 14 },
  familyNumber: { color: 'rgba(186,230,253,0.5)', fontSize: 12, marginTop: 2 },
  familyCallBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(56,189,248,0.1)', alignItems: 'center', justifyContent: 'center' },
  familyCallEmoji: { fontSize: 18 },
  addContactBtn: { marginTop: 12, paddingVertical: 10, alignItems: 'center', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(56,189,248,0.2)', borderStyle: 'dashed' },
  addContactText: { color: '#38BDF8', fontSize: 13, fontWeight: '600' },

  tipsCard: { borderRadius: 20, overflow: 'hidden', marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', padding: 16 },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 10 },
  tipDivider: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  tipEmoji: { fontSize: 20 },
  tipText: { flex: 1, color: 'rgba(186,230,253,0.65)', fontSize: 13, lineHeight: 20 },
});
