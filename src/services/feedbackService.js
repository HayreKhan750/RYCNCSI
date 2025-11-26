import { db } from '../firebase';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  doc, 
  updateDoc, 
  serverTimestamp,
  getDoc,
  increment,
  deleteDoc,
  limit
} from 'firebase/firestore';

export const feedbackService = {
  // Fetch Feedbacks (Global or Filtered)
  fetchFeedbacks: async (filters = {}) => {
      let q = collection(db, 'feedbacks');
      // Note: Firestore requires composite indexes for complex queries.
      // We'll start simple and filter in memory if needed or add indexes.
      
      if (filters.instructorId) {
          q = query(q, where('instructorId', '==', filters.instructorId));
      } else if (filters.studentId) {
          q = query(q, where('studentId', '==', filters.studentId));
      } else {
          // Default to recent global feedbacks
          q = query(q, orderBy('createdAt', 'desc'));
      }

      if (filters.limit) {
          q = query(q, limit(filters.limit));
      }

      const snap = await getDocs(q);
      return snap.docs.map(d => ({
          id: d.id,
          ...d.data(),
          timestamp: d.data().createdAt?.toMillis ? d.data().createdAt.toMillis() : Date.now()
      }));
  },

  // Submit Feedback
  submitFeedback: async (feedbackData) => {
      const { instructorId, studentId, studentName, studentPhoto, courseId, rating, feedback, tags, anonymous } = feedbackData;
      
      // 1. Add Feedback Doc
      const docRef = await addDoc(collection(db, 'feedbacks'), {
          instructorId,
          studentId,
          studentName: anonymous ? 'Anonymous' : (studentName || 'Student'),
          studentPhoto: anonymous ? null : (studentPhoto || null),
          courseId,
          rating,
          overall: rating, // Legacy support
          feedback,
          tags: tags || [],
          anonymous: anonymous || false,
          createdAt: serverTimestamp(),
          likes: 0,
          replies: []
      });

      // 2. Update Instructor Stats (Optional: could be done via Cloud Function)
      // For now, we rely on re-fetching or optimistic updates.
      
      return { id: docRef.id, ...feedbackData };
  },

  // Fetch Replies for a Feedback
  fetchReplies: async (feedbackId) => {
      const q = query(
          collection(db, 'feedbacks', feedbackId, 'replies'), 
          orderBy('createdAt', 'asc')
      );
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ 
          id: d.id, 
          ...d.data(),
          // Ensure consistent field names if legacy data exists
          authorId: d.data().authorId || d.data().userId,
          authorName: d.data().authorName || d.data().userName
      }));
  },

  // Add Reply
  addReply: async (feedbackId, replyData) => {
      const { authorId, authorName, text, role } = replyData;
      const docRef = await addDoc(collection(db, 'feedbacks', feedbackId, 'replies'), {
          authorId,
          authorName,
          text,
          role,
          createdAt: serverTimestamp()
      });
      
      // Update reply count on parent feedback
      const feedbackRef = doc(db, 'feedbacks', feedbackId);
      await updateDoc(feedbackRef, {
          replyCount: increment(1)
      });

      // Return a client-friendly timestamp for immediate display
      return { id: docRef.id, ...replyData, createdAt: Date.now() };
  },

  // Delete Reply
  deleteReply: async (feedbackId, replyId) => {
      await deleteDoc(doc(db, 'feedbacks', feedbackId, 'replies', replyId));
      
      const feedbackRef = doc(db, 'feedbacks', feedbackId);
      await updateDoc(feedbackRef, {
          replyCount: increment(-1)
      });
      return { feedbackId, replyId };
  },

  // Like/Dislike Reply
  voteReply: async (feedbackId, replyId, type) => {
      const ref = doc(db, 'feedbacks', feedbackId, 'replies', replyId);
      // Simple increment for now
      if (type === 'like') {
          await updateDoc(ref, { likes: increment(1) });
      } else {
          await updateDoc(ref, { dislikes: increment(1) });
      }
      return { feedbackId, replyId, type };
  },

  // Vote/Like Feedback
  voteFeedback: async (feedbackId, userId) => {
      // Ideally we track votes in a subcollection to prevent duplicates
      // For simplicity, just increment for now
      const ref = doc(db, 'feedbacks', feedbackId);
      await updateDoc(ref, {
          likes: increment(1)
      });
  },

  // Delete Feedback
  deleteFeedback: async (feedbackId) => {
      await deleteDoc(doc(db, 'feedbacks', feedbackId));
      return feedbackId;
  },

  // Update Feedback (e.g. Soft Delete or Edit)
  updateFeedback: async (feedbackId, updates) => {
      const ref = doc(db, 'feedbacks', feedbackId);
      await updateDoc(ref, updates);
      return { id: feedbackId, ...updates };
  }
};
