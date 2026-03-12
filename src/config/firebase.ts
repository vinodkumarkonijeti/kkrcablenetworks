import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCY0z0wUhCYbwua5aRacCYfx3EBZokLm8M",
  authDomain: "kkrcablenetworks.firebaseapp.com",
  projectId: "kkrcablenetworks",
  storageBucket: "kkrcablenetworks.firebasestorage.app",
  messagingSenderId: "1077045971157",
  appId: "1:1077045971157:web:4c75581af9da8527a4fa5c"
};

const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});
export const storage = getStorage(app);
