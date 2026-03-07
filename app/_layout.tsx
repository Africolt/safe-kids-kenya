import { Stack, useRouter, useSegments, SplashScreen } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../src/firebaseconfig';
import '../global.css';
import { ThemeProvider } from '../src/lib/ThemeContext';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [user, setUser] = useState<any>(undefined);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser ?? null);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (user === undefined) return; // still loading

    SplashScreen.hideAsync();

    const inAuthGroup = segments[0] === '(auth)';

    if (user && inAuthGroup) {
      router.replace('/(app)/(tabs)/home');
    } else if (!user && !inAuthGroup) {
      router.replace('/(auth)/onboarding');
    }
  }, [user, segments]);

  return (
    <ThemeProvider>  
      <SafeAreaProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(app)" />
          <Stack.Screen name="index" />
        </Stack>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}
