/**
 * FIREBASE API SERVICE
 * ====================
 * Complete Firebase integration for AgriVelan marketplace.
 * 
 * Collections:
 * - posts: Farmer product listings
 * - orders: Buyer orders
 * - users: User profiles
 * - inspections: Quality inspection logs
 */

import { db, storage, auth } from '../firebaseConfig';
import {
    collection,
    addDoc,
    getDocs,
    getDoc,
    doc,
    query,
    where,
    orderBy,
    limit,
    updateDoc,
    deleteDoc,
    serverTimestamp,
    Timestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, uploadString } from 'firebase/storage';
import { demoFarmerPosts, demoMarketItems } from '../data/demoData';
import type { FarmerPost, InspectionResult, ComplianceStatus } from '../types';

// Collection names
const COLLECTIONS = {
    POSTS: 'posts',
    ORDERS: 'orders',
    USERS: 'users',
    INSPECTIONS: 'inspections'
};

// Types
export interface SalePost {
    id?: string;
    productName: string;
    quantity?: string;
    price?: string;
    farmerId?: string;
    farmerName?: string;
    location?: string;
    description?: string;
    rating?: number;
    productImg?: string;
    coords?: { lat: number; lng: number };
    timestamp?: any;
    rate?: number;

    // Extended fields from ML analysis
    grade?: string;
    gradeLabel?: string;
    freshnessScore?: number;
    category?: string;
    origin?: string;
    exportReady?: boolean;
    complianceStatus?: ComplianceStatus;
    shelfLifeEstimate?: string;
    storageRecommendations?: string;
    defects?: string[];
}

export interface Order {
    id?: string;
    postId: string;
    productName: string;
    quantity: number;
    totalPrice: number;
    buyerId: string;
    buyerName: string;
    farmerId: string;
    farmerName: string;
    status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
    deliveryAddress: string;
    timestamp?: any;
    deliveredAt?: any;
}

export interface UserProfile {
    id?: string;
    uid: string;
    name: string;
    mobile: string;
    role: 'farmer' | 'buyer';
    location?: string;
    profilePic?: string;
    upiId?: string;
    businessName?: string;
    aadharVerified?: boolean;
    createdAt?: any;
}

export const api = {
    // ============================================================
    // MARKETPLACE POSTS
    // ============================================================

    /**
     * Fetch all marketplace items (for buyers).
     */
    fetchMarketplaceItems: async (): Promise<SalePost[]> => {
        try {
            const q = query(
                collection(db, COLLECTIONS.POSTS),
                orderBy("timestamp", "desc"),
                limit(50)
            );
            const querySnapshot = await getDocs(q);
            const posts: SalePost[] = [];
            querySnapshot.forEach((doc) => {
                posts.push({ id: doc.id, ...doc.data() } as SalePost);
            });

            // Fallback to demo items if empty
            if (posts.length === 0) return demoMarketItems;
            return posts;
        } catch (error) {
            console.error("Error fetching market items:", error);
            return demoMarketItems;
        }
    },

    /**
     * Fetch posts for a specific farmer.
     */
    fetchFarmerPosts: async (farmerId: string): Promise<SalePost[]> => {
        try {
            const q = query(
                collection(db, COLLECTIONS.POSTS),
                where("farmerId", "==", farmerId),
                orderBy("timestamp", "desc")
            );
            const querySnapshot = await getDocs(q);
            const posts: SalePost[] = [];
            querySnapshot.forEach((doc) => {
                posts.push({ id: doc.id, ...doc.data() } as SalePost);
            });
            return posts;
        } catch (error) {
            console.error("Error fetching farmer posts:", error);
            return [];
        }
    },

    /**
     * Create a new product post with ML analysis data.
     */
    createPost: async (postData: SalePost): Promise<{ status: string; message: string; id?: string }> => {
        try {
            const docRef = await addDoc(collection(db, COLLECTIONS.POSTS), {
                ...postData,
                timestamp: serverTimestamp(),
                createdAt: new Date().toISOString()
            });
            return { status: 'success', message: 'Post created successfully', id: docRef.id };
        } catch (error: any) {
            console.error("Error creating post:", error);
            throw error;
        }
    },

    /**
     * Update an existing post.
     */
    updatePost: async (postId: string, updates: Partial<SalePost>): Promise<void> => {
        try {
            const docRef = doc(db, COLLECTIONS.POSTS, postId);
            await updateDoc(docRef, {
                ...updates,
                updatedAt: serverTimestamp()
            });
        } catch (error) {
            console.error("Error updating post:", error);
            throw error;
        }
    },

    /**
     * Delete a post.
     */
    deletePost: async (postId: string): Promise<void> => {
        try {
            await deleteDoc(doc(db, COLLECTIONS.POSTS, postId));
        } catch (error) {
            console.error("Error deleting post:", error);
            throw error;
        }
    },

    // ============================================================
    // IMAGE UPLOAD
    // ============================================================

    /**
     * Upload an image file to Firebase Storage.
     */
    uploadImage: async (file: File, path: string): Promise<string> => {
        try {
            const storageRef = ref(storage, path);
            const snapshot = await uploadBytes(storageRef, file);
            return await getDownloadURL(snapshot.ref);
        } catch (error) {
            console.error("Upload failed", error);
            throw error;
        }
    },

    /**
     * Upload a base64 image to Firebase Storage.
     */
    uploadBase64Image: async (base64Data: string, path: string): Promise<string> => {
        try {
            const storageRef = ref(storage, path);

            // Handle data URL format
            const base64Content = base64Data.includes('base64,')
                ? base64Data
                : `data:image/jpeg;base64,${base64Data}`;

            const snapshot = await uploadString(storageRef, base64Content, 'data_url');
            return await getDownloadURL(snapshot.ref);
        } catch (error) {
            console.error("Base64 upload failed", error);
            throw error;
        }
    },

    // ============================================================
    // ORDERS
    // ============================================================

    /**
     * Create a new order.
     */
    createOrder: async (orderData: Omit<Order, 'id' | 'timestamp'>): Promise<{ id: string }> => {
        try {
            const docRef = await addDoc(collection(db, COLLECTIONS.ORDERS), {
                ...orderData,
                timestamp: serverTimestamp()
            });
            return { id: docRef.id };
        } catch (error) {
            console.error("Error creating order:", error);
            throw error;
        }
    },

    /**
     * Fetch orders for a buyer.
     */
    fetchBuyerOrders: async (buyerId: string): Promise<Order[]> => {
        try {
            const q = query(
                collection(db, COLLECTIONS.ORDERS),
                where("buyerId", "==", buyerId),
                orderBy("timestamp", "desc")
            );
            const querySnapshot = await getDocs(q);
            const orders: Order[] = [];
            querySnapshot.forEach((doc) => {
                orders.push({ id: doc.id, ...doc.data() } as Order);
            });
            return orders;
        } catch (error) {
            console.error("Error fetching buyer orders:", error);
            return [];
        }
    },

    /**
     * Fetch orders for a farmer (incoming orders).
     */
    fetchFarmerOrders: async (farmerId: string): Promise<Order[]> => {
        try {
            const q = query(
                collection(db, COLLECTIONS.ORDERS),
                where("farmerId", "==", farmerId),
                orderBy("timestamp", "desc")
            );
            const querySnapshot = await getDocs(q);
            const orders: Order[] = [];
            querySnapshot.forEach((doc) => {
                orders.push({ id: doc.id, ...doc.data() } as Order);
            });
            return orders;
        } catch (error) {
            console.error("Error fetching farmer orders:", error);
            return [];
        }
    },

    /**
     * Update order status.
     */
    updateOrderStatus: async (orderId: string, status: Order['status']): Promise<void> => {
        try {
            const docRef = doc(db, COLLECTIONS.ORDERS, orderId);
            const updates: any = { status, updatedAt: serverTimestamp() };
            if (status === 'delivered') {
                updates.deliveredAt = serverTimestamp();
            }
            await updateDoc(docRef, updates);
        } catch (error) {
            console.error("Error updating order status:", error);
            throw error;
        }
    },

    // ============================================================
    // USER PROFILES
    // ============================================================

    /**
     * Get user profile by UID.
     */
    getUserProfile: async (uid: string): Promise<UserProfile | null> => {
        try {
            const docRef = doc(db, COLLECTIONS.USERS, uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                return { id: docSnap.id, ...docSnap.data() } as UserProfile;
            }
            return null;
        } catch (error) {
            console.error("Error fetching user profile:", error);
            return null;
        }
    },

    /**
     * Create or update user profile.
     */
    saveUserProfile: async (uid: string, profile: Omit<UserProfile, 'id'>): Promise<void> => {
        try {
            const docRef = doc(db, COLLECTIONS.USERS, uid);
            const existingDoc = await getDoc(docRef);

            if (existingDoc.exists()) {
                await updateDoc(docRef, {
                    ...profile,
                    updatedAt: serverTimestamp()
                });
            } else {
                await addDoc(collection(db, COLLECTIONS.USERS), {
                    ...profile,
                    createdAt: serverTimestamp()
                });
            }
        } catch (error) {
            console.error("Error saving user profile:", error);
            throw error;
        }
    },

    // ============================================================
    // INSPECTION LOGS
    // ============================================================

    /**
     * Log an inspection result for analytics.
     */
    logInspection: async (
        farmerId: string,
        result: InspectionResult,
        imageUrl?: string
    ): Promise<void> => {
        try {
            await addDoc(collection(db, COLLECTIONS.INSPECTIONS), {
                farmerId,
                productName: result.productName,
                grade: result.grade,
                freshnessScore: result.freshnessScore,
                confidence: result.confidence,
                defects: result.defects || [],
                exportReady: result.exportReady,
                phytosanitaryRisk: result.phytosanitaryRisk,
                imageUrl,
                timestamp: serverTimestamp()
            });
        } catch (error) {
            console.error("Error logging inspection:", error);
            // Don't throw - this is non-critical
        }
    },

    // ============================================================
    // VELAN AI AGENT
    // ============================================================

    /**
     * Start the Velan AI Agent service.
     */
    startAgent: async (): Promise<boolean> => {
        try {
            const response = await fetch('http://localhost:5000/api/start-agent', {
                method: 'POST',
            });
            const data = await response.json();
            return data.status === 'running';
        } catch (error) {
            console.error("Failed to start Velan AI Agent:", error);
            return false;
        }
    },

    // ============================================================
    // UTILITY
    // ============================================================

    /**
     * Get current authenticated user ID.
     */
    getCurrentUserId: (): string | null => {
        return auth.currentUser?.uid || null;
    },

    /**
     * Check if user is authenticated.
     */
    isAuthenticated: (): boolean => {
        return !!auth.currentUser;
    }
};

export default api;
