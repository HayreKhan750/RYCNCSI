const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore();

// --- 1. AGGREGATION: Update Instructor Stats on New Feedback ---
exports.onFeedbackCreated = functions.firestore
    .document('feedbacks/{feedbackId}')
    .onCreate(async (snap, context) => {
        const feedback = snap.data();
        const instructorId = feedback.instructorId;
        const rating = feedback.rating || 0; 

        if (!instructorId) return null;

        const instructorRef = db.collection('instructors').doc(instructorId);

        try {
            await db.runTransaction(async (t) => {
                const doc = await t.get(instructorRef);
                if (!doc.exists) return; 

                const data = doc.data();
                const currentStats = data.ratingStats || { average: 0, totalRatings: 0, totalScore: 0 };
                
                // Calculate new stats
                const newCount = (currentStats.totalRatings || currentStats.count || 0) + 1;
                const newTotal = (currentStats.totalScore || currentStats.total || 0) + rating;
                const newAverage = newTotal / newCount;

                t.update(instructorRef, {
                    ratingStats: {
                        average: parseFloat(newAverage.toFixed(1)),
                        totalRatings: newCount,
                        totalScore: newTotal,
                        distribution: currentStats.distribution || {} 
                    },
                    lastReviewAt: admin.firestore.FieldValue.serverTimestamp()
                });
            });
        } catch (error) {
            console.error("Aggregation Failed:", error);
        }
    });

// --- 2. SECURITY: Auto-Assign Student Role on Creation ---
exports.onUserCreated = functions.firestore
    .document('users/{userId}')
    .onCreate(async (snap, context) => {
        const data = snap.data();
        // If role is missing, default to student
        if (!data.role) {
            return snap.ref.update({ role: 'student' });
        }
    });

// --- 3. MODERATION: AI Content Scan (Placeholder) ---
exports.onFeedbackModeration = functions.firestore
    .document('feedbacks/{feedbackId}')
    .onCreate(async (snap, context) => {
        const feedback = snap.data();
        const text = feedback.text || "";
        
        const badWords = ['badword1', 'badword2']; 
        const isToxic = badWords.some(w => text.toLowerCase().includes(w));

        if (isToxic) {
            return snap.ref.update({
                status: 'flagged',
                'aiAnalysis.toxicity': 0.9,
                'aiAnalysis.flagReason': 'Contains prohibited keywords'
            });
        }
    });

// --- 4. REACTIONS: Maintain Counters (Event-Driven) ---
exports.onReactionWrite = functions.firestore
    .document('reactions/{reactionId}')
    .onWrite(async (change, context) => {
        const after = change.after.exists ? change.after.data() : null;
        const before = change.before.exists ? change.before.data() : null;
        
        const feedbackId = after ? after.feedbackId : before.feedbackId;
        if (!feedbackId) return;

        const feedbackRef = db.collection('feedbacks').doc(feedbackId);

        // Delta for Likes/Dislikes
        let likeChange = 0;
        let dislikeChange = 0;

        if (!before && after) {
            // Created
            if (after.type === 'like') likeChange = 1;
            else dislikeChange = 1;
        } else if (before && !after) {
            // Deleted
            if (before.type === 'like') likeChange = -1;
            else dislikeChange = -1;
        } else {
            // Updated (Switched vote)
            if (before.type === after.type) return; // No change
            
            if (after.type === 'like') {
                likeChange = 1;
                dislikeChange = -1; 
            } else {
                likeChange = -1; 
                dislikeChange = 1;
            }
        }

        try {
            await feedbackRef.update({
                'reactionCount.like': admin.firestore.FieldValue.increment(likeChange),
                'reactionCount.dislike': admin.firestore.FieldValue.increment(dislikeChange),
                // Legacy fields if needed
                likes: admin.firestore.FieldValue.increment(likeChange),
                dislikes: admin.firestore.FieldValue.increment(dislikeChange)
            });
        } catch (err) {
            console.error("Counter update failed:", err);
        }

        // --- Update Student Helpful Votes (Reviewer Stats) ---
        if (likeChange !== 0 && feedbackId) {
            try {
                 const feedbackSnap = await feedbackRef.get();
                 if (feedbackSnap.exists) {
                     const authorId = feedbackSnap.data().studentId;
                     if (authorId) {
                         const studentRef = db.collection('students').doc(authorId);
                         await studentRef.update({
                             'stats.helpfulVotes': admin.firestore.FieldValue.increment(likeChange)
                         });
                     }
                 }
            } catch (error) {
                console.error("Student stats update failed:", error);
            }
        }
    });

// --- 5. REPLIES: Update Engagement Score ---
exports.onReplyCreated = functions.firestore
    .document('replies/{replyId}')
    .onCreate(async (snap, context) => {
        const reply = snap.data();
        const authorId = reply.authorId;
        
        // Only count instructor replies for engagement score
        // We check if author exists in 'instructors' collection
        const instructorRef = db.collection('instructors').doc(authorId);
        const instructorSnap = await instructorRef.get();
        
        if (instructorSnap.exists) {
             // Increment engagement score
             await instructorRef.update({
                 engagementScore: admin.firestore.FieldValue.increment(5) // Weighted score
             });
        }
    });

// --- 6. USER DELETION: Cascade Soft-Delete ---
exports.onUserDeleted = functions.firestore
    .document('users/{userId}')
    .onDelete(async (snap, context) => {
        const userId = context.params.userId;
        
        // 1. Soft Delete Feedbacks
        const feedbacksQuery = db.collection('feedbacks').where('studentId', '==', userId);
        const feedbacksSnap = await feedbacksQuery.get();
        
        const batch = db.batch();
        feedbacksSnap.forEach(doc => {
            batch.update(doc.ref, { 
                status: 'archived',
                studentName: 'Deleted User',
                isAnonymous: true
            });
        });
        
        // 2. Soft Delete Student Profile (if separate)
        const studentRef = db.collection('students').doc(userId);
        batch.delete(studentRef); // Or soft delete
        
        await batch.commit();
    });
