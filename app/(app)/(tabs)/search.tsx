import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, TextInput, Dimensions, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { BlurView } from 'expo-blur';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../src/firebaseconfig';

const { width } = Dimensions.get('window');

const FILTERS = ['All', 'Nearby', 'Top Rated', 'Available', 'Verified'];

function StarRating({ rating }: { rating: number }) {
  return (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Text key={s} style={[styles.star, { opacity: s <= Math.round(rating) ? 1 : 0.25 }]}>★</Text>
      ))}
      <Text style={styles.ratingText}>{rating}</Text>
    </View>
  );
}

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [focused, setFocused] = useState(false);
  const [caregivers, setCaregivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCaregivers = async () => {
      try {
        const q = query(
          collection(db, 'users'),
          where('role', '==', 'caregiver'),
        );
        const snap = await getDocs(q);
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setCaregivers(data);
      } catch (e) {
        console.error('Error fetching caregivers:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchCaregivers();
  }, []);

  const filtered = caregivers.filter((c: any) => {
    const name = `${c.firstName ?? ''} ${c.lastName ?? ''}`.toLowerCase();
    const services = (c.services ?? []).join(' ').toLowerCase();
    const matchQuery = name.includes(searchQuery.toLowerCase()) ||
      services.includes(searchQuery.toLowerCase());
    if (activeFilter === 'Available') return matchQuery && c.available;
    if (activeFilter === 'Verified') return matchQuery && c.verificationStatus === 'verified';
    if (activeFilter === 'Top Rated') return matchQuery && (c.rating ?? 0) >= 4.8;
    return matchQuery;
  });

  return (
    <View style={styles.root}>
      <View style={styles.overlay} />
      <View style={[styles.orb, styles.orbTop]} />
      <View style={[styles.orb, styles.orbBottom]} />

      <SafeAreaView style={styles.safeArea}>
        {/* ── HEADER ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerSub}>Kenya's trusted network</Text>
            <Text style={styles.headerTitle}>Find Caregivers</Text>
          </View>
          <BlurView intensity={30} tint="dark" style={styles.mapBtn}>
            <TouchableOpacity onPress={() => router.push('/(app)/map' as any)} style={styles.mapBtnInner}>
              <Text style={styles.mapBtnText}>🗺️ Map</Text>
            </TouchableOpacity>
          </BlurView>
        </View>

        {/* ── SEARCH BAR ── */}
        <BlurView
          intensity={30} tint="dark"
          style={[styles.searchBar, focused && styles.searchBarFocused]}
        >
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or specialty..."
            placeholderTextColor="rgba(186,230,253,0.4)"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearBtn}>✕</Text>
            </TouchableOpacity>
          )}
        </BlurView>

        {/* ── FILTERS ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersRow}
          style={styles.filtersScroll}
        >
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setActiveFilter(f)}
              style={[styles.filterChip, activeFilter === f && styles.filterChipActive]}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterChipText, activeFilter === f && styles.filterChipTextActive]}>
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── RESULTS ── */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <View style={styles.centerState}>
              <ActivityIndicator color="#38BDF8" size="large" />
              <Text style={styles.centerStateText}>Finding caregivers...</Text>
            </View>
          ) : (
            <>
              <Text style={styles.resultsLabel}>
                {filtered.length} caregiver{filtered.length !== 1 ? 's' : ''} found
              </Text>

              {filtered.length === 0 ? (
                <BlurView intensity={25} tint="dark" style={styles.emptyCard}>
                  <Text style={styles.emptyEmoji}>🔎</Text>
                  <Text style={styles.emptyTitle}>No results found</Text>
                  <Text style={styles.emptySubtitle}>Try a different search or filter</Text>
                </BlurView>
              ) : (
                filtered.map((caregiver: any) => (
                  <TouchableOpacity
                    key={caregiver.id}
                    activeOpacity={0.85}
                    onPress={() => router.push(`/(app)/caregiver-profile?id=${caregiver.id}` as any)}
                  >
                    <BlurView intensity={25} tint="dark" style={styles.caregiverCard}>
                      {/* Top row */}
                      <View style={styles.cardTop}>
                        {/* Avatar */}
                        <View style={[styles.avatar, { backgroundColor: 'rgba(56,189,248,0.12)' }]}>
                          <Text style={styles.avatarEmoji}>👩🏾</Text>
                          {caregiver.available && <View style={styles.availableDot} />}
                        </View>

                        {/* Info */}
                        <View style={styles.cardInfo}>
                          <View style={styles.nameRow}>
                            <Text style={styles.caregiverName}>
                              {`${caregiver.firstName ?? ''} ${caregiver.lastName ?? ''}`.trim()}
                            </Text>
                            {caregiver.verificationStatus === 'verified' && (
                              <View style={styles.verifiedBadge}>
                                <Text style={styles.verifiedText}>✓ Verified</Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.caregiverRole}>
                            {caregiver.services?.[0] ?? 'Caregiver'}
                          </Text>
                          <StarRating rating={caregiver.rating ?? 4.5} />
                        </View>

                        {/* Rate */}
                        <View style={styles.rateBox}>
                          <Text style={styles.rateValue}>KSh {caregiver.rate ?? 350}</Text>
                          <Text style={styles.ratePer}>/hr</Text>
                        </View>
                      </View>

                      {/* Tags */}
                      <View style={styles.tagsRow}>
                        {(caregiver.services ?? []).slice(0, 3).map((tag: string) => (
                          <View key={tag} style={styles.tag}>
                            <Text style={styles.tagText}>{tag}</Text>
                          </View>
                        ))}
                        {caregiver.location && (
                          <View style={[styles.tag, styles.tagLocation]}>
                            <Text style={styles.tagText}>📍 {caregiver.location}</Text>
                          </View>
                        )}
                      </View>

                      {/* Book button */}
                      <TouchableOpacity
                        style={styles.bookBtn}
                        onPress={() => router.push(
                          `/(app)/booking?id=${caregiver.id}&name=${caregiver.firstName}` as any
                        )}
                        activeOpacity={0.85}
                      >
                        <Text style={styles.bookBtnText}>Book Now →</Text>
                      </TouchableOpacity>
                    </BlurView>
                  </TouchableOpacity>
                ))
              )}
            </>
          )}
          <View style={{ height: 20 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0F0C29' },
  overlay: { position: 'absolute', width: '100%', height: '100%', backgroundColor: 'rgba(10,8,35,0.9)' },
  orb: { position: 'absolute', borderRadius: 999, opacity: 0.12 },
  orbTop: { width: 220, height: 220, backgroundColor: '#38BDF8', top: -80, right: -60 },
  orbBottom: { width: 180, height: 180, backgroundColor: '#818CF8', bottom: 60, left: -60 },
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, marginBottom: 14 },
  headerSub: { color: 'rgba(186,230,253,0.5)', fontSize: 12, marginBottom: 2 },
  headerTitle: { fontSize: 24, fontWeight: '900', color: '#F0F9FF' },
  mapBtn: { borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  mapBtnInner: { paddingHorizontal: 14, paddingVertical: 10 },
  mapBtnText: { color: '#BAE6FD', fontSize: 13, fontWeight: '600' },
  searchBar: { marginHorizontal: 16, borderRadius: 16, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, height: 50, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  searchBarFocused: { borderColor: '#38BDF8' },
  searchIcon: { fontSize: 16, marginRight: 10 },
  searchInput: { flex: 1, color: '#F0F9FF', fontSize: 14 },
  clearBtn: { color: 'rgba(186,230,253,0.4)', fontSize: 16, paddingLeft: 8 },
  filtersScroll: { maxHeight: 48, marginBottom: 8 },
  filtersRow: { paddingHorizontal: 16, gap: 8, alignItems: 'center' },
  filterChip: { borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  filterChipActive: { backgroundColor: 'rgba(56,189,248,0.15)', borderColor: '#38BDF8' },
  filterChipText: { color: 'rgba(186,230,253,0.5)', fontSize: 13, fontWeight: '600' },
  filterChipTextActive: { color: '#38BDF8' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 4 },
  centerState: { alignItems: 'center', paddingTop: 80, gap: 12 },
  centerStateText: { color: 'rgba(186,230,253,0.5)', fontSize: 14 },
  resultsLabel: { color: 'rgba(186,230,253,0.4)', fontSize: 12, marginBottom: 12, letterSpacing: 0.5 },
  emptyCard: { borderRadius: 20, overflow: 'hidden', padding: 32, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { color: '#F0F9FF', fontSize: 18, fontWeight: '700', marginBottom: 6 },
  emptySubtitle: { color: 'rgba(186,230,253,0.4)', fontSize: 13 },
  caregiverCard: { borderRadius: 22, overflow: 'hidden', padding: 16, marginBottom: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  cardTop: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  avatar: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  avatarEmoji: { fontSize: 30 },
  availableDot: { position: 'absolute', bottom: 2, right: 2, width: 10, height: 10, borderRadius: 5, backgroundColor: '#34D399', borderWidth: 2, borderColor: '#0F0C29' },
  cardInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  caregiverName: { color: '#F0F9FF', fontWeight: '800', fontSize: 15 },
  verifiedBadge: { backgroundColor: 'rgba(52,211,153,0.15)', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  verifiedText: { color: '#34D399', fontSize: 10, fontWeight: '700' },
  caregiverRole: { color: 'rgba(186,230,253,0.5)', fontSize: 12, marginBottom: 4 },
  starRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  star: { color: '#FBBF24', fontSize: 12 },
  ratingText: { color: 'rgba(186,230,253,0.6)', fontSize: 11, marginLeft: 4 },
  rateBox: { alignItems: 'flex-end' },
  rateValue: { color: '#34D399', fontWeight: '800', fontSize: 15 },
  ratePer: { color: 'rgba(186,230,253,0.4)', fontSize: 11 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  tag: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: 'rgba(56,189,248,0.08)', borderWidth: 1, borderColor: 'rgba(56,189,248,0.15)' },
  tagLocation: { backgroundColor: 'rgba(52,211,153,0.08)', borderColor: 'rgba(52,211,153,0.15)' },
  tagText: { color: 'rgba(186,230,253,0.6)', fontSize: 11 },
  bookBtn: { backgroundColor: '#0284C7', borderRadius: 12, paddingVertical: 11, alignItems: 'center' },
  bookBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});
