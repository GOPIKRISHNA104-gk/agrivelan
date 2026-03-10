/**
 * FIREBASE CONFIGURATION
 * ======================
 * AgriVelan - Agricultural Marketplace
 * 
 * Services:
 * - Authentication (Phone OTP, Google)
 * - Firestore Database
 * - Cloud Storage (Product Images)
 * - Cloud Functions
 * - Analytics
 */

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported as isAnalyticsSupported } from "firebase/analytics";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getStorage, connectStorageEmulator } from "firebase/storage";

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyCapvRRwxsYvOtE2J0JwEMsde62eKF7IfE",
    authDomain: "agrivelan-63443.firebaseapp.com",
    projectId: "agrivelan-63443",
    storageBucket: "agrivelan-63443.firebasestorage.app",
    messagingSenderId: "326816000406",
    appId: "1:326816000406:web:504794a37dd00d203755b7",
    measurementId: "G-K2G0FXEVBQ"
};

// Initialize Firebase (prevent re-initialization)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Services
const db = getFirestore(app);
const functions = getFunctions(app, "asia-south1"); // Mumbai region for India
const auth = getAuth(app);
const storage = getStorage(app);

// Initialize Analytics (only in browser environment)
let analytics: ReturnType<typeof getAnalytics> | null = null;

const initializeAnalytics = async () => {
    if (typeof window !== 'undefined') {
        const supported = await isAnalyticsSupported();
        if (supported) {
            analytics = getAnalytics(app);
        }
    }
};

initializeAnalytics();

// Connect to emulators in development
const isDevelopment = import.meta.env.DEV;
const useEmulators = import.meta.env.VITE_USE_EMULATORS === 'true';

if (isDevelopment && useEmulators) {
    console.log("🔧 Connecting to Firebase Emulators...");
    connectFirestoreEmulator(db, 'localhost', 8080);
    connectAuthEmulator(auth, 'http://localhost:9099');
    connectFunctionsEmulator(functions, 'localhost', 5001);
    connectStorageEmulator(storage, 'localhost', 9199);
}

// Export services
export {
    app,
    analytics,
    db,
    functions,
    auth,
    storage,
    firebaseConfig
};

// Export types for use in other files
export type { User } from "firebase/auth";
export type { DocumentData, QuerySnapshot, DocumentReference } from "firebase/firestore";
