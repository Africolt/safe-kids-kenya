import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const FULL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const TIME_SLOTS = ['6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM'];

interface DaySchedule { enabled: boolean; start: string; end: string; }

export default function Availability() {
  const [schedule, setSchedule] = useState<Record<string, DaySchedule>>({
    Mon: { enabled: true, start: '3:00 PM', end: '7:00 PM' },
    Tue: { enabled: true, start: '3:00 PM', end: '7:00 PM' },
    Wed: { enabled: true, start: '3:00 PM', end: '7:00 PM' },
    Thu: { enabled: true, start: '3:00 PM', end: '7:00 PM' },
    Fri: { enabled: true, start: '3:00 PM', end: '7:00 PM' },
    Sat: { enabled: true, start: '8:00 AM', end: '6:00 PM' },
    Sun: { enabled: false, start: '8:00 AM', end: '5:00 PM' },
  });
  const [maxChildren, setMaxChildren] = useState(2);
  const [maxDistance, setMaxDistance] = useState(10);
  const [activeDay, setActiveDay] = useState<string | null>(null);
  const [pickingFor, setPickingFor] = useState<'start' | 'end' | null>(null);
  const [saving, setSaving] = useState(false);

  const toggleDay = (day: string) => {
    setSchedule(prev => ({ ...prev, [day]: { ...prev[day], enabled: !prev[day].enabled } }));
  };

  const setTime = (day: string, which: 'start' | 'end', time: string) => {
    setSchedule(prev => ({ ...prev, [day]: { ...prev[day], [which]: time } }));
    setPickingFor(null); setActiveDay(null);
  };

  const openTimePicker = (day: string, which: 'start' | 'end') => {
    setActiveDay(day); setPickingFor(which);
  };

  const enabledDays = DAYS.filter(d => schedule[d].enabled);
  const totalHours = enabledDays.reduce((sum, d) => {
    const s = TIME_SLOTS.indexOf(schedule[d].start);
    const e = TIME_SLOTS.indexOf(schedule[d].end);
    return sum + (e > s ? e - s : 0);
  }, 0);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => { setSaving(false); Alert.alert('✅ Saved', 'Your availability has been updated'); }, 1500);
  };

  return (
    <View style={styles.root}>
      <View style={styles.overlay} />
      <View style={[styles.orb, styles.orbTop]} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Availability</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* Summary */}
          <View style={styles.summaryRow}>
            {[
              { label: 'Days/Week', value: `${enabledDays.length}`, emoji: '📅', color: '#38BDF8' },
              { label: 'Hours/Week', value: `${totalHours}`, emoji: '🕐', color: '#34D399' },
              { label: 'Max Kids', value: `${maxChildren}`, emoji: '👦', color: '#FBBF24' },
            ].map((s, i) => (
              <BlurView key={i} intensity={22} tint="dark" style={styles.summaryCard}>
                <Text style={styles.summaryEmoji}>{s.emoji}</Text>
                <Text style={[styles.summaryValue, { color: s.color }]}>{s.value}</Text>
                <Text style={styles.summaryLabel}>{s.label}</Text>
              </BlurView>
            ))}
          </View>

          {/* Day schedule */}
          <Text style={styles.sectionTitle}>Weekly Schedule</Text>
          {DAYS.map((day, i) => {
            const daySchedule = schedule[day];
            const isEditing = activeDay === day;
            return (
              <BlurView key={day} intensity={20} tint="dark" style={[styles.dayCard, daySchedule.enabled && styles.dayCardEnabled]}>
                <View style={styles.dayRow}>
                  <TouchableOpacity
                    style={[styles.dayToggle, daySchedule.enabled && styles.dayToggleOn]}
                    onPress={() => toggleDay(day)}
                  >
                    <View style={[styles.dayToggleThumb, daySchedule.enabled && styles.dayToggleThumbOn]} />
                  </TouchableOpacity>
                  <Text style={[styles.dayName, daySchedule.enabled && styles.dayNameEnabled]}>{FULL_DAYS[i]}</Text>
                  {daySchedule.enabled ? (
                    <View style={styles.timeRow}>
                      <TouchableOpacity
                        style={styles.timeChip}
                        onPress={() => openTimePicker(day, 'start')}
                      >
                        <Text style={styles.timeChipText}>{daySchedule.start}</Text>
                      </TouchableOpacity>
                      <Text style={styles.timeSep}>→</Text>
                      <TouchableOpacity
                        style={styles.timeChip}
                        onPress={() => openTimePicker(day, 'end')}
                      >
                        <Text style={styles.timeChipText}>{daySchedule.end}</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <Text style={styles.dayOffText}>Off</Text>
                  )}
                </View>

                {/* Inline time picker */}
                {isEditing && pickingFor && (
                  <View style={styles.timePicker}>
                    <Text style={styles.timePickerLabel}>
                      Select {pickingFor === 'start' ? 'start' : 'end'} time
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.timePickerSlots}>
                      {TIME_SLOTS.map(slot => (
                        <TouchableOpacity
                          key={slot}
                          style={[
                            styles.timeSlot,
                            schedule[day][pickingFor] === slot && styles.timeSlotActive,
                          ]}
                          onPress={() => setTime(day, pickingFor, slot)}
                        >
                          <Text style={[styles.timeSlotText, schedule[day][pickingFor] === slot && styles.timeSlotTextActive]}>
                            {slot}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </BlurView>
            );
          })}

          {/* Preferences */}
          <Text style={styles.sectionTitle}>Preferences</Text>
          <BlurView intensity={20} tint="dark" style={styles.prefsCard}>
            {/* Max children */}
            <View style={styles.prefRow}>
              <View style={styles.prefLeft}>
                <Text style={styles.prefEmoji}>👶</Text>
                <View>
                  <Text style={styles.prefTitle}>Max Children at Once</Text>
                  <Text style={styles.prefSub}>How many children can you care for simultaneously</Text>
                </View>
              </View>
              <View style={styles.stepper}>
                <TouchableOpacity style={styles.stepperBtn} onPress={() => setMaxChildren(Math.max(1, maxChildren - 1))}>
                  <Text style={styles.stepperBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.stepperValue}>{maxChildren}</Text>
                <TouchableOpacity style={styles.stepperBtn} onPress={() => setMaxChildren(Math.min(6, maxChildren + 1))}>
                  <Text style={styles.stepperBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.prefDivider} />

            {/* Max distance */}
            <View style={styles.prefRow}>
              <View style={styles.prefLeft}>
                <Text style={styles.prefEmoji}>📍</Text>
                <View>
                  <Text style={styles.prefTitle}>Max Travel Distance</Text>
                  <Text style={styles.prefSub}>Maximum km from your location</Text>
                </View>
              </View>
              <View style={styles.stepper}>
                <TouchableOpacity style={styles.stepperBtn} onPress={() => setMaxDistance(Math.max(1, maxDistance - 1))}>
                  <Text style={styles.stepperBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.stepperValue}>{maxDistance}km</Text>
                <TouchableOpacity style={styles.stepperBtn} onPress={() => setMaxDistance(Math.min(50, maxDistance + 1))}>
                  <Text style={styles.stepperBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </BlurView>

          {/* Save */}
          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnLoading]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.85}
          >
            <Text style={styles.saveBtnText}>{saving ? 'Saving...' : '✅ Save Availability'}</Text>
          </TouchableOpacity>

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
  orbTop: { width: 200, height: 200, backgroundColor: '#38BDF8', top: -60, right: -40 },
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 12, marginBottom: 16 },
  backBtn: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8 },
  backBtnText: { color: '#BAE6FD', fontSize: 14 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#F0F9FF' },
  scrollContent: { paddingHorizontal: 16 },
  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  summaryCard: { flex: 1, borderRadius: 14, overflow: 'hidden', padding: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  summaryEmoji: { fontSize: 18, marginBottom: 4 },
  summaryValue: { fontSize: 20, fontWeight: '900' },
  summaryLabel: { color: 'rgba(186,230,253,0.4)', fontSize: 10, marginTop: 2 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#F0F9FF', marginBottom: 10 },
  dayCard: { borderRadius: 18, overflow: 'hidden', marginBottom: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', padding: 14 },
  dayCardEnabled: { borderColor: 'rgba(56,189,248,0.2)' },
  dayRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dayToggle: { width: 40, height: 22, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', paddingHorizontal: 2 },
  dayToggleOn: { backgroundColor: '#0284C7' },
  dayToggleThumb: { width: 18, height: 18, borderRadius: 9, backgroundColor: 'rgba(186,230,253,0.3)' },
  dayToggleThumbOn: { backgroundColor: '#fff', alignSelf: 'flex-end' },
  dayName: { flex: 1, color: 'rgba(186,230,253,0.35)', fontSize: 14, fontWeight: '600' },
  dayNameEnabled: { color: '#F0F9FF' },
  dayOffText: { color: 'rgba(186,230,253,0.25)', fontSize: 13 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  timeChip: { backgroundColor: 'rgba(56,189,248,0.1)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(56,189,248,0.2)' },
  timeChipText: { color: '#38BDF8', fontSize: 12, fontWeight: '700' },
  timeSep: { color: 'rgba(186,230,253,0.3)', fontSize: 12 },
  timePicker: { marginTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)', paddingTop: 12 },
  timePickerLabel: { color: 'rgba(186,230,253,0.5)', fontSize: 11, marginBottom: 8 },
  timePickerSlots: { gap: 6 },
  timeSlot: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  timeSlotActive: { backgroundColor: 'rgba(56,189,248,0.15)', borderColor: '#38BDF8' },
  timeSlotText: { color: 'rgba(186,230,253,0.5)', fontSize: 12 },
  timeSlotTextActive: { color: '#38BDF8', fontWeight: '700' },
  prefsCard: { borderRadius: 20, overflow: 'hidden', padding: 16, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  prefRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  prefLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  prefEmoji: { fontSize: 22 },
  prefTitle: { color: '#F0F9FF', fontWeight: '600', fontSize: 13 },
  prefSub: { color: 'rgba(186,230,253,0.4)', fontSize: 11, marginTop: 2 },
  prefDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginVertical: 14 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepperBtn: { width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.07)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  stepperBtnText: { color: '#38BDF8', fontSize: 18, fontWeight: '700' },
  stepperValue: { color: '#F0F9FF', fontWeight: '800', fontSize: 16, minWidth: 36, textAlign: 'center' },
  saveBtn: { backgroundColor: '#0284C7', borderRadius: 16, paddingVertical: 16, alignItems: 'center', shadowColor: '#0284C7', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 8 },
  saveBtnLoading: { opacity: 0.7 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
