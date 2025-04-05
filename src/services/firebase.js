import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  // TODO: Replace with your Firebase config
  apiKey: "AIzaSyB2hlSAh_19IWU_d3KjwARJhEP0Je_3YrE",
  authDomain: "billingbuddy-62465.firebaseapp.com",
  projectId: "billingbuddy-62465",
  storageBucket: "billingbuddy-62465.firebasestorage.app",
  messagingSenderId: "373733593434",
  appId: "1:373733593434:android:6338c2d2ff4cbc8744e363"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
