import { Stack } from 'expo-router';
export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{gestureEnabled:false}}/>
      <Stack.Screen name="child-setup" options={{gestureEnabled:false}}/>
      <Stack.Screen name="map" />
      <Stack.Screen name="caregiver-profile" />
      <Stack.Screen name="booking" />
      <Stack.Screen name="mpesa-payment" />
      <Stack.Screen name="booking-confirmation" />
      <Stack.Screen name="parental-guidance" />
      <Stack.Screen name="chat" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="report-incident" />
      <Stack.Screen name="emergency" />
      <Stack.Screen name="sos" />
    </Stack>
  );
}
