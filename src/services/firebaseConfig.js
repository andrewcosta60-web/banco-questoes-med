import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCyhIKCdaArM3oo7LH38gyqj5jqFth8m9I",
  authDomain: "banco-questoes-med.firebaseapp.com",
  projectId: "banco-questoes-med",
  storageBucket: "banco-questoes-med.firebasestorage.app",
  messagingSenderId: "4222772460",
  appId: "1:4222772460:web:004aa69e6f025c437c7c21"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);