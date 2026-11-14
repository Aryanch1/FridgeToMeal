import { useRouter } from 'expo-router';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { Alert, Image, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
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
  const {
    saved,
    clearSaved,
    clearIngredients,
    resultSource,
    user,
    signOut,
    updateDisplayName,
    setAvatarData,
    sendPasswordReset,
  } = useApp();
  const [confirmClear, setConfirmClear] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  // null = untouched; the field then simply shows the account name.
  const [draftName, setDraftName] = useState<string | null>(null);
  const nameValue = draftName ?? user?.name ?? '';
  const [profileBusy, setProfileBusy] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);

  const doSignOut = async () => {
    setAuthBusy(true);
    try {
      await signOut();
    } finally {
      setAuthBusy(false);
    }
  };

  const doSaveName = async () => {
    if (!nameValue.trim() || nameValue.trim() === (user?.name ?? '')) return;
    setProfileBusy(true);
    setProfileMsg(null);
    try {
      await updateDisplayName(nameValue);
      setProfileMsg('Name updated.');
    } catch {
      setProfileMsg('Name could not be saved. Try again.');
    } finally {
      setProfileBusy(false);
    }
  };

  const doChangePicture = async () => {
    setProfileMsg(null);
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setProfileMsg('Photo access is needed to set a picture — allow it in your device settings.');
      return;
    }
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (picked.canceled || !picked.assets[0]) return;
    setProfileBusy(true);
    try {
      const resized = await ImageManipulator.manipulateAsync(
        picked.assets[0].uri,
        [{ resize: { width: 256, height: 256 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true },
      );
      if (!resized.base64) throw new Error('no image data');
      await setAvatarData(`data:image/jpeg;base64,${resized.base64}`);
      setProfileMsg('Profile picture updated.');
    } catch {
      setProfileMsg('That picture could not be saved. Try another one.');
    } finally {
      setProfileBusy(false);
    }
  };

  const doPasswordReset = async () => {
    setProfileBusy(true);
    setProfileMsg(null);
    try {
      await sendPasswordReset();
      setProfileMsg('Password reset email sent — check your inbox.');
    } catch {
      setProfileMsg('Reset email could not be sent. Try again.');
    } finally {
      setProfileBusy(false);
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
                    <Text style={styles.profileEmail}>
                      {user.provider === 'google.com'
                        ? 'Signed in with Google'
                        : 'Signed in with email'}
                    </Text>
                  </View>
                </View>
                <View style={styles.row}>
                  <GhostButton
                    label={profileBusy ? 'Working…' : 'Change profile picture'}
                    onPress={doChangePicture}
                  />
                </View>
                <Text style={styles.fieldLabel}>Name</Text>
                <TextInput
                  style={styles.input}
                  value={nameValue}
                  onChangeText={setDraftName}
                  placeholder="Your name"
                  placeholderTextColor={palette.muted}
                  autoCapitalize="words"
                  autoComplete="name"
                />
                {nameValue.trim() && nameValue.trim() !== (user.name ?? '') ? (
                  <View style={styles.row}>
                    <GhostButton
                      label={profileBusy ? 'Saving…' : 'Save name'}
                      onPress={doSaveName}
                    />
                  </View>
                ) : null}
                {user.provider === 'password' ? (
                  <View style={styles.row}>
                    <GhostButton
                      label="Email me a password reset link"
                      onPress={doPasswordReset}
                    />
                  </View>
                ) : null}
                {profileMsg ? <Text style={styles.authMsg}>{profileMsg}</Text> : null}
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
                  Create an account or log in to keep your saved recipes and fridge list in your
                  account — they follow you across devices. Use Google, or your email and a
                  password.
                </Text>
                <View style={styles.row}>
                  <PrimaryButton
                    label="Create account or log in"
                    onPress={() => router.push('/welcome')}
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
  authMsg: { color: palette.body, fontSize: 14, lineHeight: 20, marginBottom: spacing.sm, marginTop: spacing.sm },
  fieldLabel: {
    color: palette.muted,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 6,
    marginTop: spacing.md,
  },
  input: {
    backgroundColor: palette.glassStrong,
    borderColor: palette.line,
    borderRadius: 24,
    borderWidth: 1,
    color: palette.ink,
    fontSize: 16,
    minHeight: 52,
    paddingHorizontal: spacing.md,
  },
});
