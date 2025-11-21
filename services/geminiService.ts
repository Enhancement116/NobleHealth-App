
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

  const prompt = `
    Act as a high-end, polite, and motivating personal health coach for a VIP client.
    Language: Traditional Chinese (Taiwan).
    Tone: Professional, encouraging, exclusive, slightly luxurious (Noble).
    
    Date of Report: ${dailyLog.date}
    
    User Profile:
    - Current Weight: ${displayWeight} kg (Goal: ${userData.weightGoal} kg)
    
    Daily Activity:
    - Steps: ${dailyLog.steps} (Zepp Life)
    - Sleep: ${dailyLog.sleepHours} hours (Zepp Life)
    - Water Intake: ${dailyLog.water.current} / ${dailyLog.water.goal} ml
    
    Nutrition Intake Today:
    - Total Calories: ${nutrition.calories} / ${nutrition.limits.calories} kcal
    - Sugar: ${nutrition.sugar} / ${nutrition.limits.sugar} g
    - Protein: ${nutrition.protein} g
    - Meals Recorded: ${nutrition.meals.map(m => m.name).join(', ') || 'None'}
    
    Task:
    1. Summarize the health status of this specific day.
    2. Provide specific compliments on what they did well (e.g., drinking enough water, low sugar).
    3. Provide constructive advice for tomorrow to reach the weight goal.
    4. Keep the length under 200 words.
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
