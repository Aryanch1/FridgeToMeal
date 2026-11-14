import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { palette, radii, spacing, type } from '../lib/theme';
import type { Recipe } from '../lib/types';
import { GlassCard, SpringPress } from './ui';

/** Match ring: big bold number with a small quiet label. */
function MatchRing({ match }: { match: number }) {
  return (
    <View style={styles.ring}>
      <Text style={styles.ringNumber}>{match}%</Text>
      <Text style={styles.ringLabel}>MATCH</Text>
    </View>
  );
}

export function RecipeCard({
  recipe,
  index,
  onOpen,
}: {
  recipe: Recipe;
  index: number;
  onOpen?: (recipe: Recipe) => void;
}) {
  const router = useRouter();
  const open = () => {
    if (onOpen) onOpen(recipe);
    else router.push(`/recipe/${recipe.id}`);
  };
  const haveCount = recipe.ingredients.filter((i) => i.have).length;
  return (
    <Animated.View entering={FadeInDown.delay(index * 70).springify()}>
      <SpringPress onPress={open}>
        <GlassCard>
          <View style={styles.topRow}>
            <View style={styles.titleBlock}>
              <Text style={styles.cuisine}>{recipe.cuisine.toUpperCase()}</Text>
              <Text style={styles.title}>{recipe.title}</Text>
              <Text style={styles.description} numberOfLines={2}>
                {recipe.description}
              </Text>
            </View>
            <MatchRing match={recipe.match} />
          </View>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{recipe.timeMinutes}</Text>
              <Text style={styles.statLabel}>MINUTES</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{recipe.servings}</Text>
              <Text style={styles.statLabel}>SERVINGS</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statNumber}>
                {haveCount}/{recipe.ingredients.length}
              </Text>
              <Text style={styles.statLabel}>HAVE</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{recipe.difficulty}</Text>
              <Text style={styles.statLabel}>LEVEL</Text>
            </View>
          </View>
          <View style={styles.tagsRow}>
            {recipe.tags.map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
            {recipe.missing.length > 0 ? (
              <Text style={styles.missingText}>
                Missing: {recipe.missing.slice(0, 2).join(', ')}
                {recipe.missing.length > 2 ? ` +${recipe.missing.length - 2}` : ''}
              </Text>
            ) : (
              <Text style={styles.allHaveText}>Everything is in your fridge ✓</Text>
            )}
          </View>
        </GlassCard>
      </SpringPress>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', gap: spacing.md },
  titleBlock: { flex: 1 },
  cuisine: { ...type.label, color: palette.primary, marginBottom: 4 },
  title: { ...type.title, color: palette.ink, marginBottom: 6 },
  description: { ...type.body, color: palette.body },
  ring: {
    alignItems: 'center',
    backgroundColor: palette.primary,
    borderRadius: 40,
    height: 80,
    justifyContent: 'center',
    width: 80,
  },
  ringNumber: { color: '#FFFFFF', fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  ringLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  statsRow: {
    alignItems: 'center',
    borderTopColor: palette.line,
    borderTopWidth: 1,
    flexDirection: 'row',
    marginTop: spacing.md,
    paddingTop: spacing.md,
  },
  stat: { alignItems: 'center', flex: 1 },
  statNumber: { color: palette.ink, fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
  statLabel: { color: palette.muted, fontSize: 9, fontWeight: '800', letterSpacing: 1, marginTop: 2 },
  statDivider: { backgroundColor: palette.line, height: 28, width: 1 },
  tagsRow: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: spacing.md },
  tag: {
    backgroundColor: palette.primarySoft,
    borderRadius: radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tagText: { color: palette.primary, fontSize: 12, fontWeight: '700' },
  missingText: { color: palette.warning, fontSize: 12, fontWeight: '600' },
  allHaveText: { color: palette.primary, fontSize: 12, fontWeight: '700' },
});
