import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCY0z0wUhCYbwua5aRacCYfx3EBZokLm8M",
  authDomain: "kkrcablenetworks.firebaseapp.com",
  projectId: "kkrcablenetworks",
  storageBucket: "kkrcablenetworks.firebasestorage.app",
  messagingSenderId: "1077045971157",
  appId: "1:1077045971157:web:4c75581af9da8527a4fa5c"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
