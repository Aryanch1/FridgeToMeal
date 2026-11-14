import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { findRecipes } from './recipes';
import type { Diet, MealType, Recipe, RecipeSource } from './types';

const SAVED_KEY = 'fridgetomeal:saved-recipes:v1';
const INGREDIENTS_KEY = 'fridgetomeal:ingredients:v1';

export interface AppState {
  ingredients: string[];
  diet: Diet;
  mealType: MealType;
  results: Recipe[];
  resultSource: RecipeSource | null;
  loading: boolean;
  error: string | null;
  saved: Recipe[];
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

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [diet, setDiet] = useState<Diet>('Any');
  const [mealType, setMealType] = useState<MealType>('Any');
  const [results, setResults] = useState<Recipe[]>([]);
  const [resultSource, setResultSource] = useState<RecipeSource | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<Recipe[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(SAVED_KEY).then((raw) => {
      const parsed = loadJson<Recipe[]>(raw);
      if (parsed) setSaved(parsed);
    });
    AsyncStorage.getItem(INGREDIENTS_KEY).then((raw) => {
      const parsed = loadJson<string[]>(raw);
      if (parsed) setIngredients(parsed);
    });
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(SAVED_KEY, JSON.stringify(saved)).catch(() => undefined);
  }, [saved]);

  useEffect(() => {
    AsyncStorage.setItem(INGREDIENTS_KEY, JSON.stringify(ingredients)).catch(() => undefined);
  }, [ingredients]);

  const addIngredient = useCallback((name: string) => {
    const clean = name.trim();
    if (!clean) return;
    setIngredients((prev) =>
      prev.some((i) => i.toLowerCase() === clean.toLowerCase())
        ? prev
        : [...prev, clean],
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
    } catch {
      setError('Something went wrong while finding recipes. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [ingredients, diet, mealType]);

  const refreshResults = useCallback(async () => {
    if (ingredients.length === 0) return;
    await runFind();
  }, [ingredients.length, runFind]);

  const toggleSaved = useCallback((recipe: Recipe) => {
    setSaved((prev) =>
      prev.some((r) => r.id === recipe.id)
        ? prev.filter((r) => r.id !== recipe.id)
        : [...prev, recipe],
    );
  }, []);

  const clearSaved = useCallback(() => setSaved([]), []);

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
