/**
 * AGRICULTURAL QUALITY ASSURANCE SERVICE
 * =======================================
 * Powered by Gemini 3 Flash for deep visual forensics on produce.
 * 
 * Features:
 * - Physiological state evaluation
 * - Pathological risk assessment
 * - Market-specific compliance checking (EU, USA, Asia)
 * - Shelf life estimation
 * - Storage recommendations
 */

import { GoogleGenAI, Type } from "@google/genai";
import type { InspectionResult, ComplianceStatus } from "../types";

// API Configuration
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "AIzaSyBYlFObhmknBOv_8SICGF8dbJyZhNFhhtc";

// Response schema for structured output
const INSPECTION_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        detected: {
            type: Type.BOOLEAN,
            description: "Whether agricultural produce was detected in the image."
        },
        productName: {
            type: Type.STRING,
            description: "Detailed variety and common name (e.g., 'Ratnagiri Alphonso Mango')."
        },
        category: {
            type: Type.STRING,
            description: "Classification: 'Fruit' or 'Vegetable'."
        },
        freshnessScore: {
            type: Type.INTEGER,
            description: "Index (0-100) based on turgor pressure, skin integrity, and color index."
        },
        grade: {
            type: Type.STRING,
            description: "Commercial grade: 'A' (Export), 'B' (Market), 'C' (Local), or 'Rejected'."
        },
        gradeLabel: {
            type: Type.STRING,
            description: "Human-readable grade description."
        },
        defects: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Specific physiological or pathological defects detected."
        },
        exportReady: {
            type: Type.BOOLEAN,
            description: "Meets global export standards for cosmetic and safety requirements."
        },
        confidence: {
            type: Type.NUMBER,
            description: "AI confidence score for the analysis (0.0 - 1.0)."
        },
        reasoning: {
            type: Type.STRING,
            description: "Professional justification of the assigned grade and risk profile."
        },
        estimatedWeight: {
            type: Type.STRING,
            description: "Approximate weight per unit or size category."
        },
        origin: {
            type: Type.STRING,
            description: "Probable regional origin based on phenotype."
        },
        phytosanitaryRisk: {
            type: Type.STRING,
            description: "Likelihood of pests or disease: 'Low', 'Medium', or 'High'."
        },
        shelfLifeEstimate: {
            type: Type.STRING,
            description: "Estimated days until the product reaches the 'standard' grade threshold."
        },
        storageRecommendations: {
            type: Type.STRING,
            description: "Optimal temperature and humidity for transport and storage."
        },
        complianceStatus: {
            type: Type.OBJECT,
            properties: {
                eu: { type: Type.BOOLEAN, description: "European Food Safety Authority standards." },
                usa: { type: Type.BOOLEAN, description: "USDA/FDA import standards." },
                asia: { type: Type.BOOLEAN, description: "Major Asian market (GACC) requirements." }
            },
            required: ["eu", "usa", "asia"]
        }
    },
    required: [
        "detected",
        "productName",
        "freshnessScore",
        "grade",
        "defects",
        "exportReady",
        "confidence",
        "reasoning",
        "phytosanitaryRisk",
        "shelfLifeEstimate",
        "storageRecommendations",
        "complianceStatus"
    ]
};

// System instruction for forensic analysis
const SYSTEM_INSTRUCTION = `
You are a Senior Agricultural Scientist and International Trade Compliance Officer.
Analyze the provided image of agricultural produce to determine its market viability for global export.

CRITICAL RULES:
1. If NO fruit or vegetable is clearly visible, set detected to false.
2. If a human face, person, or non-produce object is the main subject, set detected to false.
3. If it's a phone screen, monitor, or photo of produce (not real produce), set detected to false.
4. Only proceed with analysis if you are 80%+ confident it's real agricultural produce.

Inspection Protocol:
1. PATHOLOGY: Identify signs of fungal growth, bacterial soft rot, or pest exit holes.
2. PHYSIOLOGY: Assess ripeness, mechanical damage, bruising, and skin luster.
3. COMPLIANCE: Evaluate if the specimen meets strict cosmetic and safety standards for EU, USA, and Asian markets.
4. LOGISTICS: Predict shelf life and specify storage requirements to minimize post-harvest loss.

Grading Standards:
- Grade A (Export Quality): Vibrant color, no defects, perfect shape, meets all export standards
- Grade B (Market Quality): Good appearance, minor spots, suitable for domestic markets
- Grade C (Local Quality): Visible defects, acceptable for immediate local sale
- Rejected: Severe damage, rot, or contamination making it unsuitable for sale

Output must be objective, technical, and formatted as valid JSON adhering to the provided schema.
`;

/**
 * Analyze produce image using Gemini 3 Flash forensic analysis.
 * Provides comprehensive quality assessment for export markets.
 */
export const analyzeProduceForensic = async (base64Image: string): Promise<InspectionResult> => {
    try {
        // Initialize Gemini AI
        const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

        // Clean base64 data
        const cleanBase64 = base64Image.includes("base64,")
            ? base64Image.split("base64,")[1]
            : base64Image;

        console.log("🔬 Starting Gemini 3 Flash Forensic Analysis...");

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: [
                {
                    parts: [
                        {
                            inlineData: {
                                mimeType: 'image/jpeg',
                                data: cleanBase64
                            }
                        },
                        {
                            text: "Conduct a forensic quality audit for high-value export markets. If no produce is visible, set detected to false."
                        }
                    ]
                }
            ],
            config: {
                systemInstruction: SYSTEM_INSTRUCTION,
                responseMimeType: "application/json",
                responseSchema: INSPECTION_SCHEMA,
                temperature: 0.1,
                thinkingConfig: {
                    thinkingBudget: 15000
                }
            }
        });

        const resultText = response.text;
        if (!resultText) {
            throw new Error("Analysis engine returned no data.");
        }

        const result = JSON.parse(resultText);
        console.log("🧪 Forensic Analysis Complete:", result);

        // Handle non-detection
        if (!result.detected) {
            return {
                detected: false,
                reason: result.reasoning || "No agricultural produce detected. Please capture a clear image of fruits or vegetables."
            };
        }

        // Parse shelf life to days
        const shelfLifeDays = parseInt(result.shelfLifeEstimate) ||
            (result.grade === 'A' ? 7 : result.grade === 'B' ? 5 : 3);

        return {
            detected: true,
            productName: result.productName,
            category: result.category || inferCategory(result.productName),
            grade: result.grade,
            gradeLabel: result.gradeLabel || getGradeLabel(result.grade),
            freshnessScore: result.freshnessScore,
            confidence: result.confidence,
            defects: result.defects || [],
            exportReady: result.exportReady,
            phytosanitaryRisk: result.phytosanitaryRisk,
            origin: result.origin,
            estimatedWeight: result.estimatedWeight,
            shelfLifeEstimate: result.shelfLifeEstimate,
            estimatedExpiryDays: shelfLifeDays,
            storageRecommendations: result.storageRecommendations,
            complianceStatus: result.complianceStatus,
            reasoning: result.reasoning,
            notes: result.reasoning
        };

    } catch (error) {
        console.error("❌ Gemini Forensic Analysis Error:", error);

        // Check if it's an API error
        if (error instanceof Error) {
            if (error.message.includes("API_KEY")) {
                throw new Error("Invalid API key. Please check your Gemini API configuration.");
            }
            if (error.message.includes("quota") || error.message.includes("rate")) {
                throw new Error("API rate limit reached. Please try again in a moment.");
            }
        }

        throw new Error("High-precision analysis failed. Please ensure lighting is optimal and the specimen is centered.");
    }
};

/**
 * Infer category from product name.
 */
function inferCategory(productName: string): string {
    const fruits = [
        "apple", "banana", "orange", "mango", "grape", "grapes", "lemon",
        "lime", "papaya", "watermelon", "melon", "pomegranate", "guava",
        "pineapple", "strawberry", "cherry", "peach", "plum", "pear",
        "kiwi", "fig", "date", "coconut", "jackfruit", "custard apple"
    ];

    const name = productName.toLowerCase();
    return fruits.some(f => name.includes(f)) ? "Fruit" : "Vegetable";
}

/**
 * Get human-readable grade label.
 */
function getGradeLabel(grade: string): string {
    const labels: Record<string, string> = {
        "A": "Export Quality",
        "B": "Market Quality",
        "C": "Local Quality",
        "Rejected": "Unsuitable for Sale"
    };
    return labels[grade] || "Unknown";
}

/**
 * Simplified analysis for basic detection flow.
 * Falls back to this if forensic analysis fails.
 */
export const analyzeProduceSimple = async (base64Image: string): Promise<InspectionResult> => {
    try {
        const result = await analyzeProduceForensic(base64Image);
        return result;
    } catch {
        // Fallback to basic Gemini 2.0 Flash
        console.log("⚡ Falling back to basic analysis...");
        return analyzeProduceBasic(base64Image);
    }
};

/**
 * Basic analysis fallback using Gemini 2.0 Flash.
 */
async function analyzeProduceBasic(base64Image: string): Promise<InspectionResult> {
    const cleanBase64 = base64Image.includes("base64,")
        ? base64Image.split("base64,")[1]
        : base64Image;

    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

    const requestBody = {
        contents: [{
            parts: [
                {
                    text: `Analyze this image strictly. If it contains a fruit or vegetable, identify it and grade its quality.

RULES:
- If NO produce is visible, return detected: false
- Grade A: Export quality (perfect)
- Grade B: Market quality (good)
- Grade C: Local quality (acceptable)

Return ONLY valid JSON:
{
  "detected": boolean,
  "productName": "string or null",
  "category": "Fruit or Vegetable or null",
  "grade": "A or B or C or null",
  "freshnessScore": number (0-100),
  "confidence": number (0-1),
  "reason": "explanation"
}`
                },
                {
                    inline_data: {
                        mime_type: "image/jpeg",
                        data: cleanBase64
                    }
                }
            ]
        }],
        generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 500
        }
    };

    const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
    }

    const data = await response.json();
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textResponse) {
        throw new Error("No response from API.");
    }

    const cleanJson = textResponse.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    const result = JSON.parse(cleanJson);

    if (!result.detected) {
        return {
            detected: false,
            reason: result.reason || "No produce detected."
        };
    }

    return {
        detected: true,
        productName: result.productName,
        category: result.category,
        grade: result.grade,
        gradeLabel: getGradeLabel(result.grade),
        freshnessScore: result.freshnessScore,
        confidence: result.confidence,
        estimatedExpiryDays: result.grade === 'A' ? 7 : result.grade === 'B' ? 5 : 3,
        defects: [],
        exportReady: result.grade === 'A'
    };
}

export default analyzeProduceForensic;
