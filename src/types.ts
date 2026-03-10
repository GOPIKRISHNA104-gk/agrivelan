/**
 * AgriVelan Type Definitions
 * ==========================
 * Core types for the agricultural quality inspection system.
 */

// Compliance status for international markets
export interface ComplianceStatus {
    eu: boolean;    // European Food Safety Authority standards
    usa: boolean;   // USDA/FDA import standards
    asia: boolean;  // Major Asian market (GACC) requirements
}

// Full inspection result from Gemini 3 Flash forensic analysis
export interface InspectionResult {
    // Detection status
    detected: boolean;

    // Product identification
    productName?: string;
    category?: string;  // "Fruit" | "Vegetable"
    origin?: string;    // Probable regional origin based on phenotype

    // Quality grading
    grade?: "A" | "B" | "C" | "Rejected";
    gradeLabel?: string;
    freshnessScore?: number;  // Index (0-100)
    confidence?: number;      // AI confidence (0.0 - 1.0)

    // Defect analysis
    defects?: string[];       // Specific physiological or pathological defects
    phytosanitaryRisk?: "Low" | "Medium" | "High";  // Pest/disease risk

    // Export & compliance
    exportReady?: boolean;
    complianceStatus?: ComplianceStatus;

    // Logistics
    estimatedWeight?: string;       // Approximate weight per unit
    shelfLifeEstimate?: string;     // Days until quality degrades
    estimatedExpiryDays?: number;   // Numeric shelf life
    storageRecommendations?: string; // Optimal storage conditions

    // Analysis metadata
    reasoning?: string;  // Professional justification
    notes?: string;
    reason?: string;     // For rejection/error cases

    // Legacy fields
    boundingBox?: number[];
}

// Farmer post for marketplace
export interface FarmerPost {
    id?: string;
    productName: string;
    productImg?: string;
    grade: "A" | "B" | "C";
    gradeLabel: string;
    freshnessScore: number;
    quantity: number;
    rate: number;
    farmerId: string;
    farmerName: string;
    farmerUpiId?: string;
    location: string;
    description?: string;
    timestamp: string;
    coords?: { lat: number; lng: number };

    // Extended fields from forensic analysis
    origin?: string;
    exportReady?: boolean;
    complianceStatus?: ComplianceStatus;
    shelfLifeEstimate?: string;
    storageRecommendations?: string;
}

// Detection result (simplified for camera flow)
export interface DetectionResult {
    detected: boolean;
    product?: string;
    category?: string;
    grade?: string;
    gradeLabel?: string;
    confidence?: number;
    freshnessScore?: number;
    shelfLifeDays?: number;
    reason?: string;

    // Extended forensic fields
    defects?: string[];
    exportReady?: boolean;
    phytosanitaryRisk?: string;
    origin?: string;
    storageRecommendations?: string;
    complianceStatus?: ComplianceStatus;
}
