import { serializeFirestoreData } from '../utils/serialization';
import Instructor from '../models/Instructor';
import { db } from '../firebase';

import { collection, query, where, getDocs, doc, getDoc, orderBy, limit, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';


// Enterprise Read-Optimized Service
// Architecture: Reads pre-aggregated data from 'instructors' collection.
// Zero Runtime Joins for lists.

export const instructorService = {
  
  // 1. Fetch Master List (Read-Optimized from 'instructors')
  fetchAllInstructors: async () => {
    try {
      const instructorsRef = collection(db, 'instructors');
      const q = query(instructorsRef, orderBy('fullName')); // Assumes index exists, or client sort
      
      const snapshot = await getDocs(q);
      
      const instructors = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
              id: doc.id,
              ...data,
              // Schema Alignment
              fullName: data.fullName || 'Unknown',
              department: data.departmentId || 'General',
              avgRating: data.ratingStats?.average || 0,
              totalRatings: data.ratingStats?.totalRatings || 0,
              profilePictureUrl: data.profilePictureUrl || ''
          };
      });
      return serializeFirestoreData(instructors);
    } catch (error) {
      console.error("Error fetching instructors:", error);
      return [];
    }
  },

  // 2. Fetch Single Profile
  fetchInstructorProfile: async (instructorId) => {
      try {
          // A. Direct Lookup in 'instructors'
          let docRef = doc(db, 'instructors', instructorId);
          let docSnap = await getDoc(docRef);
          
          // B. Fallback: Lookup by 'userId' if passed ID is actually a UID
          if (!docSnap.exists()) {
              const q = query(collection(db, 'instructors'), where('userId', '==', instructorId), limit(1));
              const querySnap = await getDocs(q);
              
              if (!querySnap.empty) {
                  docSnap = querySnap.docs[0];
              } else {
                   return { error: 'Instructor not found' };
              }
          }

          if (!docSnap.exists()) {
              return { error: 'Instructor not found' };
          }

          const data = docSnap.data();
          const profile = Instructor.fromFirestore(docSnap).toJSON();

          // Fetch Feedbacks
          // Using 'feedbacks' collection
          // Optimization: Client-side Sort to avoid index issues if missing
          const feedbacksQ = query(
              collection(db, 'feedbacks'),
              where('instructorId', '==', docSnap.id),
              // orderBy('createdAt', 'desc'), // REMOVE to prevent 400 if index missing
              limit(50)
          );
          
          const feedbacksSnap = await getDocs(feedbacksQ);
          const ratings = feedbacksSnap.docs.map(d => ({
              id: d.id,
              ...d.data(),
              timestamp: d.data().createdAt?.toMillis?.() || Date.now()
          }));

          // Client-side Sort
          ratings.sort((a,b) => b.timestamp - a.timestamp);

          return serializeFirestoreData({
              profile,
              ratings,
              replies: {} // Legacy or fetch separately
          });

      } catch (error) {
          console.error("Error fetching profile:", error);
          throw error;
      }
  },
  
  // 3. Leaderboard
  fetchTopInstructors: async () => {
      try {
          const q = query(
              collection(db, 'instructors'),
              orderBy('ratingStats.average', 'desc'),
              limit(5)
          );
          const snap = await getDocs(q);
          const leaders = snap.docs.map(d => Instructor.fromFirestore(d).toJSON());
          return serializeFirestoreData(leaders);
      } catch (e) {
          console.error("Leaderboard error:", e);
          return [];
      }
  },
  
  // 4. Update Profile
  updateInstructorProfile: async (uid, data) => {
      // Logic: Find the Public Profile by User ID and update it.
      const q = query(collection(db, 'instructors'), where('userId', '==', uid), limit(1));
      const querySnap = await getDocs(q);

      if (querySnap.empty) {
          throw new Error("Instructor profile not found. Please initialize your profile first.");
      }

      const docRef = querySnap.docs[0].ref;
      const updates = {
          ...data,
          updatedAt: serverTimestamp()
      };
      
      await updateDoc(docRef, updates);
      // We can't actally serialize 'serverTimestamp()' directly here since it's a Sentinel.
      // So we return 'new Date()' for the UI to consume immediately.
      return serializeFirestoreData({ 
          id: docRef.id, 
          ...updates, 
          updatedAt: new Date() 
      }); 
  },

  // 5. Initialize Profile (Recovery/First-Time)
  createInstructorProfile: async (uid, userData) => {
      // Check if profile already exists
      const q = query(collection(db, 'instructors'), where('userId', '==', uid), limit(1));
      const existingSnap = await getDocs(q);

      if (!existingSnap.empty) {
          console.log("Instructor profile already exists. Returning existing profile.");
          const existingData = existingSnap.docs[0].data();
          return {
              id: existingSnap.docs[0].id,
              ...existingData
          };
      }

      const name = userData.fullName || userData.displayName || 'Instructor';
      // STRICT ID ENFORCEMENT: Instructor ID === User UID
      // This prevents "Not Found" errors when looking up by ID.
      const finalId = uid;

      const profileData = {
          instructorId: finalId,
          userId: uid,
          fullName: name,
          departmentId: userData.departmentId || userData.department || 'General',
          campusId: userData.campusId || 'main',
          profilePictureUrl: userData.profilePictureUrl || userData.photoURL || '',
          
          courses: [],
          ratingStats: { average: 0, totalRatings: 0, distribution: {} },
          engagementScore: 0,
          sentimentScore: 0,
          tags: [],
          
          bio: userData.bio || `Instructor in ${userData.departmentId || 'General Department'}`,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
      };

      await setDoc(doc(db, 'instructors', finalId), profileData);
      return profileData;
  }
};
