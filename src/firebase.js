// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCcRppi0xTLvLOsDXUUsGsmFEryNixl0lg",
  authDomain: "blackfoot-play-and-learn.firebaseapp.com",
  projectId: "blackfoot-play-and-learn",
  storageBucket: "blackfoot-play-and-learn.firebasestorage.app",
  messagingSenderId: "145496257811",
  appId: "1:145496257811:web:9c232f97aa75503069d6e6"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Storage from metilda project - paid subscription
export const storage = getStorage(app, "metilda-c5ed6.appspot.com");
