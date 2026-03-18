import { Stack } from 'expo-router';
export default function CaregiverLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="booking-detail" />
      <Stack.Screen name="availability" />
      <Stack.Screen name="id-verification" />
      <Stack.Screen name="caregiver-setup" options={{ gestureEnabled: false }}/>
      <Stack.Screen name="sos" />
      <Stack.Screen name="medical-emergency" />
      <Stack.Screen name="theme-settings" />
      <Stack.Screen name="edit-profile" />
      <Stack.Screen name="privacy-policy" />
      <Stack.Screen name="terms-of-service" />
      <Stack.Screen name="caregiver-agreement" />
    </Stack>
  );
}
