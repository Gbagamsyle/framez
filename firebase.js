import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from "firebase/app";
import { getAuth, getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getFirestore } from "firebase/firestore";

/**
 * Firebase configuration loaded from environment variables.
 * 
 * DEVELOPMENT: Create a .env.local file (never commit to git) with:
 *   EXPO_PUBLIC_FIREBASE_API_KEY=...
 *   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
 *   etc.
 * 
 * PRODUCTION (EAS Build): Set secrets via:
 *   eas secret:create --scope project --name firebase_api_key --value <value>
 *   eas secret:create --scope project --name firebase_auth_domain --value <value>
 *   etc.
 * 
 * Then reference them in eas.json env section: "EXPO_PUBLIC_FIREBASE_API_KEY": "@firebase_api_key"
 * 
 * Reference: https://docs.expo.dev/guides/environment-variables/
 */

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Validate required configuration
if (!firebaseConfig.projectId) {
  console.warn(
    'Firebase projectId is missing. Please set EXPO_PUBLIC_FIREBASE_PROJECT_ID in your environment (.env.local for dev or EAS secrets for production).'
  );
}

const app = initializeApp(firebaseConfig);

// Initialize Auth with React Native AsyncStorage persistence so sessions persist across app restarts
let _auth;
try {
  _auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (_e) {
  // If initializeAuth is not supported or already called, fall back to getAuth
  _auth = getAuth(app);
}

export const auth = _auth;
export const db = getFirestore(app);
