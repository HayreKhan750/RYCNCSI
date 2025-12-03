import { db } from '../firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import scheduleData from '../assets/my-file.optimized.json';
import { fetchReplies } from '../utils/feedbackInteractions';
import { serializeFirestoreData } from '../utils/serialization';

export const instructorService = {
  // Fetch Master List (JSON + Firestore + Ratings)
  fetchAllInstructors: async () => {
    try {
      // 1. Parse JSON
      const jsonInstructorsMap = new Map();
      if (scheduleData && Array.isArray(scheduleData.schedule)) {
          scheduleData.schedule.forEach(dept => {
              if (Array.isArray(dept.courses)) {
                  dept.courses.forEach(course => {
                      if (Array.isArray(course.instructor)) {
                          course.instructor.forEach(inst => {
                              const email = inst.email ? inst.email.toLowerCase() : null;
                              const name = inst.name;
                              const key = email || name; 
                              if (key && !jsonInstructorsMap.has(key)) {
                                  jsonInstructorsMap.set(key, {
                                      id: key,
                                      instructorName: name,
                                      email: email,
                                      department: dept.department,
                                      courses: [course.course_title],
                                      source: 'json',
                                      photo: null
                                  });
                              } else if (key) {
                                  const existing = jsonInstructorsMap.get(key);
                                  if (!existing.courses.includes(course.course_title)) {
                                      existing.courses.push(course.course_title);
                                  }
                              }
                          });
                      }
                  });
              }
          });
      }

      // 2. Fetch Firestore Instructors
      const q = query(collection(db, 'users'), where('role', '==', 'instructor'));
      let firestoreInstructors = [];
      try {
          const querySnapshot = await getDocs(q);
          firestoreInstructors = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
      } catch (err) {
          console.warn("Offline: Could not fetch instructors from Firestore", err);
      }

      // 3. Fetch All Feedbacks
      const ratingsQ = query(collection(db, 'feedbacks'));
      let ratingsSnap = { docs: [] };
      try {
          ratingsSnap = await getDocs(ratingsQ);
      } catch (err) {
          console.warn("Offline: Could not fetch feedbacks", err);
      }

      const ratingMap = {}; 
      
      ratingsSnap.docs.forEach(doc => {
          const data = doc.data();
          const rVal = data.overall || data.rating || 0;
          if (data.instructorId) {
              const key = data.instructorId.toLowerCase();
              if (!ratingMap[key]) {
                  ratingMap[key] = { total: 0, count: 0, photo: null };
              }
              ratingMap[key].total += rVal;
              ratingMap[key].count += 1;
              if (data.instructorPhoto && !ratingMap[key].photo) {
                  ratingMap[key].photo = data.instructorPhoto;
              }
          }
      });

      // 4. Merge Data
      const mergedInstructors = [];
      const processedFirestoreIds = new Set();

      jsonInstructorsMap.forEach((val, key) => {
          let totalRating = 0;
          let totalCount = 0;
          let photo = val.photo;

          const emailKey = val.email ? val.email.toLowerCase() : null;
          const nameKey = val.instructorName ? val.instructorName.toLowerCase() : null;

          if (emailKey && ratingMap[emailKey]) {
              totalRating += ratingMap[emailKey].total;
              totalCount += ratingMap[emailKey].count;
              if (ratingMap[emailKey].photo) photo = ratingMap[emailKey].photo;
          }
          if (nameKey && nameKey !== emailKey && ratingMap[nameKey]) {
              totalRating += ratingMap[nameKey].total;
              totalCount += ratingMap[nameKey].count;
              if (ratingMap[nameKey].photo) photo = ratingMap[nameKey].photo;
          }

          const avgRating = totalCount > 0 ? totalRating / totalCount : 0;

          // Match with Firestore
          let match = firestoreInstructors.find(f => f.email && f.email.toLowerCase() === val.email);
          if (!match) {
              const valName = val.instructorName.toLowerCase().trim();
              match = firestoreInstructors.find(f => {
                  if (!f.displayName) return false;
                  const fName = f.displayName.toLowerCase().trim();
                  return fName === valName || 
                         (fName.includes(valName) && valName.length > 3) || 
                         (valName.includes(fName) && fName.length > 3);
              });
          }

          if (match) {
              // Check for ratings by Firestore ID
              const idKey = match.id.toLowerCase();
              if (ratingMap[idKey]) {
                  totalRating += ratingMap[idKey].total;
                  totalCount += ratingMap[idKey].count;
                  if (ratingMap[idKey].photo && !photo) photo = ratingMap[idKey].photo;
              }

              processedFirestoreIds.add(match.id);
              
              const avgRating = totalCount > 0 ? totalRating / totalCount : 0;

              mergedInstructors.push({
                  ...val,
                  ...match,
                  id: match.id,
                  instructorName: match.displayName || val.instructorName,
                  department: match.department || val.department,
                  isRegistered: true,
                  avgRating,
                  ratingCount: totalCount,
                  photo: match.photoURL || photo,
                  photoURL: match.photoURL || photo, // Ensure photoURL is available
                  profilePictureUrl: match.profilePictureUrl || match.photoURL || photo // Ensure profilePictureUrl is available
              });
          } else {
              const avgRating = totalCount > 0 ? totalRating / totalCount : 0;
              mergedInstructors.push({
                  ...val,
                  id: val.id,
                  isRegistered: false,
                  avgRating,
                  ratingCount: totalCount,
                  photo: photo,
                  photoURL: photo,
                  profilePictureUrl: photo
              });
          }
      });

      // Add remaining Firestore instructors
      firestoreInstructors.forEach(f => {
          if (!processedFirestoreIds.has(f.id)) {
              let avgRating = 0;
              let ratingCount = 0;
              let photo = f.photoURL || null;

              const emailKey = f.email ? f.email.toLowerCase() : null;
              const nameKey = f.displayName ? f.displayName.toLowerCase() : null;
              
              let totalRating = 0;
              let totalCount = 0;

              if (emailKey && ratingMap[emailKey]) {
                  totalRating += ratingMap[emailKey].total;
                  totalCount += ratingMap[emailKey].count;
                  if (ratingMap[emailKey].photo && !photo) photo = ratingMap[emailKey].photo;
              }
              if (nameKey && nameKey !== emailKey && ratingMap[nameKey]) {
                  totalRating += ratingMap[nameKey].total;
                  totalCount += ratingMap[nameKey].count;
                  if (ratingMap[nameKey].photo && !photo) photo = ratingMap[nameKey].photo;
              }

              // Check by ID
              const idKey = f.id.toLowerCase();
              if (ratingMap[idKey]) {
                  totalRating += ratingMap[idKey].total;
                  totalCount += ratingMap[idKey].count;
                  if (ratingMap[idKey].photo && !photo) photo = ratingMap[idKey].photo;
              }
              
              if (totalCount > 0) {
                  avgRating = totalRating / totalCount;
                  ratingCount = totalCount;
              }

              mergedInstructors.push({
                  ...f,
                  instructorName: f.displayName || 'Unknown',
                  courses: [],
                  isRegistered: true,
                  avgRating,
                  ratingCount,
                  photo,
                  photoURL: photo,
                  profilePictureUrl: photo
              });
          }
      });

      return serializeFirestoreData(mergedInstructors);
    } catch (error) {
      console.error("Error fetching instructors:", error);
      // Return empty array instead of crashing
      return [];
    }
  },

  // Fetch Single Profile
  fetchInstructorProfile: async (instructorId, existingList = [], fallbackEmail = null) => {
      // 1. Get basic info
      let basicInfo = existingList.find(i => i.id === instructorId || i.email === instructorId);
      
      if (!basicInfo) {
          const userRef = doc(db, 'users', instructorId);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
              const data = userSnap.data();
              basicInfo = {
                  id: userSnap.id,
                  instructorName: data.displayName || data.name,
                  email: data.email,
                  department: data.department,
                  photo: data.photoURL || data.profilePictureUrl,
                  profilePictureUrl: data.profilePictureUrl || data.photoURL, // Ensure this is set
                  photoURL: data.photoURL || data.profilePictureUrl, // Ensure this is set
                  bio: data.bio,
                  role: data.role
              };
          }
      }

      if (!basicInfo) {
          basicInfo = { id: instructorId, instructorName: 'Unknown' };
      }
      
      // Use fallback email if basicInfo email is missing
      if (!basicInfo.email && fallbackEmail) {
          basicInfo.email = fallbackEmail;
      }

      // 2. Fetch Ratings/Feedbacks - Multi-strategy Fetching
      // Strategy A: By UID
      const qUid = query(collection(db, 'feedbacks'), where('instructorId', '==', instructorId));

      // Strategy B: By Email
      let qEmail = null;
      if (basicInfo.email) {
          qEmail = query(collection(db, 'feedbacks'), where('instructorId', '==', basicInfo.email.toLowerCase()));
      }
      // Strategy C: By Name (Case-Insensitive)
      let qNameLower = null;
      let qNameOriginal = null;
      let qPlaceholder = null;
      let qJsonName = null;

      // 1.1 Try to find match in JSON data to get the "Legacy ID" (Name) and Department
      let jsonMatch = null;
      let debugScanCount = 0;
      let debugFirstEmail = null;
      
      if (scheduleData && Array.isArray(scheduleData.schedule)) {
          for (const dept of scheduleData.schedule) {
              if (jsonMatch) break;
              if (Array.isArray(dept.courses)) {
                  for (const course of dept.courses) {
                      if (jsonMatch) break;
                      if (Array.isArray(course.instructor)) {
                          for (const inst of course.instructor) {
                              debugScanCount++;
                              if (!debugFirstEmail && inst.email) debugFirstEmail = inst.email;
                              
                              // Match by Email
                              if (basicInfo.email && inst.email && inst.email.toLowerCase().trim() === basicInfo.email.toLowerCase().trim()) {
                                  jsonMatch = { ...inst, department: dept.department };
                                  break;
                              }
                              // Match by Name (if basicInfo has a real name, not just email)
                              const currentName = basicInfo.instructorName || basicInfo.name;
                              if (currentName && !currentName.includes('@') && inst.name && inst.name.toLowerCase().trim() === currentName.toLowerCase().trim()) {
                                  jsonMatch = { ...inst, department: dept.department };
                                  break;
                              }
                          }
                      }
                  }
              }
          }
      }

      // If JSON match found, enrich basicInfo and add query
      if (jsonMatch) {
          // Enrich Profile
          if (!basicInfo.department) basicInfo.department = jsonMatch.department;
          if (basicInfo.instructorName && basicInfo.instructorName.includes('@')) basicInfo.instructorName = jsonMatch.name; // Fix email as name
          
          // Add Query for JSON Name
          if (jsonMatch.name) {
             qJsonName = query(
                collection(db, 'feedbacks'),
                where('instructorId', '==', jsonMatch.name)
             );
          }
      }

      if (basicInfo.instructorName || basicInfo.name) {
           const originalName = basicInfo.instructorName || basicInfo.name;
           const lowerName = originalName.toLowerCase();

           // 1. Lowercase match
           qNameLower = query(
              collection(db, 'feedbacks'),
              where('instructorId', '==', lowerName) 
           );

           // 2. Original case match (if different)
           if (originalName !== lowerName) {
               qNameOriginal = query(
                  collection(db, 'feedbacks'),
                  where('instructorId', '==', originalName)
               );
           }
           
           // Strategy D: Find placeholder user docs by name, then query feedbacks by those IDs
           qPlaceholder = query(
               collection(db, 'users'),
               where('displayName', '==', originalName),
               where('isRegistered', '==', false)
           );
      }

      const [snapUid, snapEmail, snapNameLower, snapNameOriginal, snapPlaceholderUsers, snapJsonName] = await Promise.all([
          getDocs(qUid),
          qEmail ? getDocs(qEmail) : Promise.resolve({ docs: [] }),
          qNameLower ? getDocs(qNameLower) : Promise.resolve({ docs: [] }),
          qNameOriginal ? getDocs(qNameOriginal) : Promise.resolve({ docs: [] }),
          qPlaceholder ? getDocs(qPlaceholder) : Promise.resolve({ docs: [] }),
          qJsonName ? getDocs(qJsonName) : Promise.resolve({ docs: [] })
      ]);

      // Fetch feedbacks for any found placeholder IDs
      let placeholderFeedbacks = [];
      if (!snapPlaceholderUsers.empty) {
          const placeholderIds = snapPlaceholderUsers.docs.map(d => d.id);
          const placeholderPromises = placeholderIds.map(pid => 
              getDocs(query(collection(db, 'feedbacks'), where('instructorId', '==', pid)))
          );
          const placeholderSnaps = await Promise.all(placeholderPromises);
          placeholderFeedbacks = placeholderSnaps.flatMap(s => s.docs);
      }

      const allDocs = [
          ...snapUid.docs,
          ...snapEmail.docs,
          ...snapNameLower.docs,
          ...snapNameOriginal.docs,
          ...placeholderFeedbacks,
          ...snapJsonName.docs
      ];

      // Deduplicate by ID
      const uniqueFeedbacksMap = new Map();
      allDocs.forEach(d => {
          if (!uniqueFeedbacksMap.has(d.id)) {
              uniqueFeedbacksMap.set(d.id, { id: d.id, ...d.data() });
          }
      });

      // Fetch missing student names
      const feedbacks = Array.from(uniqueFeedbacksMap.values());
      const studentIdsToFetch = new Set();
      feedbacks.forEach(f => {
          if (!f.studentName && f.studentId && !f.anonymous) {
              studentIdsToFetch.add(f.studentId);
          }
      });

      const studentMap = {};
      if (studentIdsToFetch.size > 0) {
          // Chunk requests if too many (Firestore limit is 10 for 'in', but we'll use getDoc for simplicity or Promise.all)
          // Since we might have many, let's use Promise.all with getDoc for each unique ID
          const ids = Array.from(studentIdsToFetch);
          const userPromises = ids.map(uid => getDoc(doc(db, 'users', uid)));
          const userSnaps = await Promise.all(userPromises);
          
          userSnaps.forEach(snap => {
              if (snap.exists()) {
                  const data = snap.data();
                  studentMap[snap.id] = {
                      name: data.displayName || data.name || 'Student',
                      photo: data.photoURL || data.profilePictureUrl || null
                  };
              }
          });
      }

      const ratings = feedbacks.map(data => {
          let sName = data.studentName;
          let sPhoto = data.studentPhoto;

          if (!sName && data.studentId && studentMap[data.studentId]) {
              sName = studentMap[data.studentId].name;
              sPhoto = studentMap[data.studentId].photo;
          }

          if (data.anonymous) {
              sName = 'Anonymous';
              sPhoto = null;
          }

          return {
              id: data.id,
              courseTitle: data.courseTitle,
              courseNo: data.courseId,
              rating: data.overall || data.rating || 0,
              feedback: data.feedback,
              timestamp: data.createdAt?.toMillis ? data.createdAt.toMillis() : Date.now(),
              tags: data.tags || [],
              likes: data.likes || 0,
              studentName: sName || 'Student',
              studentPhoto: sPhoto
          };
      });
      
      // Sort by timestamp desc
      ratings.sort((a, b) => b.timestamp - a.timestamp);

      // 3. Fetch Replies
      const repliesMap = {};
      for (const r of ratings) {
          try {
              const list = await fetchReplies(r.id);
              repliesMap[r.id] = list;
          } catch (_) {
              repliesMap[r.id] = [];
          }
      }

      // Calculate Average Rating from fetched ratings
      const totalRating = ratings.reduce((acc, r) => acc + (r.rating || 0), 0);
      const avgRating = ratings.length > 0 ? (totalRating / ratings.length).toFixed(1) : (basicInfo.avgRating || 0);

      return serializeFirestoreData({
          profile: { 
              ...basicInfo, 
              avgRating, 
              ratingCount: ratings.length,
              debugJsonMatch: !!jsonMatch,
              debugQueriedNames: [jsonMatch?.name, basicInfo.instructorName || basicInfo.name].filter(Boolean),
              debugScanCount,
              debugFirstEmail,
              debugBasicEmail: basicInfo.email
          },
          ratings,
          replies: repliesMap
      });
  }
};
