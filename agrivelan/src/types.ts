export interface InspectionResult {
    detected: boolean;
    productName?: string;
    freshnessScore?: number;
    grade?: "A" | "B" | "C";
    estimatedExpiryDays?: number;
    notes?: string;
    reason?: string;
}
