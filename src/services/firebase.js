// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// Uses environment variables for security (with fallbacks for development)
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCQ9rOOuiDTqqiq2n_7nPPSStVvs3HNin4",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "autism-games-a26da.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "autism-games-a26da",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "autism-games-a26da.firebasestorage.app",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1019155981310",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1019155981310:web:6fc887541f414a7703d6af",
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-QQV0V1KMHM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Initialize Firebase AI Logic
import { getAI, getGenerativeModel } from "firebase/ai";

// Initialize Vertex AI
// Model 'gemini-1.5-flash' is retired as of Sept 2025. Using 2.0.
export const getGeminiModel = () => {
    // Check if app is initialized
    const ai = getAI(app);
    return getGenerativeModel(ai, { model: "gemini-2.0-flash-exp" });
};

export { app, analytics, auth, db, storage };
