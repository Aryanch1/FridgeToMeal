import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { palette, spacing, type } from '../lib/theme';
import type { Recipe } from '../lib/types';
import { GlassCard, GhostButton, PrimaryButton } from './ui';

/**
 * Full recipe detail — used by the /recipe/[id] screen and by the
 * right pane of the two-pane results layout on tablets / foldables.
 */
export function RecipeDetail({
  recipe,
  saved,
  onToggleSaved,
  onCooked,
}: {
  recipe: Recipe;
  saved: boolean;
  onToggleSaved: () => void;
  onCooked?: () => void;
}) {
  const have = recipe.ingredients.filter((i) => i.have);
  const missing = recipe.ingredients.filter((i) => !i.have);
  return (
    <View style={styles.root}>
      <Animated.View entering={FadeInDown.springify()}>
        <GlassCard>
          <Text style={styles.cuisine}>{recipe.cuisine.toUpperCase()}</Text>
          <Text style={styles.title}>{recipe.title}</Text>
          <Text style={styles.description}>{recipe.description}</Text>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{recipe.match}%</Text>
              <Text style={styles.statLabel}>MATCH</Text>
            </View>
            <View style={styles.statDivider} />
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
              <Text style={styles.statNumber}>{recipe.difficulty}</Text>
              <Text style={styles.statLabel}>LEVEL</Text>
            </View>
          </View>
          <View style={styles.actions}>
            <View style={{ flex: 1 }}>
              <PrimaryButton
                label={saved ? 'Saved ♥' : 'Save recipe'}
                onPress={onToggleSaved}
              />
            </View>
            {onCooked ? <GhostButton label="I cooked it ✓" onPress={onCooked} /> : null}
          </View>
        </GlassCard>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(90).springify()}>
        <GlassCard style={styles.section}>
          <Text style={styles.sectionTitle}>
            You have · {have.length} of {recipe.ingredients.length}
          </Text>
          {have.map((ing) => (
            <View key={ing.name} style={styles.ingRow}>
              <View style={styles.checkHave}>
                <Text style={styles.checkText}>✓</Text>
              </View>
              <Text style={styles.ingName}>{ing.name}</Text>
              <Text style={styles.ingAmount}>{ing.amount}</Text>
            </View>
          ))}
          {missing.length > 0 ? (
            <>
              <Text style={[styles.sectionTitle, styles.missingTitle]}>
                To pick up · {missing.length}
              </Text>
              {missing.map((ing) => (
                <View key={ing.name} style={styles.ingRow}>
                  <View style={styles.checkMissing}>
                    <Text style={styles.checkTextMissing}>○</Text>
                  </View>
                  <Text style={styles.ingName}>{ing.name}</Text>
                  <Text style={styles.ingAmount}>{ing.amount}</Text>
                </View>
              ))}
            </>
          ) : (
            <Text style={styles.allHave}>Everything is already in your fridge — no shopping needed.</Text>
          )}
        </GlassCard>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(180).springify()}>
        <GlassCard style={styles.section}>
          <Text style={styles.sectionTitle}>How to cook it</Text>
          {recipe.steps.map((step, i) => (
            <View key={`${i}-${step.slice(0, 16)}`} style={styles.stepRow}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{i + 1}</Text>
              </View>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </GlassCard>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.md },
  cuisine: { ...type.label, color: palette.primary, marginBottom: 4 },
  title: { ...type.title, color: palette.ink, fontSize: 28, lineHeight: 34, marginBottom: spacing.sm },
  description: { ...type.body, color: palette.body, fontSize: 16, lineHeight: 24 },
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
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  section: { marginTop: 0 },
  sectionTitle: { color: palette.ink, fontSize: 18, fontWeight: '800', letterSpacing: -0.2, marginBottom: spacing.md },
  missingTitle: { marginTop: spacing.lg },
  ingRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, paddingVertical: 7 },
  checkHave: {
    alignItems: 'center',
    backgroundColor: palette.primary,
    borderRadius: 14,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  checkMissing: {
    alignItems: 'center',
    backgroundColor: palette.warningSoft,
    borderColor: palette.warning,
    borderRadius: 14,
    borderWidth: 1,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  checkText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  checkTextMissing: { color: palette.warning, fontSize: 14, fontWeight: '800' },
  ingName: { color: palette.ink, flex: 1, fontSize: 15, fontWeight: '600' },
  ingAmount: { color: palette.muted, fontSize: 14 },
  allHave: { color: palette.primary, fontSize: 15, fontWeight: '600', marginTop: spacing.sm },
  stepRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  stepNumber: {
    alignItems: 'center',
    backgroundColor: palette.primarySoft,
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  stepNumberText: { color: palette.primaryDeep, fontSize: 16, fontWeight: '800' },
  stepText: { color: palette.body, flex: 1, fontSize: 15, lineHeight: 22, paddingTop: 6 },
});
