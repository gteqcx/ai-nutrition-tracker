import { GoogleGenAI, Type } from "@google/genai";
import { z } from "zod";

const MODEL = "gemini-2.5-flash";

let client: GoogleGenAI | null = null;
function ai(): GoogleGenAI {
  if (!client) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
    client = new GoogleGenAI({ apiKey });
  }
  return client;
}

// Единый формат ответа ИИ для текста и фото.
const analysisSchema = z.object({
  dish: z.string(),
  grams: z.number().nonnegative(),
  calories: z.number().nonnegative(),
  protein: z.number().nonnegative(),
  fat: z.number().nonnegative(),
  carbs: z.number().nonnegative(),
  needs_clarification: z.boolean(),
});

export type MealAnalysis = z.infer<typeof analysisSchema>;

// Schema для structured output Gemini — гарантирует валидный JSON.
const responseSchema = {
  type: Type.OBJECT,
  properties: {
    dish: { type: Type.STRING },
    grams: { type: Type.NUMBER },
    calories: { type: Type.NUMBER },
    protein: { type: Type.NUMBER },
    fat: { type: Type.NUMBER },
    carbs: { type: Type.NUMBER },
    needs_clarification: { type: Type.BOOLEAN },
  },
  required: [
    "dish",
    "grams",
    "calories",
    "protein",
    "fat",
    "carbs",
    "needs_clarification",
  ],
  propertyOrdering: [
    "dish",
    "grams",
    "calories",
    "protein",
    "fat",
    "carbs",
    "needs_clarification",
  ],
};

const RULES =
  "Все числа — целые, для ВСЕЙ порции (не на 100 г). " +
  "dish — краткое название блюда на русском. " +
  "calories — ккал, protein/fat/carbs — граммы.";

type Part = { text: string } | { inlineData: { mimeType: string; data: string } };

async function analyze(parts: Part[]): Promise<MealAnalysis> {
  const res = await ai().models.generateContent({
    model: MODEL,
    contents: parts,
    config: {
      responseMimeType: "application/json",
      responseSchema,
      temperature: 0.2,
    },
  });
  const text = res.text;
  if (!text) throw new Error("Пустой ответ Gemini");
  return analysisSchema.parse(JSON.parse(text));
}

export function analyzeText(description: string): Promise<MealAnalysis> {
  const prompt =
    `Ты — нутрициолог. Рассчитай КБЖУ по описанию приёма пищи: «${description}». ` +
    `needs_clarification = true только если описание бессмысленно или КБЖУ оценить нельзя. ` +
    RULES;
  return analyze([{ text: prompt }]);
}

export function analyzeImage(
  bytes: Uint8Array,
  mimeType: string,
): Promise<MealAnalysis> {
  const prompt =
    "Определи, что за еда на фото, оцени примерный вес порции и рассчитай КБЖУ. " +
    "Если фото нечёткое или размер порции определить невозможно — верни " +
    "needs_clarification = true, заполни только dish (название блюда), остальные числа можно 0. " +
    RULES;
  const data = Buffer.from(bytes).toString("base64");
  return analyze([{ text: prompt }, { inlineData: { mimeType, data } }]);
}
