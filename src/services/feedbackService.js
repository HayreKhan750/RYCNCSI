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
      // Force Server Fetch to ensure reaction counts are up-to-date
      // const snap = await getDocs(finalQuery); 
      // Using a basic getDocs usually attempts server, but we can try to be explicit if needed.
      // However, Firestore default is usually fine. Let's ensure we are not suppressing errors.
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
      
      // 0. Check for Duplicate Rating
      const q = query(collection(db, 'feedbacks'), 
          where('studentId', '==', studentId), 
          where('instructorId', '==', instructorId)
      );
      const existingSnap = await getDocs(q);
      
      if (!existingSnap.empty) {
          throw new Error("You have already rated this instructor. Please update your existing rating.");
      }

      // 1. Add Feedback Doc (Strict Schema + Compatibility)
      const docRef = await addDoc(collection(db, 'feedbacks'), {
          instructorId,
          studentId,
          courseId,
          
          rating,
          ratingValue: rating, // Compatibility
          
          text: feedback,
          reviewText: feedback, 
          cleanedText: feedback, 
          feedback: feedback, // Compatibility
          
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
      
      // Handle Rating Updates
      if (updates.rating !== undefined) {
          allowedUpdates.rating = updates.rating;
          allowedUpdates.ratingValue = updates.rating;
      } else if (updates.ratingValue !== undefined) {
          allowedUpdates.rating = updates.ratingValue;
          allowedUpdates.ratingValue = updates.ratingValue;
      }
      
      // Handle Text Updates
      if (updates.feedback !== undefined) {
          allowedUpdates.text = updates.feedback;
          allowedUpdates.reviewText = updates.feedback;
          allowedUpdates.feedback = updates.feedback;
      }
      
      if (updates.tags !== undefined) allowedUpdates.tags = updates.tags;
      
      if (Object.keys(allowedUpdates).length === 0) return;

      allowedUpdates.updatedAt = serverTimestamp();
      
      await updateDoc(doc(db, 'feedbacks', feedbackId), allowedUpdates);
      
      // Return serializable structure
      return { id: feedbackId, ...updates, updatedAt: Date.now() };
  },
  
  // Delete Feedback
  deleteFeedback: async (feedbackId) => {
      await deleteDoc(doc(db, 'feedbacks', feedbackId));
      return feedbackId;
  },

  // Fetch Replies
  fetchReplies: async (feedbackId) => {
      const q = query(
          collection(db, 'replies'),
          where('feedbackId', '==', feedbackId)
          // orderBy('createdAt', 'asc') // REMOVED to avoid Index Requirement
      );
      
      const snap = await getDocs(q);
      const entries = snap.docs.map(d => serializeFirestoreData({ 
          id: d.id, 
          ...d.data()
      }));

      // Client-side Sort
      return entries.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  },

  // Add Reply
  addReply: async (feedbackId, replyData) => {
      const { authorId, authorName, text, role } = replyData;
      
      // Add to 'replies' collection
      const docRef = await addDoc(collection(db, 'replies'), {
          feedbackId,
          authorId,
          authorName: authorName || 'Anonymous', // Persist the name!
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
      
      // Transaction for Reaction State + Feedback Counters
      return runTransaction(db, async (tx) => {
        const reactionId = `${feedbackId}_${userId}`;
        const reactionRef = doc(db, 'reactions', reactionId);
        const feedbackRef = doc(db, 'feedbacks', feedbackId);
        
        const reactionSnap = await tx.get(reactionRef);
        const feedbackSnap = await tx.get(feedbackRef);

        if (!feedbackSnap.exists()) {
            throw new Error("Feedback not found");
        }

        const previousType = reactionSnap.exists() ? reactionSnap.data()?.type : null;
        const currentData = feedbackSnap.data();
        
        // Initialize counters if missing
        let newLikes = currentData.likesCount || 0;
        let newDislikes = currentData.dislikesCount || 0;

        if (previousType === type) {
          // Toggle Off (Remove)
          tx.delete(reactionRef);
          if (type === 'like') newLikes = Math.max(0, newLikes - 1);
          else newDislikes = Math.max(0, newDislikes - 1);
        } else {
          // Add or Switch
          tx.set(reactionRef, {
            feedbackId,
            userId,
            type,
            createdAt: serverTimestamp(),
          });
          
          if (type === 'like') {
              newLikes++;
              if (previousType === 'dislike') newDislikes = Math.max(0, newDislikes - 1);
          } else {
              newDislikes++;
              if (previousType === 'like') newLikes = Math.max(0, newLikes - 1);
          }
        }
        
        // Update Feedback Doc directly (Client-Side Persistence)
        tx.update(feedbackRef, {
            likesCount: newLikes,
            dislikesCount: newDislikes,
            [`reactionCount.like`]: newLikes,
            [`reactionCount.dislike`]: newDislikes
        });
        
        return { 
            feedbackId, 
            userId, 
            isLike: previousType === type ? null : isLike,
            likesCount: newLikes,
            dislikesCount: newDislikes
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
          // Ensure we capture valid reactions
          const data = d.data();
          if (data && data.feedbackId && data.type) {
              reactions[data.feedbackId] = data.type;
          }
      });
      return reactions;
  },

  fetchUserFlags: async (userId) => {
      if (!userId) return [];
      const q = query(collection(db, 'flags'), where('flaggedBy', '==', userId));
      const snapshot = await getDocs(q);
      // Debug: console.log("Fetched user flags", snapshot.size);
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
                         s.photoURL = uData.photoURL || uData.profilePictureUrl || uData.photoUrl || '';
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
