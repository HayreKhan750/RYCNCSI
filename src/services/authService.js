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
import { doc, setDoc, getDoc, serverTimestamp, query, collection, where, getDocs, updateDoc, limit, deleteDoc } from 'firebase/firestore';
import { serializeFirestoreData } from '../utils/serialization';
import { auditService } from './auditService';

export const authService = {
  // Login
  login: async (email, password) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  },

  // Register
  // Register (Optimized & Verified)
  register: async (email, password, name, role = 'student', department = '') => {
    // 1. Create Auth User (Fastest)
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // 2. Background Operations (Non-blocking for UI redirect)
    // We return 'user' immediately so the UI can redirect to "Verify Email" page.
    // The verify page just needs the Auth Object to display the email.
    
    const backgroundTasks = async () => {
        try {
            await updateProfile(user, { displayName: name });
            await sendEmailVerification(user);

              const tempPayload = {
              uid: user.uid,
              fullName: name, // Standardized field
              name, // Legacy support
              email,
              role,
              departmentId: department, // Standardized
              department, // Legacy
              campusId: 'main', // Default
              year: '1', // Default for students
              staffCode: null,
              profilePictureUrl: user.photoURL || '',
              bio: '',
              isRegistered: false,
              isVerified: false,
              status: 'active', // active | suspended | banned
              lastLoginAt: null,
              createdAt: serverTimestamp(),
              stats: {
                  ratingsGiven: 0,
                  reviewsReceived: 0,
                  helpfulCount: 0
              }
            };
            
            // Write to TEMPORARY 'pending_registrations' collection
            await setDoc(doc(db, 'pending_registrations', user.uid), tempPayload);
        } catch (error) {
            console.error("Background registration tasks failed:", error);
            // In a real app, we might want to flag this user or retry.
        }
    };

    // Execute background tasks without awaiting
    backgroundTasks();

    return user;
  },

  // Finalize Registration (Promote Pending -> Real)
  finalizeRegistration: async (user) => {
      const uid = user.uid;
      const pendingRef = doc(db, 'pending_registrations', uid);
      const pendingSnap = await getDoc(pendingRef);

      if (!pendingSnap.exists()) return null; // Already finalized or invalid

      const data = pendingSnap.data();
      const { role, name, email } = data;

      const baseData = {
          ...data,
          isRegistered: true, // Now they are officially registered
          isVerified: user.emailVerified,
          lastLoginAt: serverTimestamp(),
          createdAt: data.createdAt || serverTimestamp(),
          migratedAt: serverTimestamp()
      };

      const promises = [];

      // A. Write to Real Collections
      promises.push(setDoc(doc(db, 'users', uid), baseData));

      if (role === 'instructor') {
        const q = query(collection(db, 'instructors'), where('email', '==', email), limit(1));
        const customSnap = await getDocs(q);

        if (!customSnap.empty) {
            const existingDoc = customSnap.docs[0];
            promises.push(setDoc(doc(db, 'instructors', existingDoc.id), {
                ...existingDoc.data(),
                ...baseData,
                updatedAt: serverTimestamp(),
                userId: uid
            }, { merge: true }));
        } else {
            let slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            if (!slug) slug = 'instructor';
            const finalId = `${slug}-${Date.now()}`;
            
            
          promises.push(setDoc(doc(db, 'instructors', finalId), { 
              // Explicit Strict Schema
              instructorId: finalId,
              userId: uid,
              fullName: baseData.fullName || baseData.name,
              departmentId: baseData.departmentId || baseData.department,
              campusId: baseData.campusId || 'main', // Required field
              profilePictureUrl: baseData.profilePictureUrl || '',
              
              courses: [],
              ratingStats: { average: 0, totalRatings: 0, distribution: {} },
              engagementScore: 0,
              sentimentScore: 0,
              tags: [],
              
              bio: `Instructor in ${baseData.departmentId || baseData.department}`,
              createdAt: serverTimestamp()
          }));
        }
      } else {
         if (role === 'student') {
            // Strict Blueprint: Create separate 'students' doc
            promises.push(setDoc(doc(db, 'students', uid), {
                studentId: uid,
                year: baseData.year || '1',
                campusId: baseData.campusId || 'main',
                departmentId: baseData.departmentId || baseData.department, // Helpful redundancy
                stats: {
                    reviewsCount: 0,
                    helpfulVotes: 0
                },
                createdAt: serverTimestamp()
            }));
         }
      }

      // B. Delete Pending Doc
      promises.push(deleteDoc(pendingRef)); // Clean up

      await Promise.all(promises);
      
      // Log Registration
      await auditService.logAction(uid, 'REGISTER_FINALIZE', uid);
      
      return serializeFirestoreData(baseData);
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

  // Get User Profile from Firestore (Robust Lookup)
  getUserProfile: async (uid, email = null) => {
    try {
      // 1. Single Source of Truth: 'users' collection
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
          const userData = userSnap.data();
          // If it's an instructor, we might want to blend in public profile data?
          // Actually, 'users' should have the role. 
          return serializeFirestoreData(userData);
      }

      // 2. Legacy/Fallback Safety (Post-Migration these should be removed)
      // If not in 'users', check if they are in 'instructors' (maybe created by admin without user doc?)
      // or 'students' (legacy)
      
      if (email) {
          // Check 'instructors' by email to link them?
          const instQ = query(collection(db, 'instructors'), where('email', '==', email), limit(1));
          const instSnap = await getDocs(instQ);
          if (!instSnap.empty) {
             console.warn("Found in instructors but not users. Syncing needed.");
             return serializeFirestoreData({ ...instSnap.docs[0].data(), role: 'instructor', uid }); 
          }
      }
      
      return null;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }
  },

  // Google Login
  googleLogin: async () => {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    const user = userCredential.user;

    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    
    // Check if Instructor (Prioritize existing instructor profile linkage)
    const instQ = query(collection(db, 'instructors'), where('email', '==', user.email));
    
    if (!userSnap.exists()) {
      let role = 'student';
      let dept = 'General';

      // Auto-claim instructor profile if email matches
      const instSnap = await getDocs(instQ);
      if (!instSnap.empty) {
          role = 'instructor';
          // Link them
          const instDoc = instSnap.docs[0];
          await updateDoc(doc(db, 'instructors', instDoc.id), {
              userId: user.uid,
              isRegistered: true
          });
          dept = instDoc.data().department || 'General';
      }

      // Create Unified User Doc
      await setDoc(userRef, {
        uid: user.uid,
        fullName: user.displayName,
        name: user.displayName,
        email: user.email,
        role,
        departmentId: dept,
        department: dept,
        campusId: 'main',
        year: '1',
        staffCode: null,
        profilePictureUrl: user.photoURL,
        bio: '',
        status: 'active',
        isRegistered: true,
        isVerified: true, // Google is verified
        lastLoginAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      });
      
      // Strict Blueprint: Create 'students' doc for Google Users (if student)
      if (role === 'student') {
          await setDoc(doc(db, 'students', user.uid), {
             studentId: user.uid,
             year: '1',
             campusId: 'main',
             departmentId: dept,
             stats: {
                 reviewsCount: 0,
                 helpfulVotes: 0
             },
             createdAt: serverTimestamp()
          });
      }
      
      await auditService.logAction(user.uid, 'REGISTER_GOOGLE', user.uid);
    }
    
    return user;
  },

  // Auth State Listener (Callback)
  onAuthStateChanged: (callback) => {
    return onAuthStateChanged(auth, callback);
  },

  // Update User Profile Data
  updateUserProfile: async (uid, data) => {
    // 1. Update Core User Doc
    const userRef = doc(db, 'users', uid);
    
    // Check if user exists, if not, try pending?
    // No, updateUserProfile is meant for fully registered users.
    // However, during the chaotic registration phase, flexibility helps.
    
    try {
        await updateDoc(userRef, {
            ...data,
            updatedAt: serverTimestamp()
        });
    } catch(e) {
        // If 'users' doc missing, try 'pending_registrations'
         const pendingRef = doc(db, 'pending_registrations', uid);
         const pendingSnap = await getDoc(pendingRef);
         if (pendingSnap.exists()) {
             await updateDoc(pendingRef, data);
             return serializeFirestoreData(data);
         }
         throw e;
    }

    // 2. If Instructor, Sync Public Profile
    const instQ = query(collection(db, 'instructors'), where('userId', '==', uid)); // Check by linked ID
    const instSnap = await getDocs(instQ);
    
    if (!instSnap.empty) {
        const instDoc = instSnap.docs[0];
        // Sync public facing fields only
        const publicUpdates = {};
        if (data.displayName || data.name) publicUpdates.instructorName = data.displayName || data.name;
        if (data.department) publicUpdates.department = data.department;
        if (data.bio) publicUpdates.bio = data.bio;
        if (data.photoURL || data.profilePictureUrl) publicUpdates.photoURL = data.photoURL || data.profilePictureUrl;
        
        if (Object.keys(publicUpdates).length > 0) {
            await updateDoc(doc(db, 'instructors', instDoc.id), publicUpdates);
        }
    }
    
    return serializeFirestoreData(data);
  },

  // Helper for Registration Phase
  updatePendingDoc: async (uid, data) => {
      const pendingRef = doc(db, 'pending_registrations', uid);
      await updateDoc(pendingRef, data);
  }
};
