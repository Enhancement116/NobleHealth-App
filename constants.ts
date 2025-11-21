
// NOTE: In a real production app, do not hardcode keys if possible, but for this client-side demo:
// process.env.API_KEY will be used as per instructions.

export const API_KEY = process.env.API_KEY || '';

export const MOCK_ZEPP_DATA = {
  weight: 78.5,
  weightGoal: 70.0,
  lastSync: new Date().toISOString(),
  // Detailed Composition
  bodyMetrics: {
    bodyFat: 24.5,    // %
    muscleMass: 54.2, // kg
    water: 58.0,      // %
    protein: 18.2,    // %
    bmr: 1650,        // kcal
    visceralFat: 9.0, // index
    boneMass: 3.1     // kg
  }
};
