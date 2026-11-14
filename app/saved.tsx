import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuroraBackground } from '../components/AuroraBackground';
import { RecipeCard } from '../components/RecipeCard';
import { TabBar } from '../components/TabBar';
import { EmptyState, SectionHeader } from '../components/ui';
import { useApp } from '../lib/store';
import { palette, spacing, useResponsive } from '../lib/theme';

/** Saved recipes — favourites kept on-device. */
export default function SavedScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const r = useResponsive();
  const { saved } = useApp();

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
          <SectionHeader kicker="Your collection" title="Saved recipes" />
          {saved.length === 0 ? (
            <EmptyState
              glyph="♥"
              title="Nothing saved yet"
              body="When a recipe looks good, tap “Save recipe” on its detail page and it will live here for next time."
              actionLabel="Find a recipe"
              onAction={() => router.replace('/')}
            />
          ) : (
            <>
              <Text style={styles.count}>
                {saved.length} recipe{saved.length === 1 ? '' : 's'} · kept on this device
              </Text>
              <View style={styles.grid}>
                {saved.map((recipe, i) => (
                  <View key={recipe.id} style={[styles.cardWrap, { width: `${100 / r.columns}%` }]}>
                    <RecipeCard recipe={recipe} index={i} />
                  </View>
                ))}
              </View>
            </>
          )}
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
  count: { color: palette.muted, fontSize: 14, fontWeight: '600', marginBottom: spacing.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6, marginTop: spacing.sm },
  cardWrap: { padding: 6 },
});
