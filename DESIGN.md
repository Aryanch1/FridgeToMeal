# FridgeToMeal — Design

Figma-grade design spec for the build (Figma file: _to be linked — see README_).
Design language: Aryan's premium standard — bold display type, one disciplined
theme green, glass surfaces, fully-round pills, hero + rounded sheet, generous
whitespace. Reference: `~/workspace/projects/design-references/DESIGN_REFERENCE.md`.

## Tokens (`lib/theme.ts`)

| Token | Value |
| --- | --- |
| Primary (theme green) | `#177245` — gradient `#2FA866 → #0E5C2E` |
| Deep green | `#0E5C2E` · soft tint `#DDF2E4` · pale `#EAF7EE` |
| Accent (sparingly) | `#8FD14F` (saved-count badge only) |
| Ink / body / muted | `#10281A` / `#3D5A48` / `#7A9184` |
| Aurora background | `#E4F6E9 → #F6FBF2 → #FFF6DC` + drifting green/amber blobs |
| Radii | cards 30px · sheets 38px top · pills fully round · inputs 24px |
| Type | display 42/56 (800, −0.8 tracking) · title 24 · subtitle 17 · body 15 · caption 12 |
| Spacing | 8pt grid (4 / 8 / 16 / 24 / 32 / 48) |
| Shadows | soft card shadow; primary CTA gets a green glow shadow |

Glass is the default surface: translucent white (`rgba(255,255,255,0.62)`),
backdrop blur 14–18px (`expo-blur`), 1px light border, soft inner highlight.
Text contrast stays accessible on glass at all times.

## Screen inventory (full flow)

1. **Splash** — animated glass orb filling with green + "FridgeToMeal" wordmark,
   gentle float. Auto-advances after ~1.9s. (No separate loading screen.)
1b. **Welcome / sign-in** — for signed-out users: app mark, tagline, then
   "Continue with Google", "Create account" and "Log in" (email + password
   forms), and "Continue without an account". Signed-in users skip it.
2. **Home / Cook** — bold display headline ("Cook what's already in your
   fridge."), subline, then a glass sheet with: ingredient text input + circular
   add button, added-ingredient chips (tap to remove), quick-add chips of common
   fridge items, diet selector, meal-type selector, gradient "Find recipes" CTA
   (shows ingredient count inside the pill). Below: two stat cards
   (1.3B tonnes wasted / 4 recipes per search) and a "How it works" ghost button.
3. **Results** — header (back, title, Live AI badge, refresh button),
   then recipe cards in a glass sheet over the hero. Each card: cuisine kicker,
   title, description, green match ring (big % + quiet "MATCH" label), stat strip
   (minutes / servings / have-count / level), tags, missing-ingredient note.
   Skeleton loaders while the AI answers; empty state when nothing matches;
   error state with a retry action.
4. **Recipe detail** — hero glass card (match ring, stat strip, Save CTA,
   "I cooked it ✓" celebration), "You have" ingredient checklist (green checks)
   vs "To pick up" (amber circles), numbered cooking steps. Opens as a pushed
   screen on phones; as the right pane on tablets/foldables/desktop.
5. **Saved** — saved-recipe grid (same card component), empty state with a
   "Find a recipe" action, saved-count badge on the tab bar.
6. **Settings / Profile** — account card: avatar + change-picture, editable
   display name, email and sign-in method, password reset (email accounts),
   sign out; recipe storage info (account-synced when signed in, on-device
   when not),
   clear saved recipes (two-tap confirm on web, native alert on mobile), clear
   ingredients, About card with version and copyright.
7. **Help** — six FAQ glass cards answering how it works, what match % means,
   where recipes come from, data privacy, how to refresh, how to save.
8. **Empty states** — no ingredients (home hint + error line on Find),
   no results, no saved recipes. Each has a next step, never a dead end.
9. **Error state** — an endpoint failure shows an error card with "Try again";
   recipes are live AI only, there is no fallback recipe book.

## Transition & animation plan

| Move | Animation | Why |
| --- | --- | --- |
| Splash → Home | Orb fills (1.4s), wordmark fades in, screen cross-fades | A moment of delight, then straight to the task |
| Home → Results | Stack slide-from-right; cards rise in staggered (70ms each) | Direction = forward in the flow; stagger shows the list arriving |
| Card → Detail | Stack slide; detail sections rise staggered (0 / 90 / 180ms) | Same content, deeper level |
| Tab change | Glass pill slides active state; screens fade/slide | Tabs are peers, not a hierarchy |
| Button press | Reanimated spring to 0.95 + overshoot settle; glow tightens; light haptic on mobile | Every tappable element feels physical |
| Chip select | Pop: spring to 1.18 → settle at 1.0 | Selection is an event, not a state flip |
| AI loading | Bouncing-dot loader in the CTA + skeleton cards on Results | Never a frozen screen |
| Save recipe | Button label flips to "Saved ♥"; tab badge count pops | Immediate, visible confirmation |
| "I cooked it" | Celebration card springs up below the detail | Small reward, no confetti overload |
| Sheet/card entrance | FadeInDown spring (Reanimated `entering`) | Content arrives, doesn't appear |

## Custom pull-to-refresh — the glass orb

Never the stock spinner. On the Results list, pulling down past the top
scrubs a glass orb: it drops in, stretches, and fills with green in proportion
to finger distance. Past the threshold, releasing plays the fill loop with
bouncing dots; when data returns, the content springs back and cards re-enter
with a stagger. On web (no native pull gesture) the header refresh button
drives the exact same animation. Motif: a glass orb filling with colour —
FridgeToMeal's signature.

## Responsive layout

Breakpoints via `useWindowDimensions` (`useResponsive()` in `lib/theme.ts`):

| Width | Layout |
| --- | --- |
| < 600 (compact phone) | Single column, full-width cards, bottom-friendly CTAs |
| 600–840 (large phone / foldable folded) | Same flow, wider content cap (640), larger display type |
| 840–1280 (foldable unfolded / tablet) | Two-pane: results list left, selected recipe right, with a divider keeping key content clear of the centre crease; grids 1 → 2 columns |
| ≥ 1280 (desktop web) | Centred shell (max 1120), grids up to 3 columns, hover-friendly, never a stretched phone UI |

Rules at every size: no horizontal scrolling, no clipped or overlapping text,
tap targets ≥ 44px, layouts reflow instantly on resize / rotation / unfold.

## Component kit (`components/`)

`ui.tsx` — SpringPress, PrimaryButton (gradient + glow), GhostButton,
IconButton, Chip, GlassCard, BouncingDots, Skeleton, EmptyState,
SectionHeader, LiveBadge. `AuroraBackground.tsx` — gradient +
drifting blobs. `OrbRefresh.tsx` — custom refresh. `RecipeCard.tsx` —
match ring + stat strip. `RecipeDetail.tsx` — detail sections. `TabBar.tsx`
— floating glass pill tab bar with saved-count badge.
