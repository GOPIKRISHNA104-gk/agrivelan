import { GoogleGenAI, Type } from "@google/genai";
import type { InspectionResult } from "../types";

export const analyzeProduceImage = async (
    base64Image: string
): Promise<InspectionResult> => {

    const apiKey = (typeof process !== "undefined" && process.env?.API_KEY)
        ? process.env.API_KEY
        : (import.meta.env?.VITE_GEMINI_API_KEY || import.meta.env?.VITE_API_KEY);

    if (!apiKey) {
        throw new Error(
            "Gemini API Key missing. Set VITE_GEMINI_API_KEY in .env file."
        );
    }

    const ai = new GoogleGenAI({ apiKey });
    const modelName = "gemini-1.5-flash";

    const schema = {
        type: Type.OBJECT,
        properties: {
            detected: { type: Type.BOOLEAN },
            productName: { type: Type.STRING },
            freshnessScore: { type: Type.INTEGER },
            grade: { type: Type.STRING },
            estimatedExpiryDays: { type: Type.INTEGER },
            notes: { type: Type.STRING },
            reason: { type: Type.STRING }
        },
        required: ["detected"]
    };

    const systemPrompt = `
TASK:
Analyze the given image strictly for FRUITS or VEGETABLES only.

STRICT RULES (DO NOT BREAK):
- Detect ONLY fruits or vegetables.
- Ignore humans, hands, faces, background, containers, and non-produce objects.
- Focus ONLY on the most central visible produce.
- If the image does NOT clearly contain a fruit or vegetable, return detected=false.
- Do NOT guess or assume.

IF PRODUCE IS DETECTED:
Return a JSON object with keys:
{
  "detected": true,
  "productName": "<specific fruit or vegetable name>",
  "freshnessScore": <number from 0 to 100>,
  "grade": "A" | "B" | "C",
  "estimatedExpiryDays": <number>,
  "notes": "<short reason based on color, texture, firmness>"
}

IF PRODUCE IS NOT DETECTED:
Return ONLY:
{
  "detected": false,
  "reason": "No clear fruit or vegetable found. Ask user to focus the produce."
}

QUALITY RULES:
- Bright color, firm skin, no spots → higher freshness
- Dull color, wrinkles, spots → lower freshness
- Overripe or damaged → Grade C
`;

    try {
        const response = await ai.models.generateContent({
            model: modelName,
            contents: [
                {
                    role: "user",
                    parts: [
                        { inlineData: { mimeType: "image/jpeg", data: base64Image } },
                        { text: systemPrompt }
                    ]
                }
            ],
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
                temperature: 0.2
            }
        });

        const rawText = response.text;
        if (!rawText) throw new Error("Empty response");

        const cleanText = typeof rawText === 'string' ? rawText.replace(/```json/g, '').replace(/```/g, '').trim() : "";
        return JSON.parse(cleanText) as InspectionResult;

    } catch (err) {
        console.error("Produce image analysis failed:", err);
        throw err;
    }
};
