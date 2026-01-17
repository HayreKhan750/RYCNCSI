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
  deleteDoc,
  limit,
  startAfter,
  runTransaction,
  setDoc
} from 'firebase/firestore';
import { serializeFirestoreData } from '../utils/serialization';

export const feedbackService = {
  // Fetch Feedbacks
  fetchFeedbacks: async (filters = {}) => {
    try {
      let q = collection(db, 'feedbacks');
      const constraints = [];

      // 1. Filtering
      if (filters.instructorId) {
          constraints.push(where('instructorId', '==', filters.instructorId));
      } 
      if (filters.studentId) {
          constraints.push(where('studentId', '==', filters.studentId));
      }
      if (filters.deptName) {
           constraints.push(where('deptName', '==', filters.deptName));
      }
      if (filters.date) { // yyyy-mm
           const start = new Date(`${filters.date}-01`);
           const end = new Date(start);
           end.setMonth(end.getMonth() + 1);
           constraints.push(where('createdAt', '>=', start));
           constraints.push(where('createdAt', '<', end));
      }

      // 2. Sorting
      let sortField = 'createdAt';
      let sortDir = 'desc';
      
      if (filters.sort) {
          if (filters.sort === 'date_asc') { sortField = 'createdAt'; sortDir = 'asc'; }
          else if (filters.sort === 'rating_desc') { sortField = 'rating'; sortDir = 'desc'; } // Changed from 'overall' to 'rating'
          else if (filters.sort === 'rating_asc') { sortField = 'rating'; sortDir = 'asc'; }
      }
      constraints.push(orderBy(sortField, sortDir));

      // 3. Pagination
      if (filters.lastTimestamp) {
          const cursorDate = new Date(filters.lastTimestamp);
          constraints.push(startAfter(cursorDate));
      }

      // 4. Limit
      if (filters.limit) {
          constraints.push(limit(filters.limit));
      }

      const finalQuery = query(q, ...constraints);
      const snap = await getDocs(finalQuery);
      
      return snap.docs.map(d => serializeFirestoreData({
          id: d.id,
          ...d.data(),
          createdAt: d.data().createdAt?.toMillis ? d.data().createdAt.toMillis() : Date.now()
      }));

    } catch (error) {
      console.warn("Offline or Query Error:", error);
      return [];
    }
  },

  // Submit Feedback (Stripped of Side-Effects)
  submitFeedback: async (feedbackData) => {
      const { instructorId, studentId, studentName, studentPhoto, courseId, rating, feedback, tags, anonymous } = feedbackData;
      
      // 1. Add Feedback Doc (Strict Schema)
      // Note: We use addDoc which creates the ID.
      // Cloud Function will pick this up to update Instructor Stats.
      const docRef = await addDoc(collection(db, 'feedbacks'), {
          instructorId,
          studentId,
          courseId,
          rating,
          text: feedback,
          reviewText: feedback, // Verify Check Compliance
          cleanedText: feedback, // Placeholder
          tags: tags || [],
          
          anonymous: anonymous || false,
          isAnonymous: anonymous || false,

          // Initial Metrics (Server will update these)
          aiScore: null, 
          
          reactionCount: { like: 0, dislike: 0 },
          likesCount: 0, 
          dislikesCount: 0, 
          
          replyCount: 0,
          flagStatus: 'none', 
          
          createdAt: serverTimestamp(),
          
          // Legacy fields for display speed (denormalized)
          studentName: anonymous ? 'Anonymous' : (studentName || 'Student'), 
          studentPhoto: anonymous ? null : (studentPhoto || null),
      });

      // Strict Schema: Store feedbackId self-ref
      await updateDoc(docRef, { feedbackId: docRef.id });

      // No client-side stats updates.
      return { id: docRef.id, feedbackId: docRef.id, ...feedbackData, createdAt: Date.now() };
  },

  // Update Feedback
  updateFeedback: async (feedbackId, updates) => {
      const allowedUpdates = {};
      if (updates.rating !== undefined) allowedUpdates.rating = updates.rating;
      if (updates.feedback !== undefined) {
          allowedUpdates.text = updates.feedback;
          allowedUpdates.reviewText = updates.feedback;
      }
      if (updates.tags !== undefined) allowedUpdates.tags = updates.tags;
      
      if (Object.keys(allowedUpdates).length === 0) return;

      allowedUpdates.updatedAt = serverTimestamp();
      
      await updateDoc(doc(db, 'feedbacks', feedbackId), allowedUpdates);
      
      // Return serializable structure
      return { id: feedbackId, ...updates, updatedAt: Date.now() };
  },

  // Fetch Replies
  fetchReplies: async (feedbackId) => {
      const q = query(
          collection(db, 'replies'), // Top level collection?? No, architecture usually nests or links.
          // Reviewing other code: "collection(db, 'feedbacks', feedbackId, 'replies')" was used before?
          // BUT previous code used top-level 'replies' in addReply (Line 193) BUT logic in fetch was nested?
          // Wait, Line 193 in previous file: `collection(db, 'replies')` -> TOP LEVEL.
          // Line 216: `deleteDoc(doc(db, 'feedbacks', feedbackId, 'replies', replyId))` -> NESTED.
          // INCONSISTENCY FOUND.
          // Let's stick to Nested for sub-resources if possible, OR link.
          // However, Rules (Line 97) say: `match /replies/{replyId}` -> TOP LEVEL.
          // So I will use Top Level 'replies' with 'feedbackId' field.
          where('feedbackId', '==', feedbackId),
          orderBy('createdAt', 'asc')
      );
      
      const snap = await getDocs(q);
      return snap.docs.map(d => serializeFirestoreData({ 
          id: d.id, 
          ...d.data()
      }));
  },

  // Add Reply
  addReply: async (feedbackId, replyData) => {
      const { authorId, text, role } = replyData;
      
      if (role === 'student') {
          throw new Error("Unauthorized: Students cannot reply.");
      }

      // Add to 'replies' collection
      const docRef = await addDoc(collection(db, 'replies'), {
          feedbackId,
          authorId,
          text,
          createdAt: serverTimestamp(),
          role
      });
    
      await updateDoc(docRef, { replyId: docRef.id });

      // NOTE: We cannot update 'feedbacks.replyCount' here due to security rules.
      // Cloud Function 'onReplyCreated' must handle this.

      return { id: docRef.id, replyId: docRef.id, ...replyData, feedbackId, createdAt: Date.now() };
  },

  // Delete Reply
  deleteReply: async (feedbackId, replyId) => {
      // Must delete from top-level 'replies'
      await deleteDoc(doc(db, 'replies', replyId));
      // Cloud Function 'onReplyDeleted' handles stats decrement.
      return { feedbackId, replyId };
  },

  // Toggle Like/Dislike
  toggleLikeReview: async (feedbackId, userId, isLike) => {
      const type = isLike ? 'like' : 'dislike';
      
      // Transaction for Reaction State only
      return runTransaction(db, async (tx) => {
        const reactionId = `${feedbackId}_${userId}`;
        const reactionRef = doc(db, 'reactions', reactionId);
        
        const reactionSnap = await tx.get(reactionRef);
        const previousType = reactionSnap.exists() ? reactionSnap.data()?.type : null;

        if (previousType === type) {
          // Toggle Off
          tx.delete(reactionRef);
        } else {
          // Toggle On or Switch
          tx.set(reactionRef, {
            feedbackId,
            userId,
            type,
            createdAt: serverTimestamp(),
          });
        }
        
        // NO UPDATES TO FEEDBACK/STUDENT DOCS HERE.
        // Cloud Function 'onReactionWrite' must handle:
        // 1. feedback.reactionCount
        // 2. student.helpfulVotes
        
        return { 
            feedbackId, 
            userId, 
            isLike: previousType === type ? null : isLike 
        };
      });
  },

  // Flag Feedback
  flagFeedback: async ({ feedbackId, userId, reason, details, aiDetected = false }) => {
      const flagRef = await addDoc(collection(db, 'flags'), {
        feedbackId,
        flaggedBy: userId,
        reason,
        aiDetected: aiDetected || false,
        status: 'open',
        createdAt: serverTimestamp(),
        details: details || '' 
      });
      
      // NO UPDATE TO FEEDBACK DOC using client.
      // Cloud Function 'onFlagCreated' will set feedback.flagStatus = 'flagged'.
      
      return flagRef.id;
  },

  // User Data Fetchers (Read-only)
  fetchUserReactions: async (userId) => {
      if (!userId) return [];
      const q = query(collection(db, 'reactions'), where('userId', '==', userId));
      const snapshot = await getDocs(q);
      const reactions = {};
      snapshot.docs.forEach(d => {
          reactions[d.data().feedbackId] = d.data().type;
      });
      return reactions;
  },

  fetchUserFlags: async (userId) => {
      if (!userId) return [];
      const q = query(collection(db, 'flags'), where('flaggedBy', '==', userId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  // Helper: Fetch Top Reviewers (Safe Read)
  fetchTopReviewers: async (limitCount = 10) => {
      try {
        const q = query(collection(db, 'students'), orderBy('stats.reviewsCount', 'desc'), limit(limitCount));
        const snapshot = await getDocs(q);
        
        const students = snapshot.docs.map(d => {
             const data = d.data();
             return {
                 id: d.id,
                 studentId: d.id,
                 reviewCount: data.stats?.reviewsCount || 0,
                 helpfulCount: data.stats?.helpfulVotes || 0,
                 // We need to fetch basic info if not fully denormalized. 
                 // Assuming 'students' doc has minimal info, we might need 'users' doc for name/photo?
                 // Or we rely on 'users' having the data and 'students' just stats.
                 // Ideally, we fetch 'users' for these IDs.
             };
        });

        // Hydrate names from Users collection
        if (students.length > 0) {
            const hydrationPromises = students.map(async (s) => {
                 try {
                     const uSnap = await getDoc(doc(db, 'users', s.id));
                     if (uSnap.exists()) {
                         const uData = uSnap.data();
                         s.name = uData.displayName || 'Student';
                         s.photoURL = uData.photoURL || '';
                         s.department = uData.department || 'General';
                     } else {
                         s.name = 'Anonymous';
                     }
                 } catch(e) { s.name = 'Error'; }
                 return s;
            });
            await Promise.all(hydrationPromises);
        }
        
        return students;
      } catch (error) {
        console.error("Error fetching top reviewers:", error);
        return [];
      }
  }
};
