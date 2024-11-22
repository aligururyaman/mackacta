import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyC-8zpQECMtee0IobPH19ynlo8dj7yrP1s",
  authDomain: "mackacta-80.firebaseapp.com",
  projectId: "mackacta-80",
  storageBucket: "mackacta-80.firebasestorage.app",
  messagingSenderId: "200668612893",
  appId: "1:200668612893:web:1900acc352038a519a39f4",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
