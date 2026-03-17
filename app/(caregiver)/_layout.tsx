import { Stack } from 'expo-router';
export default function CaregiverLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="booking-detail" />
      <Stack.Screen name="availability" />
      <Stack.Screen name="id-verification" />
      <Stack.Screen name="caregiver-setup" />
      <Stack.Screen name="sos" />
      <Stack.Screen name="medical-emergency" />
    </Stack>
  );
}
