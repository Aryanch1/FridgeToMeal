import { BlurView } from 'expo-blur';
import { usePathname, useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { palette, radii } from '../lib/theme';
import { useApp } from '../lib/store';
import { SpringPress } from './ui';

/**
 * Floating glass pill tab bar — replaces the flat bottom bar.
 * Tabs: Cook (home), Saved, Settings, Help.
 */
const TABS = [
  { route: '/', label: 'Cook', glyph: '🍳' },
  { route: '/saved', label: 'Saved', glyph: '♥' },
  { route: '/settings', label: 'Settings', glyph: '⚙' },
  { route: '/help', label: 'Help', glyph: '?' },
] as const;

export function TabBar() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { saved } = useApp();

  return (
    <View style={[styles.wrap, { bottom: Math.max(insets.bottom, 12) }]} pointerEvents="box-none">
      <BlurView intensity={22} tint="light" style={styles.bar}>
        {TABS.map((tab) => {
          const active = pathname === tab.route || (tab.route === '/' && pathname === '/index');
          const badge = tab.route === '/saved' ? saved.length : 0;
          return (
            <SpringPress
              key={tab.route}
              onPress={() => router.replace(tab.route as never)}
              style={styles.tabPress}
            >
              <View style={[styles.tab, active && styles.tabActive]}>
                <Text style={[styles.glyph, active && styles.glyphActive]}>{tab.glyph}</Text>
                <Text style={[styles.label, active && styles.labelActive]}>{tab.label}</Text>
                {badge > 0 ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{badge}</Text>
                  </View>
                ) : null}
              </View>
            </SpringPress>
          );
        })}
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', left: 0, position: 'absolute', right: 0 },
  bar: {
    borderColor: 'rgba(255,255,255,0.75)',
    borderRadius: radii.pill,
    borderWidth: 1,
    flexDirection: 'row',
    overflow: 'hidden',
    padding: 6,
    shadowColor: '#10281A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
  tabPress: { flex: 1 },
  tab: {
    alignItems: 'center',
    borderRadius: radii.pill,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 14,
  },
  tabActive: { backgroundColor: palette.primary },
  glyph: { fontSize: 16 },
  glyphActive: { color: '#FFFFFF' },
  label: { color: palette.ink, fontSize: 13, fontWeight: '800' },
  labelActive: { color: '#FFFFFF' },
  badge: {
    alignItems: 'center',
    backgroundColor: palette.accent,
    borderRadius: 9,
    height: 18,
    justifyContent: 'center',
    minWidth: 18,
    paddingHorizontal: 4,
  },
  badgeText: { color: palette.primaryDeep, fontSize: 11, fontWeight: '800' },
});
