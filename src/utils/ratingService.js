import { db } from '../firebase';
import { 
  collection, 
  doc, 
  addDoc, 
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
  arrayRemove
} from 'firebase/firestore';

const RATINGS_COLLECTION = 'ratings';
const INSTRUCTORS_COLLECTION = 'users'; // Assuming instructors are in 'users' collection with role 'instructor'

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

      if (existingRatingId) {
        // Updating existing rating
        const existingRatingDoc = await transaction.get(ratingRef);
        if (!existingRatingDoc.exists()) throw new Error("Rating not found");
        
        const oldRatingValue = existingRatingDoc.data().ratingValue;
        newTotalRating = currentTotalRating - oldRatingValue + ratingData.ratingValue;
      } else {
        // New rating
        newRatingCount += 1;
        newTotalRating += ratingData.ratingValue;
      }

      const newAverageRating = newRatingCount > 0 ? newTotalRating / newRatingCount : 0;

      // Set rating document
      transaction.set(ratingRef, {
        instructorId,
        studentId,
        ...ratingData,
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
  // This is a simplified logic. In a real app, you'd track who liked what to prevent double liking.
  // For now, we just increment/decrement.
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
