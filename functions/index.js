const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

const db = admin.firestore();

/**
 * Helper to calculate and update instructor stats
 */
async function updateInstructorStats(instructorId) {
    if (!instructorId) return;

    // 1. Calculate Aggregates
    const q = db.collection("feedbacks").where("instructorId", "==", instructorId);
    const querySnap = await q.get();
    
    let total = 0;
    let count = 0;
    
    querySnap.forEach(doc => {
        const d = doc.data();
        // Only count non-deleted feedbacks if you have soft-delete
        if (d.deleted !== true) {
            total += (d.rating || d.overall || 0);
            count++;
        }
    });
    
    const avgRating = count > 0 ? Number((total / count).toFixed(1)) : 0;

    // 2. Find and Update User Doc
    // Strategy: Try to find by ID first, then email
    let userRef = db.collection('users').doc(instructorId);
    let userDoc = await userRef.get();

    if (!userDoc.exists && instructorId.includes('@')) {
        const usersSnap = await db.collection('users').where('email', '==', instructorId).limit(1).get();
        if (!usersSnap.empty) {
            userRef = usersSnap.docs[0].ref;
            userDoc = usersSnap.docs[0];
        }
    }

    if (userDoc.exists) {
        await userRef.update({ 
            rating: avgRating, 
            reviews: count,
            ratingCount: count, // Sync both fields for compatibility
            lastUpdated: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`Updated stats for ${instructorId}: ${avgRating} stars, ${count} reviews`);
    } else {
        console.log(`Instructor user doc not found for ${instructorId}, skipping update.`);
    }
}

// 1. Aggregate Ratings on New Feedback
exports.onFeedbackCreated = functions.firestore
  .document("feedbacks/{feedbackId}")
  .onCreate(async (snap, context) => {
    const data = snap.data();
    await updateInstructorStats(data.instructorId);
  });

// 2. Update Aggregates on Feedback Update (e.g. edit rating)
exports.onFeedbackUpdated = functions.firestore
  .document("feedbacks/{feedbackId}")
  .onUpdate(async (change, context) => {
    const newData = change.after.data();
    const oldData = change.before.data();

    // Only update if rating or deletion status changed
    if (newData.rating !== oldData.rating || newData.overall !== oldData.overall || newData.deleted !== oldData.deleted) {
        await updateInstructorStats(newData.instructorId);
    }
  });

// 3. Update Aggregates on Feedback Delete
exports.onFeedbackDeleted = functions.firestore
  .document("feedbacks/{feedbackId}")
  .onDelete(async (snap, context) => {
    const data = snap.data();
    await updateInstructorStats(data.instructorId);
  });

// 4. Maintain Reply Counts
exports.onReplyWritten = functions.firestore
  .document("feedbacks/{feedbackId}/replies/{replyId}")
  .onWrite(async (change, context) => {
      const feedbackId = context.params.feedbackId;
      const feedbackRef = db.collection('feedbacks').doc(feedbackId);
      
      // Count replies
      const repliesSnap = await feedbackRef.collection('replies').get();
      const count = repliesSnap.size;
      
      await feedbackRef.update({ 
          replyCount: count,
          hasReplies: count > 0 
      });
  });

// 5. Sanitize Feedback Text (Simple Example)
exports.sanitizeFeedback = functions.firestore
    .document("feedbacks/{feedbackId}")
    .onCreate(async (snap, context) => {
        const text = snap.data().feedback;
        if (text) {
            // Simple bad word filter example
            const badWords = ['badword1', 'badword2']; // Replace with real list
            let cleanText = text;
            let found = false;
            
            badWords.forEach(word => {
                const regex = new RegExp(word, 'gi');
                if (regex.test(cleanText)) {
                    cleanText = cleanText.replace(regex, '****');
                    found = true;
                }
            });

            if (found) {
                return snap.ref.update({ feedback: cleanText });
            }
        }
        return null;
    });

// 6. Sync User Role Changes (Audit Log / Denormalization)
exports.syncUserRoleChanges = functions.firestore
    .document("users/{userId}")
    .onUpdate(async (change, context) => {
        const newData = change.after.data();
        const oldData = change.before.data();

        if (newData.role !== oldData.role) {
            console.log(`User ${context.params.userId} changed role from ${oldData.role} to ${newData.role}`);
            // Future: Update custom claims or denormalized data in other collections
            // await admin.auth().setCustomUserClaims(context.params.userId, { role: newData.role });
        }
    });
