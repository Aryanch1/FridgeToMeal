import { Platform } from 'react-native';

import type { Diet, MealType, Recipe, RecipeRequest, RecipeSource } from './types';

/**
 * Recipe client — live AI only.
 *
 * Requests go to the app's own /api/recipes endpoint (a Vercel Python
 * serverless function holding the Gemini key server-side). On web the
 * relative path is used; native builds call the deployed origin. Any
 * failure throws, and the UI shows a friendly retry state — there is
 * no on-device fallback recipe book anymore.
 */

/** Deployed web origin used by native builds. */
const DEPLOYED_ORIGIN = 'https://fridgetomeal.vercel.app';

function endpointUrl(): string {
  if (Platform.OS === 'web') return '/api/recipes';
  return `${DEPLOYED_ORIGIN}/api/recipes`;
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

const SERVICE_ERROR = 'The recipe service could not answer just now. Please try again in a moment.';

export async function findRecipes(request: RecipeRequest): Promise<RecipeResult> {
  let response: Response;
  try {
    response = await fetch(endpointUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
  } catch {
    throw new Error('Could not reach the recipe service. Check your connection and try again.');
  }
  const data = (await response.json().catch(() => ({}))) as ApiRecipeResponse;
  if (!response.ok || !Array.isArray(data.recipes)) {
    throw new Error(SERVICE_ERROR);
  }
  const recipes = data.recipes
    .map((r, i) => normalizeLiveRecipe(r, i))
    .filter((r): r is Recipe => r !== null)
    .slice(0, 4);
  if (recipes.length === 0) {
    throw new Error(SERVICE_ERROR);
  }
  return { recipes, source: 'live' };
}

export type { Diet, MealType };
