import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';

type DocStatus = 'empty' | 'uploaded' | 'verified' | 'rejected';

interface Doc { label: string; emoji: string; desc: string; status: DocStatus; note?: string; }

export default function IDVerification() {
  const [docs, setDocs] = useState<Doc[]>([
    { label: 'National ID (Front)', emoji: '🪪', desc: 'Clear photo of your Kenya National ID front', status: 'verified' },
    { label: 'National ID (Back)', emoji: '🪪', desc: 'Clear photo of your Kenya National ID back', status: 'verified' },
    { label: 'Certificate of Good Conduct', emoji: '📋', desc: 'DCI Kenya certificate, less than 1 year old', status: 'uploaded', note: 'Under review — 24-48 hrs' },
    { label: 'Profile Photo', emoji: '📸', desc: 'Clear headshot, neutral background', status: 'empty' },
    { label: 'Childcare Certificate', emoji: '🎓', desc: 'Any relevant childcare or education qualification (optional)', status: 'empty' },
  ]);

  const handleUpload = (index: number) => {
    Alert.alert(
      `Upload ${docs[index].label}`,
      'Choose source',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Take Photo', onPress: () => markUploaded(index) },
        { text: 'Choose from Gallery', onPress: () => markUploaded(index) },
      ]
    );
  };

  const markUploaded = (index: number) => {
    setDocs(prev => prev.map((d, i) => i === index ? { ...d, status: 'uploaded', note: 'Under review — 24-48 hrs' } : d));
  };

  const statusConfig: Record<DocStatus, { color: string; bg: string; label: string; emoji: string }> = {
    empty:    { color: 'rgba(186,230,253,0.4)', bg: 'rgba(255,255,255,0.05)', label: 'Not Uploaded', emoji: '📤' },
    uploaded: { color: '#FBBF24', bg: 'rgba(251,191,36,0.1)', label: 'Under Review', emoji: '⏳' },
    verified: { color: '#34D399', bg: 'rgba(52,211,153,0.1)', label: 'Verified', emoji: '✓' },
    rejected: { color: '#F87171', bg: 'rgba(248,113,113,0.1)', label: 'Rejected', emoji: '✕' },
  };

  const allVerified = docs.filter(d => d.label !== 'Childcare Certificate').every(d => d.status === 'verified');
  const verifiedCount = docs.filter(d => d.status === 'verified').length;

  return (
    <View style={styles.root}>
      <View style={styles.overlay} />
      <View style={[styles.orb, styles.orbTop]} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>ID Verification</Text>
          <View style={styles.progressBadge}>
            <Text style={styles.progressBadgeText}>{verifiedCount}/{docs.length}</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* Status banner */}
          <BlurView intensity={24} tint="dark" style={[styles.statusBanner, allVerified && styles.statusBannerDone]}>
            <Text style={styles.statusBannerEmoji}>{allVerified ? '🛡️' : '⏳'}</Text>
            <View style={styles.statusBannerText}>
              <Text style={styles.statusBannerTitle}>
                {allVerified ? 'Fully Verified' : 'Verification Pending'}
              </Text>
              <Text style={styles.statusBannerSub}>
                {allVerified
                  ? 'Your profile is fully verified and visible to parents'
                  : 'Upload required documents to start receiving bookings'}
              </Text>
            </View>
          </BlurView>

          {/* Progress bar */}
          <BlurView intensity={20} tint="dark" style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>Verification Progress</Text>
              <Text style={styles.progressPct}>{Math.round((verifiedCount / docs.length) * 100)}%</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${(verifiedCount / docs.length) * 100}%` }]} />
            </View>
          </BlurView>

          {/* Info box */}
          <BlurView intensity={18} tint="dark" style={styles.infoBox}>
            <Text style={styles.infoText}>
              💡 Certificate of Good Conduct costs KSh 1,050 from any DCI Kenya office or via eCitizen. It takes 1–2 weeks to process.
            </Text>
          </BlurView>

          {/* Documents */}
          <Text style={styles.sectionTitle}>Required Documents</Text>
          {docs.map((doc, i) => {
            const config = statusConfig[doc.status];
            return (
              <BlurView key={i} intensity={20} tint="dark" style={styles.docCard}>
                <View style={styles.docHeader}>
                  <View style={[styles.docIconBox, { backgroundColor: config.bg }]}>
                    <Text style={styles.docEmoji}>{doc.emoji}</Text>
                  </View>
                  <View style={styles.docInfo}>
                    <Text style={styles.docLabel}>{doc.label}</Text>
                    <Text style={styles.docDesc}>{doc.desc}</Text>
                    {doc.note && <Text style={[styles.docNote, { color: config.color }]}>{doc.note}</Text>}
                  </View>
                  <View style={[styles.docStatusBadge, { backgroundColor: config.bg }]}>
                    <Text style={[styles.docStatusText, { color: config.color }]}>{config.emoji} {config.label}</Text>
                  </View>
                </View>

                {doc.status === 'empty' || doc.status === 'rejected' ? (
                  <TouchableOpacity style={styles.uploadBtn} onPress={() => handleUpload(i)} activeOpacity={0.85}>
                    <Text style={styles.uploadBtnText}>
                      {doc.status === 'rejected' ? '🔄 Re-upload Document' : '📤 Upload Document'}
                    </Text>
                  </TouchableOpacity>
                ) : doc.status === 'uploaded' ? (
                  <View style={styles.uploadedRow}>
                    <Text style={styles.uploadedText}>✓ Uploaded — awaiting admin review</Text>
                    <TouchableOpacity onPress={() => handleUpload(i)}>
                      <Text style={styles.reuploadText}>Replace</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.verifiedRow}>
                    <Text style={styles.verifiedText}>✓ Verified by Safe Kids team</Text>
                  </View>
                )}
              </BlurView>
            );
          })}

          {/* Help */}
          <BlurView intensity={18} tint="dark" style={styles.helpCard}>
            <Text style={styles.helpTitle}>Need help?</Text>
            <Text style={styles.helpText}>If your document was rejected or you need assistance, contact our support team.</Text>
            <TouchableOpacity style={styles.helpBtn}>
              <Text style={styles.helpBtnText}>💬 Contact Support</Text>
            </TouchableOpacity>
          </BlurView>

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
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, marginBottom: 16, gap: 8 },
  backBtn: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8 },
  backBtnText: { color: '#BAE6FD', fontSize: 14 },
  headerTitle: { flex: 1, fontSize: 20, fontWeight: '800', color: '#F0F9FF' },
  progressBadge: { backgroundColor: 'rgba(52,211,153,0.12)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 5 },
  progressBadgeText: { color: '#34D399', fontSize: 13, fontWeight: '800' },
  scrollContent: { paddingHorizontal: 16 },
  statusBanner: { borderRadius: 20, overflow: 'hidden', padding: 16, flexDirection: 'row', gap: 12, alignItems: 'center', marginBottom: 14, borderWidth: 1, borderColor: 'rgba(251,191,36,0.2)' },
  statusBannerDone: { borderColor: 'rgba(52,211,153,0.25)' },
  statusBannerEmoji: { fontSize: 32 },
  statusBannerText: { flex: 1 },
  statusBannerTitle: { color: '#F0F9FF', fontWeight: '800', fontSize: 15 },
  statusBannerSub: { color: 'rgba(186,230,253,0.5)', fontSize: 12, marginTop: 4, lineHeight: 18 },
  progressCard: { borderRadius: 18, overflow: 'hidden', padding: 16, marginBottom: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  progressTitle: { color: '#F0F9FF', fontWeight: '700', fontSize: 13 },
  progressPct: { color: '#34D399', fontWeight: '800', fontSize: 14 },
  progressTrack: { height: 6, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 6, backgroundColor: '#34D399', borderRadius: 3 },
  infoBox: { borderRadius: 14, overflow: 'hidden', padding: 14, marginBottom: 18, borderWidth: 1, borderColor: 'rgba(56,189,248,0.15)' },
  infoText: { color: 'rgba(186,230,253,0.6)', fontSize: 13, lineHeight: 20 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#F0F9FF', marginBottom: 10 },
  docCard: { borderRadius: 20, overflow: 'hidden', padding: 16, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  docHeader: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', marginBottom: 14 },
  docIconBox: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  docEmoji: { fontSize: 22 },
  docInfo: { flex: 1 },
  docLabel: { color: '#F0F9FF', fontWeight: '700', fontSize: 14 },
  docDesc: { color: 'rgba(186,230,253,0.45)', fontSize: 12, marginTop: 3, lineHeight: 17 },
  docNote: { fontSize: 11, fontWeight: '600', marginTop: 4 },
  docStatusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, alignSelf: 'flex-start' },
  docStatusText: { fontSize: 10, fontWeight: '700' },
  uploadBtn: { borderRadius: 12, paddingVertical: 11, alignItems: 'center', backgroundColor: 'rgba(56,189,248,0.1)', borderWidth: 1.5, borderColor: 'rgba(56,189,248,0.25)' },
  uploadBtnText: { color: '#38BDF8', fontSize: 13, fontWeight: '700' },
  uploadedRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(251,191,36,0.06)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9 },
  uploadedText: { color: '#FBBF24', fontSize: 12 },
  reuploadText: { color: 'rgba(186,230,253,0.4)', fontSize: 12 },
  verifiedRow: { backgroundColor: 'rgba(52,211,153,0.06)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9 },
  verifiedText: { color: '#34D399', fontSize: 12, fontWeight: '600' },
  helpCard: { borderRadius: 18, overflow: 'hidden', padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', marginTop: 4 },
  helpTitle: { color: '#F0F9FF', fontWeight: '700', fontSize: 14, marginBottom: 6 },
  helpText: { color: 'rgba(186,230,253,0.5)', fontSize: 13, lineHeight: 20, marginBottom: 12 },
  helpBtn: { borderRadius: 12, paddingVertical: 11, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  helpBtnText: { color: 'rgba(186,230,253,0.6)', fontSize: 13, fontWeight: '600' },
});
