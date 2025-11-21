
export type AppView = 'dashboard' | 'nutrition' | 'water' | 'settings';

export interface UserData {
  currentWeight: number; // Most recent known weight
  weightGoal: number;
  lastSync: string | null;
  waterPresets: number[]; // User customized water quick-add buttons
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
  unitSize: number; // Legacy
  history: number[]; // Array of added amounts for Undo functionality
}

export interface BodyMetrics {
  bodyFat: number; // %
  muscleMass: number; // kg
  water: number; // %
  protein: number; // %
  bmr: number; // kcal
  visceralFat: number; // index
  boneMass: number; // kg
}

// New root type for a single day's data
export interface DailyLog {
  date: string; // YYYY-MM-DD (Taiwan Time)
  weight: number; // Weight recorded on this day
  bodyMetrics: BodyMetrics | null; // Detailed body composition
  nutrition: DailyNutrition;
  water: WaterLog;
  aiReport: string | null; // Daily summary report
}
