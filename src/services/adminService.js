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
          const recentStudents = studentSnap.docs.map(d => ({id: d.id, ...d.data()}));
          const recentInstructors = instSnap.docs.map(d => ({id: d.id, ...d.data()}));
          
          // Helper to combine strictly for the "Recent Users" table if it expects a mixed list
          // But ideally UI should separate them. For now, we return specific lists.
          const users = [...recentStudents, ...recentInstructors].sort((a,b) => b.createdAt - a.createdAt).slice(0, 20);

          const ratings = feedSnap.docs.map(d => ({id: d.id, ...d.data()}));
          const logs = logsSnap.docs.map(d => ({id: d.id, ...d.data()}));

          const stats = {
              totalStudents: studentCountSnap.data().count,
              totalInstructors: instCountSnap.data().count,
              totalRatings: feedCountSnap.data().count,
              flaggedCount: flaggedCountSnap.data().count
          };

          return { stats, users, ratings, logs };

      } catch (error) {
          console.error("Dashboard Load Failed:", error);
          // Fallback to empty values to prevent crash
          return { 
              stats: { totalStudents: 0, totalInstructors: 0, totalRatings: 0, flaggedCount: 0 }, 
              users: [], ratings: [], logs: [] 
          };
      }
  },

  // Log Action (Legacy Wrapper - Redirect to Audit Service)
  logAction: async (action, target, details, adminId) => {
     await auditService.logAction(adminId || 'system', action, target);
  },

  // Delete User
  deleteUser: async (uid) => {
      await deleteDoc(doc(db, 'users', uid));
      // Also attempt to delete from instructors to ensure consistency
      // (Even if it doesn't exist, this is safe)
      await deleteDoc(doc(db, 'instructors', uid));
      
      const actorId = auth.currentUser ? auth.currentUser.uid : 'system';
      await auditService.logAction(actorId, 'DELETE_USER', uid);
      
      return uid;
  },

  // Approve Instructor
  approveInstructor: async (uid) => {
      await updateDoc(doc(db, 'users', uid), { status: 'approved' });
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
      // Check if user already exists in 'users' by email? 
      // Ideally we should, but for now let's just create the doc.
      // We'll use addDoc, or setDoc if we want to enforce ID. 
      // Since we don't have the Auth UID yet, we'll use addDoc and let the system link later?
      // Actually, if we use addDoc, the ID will be random. When the user signs up, they get a new UID.
      // This creates a disconnect.
      // Strategy: We create a document with a specific ID? No.
      // Strategy: We create a document where the ID is the email? No, bad practice.
      // Strategy: We create a document with random ID, but store email. 
      // When user signs up, we need a Cloud Function to copy this data to the new UID doc?
      // OR, we just tell the admin: "This creates a placeholder. User must sign up."
      // Let's use addDoc for now, but mark it as 'pre-registered'.
      // Actually, the best way without Cloud Functions is:
      // Admin creates a doc. When user signs up, the app checks if a doc with this email exists?
      // Firestore queries are cheap.
      // Let's stick to: Admin creates a doc. We'll add a field 'isPreRegistered: true'.
      
      const docRef = await addDoc(collection(db, 'users'), {
          ...userData,
          createdAt: serverTimestamp(),
          isPreRegistered: true,
          status: 'active' // Default to active
      });
      return { id: docRef.id, ...userData };
  },

  // Update User Status (Ban, Suspend, Restrict)
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
      } else if (status === 'restricted') {
          updates.isRestricted = true;
          updates.restrictionDetails = details;
      } else if (status === 'active') {
          updates.isBanned = false;
          updates.isSuspended = false;
          updates.isRestricted = false;
      }

      await updateDoc(ref, updates);
      
      const actorId = auth.currentUser ? auth.currentUser.uid : 'system';
      await auditService.logAction(actorId, `UPDATE_STATUS_${status.toUpperCase()}`, uid);
      
      return { uid, status, details };
  },

  // Update User Profile
  updateUserProfile: async (uid, data) => {
      const ref = doc(db, 'users', uid);
      await updateDoc(ref, {
          ...data,
          updatedAt: serverTimestamp()
      });
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
               await addDoc(collection(db, 'instructors'), {
                  userId: uid,
                  email,
                  instructorName: userSnap.exists() ? (userSnap.data().displayName || email.split('@')[0]) : email.split('@')[0],
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
};
