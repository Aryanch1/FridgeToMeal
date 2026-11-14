import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuroraBackground } from '../../components/AuroraBackground';
import { RecipeDetail } from '../../components/RecipeDetail';
import { TabBar } from '../../components/TabBar';
import { EmptyState, GlassCard, IconButton } from '../../components/ui';
import { useApp } from '../../lib/store';
import { palette, spacing, useResponsive } from '../../lib/theme';

/** Recipe detail screen (compact phones): hero sheet, ingredients, steps. */
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
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) + 4 }]}>
        <IconButton label="‹" onPress={() => router.back()} />
        <Text style={styles.headerTitle}>Recipe</Text>
        <View style={{ width: 44 }} />
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 150,
          paddingHorizontal: r.pad,
          paddingTop: 8,
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
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 8,
    paddingHorizontal: 16,
  },
  headerTitle: { color: palette.ink, fontSize: 22, fontWeight: '800', letterSpacing: -0.3 },
  shell: { alignSelf: 'center', width: '100%' },
  cookedWrap: { marginTop: spacing.md },
  cookedTitle: { color: palette.ink, fontSize: 20, fontWeight: '800', marginBottom: 6 },
  cookedBody: { color: palette.body, fontSize: 15, lineHeight: 22 },
});
