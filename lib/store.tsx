import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  auth,
  db,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  type User,
} from './firebase';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from './firebase';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { signInWithGoogle } from './google';
import { findRecipes } from './recipes';
import type { Diet, MealType, Recipe, RecipeSource } from './types';

const SAVED_KEY = 'fridgetomeal:saved-recipes:v1';
const HISTORY_KEY = 'fridgetomeal:history:v1';
const GUEST_KEY = 'fridgetomeal:guest:v1';
/** Older builds persisted the in-progress ingredient list; it is removed on
 *  startup now — every visit starts fresh, searches live in History. */
const LEGACY_INGREDIENTS_KEY = 'fridgetomeal:ingredients:v1';
const HISTORY_LIMIT = 20;

export interface AuthUser {
  uid: string;
  name: string | null;
  email: string | null;
  photo: string | null;
  /** 'google.com' or 'password' — how this account signs in. */
  provider: string | null;
}

export interface HistoryEntry {
  id: string;
  ingredients: string[];
  diet: Diet;
  mealType: MealType;
  /** Epoch milliseconds of the search. */
  at: number;
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
  history: HistoryEntry[];
  user: AuthUser | null;
  authReady: boolean;
  guest: boolean;
  signIn: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (name: string, email: string, password: string) => Promise<void>;
  updateDisplayName: (name: string) => Promise<void>;
  setAvatarData: (dataUrl: string) => Promise<void>;
  sendPasswordReset: () => Promise<void>;
  resetPasswordForEmail: (email: string) => Promise<void>;
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
  applyHistory: (entry: HistoryEntry) => void;
  clearHistory: () => void;
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
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [guest, setGuest] = useState(false);
  const savedRef = useRef<Recipe[]>([]);
  const historyRef = useRef<HistoryEntry[]>([]);
  const historyLoadedRef = useRef(false);
  const cloudUnsubRef = useRef<(() => void) | null>(null);
  const historyUnsubRef = useRef<(() => void) | null>(null);

  // Local (signed-out) data loads once at startup. Note: the ingredient
  // selection is NOT restored — every visit starts fresh; past searches
  // are kept in History instead.
  useEffect(() => {
    AsyncStorage.getItem(SAVED_KEY).then((raw) => {
      const parsed = loadJson<Recipe[]>(raw);
      if (parsed) setSaved(parsed);
    });
    AsyncStorage.getItem(HISTORY_KEY)
      .then((raw) => {
        const parsed = loadJson<HistoryEntry[]>(raw);
        if (parsed) setHistory(parsed);
      })
      .catch(() => undefined)
      .finally(() => {
        historyLoadedRef.current = true;
      });
    AsyncStorage.removeItem(LEGACY_INGREDIENTS_KEY).catch(() => undefined);
    // Guest mode is per-visit only: clear any older persisted guest flag so
    // the Welcome screen asks again on the next open.
    AsyncStorage.removeItem(GUEST_KEY).catch(() => undefined);
  }, []);

  // Keep a local mirror of the saved list and the search history.
  useEffect(() => {
    savedRef.current = saved;
    AsyncStorage.setItem(SAVED_KEY, JSON.stringify(saved)).catch(() => undefined);
  }, [saved]);

  useEffect(() => {
    historyRef.current = history;
    if (!historyLoadedRef.current) return;
    AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history)).catch(() => undefined);
  }, [history]);

  // Auth state: profile write, cloud saved-recipes + history subscriptions.
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setAuthReady(true);
      if (cloudUnsubRef.current) {
        cloudUnsubRef.current();
        cloudUnsubRef.current = null;
      }
      if (historyUnsubRef.current) {
        historyUnsubRef.current();
        historyUnsubRef.current = null;
      }
      if (!u) {
        setUser(null);
        return;
      }
      setUser({
        uid: u.uid,
        name: u.displayName,
        email: u.email,
        photo: u.photoURL,
        provider: u.providerData[0]?.providerId ?? null,
      });
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

      const historyCol = collection(db, 'users', u.uid, 'history');
      historyUnsubRef.current = onSnapshot(
        historyCol,
        (snap) => {
          const cloud = snap.docs.map((d) => d.data() as HistoryEntry);
          setHistory((prev) => {
            const byId = new Map<string, HistoryEntry>();
            for (const e of [...cloud, ...prev]) byId.set(e.id, e);
            return [...byId.values()]
              .sort((a, b) => b.at - a.at)
              .slice(0, HISTORY_LIMIT);
          });
        },
        () => undefined,
      );

      // One-time merge: searches made on this device before sign-in join
      // the account history.
      void (async () => {
        try {
          const cloud = await getDocs(historyCol);
          const cloudIds = new Set(cloud.docs.map((d) => d.id));
          for (const entry of historyRef.current) {
            if (!cloudIds.has(entry.id)) {
              await setDoc(doc(db, 'users', u.uid, 'history', entry.id), entry);
            }
          }
        } catch {
          // Best-effort merge only.
        }
      })();

      // Profile doc: a custom avatar / edited name stored there overrides
      // the auth copy.
      void (async () => {
        try {
          const snap = await getDoc(doc(db, 'users', u.uid));
          if (snap.exists()) {
            const data = snap.data();
            setUser((prev) =>
              prev && prev.uid === u.uid
                ? {
                    ...prev,
                    name: (data.displayName as string) || prev.name,
                    photo: (data.photoData as string) || prev.photo,
                  }
                : prev,
            );
          }
        } catch {
          // Keep the auth profile.
        }
      })();
    });
    return unsub;
  }, []);

  const signIn = useCallback(async () => {
    await signInWithGoogle();
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email.trim(), password);
  }, []);

  const signUpWithEmail = useCallback(
    async (name: string, email: string, password: string) => {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const cleanName = name.trim();
      if (cleanName) {
        await updateProfile(cred.user, { displayName: cleanName });
        // Refresh the visible profile + Firestore doc with the new name.
        setUser({
          uid: cred.user.uid,
          name: cleanName,
          email: cred.user.email,
          photo: null,
          provider: 'password',
        });
        void upsertProfile({ ...cred.user, displayName: cleanName } as User);
      }
    },
    [],
  );

  const updateDisplayName = useCallback(async (name: string) => {
    const current = auth.currentUser;
    if (!current) return;
    const clean = name.trim();
    await updateProfile(current, { displayName: clean });
    await setDoc(doc(db, 'users', current.uid), { displayName: clean }, { merge: true });
    setUser((prev) => (prev ? { ...prev, name: clean } : prev));
  }, []);

  const setAvatarData = useCallback(async (dataUrl: string) => {
    const current = auth.currentUser;
    if (!current) return;
    await setDoc(doc(db, 'users', current.uid), { photoData: dataUrl }, { merge: true });
    setUser((prev) => (prev ? { ...prev, photo: dataUrl } : prev));
  }, []);

  const sendPasswordReset = useCallback(async () => {
    const current = auth.currentUser;
    if (!current?.email) return;
    await sendPasswordResetEmail(auth, current.email);
  }, []);

  const resetPasswordForEmail = useCallback(async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim());
  }, []);

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth);
    // Back to the welcome screen on next launch state — the gate routes
    // there as soon as the user is signed out and not a guest.
    setGuest(false);
    AsyncStorage.removeItem(GUEST_KEY).catch(() => undefined);
  }, []);

  const continueAsGuest = useCallback(() => {
    // Deliberately NOT persisted: guest lasts for this visit only, so the
    // next open asks for sign-in again. A signed-in user, by contrast,
    // stays signed in (Firebase Auth persistence).
    setGuest(true);
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
      // Save the search to History. The selection itself is never
      // auto-restored — a fresh visit starts fresh; History is a list the
      // user can re-use on purpose.
      if (ingredients.length > 0) {
        const signature = (list: string[], d: Diet, m: MealType) =>
          `${[...list].sort().join('|')}·${d}·${m}`;
        const newest = historyRef.current[0];
        if (!newest || signature(newest.ingredients, newest.diet, newest.mealType) !== signature(ingredients, diet, mealType)) {
          const entry: HistoryEntry = {
            id: `${Date.now()}`,
            ingredients: [...ingredients],
            diet,
            mealType,
            at: Date.now(),
          };
          setHistory((prev) => [entry, ...prev].slice(0, HISTORY_LIMIT));
          const uid = auth.currentUser?.uid;
          if (uid) {
            void setDoc(doc(db, 'users', uid, 'history', entry.id), entry).catch(
              () => undefined,
            );
          }
        }
      }
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

  const applyHistory = useCallback((entry: HistoryEntry) => {
    setIngredients([...entry.ingredients]);
    setDiet(entry.diet);
    setMealType(entry.mealType);
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    if (user) {
      void (async () => {
        try {
          const snap = await getDocs(collection(db, 'users', user.uid, 'history'));
          await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
        } catch {
          // The subscription will reconcile the visible list.
        }
      })();
    }
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
      history,
      user,
      authReady,
      guest,
      signIn,
      signInWithEmail,
      signUpWithEmail,
      updateDisplayName,
      setAvatarData,
      sendPasswordReset,
      resetPasswordForEmail,
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
      applyHistory,
      clearHistory,
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
      history,
      user,
      authReady,
      guest,
      signIn,
      signInWithEmail,
      signUpWithEmail,
      updateDisplayName,
      setAvatarData,
      sendPasswordReset,
      resetPasswordForEmail,
      signOut,
      continueAsGuest,
      addIngredient,
      removeIngredient,
      clearIngredients,
      runFind,
      refreshResults,
      toggleSaved,
      clearSaved,
      applyHistory,
      clearHistory,
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
