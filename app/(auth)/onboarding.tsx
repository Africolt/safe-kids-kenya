import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  Alert, Image, Dimensions, Animated, KeyboardAvoidingView,
  Platform, StyleSheet
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../src/firebaseconfig' // Adjust path if needed
import { useRouter } from 'expo-router';
import { BlurView } from "expo-blur";


const { height, width } = Dimensions.get('window');

export default function Onboarding() {
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'parent' | 'caregiver' | null>(null);
  const [loading,setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const router = useRouter();

  const cardAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const handleGetStarted = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration:200,
        useNativeDriver: true,
      })
    ]).start(() => {
      setShowForm(true);
      Animated.spring(cardAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 45,
        friction: 7,
      }).start();
    });
  };

  const handleBack = () => {
    Animated.timing(cardAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setShowForm(false);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration:300,
        useNativeDriver: true,
      }).start();
    });
  };

  const handleSignUp = async () => {
    if (!role) return Alert.alert('Please proceed to Choose your role', 'Are you a Parent or Caregiver?');
    if (!email || !password) return Alert.alert('Missing info','Please fill in all the fields');
    if (password.length<6) return Alert.alert('Weak password','Input at least 6 characters');
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);

      //Save role to Firestore immediately on signup
      await setDoc(doc(db, 'users', userCredential.user.uid), { 
        email: email.trim(),
        role,
        createdAt: new Date(),
        ...(role === 'caregiver' && {
        verificationStatus: 'pending',
        available: false ,
        }),
      });

      // Route based on role
      if (role === "parent") {
        router.replace("/(app)/child-setup");
      } else if(role === 'caregiver') {
        router.replace("/(caregiver)/caregiver-setup");
      } else 
        router.replace('/(app)/(tabs)/home');
    } catch (error: any) {
      const message =
      error.code === 'auth/email-already-in-use' ? 'This email is already registered. Please sign in.' :
      error.code === 'auth/invalid-email' ? 'Please enter a valid email address.' :
      'Sign up failed. Please try again.';
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const cardTranslateY = cardAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [height, 0],
  });

  const cardOpacity = cardAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0.8, 1],
  });

  return (
   <View style={styles.root}>
      {/* Full-bleed background image */}
      <Image
        source={require('../../assets/images/kids-hero.png')}
        style={styles.bgImage}
        resizeMode="cover"
      />

      {/* Dark overlay with purple tint */}
      <View style={styles.overlay} />

      {/* Decorative blur orbs */}
      <View style={[styles.orb, styles.orbTopLeft]} />
      <View style={[styles.orb, styles.orbBottomRight]} />

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >

          {/* ── HERO STATE ── */}
          {!showForm && (
            <Animated.View style={[styles.heroContainer, { opacity: fadeAnim }]}>
              {/* Logo badge */}
              <Image
                source={require('../../assets/images/safe-totos-logo.png')}
                style={{ width: 180, height: 180, resizeMode: 'contain' }}
              />
              <Text style={{
                fontFamily: 'DancingScript',
                fontStyle: 'italic',
                fontSize: 22,
                textAlign: 'center',
              }}>
                Peace of mind for working parents
              </Text>

              {/* Stats row */}
              <View style={styles.statsRow}>
                {[
                  { value: '2.4K+', label: 'Families' },
                  { value: '98%', label: 'Safe Zones' },
                  { value: '500+', label: 'Caregivers' },
                ].map((stat, i) => (
                  <View key={i} style={styles.statItem}>
                    <Text style={styles.statValue}>{stat.value}</Text>
                    <Text style={styles.statLabel}>{stat.label}</Text>
                  </View>
                ))}
              </View>

              {/* CTA Button */}
              <TouchableOpacity
                onPress={handleGetStarted}
                style={styles.ctaButton}
                activeOpacity={0.85}
              >
                <Text style={styles.ctaText}>Get Started</Text>
                <Text style={styles.ctaArrow}>→</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => router.push('/(auth)/signin')}>
                <Text style={styles.signInHint}>
                  Already have an account?{' '}
                  <Text style={styles.signInLink}>Sign in</Text>
                </Text>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* ── FLOATING CARD FORM ── */}
          {showForm && (
            <Animated.View
              style={[
                styles.floatingCard,
                {
                  opacity: cardOpacity,
                  transform: [{ translateY: cardTranslateY }],
                },
              ]}
            >
              {/* Glass card using BlurView */}
              <BlurView intensity={40} tint="dark" style={styles.blurCard}>
                {/* Card handle */}
                <View style={styles.cardHandle} />

                {/* Back button */}
                <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
                  <Text style={styles.backText}>← Back</Text>
                </TouchableOpacity>

                <Text style={styles.cardTitle}>Create Account</Text>
                <Text style={styles.cardSubtitle}>Join Safe Totos Kenya today</Text>

                {/* Role selector — FIRST for better UX */}
                <Text style={styles.fieldLabel}>I AM A...</Text>
                <View style={styles.roleRow}>
                  {(['parent', 'caregiver'] as const).map((r) => (
                    <TouchableOpacity
                      key={r}
                      onPress={() => setRole(r)}
                      style={[
                        styles.roleCard,
                        role === r && styles.roleCardActive,
                      ]}
                      activeOpacity={0.8}
                    >
                      {role === r && <View style={styles.roleGlow} />}
                      <Text style={styles.roleEmoji}>
                        {r === 'parent' ? '👨‍👩‍👧' : '🤝'}
                      </Text>
                      <Text style={[
                        styles.roleLabel,
                        role === r && styles.roleLabelActive
                      ]}>
                        {r === 'parent' ? 'Parent' : 'Caregiver'}
                      </Text>
                      {role === r && (
                        <View style={styles.roleCheck}>
                          <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>✓</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Email */}
                <Text style={styles.fieldLabel}>EMAIL</Text>
                <View style={[
                  styles.inputWrapper,
                  focusedField === 'email' && styles.inputWrapperFocused
                ]}>
                  <Text style={styles.inputIcon}>✉️</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="you@example.com"
                    placeholderTextColor="rgba(186,230,253,0.4)"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>

                {/* Password */}
                <Text style={styles.fieldLabel}>PASSWORD</Text>
                <View style={[
                  styles.inputWrapper,
                  focusedField === 'password' && styles.inputWrapperFocused
                ]}>
                  <Text style={styles.inputIcon}>🔒</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Min. 6 characters"
                    placeholderTextColor="rgba(186,230,253,0.4)"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>

                {/* Submit */}
                <TouchableOpacity
                  onPress={handleSignUp}
                  disabled={loading}
                  style={[styles.submitBtn, loading && styles.submitBtnLoading]}
                  activeOpacity={0.85}
                >
                  <Text style={styles.submitText}>
                    {loading ? 'Creating account...' : 'Create Account'}
                  </Text>
                  {!loading && <Text style={styles.submitArrow}>→</Text>}
                </TouchableOpacity>
              </BlurView>
            </Animated.View>
          )}

        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0F0C29',
  },
  bgImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(15, 12, 41, 0.72)',
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.25,
  },
  orbTopLeft: {
    width: 220,
    height: 220,
    backgroundColor: '#0284C7',
    top: -60,
    left: -60,
  },
  orbBottomRight: {
    width: 280,
    height: 280,
    backgroundColor: '#0369A1',
    bottom: -80,
    right: -80,
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'flex-end',
  },

  // ── HERO ──
  heroContainer: {
    paddingHorizontal: 28,
    paddingBottom: 48,
  },
  logoBadge: {
    width: 120,
    height: 120,
    borderRadius: 30,
    backgroundColor: 'rgba(43, 191, 191, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(43, 191, 191, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  logoEmoji: {
    fontSize: 30,
  },
  heroTitle: {
    fontSize: 52,
    fontWeight: '900',
    color: '#F5F3FF',
    letterSpacing: -2,
    lineHeight: 56,
    marginBottom: 14,
  },
  heroSubtitle: {
    fontSize: 15,
    color: 'rgba(186,230,253,0.8)',
    lineHeight: 23,
    marginBottom: 32,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 0,
    marginBottom: 36,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: 18,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#38BDF8',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(186,230,253,0.6)',
    fontWeight: '500',
  },
  ctaButton: {
    backgroundColor: '#0284C7',
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
    gap: 8,
  },
  ctaText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  ctaArrow: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 18,
    fontWeight: '300',
  },
  signInHint: {
    color: 'rgba(186,230,253,0.6)',
    fontSize: 13,
    textAlign: 'center',
  },
  signInLink: {
    color: '#38BDF8',
    fontWeight: '700',
  },

  // ── FLOATING CARD ──
  floatingCard: {
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 20,
    // Glass border
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  blurCard: {
    padding: 24,
    paddingBottom: 32,
  },
  cardHandle: {
    width: 36,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  backBtn: {
    marginBottom: 16,
  },
  backText: {
    color: '#BAE6FD',
    fontSize: 14,
    fontWeight: '500',
  },
  cardTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#F5F3FF',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  cardSubtitle: {
    color: 'rgba(186,230,253,0.6)',
    fontSize: 13,
    marginBottom: 24,
  },
  fieldLabel: {
    color: 'rgba(186,230,253,0.7)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  roleRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 22,
  },
  roleCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  roleCardActive: {
    borderColor: '#0284C7',
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
  },
  roleGlow: {
    position: 'absolute',
    top: -20,
    left: -20,
    right: -20,
    height: 60,
    backgroundColor: 'rgba(2,132,199,0.3)',
    borderRadius: 30,
  },
  roleEmoji: {
    fontSize: 26,
    marginBottom: 6,
  },
  roleLabel: {
    color: 'rgba(186,230,253,0.6)',
    fontSize: 13,
    fontWeight: '600',
  },
  roleLabelActive: {
    color: '#E9D5FF',
  },
  roleCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 14,
    marginBottom: 16,
    height: 52,
  },
  inputWrapperFocused: {
    borderColor: '#0284C7',
    backgroundColor: 'rgba(2,132,199,0.12)',
  },
  inputIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: '#F5F3FF',
    fontSize: 15,
    height: '100%',
  },
  submitBtn: {
    marginTop: 8,
    backgroundColor: '#0284C7',
    borderRadius: 16,
    paddingVertical: 17,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 10,
  },
  submitBtnLoading: {
    backgroundColor: '#F5F3FF',
    shadowOpacity: 0,
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  submitArrow: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 18,
  },
});
