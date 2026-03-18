import { Stack, useRouter, useSegments, SplashScreen } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc,getDoc } from 'firebase/firestore';
import { auth, db } from '../src/firebaseconfig';
import { useFonts } from  'expo-font';
import '../global.css';
import { ThemeProvider } from '../src/lib/ThemeContext';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [user, setUser] = useState<any>(undefined);
  const [fontsLoaded] = useFonts({
  'DancingScript': require('../assets/fonts/DancingScript-Regular.ttf'),
  'DancingScript-Bold': require('../assets/fonts/DancingScript-Bold.ttf'),
  'Mileast': require('../assets/fonts/Mileast.otf'),
  'MileastItalic': require('../assets/fonts/MileastItalic.otf'),
  'Zialothus': require('../assets/fonts/Zialothus.otf'),
  'Rockybilly': require('../assets/fonts/Rockybilly.ttf'),
})

useEffect(() => {
  if (fontsLoaded) SplashScreen.hideAsync();
}, [fontsLoaded]);
  const [role,setRole] = useState<string | null>(null);
  const router = useRouter();
  const segments = useSegments();

  // Listen to auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        //fetch role from firestore
        try {
          const snap = await getDoc(doc(db, 'users',firebaseUser.uid));
          const data = snap.data();
          setRole(data?.role ?? 'parent'); //default to parent if no role set
        } catch { 
          setRole('parent');
        }
        setUser(firebaseUser);
      } else { 
        setUser(null);
        setRole(null);
      }      
    });
    return unsub;
  }, []);

  // Route based on auth + role
  useEffect(() => {
    if (user === undefined) return;
    SplashScreen.hideAsync();
    const inAuthGroup = segments[0] === '(auth)';
    const inAppGroup = segments[0] === '(app)';
    const inCaregiverGroup = segments[0] === '(caregiver)';

    if (!user) {
      if (!inAuthGroup) router.replace('/(auth)/onboarding');
      return;
    }

    if (role === 'caregiver') {
      if (!inCaregiverGroup) router.replace('/(caregiver)/(tabs)/home');
    } else {
      if (!inAppGroup) router.replace('/(app)/(tabs)/home');
    }
  }, [user, role, segments]);

  return (
    <ThemeProvider>  
      <SafeAreaProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(app)" />
          <Stack.Screen name="(caregiver)" />
          <Stack.Screen name="index" />
          <Stack.Screen name="theme-settings" options={{ headerShown: false }} />
          <Stack.Screen name="edit-profile" options={{ headerShown: false }} />
          <Stack.Screen name="privacy-policy" options={{ headerShown: false }} />
          <Stack.Screen name="terms-of-service" options={{ headerShown: false }} />
          <Stack.Screen name="caregiver-agreement" options={{ headerShown: false }} />
        </Stack>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}
