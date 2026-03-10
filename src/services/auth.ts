/**
 * AUTHENTICATION SERVICE
 * ======================
 * Real Firebase authentication with mobile + password.
 * 
 * Features:
 * - Registration saves credentials to Firestore
 * - Login validates against stored credentials
 * - Password hashing for security
 * - Role-based access (farmer/buyer)
 * - Demo user support
 */

import { db } from '../firebaseConfig';
import {
    collection,
    query,
    where,
    getDocs,
    addDoc,
    serverTimestamp,
    doc,
    getDoc,
    setDoc
} from 'firebase/firestore';

// ============================================================
// DEMO USER CREDENTIALS
// ============================================================
export const DEMO_FARMER_CREDENTIALS = {
    mobile: '7894561230',
    password: '123456'
};

export const DEMO_BUYER_CREDENTIALS = {
    mobile: '9876543210',
    password: '123456'
};

// Demo user profiles
export const DEMO_FARMER: UserData = {
    uid: 'demo_farmer_001',
    mobile: DEMO_FARMER_CREDENTIALS.mobile,
    fullName: 'Demo Farmer',
    role: 'farmer',
    location: 'Chennai, Tamil Nadu',
    aadhar: 'XXXX XXXX 1234',
    upiId: 'demofarmer@upi'
};

export const DEMO_BUYER: UserData = {
    uid: 'demo_buyer_001',
    mobile: DEMO_BUYER_CREDENTIALS.mobile,
    fullName: 'Demo Buyer',
    role: 'buyer',
    location: 'Bangalore, Karnataka',
    aadhar: 'XXXX XXXX 5678',
    googleMail: 'demobuyer@example.com',
    businessName: 'Demo Trading Co.',
    businessType: 'Wholesaler'
};

// User data interface
export interface UserData {
    uid: string;
    mobile: string;
    password?: string;  // Only used for validation, not returned
    fullName: string;
    role: 'farmer' | 'buyer';
    location?: string;
    aadhar?: string;
    upiId?: string;
    googleMail?: string;
    businessName?: string;
    businessType?: string;
    gst?: string;
    businessAddress?: string;
    profilePic?: string;
    createdAt?: any;
}

// Auth result interface
export interface AuthResult {
    success: boolean;
    user?: UserData;
    error?: string;
}

// Simple hash function (for demo - use bcrypt in production)
function hashPassword(password: string): string {
    // Simple hash for demo - in production use proper bcrypt
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return `hash_${Math.abs(hash).toString(16)}_${password.length}`;
}

/**
 * Register a new user.
 * Saves mobile, password (hashed), and profile to Firestore.
 */
export async function registerUser(userData: {
    mobile: string;
    password: string;
    fullName: string;
    role: 'farmer' | 'buyer';
    location?: string;
    aadhar?: string;
    upiId?: string;
    googleMail?: string;
    businessName?: string;
    businessType?: string;
    gst?: string;
    businessAddress?: string;
}): Promise<AuthResult> {
    try {
        // Clean and validate mobile number
        const cleanMobile = (userData.mobile || '').replace(/\D/g, '');
        console.log('📱 Auth Service - Mobile received:', userData.mobile, '| Clean:', cleanMobile, '| Length:', cleanMobile.length);

        if (!cleanMobile || cleanMobile.length !== 10) {
            return { success: false, error: 'Invalid mobile number. Must be 10 digits.' };
        }

        if (!userData.password || userData.password.length < 6) {
            return { success: false, error: 'Password must be at least 6 characters.' };
        }

        if (!userData.fullName || userData.fullName.trim().length < 2) {
            return { success: false, error: 'Please enter your full name.' };
        }

        // Check if mobile already exists
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('mobile', '==', userData.mobile));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            return { success: false, error: 'Mobile number already registered. Please login instead.' };
        }

        // Hash password
        const hashedPassword = hashPassword(userData.password);

        // Generate UID
        const uid = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Create user document
        const userDoc: UserData = {
            uid,
            mobile: userData.mobile,
            password: hashedPassword,
            fullName: userData.fullName,
            role: userData.role,
            location: userData.location || '',
            aadhar: userData.aadhar || '',
            createdAt: serverTimestamp()
        };

        // Add role-specific fields
        if (userData.role === 'farmer') {
            userDoc.upiId = userData.upiId || '';
        } else {
            userDoc.googleMail = userData.googleMail || '';
            userDoc.businessName = userData.businessName || '';
            userDoc.businessType = userData.businessType || '';
            userDoc.gst = userData.gst || '';
            userDoc.businessAddress = userData.businessAddress || '';
        }

        // Save to Firestore
        await setDoc(doc(db, 'users', uid), userDoc);

        console.log('✅ User registered successfully:', uid);

        // Return user data (without password)
        const { password: _, ...safeUserData } = userDoc;
        return {
            success: true,
            user: safeUserData as UserData
        };

    } catch (error) {
        console.error('❌ Registration error:', error);
        return {
            success: false,
            error: 'Registration failed. Please try again.'
        };
    }
}

/**
 * Login with mobile and password.
 * Validates against stored credentials in Firestore.
 * Also supports demo user login.
 */
export async function loginUser(
    mobile: string,
    password: string,
    role: 'farmer' | 'buyer'
): Promise<AuthResult> {
    try {
        // Validate inputs
        if (!mobile || mobile.length !== 10) {
            return { success: false, error: 'Invalid mobile number.' };
        }

        if (!password) {
            return { success: false, error: 'Please enter your password.' };
        }

        // Check for demo user credentials
        const demoCredentials = role === 'farmer' ? DEMO_FARMER_CREDENTIALS : DEMO_BUYER_CREDENTIALS;
        if (mobile === demoCredentials.mobile && password === demoCredentials.password) {
            console.log('✅ Demo user login:', role);
            const demoUser = role === 'farmer' ? DEMO_FARMER : DEMO_BUYER;
            return {
                success: true,
                user: demoUser
            };
        }

        // Find user by mobile in Firebase
        const usersRef = collection(db, 'users');
        const q = query(
            usersRef,
            where('mobile', '==', mobile),
            where('role', '==', role)
        );
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return {
                success: false,
                error: 'Mobile number not registered. Please register first.'
            };
        }

        // Get user document
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data() as UserData;

        // Validate password
        const hashedPassword = hashPassword(password);
        if (userData.password !== hashedPassword) {
            return {
                success: false,
                error: 'Invalid password. Please try again.'
            };
        }

        console.log('✅ User logged in successfully:', userData.uid);

        // Return user data (without password)
        const { password: _, ...safeUserData } = userData;
        return {
            success: true,
            user: safeUserData as UserData
        };

    } catch (error) {
        console.error('❌ Login error:', error);
        return {
            success: false,
            error: 'Login failed. Please check your connection.'
        };
    }
}

/**
 * Check if a mobile number is already registered.
 */
export async function checkMobileExists(mobile: string): Promise<boolean> {
    try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('mobile', '==', mobile));
        const querySnapshot = await getDocs(q);
        return !querySnapshot.empty;
    } catch {
        return false;
    }
}

/**
 * Get user by UID.
 */
export async function getUserByUid(uid: string): Promise<UserData | null> {
    try {
        const userDoc = await getDoc(doc(db, 'users', uid));
        if (userDoc.exists()) {
            const { password: _, ...safeUserData } = userDoc.data() as UserData;
            return safeUserData as UserData;
        }
        return null;
    } catch {
        return null;
    }
}

/**
 * Store user session in localStorage.
 */
export function saveUserSession(user: UserData): void {
    localStorage.setItem('agrivelan_user', JSON.stringify(user));
}

/**
 * Get user session from localStorage.
 */
export function getUserSession(): UserData | null {
    try {
        const data = localStorage.getItem('agrivelan_user');
        return data ? JSON.parse(data) : null;
    } catch {
        return null;
    }
}

/**
 * Clear user session.
 */
export function clearUserSession(): void {
    localStorage.removeItem('agrivelan_user');
}

/**
 * Check if user is logged in.
 */
export function isLoggedIn(): boolean {
    return getUserSession() !== null;
}

/**
 * Quick demo login - bypasses Firebase.
 * Farmer: 7894561230 / 123456
 * Buyer: 9876543210 / 123456
 */
export function demoLogin(role: 'farmer' | 'buyer'): UserData {
    const demoUser = role === 'farmer' ? DEMO_FARMER : DEMO_BUYER;
    const credentials = role === 'farmer' ? DEMO_FARMER_CREDENTIALS : DEMO_BUYER_CREDENTIALS;
    saveUserSession(demoUser);
    console.log('✅ Demo login:', role, '- Mobile:', credentials.mobile);
    return demoUser;
}

/**
 * Get demo credentials for display based on role.
 */
export function getDemoCredentials(role: 'farmer' | 'buyer'): { mobile: string; password: string } {
    return role === 'farmer' ? DEMO_FARMER_CREDENTIALS : DEMO_BUYER_CREDENTIALS;
}
