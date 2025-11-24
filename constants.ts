import { DietType, DishType } from './types';
import { Leaf, Beef, Utensils } from 'lucide-react';
import React from 'react';

export const DIET_LABELS: Record<DietType, string> = {
  [DietType.EVERYTHING]: '🍖 Everything',
  [DietType.VEGETARIAN]: '🧀 Vegetarian',
  [DietType.VEGAN]: '🌱 Vegan',
};

export const DISH_LABELS: Record<DishType, string> = {
  [DishType.MEAT]: '🥩 Meat',
  [DishType.VEGETARIAN]: '🧀 Vegetarian',
  [DishType.VEGAN]: '🌱 Vegan',
};

export const DIET_COLORS: Record<DietType, string> = {
  [DietType.EVERYTHING]: 'bg-blue-100 text-blue-800 border-blue-200',
  [DietType.VEGETARIAN]: 'bg-amber-100 text-amber-800 border-amber-200',
  [DietType.VEGAN]: 'bg-emerald-100 text-emerald-800 border-emerald-200',
};

export const DISH_ICONS: Record<DishType, React.FC<any>> = {
  [DishType.MEAT]: Beef,
  [DishType.VEGETARIAN]: Utensils, // Generic for vegetarian usually implies cheese/egg
  [DishType.VEGAN]: Leaf,
};

export const INITIAL_FRIENDS = [];