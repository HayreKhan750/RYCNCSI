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
import User from '../models/User';
import Instructor from '../models/Instructor';

export const authService = {
  // Login
  login: async (email, password) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  },

  // Register
  register: async (email, password, name, role = 'student', department = '', photoURL = null) => {
    // 1. Create Auth User (Fastest)
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // 2. Create Pending Profile (Blocking to ensure data existence)
    try {
        const profileUpdates = { displayName: name };
        if (photoURL) profileUpdates.photoURL = photoURL;
        
        await updateProfile(user, profileUpdates);
        await sendEmailVerification(user);

        const tempPayload = {
          uid: user.uid,
          fullName: name, // Standardized field
          name, // Legacy support
          email,
          role,
          departmentId: department, 
          department, 
          campusId: 'main', 
          year: '1', // Default for students
          staffCode: null,
          profilePictureUrl: photoURL || user.photoURL || '',
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
        console.error("Registration data setup failed:", error);
        // CRITICAL: Throw so the UI knows
        throw new Error(`Data Setup Failed: ${error.message}`);
    }
    
    return user;
  },

  // Finalize Registration (Promote Pending -> Real)
  finalizeRegistration: async (user) => {
      const uid = user.uid;
      const pendingRef = doc(db, 'pending_registrations', uid);
      const pendingSnap = await getDoc(pendingRef);

      if (!pendingSnap.exists()) {
          console.error("Finalize Error: No pending registration found for", uid);
          throw new Error("Registration data missing. Please contact support.");
      }

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
          // STRICT ARCHITECTURE: Instructor ID === User UID
          const instructorDocRef = doc(db, 'instructors', uid);
          
          promises.push(setDoc(instructorDocRef, { 
              // Explicit Strict Schema
              instructorId: uid, // 1:1 Mapping
              userId: uid,
              
              // Standardized Name Fields (Cover all cases)
              fullName: baseData.fullName || baseData.name,
              displayName: baseData.fullName || baseData.name,
              instructorName: baseData.fullName || baseData.name,
              name: baseData.fullName || baseData.name,

              // Standardized Department
              departmentId: baseData.departmentId || baseData.department,
              department: baseData.department || baseData.departmentId,
              
              campusId: baseData.campusId || 'main', // Required field
              
              // Standardized Image Fields
              profilePictureUrl: baseData.profilePictureUrl || '',
              photoURL: baseData.profilePictureUrl || '',
              
              courses: [],
              ratingStats: { average: 0, totalRatings: 0, distribution: {} },
              engagementScore: 0,
              sentimentScore: 0,
              tags: [],
              
              bio: `Instructor in ${baseData.departmentId || baseData.department}`,
              createdAt: serverTimestamp()
          }));
      } else if (role === 'student') {
            // Strict Blueprint: Create separate 'students' doc
            promises.push(setDoc(doc(db, 'students', uid), {
                studentId: uid,
                year: baseData.year || '1',
                campusId: baseData.campusId || 'main',
                departmentId: baseData.departmentId || baseData.department, 
                stats: {
                    reviewsCount: 0,
                    helpfulVotes: 0
                },
                createdAt: serverTimestamp()
            }));
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

  // Get User Profile from Firestore (High-Performance Parallel Execution)
  getUserProfile: async (uid, email = null) => {
    // We launch multiple probes in parallel to ensure:
    // 1. Speed (don't wait for partial failures)
    // 2. Reliability (if one path is blocked by permissions, the other succeeds)
    
    const probes = [];

    // Probe A: Private User Document (The standard path)
    const privateProfileProbe = async () => {
        try {
            const snap = await getDoc(doc(db, 'users', uid));
            return snap.exists() ? snap.data() : null;
        } catch (e) { 
            console.warn("Probe A (Users) failed/denied:", e.code);
            return null; 
        }
    };
    probes.push(privateProfileProbe());

    // Probe B: Instructor Document (Direct ID Match - Primary Check)
    const instructorProbe = async () => {
        try {
             // NOW: We expect instructors/{uid}
             const snap = await getDoc(doc(db, 'instructors', uid));
             return snap.exists() ? snap.data() : null;
        } catch (e) {
             console.warn("Probe B (Instructors) failed:", e.code);
             return null;
        }
    };
    probes.push(instructorProbe());

    // Execute Parallel Wait
    const [privateResult, instructorResult] = await Promise.all(probes);

    // --- RESOLUTION LOGIC ---
    
    // 1. Management Override (Fastest/Highest Priority)
    if (email) {
        // Check whitelist/pattern or explicit role
        const upperRole = privateResult?.role?.toUpperCase();
        const isManagement = email.includes('admin') || email.includes('management') || 
                             (upperRole === 'MANAGEMENT') || (upperRole === 'ADMIN');
                             
        if (isManagement) {
             return new User({ 
                uid, email, 
                displayName: privateResult?.displayName || 'Admin', 
                role: 'MANAGEMENT', 
                department: 'Management',
                isVerified: true, isRegistered: true,
                ...privateResult 
            }).toJSON();
        }
    }

    // 2. Instructor Resolution
    // If public probe found something, it's a strong signal they are an instructor.
    if (instructorResult) {
        // We found them in the public directory with Matching ID. They ARE an instructor.
        const publicData = Instructor.fromFirestore({ id: uid, data: () => instructorResult }).toJSON();
        
        return {
            ...publicData,
            ...(privateResult ? serializeFirestoreData(privateResult) : {}), // Safe Serialize
            uid: uid // Ensure UID matches auth
        };
    }

    // 3. Fallback: Check Legacy Email Lookup (Migration Support)
    // If we didn't find them by UID, maybe they are an old instructor?
    if (email && !privateResult) {
        // Only checking if we are desperate (no user doc)
        try {
            const q = query(collection(db, 'instructors'), where('email', '==', email), limit(1));
            const snap = await getDocs(q);
            if (!snap.empty) {
                 const legacyDoc = snap.docs[0];
                 console.warn("Found Legacy Instructor by Email. Migration required.");
                 // We return it, but ideally we should trigger a migration here.
                 const publicData = Instructor.fromFirestore(legacyDoc).toJSON();
                 return { ...publicData, role: 'instructor', uid: uid };
            }
        } catch(e) {}
    }

    // 4. Private Profile Fallback
    // If no public instructor doc, trust the private doc.
    if (privateResult) {
        return new User({ ...privateResult, uid }).toJSON();
    }

    // 5. Ghost/New User
    return null;
  },

  // Google Login
  googleLogin: async () => {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    const user = userCredential.user;

    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    
    // Check if Instructor (Prioritize existing instructor profile linkage)
    // Legacy Check
    const instQ = query(collection(db, 'instructors'), where('email', '==', user.email));
    
    if (!userSnap.exists()) {
      let role = 'student';
      let dept = 'General';

      // Auto-claim instructor profile if email matches
      const instSnap = await getDocs(instQ);
      if (!instSnap.empty) {
          role = 'instructor';
          const instDoc = instSnap.docs[0];
          dept = instDoc.data().department || 'General';
          
          // MIGRATION ON THE FLY:
          // If the ID is NOT the UID, strict architecture says we should fix it.
          // For now, we just link 'userId' in the old doc.
          if (instDoc.id !== user.uid) {
              await updateDoc(doc(db, 'instructors', instDoc.id), { userId: user.uid });
          }
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
           // New Instructor via Google (Rare)
           // Create STRICT ID doc
           await setDoc(doc(db, 'instructors', user.uid), {
              instructorId: user.uid,
              userId: user.uid,
              
              // Standardized Name Fields
              fullName: user.displayName,
              displayName: user.displayName,
              instructorName: user.displayName,
              name: user.displayName,

              departmentId: dept,
              department: dept,
              
              campusId: 'main',
              
              profilePictureUrl: user.photoURL,
              photoURL: user.photoURL,

              courses: [],
              ratingStats: { average: 0, totalRatings: 0, distribution: {} },
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
    try {
        await updateDoc(userRef, { ...data, updatedAt: serverTimestamp() });
    } catch(e) {
         const pendingRef = doc(db, 'pending_registrations', uid);
         const pendingSnap = await getDoc(pendingRef);
         if (pendingSnap.exists()) {
             await updateDoc(pendingRef, data);
             return serializeFirestoreData(data);
         }
         throw e;
    }

    // 2. Check for Instructor Doc (Try Strict ID first)
    const directInst = doc(db, 'instructors', uid);
    const directSnap = await getDoc(directInst);
    
    let targetRef = null;
    if (directSnap.exists()) {
        targetRef = directInst;
    } else {
        // Fallback check
        const q = query(collection(db, 'instructors'), where('userId', '==', uid));
        const qSnap = await getDocs(q);
        if(!qSnap.empty) targetRef = qSnap.docs[0].ref;
    }

    if (targetRef) {
        const publicUpdates = {};
        if (data.displayName || data.name) publicUpdates.instructorName = data.displayName || data.name;
        if (data.fullName) publicUpdates.fullName = data.fullName;
        if (data.department) publicUpdates.department = data.department;
        if (data.bio) publicUpdates.bio = data.bio;
        if (data.photoURL || data.profilePictureUrl) publicUpdates.photoURL = data.photoURL || data.profilePictureUrl;
        
        if (Object.keys(publicUpdates).length > 0) {
            await updateDoc(targetRef, publicUpdates);
        }
    }
    
    return serializeFirestoreData(data);
  },

  // Helper for Registration Phase
  updatePendingDoc: async (uid, data) => {
      const pendingRef = doc(db, 'pending_registrations', uid);
      await updateDoc(pendingRef, data);
  },

  // Rescue Method: Create Default Profile for Verified-but-Missing Users
  createDefaultProfile: async (user) => {
    try {
        const uid = user.uid;
        const email = user.email;
        const name = user.displayName || email.split('@')[0] || 'User';
        
        const baseData = {
            uid,
            email,
            displayName: name,
            role: 'student', // Default safe role
            department: 'General',
            photoURL: user.photoURL || '',
            isRegistered: true,
            isVerified: true,
            createdAt: serverTimestamp()
        };

        // Write to Real Collections
        
        await setDoc(doc(db, 'users', uid), {
            ...baseData,
            name: name, // Legacy
            departmentId: 'General',
            campusId: 'main', 
            year: '1',
            bio: 'Account recovered.',
            status: 'active',
            lastLoginAt: serverTimestamp(),
            recoveredAt: serverTimestamp()
        });
        
        await setDoc(doc(db, 'students', uid), {
            studentId: uid,
            year: '1',
            campusId: 'main',
            departmentId: 'General',
            stats: { reviewsCount: 0, helpfulVotes: 0 },
            createdAt: serverTimestamp()
        });

        // Return standardized model
        return new User(baseData).toJSON();
    } catch (e) {
        console.error("Failed to create default profile:", e);
        throw e;
    }
  }
};
