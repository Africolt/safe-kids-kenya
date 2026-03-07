import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Image, TextInput, Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');

const FILTERS = ['All', 'Nearby', 'Top Rated', 'Available', 'Verified'];

const CAREGIVERS = [
  {
    id: 1, name: 'Amina Wanjiku', role: 'Nanny & Tutor',
    rating: 4.9, reviews: 38, distance: '0.8 km',
    tags: ['Ages 2–10', 'First Aid', 'Homework Help'],
    available: true, verified: true, emoji: '👩🏾',
    color: '#38BDF8',
  },
  {
    id: 2, name: 'Brian Otieno', role: 'Child Caregiver',
    rating: 4.7, reviews: 21, distance: '1.2 km',
    tags: ['Ages 5–15', 'Sports', 'Music'],
    available: true, verified: true, emoji: '👨🏿',
    color: '#34D399',
  },
  {
    id: 3, name: 'Grace Muthoni', role: 'Early Childhood',
    rating: 4.8, reviews: 55, distance: '2.1 km',
    tags: ['Ages 0–6', 'CPR Certified', 'Montessori'],
    available: false, verified: true, emoji: '👩🏽',
    color: '#FBBF24',
  },
  {
    id: 4, name: 'David Kamau', role: 'After-School Carer',
    rating: 4.5, reviews: 14, distance: '3.0 km',
    tags: ['Ages 6–16', 'Tutoring', 'Cooking'],
    available: true, verified: false, emoji: '👨🏾',
    color: '#60A5FA',
  },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Text key={s} style={[styles.star, { opacity: s <= Math.round(rating) ? 1 : 0.25 }]}>
          ★
        </Text>
      ))}
      <Text style={styles.ratingText}>{rating}</Text>
    </View>
  );
}

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [focused, setFocused] = useState(false);

  const filtered = CAREGIVERS.filter(c => {
    const matchQuery = c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.role.toLowerCase().includes(query.toLowerCase());
    if (activeFilter === 'Nearby') return matchQuery && parseFloat(c.distance) < 1.5;
    if (activeFilter === 'Top Rated') return matchQuery && c.rating >= 4.8;
    if (activeFilter === 'Available') return matchQuery && c.available;
    if (activeFilter === 'Verified') return matchQuery && c.verified;
    return matchQuery;
  });

  return (
    <View style={styles.root}>
      <Image
        source={require('../../../assets/images/kids-hero.png')}
        style={styles.bgImage}
        resizeMode="cover"
      />
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
            <TouchableOpacity onPress={() => router.push('/map')} style={styles.mapBtnInner}>
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
            value={query}
            onChangeText={setQuery}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
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
            filtered.map((caregiver) => (
              <TouchableOpacity
                key={caregiver.id}
                activeOpacity={0.85}
                onPress={() => router.push(`/caregiver/${caregiver.id}` as any)}
              >
                <BlurView intensity={25} tint="dark" style={styles.caregiverCard}>
                  {/* Top row */}
                  <View style={styles.cardTop}>
                    {/* Avatar */}
                    <View style={[styles.avatar, { backgroundColor: `${caregiver.color}22` }]}>
                      <Text style={styles.avatarEmoji}>{caregiver.emoji}</Text>
                      {caregiver.available && <View style={styles.availableDot} />}
                    </View>

                    {/* Info */}
                    <View style={styles.cardInfo}>
                      <View style={styles.nameRow}>
                        <Text style={styles.caregiverName}>{caregiver.name}</Text>
                        {caregiver.verified && (
                          <View style={styles.verifiedBadge}>
                            <Text style={styles.verifiedText}>✓ Verified</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.caregiverRole}>{caregiver.role}</Text>
                      <StarRating rating={caregiver.rating} />
                    </View>

                    {/* Distance */}
                    <View style={styles.distanceWrap}>
                      <Text style={styles.distanceIcon}>📍</Text>
                      <Text style={styles.distanceText}>{caregiver.distance}</Text>
                    </View>
                  </View>

                  {/* Tags */}
                  <View style={styles.tagsRow}>
                    {caregiver.tags.map((tag) => (
                      <View key={tag} style={[styles.tag, { backgroundColor: `${caregiver.color}18` }]}>
                        <Text style={[styles.tagText, { color: caregiver.color }]}>{tag}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Card footer */}
                  <View style={styles.cardFooter}>
                    <View style={[
                      styles.availabilityChip,
                      caregiver.available ? styles.availableChip : styles.unavailableChip
                    ]}>
                      <Text style={[
                        styles.availabilityText,
                        caregiver.available ? styles.availableText : styles.unavailableText
                      ]}>
                        {caregiver.available ? '● Available now' : '○ Unavailable'}
                      </Text>
                    </View>
                    <TouchableOpacity style={styles.bookBtn} activeOpacity={0.8}>
                      <Text style={styles.bookBtnText}>Book Session →</Text>
                    </TouchableOpacity>
                  </View>
                </BlurView>
              </TouchableOpacity>
            ))
          )}

          <View style={{ height: 20 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0F0C29' },
  bgImage: { position: 'absolute', width: '100%', height: '100%' },
  overlay: {
    position: 'absolute', width: '100%', height: '100%',
    backgroundColor: 'rgba(10, 8, 35, 0.9)',
  },
  orb: { position: 'absolute', borderRadius: 999, opacity: 0.12 },
  orbTop: { width: 200, height: 200, backgroundColor: '#0284C7', top: -50, left: -50 },
  orbBottom: { width: 160, height: 160, backgroundColor: '#34D399', bottom: 120, right: -40 },
  safeArea: { flex: 1, paddingHorizontal: 16 },

  // Header
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingTop: 12, marginBottom: 16,
  },
  headerSub: { fontSize: 12, color: 'rgba(186,230,253,0.6)', marginBottom: 2 },
  headerTitle: { fontSize: 26, fontWeight: '900', color: '#F5F3FF', letterSpacing: -0.8 },
  mapBtn: {
    borderRadius: 14, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  mapBtnInner: { paddingHorizontal: 14, paddingVertical: 10 },
  mapBtnText: { color: '#38BDF8', fontWeight: '700', fontSize: 13 },

  // Search
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 16, overflow: 'hidden',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 14, height: 50, marginBottom: 14,
  },
  searchBarFocused: { borderColor: '#0284C7' },
  searchIcon: { fontSize: 16, marginRight: 10 },
  searchInput: { flex: 1, color: '#F5F3FF', fontSize: 14 },
  clearBtn: { color: 'rgba(186,230,253,0.4)', fontSize: 16, padding: 4 },

  // Filters
  filtersScroll: { marginBottom: 16, flexGrow: 0 },
  filtersRow: { gap: 8, paddingRight: 8 },
  filterChip: {
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  filterChipActive: {
    backgroundColor: 'rgba(2,132,199,0.3)',
    borderColor: '#0284C7',
  },
  filterChipText: { color: 'rgba(186,230,253,0.6)', fontSize: 13, fontWeight: '600' },
  filterChipTextActive: { color: '#38BDF8' },

  // Results
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 32 },
  resultsLabel: {
    color: 'rgba(186,230,253,0.5)', fontSize: 12,
    fontWeight: '600', marginBottom: 12,
  },

  // Caregiver card
  caregiverCard: {
    borderRadius: 20, overflow: 'hidden', marginBottom: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', padding: 16,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  avatar: {
    width: 52, height: 52, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 12, position: 'relative',
  },
  avatarEmoji: { fontSize: 28 },
  availableDot: {
    position: 'absolute', bottom: 2, right: 2,
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: '#34D399', borderWidth: 2, borderColor: '#0F0C29',
  },
  cardInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  caregiverName: { color: '#F5F3FF', fontWeight: '800', fontSize: 15 },
  verifiedBadge: {
    backgroundColor: 'rgba(52,211,153,0.15)', borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  verifiedText: { color: '#34D399', fontSize: 10, fontWeight: '700' },
  caregiverRole: { color: 'rgba(186,230,253,0.6)', fontSize: 12, marginBottom: 6 },
  distanceWrap: { alignItems: 'center' },
  distanceIcon: { fontSize: 12 },
  distanceText: { color: 'rgba(186,230,253,0.5)', fontSize: 11, fontWeight: '600' },

  // Stars
  starRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  star: { color: '#FBBF24', fontSize: 12 },
  ratingText: { color: 'rgba(186,230,253,0.6)', fontSize: 11, marginLeft: 4 },

  // Tags
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  tag: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  tagText: { fontSize: 11, fontWeight: '600' },

  // Footer
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  availabilityChip: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  availableChip: { backgroundColor: 'rgba(52,211,153,0.12)' },
  unavailableChip: { backgroundColor: 'rgba(186,230,253,0.08)' },
  availabilityText: { fontSize: 11, fontWeight: '600' },
  availableText: { color: '#34D399' },
  unavailableText: { color: 'rgba(186,230,253,0.4)' },
  bookBtn: {
    backgroundColor: '#0284C7', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  bookBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  // Empty
  emptyCard: {
    borderRadius: 20, overflow: 'hidden', padding: 40,
    alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { color: '#F5F3FF', fontWeight: '700', fontSize: 16, marginBottom: 6 },
  emptySubtitle: { color: 'rgba(186,230,253,0.5)', fontSize: 13 },
});
