import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Animated, KeyboardAvoidingView,
  Platform, Alert, Image, Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db} from '../../src/firebaseconfig';
import { getDoc, doc } from 'firebase/firestore';
import { SafeTotosLogo, SafeTotosWordmark } from '../../src/lib/SafeTotosLogo';

const { width,height } = Dimensions.get('window');

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const cardAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.spring(cardAnim, { toValue: 1, tension: 65, friction: 10, useNativeDriver: true }).start();
  }, []);

  const cardTranslateY = cardAnim.interpolate({ inputRange: [0, 1], outputRange: [height * 0.3, 0] });

  const handleSignIn = async () => {
    if (!email || !password) return Alert.alert('Missing info', 'Please fill in all fields');
    setLoading(true);
    try {
      const cred =await signInWithEmailAndPassword(auth, email.trim(), password);

      //Fetch role from Firestore
      const snap = await getDoc(doc(db, 'users', cred.user.uid));
      const data = snap.data();
      const role = data?.role ?? 'parent';

      if (role === 'caregiver') {
        router.replace('/(caregiver)/(tabs)/home');
      } else {
        // Check if parent has children set up
        const hasChildren = data?.hasChildren ?? false;
        if (hasChildren) {
          router.replace('/(app)/(tabs)/home');
        } else {
          router.replace('/(app)/child-setup');
        }
      }    
    } catch (e: any) {
      const msg =
      e.code === 'auth/user-not-found' ? 'No account found with this email.' :
      e.code === 'auth/wrong-password' ? 'Incorrect password. Please try again.' :
      e.code === 'auth/invalid-credential' ? 'Incorrect email or password.' :
      e.code === 'auth/invalid-email' ? 'Please enter a valid email address.' :
      e.code === 'auth/too-many-requests' ? 'Too many attempts. Try again later.' :
      e.code === 'auth/network-request-failed' ? 'Network error. Check your connection.' :
      'Sign in failed. Please try again.';
      Alert.alert('Error', msg)
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.overlay} />
      <View style={[styles.orb, styles.orbTop]} />
      <View style={[styles.orb, styles.orbBottom]} />
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.kav}>
          <View style={styles.logoBadge}>
            <Image 
              source={require('../../assets/images/safe-totos-logo.png')}
              style={{ width: 120, height: 120, resizeMode: 'contain' }}
            />
          </View>
          
          <Animated.View style={[styles.cardWrap, { transform: [{ translateY: cardTranslateY }] }]}>
            <BlurView intensity={35} tint="dark" style={styles.card}>
              <Text style={styles.cardTitle}>Welcome back</Text>
              <Text style={styles.cardSub}>Sign in to your account</Text>
              <Text style={styles.fieldLabel}>EMAIL</Text>
              <View style={[styles.inputWrapper, focusedField === 'email' && styles.inputFocused]}>
                <Text style={styles.inputIcon}>✉️</Text>
                <TextInput style={styles.input} placeholder="your@email.com" placeholderTextColor="rgba(186,230,253,0.3)" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" onFocus={() => setFocusedField('email')} onBlur={() => setFocusedField(null)} />
              </View>
              <Text style={styles.fieldLabel}>PASSWORD</Text>
              <View style={[styles.inputWrapper, focusedField === 'password' && styles.inputFocused]}>
                <Text style={styles.inputIcon}>🔒</Text>
                <TextInput style={styles.input} placeholder="••••••••" placeholderTextColor="rgba(186,230,253,0.3)" value={password} onChangeText={setPassword} secureTextEntry onFocus={() => setFocusedField('password')} onBlur={() => setFocusedField(null)} />
              </View>
              <TouchableOpacity style={styles.forgotBtn}>
                <Text style={styles.forgotText}>Forgot password?</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.signInBtn, loading && styles.signInBtnLoading]} onPress={handleSignIn} disabled={loading} activeOpacity={0.85}>
                <Text style={styles.signInBtnText}>{loading ? 'Signing in...' : 'Sign In →'}</Text>
              </TouchableOpacity>
              <View style={styles.signUpRow}>
                <Text style={styles.signUpText}>Don't have an account? </Text>
                <TouchableOpacity onPress={() => router.replace('/(auth)/onboarding')}>
                  <Text style={styles.signUpLink}>Sign up</Text>
                </TouchableOpacity>
              </View>
            </BlurView>
          </Animated.View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#080C14' },
  bgImage: { position: 'absolute', width: '100%', height: '100%' },
  overlay: { position: 'absolute', width: '100%', height: '100%', backgroundColor: 'rgba(8,12,20,0.75)' },
  orb: { position: 'absolute', borderRadius: 999, opacity: 0.15 },
  orbTop: { width: 200, height: 200, backgroundColor: '#0284C7', top: -60, right: -40 },
  orbBottom: { width: 160, height: 160, backgroundColor: '#0369A1', bottom: 80, left: -40 },
  safeArea: { flex: 1 },
  kav: { flex: 1, justifyContent: 'center', paddingHorizontal: 20 },
  logoBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 32 },
  logoEmoji: { fontSize: 28 },
  logoText: { fontSize: 20, fontWeight: '800', color: '#F0F9FF', letterSpacing: -0.5 },
  cardWrap: { width: '100%' },
  card: { borderRadius: 28, overflow: 'hidden', padding: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  cardTitle: { fontSize: 26, fontWeight: '900', color: '#F0F9FF', marginBottom: 4 },
  cardSub: { color: 'rgba(186,230,253,0.5)', fontSize: 14, marginBottom: 28 },
  fieldLabel: { color: 'rgba(186,230,253,0.6)', fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 8 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 14, height: 52, marginBottom: 18 },
  inputFocused: { borderColor: '#38BDF8', backgroundColor: 'rgba(56,189,248,0.08)' },
  inputIcon: { fontSize: 16, marginRight: 10 },
  input: { flex: 1, color: '#F0F9FF', fontSize: 15 },
  forgotBtn: { alignSelf: 'flex-end', marginBottom: 24, marginTop: -8 },
  forgotText: { color: '#38BDF8', fontSize: 13 },
  signInBtn: { backgroundColor: '#0284C7', borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginBottom: 20, shadowColor: '#0284C7', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8 },
  signInBtnLoading: { opacity: 0.7 },
  signInBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  signUpRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  signUpText: { color: 'rgba(186,230,253,0.5)', fontSize: 14 },
  signUpLink: { color: '#38BDF8', fontSize: 14, fontWeight: '700' },
});
