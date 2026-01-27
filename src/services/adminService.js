import { db } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs,
  getDoc,
  setDoc, 
  doc, 
  updateDoc, 
  serverTimestamp,
  addDoc,
  deleteDoc,
  orderBy,
  limit,
  getCountFromServer,
} from 'firebase/firestore';
import { auth } from '../firebase'; // Import auth for Actor ID
import { auditService } from './auditService';

export const adminService = {
  // Fetch Reports
  fetchReports: async (status = 'pending') => {
      const q = query(collection(db, 'reports'), where('status', '==', status));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  // Resolve Report
  resolveReport: async (reportId, resolution) => {
      const ref = doc(db, 'reports', reportId);
      await updateDoc(ref, {
          status: 'resolved',
          resolution,
          resolvedAt: serverTimestamp()
      });
      
      const actorId = auth.currentUser ? auth.currentUser.uid : 'system';
      await auditService.logAction(actorId, 'RESOLVE_REPORT', reportId);
      
      return { id: reportId, status: 'resolved', resolution };
  },

  // Ban User
  banUser: async (userId, reason) => {
      const ref = doc(db, 'users', userId);
      await updateDoc(ref, {
          isBanned: true,
          banReason: reason,
          bannedAt: serverTimestamp()
      });
      
      const actorId = auth.currentUser ? auth.currentUser.uid : 'system';
      await auditService.logAction(actorId, 'BAN_USER', userId);
  },

  // Fetch Dashboard Data (Enterprise Optimized)
  fetchDashboardData: async () => {
      // 1. Definition of Queries
      const usersRef = collection(db, 'users');
      const instRef = collection(db, 'instructors');
      const feedRef = collection(db, 'feedbacks');
      const logsRef = collection(db, 'audit_logs');

      // 2. Count Queries (Metadata Only - Fast)
      const countPromises = [
          getCountFromServer(query(usersRef, where('role', '==', 'student'))),
          getCountFromServer(instRef),
          getCountFromServer(feedRef),
          getCountFromServer(query(feedRef, where('status', '==', 'flagged')))
      ];

      // 3. Data Queries (Content - Paginatable Limits)
      const dataPromises = [
          getDocs(query(usersRef, where('role', '==', 'student'), limit(20))), // Removed orderBy to bypass Index Lock
          getDocs(query(instRef, orderBy('createdAt', 'desc'), limit(20))), // Assuming instructors have createdAt
          getDocs(query(feedRef, orderBy('createdAt', 'desc'), limit(20))),
          getDocs(query(logsRef, orderBy('timestamp', 'desc'), limit(20)))
      ];

      try {
          // Execute all in parallel
          const [
             studentCountSnap, instCountSnap, feedCountSnap, flaggedCountSnap
          ] = await Promise.all(countPromises);
          
          const [
             studentSnap, instSnap, feedSnap, logsSnap
          ] = await Promise.all(dataPromises);


          // 4. Serialize Data
          // Use optional chaining for safety if fetch failed/returned empty
          const recentStudents = studentSnap?.docs?.map(d => ({id: d.id, ...d.data()})) || [];
          
          // CRITICAL FIX: Use userId as the primary ID for instructors to ensure Actions (Edit/Delete) target the User UID, not the Instructor Doc ID
          const recentInstructors = instSnap?.docs?.map(d => {
             const data = d.data();
             return {
                 id: data.userId || d.id, // Prefer userId (UID), fallback to doc ID
                 instructorDocId: d.id,
                 ...data, 
                 role: 'instructor'
             };
          }) || [];
          
          const users = [...recentStudents, ...recentInstructors].sort((a,b) => b.createdAt - a.createdAt).slice(0, 20);

          const ratings = feedSnap?.docs?.map(d => ({id: d.id, ...d.data()})) || [];
          const logs = logsSnap?.docs?.map(d => ({id: d.id, ...d.data()})) || [];

          // Calculate Global Avg Rating
          const validRatings = ratings.map(r => Number(r.rating || r.ratingValue || 0)).filter(r => r > 0);
          const globalAvg = validRatings.length > 0 ? (validRatings.reduce((a,b) => a+b, 0) / validRatings.length).toFixed(1) : "0.0";
          
          const uniqueDepts = new Set(recentInstructors.map(i => i.department || i.deptName || i.departmentId).filter(Boolean));

          const stats = {
              totalStudents: studentCountSnap?.data()?.count || 0,
              totalInstructors: instCountSnap?.data()?.count || 0,
              totalRatings: feedCountSnap?.data()?.count || 0,
              flaggedCount: flaggedCountSnap?.data()?.count || 0,
              averageRating: globalAvg,
              totalDepartments: uniqueDepts.size
          };

          return { stats, users, ratings, logs };

      } catch (error) {
          console.error("Dashboard Load Failed:", error);
          return { 
              stats: { totalStudents: 0, totalInstructors: 0, totalRatings: 0, flaggedCount: 0, averageRating: "0.0", totalDepartments: 0 }, 
              users: [], ratings: [], logs: [] 
          };
      }
  },
  
  // Update System Settings
  updateSystemSettings: async (settings) => {
      const ref = doc(db, 'system_settings', 'general');
      await setDoc(ref, { 
          ...settings, 
          updatedAt: serverTimestamp() 
      }, { merge: true });
      
      const actorId = auth.currentUser ? auth.currentUser.uid : 'system';
      await auditService.logAction(actorId, 'UPDATE_SETTINGS', 'general');
      return settings;
  },

  // Fetch System Settings
  fetchSystemSettings: async () => {
      const ref = doc(db, 'system_settings', 'general');
      const snap = await getDoc(ref);
      return snap.exists() ? snap.data() : {};
  },

  // Log Action (Legacy Wrapper - Redirect to Audit Service)
  logAction: async (action, target, details, adminId) => {
     await auditService.logAction(adminId || 'system', action, target);
  },

  // Delete User
  deleteUser: async (uid) => {
      await deleteDoc(doc(db, 'users', uid));
      
      // Fix: Query instructor doc by userId instead of assuming ID match
      const instQ = query(collection(db, 'instructors'), where('userId', '==', uid));
      const instSnap = await getDocs(instQ);
      instSnap.forEach(async (d) => {
          await deleteDoc(d.ref);
      });
      
      const actorId = auth.currentUser ? auth.currentUser.uid : 'system';
      await auditService.logAction(actorId, 'DELETE_USER', uid);
      
      return uid;
  },

  // Approve Instructor
  approveInstructor: async (uid) => {
      await updateDoc(doc(db, 'users', uid), { status: 'approved' });
      
      // Sync status to instructor doc if it exists
      const instQ = query(collection(db, 'instructors'), where('userId', '==', uid));
      const instSnap = await getDocs(instQ);
      instSnap.forEach(async (d) => {
          await updateDoc(d.ref, { status: 'approved' });
      });

      return uid;
  },

  // Delete Rating
  deleteRating: async (id) => {
      // Using 'feedbacks' collection
      await deleteDoc(doc(db, 'feedbacks', id));
      
      const actorId = auth.currentUser ? auth.currentUser.uid : 'system';
      await auditService.logAction(actorId, 'DELETE_RATING', id);
      
      return id;
  },

  // Update Rating Status
  updateRatingStatus: async (id, status) => {
      await updateDoc(doc(db, 'feedbacks', id), { status });
      return { id, status };
  },

  // Create Report
  createReport: async (reportData) => {
      const docRef = await addDoc(collection(db, 'reports'), {
          ...reportData,
          status: 'pending',
          createdAt: serverTimestamp()
      });
      return { id: docRef.id, ...reportData };
  },

  // Register User (Firestore Profile)
  registerUser: async (userData) => {
      const docRef = await addDoc(collection(db, 'users'), {
          ...userData,
          createdAt: serverTimestamp(),
          isPreRegistered: true,
          status: 'active' 
      });
      
      // If Instructor, create the instructor node immediately too
      if (userData.role === 'instructor') {
         await addDoc(collection(db, 'instructors'), {
            userId: docRef.id, // Link to the new user doc
            email: userData.email,
            fullName: userData.name,
            displayName: userData.name,
            department: userData.department || 'General',
            departmentId: (userData.department || 'general').toLowerCase().replace(/\s+/g, ''),
            bio: userData.bio || '',
            createdAt: serverTimestamp(),
            status: 'pending'
         });
      }

      return { id: docRef.id, ...userData };
  },

  // Update User Status (Ban, Suspend)
  updateUserStatus: async (uid, status, details) => {
      const ref = doc(db, 'users', uid);
      const updates = { status };
      
      if (status === 'banned') {
          updates.isBanned = true;
          updates.banReason = details;
          updates.bannedAt = serverTimestamp();
      } else if (status === 'suspended') {
          updates.isSuspended = true;
          updates.suspendReason = details;
          updates.suspendedAt = serverTimestamp();
      } else if (status === 'active') {
          updates.isBanned = false;
          updates.isSuspended = false;
      }

      await updateDoc(ref, updates);
      
      // Sync to instructor if applicable
      const instQ = query(collection(db, 'instructors'), where('userId', '==', uid));
      const instSnap = await getDocs(instQ);
      instSnap.forEach(async (d) => {
          await updateDoc(d.ref, { status });
      });

      const actorId = auth.currentUser ? auth.currentUser.uid : 'system';
      await auditService.logAction(actorId, `UPDATE_STATUS_${status.toUpperCase()}`, uid);
      
      return { uid, status, details };
  },

  // Update User Profile (Edit Modal) - Robust Multi-Path Update
  updateUserProfile: async (uid, data) => {
      // Data to update
      const updates = { ...data, updatedAt: serverTimestamp() };
      
      // Instructor-specific fields map
      const instUpdates = {};
      if (data.name) {
          instUpdates.fullName = data.name;
          instUpdates.displayName = data.name;
          instUpdates.instructorName = data.name; 
      }
      if (data.department) instUpdates.department = data.department;
      if (data.bio) instUpdates.bio = data.bio;
      if (data.status) instUpdates.status = data.status; // Ensure status syncs if passed

      const promises = [];

      // Path 1: Treat uid as User ID (Standard)
      const userRef = doc(db, 'users', uid);
      // We use setDoc with merge because updateDoc fails if doc doesn't exist. 
      // This covers the case where 'users' doc is missing but we want to patch it.
      promises.push(setDoc(userRef, updates, { merge: true }));

      // Path 2: Treat uid as Instructor Doc ID (Fallback for orphans)
      if (Object.keys(instUpdates).length > 0) {
          const directInstRef = doc(db, 'instructors', uid);
          // Try updating directly in case uid IS the instructor doc id
          promises.push(updateDoc(directInstRef, instUpdates).catch(() => {
              // Ignore error if this doc doesn't exist (means uid wasn't an instructor ID)
          }));
      }

      // Path 3: Treat uid as User ID and find linked Instructors (Sync)
      if (Object.keys(instUpdates).length > 0) {
           const instQ = query(collection(db, 'instructors'), where('userId', '==', uid));
           const instSyncPromise = getDocs(instQ).then(snap => {
               snap.forEach(d => {
                   updateDoc(d.ref, instUpdates);
               });
           });
           promises.push(instSyncPromise);
      }

      await Promise.all(promises);
      
      return { uid, ...data };
  },
  // Grant Role (Admin/Instructor)
  grantRole: async (uid, role, email) => {
      // 1. Update Core User Doc
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
          // Create if missing (Safety net for legacy/glitched users)
           await setDoc(userRef, {
              uid,
              email,
              role,
              createdAt: serverTimestamp(),
              isRegistered: true 
          });
      } else {
          await updateDoc(userRef, { role });
      }

      // 2. Role Specific Updates
      if (role === 'admin') {
          // Nothing extra needed for Admin usually, just the role claim/field
      } else if (role === 'instructor') {
          // Ensure they exist in 'instructors' collection
          const instQ = query(collection(db, 'instructors'), where('userId', '==', uid));
          const instSnap = await getDocs(instQ);
          
          if (instSnap.empty) {
              // initialize placeholder instructor profile
               const baseName = userSnap.exists() ? (userSnap.data().displayName || email.split('@')[0]) : email.split('@')[0];
               await addDoc(collection(db, 'instructors'), {
                  userId: uid,
                  email,
                  
                  // Standardized Name Fields (Cover all cases)
                  fullName: baseName,
                  displayName: baseName,
                  instructorName: baseName,
                  name: baseName,

                  // Standardized Image Fields
                  photoURL: userSnap.exists() ? userSnap.data().photoURL : null,
                  profilePictureUrl: userSnap.exists() ? userSnap.data().photoURL : null,

                  // Standardized Department
                  department: 'General',
                  departmentId: 'general',

                  bio: 'New Instructor',
                  courses: [],
                  stats: { rating: 0, totalReviews: 0 },
                  createdAt: serverTimestamp()
              });
          }
      }


      
      const actorId = auth.currentUser ? auth.currentUser.uid : 'system';
      await auditService.logAction(actorId, `GRANT_ROLE_${role.toUpperCase()}`, uid);

      return { uid, role };
  },
  // Perform Deep Scan & Fix (Self-Healing)
  performDeepScanAndFix: async () => {
      const report = {
          scanned: 0,
          fixed: 0,
          details: []
      };

      try {
          // Fetch ALL instructors
          const instRef = collection(db, 'instructors');
          const snap = await getDocs(instRef);
          report.scanned = snap.size;

          const batchUpdates = [];

          for (const docSnap of snap.docs) {
              const data = docSnap.data();
              let needsFix = false;
              const updates = {};
              
              // 1. Name Standardization
              // Goal: fullName, instructorName, displayName, name should all exist and match
              const masterName = data.fullName || data.instructorName || data.displayName || data.name || 'Unknown Instructor';
              
              if (data.fullName !== masterName) { updates.fullName = masterName; needsFix = true; }
              if (data.instructorName !== masterName) { updates.instructorName = masterName; needsFix = true; }
              if (data.displayName !== masterName) { updates.displayName = masterName; needsFix = true; }
              if (data.name !== masterName) { updates.name = masterName; needsFix = true; }

              // 2. Department Standardization
              // Goal: departmentId and department should exist
              const masterDept = data.department || data.departmentId || 'General';
              let masterDeptId = data.departmentId || data.department || 'general';
              // Normalize ID to lowercase/no-spaces if possible, but for now just ensure they sync
              
              if (data.department !== masterDept) { updates.department = masterDept; needsFix = true; }
              if (data.departmentId !== masterDeptId) { updates.departmentId = masterDeptId; needsFix = true; }

              // 3. Image Standardization
              const masterPhoto = data.profilePictureUrl || data.photoURL || '';
              if (data.profilePictureUrl !== masterPhoto) { updates.profilePictureUrl = masterPhoto; needsFix = true; }
              if (data.photoURL !== masterPhoto) { updates.photoURL = masterPhoto; needsFix = true; }

              if (needsFix) {
                  updates.updatedAt = serverTimestamp();
                  updates.lastDeepScan = serverTimestamp(); // Mark as scanned
                  
                  // Perform Update
                  await updateDoc(docSnap.ref, updates);
                  
                  report.fixed++;
                  report.details.push(`Fixed ${masterName}: Added missing aliases/synced fields.`);
              }
          }
          
          return report;

      } catch (e) {
          console.error("Deep Scan Failed:", e);
          throw e;
      }
  },
};
