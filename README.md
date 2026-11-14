# FridgeToMeal

**Turn what's already in your fridge into dinner — and keep good food out of the bin.**

FridgeToMeal is a daily-life app that fights food waste. Type in the leftovers and
odds and ends sitting in your fridge, pick a diet and a meal type, and get four
recipes ranked by how much of each one you already have. A 100% match means
everything is already at home — no shopping trip needed.

> **Live web app:** https://fridgetomeal.vercel.app
> **Design (Figma):** https://www.figma.com/design/mfASzzHADWywiJdCMzhwkd — "FridgeToMeal — Daily App" (tokens, components, and the full screen flow; canvas content to be filled in — the design spec in DESIGN.md is the source of truth)
> **Author:** © 2026 Aryanmouli Cherupalli

## Who it helps

- **Anyone with a fridge** — the average household throws away a surprising share
  of the food it buys. FridgeToMeal turns "what's left?" into dinner.
- **Busy cooks** — four quick, realistic recipes from what you already own,
  with times, servings and a clear have-vs-missing list.
- **Budget-conscious households** — cooking from stock first saves money and
  trips to the shop.

## Features

- **Ingredient input** — type your own or tap quick-add chips (eggs, tomatoes,
  spinach, rice, …); tap any chip to remove it.
- **AI recipe suggestions** — Gemini suggests four recipes matched to your
  ingredients, diet (Vegetarian / Vegan / Gluten-free) and meal type.
- **Match score** — every recipe shows how much of it you already have,
  plus exactly what you'd still need to pick up.
- **Recipe detail** — ingredients split into "You have" and "To pick up",
  numbered cooking steps, servings and difficulty.
- **Accounts, like every other app** — the app opens on a sign-in screen:
  create an account with email + password (with confirm password), log in,
  forgot-password reset link by email, continue with Google (Firebase
  Authentication), or continue without an account. Signed in,
  your profile, saved recipes and search history live in your own account
  and follow you across devices.
- **Profile settings** — in Settings you can change your profile picture
  and your display name, see how you signed in, and (for email accounts)
  get a password-reset link by email.
- **Save favourites** — recipes you like live on the Saved tab, stored
  in your account when signed in, on-device when not.
- **Custom pull-to-refresh** — pull the results list and a glass orb fills with
  colour; release for fresh recipes. On web, the header refresh button plays
  the same animation.
- **Premium glass design** — frosted-glass cards over a soft aurora gradient,
  spring-physics motion, pill buttons with haptics, and a floating glass tab bar.
- **Responsive** — phones, tablets and foldables (two-pane list + detail on
  wide screens) and desktop web, all from one codebase.

## Tech stack

- **React Native + Expo SDK 58 + TypeScript** (one codebase: Android, iOS, web)
- **expo-router** for navigation, **react-native-reanimated** + **gesture-handler**
  for spring motion and the custom refresh, **expo-blur** for frosted glass,
  **expo-haptics** for press feedback, **expo-linear-gradient** for surfaces
- **Google Gemini** (`gemini-3.5-flash-lite`) via the OpenAI-compatible endpoint
- **Python backend** — `api/recipes.py`, a Vercel serverless function that holds
  the Gemini key server-side (never in the app or the repo)
- **Firebase Authentication + Cloud Firestore** — email/password and
  Google sign-in, per-user profile (name, avatar) and saved-recipe
  storage with owner-only security rules
- **AsyncStorage** for the signed-out local copy of saved recipes and search history
  (the ingredient selection itself is never persisted — every visit starts fresh)

## How to run

```bash
npm install
npm start          # Expo dev server — scan the QR code with Expo Go
npm run android    # Android emulator / device
npm run ios        # iOS simulator (macOS)
npm run web        # Web dev server
npm run export:web # Static web build into dist/
```

`GEMINI_API_KEY` is set in the Vercel project, which enables the live AI
suggestions for everyone — the app always serves real Gemini recipes and
shows a retry message if the service cannot be reached.

## Project structure

```
app/            Expo Router screens: index (splash + home), results,
                recipe/[id], saved, settings, help
components/     Reusable kit: buttons, glass cards, chips, skeletons,
                OrbRefresh (custom pull-to-refresh), RecipeCard, TabBar
lib/            theme tokens, types, AI client, app store, Firebase
                wiring (auth + Firestore) and Google sign-in flows
api/            recipes.py — Python serverless recipe endpoint (Vercel)
assets/         App icon, splash, favicon
DESIGN.md       Full design spec: tokens, screen inventory, animation plan
```

## License

MIT License — Copyright (c) 2026 Aryanmouli Cherupalli. See [LICENSE](LICENSE).
