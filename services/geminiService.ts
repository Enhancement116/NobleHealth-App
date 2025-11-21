import { GoogleGenAI, Type } from "@google/genai";
import { API_KEY } from "../constants";
import { UserData, DailyLog } from "../types";

// Initialize with safe check
const ai = new GoogleGenAI({ apiKey: API_KEY });

// Model for tasks
const MODEL_NAME = 'gemini-2.5-flash';

export interface AnalyzeFoodParams {
  text?: string;
  imageBase64?: string;
  mimeType?: string;
}

export const analyzeFood = async (params: AnalyzeFoodParams): Promise<{
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  sugar: number;
  advice: string;
}> => {
  if (!API_KEY) throw new Error("API Key missing");

  const parts: any[] = [];

  if (params.imageBase64) {
    parts.push({
      inlineData: {
        data: params.imageBase64,
        mimeType: params.mimeType || 'image/jpeg'
      }
    });
  }

  const textPrompt = params.text 
    ? `Analyze this food: "${params.text}".` 
    : `Analyze the food in this image.`;

  const finalPrompt = `${textPrompt}
  Provide a rough estimate for one standard serving seen or described. 
  If multiple items are visible, estimate the total for the main dish.
  Also provide a short, one-sentence health advice for this meal in Traditional Chinese.`;

  parts.push({ text: finalPrompt });

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: { parts },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "Short name of the food" },
          calories: { type: Type.NUMBER, description: "Estimated calories (kcal)" },
          protein: { type: Type.NUMBER, description: "Protein in grams" },
          carbs: { type: Type.NUMBER, description: "Carbohydrates in grams" },
          fat: { type: Type.NUMBER, description: "Fat in grams" },
          sugar: { type: Type.NUMBER, description: "Sugar in grams" },
          advice: { type: Type.STRING, description: "Brief health advice in Traditional Chinese" }
        },
        required: ["name", "calories", "protein", "carbs", "fat", "sugar", "advice"]
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response from AI");
  
  return JSON.parse(text);
};

export const generateHealthReport = async (userData: UserData, dailyLog: DailyLog): Promise<string> => {
  if (!API_KEY) return "請設定 API Key 以啟用 AI 分析功能。";

  const displayWeight = dailyLog.weight > 0 ? dailyLog.weight : userData.currentWeight;
  const nutrition = dailyLog.nutrition;
  const bm = dailyLog.bodyMetrics;

  // Construct a detailed coach prompt
  const bodyMetricsText = bm ? `
    Detailed Body Composition Input:
    - Body Fat: ${bm.bodyFat}%
    - Muscle Mass: ${bm.muscleMass} kg
    - BMR (Basal Metabolic Rate): ${bm.bmr} kcal
    - Calculated BMI: ${(displayWeight / ((1.75) * (1.75))).toFixed(1)} (Assuming avg height if unknown)
  ` : 'No body composition data available.';

  const prompt = `
    Act as a top-tier, strict yet encouraging Celebrity Fitness Coach & Nutritionist.
    Language: Traditional Chinese (Taiwan).
    Tone: Professional, High-end (Noble), Direct, Analytical.
    
    User Data for ${dailyLog.date}:
    - Current Weight: ${displayWeight} kg (Goal: ${userData.weightGoal} kg)
    ${bodyMetricsText}
    
    Tasks:
    1. **Body Type Analysis**: Based on Weight, Body Fat %, and Muscle Mass, define their body type (e.g., "Skinny Fat 泡芙人", "Obese 肥胖型", "Athletic 健壯型", "High Muscle/High Fat 壯碩型"). Be honest but professional.
    2. **Dietary Advice**: Give a specific macronutrient strategy for tomorrow.
    3. **Workout Menu**: Provide a specific workout routine for tomorrow (e.g., "Morning: Fasted Cardio 20min, Evening: Chest & Triceps").
    4. **Short Summary**: A 1-sentence motivating punchline.

    Keep the total response concise (under 250 words) but dense with value. 
    Format with clear bullet points or emojis.
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });
    return response.text || "暫時無法分析數據。";
  } catch (error) {
    console.error(error);
    return "分析服務暫時不可用，請稍後再試。";
  }
};