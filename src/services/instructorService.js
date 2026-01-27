import { serializeFirestoreData } from '../utils/serialization';
import Instructor from '../models/Instructor';
import { db } from '../firebase';

import { collection, query, where, getDocs, doc, getDoc, orderBy, limit, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';


// Enterprise Read-Optimized Service
// Architecture: Reads pre-aggregated data from 'instructors' collection.
// Zero Runtime Joins for lists.

export const instructorService = {
  
  // 1. Fetch Master List (Real-Time Aggregation + Deep Photo Sync)
  fetchAllInstructors: async () => {
    try {
      const instructorsRef = collection(db, 'instructors');
      const q = query(instructorsRef, orderBy('fullName'));
      
      const [instSnap, feedSnap] = await Promise.all([
          getDocs(q),
          getDocs(query(collection(db, 'feedbacks'), limit(500))) 
      ]);
      
      // Build Rating Map
      const ratingsMap = {};
      feedSnap.forEach(doc => {
          const d = doc.data();
          const iid = d.instructorId;
          const val = Number(d.rating || d.ratingValue || d.score || 0);
          
          if (iid && val > 0) {
              if (!ratingsMap[iid]) ratingsMap[iid] = { sum: 0, count: 0 };
              ratingsMap[iid].sum += val;
              ratingsMap[iid].count += 1;
          }
      });

      // Collect User IDs for Photo Hydration
      const userIdsToFetch = [];
      const baseInstructors = instSnap.docs.map(doc => {
          const d = doc.data();
          if (!d.profilePictureUrl && d.userId) userIdsToFetch.push(d.userId);
          return { id: doc.id, ...d };
      });

      // Batch Fetch Users (Chunks of 10 for 'in' query, or Promise.all for simplicity/speed on small sets)
      const userPhotoMap = {};
      if (userIdsToFetch.length > 0) {
          // Remove duplicates
          const uniqueIds = [...new Set(userIdsToFetch)];
          // Using Promise.all for parallel fetch (Firestore SDK handles pipelining)
          const userSnaps = await Promise.all(
              uniqueIds.map(uid => getDoc(doc(db, 'users', uid)))
          );
          userSnaps.forEach(snap => {
              if (snap.exists()) {
                  userPhotoMap[snap.id] = snap.data().photoURL || snap.data().profilePictureUrl;
              }
          });
      }

      const instructors = baseInstructors.map(data => {
          const stats = ratingsMap[data.id] || { sum: 0, count: 0 };
          const realAvg = stats.count > 0 ? (stats.sum / stats.count) : 0;
          
          // Hydrate Photo
          const realPhoto = data.profilePictureUrl || userPhotoMap[data.userId] || userPhotoMap[data.id] || '';

          return {
              ...data,
              fullName: data.fullName || data.instructorName || 'Unknown',
              department: data.departmentId || data.department || 'General',
              // Use Real-Time stats
              avgRating: realAvg, 
              ratingStats: { 
                  average: realAvg, 
                  totalRatings: stats.count 
              },
              totalRatings: stats.count,
              profilePictureUrl: realPhoto
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
              }
          }

          if (!docSnap.exists()) {
              return { error: 'Instructor not found' };
          }

          const data = docSnap.data();
          let profile = Instructor.fromFirestore(docSnap).toJSON();

          // C. DEEP HYDRATION: Check for Name, Photo, OR EMAIL missing
          if (!profile.instructorName || profile.instructorName === 'Instructor' || !profile.profilePictureUrl || !profile.email) {
               try {
                   const userId = profile.userId || docSnap.id;
                   const userSnap = await getDoc(doc(db, 'users', userId));
                   if (userSnap.exists()) {
                       const userData = userSnap.data();
                       const realName = userData.displayName || userData.fullName || userData.name;
                       const realPhoto = userData.photoURL || userData.profilePictureUrl;
                       const realEmail = userData.email;

                       if (realName && (!profile.instructorName || profile.instructorName === 'Instructor')) {
                           profile.instructorName = realName;
                           profile.fullName = realName;
                           profile.displayName = realName;
                       }
                       
                       if (realPhoto && !profile.profilePictureUrl) {
                           profile.profilePictureUrl = realPhoto;
                       }

                       if (realEmail && !profile.email) {
                           profile.email = realEmail;
                       }
                   }
               } catch (err) {
                   console.warn("Failed to hydrate instructor data", err);
               }
          }

          // Fetch Feedbacks
          // Using 'feedbacks' collection
          const feedbacksQ = query(
              collection(db, 'feedbacks'),
              where('instructorId', '==', docSnap.id),
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

          // Real-Time Rating Calculation for Profile View
          if (ratings.length > 0) {
              const sum = ratings.reduce((acc, r) => acc + (Number(r.rating) || Number(r.ratingValue) || 0), 0);
              const avg = sum / ratings.length;
              profile.rating = avg;
              profile.avgRating = avg;
              profile.ratingStats = {
                  ...profile.ratingStats,
                  average: avg,
                  totalRatings: ratings.length
              };
          }

          return serializeFirestoreData({
              profile,
              ratings,
              replies: {} 
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
      const q = query(collection(db, 'instructors'), where('userId', '==', uid), limit(1));
      const querySnap = await getDocs(q);

      if (querySnap.empty) {
          throw new Error("Instructor profile not found. Please initialize your profile first.");
      }

      const docRef = querySnap.docs[0].ref;
      
      // Map UI Fields (name/department) to Firestore Schema (fullName/departmentId)
      const mappedUpdates = {
          ...data
      };
      
      if (data.name) {
          mappedUpdates.fullName = data.name;
          mappedUpdates.instructorName = data.name; // Redundancy for old code
          mappedUpdates.displayName = data.name;    // Redundancy for old code
          mappedUpdates.name = data.name;
      }
      
      if (data.department) {
          mappedUpdates.departmentId = data.department;
          mappedUpdates.department = data.department; // Keep both for now to be safe
      }
      
      if (data.photoURL || data.profilePictureUrl) {
          const photo = data.photoURL || data.profilePictureUrl;
          mappedUpdates.photoURL = photo;
          mappedUpdates.profilePictureUrl = photo;
      }

      const updates = {
          ...mappedUpdates,
          updatedAt: serverTimestamp()
      };
      
      await updateDoc(docRef, updates);
      
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
          displayName: name,
          instructorName: name,
          name: name,

          departmentId: userData.departmentId || userData.department || 'General',
          department: userData.department || userData.departmentId || 'General',
          
          campusId: userData.campusId || 'main',
          
          profilePictureUrl: userData.profilePictureUrl || userData.photoURL || '',
          photoURL: userData.profilePictureUrl || userData.photoURL || '',
          
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
