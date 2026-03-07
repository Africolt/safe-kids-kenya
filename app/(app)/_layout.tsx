import { Stack } from 'expo-router';
export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="child-setup" />
      <Stack.Screen name="map" />
    </Stack>
  );
}
