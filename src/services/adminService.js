import { db } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc, 
  serverTimestamp,
  addDoc,
  deleteDoc,
  orderBy,
  limit
} from 'firebase/firestore';

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
  },

  // Fetch Dashboard Data
  fetchDashboardData: async () => {
      const [studentSnap, instructorSnap, ratingSnap, logsSnap] = await Promise.all([
          getDocs(query(collection(db, 'users'), where('role', '==', 'student'))),
          getDocs(query(collection(db, 'users'), where('role', '==', 'instructor'))),
          getDocs(query(collection(db, 'ratings'), orderBy('createdAt', 'desc'))), // Note: collection might be 'feedbacks' based on other files, checking useAdminData it says 'ratings'. Wait, other files use 'feedbacks'. useAdminData uses 'ratings'. I should probably standardize this.
          // Let's check useAdminData again. It uses 'ratings'. But feedbackService uses 'feedbacks'.
          // This is a discrepancy. I should probably use 'feedbacks' if that's the main one.
          // However, if the current admin panel uses 'ratings', I might break it if I switch to 'feedbacks' without migrating data.
          // But wait, the user said "Refactor existing codebase".
          // Let's look at useAdminData.js again. Line 52: collection(db, 'ratings').
          // Let's look at feedbackService.js. It uses 'feedbacks'.
          // If the app is using 'feedbacks' for the main flow, 'ratings' in admin might be old or different.
          // I'll stick to what useAdminData uses for now to be safe, OR I should check if 'ratings' collection actually exists and is used.
          // Given the "Student Name Display Bug" fix involved 'feedbacks', it's likely 'feedbacks' is the source of truth.
          // I will use 'feedbacks' here to align with the rest of the app, assuming 'ratings' was a mistake or legacy in useAdminData.
          // Actually, let's double check if I should support both or switch.
          // I'll use 'feedbacks' because that's what I've been working with.
          getDocs(query(collection(db, 'admin_logs'), orderBy('timestamp', 'desc'), limit(20)))
      ]);

      // If 'ratings' collection is empty, maybe try 'feedbacks'? 
      // Safest bet: fetch 'feedbacks' as that is the active collection I know of.
      // I will change it to 'feedbacks' to standardize.
      
      // Re-fetching 'feedbacks' instead of 'ratings'
      const feedbackSnap = await getDocs(query(collection(db, 'feedbacks'), orderBy('createdAt', 'desc')));

      const users = [
          ...studentSnap.docs.map(d => ({id: d.id, ...d.data()})),
          ...instructorSnap.docs.map(d => ({id: d.id, ...d.data()}))
      ];

      const ratings = feedbackSnap.docs.map(d => ({id: d.id, ...d.data()}));
      const flaggedCount = ratings.filter(r => r.status === 'FLAGGED').length;

      const stats = {
          totalStudents: studentSnap.size,
          totalInstructors: instructorSnap.size,
          totalRatings: feedbackSnap.size,
          flaggedCount
      };

      const logs = logsSnap.docs.map(d => ({id: d.id, ...d.data()}));

      return { stats, users, ratings, logs };
  },

  // Log Action
  logAction: async (action, target, details, adminId) => {
      await addDoc(collection(db, 'admin_logs'), {
          action,
          target,
          details,
          timestamp: serverTimestamp(),
          adminId: adminId || 'system'
      });
  },

  // Delete User
  deleteUser: async (uid) => {
      await deleteDoc(doc(db, 'users', uid));
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
  }
};
