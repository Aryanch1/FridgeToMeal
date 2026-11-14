import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState, type ElementRef } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuroraBackground } from '../components/AuroraBackground';
import { TabBar } from '../components/TabBar';
import { Chip, GhostButton, GlassCard, PrimaryButton, SpringPress } from '../components/ui';
import { useApp } from '../lib/store';
import { palette, radii, spacing, useResponsive } from '../lib/theme';
import { DIETS, MEAL_TYPES, QUICK_ADD } from '../lib/types';

/**
 * Home screen: animated splash hero, then the cook flow.
 * Splash → headline → ingredient input + quick-add chips → diet and
 * meal selectors → "Find recipes" primary CTA → food-waste stat strip.
 */

function Splash({ onDone }: { onDone: () => void }) {
  const float = useSharedValue(0);
  const orbFill = useSharedValue(0);
  useEffect(() => {
    float.value = withRepeat(withTiming(1, { duration: 2200 }), -1, true);
    orbFill.value = withTiming(1, { duration: 1400 });
    const timer = setTimeout(onDone, 1900);
    return () => clearTimeout(timer);
  }, [float, orbFill, onDone]);
  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: float.value * -10 }],
  }));
  const fillStyle = useAnimatedStyle(() => ({ height: `${Math.round(orbFill.value * 100)}%` }));
  return (
    <Animated.View entering={FadeIn.duration(500)} style={styles.splash}>
      <Animated.View style={[styles.splashOrb, floatStyle]}>
        <Animated.View style={[styles.splashFill, fillStyle]} />
        <Text style={styles.splashGlyph}>●</Text>
      </Animated.View>
      <Text style={styles.splashTitle}>FridgeToMeal</Text>
      <Text style={styles.splashSub}>Cook what you already have.</Text>
    </Animated.View>
  );
}

function formatWhen(at: number): string {
  const d = new Date(at);
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  if (sameDay(d, new Date())) return 'Today';
  if (sameDay(d, new Date(Date.now() - 86400000))) return 'Yesterday';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const r = useResponsive();
  const {
    ingredients,
    diet,
    mealType,
    addIngredient,
    removeIngredient,
    clearIngredients,
    setDiet,
    setMealType,
    find,
    loading,
    history,
    applyHistory,
  } = useApp();
  const [showSplash, setShowSplash] = useState(true);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<ElementRef<typeof ScrollView>>(null);

  // Tapping a past search loads it into the form at the top of the page —
  // scroll back up so the user actually sees it load (before this, the tap
  // applied silently off-screen and looked like nothing happened).
  const onUseHistory = (entry: (typeof history)[number]) => {
    applyHistory(entry);
    setError(null);
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    });
  };

  const submitDraft = () => {
    const value = draft.trim();
    if (!value) return;
    addIngredient(value);
    setDraft('');
  };

  const onFind = async () => {
    if (ingredients.length === 0) {
      setError('Add at least one ingredient from your fridge first.');
      return;
    }
    setError(null);
    await find();
    router.push('/results');
  };

  const content = (
    <View style={[styles.shell, { maxWidth: r.contentMaxWidth, paddingHorizontal: r.pad }]}>
      {/* Hero */}
      <Animated.View entering={FadeInDown.springify()} style={styles.hero}>
        <Text style={styles.kicker}>FRIDGE TO MEAL</Text>
        <Text style={[styles.headline, r.display]}>Cook what’s{'\n'}already in{'\n'}your fridge.</Text>
        <Text style={styles.sub}>
          Tell us what’s left over. We’ll turn it into dinner — and keep good food out of the bin.
        </Text>
      </Animated.View>

      {/* Ingredient sheet */}
      <Animated.View entering={FadeInDown.delay(120).springify()}>
        <GlassCard>
          <Text style={styles.sheetTitle}>What’s in your fridge?</Text>
          <View style={styles.inputRow}>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              onSubmitEditing={submitDraft}
              placeholder="Type an ingredient…"
              placeholderTextColor={palette.muted}
              returnKeyType="done"
              style={styles.input}
            />
            <SpringPress onPress={submitDraft} haptic>
              <View style={styles.addButton}>
                <Text style={styles.addButtonText}>+</Text>
              </View>
            </SpringPress>
          </View>

          {ingredients.length > 0 ? (
            <View style={styles.chipsRow}>
              {ingredients.map((ing) => (
                <SpringPress key={ing} onPress={() => removeIngredient(ing)}>
                  <View style={styles.addedChip}>
                    <Text style={styles.addedChipText}>{ing}</Text>
                    <Text style={styles.addedChipX}>×</Text>
                  </View>
                </SpringPress>
              ))}
              <SpringPress onPress={clearIngredients}>
                <View style={styles.clearChip}>
                  <Text style={styles.clearChipText}>Clear all</Text>
                </View>
              </SpringPress>
            </View>
          ) : (
            <Text style={styles.hint}>Tap a chip below or type your own — no ingredient, no recipe.</Text>
          )}

          <Text style={styles.quickLabel}>QUICK ADD</Text>
          <View style={styles.chipsRow}>
            {QUICK_ADD.map((item) => {
              const selected = ingredients.some((i) => i.toLowerCase() === item.toLowerCase());
              return (
                <Chip
                  key={item}
                  label={selected ? `✓ ${item}` : item}
                  selected={selected}
                  onPress={() => (selected ? removeIngredient(item) : addIngredient(item))}
                />
              );
            })}
          </View>

          <Text style={styles.quickLabel}>DIET</Text>
          <View style={styles.chipsRow}>
            {DIETS.map((d) => (
              <Chip key={d} label={d} selected={diet === d} onPress={() => setDiet(d)} />
            ))}
          </View>

          <Text style={styles.quickLabel}>MEAL</Text>
          <View style={styles.chipsRow}>
            {MEAL_TYPES.map((m) => (
              <Chip key={m} label={m} selected={mealType === m} onPress={() => setMealType(m)} />
            ))}
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.ctaRow}>
            <View style={{ flex: 1 }}>
              <PrimaryButton
                label="Find recipes"
                sub={ingredients.length > 0 ? `${ingredients.length} ingredient${ingredients.length === 1 ? '' : 's'}` : undefined}
                onPress={onFind}
                loading={loading}
              />
            </View>
          </View>
        </GlassCard>
      </Animated.View>

      {/* Stat strip */}
      <Animated.View entering={FadeInDown.delay(240).springify()} style={styles.stats}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>1.3B</Text>
          <Text style={styles.statLabel}>TONNES OF FOOD WASTED EVERY YEAR</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>4</Text>
          <Text style={styles.statLabel}>RECIPES PER SEARCH, FROM YOUR FRIDGE</Text>
        </View>
      </Animated.View>

      {/* Recent searches — saved history; a new visit always starts fresh */}
      {history.length > 0 ? (
        <Animated.View entering={FadeInDown.delay(280).springify()} style={styles.historyWrap}>
          <GlassCard>
            <Text style={styles.historyTitle}>Recent searches</Text>
            {history.slice(0, 5).map((entry) => (
              <SpringPress key={entry.id} onPress={() => onUseHistory(entry)} haptic>
                <View style={styles.historyRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.historyMain}>{entry.ingredients.join(', ')}</Text>
                    <Text style={styles.historySub}>
                      {[
                        entry.diet !== 'Any' ? entry.diet : null,
                        entry.mealType !== 'Any' ? entry.mealType : null,
                      ]
                        .filter(Boolean)
                        .join(' · ') || 'Any diet · Any meal'}
                      {' · '}
                      {formatWhen(entry.at)}
                    </Text>
                  </View>
                  <View style={styles.historyUsePill}>
                    <Text style={styles.historyUse}>Use</Text>
                  </View>
                </View>
              </SpringPress>
            ))}
            <Text style={styles.hint}>Tap one to load it again — this page always starts fresh.</Text>
          </GlassCard>
        </Animated.View>
      ) : null}

      <Animated.View entering={FadeInDown.delay(320).springify()} style={styles.footerRow}>
        <GhostButton label="How it works" onPress={() => router.push('/help')} />
      </Animated.View>
    </View>
  );

  return (
    <View style={styles.root}>
      <AuroraBackground />
      {showSplash ? (
        <Splash onDone={() => setShowSplash(false)} />
      ) : (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.root}
        >
          <ScrollView
            ref={scrollRef}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingTop: Math.max(insets.top, 16) + 8, paddingBottom: 150 },
            ]}
          >
            {content}
          </ScrollView>
          <TabBar />
        </KeyboardAvoidingView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  splash: { alignItems: 'center', flex: 1, justifyContent: 'center', paddingHorizontal: spacing.xl },
  splashOrb: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderColor: 'rgba(255,255,255,0.85)',
    borderRadius: 70,
    borderWidth: 1,
    height: 140,
    justifyContent: 'center',
    marginBottom: spacing.lg,
    overflow: 'hidden',
    width: 140,
  },
  splashFill: {
    backgroundColor: palette.primaryLight,
    bottom: 0,
    left: 0,
    opacity: 0.5,
    position: 'absolute',
    right: 0,
  },
  splashGlyph: { color: palette.primaryDeep, fontSize: 44 },
  splashTitle: { color: palette.ink, fontSize: 44, fontWeight: '800', letterSpacing: -1 },
  splashSub: { color: palette.body, fontSize: 17, fontWeight: '600', marginTop: spacing.sm },
  shell: { alignSelf: 'center', width: '100%' },
  scrollContent: { flexGrow: 1 },
  hero: { marginBottom: spacing.lg, marginTop: spacing.md },
  kicker: { color: palette.primary, fontSize: 12, fontWeight: '800', letterSpacing: 2, marginBottom: spacing.sm },
  headline: { color: palette.ink, marginBottom: spacing.md },
  sub: { color: palette.body, fontSize: 17, lineHeight: 25, maxWidth: 480 },
  sheetTitle: { color: palette.ink, fontSize: 20, fontWeight: '800', letterSpacing: -0.3, marginBottom: spacing.md },
  inputRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  input: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderColor: palette.line,
    borderRadius: radii.input,
    borderWidth: 1,
    flex: 1,
    fontSize: 16,
    minHeight: 52,
    paddingHorizontal: spacing.md,
  },
  addButton: {
    alignItems: 'center',
    backgroundColor: palette.primary,
    borderRadius: 26,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  addButtonText: { color: '#FFFFFF', fontSize: 26, fontWeight: '700' },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: spacing.md },
  addedChip: {
    alignItems: 'center',
    backgroundColor: palette.primarySoft,
    borderRadius: radii.pill,
    flexDirection: 'row',
    gap: 6,
    minHeight: 40,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  addedChipText: { color: palette.primaryDeep, fontSize: 15, fontWeight: '700' },
  addedChipX: { color: palette.primaryDeep, fontSize: 18, fontWeight: '700' },
  clearChip: {
    alignItems: 'center',
    borderColor: palette.line,
    borderRadius: radii.pill,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: 14,
  },
  clearChipText: { color: palette.muted, fontSize: 14, fontWeight: '700' },
  hint: { color: palette.muted, fontSize: 14, marginTop: spacing.sm },
  quickLabel: { color: palette.muted, fontSize: 11, fontWeight: '800', letterSpacing: 1.2, marginTop: spacing.lg },
  errorText: { color: palette.error, fontSize: 14, fontWeight: '600', marginTop: spacing.md },
  ctaRow: { marginTop: spacing.lg },
  stats: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  statCard: {
    backgroundColor: palette.glassStrong,
    borderColor: 'rgba(255,255,255,0.7)',
    borderRadius: radii.card,
    borderWidth: 1,
    flex: 1,
    padding: spacing.md,
  },
  statNumber: { color: palette.primaryDeep, fontSize: 32, fontWeight: '800', letterSpacing: -0.5 },
  statLabel: { color: palette.muted, fontSize: 10, fontWeight: '800', letterSpacing: 0.8, marginTop: 4 },
  footerRow: { marginTop: spacing.lg },
  historyWrap: { marginTop: spacing.lg },
  historyTitle: { color: palette.ink, fontSize: 17, fontWeight: '800', letterSpacing: -0.2 },
  historyRow: {
    alignItems: 'center',
    borderTopColor: palette.line,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
  },
  historyMain: { color: palette.ink, fontSize: 15, fontWeight: '700' },
  historySub: { color: palette.muted, fontSize: 12, fontWeight: '600', marginTop: 2 },
  historyUse: { color: palette.primaryDeep, fontSize: 14, fontWeight: '800' },
  historyUsePill: {
    alignItems: 'center',
    backgroundColor: palette.primarySoft,
    borderRadius: radii.pill,
    justifyContent: 'center',
    minHeight: 36,
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
});
