
export type AppView = 'dashboard' | 'nutrition' | 'water' | 'settings';

export interface UserData {
  currentWeight: number; // Most recent known weight
  weightGoal: number;
  lastSync: string | null;
  waterPresets: number[]; // User customized water quick-add buttons (e.g., [100, 250, 500, 700])
}

export interface Meal {
  id: string;
  name: string;
  timestamp: string;
  calories: number;
  sugar: number;
  fat: number;
  carbs: number;
  protein: number;
  aiAdvice?: string;
}

export interface NutritionLimits {
  calories: number;
  sugar: number;
  fat: number;
  carbs: number;
  protein: number;
}

export interface DailyNutrition {
  calories: number;
  sugar: number;
  fat: number;
  carbs: number;
  protein: number;
  meals: Meal[];
  limits: NutritionLimits;
}

export interface WaterLog {
  current: number; // ml
  goal: number; // ml
  unitSize: number; // Kept for legacy compatibility, though presets now preferred
  history: number[]; // Array of added amounts for Undo functionality
}

// New root type for a single day's data
export interface DailyLog {
  date: string; // YYYY-MM-DD (Taiwan Time)
  weight: number; // Weight recorded on this day
  steps: number;
  sleepHours: number;
  nutrition: DailyNutrition;
  water: WaterLog;
  aiReport: string | null; // Daily summary report
}
