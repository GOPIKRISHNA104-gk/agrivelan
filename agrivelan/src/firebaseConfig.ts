// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCapvRRwxsYvOtE2J0JwEMsde62eKF7IfE",
    authDomain: "agrivelan-63443.firebaseapp.com",
    projectId: "agrivelan-63443",
    storageBucket: "agrivelan-63443.firebasestorage.app",
    messagingSenderId: "326816000406",
    appId: "1:326816000406:web:504794a37dd00d203755b7",
    measurementId: "G-K2G0FXEVBQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, analytics, storage };
