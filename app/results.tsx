import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuroraBackground } from '../components/AuroraBackground';
import { OrbRefresh } from '../components/OrbRefresh';
import { RecipeCard } from '../components/RecipeCard';
import { RecipeDetail } from '../components/RecipeDetail';
import { TabBar } from '../components/TabBar';
import { EmptyState, IconButton, LiveBadge, SectionHeader, Skeleton } from '../components/ui';
import { useApp } from '../lib/store';
import { palette, spacing, useResponsive } from '../lib/theme';

/**
 * Results screen: recipe cards in a sheet over the hero, with the
 * custom glass-orb pull-to-refresh. On tablets / foldables unfolded
 * and desktop, the list and the selected recipe sit side by side in a
 * two-pane split (key content kept clear of the centre crease).
 */
export default function ResultsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const r = useResponsive();
  const { results, resultSource, loading, error, ingredients, refreshResults, toggleSaved, isSaved } =
    useApp();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [refreshSignal, setRefreshSignal] = useState(0);

  // The selected recipe is derived during render: the tapped card if it is
  // still in the list, otherwise the first result. No effect needed.
  const selected = results.find((x) => x.id === selectedId) ?? results[0];
  /** In the two-pane split the list pane is half the screen, so one column. */
  const columns = r.twoPane ? 1 : r.columns;

  const header = (
    <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) + 4 }]}>
      <IconButton label="‹" onPress={() => router.back()} />
      <View style={styles.headerTitleBlock}>
        <Text style={styles.headerTitle}>Your recipes</Text>
        <Text style={styles.headerSub}>
          {ingredients.length} ingredient{ingredients.length === 1 ? '' : 's'} · {results.length} idea
          {results.length === 1 ? '' : 's'}
        </Text>
      </View>
      {resultSource === 'live' ? <LiveBadge /> : null}
      <IconButton label="⟳" onPress={() => setRefreshSignal((s) => s + 1)} />
    </View>
  );

  const listContent = (
    <View style={[styles.listShell, { maxWidth: r.contentMaxWidth, paddingHorizontal: r.pad }]}>
      <SectionHeader kicker="From your fridge" title="Cook one of these tonight" />
      {loading && results.length === 0 ? (
        <View style={styles.skeletons}>
          <Skeleton width="100%" height={190} radius={30} />
          <Skeleton width="100%" height={190} radius={30} />
          <Skeleton width="100%" height={190} radius={30} />
        </View>
      ) : null}
      {error && results.length === 0 ? (
        <EmptyState
          glyph="🍳"
          title="Nothing came back from the kitchen"
          body={error}
          actionLabel="Try again"
          onAction={() => void refreshResults()}
        />
      ) : null}
      {!loading && !error && results.length === 0 ? (
        <EmptyState
          glyph="🥕"
          title="No recipes yet"
          body="Add a few ingredients on the Cook tab and we will find recipes that use them."
          actionLabel="Add ingredients"
          onAction={() => router.replace('/')}
        />
      ) : null}
      <View style={styles.grid}>
        {results.map((recipe, i) => (
          <View key={recipe.id} style={[styles.cardWrap, { width: `${100 / columns}%` }]}>
            <RecipeCard
              recipe={recipe}
              index={i}
              onOpen={r.twoPane ? () => setSelectedId(recipe.id) : undefined}
            />
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.root}>
      <AuroraBackground />
      {header}
      {r.twoPane ? (
        <View style={styles.twoPane}>
          <View style={styles.twoPaneList}>
            <OrbRefresh onRefresh={refreshResults} refreshSignal={refreshSignal}>
              {listContent}
            </OrbRefresh>
          </View>
          <View style={styles.crease} />
          <ScrollView
            style={styles.twoPaneDetail}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 150, paddingTop: 8 }}
          >
            {selected ? (
              <RecipeDetail
                recipe={selected}
                saved={isSaved(selected.id)}
                onToggleSaved={() => toggleSaved(selected)}
              />
            ) : (
              <EmptyState glyph="🍽" title="Pick a recipe" body="Tap a card on the left to see it here." />
            )}
          </ScrollView>
        </View>
      ) : (
        <View style={styles.singlePane}>
          <OrbRefresh onRefresh={refreshResults} refreshSignal={refreshSignal}>
            {listContent}
          </OrbRefresh>
        </View>
      )}
      <TabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    paddingBottom: 8,
    paddingHorizontal: 16,
  },
  headerTitleBlock: { flex: 1 },
  headerTitle: { color: palette.ink, fontSize: 22, fontWeight: '800', letterSpacing: -0.3 },
  headerSub: { color: palette.muted, fontSize: 13, fontWeight: '600', marginTop: 2 },
  listShell: { alignSelf: 'center', width: '100%' },
  skeletons: { gap: spacing.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6, marginTop: spacing.md },
  cardWrap: { padding: 6 },
  singlePane: { flex: 1 },
  twoPane: { flex: 1, flexDirection: 'row' },
  twoPaneList: { flex: 1 },
  twoPaneDetail: { flex: 1.15, paddingHorizontal: 16 },
  crease: { backgroundColor: palette.line, marginVertical: 16, width: 1 },
});
