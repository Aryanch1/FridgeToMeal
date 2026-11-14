import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuroraBackground } from '../components/AuroraBackground';
import { GhostButton, PrimaryButton } from '../components/ui';
import { useApp } from '../lib/store';
import { palette, radii, spacing } from '../lib/theme';

type Mode = 'options' | 'login' | 'signup' | 'forgot';

/** Plain-language messages for the Firebase auth errors a user can hit. */
function friendlyAuthError(e: unknown): string {
  const code = (e as { code?: string })?.code ?? '';
  switch (code) {
    case 'auth/email-already-in-use':
      return 'That email already has an account. Try Log in instead.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Email or password does not match. Check both and try again.';
    case 'auth/weak-password':
      return 'Password is too weak — use at least 6 characters.';
    case 'auth/invalid-email':
      return 'That email address does not look right.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Wait a minute and try again.';
    default:
      return 'Something went wrong. Please try again.';
  }
}

/**
 * Welcome / sign-in screen — the first thing a signed-out user sees,
 * like every other app. Options: create an account with email, log in
 * with email, continue with Google (which also creates the account on
 * first use), or continue without an account (everything stays
 * on-device).
 */
export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signIn, signInWithEmail, signUpWithEmail, resetPasswordForEmail, continueAsGuest } =
    useApp();
  const [mode, setMode] = useState<Mode>('options');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const doGoogle = async () => {
    setBusy(true);
    setMsg(null);
    try {
      await signIn();
      // The layout gate routes to Home as soon as the user lands.
    } catch {
      setMsg('Google sign-in did not complete. Please try again.');
      setBusy(false);
    }
  };

  const doGuest = () => {
    continueAsGuest();
    router.replace('/');
  };

  const doSubmit = async () => {
    if (mode === 'signup' && password !== confirm) {
      setMsg('Passwords do not match. Enter the same password twice.');
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      if (mode === 'signup') {
        await signUpWithEmail(name, email, password);
        // Success: the layout gate routes to Home.
      } else if (mode === 'login') {
        await signInWithEmail(email, password);
        // Success: the layout gate routes to Home.
      } else {
        await resetPasswordForEmail(email);
        setMsg('Sent — check your email to reset your password.');
        setBusy(false);
      }
    } catch (e) {
      setMsg(friendlyAuthError(e));
      setBusy(false);
    }
  };

  const openForm = (next: Mode) => {
    setMode(next);
    setMsg(null);
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
            Cook what’s already in your fridge. Create an account or log in to keep your recipes
            in your account — they follow you on every device.
          </Text>
        </Animated.View>

        {mode === 'options' ? (
          <Animated.View entering={FadeInDown.duration(500).delay(120)} style={styles.actions}>
            <Text style={styles.optionsLabel}>CREATE YOUR ACCOUNT OR LOG IN</Text>
            <PrimaryButton
              label={busy ? 'Opening Google…' : 'Continue with Google'}
              onPress={doGoogle}
              disabled={busy}
            />
            <Text style={styles.caption}>New or returning — Google handles both.</Text>
            <GhostButton label="Create account" onPress={() => openForm('signup')} />
            <GhostButton label="Log in" onPress={() => openForm('login')} />
            {msg ? <Text style={styles.msg}>{msg}</Text> : null}
            <Text style={styles.guestLink} onPress={doGuest}>
              Continue without an account
            </Text>
            <Text style={styles.fine}>
              Signed in, your saved recipes and fridge list sync to your own account. Without an
              account, they stay only on this device.
            </Text>
          </Animated.View>
        ) : (
          <Animated.View entering={FadeInDown.duration(400)} style={styles.actions}>
            <Text style={styles.formTitle}>
              {mode === 'signup'
                ? 'Create your account'
                : mode === 'forgot'
                  ? 'Reset your password'
                  : 'Welcome back'}
            </Text>
            {mode === 'forgot' ? (
              <Text style={styles.caption}>
                Enter your account email and we will send you a link to reset your password.
              </Text>
            ) : null}
            {mode === 'signup' ? (
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Your name"
                placeholderTextColor={palette.muted}
                autoCapitalize="words"
                autoComplete="name"
              />
            ) : null}
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Email address"
              placeholderTextColor={palette.muted}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              autoComplete="email"
            />
            {mode !== 'forgot' ? (
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Password"
                placeholderTextColor={palette.muted}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              />
            ) : null}
            {mode === 'signup' ? (
              <TextInput
                style={styles.input}
                value={confirm}
                onChangeText={setConfirm}
                placeholder="Confirm password"
                placeholderTextColor={palette.muted}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="new-password"
              />
            ) : null}
            {mode === 'login' ? (
              <Text style={styles.guestLink} onPress={() => openForm('forgot')}>
                Forgot password?
              </Text>
            ) : null}
            {msg ? <Text style={styles.msg}>{msg}</Text> : null}
            <PrimaryButton
              label={
                busy
                  ? 'Please wait…'
                  : mode === 'signup'
                    ? 'Create account'
                    : mode === 'forgot'
                      ? 'Send reset link'
                      : 'Log in'
              }
              onPress={doSubmit}
              disabled={busy}
            />
            <GhostButton
              label="Back"
              onPress={() => openForm(mode === 'forgot' ? 'login' : 'options')}
            />
          </Animated.View>
        )}
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
  optionsLabel: {
    color: palette.primary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    textAlign: 'center',
  },
  caption: { color: palette.muted, fontSize: 13, textAlign: 'center', marginTop: -spacing.sm },
  guestLink: {
    color: palette.primary,
    fontSize: 15,
    fontWeight: '700',
    paddingVertical: spacing.sm,
    textAlign: 'center',
  },
  formTitle: { color: palette.ink, fontSize: 22, fontWeight: '800', textAlign: 'center' },
  input: {
    backgroundColor: palette.glassStrong,
    borderColor: palette.line,
    borderRadius: radii.input,
    borderWidth: 1,
    color: palette.ink,
    fontSize: 16,
    minHeight: 54,
    paddingHorizontal: spacing.md,
  },
  msg: { color: palette.body, fontSize: 14, lineHeight: 20, textAlign: 'center' },
  fine: { color: palette.muted, fontSize: 13, lineHeight: 19, textAlign: 'center' },
});
