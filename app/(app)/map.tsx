import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { auth, db } from '../../src/firebaseconfig';
import { collection, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';

export default function MapScreen() {
  const [location, setLocation] = useState<any>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [safeZones, setSafeZones] = useState<any[]>([]);
  const webViewRef = useRef<any>(null);

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
    const unsub = onSnapshot(collection(db, 'users', uid, 'safeZones'), snap => {
      setSafeZones(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (location && webViewRef.current && safeZones.length >= 0) {
      const msg = JSON.stringify({ location, safeZones });
      webViewRef.current.postMessage(msg);
    }
  }, [location, safeZones]);

  const getMapHTML = (lat: number, lng: number) => `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100vh; background: #080C14; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', { zoomControl: true }).setView([${lat}, ${lng}], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 19,
    }).addTo(map);

    var userMarker = L.circleMarker([${lat}, ${lng}], {
      radius: 10, fillColor: '#38BDF8', color: '#fff',
      weight: 2, opacity: 1, fillOpacity: 1
    }).addTo(map).bindPopup('📍 Your Location').openPopup();

    var zones = [];

    document.addEventListener('message', function(e) {
      handleMessage(e.data);
    });
    window.addEventListener('message', function(e) {
      handleMessage(e.data);
    });

    function handleMessage(data) {
      try {
        var msg = JSON.parse(data);
        if (msg.location) {
          var lat = msg.location.latitude;
          var lng = msg.location.longitude;
          userMarker.setLatLng([lat, lng]);
          map.setView([lat, lng], 15);
        }
        if (msg.safeZones) {
          zones.forEach(function(z) { map.removeLayer(z); });
          zones = [];
          msg.safeZones.forEach(function(zone) {
            var circle = L.circle([zone.latitude, zone.longitude], {
              radius: zone.radius || 200,
              fillColor: '#34D399', color: '#34D399',
              weight: 2, opacity: 0.8, fillOpacity: 0.15
            }).addTo(map).bindPopup('🟢 ' + (zone.name || 'Safe Zone'));
            zones.push(circle);
          });
        }
      } catch(e) {}
    }

    map.on('click', function(e) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'mapClick',
        lat: e.latlng.lat,
        lng: e.latlng.lng
      }));
    });
  </script>
</body>
</html>
  `;

  const handleAddZone = async (lat: number, lng: number) => {
    Alert.prompt(
      'Add Safe Zone',
      'Enter a name for this safe zone:',
      async (name) => {
        if (!name) return;
        const uid = auth.currentUser?.uid;
        if (!uid) return;
        await addDoc(collection(db, 'users', uid, 'safeZones'), {
          name, latitude: lat, longitude: lng,
          radius: 200, createdAt: serverTimestamp()
        });
        Alert.alert('Safe Zone Added ✅', `"${name}" has been saved.`);
      }
    );
  };

  const handleWebViewMessage = (e: any) => {
    try {
      const data = JSON.parse(e.nativeEvent.data);
      if (data.type === 'mapClick') {
        Alert.alert('Add Safe Zone?', `Add a safe zone at this location?`, [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Add Zone', onPress: () => handleAddZone(data.lat, data.lng) }
        ]);
      }
    } catch {}
  };

  if (loading) return (
    <View style={styles.centered}>
      <ActivityIndicator color="#38BDF8" size="large" />
      <Text style={styles.loadingText}>Getting your location...</Text>
    </View>
  );

  if (permissionDenied) return (
    <View style={styles.centered}>
      <Text style={styles.permEmoji}>📍</Text>
      <Text style={styles.permTitle}>Location Access Required</Text>
      <Text style={styles.permText}>Safe Totos needs location access to show safe zones.</Text>
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Text style={styles.backBtnText}>Go Back</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtnSmall}>
            <Text style={styles.backTextSmall}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Safe Zones Map</Text>
          <View style={styles.zoneBadge}>
            <Text style={styles.zoneBadgeText}>{safeZones.length} zones</Text>
          </View>
        </View>
        <Text style={styles.hint}>Tap anywhere on the map to add a safe zone</Text>
        {location && (
          <WebView
            ref={webViewRef}
            source={{ html: getMapHTML(location.latitude, location.longitude) }}
            style={styles.map}
            onMessage={handleWebViewMessage}
            javaScriptEnabled
            domStorageEnabled
            startInLoadingState
            renderLoading={() => (
              <View style={styles.centered}>
                <ActivityIndicator color="#38BDF8" />
              </View>
            )}
          />
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#080C14' },
  safe: { flex: 1 },
  centered: { flex: 1, backgroundColor: '#080C14', alignItems: 'center', justifyContent: 'center', padding: 24 },
  loadingText: { color: '#BAE6FD', marginTop: 16, fontSize: 14 },
  permEmoji: { fontSize: 48, marginBottom: 16 },
  permTitle: { color: '#F0F9FF', fontSize: 20, fontWeight: '800', marginBottom: 8 },
  permText: { color: 'rgba(186,230,253,0.6)', fontSize: 14, textAlign: 'center', lineHeight: 22 },
  backBtn: { marginTop: 24, backgroundColor: '#0284C7', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  backBtnText: { color: '#fff', fontWeight: '700' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  backBtnSmall: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
  backTextSmall: { color: '#BAE6FD', fontSize: 18 },
  headerTitle: { color: '#F0F9FF', fontWeight: '800', fontSize: 16 },
  zoneBadge: { backgroundColor: 'rgba(52,211,153,0.15)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(52,211,153,0.3)' },
  zoneBadgeText: { color: '#34D399', fontSize: 12, fontWeight: '700' },
  hint: { color: 'rgba(186,230,253,0.4)', fontSize: 11, textAlign: 'center', paddingVertical: 6 },
  map: { flex: 1 },
});
