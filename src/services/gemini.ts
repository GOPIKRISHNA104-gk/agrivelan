import type { InspectionResult } from "../types";

const GEMINI_API_KEY = "AIzaSyBYlFObhmknBOv_8SICGF8dbJyZhNFhhtc";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

export const analyzeProduceImage = async (base64Image: string): Promise<InspectionResult> => {
    try {
        // 1. Prepare Image Data
        const cleanBase64 = base64Image.includes("base64,")
            ? base64Image.split("base64,")[1]
            : base64Image;

        // 2. Construct Prompt for Detection & Grading
        const requestBody = {
            contents: [{
                parts: [
                    {
                        text: `Analyze this image strictly as an agricultural produce expert. 
            1. Identify the fruit or vegetable.
            2. Grade it based on visual freshness, color consistency, and skin quality:
               - Grade A: Export Quality (Vibrant, no defects, perfect shape).
               - Grade B: Market Quality (Good, minor spots, average shape).
               - Grade C: Local/Poor Quality (Dull, visible defects, signs of rot).
            3. Provide a confidence score (0-100).
            4. If no produce is found, set detected to false.

            Return ONLY raw JSON (no markdown) in this format:
            {
              "detected": boolean,
              "productName": "string",
              "grade": "A" | "B" | "C",
              "confidence": number,
              "reason": "short explanation of the grade"
            }`
                    },
                    {
                        inline_data: {
                            mime_type: "image/jpeg",
                            data: cleanBase64
                        }
                    }
                ]
            }]
        };

        console.log("🚀 Sending to Gemini Vision API...");

        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error(`Gemini API Error: ${response.statusText}`);
        }

        const data = await response.json();
        const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!textResponse) {
            throw new Error("No response from AI model.");
        }

        // 3. Parse JSON Output
        const cleanJson = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
        const result = JSON.parse(cleanJson);

        console.log("🤖 Gemini Analysis:", result);

        if (!result.detected) {
            return {
                detected: false,
                productName: "Unknown",
                grade: "C",
                gradeLabel: "Not Detected",
                notes: "No produce detected.",
                confidence: 0,
                freshnessScore: 0,
                defects: [],
                exportReady: false,
                estimatedExpiryDays: 0,
                reason: result.reason
            };
        }

        return {
            detected: true,
            productName: result.productName,
            grade: result.grade,
            gradeLabel: result.grade === 'A' ? 'Excellent (Export)' : result.grade === 'B' ? 'Good (Market)' : 'Average (Local)',
            confidence: result.confidence,
            freshnessScore: result.grade === 'A' ? 95 : result.grade === 'B' ? 75 : 50,
            notes: result.reason,
            defects: [],
            exportReady: result.grade === 'A',
            estimatedExpiryDays: result.grade === 'A' ? 7 : result.grade === 'B' ? 4 : 2,
            boundingBox: undefined // Gemini doesn't always return bbox in this mode
        };

    } catch (error) {
        console.error("❌ ML Analysis Failed:", error);
        // Fallback for demo/error cases
        return {
            detected: false,
            productName: "Error",
            grade: "C",
            gradeLabel: "Error",
            notes: "Could not analyze image.",
            confidence: 0,
            freshnessScore: 0,
            defects: [],
            exportReady: false,
            estimatedExpiryDays: 0,
            reason: "Analysis service unavailable."
        };
    }
};
