import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  TextInput, FlatList, KeyboardAvoidingView,
  Platform, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { router, useLocalSearchParams } from 'expo-router';
import { ref, push, onValue, serverTimestamp } from 'firebase/database';
import { auth, rtdb } from '../../src/firebaseconfig';

interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  timestamp: number;
}

export default function Chat() {
  const { caregiverId, bookingId } = useLocalSearchParams<{ caregiverId?: string; bookingId?: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const uid = auth.currentUser?.uid ?? '';
  const email = auth.currentUser?.email ?? '';
  const senderName = email.split('@')[0];

  // Chat room ID — always sorted so both sides get same room
  const otherUserId = caregiverId ?? 'unknown';
  const roomId = [uid, otherUserId].sort().join('_');

  useEffect(() => {
    const messagesRef = ref(rtdb, `chats/${roomId}/messages`);
    const unsub = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const msgs = Object.entries(data).map(([id, val]: [string, any]) => ({
          id,
          text: val.text,
          senderId: val.senderId,
          senderName: val.senderName,
          timestamp: val.timestamp ?? 0,
        }));
        msgs.sort((a, b) => a.timestamp - b.timestamp);
        setMessages(msgs);
      } else {
        setMessages([]);
      }
      setLoading(false);
    });

    return () => unsub();
  }, [roomId]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    setSending(true);
    try {
      const messagesRef = ref(rtdb, `chats/${roomId}/messages`);
      await push(messagesRef, {
        text: input.trim(),
        senderId: uid,
        senderName,
        timestamp: Date.now(),
      });
      setInput('');
    } catch (e) {
      console.error('Send failed:', e);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp: number) => {
    const d = new Date(timestamp);
    return d.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = item.senderId === uid;
    return (
      <View style={[styles.msgRow, isMe && styles.msgRowMe]}>
        {!isMe && (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>👩🏾</Text>
          </View>
        )}
        <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
          <Text style={[styles.bubbleText, isMe && styles.bubbleTextMe]}>
            {item.text}
          </Text>
          <Text style={[styles.bubbleTime, isMe && styles.bubbleTimeMe]}>
            {formatTime(item.timestamp)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.root}>
      <View style={styles.overlay} />
      <SafeAreaView style={styles.safeArea}>

        {/* Header */}
        <BlurView intensity={30} tint="dark" style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <View style={styles.headerAvatar}>
              <Text style={styles.headerAvatarText}>👩🏾</Text>
              <View style={styles.onlineDot} />
            </View>
            <View>
              <Text style={styles.headerName}>
                {caregiverId ? 'Your Caregiver' : 'Chat'}
              </Text>
              <Text style={styles.headerSub}>
                {bookingId ? `Booking #SKK-${bookingId.slice(-6).toUpperCase()}` : 'Safe Kids Kenya'}
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.callBtn}>
            <Text style={styles.callBtnText}>📞</Text>
          </TouchableOpacity>
        </BlurView>

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}
        >
          {/* Messages */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="#38BDF8" size="large" />
              <Text style={styles.loadingText}>Loading messages...</Text>
            </View>
          ) : messages.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>💬</Text>
              <Text style={styles.emptyTitle}>Start the conversation</Text>
              <Text style={styles.emptySub}>
                Messages are end-to-end between you and your caregiver
              </Text>
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderMessage}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.messagesList}
              showsVerticalScrollIndicator={false}
            />
          )}

          {/* Input */}
          <BlurView intensity={40} tint="dark" style={styles.inputBar}>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                value={input}
                onChangeText={setInput}
                placeholder="Type a message..."
                placeholderTextColor="rgba(186,230,253,0.3)"
                multiline
                maxLength={500}
                onSubmitEditing={handleSend}
              />
              <TouchableOpacity
                style={[styles.sendBtn, (!input.trim() || sending) && styles.sendBtnDisabled]}
                onPress={handleSend}
                disabled={!input.trim() || sending}
                activeOpacity={0.85}
              >
                {sending ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.sendBtnText}>→</Text>
                )}
              </TouchableOpacity>
            </View>
          </BlurView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#080C14' },
  overlay: { position: 'absolute', width: '100%', height: '100%', backgroundColor: 'rgba(8,12,20,0.97)' },
  safeArea: { flex: 1 },
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)', gap: 12, overflow: 'hidden' },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
  backBtnText: { color: '#BAE6FD', fontSize: 18 },
  headerInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerAvatar: { width: 40, height: 40, borderRadius: 13, backgroundColor: 'rgba(56,189,248,0.12)', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  headerAvatarText: { fontSize: 22 },
  onlineDot: { position: 'absolute', bottom: 2, right: 2, width: 9, height: 9, borderRadius: 5, backgroundColor: '#34D399', borderWidth: 2, borderColor: '#080C14' },
  headerName: { color: '#F0F9FF', fontWeight: '700', fontSize: 15 },
  headerSub: { color: 'rgba(186,230,253,0.4)', fontSize: 11, marginTop: 1 },
  callBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(52,211,153,0.1)', alignItems: 'center', justifyContent: 'center' },
  callBtnText: { fontSize: 18 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: 'rgba(186,230,253,0.5)', fontSize: 14 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 10 },
  emptyEmoji: { fontSize: 48, marginBottom: 8 },
  emptyTitle: { color: '#F0F9FF', fontWeight: '800', fontSize: 18 },
  emptySub: { color: 'rgba(186,230,253,0.4)', fontSize: 13, textAlign: 'center', lineHeight: 20 },
  messagesList: { paddingHorizontal: 16, paddingVertical: 16, gap: 12 },
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  msgRowMe: { justifyContent: 'flex-end' },
  avatar: { width: 30, height: 30, borderRadius: 10, backgroundColor: 'rgba(56,189,248,0.12)', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 16 },
  bubble: { maxWidth: '75%', borderRadius: 18, padding: 12 },
  bubbleMe: { backgroundColor: '#0284C7', borderBottomRightRadius: 4 },
  bubbleThem: { backgroundColor: 'rgba(255,255,255,0.07)', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  bubbleText: { color: 'rgba(186,230,253,0.85)', fontSize: 14, lineHeight: 20 },
  bubbleTextMe: { color: '#fff' },
  bubbleTime: { color: 'rgba(186,230,253,0.35)', fontSize: 10, marginTop: 4, textAlign: 'right' },
  bubbleTimeMe: { color: 'rgba(255,255,255,0.5)' },
  inputBar: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)', paddingHorizontal: 16, paddingVertical: 12, paddingBottom: 24, overflow: 'hidden' },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  input: { flex: 1, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10, color: '#F0F9FF', fontSize: 14, maxHeight: 100, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  sendBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#0284C7', alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { opacity: 0.4 },
  sendBtnText: { color: '#fff', fontSize: 20, fontWeight: '700' },
});
