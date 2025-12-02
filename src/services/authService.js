import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { serializeFirestoreData } from '../utils/serialization';

export const authService = {
  // Login
  login: async (email, password) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  },

  // Register
  register: async (email, password, name, role = 'student', department = '') => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update Profile
    await updateProfile(user, { displayName: name });

    // Create User Document in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      name,
      email,
      role,
      department,
      createdAt: serverTimestamp(),
      displayName: name,
      photoURL: user.photoURL || '',
      bio: ''
    });

    return user;
  },

  // Logout
  logout: async () => {
    await signOut(auth);
  },

  // Reset Password
  resetPassword: async (email) => {
    await sendPasswordResetEmail(auth, email);
  },

  // Resend Verification Email
  resendVerification: async (user) => {
    await sendEmailVerification(user);
  },

  // Get User Profile from Firestore
  getUserProfile: async (uid) => {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return serializeFirestoreData(docSnap.data());
    }
    return null;
  },

  // Google Login
  googleLogin: async () => {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    const user = userCredential.user;

    // Check if existing user
    const docRef = doc(db, 'users', user.uid);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      // Create basic student profile if new Google user
      await setDoc(docRef, {
        uid: user.uid,
        name: user.displayName,
        email: user.email,
        role: 'student', // Default
        department: 'General',
        profilePictureUrl: user.photoURL,
        createdAt: serverTimestamp(),
        displayName: user.displayName,
        bio: '',
        verified: true // Google users are verified
      });
    }
    
    return user;
  },

  // Auth State Listener (Callback)
  onAuthStateChanged: (callback) => {
    return onAuthStateChanged(auth, callback);
  },

  // Update User Profile Data
  updateUserProfile: async (uid, data) => {
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, data, { merge: true });
    return serializeFirestoreData(data);
  }
};
