/**
 * UNIFIED DETECTION SERVICE
 * =========================
 * Production-grade agricultural produce detection.
 * 
 * Architecture:
 * - Development: Local Python backend (YOLOv8)
 * - Production: Gemini 3 Flash Forensic Analysis
 * 
 * Features:
 * - Deep visual forensics
 * - International compliance checking
 * - Phytosanitary risk assessment
 * - Shelf life estimation
 */

import { analyzeProduceForensic } from './gemini-forensic';
import type { InspectionResult, DetectionResult, ComplianceStatus } from '../types';

// Environment detection
const isDevelopment = import.meta.env.DEV || window.location.hostname === 'localhost';
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

// Re-export types
export type { DetectionResult, ComplianceStatus };

/**
 * Convert InspectionResult to DetectionResult format.
 */
function toDetectionResult(result: InspectionResult): DetectionResult {
    if (!result.detected) {
        return {
            detected: false,
            reason: result.reason || "No produce detected."
        };
    }

    return {
        detected: true,
        product: result.productName,
        category: result.category,
        grade: result.grade,
        gradeLabel: result.gradeLabel,
        confidence: result.confidence,
        freshnessScore: result.freshnessScore,
        shelfLifeDays: result.estimatedExpiryDays,
        defects: result.defects,
        exportReady: result.exportReady,
        phytosanitaryRisk: result.phytosanitaryRisk,
        origin: result.origin,
        storageRecommendations: result.storageRecommendations,
        complianceStatus: result.complianceStatus,
        reason: result.reasoning
    };
}

/**
 * Analyze produce using Gemini 3 Flash Forensic Analysis.
 * Used in production (Vercel) for comprehensive quality assessment.
 */
async function analyzeWithGemini(base64Image: string): Promise<DetectionResult> {
    try {
        console.log("🔬 Using Gemini 3 Flash Forensic Analysis...");
        const result = await analyzeProduceForensic(base64Image);
        return toDetectionResult(result);
    } catch (error) {
        console.error("❌ Gemini Analysis Failed:", error);
        return {
            detected: false,
            reason: error instanceof Error ? error.message : "Analysis failed. Please try again."
        };
    }
}

/**
 * Analyze produce using local backend (YOLOv8 + Grading).
 * Used in development with Python backend.
 */
async function analyzeWithBackend(base64Image: string): Promise<DetectionResult> {
    try {
        console.log("📍 Using Local Backend (YOLOv8)...");

        const response = await fetch(`${BACKEND_URL}/api/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: base64Image })
        });

        if (!response.ok) {
            throw new Error(`Backend Error: ${response.statusText}`);
        }

        const data = await response.json();
        return data as DetectionResult;

    } catch (error) {
        console.warn("⚠️ Backend unavailable, falling back to Gemini...");
        // Fallback to Gemini if backend fails
        return analyzeWithGemini(base64Image);
    }
}

/**
 * Main detection function.
 * Automatically chooses the right method based on environment.
 * 
 * Development: Uses local Python backend with YOLOv8
 * Production: Uses Gemini 3 Flash Forensic Analysis
 */
export async function analyzeProduceImage(base64Image: string): Promise<DetectionResult> {
    if (isDevelopment) {
        return analyzeWithBackend(base64Image);
    } else {
        return analyzeWithGemini(base64Image);
    }
}

/**
 * Force use of Gemini 3 Flash (bypass backend).
 * Useful for getting detailed forensic analysis even in development.
 */
export async function analyzeProduceForensicDirect(base64Image: string): Promise<DetectionResult> {
    return analyzeWithGemini(base64Image);
}

/**
 * Check if local backend is available.
 */
export async function checkBackendHealth(): Promise<boolean> {
    try {
        const response = await fetch(`${BACKEND_URL}/api/health`, {
            method: 'GET',
            signal: AbortSignal.timeout(3000)
        });
        return response.ok;
    } catch {
        return false;
    }
}

/**
 * Get detection service status.
 */
export function getServiceStatus(): { mode: string; backend: string } {
    return {
        mode: isDevelopment ? "development" : "production",
        backend: isDevelopment ? "Local YOLOv8 + Gemini Fallback" : "Gemini 3 Flash Forensic"
    };
}
