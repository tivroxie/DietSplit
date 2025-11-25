export enum DietType {
  EVERYTHING = 'EVERYTHING',
  VEGETARIAN = 'VEGETARIAN',
  VEGAN = 'VEGAN',
}

export enum DishType {
  MEAT = 'MEAT',
  VEGETARIAN = 'VEGETARIAN',
  VEGAN = 'VEGAN',
}

export interface Friend {
  id: string;
  name: string;
  diet: DietType;
  avatarUrl: string;
}

export interface Dish {
  id: string;
  name: string;
  price: number;
  type: DishType;
  // Explicit list of friends sharing this dish. 
  // Initialized based on diet compatibility, but fully editable.
  participantIds: string[]; 
}

export interface BillSummary {
  subtotal: number;
  breakdown: Record<string, number>; // friendId -> amount
}

export interface SavedSplit {
  id: string;
  date: string;
  total: number;
  subtotal?: number;
  tax?: number;
  tip?: number;
  friendCount: number;
  dishCount: number;
  friends: Friend[];
  dishes: Dish[];
}
