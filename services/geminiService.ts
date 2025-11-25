import { GoogleGenAI, Type } from "@google/genai";
import { DishType } from "../types";

export const parseReceiptText = async (text: string): Promise<Array<{ name: string, price: number, type: DishType }>> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing. Please set REACT_APP_GEMINI_API_KEY.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    Analyze the following text describing a meal or receipt. 
    Extract a list of dishes with their prices and dietary category.
    
    Rules for Category:
    - MEAT: Contains meat, fish, or unknown ingredients. This corresponds to the "Everything" diet option.
    - VEGETARIAN: No meat/fish, but contains eggs/dairy/cheese.
    - VEGAN: Plant-based only.
    
    Text to analyze: "${text}"
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              price: { type: Type.NUMBER },
              type: { 
                type: Type.STRING, 
                enum: [DishType.MEAT, DishType.VEGETARIAN, DishType.VEGAN] 
              },
            },
            required: ["name", "price", "type"],
          },
        },
      },
    });

    const resultText = response.text;
    if (!resultText) return [];

    const parsed = JSON.parse(resultText);
    return parsed;
  } catch (error) {
    console.error("Gemini parsing error:", error);
    return [];
  }
};