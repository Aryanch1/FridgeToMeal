import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuroraBackground } from '../components/AuroraBackground';
import { TabBar } from '../components/TabBar';
import { GlassCard, PrimaryButton, SectionHeader } from '../components/ui';
import { palette, spacing, useResponsive } from '../lib/theme';

const FAQS = [
  {
    q: 'How does FridgeToMeal work?',
    a: 'Type in the ingredients you already have — or tap the quick-add chips — pick a diet and a meal type, then tap “Find recipes”. You get 4 recipes ranked by how much of each one you already own.',
  },
  {
    q: 'What does the match % mean?',
    a: 'It is the share of that recipe’s ingredients you already have. 100% means everything is in your fridge and no shopping trip is needed.',
  },
  {
    q: 'Where do the recipes come from?',
    a: 'Gemini AI suggests every recipe live, through FridgeToMeal’s own recipe service — there is no built-in sample set. If the service cannot be reached, the app says so and lets you retry.',
  },
  {
    q: 'Is my food data sent anywhere?',
    a: 'Only the ingredient list itself is sent to the recipe service when you search, and only to generate your recipes. If you sign in with Google, your saved recipes and fridge list are stored in your own account so they follow you across devices; signed out, they stay only on this device.',
  },
  {
    q: 'How do I refresh the suggestions?',
    a: 'On your phone, pull the results list down — a glass orb fills as you pull, then fresh recipes load. On the web, tap the refresh button in the results header.',
  },
  {
    q: 'Can I save a recipe for later?',
    a: 'Yes — open any recipe and tap “Save recipe”. Signed in, saved recipes live in your account and appear on all your devices; signed out, they live on the Saved tab on this device.',
  },
];

export default function HelpScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const r = useResponsive();

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
          <SectionHeader kicker="Need a hand?" title="Help & how it works" />
          {FAQS.map((faq) => (
            <GlassCard key={faq.q} style={styles.card}>
              <Text style={styles.q}>{faq.q}</Text>
              <Text style={styles.a}>{faq.a}</Text>
            </GlassCard>
          ))}
          <View style={styles.cta}>
            <PrimaryButton label="Start cooking" onPress={() => router.replace('/')} />
          </View>
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
  q: { color: palette.ink, fontSize: 17, fontWeight: '800', letterSpacing: -0.2, marginBottom: 6 },
  a: { color: palette.body, fontSize: 15, lineHeight: 22 },
  cta: { marginTop: spacing.sm },
});
