import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Image, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuroraBackground } from '../components/AuroraBackground';
import { TabBar } from '../components/TabBar';
import { GhostButton, GlassCard, PrimaryButton, SectionHeader } from '../components/ui';
import { useApp } from '../lib/store';
import { palette, spacing, useResponsive } from '../lib/theme';

/** Settings / profile screen: preferences, saved data, about. */
export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const r = useResponsive();
  const { saved, clearSaved, clearIngredients, resultSource, user, signIn, signOut } = useApp();
  const [confirmClear, setConfirmClear] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [authMsg, setAuthMsg] = useState<string | null>(null);

  const doSignIn = async () => {
    setAuthBusy(true);
    setAuthMsg(null);
    try {
      await signIn();
    } catch {
      setAuthMsg('Sign-in did not complete. Please try again.');
    } finally {
      setAuthBusy(false);
    }
  };

  const doSignOut = async () => {
    setAuthBusy(true);
    try {
      await signOut();
    } finally {
      setAuthBusy(false);
    }
  };

  const doClearSaved = () => {
    if (Platform.OS === 'web') {
      if (confirmClear) {
        clearSaved();
        setConfirmClear(false);
      } else {
        setConfirmClear(true);
      }
      return;
    }
    Alert.alert('Clear saved recipes?', 'This removes all saved recipes from this device.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: clearSaved },
    ]);
  };

  return (
    <View style={styles.root}>
      <AuroraBackground />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: Math.max(insets.top, 16) + 8, paddingBottom: 150 },
        ]}
      >
        <View style={[styles.shell, { maxWidth: r.contentMaxWidth, paddingHorizontal: r.pad }]}>
          <SectionHeader kicker="Your app" title="Settings" />

          <GlassCard style={styles.card}>
            <Text style={styles.cardTitle}>Account</Text>
            {user ? (
              <>
                <View style={styles.profileRow}>
                  {user.photo ? (
                    <Image source={{ uri: user.photo }} style={styles.avatar} />
                  ) : (
                    <View style={[styles.avatar, styles.avatarFallback]}>
                      <Text style={styles.avatarInitial}>
                        {(user.name ?? user.email ?? '?').slice(0, 1).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <View style={styles.profileText}>
                    <Text style={styles.profileName}>{user.name ?? 'Signed in'}</Text>
                    <Text style={styles.profileEmail}>{user.email ?? ''}</Text>
                  </View>
                </View>
                <Text style={styles.cardBody}>
                  Your saved recipes and fridge list sync to your account, so they are there on
                  every device you sign in on.
                </Text>
                <View style={styles.row}>
                  <GhostButton label={authBusy ? 'Signing out…' : 'Sign out'} onPress={doSignOut} />
                </View>
              </>
            ) : (
              <>
                <Text style={styles.cardBody}>
                  Sign in with Google to keep your saved recipes and fridge list in your account —
                  they follow you across devices, and signing in takes a few seconds.
                </Text>
                {authMsg ? <Text style={styles.authMsg}>{authMsg}</Text> : null}
                <View style={styles.row}>
                  <PrimaryButton
                    label={authBusy ? 'Opening Google…' : 'Continue with Google'}
                    onPress={doSignIn}
                    disabled={authBusy}
                  />
                </View>
              </>
            )}
          </GlassCard>

          <GlassCard style={styles.card}>
            <Text style={styles.cardTitle}>Recipes</Text>
            <Text style={styles.cardBody}>
              {saved.length} saved recipe{saved.length === 1 ? '' : 's'} ·{' '}
              {user ? 'synced to your account.' : 'stored only on this device.'}
            </Text>
            <Text style={styles.cardBody}>
              Suggestions: {resultSource === 'live' ? 'live AI' : 'not searched yet'}
            </Text>
            <View style={styles.row}>
              <GhostButton
                label={confirmClear ? 'Tap again to confirm' : 'Clear saved recipes'}
                onPress={doClearSaved}
              />
            </View>
          </GlassCard>

          <GlassCard style={styles.card}>
            <Text style={styles.cardTitle}>Fridge</Text>
            <Text style={styles.cardBody}>Start fresh with an empty ingredient list.</Text>
            <View style={styles.row}>
              <GhostButton label="Clear ingredients" onPress={clearIngredients} />
            </View>
          </GlassCard>

          <GlassCard style={styles.card}>
            <Text style={styles.cardTitle}>About FridgeToMeal</Text>
            <Text style={styles.cardBody}>
              FridgeToMeal turns what’s already in your fridge into dinner ideas, so less good food
              ends up wasted. Enter your leftovers, pick a diet and a meal, and get recipes ranked
              by how much you already have.
            </Text>
            <Text style={styles.cardBody}>
              Version 1.1.0 · Built with React Native, Expo and TypeScript. Every recipe is
              suggested live by Gemini AI through the hosted recipe service. Signed in, your
              saved recipes and fridge list sync to your own account; signed out, they stay on
              this device.
            </Text>
            <Text style={styles.copy}>© 2026 Aryanmouli Cherupalli</Text>
            <View style={styles.row}>
              <PrimaryButton label="How it works" onPress={() => router.push('/help')} />
            </View>
          </GlassCard>
        </View>
      </ScrollView>
      <TabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  shell: { alignSelf: 'center', width: '100%' },
  card: { marginBottom: spacing.md },
  cardTitle: { color: palette.ink, fontSize: 18, fontWeight: '800', marginBottom: spacing.sm },
  cardBody: { color: palette.body, fontSize: 15, lineHeight: 22, marginBottom: spacing.sm },
  copy: { color: palette.muted, fontSize: 13, fontWeight: '600', marginBottom: spacing.md },
  row: { marginTop: spacing.sm },
  profileRow: { alignItems: 'center', flexDirection: 'row', marginBottom: spacing.sm },
  avatar: { borderRadius: 26, height: 52, width: 52 },
  avatarFallback: {
    alignItems: 'center',
    backgroundColor: palette.primarySoft,
    justifyContent: 'center',
  },
  avatarInitial: { color: palette.primary, fontSize: 22, fontWeight: '800' },
  profileText: { flex: 1, marginLeft: spacing.md },
  profileName: { color: palette.ink, fontSize: 17, fontWeight: '800' },
  profileEmail: { color: palette.muted, fontSize: 14, fontWeight: '600', marginTop: 2 },
  authMsg: { color: palette.body, fontSize: 14, lineHeight: 20, marginBottom: spacing.sm },
});
