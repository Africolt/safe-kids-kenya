import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'online', label: 'Online Safety' },
  { id: 'physical', label: 'Physical Safety' },
  { id: 'emotional', label: 'Emotional Wellbeing' },
  { id: 'education', label: 'Education' },
];

const ARTICLES = [
  {
    id: '1', category: 'online',
    emoji: '🌐', color: '#38BDF8',
    title: 'Keeping Kids Safe Online',
    summary: 'Practical tips for monitoring your child\'s internet usage and protecting them from online dangers.',
    readTime: '5 min read',
    tips: [
      'Use parental controls on all devices',
      'Keep devices in common areas of the home',
      'Have open conversations about online safety',
      'Teach children never to share personal info',
      'Monitor social media and messaging apps',
      'Set screen time limits and enforce them',
    ],
  },
  {
    id: '2', category: 'physical',
    emoji: '🏫', color: '#34D399',
    title: 'School Route Safety',
    summary: 'How to ensure your child safely travels to and from school every day.',
    readTime: '4 min read',
    tips: [
      'Walk the route with your child first',
      'Teach them to stay on pavements',
      'Identify safe stops along the route',
      'Teach them to avoid strangers',
      'Share a "code word" for emergencies',
      'Register pickup persons with the school',
    ],
  },
  {
    id: '3', category: 'emotional',
    emoji: '💝', color: '#F472B6',
    title: 'Building Trust With Your Child',
    summary: 'Creating an environment where children feel safe to communicate their fears and concerns.',
    readTime: '6 min read',
    tips: [
      'Schedule daily check-in conversations',
      'Listen without immediately offering solutions',
      'Validate their feelings always',
      'Share age-appropriate stories from your day',
      'Create a family safe word for discomfort',
      'Praise honesty and openness',
    ],
  },
  {
    id: '4', category: 'physical',
    emoji: '🆘', color: '#F87171',
    title: 'Emergency Preparedness',
    summary: 'Teaching your child what to do in case of an emergency when they are alone or with a caregiver.',
    readTime: '7 min read',
    tips: [
      'Teach them to memorize your phone number',
      'Know the nearest safe places — hospital, police',
      'Practice "stop, drop, roll" for fire safety',
      'Teach them to call 999 or 112 in emergencies',
      'Role play emergency scenarios regularly',
      'Give them a written emergency card',
    ],
  },
  {
    id: '5', category: 'online',
    emoji: '📱', color: '#FBBF24',
    title: 'Social Media & Children',
    summary: 'Age-appropriate guidance on social media use and protecting your child\'s digital identity.',
    readTime: '5 min read',
    tips: [
      'Most platforms require users to be 13+',
      'Review privacy settings together',
      'Teach them about cyberbullying',
      'Never post location or school name publicly',
      'Keep profiles private, not public',
      'Report and block bullies immediately',
    ],
  },
  {
    id: '6', category: 'education',
    emoji: '📚', color: '#A78BFA',
    title: 'Working with Caregivers on Education',
    summary: 'How to partner with your child\'s caregiver to support their academic growth after school.',
    readTime: '4 min read',
    tips: [
      'Share your child\'s school timetable with caregiver',
      'Set clear homework expectations',
      'Provide necessary learning materials at home',
      'Review homework together in evenings',
      'Communicate regularly with caregiver on progress',
      'Celebrate small academic wins together',
    ],
  },
  {
    id: '7', category: 'emotional',
    emoji: '🤝', color: '#34D399',
    title: 'Introducing a New Caregiver',
    summary: 'How to help your child adjust to a new caregiver and build a healthy relationship.',
    readTime: '5 min read',
    tips: [
      'Introduce caregiver gradually, not abruptly',
      'Stay present during first few sessions',
      'Let the child set the pace of the relationship',
      'Speak positively about the caregiver',
      'Listen to any discomfort your child expresses',
      'Do a trial run before full-time arrangement',
    ],
  },
  {
    id: '8', category: 'physical',
    emoji: '🏥', color: '#F87171',
    title: 'First Aid Basics for Parents',
    summary: 'Essential first aid knowledge every parent and caregiver should know.',
    readTime: '8 min read',
    tips: [
      'Learn CPR — enroll in a local course',
      'Keep a first aid kit accessible at home',
      'Know how to treat cuts, burns, choking',
      'Share medical info with caregivers',
      'Know your child\'s allergies and medications',
      'Post emergency numbers visibly at home',
    ],
  },
];

export default function ParentalGuidance() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = activeCategory === 'all'
    ? ARTICLES
    : ARTICLES.filter(a => a.category === activeCategory);

  return (
    <View style={styles.root}>
      <View style={styles.overlay} />
      <View style={[styles.orb, styles.orbTop]} />
      <View style={[styles.orb, styles.orbBottom]} />

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Parental Guidance</Text>
          <View style={{ width: 60 }} />
        </View>

        {/* Hero */}
        <BlurView intensity={25} tint="dark" style={styles.heroCard}>
          <Text style={styles.heroEmoji}>📖</Text>
          <View style={styles.heroText}>
            <Text style={styles.heroTitle}>Safety Resources</Text>
            <Text style={styles.heroSub}>{ARTICLES.length} guides for Kenyan parents</Text>
          </View>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>Free</Text>
          </View>
        </BlurView>

        {/* Category filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.filterChip, activeCategory === cat.id && styles.filterChipActive]}
              onPress={() => setActiveCategory(cat.id)}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterChipText, activeCategory === cat.id && styles.filterChipTextActive]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Articles */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {filtered.map(article => {
            const expanded = expandedId === article.id;
            return (
              <BlurView key={article.id} intensity={22} tint="dark" style={styles.articleCard}>
                {/* Card header */}
                <TouchableOpacity
                  style={styles.articleHeader}
                  onPress={() => setExpandedId(expanded ? null : article.id)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.articleEmojiBg, { backgroundColor: `${article.color}18` }]}>
                    <Text style={styles.articleEmoji}>{article.emoji}</Text>
                  </View>
                  <View style={styles.articleMeta}>
                    <Text style={styles.articleTitle}>{article.title}</Text>
                    <Text style={styles.articleReadTime}>{article.readTime}</Text>
                  </View>
                  <Text style={styles.articleChevron}>{expanded ? '▲' : '▼'}</Text>
                </TouchableOpacity>

                {/* Summary always visible */}
                <Text style={styles.articleSummary}>{article.summary}</Text>

                {/* Tips — expanded */}
                {expanded && (
                  <View style={styles.tipsSection}>
                    <View style={styles.tipsDivider} />
                    <Text style={styles.tipsTitle}>Key Tips</Text>
                    {article.tips.map((tip, i) => (
                      <View key={i} style={styles.tipRow}>
                        <View style={[styles.tipDot, { backgroundColor: article.color }]} />
                        <Text style={styles.tipText}>{tip}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Category tag */}
                <View style={styles.articleFooter}>
                  <View style={[styles.categoryTag, { backgroundColor: `${article.color}18` }]}>
                    <Text style={[styles.categoryTagText, { color: article.color }]}>
                      {CATEGORIES.find(c => c.id === article.category)?.label}
                    </Text>
                  </View>
                </View>
              </BlurView>
            );
          })}
          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#080C14' },
  overlay: { position: 'absolute', width: '100%', height: '100%', backgroundColor: 'rgba(8,12,20,0.94)' },
  orb: { position: 'absolute', borderRadius: 999, opacity: 0.1 },
  orbTop: { width: 200, height: 200, backgroundColor: '#A78BFA', top: -60, right: -40 },
  orbBottom: { width: 160, height: 160, backgroundColor: '#0284C7', bottom: 80, left: -40 },
  safeArea: { flex: 1 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, marginBottom: 12 },
  backBtn: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8 },
  backBtnText: { color: '#BAE6FD', fontSize: 14 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#F0F9FF' },

  heroCard: { marginHorizontal: 16, borderRadius: 18, overflow: 'hidden', padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  heroEmoji: { fontSize: 32 },
  heroText: { flex: 1 },
  heroTitle: { color: '#F0F9FF', fontWeight: '800', fontSize: 16 },
  heroSub: { color: 'rgba(186,230,253,0.5)', fontSize: 12, marginTop: 2 },
  heroBadge: { backgroundColor: 'rgba(52,211,153,0.15)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  heroBadgeText: { color: '#34D399', fontSize: 12, fontWeight: '700' },

  filterRow: { paddingHorizontal: 16, gap: 8, paddingBottom: 16 },
  filterChip: { borderRadius: 12, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.08)' },
  filterChipActive: { borderColor: '#38BDF8', backgroundColor: 'rgba(56,189,248,0.12)' },
  filterChipText: { color: 'rgba(186,230,253,0.5)', fontSize: 13, fontWeight: '600' },
  filterChipTextActive: { color: '#38BDF8' },

  scrollContent: { paddingHorizontal: 16 },
  articleCard: { borderRadius: 20, overflow: 'hidden', marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', padding: 16 },
  articleHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  articleEmojiBg: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  articleEmoji: { fontSize: 22 },
  articleMeta: { flex: 1 },
  articleTitle: { color: '#F0F9FF', fontWeight: '700', fontSize: 14, marginBottom: 3 },
  articleReadTime: { color: 'rgba(186,230,253,0.4)', fontSize: 11 },
  articleChevron: { color: 'rgba(186,230,253,0.3)', fontSize: 12 },
  articleSummary: { color: 'rgba(186,230,253,0.6)', fontSize: 13, lineHeight: 20, marginBottom: 10 },

  tipsSection: { marginTop: 4 },
  tipsDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginBottom: 12 },
  tipsTitle: { color: '#F0F9FF', fontWeight: '700', fontSize: 13, marginBottom: 10 },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  tipDot: { width: 6, height: 6, borderRadius: 3, marginTop: 6 },
  tipText: { flex: 1, color: 'rgba(186,230,253,0.7)', fontSize: 13, lineHeight: 20 },

  articleFooter: { flexDirection: 'row', marginTop: 8 },
  categoryTag: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  categoryTagText: { fontSize: 11, fontWeight: '600' },
});
