import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppProvider, useApp } from '@/lib/store';

/**
 * Sign-in gate: a signed-out user who hasn't chosen guest mode lands on
 * the Welcome screen first — the same ask every other app makes — and a
 * fresh sign-in routes straight back into the app.
 */
function Gate() {
  const { user, authReady, guest } = useApp();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!authReady) return;
    const onWelcome = segments[0] === 'welcome';
    if (!user && !guest && !onWelcome) {
      router.replace('/welcome');
    } else if (user && onWelcome) {
      router.replace('/');
    }
  }, [user, guest, authReady, segments, router]);

  if (!authReady) {
    // Brief hold while Firebase restores any existing session.
    return <View style={{ flex: 1, backgroundColor: '#EAF7EE' }} />;
  }

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="index" />
      <Stack.Screen name="results" />
      <Stack.Screen name="recipe/[id]" />
      <Stack.Screen name="saved" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="help" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppProvider>
          <StatusBar style="dark" />
          <Gate />
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
