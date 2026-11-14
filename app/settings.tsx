import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
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
  const { saved, clearSaved, clearIngredients, resultSource } = useApp();
  const [confirmClear, setConfirmClear] = useState(false);

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
            <Text style={styles.cardTitle}>Recipes</Text>
            <Text style={styles.cardBody}>
              {saved.length} saved recipe{saved.length === 1 ? '' : 's'} · stored only on this device.
            </Text>
            <Text style={styles.cardBody}>
              Suggestions: {resultSource === 'live' ? 'live AI' : resultSource === 'demo' ? 'demo recipes' : 'not searched yet'}
              {resultSource === 'demo'
                ? ' — the hosted AI endpoint is not configured, so the on-device recipe book answers.'
                : ''}
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
              Version 1.0.0 · Built with React Native, Expo and TypeScript. Recipes by Gemini AI
              when the hosted endpoint is configured, with an on-device demo recipe book as a
              fallback. Your ingredients and saved recipes never leave this device.
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
});
