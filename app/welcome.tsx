import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuroraBackground } from '../components/AuroraBackground';
import { GhostButton, PrimaryButton } from '../components/ui';
import { useApp } from '../lib/store';
import { palette, spacing } from '../lib/theme';

/**
 * Welcome / sign-in screen — the first thing a signed-out user sees,
 * like every other app. Continue with Google signs in (or creates the
 * account); "Continue without an account" keeps everything on-device.
 */
export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signIn, continueAsGuest } = useApp();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const doSignIn = async () => {
    setBusy(true);
    setMsg(null);
    try {
      await signIn();
      // The layout gate routes to Home as soon as the user lands.
    } catch {
      setMsg('Sign-in did not complete. Please try again.');
      setBusy(false);
    }
  };

  const doGuest = () => {
    continueAsGuest();
    router.replace('/');
  };

  return (
    <View style={styles.root}>
      <AuroraBackground />
      <View
        style={[
          styles.shell,
          { paddingTop: Math.max(insets.top, 16) + 24, paddingBottom: Math.max(insets.bottom, 16) + 24 },
        ]}
      >
        <Animated.View entering={FadeIn.duration(500)} style={styles.hero}>
          <View style={styles.orb}>
            <Text style={styles.orbGlyph}>●</Text>
          </View>
          <Text style={styles.title}>FridgeToMeal</Text>
          <Text style={styles.tagline}>
            Cook what’s already in your fridge. Sign in to keep your recipes in your account —
            they follow you on every device.
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(500).delay(120)} style={styles.actions}>
          <PrimaryButton
            label={busy ? 'Opening Google…' : 'Continue with Google'}
            onPress={doSignIn}
            disabled={busy}
          />
          {msg ? <Text style={styles.msg}>{msg}</Text> : null}
          <View style={styles.guestRow}>
            <GhostButton label="Continue without an account" onPress={doGuest} />
          </View>
          <Text style={styles.fine}>
            Signed in, your saved recipes and fridge list sync to your own account. As a guest,
            they stay only on this device.
          </Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  shell: {
    alignSelf: 'center',
    flex: 1,
    justifyContent: 'space-between',
    maxWidth: 480,
    paddingHorizontal: spacing.lg,
    width: '100%',
  },
  hero: { alignItems: 'center', marginTop: spacing.xl },
  orb: {
    alignItems: 'center',
    backgroundColor: palette.primary,
    borderRadius: 52,
    height: 104,
    justifyContent: 'center',
    marginBottom: spacing.lg,
    width: 104,
  },
  orbGlyph: { color: '#FFFFFF', fontSize: 40 },
  title: { color: palette.ink, fontSize: 38, fontWeight: '800', letterSpacing: -0.6, textAlign: 'center' },
  tagline: {
    color: palette.body,
    fontSize: 16,
    lineHeight: 24,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  actions: { gap: spacing.md },
  guestRow: { marginTop: spacing.xs },
  msg: { color: palette.body, fontSize: 14, lineHeight: 20, textAlign: 'center' },
  fine: { color: palette.muted, fontSize: 13, lineHeight: 19, textAlign: 'center' },
});
