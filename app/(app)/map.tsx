import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import { collection, onSnapshot, query, where, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../src/firebaseconfig';

interface SafeZone {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
  color: string;
}

export default function MapScreen() {
  const [location, setLocation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [safeZones, setSafeZones] = useState<SafeZone[]>([]);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setPermissionDenied(true);
        setLoading(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setLocation(loc.coords);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const q = query(collection(db, 'safeZones'), where('userId', '==', uid));
    const unsub = onSnapshot(q, (snap) => {
      setSafeZones(snap.docs.map(d => ({ id: d.id, ...d.data() } as SafeZone)));
    });
    return unsub;
  }, []);

  const addSafeZone = async () => {
    if (!location) return;
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    Alert.prompt(
      'Add Safe Zone',
      'Enter a name for this safe zone:',
      async (name) => {
        if (!name) return;
        await addDoc(collection(db, 'safeZones'), {
          userId: uid,
          name,
          latitude: location.latitude,
          longitude: location.longitude,
          radius: 200,
          color: '#38BDF8',
          createdAt: serverTimestamp(),
        });
      }
    );
  };

  const centerOnUser = () => {
    if (!location || !mapRef.current) return;
    mapRef.current.animateToRegion({
      latitude: location.latitude,
      longitude: location.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    }, 800);
  };

  if (loading) return (
    <View style={styles.loading}>
      <ActivityIndicator color='#38BDF8' size='large' />
      <Text style={styles.loadingText}>Getting your location...</Text>
    </View>
  );

  if (permissionDenied) return (
    <View style={styles.loading}>
      <Text style={styles.permEmoji}>📍</Text>
      <Text style={styles.permTitle}>Location Access Required</Text>
      <Text style={styles.permText}>Safe Totos needs location access to show safe zones and track your child's caregiver.</Text>
      <TouchableOpacity style={styles.permBtn} onPress={() => router.back()}>
        <Text style={styles.permBtnText}>Go Back</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.root}>
      {location && (
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={{
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
          showsUserLocation
          showsMyLocationButton={false}
          customMapStyle={darkMapStyle}
        >
          {safeZones.map(zone => (
            <React.Fragment key={zone.id}>
              <Circle
                center={{ latitude: zone.latitude, longitude: zone.longitude }}
                radius={zone.radius}
                fillColor='rgba(56,189,248,0.15)'
                strokeColor='#38BDF8'
                strokeWidth={2}
              />
              <Marker
                coordinate={{ latitude: zone.latitude, longitude: zone.longitude }}
                title={zone.name}
                pinColor='#38BDF8'
              />
            </React.Fragment>
          ))}
        </MapView>
      )}

      {/* Header */}
      <SafeAreaView style={styles.overlay} pointerEvents='box-none'>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
            <Text style={styles.headerBtnText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Safe Zones</Text>
          <TouchableOpacity onPress={addSafeZone} style={styles.headerBtn}>
            <Text style={styles.headerBtnText}>＋</Text>
          </TouchableOpacity>
        </View>

        {/* Safe zones count */}
        <View style={styles.badge}>
          <Text style={styles.badgeText}>📍 {safeZones.length} Safe Zone{safeZones.length !== 1 ? 's' : ''}</Text>
        </View>

        {/* Center button */}
        <TouchableOpacity style={styles.centerBtn} onPress={centerOnUser}>
          <Text style={styles.centerBtnText}>🎯</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#0f1923' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8ec3b9' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1a3646' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#304a7d' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e1626' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#1a2b3c' }] },
];

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#080C14' },
  map: { flex: 1 },
  loading: { flex: 1, backgroundColor: '#080C14', alignItems: 'center', justifyContent: 'center', padding: 32 },
  loadingText: { color: '#BAE6FD', marginTop: 16, fontSize: 14 },
  permEmoji: { fontSize: 48, marginBottom: 16 },
  permTitle: { color: '#F0F9FF', fontSize: 20, fontWeight: '800', marginBottom: 12, textAlign: 'center' },
  permText: { color: 'rgba(186,230,253,0.6)', fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  permBtn: { backgroundColor: '#0284C7', borderRadius: 14, paddingHorizontal: 24, paddingVertical: 12 },
  permBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, pointerEvents: 'box-none' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  headerBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(8,12,20,0.8)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  headerBtnText: { color: '#BAE6FD', fontSize: 18, fontWeight: '700' },
  headerTitle: { color: '#F0F9FF', fontWeight: '800', fontSize: 16, backgroundColor: 'rgba(8,12,20,0.8)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
  badge: { alignSelf: 'center', backgroundColor: 'rgba(8,12,20,0.85)', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1, borderColor: 'rgba(56,189,248,0.3)' },
  badgeText: { color: '#38BDF8', fontSize: 13, fontWeight: '700' },
  centerBtn: { position: 'absolute', bottom: -500, right: 16, width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(8,12,20,0.9)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(56,189,248,0.3)' },
  centerBtnText: { fontSize: 22 },
});
