import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Dimensions, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../../src/firebaseconfig';

const { width } = Dimensions.get('window');
type NotifType = 'alert' | 'booking' | 'message' | 'payment' | 'system';
interface Notification {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  time: string;
  read: boolean;
  createdAt?: any;
  actionRoute?: string;
}

const FILTERS = ['All', 'Unread', 'Alerts', 'Bookings', 'Messages'];
const TYPE_STYLE: Record<NotifType, { color: string; bg: string }> = {
  alert:   { color: '#F87171', bg: 'rgba(248,113,113,0.12)' },
  booking: { color: '#34D399', bg: 'rgba(52,211,153,0.12)' },
  message: { color: '#38BDF8', bg: 'rgba(56,189,248,0.12)' },
  payment: { color: '#FBBF24', bg: 'rgba(251,191,36,0.12)' },
  system:  { color: '#A78BFA', bg: 'rgba(167,139,250,0.12)' },
};

function timeAgo(ts: any): string {
  if (!ts) return '';
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  return `${Math.floor(diff/86400)}d ago`;
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) { setLoading(false); return; }
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', uid),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        time: timeAgo(d.data().createdAt),
      })) as Notification[];
      setNotifications(data);
      setLoading(false);
    }, () => setLoading(false));
    return unsub;
  }, []);

  const markAllRead = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const unread = notifications.filter(n => !n.read);
    for (const n of unread) {
      await updateDoc(doc(db, 'notifications', n.id), { read: true });
    }
  };

  const markRead = async (id: string) => {
    await updateDoc(doc(db, 'notifications', id), { read: true });
  };

  const filtered = notifications.filter(n => {
    if (activeFilter === 'Unread') return !n.read;
    if (activeFilter === 'Alerts') return n.type === 'alert';
    if (activeFilter === 'Bookings') return n.type === 'booking';
    if (activeFilter === 'Messages') return n.type === 'message';
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <View style={styles.root}>
      <View style={styles.overlay} />
      <SafeAreaView style={styles.safe}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Notifications</Text>
            {unreadCount > 0 && (
              <Text style={styles.unreadBadge}>{unreadCount} unread</Text>
            )}
          </View>
          <TouchableOpacity onPress={markAllRead} style={styles.markAllBtn}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        </View>

        {/* Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersRow} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
          {FILTERS.map(f => (
            <TouchableOpacity key={f} onPress={() => setActiveFilter(f)}
              style={[styles.filterChip, activeFilter === f && styles.filterChipActive]}>
              <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* List */}
        {loading ? (
          <ActivityIndicator color="#38BDF8" style={{ marginTop: 40 }} />
        ) : filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🔔</Text>
            <Text style={styles.emptyText}>No notifications yet</Text>
            <Text style={styles.emptySub}>You're all caught up!</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
            {filtered.map(notif => {
              const ts = TYPE_STYLE[notif.type] ?? TYPE_STYLE.system;
              return (
                <TouchableOpacity key={notif.id} activeOpacity={0.85}
                  onPress={() => {
                    markRead(notif.id);
                    if (notif.actionRoute) router.push(notif.actionRoute as any);
                  }}>
                  <BlurView intensity={18} tint="dark" style={[
                    styles.notifCard,
                    { borderColor: notif.read ? 'rgba(255,255,255,0.06)' : ts.color + '40' }
                  ]}>
                    <View style={[styles.notifIcon, { backgroundColor: ts.bg }]}>
                      <Text style={styles.notifEmoji}>
                        {notif.type === 'alert' ? '🚨' :
                         notif.type === 'booking' ? '📅' :
                         notif.type === 'message' ? '💬' :
                         notif.type === 'payment' ? '💳' : '📢'}
                      </Text>
                    </View>
                    <View style={styles.notifBody}>
                      <View style={styles.notifTop}>
                        <Text style={[styles.notifTitle, { color: notif.read ? 'rgba(186,230,253,0.6)' : '#F0F9FF' }]} numberOfLines={1}>
                          {notif.title}
                        </Text>
                        <Text style={styles.notifTime}>{notif.time}</Text>
                      </View>
                      <Text style={styles.notifText} numberOfLines={2}>{notif.body}</Text>
                    </View>
                    {!notif.read && <View style={[styles.unreadDot, { backgroundColor: ts.color }]} />}
                  </BlurView>
                </TouchableOpacity>
              );
            })}
            <View style={{ height: 40 }} />
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#080C14' },
  overlay: { position: 'absolute', width: '100%', height: '100%', backgroundColor: 'rgba(8,12,20,0.96)' },
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
  backText: { color: '#BAE6FD', fontSize: 18 },
  headerTitle: { color: '#F0F9FF', fontWeight: '800', fontSize: 16 },
  unreadBadge: { color: '#F87171', fontSize: 11, fontWeight: '600', marginTop: 1 },
  markAllBtn: { backgroundColor: 'rgba(56,189,248,0.1)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  markAllText: { color: '#38BDF8', fontSize: 12, fontWeight: '700' },
  filtersRow: { maxHeight: 52, marginVertical: 10 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  filterChipActive: { backgroundColor: 'rgba(56,189,248,0.15)', borderColor: '#38BDF8' },
  filterText: { color: 'rgba(186,230,253,0.5)', fontSize: 13, fontWeight: '600' },
  filterTextActive: { color: '#38BDF8' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 80 },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyText: { color: '#F0F9FF', fontSize: 18, fontWeight: '800', marginBottom: 8 },
  emptySub: { color: 'rgba(186,230,253,0.5)', fontSize: 14 },
  list: { paddingHorizontal: 16, paddingTop: 8 },
  notifCard: { borderRadius: 16, overflow: 'hidden', padding: 14, marginBottom: 10, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  notifIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  notifEmoji: { fontSize: 20 },
  notifBody: { flex: 1 },
  notifTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  notifTitle: { fontSize: 14, fontWeight: '700', flex: 1, marginRight: 8 },
  notifTime: { color: 'rgba(186,230,253,0.4)', fontSize: 11 },
  notifText: { color: 'rgba(186,230,253,0.6)', fontSize: 13, lineHeight: 18 },
  unreadDot: { width: 8, height: 8, borderRadius: 4 },
});
