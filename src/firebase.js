import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCLo2N3SH2vx4iqBRHm9kPOHYbuo7FaiGs",
  authDomain: "rycncsi.firebaseapp.com",
  projectId: "rycncsi",
  storageBucket: "rycncsi.appspot.com",
  messagingSenderId: "493736749179",
  appId: "1:493736749179:web:fe0f83a45260522f981ade",
  measurementId: "G-DDEWJT5L03"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Firestore with persistent cache
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

export const storage = getStorage(app);
// Set REACT_APP_BYPASS_AUTH=true in a .env file to bypass auth in development
export const BYPASS_AUTH = process.env.REACT_APP_BYPASS_AUTH === 'true';
export default app;
