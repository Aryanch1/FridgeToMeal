import AsyncStorage from '@react-native-async-storage/async-storage';
import { onAuthStateChanged, signOut as firebaseSignOut, type User } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { auth, db } from './firebase';
import { signInWithGoogle } from './google';
import { findRecipes } from './recipes';
import type { Diet, MealType, Recipe, RecipeSource } from './types';

const SAVED_KEY = 'fridgetomeal:saved-recipes:v1';
const INGREDIENTS_KEY = 'fridgetomeal:ingredients:v1';
const GUEST_KEY = 'fridgetomeal:guest:v1';

export interface AuthUser {
  uid: string;
  name: string | null;
  email: string | null;
  photo: string | null;
}

export interface AppState {
  ingredients: string[];
  diet: Diet;
  mealType: MealType;
  results: Recipe[];
  resultSource: RecipeSource | null;
  loading: boolean;
  error: string | null;
  saved: Recipe[];
  user: AuthUser | null;
  authReady: boolean;
  guest: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  continueAsGuest: () => void;
  addIngredient: (name: string) => void;
  removeIngredient: (name: string) => void;
  clearIngredients: () => void;
  setDiet: (diet: Diet) => void;
  setMealType: (mealType: MealType) => void;
  find: () => Promise<void>;
  refreshResults: () => Promise<void>;
  toggleSaved: (recipe: Recipe) => void;
  clearSaved: () => void;
  isSaved: (id: string) => boolean;
  recipeById: (id: string) => Recipe | undefined;
}

const AppContext = createContext<AppState | null>(null);

function loadJson<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/** Firestore document IDs cannot contain slashes; recipe IDs are slugs. */
function docIdFor(recipe: Recipe): string {
  return recipe.id.replace(/\//g, '-');
}

async function upsertProfile(u: User): Promise<void> {
  try {
    const ref = doc(db, 'users', u.uid);
    const snap = await getDoc(ref);
    const base = {
      displayName: u.displayName ?? '',
      email: u.email ?? '',
      photoURL: u.photoURL ?? '',
      lastLoginAt: serverTimestamp(),
    };
    if (!snap.exists()) {
      await setDoc(ref, { ...base, createdAt: serverTimestamp() });
    } else {
      await setDoc(ref, base, { merge: true });
    }
  } catch {
    // Sync is best-effort; the app keeps working offline.
  }
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [diet, setDiet] = useState<Diet>('Any');
  const [mealType, setMealType] = useState<MealType>('Any');
  const [results, setResults] = useState<Recipe[]>([]);
  const [resultSource, setResultSource] = useState<RecipeSource | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<Recipe[]>([]);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [guest, setGuest] = useState(false);
  const savedRef = useRef<Recipe[]>([]);
  const cloudUnsubRef = useRef<(() => void) | null>(null);
  const fridgeReadyRef = useRef(false);

  // Local (signed-out) data loads once at startup.
  useEffect(() => {
    AsyncStorage.getItem(SAVED_KEY).then((raw) => {
      const parsed = loadJson<Recipe[]>(raw);
      if (parsed) setSaved(parsed);
    });
    AsyncStorage.getItem(INGREDIENTS_KEY).then((raw) => {
      const parsed = loadJson<string[]>(raw);
      if (parsed) setIngredients(parsed);
    });
    AsyncStorage.getItem(GUEST_KEY).then((raw) => {
      if (raw === '1') setGuest(true);
    });
  }, []);

  // Keep a local mirror of the saved list and the fridge list.
  useEffect(() => {
    savedRef.current = saved;
    AsyncStorage.setItem(SAVED_KEY, JSON.stringify(saved)).catch(() => undefined);
  }, [saved]);

  useEffect(() => {
    AsyncStorage.setItem(INGREDIENTS_KEY, JSON.stringify(ingredients)).catch(() => undefined);
  }, [ingredients]);

  // Auth state: profile write, cloud saved-recipes subscription, fridge sync.
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setAuthReady(true);
      if (cloudUnsubRef.current) {
        cloudUnsubRef.current();
        cloudUnsubRef.current = null;
      }
      fridgeReadyRef.current = false;
      if (!u) {
        setUser(null);
        return;
      }
      setUser({ uid: u.uid, name: u.displayName, email: u.email, photo: u.photoURL });
      void upsertProfile(u);

      const savedCol = collection(db, 'users', u.uid, 'saved');
      cloudUnsubRef.current = onSnapshot(
        savedCol,
        (snap) => {
          setSaved(snap.docs.map((d) => d.data() as Recipe));
        },
        () => undefined,
      );

      // One-time merge: anything saved locally before sign-in joins the account.
      void (async () => {
        try {
          const cloud = await getDocs(savedCol);
          const cloudIds = new Set(cloud.docs.map((d) => d.id));
          for (const recipe of savedRef.current) {
            const id = docIdFor(recipe);
            if (!cloudIds.has(id)) {
              await setDoc(doc(db, 'users', u.uid, 'saved', id), recipe);
            }
          }
        } catch {
          // Best-effort merge only.
        }
      })();

      // Fridge list: the account copy wins when it exists.
      void (async () => {
        try {
          const snap = await getDoc(doc(db, 'users', u.uid));
          const fridge = snap.exists() ? (snap.data().fridge as string[] | undefined) : undefined;
          if (Array.isArray(fridge)) {
            setIngredients(fridge);
          }
        } catch {
          // Keep the local list.
        } finally {
          fridgeReadyRef.current = true;
        }
      })();
    });
    return unsub;
  }, []);

  // Write the fridge list through to the account once it has loaded.
  useEffect(() => {
    if (!user || !fridgeReadyRef.current) return;
    setDoc(doc(db, 'users', user.uid), { fridge: ingredients }, { merge: true }).catch(
      () => undefined,
    );
  }, [ingredients, user]);

  const signIn = useCallback(async () => {
    await signInWithGoogle();
  }, []);

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth);
    // Back to the welcome screen on next launch state — the gate routes
    // there as soon as the user is signed out and not a guest.
    setGuest(false);
    AsyncStorage.removeItem(GUEST_KEY).catch(() => undefined);
  }, []);

  const continueAsGuest = useCallback(() => {
    setGuest(true);
    AsyncStorage.setItem(GUEST_KEY, '1').catch(() => undefined);
  }, []);

  const addIngredient = useCallback((name: string) => {
    const clean = name.trim();
    if (!clean) return;
    setIngredients((prev) =>
      prev.some((i) => i.toLowerCase() === clean.toLowerCase()) ? prev : [...prev, clean],
    );
  }, []);

  const removeIngredient = useCallback((name: string) => {
    setIngredients((prev) => prev.filter((i) => i.toLowerCase() !== name.toLowerCase()));
  }, []);

  const clearIngredients = useCallback(() => setIngredients([]), []);

  const runFind = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { recipes, source } = await findRecipes({ ingredients, diet, mealType });
      setResults(recipes);
      setResultSource(source);
      if (recipes.length === 0) {
        setError('No recipes matched those ingredients yet. Try adding one more item from your fridge.');
      }
    } catch (e) {
      setResults([]);
      setError(
        e instanceof Error && e.message
          ? e.message
          : 'Something went wrong while finding recipes. Check your connection and try again.',
      );
    } finally {
      setLoading(false);
    }
  }, [ingredients, diet, mealType]);

  const refreshResults = useCallback(async () => {
    if (ingredients.length === 0) return;
    await runFind();
  }, [ingredients.length, runFind]);

  const toggleSaved = useCallback(
    (recipe: Recipe) => {
      if (user) {
        const ref = doc(db, 'users', user.uid, 'saved', docIdFor(recipe));
        const already = savedRef.current.some((r) => r.id === recipe.id);
        void (already ? deleteDoc(ref) : setDoc(ref, recipe)).catch(() => undefined);
        return;
      }
      setSaved((prev) =>
        prev.some((r) => r.id === recipe.id)
          ? prev.filter((r) => r.id !== recipe.id)
          : [...prev, recipe],
      );
    },
    [user],
  );

  const clearSaved = useCallback(() => {
    if (user) {
      void (async () => {
        try {
          const snap = await getDocs(collection(db, 'users', user.uid, 'saved'));
          await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
        } catch {
          // The subscription will reconcile the visible list.
        }
      })();
      return;
    }
    setSaved([]);
  }, [user]);

  const isSaved = useCallback((id: string) => saved.some((r) => r.id === id), [saved]);

  const recipeById = useCallback(
    (id: string) => [...results, ...saved].find((r) => r.id === id),
    [results, saved],
  );

  const value = useMemo<AppState>(
    () => ({
      ingredients,
      diet,
      mealType,
      results,
      resultSource,
      loading,
      error,
      saved,
      user,
      authReady,
      guest,
      signIn,
      signOut,
      continueAsGuest,
      addIngredient,
      removeIngredient,
      clearIngredients,
      setDiet,
      setMealType,
      find: runFind,
      refreshResults,
      toggleSaved,
      clearSaved,
      isSaved,
      recipeById,
    }),
    [
      ingredients,
      diet,
      mealType,
      results,
      resultSource,
      loading,
      error,
      saved,
      user,
      authReady,
      guest,
      signIn,
      signOut,
      continueAsGuest,
      addIngredient,
      removeIngredient,
      clearIngredients,
      runFind,
      refreshResults,
      toggleSaved,
      clearSaved,
      isSaved,
      recipeById,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
