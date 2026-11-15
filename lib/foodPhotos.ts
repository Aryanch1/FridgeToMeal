import type { ImageSourcePropType } from 'react-native';

import type { Recipe } from './types';

/**
 * Bundled food photography — one warm, mint-styled photo per dish family.
 * Recipes arrive as live AI text with no imagery of their own, so a photo
 * is picked by keyword matching over the title, cuisine, tags and (as a
 * second pass) the ingredient names. The skillet shot is the fallback.
 */

export const HERO_PHOTO: ImageSourcePropType = require('../assets/food/hero.jpg');

export const PHOTOS = {
  pasta: require('../assets/food/pasta.jpg') as ImageSourcePropType,
  curry: require('../assets/food/curry.jpg') as ImageSourcePropType,
  stirfry: require('../assets/food/stirfry.jpg') as ImageSourcePropType,
  salad: require('../assets/food/salad.jpg') as ImageSourcePropType,
  soup: require('../assets/food/soup.jpg') as ImageSourcePropType,
  breakfast: require('../assets/food/breakfast.jpg') as ImageSourcePropType,
  chicken: require('../assets/food/chicken.jpg') as ImageSourcePropType,
  tacos: require('../assets/food/tacos.jpg') as ImageSourcePropType,
  sandwich: require('../assets/food/sandwich.jpg') as ImageSourcePropType,
  ricebowl: require('../assets/food/ricebowl.jpg') as ImageSourcePropType,
  skillet: require('../assets/food/skillet.jpg') as ImageSourcePropType,
} as const;

type PhotoKey = keyof typeof PHOTOS;

/**
 * Ordered rules: dish-style words come before plain protein words, so a
 * "Chicken Curry" lands on the curry photo and a "Chicken Salad" on the
 * salad photo, while a plain "Grilled Chicken" still finds the chicken.
 */
const RULES: { key: PhotoKey; words: string[] }[] = [
  {
    key: 'pasta',
    words: [
      'pasta', 'spaghetti', 'penne', 'linguine', 'fettuccine', 'macaroni',
      'lasagne', 'lasagna', 'rigatoni', 'fusilli', 'alfredo', 'bolognese',
      'carbonara', 'marinara', 'arrabbiata',
    ],
  },
  {
    key: 'curry',
    words: ['curry', 'masala', 'tikka', 'korma', 'vindaloo', 'madras', 'jalfrezi'],
  },
  {
    key: 'stirfry',
    words: ['stir', 'noodle', 'ramen', 'chow mein', 'lo mein', 'pad thai', 'udon', 'soba', 'yakisoba'],
  },
  { key: 'salad', words: ['salad', 'slaw', 'caesar'] },
  {
    key: 'soup',
    words: ['soup', 'stew', 'broth', 'chowder', 'bisque', 'chili', 'chilli', 'gumbo', 'minestrone'],
  },
  {
    key: 'ricebowl',
    words: ['rice', 'biryani', 'pilaf', 'risotto', 'grain bowl', 'buddha bowl', 'poke bowl'],
  },
  {
    key: 'tacos',
    words: ['taco', 'wrap', 'burrito', 'quesadilla', 'fajita', 'enchilada', 'tortilla', 'nachos'],
  },
  {
    key: 'sandwich',
    words: ['sandwich', 'burger', 'panini', 'toastie', 'melt', 'club', 'blt'],
  },
  { key: 'chicken', words: ['chicken'] },
  {
    key: 'breakfast',
    words: [
      'egg', 'breakfast', 'pancake', 'omelette', 'omelet', 'frittata',
      'scramble', 'waffle', 'shakshuka', 'hash',
    ],
  },
];

function pickFrom(text: string): PhotoKey | null {
  const hay = text.toLowerCase();
  for (const rule of RULES) {
    if (rule.words.some((word) => hay.includes(word))) return rule.key;
  }
  return null;
}

/** The bundled photo that best matches a recipe. */
export function getFoodPhoto(recipe: Recipe): ImageSourcePropType {
  const headline = [recipe.title, recipe.cuisine, ...recipe.tags].join(' ');
  const key =
    pickFrom(headline) ??
    pickFrom(recipe.ingredients.map((ing) => ing.name).join(' ')) ??
    'skillet';
  return PHOTOS[key];
}
