import { Platform } from 'react-native';

import { demoRecipes } from './demo-recipes';
import type { Diet, MealType, Recipe, RecipeRequest, RecipeSource } from './types';

/**
 * Recipe client.
 *
 * On web, requests go to the app's own /api/recipes endpoint (a Vercel
 * Python serverless function holding the Gemini key server-side), so the
 * web app answers with live AI and no setup. On native, the same
 * endpoint is used when the deployed URL is configured; otherwise the
 * on-device demo engine answers. Any failure falls back to the demo
 * engine — the app never shows a dead end.
 */

/** Deployed web origin for native builds; empty until the first deploy. */
const DEPLOYED_ORIGIN = '';

function endpointUrl(): string | null {
  if (Platform.OS === 'web') return '/api/recipes';
  return DEPLOYED_ORIGIN ? `${DEPLOYED_ORIGIN}/api/recipes` : null;
}

interface ApiRecipeResponse {
  recipes?: unknown;
  error?: { message?: string };
}

function isRecipe(value: unknown): value is Recipe {
  if (!value || typeof value !== 'object') return false;
  const r = value as Record<string, unknown>;
  return (
    typeof r.id === 'string' &&
    typeof r.title === 'string' &&
    typeof r.description === 'string' &&
    typeof r.match === 'number' &&
    typeof r.timeMinutes === 'number' &&
    typeof r.servings === 'number' &&
    Array.isArray(r.ingredients) &&
    Array.isArray(r.steps)
  );
}

function normalizeLiveRecipe(value: unknown, index: number): Recipe | null {
  if (!isRecipe(value)) return null;
  return {
    ...value,
    id: value.id || `live-${index}`,
    match: Math.max(0, Math.min(100, Math.round(value.match))),
    missing: Array.isArray(value.missing) ? (value.missing as string[]) : [],
    tags: Array.isArray(value.tags) ? (value.tags as string[]) : [],
    source: 'live',
  };
}

export interface RecipeResult {
  recipes: Recipe[];
  source: RecipeSource;
}

export async function findRecipes(request: RecipeRequest): Promise<RecipeResult> {
  const url = endpointUrl();
  if (url) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });
      const data = (await response.json().catch(() => ({}))) as ApiRecipeResponse;
      if (response.ok && Array.isArray(data.recipes)) {
        const recipes = data.recipes
          .map((r, i) => normalizeLiveRecipe(r, i))
          .filter((r): r is Recipe => r !== null)
          .slice(0, 4);
        if (recipes.length > 0) return { recipes, source: 'live' };
      }
    } catch {
      // Network or endpoint unavailable — fall through to demo mode.
    }
  }
  return { recipes: demoRecipes(request.ingredients, request.diet, request.mealType), source: 'demo' };
}

export function emptyResult(request: RecipeRequest): RecipeResult {
  return { recipes: demoRecipes(request.ingredients, request.diet, request.mealType), source: 'demo' };
}

export type { Diet, MealType };
