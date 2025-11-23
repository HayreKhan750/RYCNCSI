import { useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider,
  sendPasswordResetEmail,
  sendEmailVerification,
  signOut
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '../../firebase';

export function useAuthLogic() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const clearError = () => setError(null);

  const login = async (email, password) => {
    setLoading(true);
    clearError();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Logic to check verification state handled by component or route guard
      return true;
    } catch (err) {
      setError(formatAuthError(err));
      return false;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (data, profileImage) => {
    setLoading(true);
    clearError();
    try {
      const { user } = await createUserWithEmailAndPassword(auth, data.email, data.password);
      
      let photoURL = '';
      if (profileImage) {
        const storageRef = ref(storage, `profile_pics/${user.uid}`);
        await uploadBytes(storageRef, profileImage);
        photoURL = await getDownloadURL(storageRef);
      }

      await setDoc(doc(db, 'users', user.uid), {
        name: data.name,
        email: data.email,
        department: data.department,
        role: data.role, // 'student' or 'instructor'
        profilePictureUrl: photoURL,
        createdAt: serverTimestamp(),
        verified: false
      });

      await sendEmailVerification(user);
      return true;
    } catch (err) {
      setError(formatAuthError(err));
      return false;
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = async () => {
    setLoading(true);
    clearError();
    try {
      const provider = new GoogleAuthProvider();
      const { user } = await signInWithPopup(auth, provider);
      
      // Check if existing user
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        // Create basic student profile if new Google user
        await setDoc(doc(db, 'users', user.uid), {
          name: user.displayName,
          email: user.email,
          role: 'student', // Default
          department: 'General',
          profilePictureUrl: user.photoURL,
          createdAt: serverTimestamp(),
          verified: true // Google users are verified
        });
      }
      return true;
    } catch (err) {
      setError(formatAuthError(err));
      return false;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email) => {
    setLoading(true);
    clearError();
    try {
      await sendPasswordResetEmail(auth, email);
      return true;
    } catch (err) {
      setError(formatAuthError(err));
      return false;
    } finally {
      setLoading(false);
    }
  };

  const resendVerification = async (user) => {
    setLoading(true);
    try {
      await sendEmailVerification(user);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
      await signOut(auth);
  };

  // Helper to make Firebase errors user-friendly
  const formatAuthError = (err) => {
    const code = err.code;
    if (code === 'auth/user-not-found') return 'No account found with this email.';
    if (code === 'auth/wrong-password') return 'Incorrect password.';
    if (code === 'auth/email-already-in-use') return 'Email already registered.';
    if (code === 'auth/weak-password') return 'Password should be at least 6 characters.';
    if (code === 'auth/invalid-email') return 'Invalid email address.';
    return err.message; // Fallback
  };

  return {
    loading,
    error,
    login,
    signup,
    googleLogin,
    resetPassword,
    resendVerification,
    logout,
    clearError
  };
}
