// NOTE: In a real production app, do not hardcode keys if possible, but for this client-side demo:
// process.env.API_KEY will be used as per instructions.

export const API_KEY = process.env.API_KEY || '';

export const MOCK_ZEPP_DATA = {
  weight: 78.5,
  weightGoal: 70.0,
  steps: 8432,
  sleepHours: 6.5,
  lastSync: new Date().toISOString()
};
