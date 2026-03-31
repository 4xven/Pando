// lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";


const firebaseConfig = {
  apiKey: "AIzaSyDULsDRJF8juYTmkxjLgzgHFk65BY0HOLY",
  authDomain: "pando-7cfb2.firebaseapp.com",
  projectId: "pando-7cfb2",
  storageBucket: "pando-7cfb2.firebasestorage.app",
  messagingSenderId: "656499618563",
  appId: "1:656499618563:web:75e338962e626d6182af36",
  measurementId: "G-TDRPWRZBKX"
};


// Prevent re-initialization (important in Next.js)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);