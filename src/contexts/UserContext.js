import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { auth, db, BYPASS_AUTH } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Determine role from email (fallback method)
  const determineRoleFromEmail = useCallback((email) => {
    if (!email) return 'student';
    const emailLower = email.toLowerCase();
    if (emailLower.includes('admin') || emailLower.includes('@admin.')) return 'admin';
    if (emailLower.includes('instructor') || emailLower.includes('@instructor.') || emailLower.includes('@teacher.')) return 'instructor';
    return 'student';
  }, []);

  // Fetch user role and data from Firestore
  const fetchUserData = useCallback(async (firebaseUser) => {
    if (!firebaseUser || BYPASS_AUTH) {
      if (BYPASS_AUTH) {
        // Default to student role in development mode
        const devUser = {
          uid: 'dev-user',
          email: 'dev@localhost',
          displayName: 'Development User',
          role: 'student'
        };
        setUser(devUser);
        setUserRole('student');
        setUserData(devUser);
        setLoading(false);
        return;
      }
      setUser(null);
      setUserRole(null);
      setUserData(null);
      setLoading(false);
      return;
    }

    try {
      // Check if Firestore is available
      if (!db) {
        // Fallback: use email domain or default role
        const role = determineRoleFromEmail(firebaseUser.email);
        setUser(firebaseUser);
        setUserRole(role);
        setUserData({ ...firebaseUser, role });
        setLoading(false);
        return;
      }

      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserRole(data.role || 'student');
        setUserData({ ...firebaseUser, ...data });
      } else {
        // Create user document with default role
        const defaultRole = determineRoleFromEmail(firebaseUser.email);
        const newUserData = {
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || firebaseUser.email,
          role: defaultRole,
          createdAt: new Date().toISOString(),
        };
        
        await setDoc(userDocRef, newUserData);
        setUserRole(defaultRole);
        setUserData({ ...firebaseUser, ...newUserData });
      }
      
      setUser(firebaseUser);
    } catch (error) {
      console.error('Error fetching user data:', error);
      // Fallback to default role
      const role = determineRoleFromEmail(firebaseUser.email);
      setUser(firebaseUser);
      setUserRole(role);
      setUserData({ ...firebaseUser, role });
    } finally {
      setLoading(false);
    }
  }, [db, determineRoleFromEmail]);

  useEffect(() => {
    if (BYPASS_AUTH) {
      fetchUserData(null);
      return;
    }

    if (auth) {
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        await fetchUserData(firebaseUser);
      });
      return unsubscribe;
    }

    setLoading(false);
  }, [fetchUserData]);

  const updateUserRole = async (newRole) => {
    if (!user || !db) return;
    
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, { role: newRole }, { merge: true });
      setUserRole(newRole);
      setUserData({ ...userData, role: newRole });
    } catch (error) {
      console.error('Error updating user role:', error);
    }
  };

  const value = {
    user,
    userRole,
    userData,
    loading,
    updateUserRole,
    isStudent: userRole === 'student',
    isInstructor: userRole === 'instructor',
    isAdmin: userRole === 'admin',
    logout: async () => {
      try {
        await auth.signOut();
        setUser(null);
        setUserData(null);
        setUserRole(null);
      } catch (error) {
        console.error("Error signing out:", error);
      }
    }
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

