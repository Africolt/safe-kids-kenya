import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Onboarding from './src/screens/Onboarding';

export default function App() {
  return (
    <SafeAreaProvider>
      <Onboarding/>
    </SafeAreaProvider>
  );
}

