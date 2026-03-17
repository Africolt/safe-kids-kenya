import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');

type NotifType = 'alert' | 'booking' | 'message' | 'payment' | 'system';

interface Notification {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  time: string;
  read: boolean;
  action?: string;
  actionRoute?: string;
}

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: '1', type: 'alert', read: false,
    title: '🚨 Safe Zone Alert',
    body: 'Amani has left the school safe zone at 3:45 PM.',
    time: '2 min ago',
    action: 'View Map',
    actionRoute: '/(app)/map',
  },
  {
    id: '2', type: 'booking', read: false,
    title: '✅ Booking Confirmed',
    body: 'Amina Wanjiku confirmed your booking for tomorrow at 3:00 PM.',
    time: '15 min ago',
    action: 'View Booking',
    actionRoute: '/(app)/booking-confirmation',
  },
  {
    id: '3', type: 'message', read: false,
    title: '💬 New Message',
    body: 'Amina: "I am on my way to pick up Amani now."',
    time: '32 min ago',
    action: 'Reply',
    actionRoute: '/(app)/chat',
  },
  {
    id: '4', type: 'payment', read: true,
    title: '💳 Payment Successful',
    body: 'KSh 1,275 paid for After School Care session. Transaction ID: SKK8847201.',
    time: '1 hr ago',
  },
  {
    id: '5', type: 'alert', read: true,
    title: '✅ Safe Zone Entry',
    body: 'Amani has arrived at Home safe zone.',
    time: '2 hrs ago',
    action: 'View Map',
    actionRoute: '/(app)/map',
  },
  {
    id: '6', type: 'booking', read: true,
    title: '⭐ Rate Your Session',
    body: 'How was your session with Brian Otieno yesterday? Share your feedback.',
    time: '1 day ago',
    action: 'Rate Now',
    actionRoute: '/(app)/search',
  },
  {
    id: '7', type: 'system', read: true,
    title: '🛡️ Caregiver Verified',
    body: 'Grace Muthoni has been verified and is now available for booking.',
    time: '2 days ago',
    action: 'View Profile',
    actionRoute: '/(app)/caregiver-profile',
  },
  {
    id: '8', type: 'alert', read: true,
    title: '⚠️ Security Alert',
    body: 'Unusual login attempt detected on your account. Please review your security settings.',
    time: '3 days ago',
    action: 'Review',
    actionRoute: '/(app)/(tabs)/security',
  },
  {
    id: '9', type: 'system', read: true,
    title: '📱 App Update Available',
    body: 'Safe Kids Kenya v1.1.0 is available with new features and improvements.',
    time: '5 days ago',
  },
];

const TYPE_CONFIG: Record<NotifType, { color: string; bg: string }> = {
  alert:   { color: '#F87171', bg: 'rgba(248,113,113,0.12)' },
  booking: { color: '#34D399', bg: 'rgba(52,211,153,0.12)' },
  message: { color: '#38BDF8', bg: 'rgba(56,189,248,0.12)' },
  payment: { color: '#FBBF24', bg: 'rgba(251,191,36,0.12)' },
  system:  { color: '#A78BFA', bg: 'rgba(167,139,250,0.12)' },
};

const FILTERS = ['All', 'Unread', 'Alerts', 'Bookings', 'Messages'];

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const [activeFilter, setActiveFilter] = useState('All');

  const unreadCount = notifications.filter(n => !n.read).length;

  const filtered = notifications.filter(n => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Unread') return !n.read;
    if (activeFilter === 'Alerts') return n.type === 'alert';
    if (activeFilter === 'Bookings') return n.type === 'booking';
    if (activeFilter === 'Messages') return n.type === 'message';
    return true;
  });

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const markRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const dismiss = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

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
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Notifications</Text>
            {unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </View>
          {unreadCount > 0 ? (
            <TouchableOpacity onPress={markAllRead} style={styles.markAllBtn}>
              <Text style={styles.markAllText}>Mark all read</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 80 }} />
          )}
        </View>

        {/* Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {FILTERS.map(f => (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, activeFilter === f && styles.filterChipActive]}
              onPress={() => setActiveFilter(f)}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterChipText, activeFilter === f && styles.filterChipTextActive]}>
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Notifications list */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {filtered.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🔔</Text>
              <Text style={styles.emptyTitle}>All caught up!</Text>
              <Text style={styles.emptySub}>No notifications in this category</Text>
            </View>
          ) : (
            filtered.map(notif => {
              const config = TYPE_CONFIG[notif.type];
              return (
                <TouchableOpacity
                  key={notif.id}
                  onPress={() => {
                    markRead(notif.id);
                    if (notif.actionRoute) router.push(notif.actionRoute as any);
                  }}
                  activeOpacity={0.85}
                >
                  <BlurView
                    intensity={20}
                    tint="dark"
                    style={[
                      styles.notifCard,
                      !notif.read && styles.notifCardUnread,
                    ]}
                  >
                    {/* Unread indicator */}
                    {!notif.read && <View style={[styles.unreadDot, { backgroundColor: config.color }]} />}

                    <View style={styles.notifInner}>
                      {/* Icon */}
                      <View style={[styles.notifIcon, { backgroundColor: config.bg }]}>
                        <Text style={styles.notifIconText}>
                          {notif.type === 'alert' ? '🚨' :
                           notif.type === 'booking' ? '📅' :
                           notif.type === 'message' ? '💬' :
                           notif.type === 'payment' ? '💳' : '🛡️'}
                        </Text>
                      </View>

                      {/* Content */}
                      <View style={styles.notifContent}>
                        <View style={styles.notifTitleRow}>
                          <Text style={[styles.notifTitle, !notif.read && styles.notifTitleUnread]}>
                            {notif.title}
                          </Text>
                          <Text style={styles.notifTime}>{notif.time}</Text>
                        </View>
                        <Text style={styles.notifBody} numberOfLines={2}>{notif.body}</Text>
                        {notif.action && (
                          <View style={[styles.notifActionBtn, { backgroundColor: config.bg }]}>
                            <Text style={[styles.notifActionText, { color: config.color }]}>
                              {notif.action} →
                            </Text>
                          </View>
                        )}
                      </View>

                      {/* Dismiss */}
                      <TouchableOpacity
                        style={styles.dismissBtn}
                        onPress={() => dismiss(notif.id)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Text style={styles.dismissText}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  </BlurView>
                </TouchableOpacity>
              );
            })
          )}
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
  orbTop: { width: 200, height: 200, backgroundColor: '#0284C7', top: -60, right: -40 },
  orbBottom: { width: 160, height: 160, backgroundColor: '#A78BFA', bottom: 80, left: -40 },
  safeArea: { flex: 1 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, marginBottom: 16 },
  backBtn: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8 },
  backBtnText: { color: '#BAE6FD', fontSize: 14 },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#F0F9FF' },
  unreadBadge: { backgroundColor: '#F87171', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2, minWidth: 22, alignItems: 'center' },
  unreadBadgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  markAllBtn: { backgroundColor: 'rgba(56,189,248,0.1)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
  markAllText: { color: '#38BDF8', fontSize: 12, fontWeight: '600' },

  filterRow: { paddingHorizontal: 16, gap: 8, paddingBottom: 16 },
  filterChip: { borderRadius: 12, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.08)' },
  filterChipActive: { borderColor: '#38BDF8', backgroundColor: 'rgba(56,189,248,0.12)' },
  filterChipText: { color: 'rgba(186,230,253,0.5)', fontSize: 13, fontWeight: '600' },
  filterChipTextActive: { color: '#38BDF8' },

  scrollContent: { paddingHorizontal: 16 },

  notifCard: { borderRadius: 18, overflow: 'hidden', marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', position: 'relative' },
  notifCardUnread: { borderColor: 'rgba(56,189,248,0.2)' },
  unreadDot: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, borderRadius: 2 },
  notifInner: { flexDirection: 'row', padding: 14, gap: 12, alignItems: 'flex-start' },
  notifIcon: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  notifIconText: { fontSize: 20 },
  notifContent: { flex: 1 },
  notifTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 5 },
  notifTitle: { color: 'rgba(186,230,253,0.7)', fontWeight: '600', fontSize: 13, flex: 1, marginRight: 8 },
  notifTitleUnread: { color: '#F0F9FF', fontWeight: '700' },
  notifTime: { color: 'rgba(186,230,253,0.3)', fontSize: 11 },
  notifBody: { color: 'rgba(186,230,253,0.55)', fontSize: 12, lineHeight: 18, marginBottom: 8 },
  notifActionBtn: { alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  notifActionText: { fontSize: 11, fontWeight: '700' },
  dismissBtn: { padding: 4 },
  dismissText: { color: 'rgba(186,230,253,0.25)', fontSize: 13 },

  emptyState: { alignItems: 'center', paddingTop: 80 },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { color: '#F0F9FF', fontSize: 20, fontWeight: '800', marginBottom: 8 },
  emptySub: { color: 'rgba(186,230,253,0.4)', fontSize: 14 },
});
