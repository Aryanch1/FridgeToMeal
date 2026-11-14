import React, { useCallback, useEffect, useRef } from 'react';
import { Platform, StyleSheet, Text, View, type ScrollViewInstance } from 'react-native';
import { Gesture, GestureDetector, ScrollView as RNGHScrollView } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { palette } from '../lib/theme';
import { BouncingDots } from './ui';

/**
 * Custom pull-to-refresh — the FridgeToMeal "glass orb".
 *
 * Never the stock spinner. The pull is scrubbed by finger distance: a
 * glass orb drops in and fills with green as you pull; past the
 * threshold, releasing plays the fill loop, and when the data returns
 * the content settles with a spring. On web (no native pull gesture)
 * the same animation is driven by the header refresh button through
 * the `refreshSignal` prop.
 */

const THRESHOLD = 110;
const MAX_PULL = 150;

interface OrbRefreshProps {
  /** Called when a refresh is triggered. Must resolve when data is back. */
  onRefresh: () => Promise<void>;
  /** Increment to trigger the refresh animation programmatically (web button). */
  refreshSignal: number;
  children: React.ReactNode;
}

export function OrbRefresh({ onRefresh, refreshSignal, children }: OrbRefreshProps) {
  const pull = useSharedValue(0);
  const refreshing = useSharedValue(false);
  const fill = useSharedValue(0);
  const scrollY = useSharedValue(0);
  const busy = useRef(false);
  const scrollRef = useRef<ScrollViewInstance | null>(null);

  const startRefresh = useCallback(() => {
    if (busy.current) return;
    busy.current = true;
    refreshing.value = true;
    fill.value = withRepeat(withTiming(1, { duration: 900 }), -1, true);
    void onRefresh().finally(() => {
      busy.current = false;
      refreshing.value = false;
      fill.value = withTiming(0, { duration: 300 });
      pull.value = withSpring(0, { damping: 14, stiffness: 220 });
    });
  }, [onRefresh, refreshing, fill, pull]);

  // Programmatic trigger (web refresh button).
  const signalRef = useRef(refreshSignal);
  useEffect(() => {
    if (refreshSignal !== signalRef.current) {
      signalRef.current = refreshSignal;
      pull.value = withSpring(1, { damping: 14, stiffness: 220 });
      startRefresh();
    }
  }, [refreshSignal, pull, startRefresh]);

  // Gesture-handler's API builds the gesture object during render; the Pan
  // callbacks run only on gesture events, and the ScrollView ref is only
  // read by the gesture system, never during React rendering.
  /* eslint-disable react-hooks/refs */
  const pan = Gesture.Pan()
    .onUpdate((e) => {
      if (scrollY.value <= 0 && e.translationY > 0 && !refreshing.value) {
        pull.value = Math.min(e.translationY / MAX_PULL, 1.15);
      }
    })
    .onEnd(() => {
      if (refreshing.value) return;
      if (pull.value >= THRESHOLD / MAX_PULL) {
        runOnJS(startRefresh)();
      } else {
        pull.value = withSpring(0, { damping: 16, stiffness: 260 });
      }
    })
    // The cast bridges RN 0.88's ScrollViewInstance type and the
    // component ref gesture-handler expects; at runtime it is the
    // same ScrollView ref.
    .simultaneousWithExternalGesture(
      scrollRef as unknown as React.RefObject<React.ComponentType>,
    );
  /* eslint-enable react-hooks/refs */

  const orbStyle = useAnimatedStyle(() => {
    const shown = refreshing.value ? 1 : pull.value;
    return {
      height: 64 + shown * 26,
      opacity: shown,
      transform: [{ translateY: (1 - shown) * -30 }, { scale: 0.7 + shown * 0.3 }],
    };
  });
  const fillStyle = useAnimatedStyle(() => {
    const level = refreshing.value ? fill.value : Math.min(pull.value, 1);
    return { height: `${Math.round(level * 100)}%` };
  });
  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: refreshing.value ? 78 : pull.value * 78 }],
  }));

  const dotsStyle = useAnimatedStyle(() => ({
    opacity: refreshing.value ? 1 : 0,
  }));
  const pullLabelStyle = useAnimatedStyle(() => ({
    opacity: refreshing.value ? 0 : 1,
  }));
  const refreshLabelStyle = useAnimatedStyle(() => ({
    opacity: refreshing.value ? 1 : 0,
  }));

  return (
    <GestureDetector gesture={pan}>
      <View style={styles.root}>
        <Animated.View style={[styles.orbWrap, orbStyle]} pointerEvents="none">
          <View style={styles.orb}>
            <Animated.View style={[styles.orbFill, fillStyle]} />
            <Text style={styles.orbGlyph}>●</Text>
          </View>
          <Animated.View style={dotsStyle}>
            <BouncingDots />
          </Animated.View>
          <Animated.Text style={[styles.orbLabel, pullLabelStyle]}>
            Pull to refresh
          </Animated.Text>
          <Animated.Text style={[styles.orbLabel, styles.orbLabelOverlay, refreshLabelStyle]}>
            Cooking up fresh ideas…
          </Animated.Text>
        </Animated.View>
        <Animated.View style={[styles.content, contentStyle]}>
          <RNGHScrollView
            ref={scrollRef}
            bounces
            showsVerticalScrollIndicator={false}
            scrollEventThrottle={16}
            onScroll={(e) => {
              scrollY.value = e.nativeEvent.contentOffset.y;
            }}
            contentContainerStyle={styles.scrollContent}
          >
            {children}
          </RNGHScrollView>
        </Animated.View>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  orbWrap: {
    alignItems: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 8,
    zIndex: 1,
  },
  orb: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderColor: 'rgba(255,255,255,0.8)',
    borderRadius: 40,
    borderWidth: 1,
    height: 80,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 80,
  },
  orbFill: {
    backgroundColor: palette.primaryLight,
    bottom: 0,
    left: 0,
    opacity: 0.55,
    position: 'absolute',
    right: 0,
  },
  orbGlyph: { color: palette.primaryDeep, fontSize: 26 },
  orbLabel: { color: palette.body, fontSize: 12, fontWeight: '700', marginTop: 8 },
  orbLabelOverlay: { marginTop: -16 },
  content: { flex: 1 },
  scrollContent: { paddingBottom: 140 },
});

export function WebRefreshNote() {
  return Platform.OS === 'web' ? (
    <Text style={{ color: palette.muted, fontSize: 12, fontWeight: '600' }}>
      Use the refresh button up top — same orb, same fresh recipes.
    </Text>
  ) : null;
}
