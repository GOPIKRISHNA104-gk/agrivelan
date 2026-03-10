import { db, storage } from '../firebaseConfig';
import { collection, addDoc, getDocs, query, where, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { demoFarmerPosts, demoMarketItems } from '../data/demoData';

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
}

export const api = {
    // Fetch items for the marketplace (all farmers)
    fetchMarketplaceItems: async (): Promise<SalePost[]> => {
        try {
            const q = query(collection(db, "posts"), orderBy("timestamp", "desc"));
            const querySnapshot = await getDocs(q);
            const posts: SalePost[] = [];
            querySnapshot.forEach((doc) => {
                posts.push({ id: doc.id, ...doc.data() } as SalePost);
            });
            // Combine with demo items if database is empty for better UX during transition
            if (posts.length === 0) return demoMarketItems;
            return posts;
        } catch (error) {
            console.error("Error fetching market items:", error);
            return demoMarketItems;
        }
    },

    // Fetch posts for a specific farmer
    fetchFarmerPosts: async (farmerId: string): Promise<SalePost[]> => {
        try {
            const q = query(collection(db, "posts"), where("farmerId", "==", farmerId));
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

    // Create a new post
    createPost: async (postData: SalePost): Promise<{ status: string; message: string }> => {
        try {
            postData.timestamp = new Date().toISOString();
            await addDoc(collection(db, "posts"), postData);
            return { status: 'success', message: 'Post created successfully' };
        } catch (error: any) {
            console.error("Error creating post:", error);
            throw error;
        }
    },

    // Upload Image Helper
    uploadImage: async (file: File, path: string): Promise<string> => {
        try {
            const storageRef = ref(storage, path);
            const snapshot = await uploadBytes(storageRef, file);
            return await getDownloadURL(snapshot.ref);
        } catch (error) {
            console.error("Upload failed", error);
            throw error;
        }
    }
};
