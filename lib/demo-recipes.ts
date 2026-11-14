import type { Diet, MealType, Recipe } from './types';

/**
 * On-device demo recipes. Used whenever the hosted Gemini endpoint is
 * unavailable, so the app is fully explorable with no key and no network.
 * Each recipe lists the ingredients it needs; the match score is computed
 * from the overlap with what the user actually has.
 */

interface DemoRecipeBase {
  id: string;
  title: string;
  description: string;
  timeMinutes: number;
  servings: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  cuisine: string;
  diet: Diet[];
  mealTypes: MealType[];
  ingredients: { name: string; amount: string }[];
  steps: string[];
  tags: string[];
}

const DEMO_RECIPES: DemoRecipeBase[] = [
  {
    id: 'demo-garden-tomato-pasta',
    title: 'Garden Tomato Pasta',
    description:
      'Sweet pan-roasted tomatoes and garlic tossed through pasta with a handful of greens. Dinner from the odds and ends of the fridge.',
    timeMinutes: 25,
    servings: 2,
    difficulty: 'Easy',
    cuisine: 'Italian',
    diet: ['Any', 'Vegetarian'],
    mealTypes: ['Lunch', 'Dinner'],
    ingredients: [
      { name: 'Tomatoes', amount: '4, chopped' },
      { name: 'Pasta', amount: '200 g' },
      { name: 'Garlic', amount: '3 cloves' },
      { name: 'Spinach', amount: '1 big handful' },
      { name: 'Cheese', amount: '40 g, grated' },
      { name: 'Olive oil', amount: '2 tbsp' },
    ],
    steps: [
      'Boil the pasta in salted water until just tender, then drain, keeping a mug of the pasta water.',
      'Warm the olive oil in a wide pan and soften the garlic for 1 minute.',
      'Add the tomatoes and cook 6–8 minutes until they collapse into a sauce.',
      'Stir in the spinach until wilted, then toss through the pasta with a splash of pasta water.',
      'Serve with grated cheese on top.',
    ],
    tags: ['One pan', 'Weeknight'],
  },
  {
    id: 'demo-veggie-fried-rice',
    title: 'Crispy Veggie Fried Rice',
    description:
      'Day-old rice, eggs and whatever vegetables are left — fried hot and fast with soy and spring onion. The classic fridge-clearer.',
    timeMinutes: 20,
    servings: 2,
    difficulty: 'Easy',
    cuisine: 'Asian',
    diet: ['Any', 'Vegetarian'],
    mealTypes: ['Lunch', 'Dinner'],
    ingredients: [
      { name: 'Rice', amount: '2 cups, cooked & cooled' },
      { name: 'Eggs', amount: '2' },
      { name: 'Carrots', amount: '1, diced' },
      { name: 'Onions', amount: '1, diced' },
      { name: 'Spinach', amount: '1 handful' },
      { name: 'Soy sauce', amount: '2 tbsp' },
    ],
    steps: [
      'Scramble the eggs in a hot oiled wok, then set aside.',
      'Fry the onions and carrots for 3 minutes until just soft.',
      'Add the rice and press it flat — let it crisp for 2 minutes before stirring.',
      'Return the eggs, add the spinach and soy sauce, and toss everything together.',
      'Taste and add more soy if it needs it. Serve hot.',
    ],
    tags: ['Uses leftover rice', 'Quick'],
  },
  {
    id: 'demo-spinach-egg-scramble',
    title: 'Spinach & Egg Breakfast Scramble',
    description:
      'Soft scrambled eggs folded through wilted spinach and melted cheese on toast. Ten minutes, one pan, zero waste.',
    timeMinutes: 10,
    servings: 1,
    difficulty: 'Easy',
    cuisine: 'American',
    diet: ['Any', 'Vegetarian'],
    mealTypes: ['Breakfast', 'Snack'],
    ingredients: [
      { name: 'Eggs', amount: '3' },
      { name: 'Spinach', amount: '2 handfuls' },
      { name: 'Cheese', amount: '30 g, grated' },
      { name: 'Bread', amount: '2 slices' },
      { name: 'Milk', amount: '2 tbsp' },
    ],
    steps: [
      'Whisk the eggs with the milk and a pinch of salt.',
      'Wilt the spinach in a buttered pan, about 1 minute.',
      'Pour in the eggs and stir gently on low heat until just set.',
      'Fold in the cheese, take off the heat, and spoon over toast.',
    ],
    tags: ['10 minutes', 'One pan'],
  },
  {
    id: 'demo-creamy-potato-soup',
    title: 'Creamy Potato Soup',
    description:
      'Silky soup from potatoes, onion and milk, finished with cheese and a crack of pepper. Comfort food that rescues the potato bag.',
    timeMinutes: 35,
    servings: 4,
    difficulty: 'Easy',
    cuisine: 'American',
    diet: ['Any', 'Vegetarian'],
    mealTypes: ['Lunch', 'Dinner'],
    ingredients: [
      { name: 'Potatoes', amount: '4, peeled & cubed' },
      { name: 'Onions', amount: '1, chopped' },
      { name: 'Milk', amount: '500 ml' },
      { name: 'Cheese', amount: '60 g, grated' },
      { name: 'Garlic', amount: '2 cloves' },
    ],
    steps: [
      'Soften the onion and garlic in butter for 4 minutes.',
      'Add the potatoes and milk, then simmer 20 minutes until the potatoes are soft.',
      'Blend until smooth, adding a little water if it is too thick.',
      'Stir in the cheese until melted and season well.',
    ],
    tags: ['Comfort', 'Freezer friendly'],
  },
  {
    id: 'demo-chickpea-spinach-curry',
    title: 'Chickpea & Spinach Curry',
    description:
      'A fast, warming curry from a tin of chickpeas, tomatoes and spinach. Pantry staples, big flavour, no shopping trip.',
    timeMinutes: 30,
    servings: 3,
    difficulty: 'Medium',
    cuisine: 'Indian',
    diet: ['Any', 'Vegetarian', 'Vegan'],
    mealTypes: ['Lunch', 'Dinner'],
    ingredients: [
      { name: 'Chickpeas', amount: '1 tin, drained' },
      { name: 'Tomatoes', amount: '3, chopped' },
      { name: 'Spinach', amount: '2 handfuls' },
      { name: 'Onions', amount: '1, chopped' },
      { name: 'Garlic', amount: '3 cloves' },
      { name: 'Rice', amount: '1 cup, to serve' },
    ],
    steps: [
      'Fry the onion and garlic until golden, about 5 minutes.',
      'Add the tomatoes and cook down 5 minutes into a thick sauce.',
      'Stir in the chickpeas and a splash of water; simmer 10 minutes.',
      'Fold in the spinach until wilted and serve over rice.',
    ],
    tags: ['Plant-based', 'One pot'],
  },
  {
    id: 'demo-caprese-toast',
    title: 'Caprese Toast',
    description:
      'Crusty bread, ripe tomatoes and soft cheese with olive oil and a pinch of salt. The five-minute answer to "what do I eat now?"',
    timeMinutes: 8,
    servings: 1,
    difficulty: 'Easy',
    cuisine: 'Italian',
    diet: ['Any', 'Vegetarian'],
    mealTypes: ['Breakfast', 'Lunch', 'Snack'],
    ingredients: [
      { name: 'Bread', amount: '2 thick slices' },
      { name: 'Tomatoes', amount: '1 large, sliced' },
      { name: 'Cheese', amount: '60 g, sliced' },
      { name: 'Olive oil', amount: '1 tbsp' },
    ],
    steps: [
      'Toast the bread until golden and crisp.',
      'Layer the tomato and cheese on top.',
      'Drizzle with olive oil and season with salt and pepper.',
    ],
    tags: ['5 minutes', 'No cook'],
  },
  {
    id: 'demo-roasted-veggie-tacos',
    title: 'Roasted Veggie Tacos',
    description:
      'Oven-roasted potatoes, carrots and onions piled into warm tortillas with cheese. A fridge clean-out that tastes like a treat.',
    timeMinutes: 30,
    servings: 2,
    difficulty: 'Medium',
    cuisine: 'Mexican',
    diet: ['Any', 'Vegetarian'],
    mealTypes: ['Lunch', 'Dinner'],
    ingredients: [
      { name: 'Potatoes', amount: '2, cubed' },
      { name: 'Carrots', amount: '2, sliced' },
      { name: 'Onions', amount: '1, wedged' },
      { name: 'Cheese', amount: '50 g, grated' },
      { name: 'Tortillas', amount: '4' },
    ],
    steps: [
      'Toss the vegetables in oil and salt; roast at 200°C for 25 minutes.',
      'Warm the tortillas in a dry pan.',
      'Fill each tortilla with roasted vegetables and cheese.',
      'Add any sauce or greens you have on hand and serve.',
    ],
    tags: ['Oven', 'Family'],
  },
  {
    id: 'demo-herb-omelette',
    title: 'Garden Herb Omelette',
    description:
      'A fluffy three-egg omelette with cheese and any soft herbs or greens the fridge is holding. Breakfast, lunch or a lazy dinner.',
    timeMinutes: 12,
    servings: 1,
    difficulty: 'Easy',
    cuisine: 'French',
    diet: ['Any', 'Vegetarian'],
    mealTypes: ['Breakfast', 'Lunch', 'Dinner'],
    ingredients: [
      { name: 'Eggs', amount: '3' },
      { name: 'Cheese', amount: '30 g, grated' },
      { name: 'Spinach', amount: '1 handful' },
      { name: 'Milk', amount: '1 tbsp' },
      { name: 'Tomatoes', amount: '1, diced (optional)' },
    ],
    steps: [
      'Beat the eggs with the milk and a pinch of salt.',
      'Melt butter in a pan over medium heat and pour in the eggs.',
      'As they set, scatter over the spinach and cheese.',
      'Fold in half, slide onto a plate and serve at once.',
    ],
    tags: ['12 minutes', 'One pan'],
  },
];

function normalize(name: string): string {
  return name.trim().toLowerCase().replace(/s$/, '');
}

/** Score demo recipes against the user's ingredients and return the best 4. */
export function demoRecipes(
  ingredients: string[],
  diet: Diet,
  mealType: MealType,
): Recipe[] {
  const have = new Set(ingredients.map(normalize));
  const scored = DEMO_RECIPES.filter(
    (r) =>
      (diet === 'Any' || r.diet.includes(diet)) &&
      (mealType === 'Any' || r.mealTypes.includes(mealType)),
  ).map((r) => {
    const matched = r.ingredients.filter((ing) =>
      [...have].some((h) => normalize(ing.name).includes(h) || h.includes(normalize(ing.name))),
    );
    const match = Math.round((matched.length / r.ingredients.length) * 100);
    return { base: r, matched: matched.length, match };
  });
  scored.sort((a, b) => b.match - a.match || b.matched - a.matched);
  const picked = scored.slice(0, 4);
  return picked.map(({ base, match }) => {
    const missing = base.ingredients
      .filter(
        (ing) =>
          ![...have].some(
            (h) => normalize(ing.name).includes(h) || h.includes(normalize(ing.name)),
          ),
      )
      .map((ing) => ing.name);
    return {
      id: base.id,
      title: base.title,
      description: base.description,
      match,
      timeMinutes: base.timeMinutes,
      servings: base.servings,
      difficulty: base.difficulty,
      cuisine: base.cuisine,
      ingredients: base.ingredients.map((ing) => ({
        ...ing,
        have: [...have].some(
          (h) => normalize(ing.name).includes(h) || h.includes(normalize(ing.name)),
        ),
      })),
      missing,
      steps: base.steps,
      tags: base.tags,
      source: 'demo' as const,
    };
  });
}
