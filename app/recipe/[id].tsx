import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuroraBackground } from '../../components/AuroraBackground';
import { RecipeDetail } from '../../components/RecipeDetail';
import { TabBar } from '../../components/TabBar';
import { EmptyState, GlassCard } from '../../components/ui';
import { useApp } from '../../lib/store';
import { font, palette, spacing, useResponsive } from '../../lib/theme';

/** Recipe detail screen (compact phones): photo hero, sheet, steps. */
export default function RecipeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const r = useResponsive();
  const { recipeById, toggleSaved, isSaved } = useApp();
  const { id } = useLocalSearchParams<{ id: string }>();
  const recipe = recipeById(id ?? '');
  const [cooked, setCooked] = useState(false);

  return (
    <View style={styles.root}>
      <AuroraBackground />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 150,
          paddingHorizontal: r.pad,
          paddingTop: Math.max(insets.top, 16) + 8,
        }}
      >
        <View style={[styles.shell, { maxWidth: r.contentMaxWidth }]}>
          {recipe ? (
            <>
              <RecipeDetail
                recipe={recipe}
                saved={isSaved(recipe.id)}
                onToggleSaved={() => toggleSaved(recipe)}
                onCooked={() => setCooked(true)}
                onBack={() => router.back()}
              />
              {cooked ? (
                <Animated.View entering={FadeInDown.springify()} style={styles.cookedWrap}>
                  <GlassCard>
                    <Text style={styles.cookedTitle}>Nice cooking! 🎉</Text>
                    <Text style={styles.cookedBody}>
                      One more meal saved from the bin. Add what’s left in your fridge and find the
                      next one.
                    </Text>
                  </GlassCard>
                </Animated.View>
              ) : null}
            </>
          ) : (
            <EmptyState
              glyph="🍽"
              title="Recipe not found"
              body="This recipe is no longer in your results. Head back and search again."
              actionLabel="Back to recipes"
              onAction={() => router.replace('/results')}
            />
          )}
        </View>
      </ScrollView>
      <TabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  shell: { alignSelf: 'center', width: '100%' },
  cookedWrap: { marginTop: spacing.md },
  cookedTitle: { color: palette.ink, fontFamily: font.display, fontSize: 20, marginBottom: 6 },
  cookedBody: { color: palette.body, fontSize: 15, lineHeight: 22 },
});
