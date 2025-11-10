import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from "firebase/app";
import { getAuth, getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCaVI2r2qaoSU19LAuVysr6Bm8_JVzrz6M",
  authDomain: "framez-123c7.firebaseapp.com",
  projectId: "framez-123c7",
  storageBucket: "framez-123c7.appspot.com",
  messagingSenderId: "595656282981",
  appId: "1:595656282981:web:3c5f1250d54e3fcb60c78c",
};

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
