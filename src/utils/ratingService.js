import { db } from '../firebase';
import { 
  collection, 
  doc, 
  addDoc, 
  setDoc,
  updateDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  serverTimestamp, 
  runTransaction,
  increment,
  arrayUnion,
  arrayRemove,
  limit
} from 'firebase/firestore';

const RATINGS_COLLECTION = 'feedbacks';
const INSTRUCTORS_COLLECTION = 'users';

/**
 * Helper to ensure instructor exists in Firestore (for unregistered instructors)
 */
export const ensureInstructorExists = async (instructorData) => {
  if (!instructorData.email && !instructorData.name) throw new Error("Instructor data missing");

  // Try to find by email first
  if (instructorData.email) {
      const q = query(collection(db, INSTRUCTORS_COLLECTION), where('email', '==', instructorData.email));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) return snapshot.docs[0].id;
  }

  // If not found, create a new "Unregistered" instructor
  const newInstructorRef = doc(collection(db, INSTRUCTORS_COLLECTION));
  await setDoc(newInstructorRef, {
      displayName: instructorData.name || 'Unknown Instructor',
      email: instructorData.email || null,
      department: instructorData.department || 'General',
      role: 'instructor',
      isRegistered: false,
      createdAt: new Date().toISOString(),
      photoURL: null,
      ratingCount: 0,
      averageRating: 0
  });

  return newInstructorRef.id;
};

/**
 * Submit a new rating or update an existing one.
 * Uses a transaction to ensure data consistency for aggregation.
 */
export const submitRating = async (instructorId, studentId, ratingData, existingRatingId = null) => {
  if (!instructorId || !studentId) throw new Error("Missing instructor or student ID");

  const ratingRef = existingRatingId 
    ? doc(db, RATINGS_COLLECTION, existingRatingId)
    : doc(collection(db, RATINGS_COLLECTION));

  const instructorRef = doc(db, INSTRUCTORS_COLLECTION, instructorId);

  try {
    await runTransaction(db, async (transaction) => {
      const instructorDoc = await transaction.get(instructorRef);
      if (!instructorDoc.exists()) throw new Error("Instructor not found");

      const instructorData = instructorDoc.data();
      const currentRatingCount = instructorData.ratingCount || 0;
      const currentTotalRating = instructorData.totalRatingSum || 0;

      let newRatingCount = currentRatingCount;
      let newTotalRating = currentTotalRating;

      // Extract rating value (support both rating and ratingValue)
      const newScore = ratingData.rating || ratingData.ratingValue || 0;

      if (existingRatingId) {
        // Updating existing rating
        const existingRatingDoc = await transaction.get(ratingRef);
        if (!existingRatingDoc.exists()) throw new Error("Rating not found");
        
        const oldData = existingRatingDoc.data();
        const oldScore = oldData.rating || oldData.ratingValue || 0;
        
        newTotalRating = currentTotalRating - oldScore + newScore;
      } else {
        // New rating
        newRatingCount += 1;
        newTotalRating += newScore;
      }

      const newAverageRating = newRatingCount > 0 ? newTotalRating / newRatingCount : 0;

      // Set rating document with standardized fields
      transaction.set(ratingRef, {
        instructorId,
        studentId,
        ...ratingData,
        rating: newScore, // Standardize on 'rating'
        ratingValue: newScore, // Keep for backward compatibility if needed
        instructorName: instructorData.displayName || 'Unknown Instructor', // Denormalize name
        deptName: instructorData.department || 'General', // Denormalize dept
        updatedAt: serverTimestamp(),
        ...(existingRatingId ? {} : { createdAt: serverTimestamp(), likes: 0, dislikes: 0, replies: [] })
      }, { merge: true });

      // Update instructor aggregation
      transaction.update(instructorRef, {
        ratingCount: newRatingCount,
        totalRatingSum: newTotalRating,
        averageRating: newAverageRating
      });
    });

    return ratingRef.id;
  } catch (error) {
    console.error("Error submitting rating:", error);
    throw error;
  }
};

/**
 * Fetch ratings for a specific instructor.
 */
export const getInstructorRatings = async (instructorId) => {
  try {
    const q = query(
      collection(db, RATINGS_COLLECTION),
      where("instructorId", "==", instructorId),
      orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching ratings:", error);
    return [];
  }
};

/**
 * Check if a student has already rated an instructor.
 */
export const getStudentRatingForInstructor = async (studentId, instructorId) => {
  try {
    const q = query(
      collection(db, RATINGS_COLLECTION),
      where("studentId", "==", studentId),
      where("instructorId", "==", instructorId),
      limit(1)
    );
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      return { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
    }
    return null;
  } catch (error) {
    console.error("Error checking student rating:", error);
    return null;
  }
};

/**
 * Toggle like on a review.
 */
export const toggleLikeReview = async (ratingId, userId, isLike = true) => {
  const ratingRef = doc(db, RATINGS_COLLECTION, ratingId);
  try {
    await updateDoc(ratingRef, {
      [isLike ? 'likes' : 'dislikes']: increment(1)
    });
  } catch (error) {
    console.error("Error toggling like:", error);
  }
};

/**
 * Add a reply to a review.
 */
export const replyToReview = async (ratingId, replyData) => {
  const ratingRef = doc(db, RATINGS_COLLECTION, ratingId);
  try {
    await updateDoc(ratingRef, {
      replies: arrayUnion({
        ...replyData,
        createdAt: new Date().toISOString()
      })
    });
  } catch (error) {
    console.error("Error replying to review:", error);
  }
};

// Placeholder functions for admin moderation (to avoid breaking imports if used elsewhere)
export const flagReview = async () => {};
export const deleteReview = async () => {};
export const markReviewAsReviewed = async () => {};
