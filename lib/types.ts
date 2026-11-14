export type Diet = 'Any' | 'Vegetarian' | 'Vegan' | 'Gluten-free';
export type MealType = 'Any' | 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';

export interface RecipeIngredient {
  name: string;
  amount: string;
  /** True when the ingredient is one the user already has. */
  have: boolean;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  /** 0–100: share of the recipe's ingredients the user already has. */
  match: number;
  timeMinutes: number;
  servings: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  cuisine: string;
  ingredients: RecipeIngredient[];
  missing: string[];
  steps: string[];
  tags: string[];
  /** Recipes always come live from Gemini via the server endpoint. */
  source: 'live';
}

export type RecipeSource = 'live';

export interface RecipeRequest {
  ingredients: string[];
  diet: Diet;
  mealType: MealType;
}

export const DIETS: Diet[] = ['Any', 'Vegetarian', 'Vegan', 'Gluten-free'];
export const MEAL_TYPES: MealType[] = ['Any', 'Breakfast', 'Lunch', 'Dinner', 'Snack'];

/** Common fridge items offered as one-tap quick-add chips. */
export const QUICK_ADD: string[] = [
  'Eggs',
  'Broccoli',
  'Tomatoes',
  'Spinach',
  'Chicken',
  'Rice',
  'Potatoes',
  'Onions',
  'Cheese',
  'Milk',
  'Bread',
  'Carrots',
  'Chickpeas',
];
