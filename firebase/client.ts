
import { initializeApp, getApp, getApps } from "firebase/app";
import {getAuth} from 'firebase/auth';
import { getFirestore } from "firebase/firestore";


const firebaseConfig = {
  apiKey: "AIzaSyDF8boxmuNRZB-no4cuqnfZ6zZGgEVGvzE",
  authDomain: "prepwise-cd9eb.firebaseapp.com",
  projectId: "prepwise-cd9eb",
  storageBucket: "prepwise-cd9eb.firebasestorage.app",
  messagingSenderId: "838020725667",
  appId: "1:838020725667:web:e93fc8a51ea399016ab816",
  measurementId: "G-B5R4W2NF4B"
};

const app =!getApp.length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db= getFirestore(app);