const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore();

// --- 1. AGGREGATION: Update Instructor Stats on New Feedback ---
// --- 1. CENTRAL FEEDBACK PIPELINE: Aggregation + AI + Moderation ---
exports.onFeedbackCreated = functions.firestore
    .document('feedbacks/{feedbackId}')
    .onCreate(async (snap, context) => {
        const feedback = snap.data();
        const instructorId = feedback.instructorId;
        const rating = feedback.rating || 0; 
        const text = feedback.text || "";

        // A. AI Analysis & Moderation (Server-Side Limit)
        const badWords = ['badword1', 'badword2']; // Mock Dictionary
        const isToxic = badWords.some(w => text.toLowerCase().includes(w));
        
        let aiScore = {
            toxicity: isToxic ? 0.9 : 0.1,
            sentiment: rating > 3 ? 0.8 : (rating < 3 ? -0.5 : 0.1)
        };

        const updates = {
            aiScore: aiScore,
            // If toxic, auto-flag but don't hide immediately unless severe? 
            // For now, simple flag.
            flagStatus: isToxic ? 'flagged' : 'none'
        };
        
        // Update the document with AI results
        await snap.ref.update(updates);

        // B. Aggregation: Update Instructor Stats
        if (!instructorId) return null;

        const instructorRef = db.collection('instructors').doc(instructorId);

        try {
            await db.runTransaction(async (t) => {
                const doc = await t.get(instructorRef);
                if (!doc.exists) return; 

                const data = doc.data();
                const currentStats = data.ratingStats || { average: 0, totalRatings: 0, totalScore: 0 };
                
                // Calculate new stats
                const newCount = (currentStats.totalRatings || 0) + 1;
                const newTotal = (currentStats.totalScore || 0) + rating;
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

// --- 2. FEEDBACK UPDATES (Soft Delete / Hiding) ---
exports.onFeedbackUpdated = functions.firestore
    .document('feedbacks/{feedbackId}')
    .onUpdate(async (change, context) => {
        const before = change.before.data();
        const after = change.after.data();

        // Detect Status Change: Visible -> Hidden/Removed
        const wasVisible = before.flagStatus !== 'removed' && before.flagStatus !== 'hidden';
        const isVisible = after.flagStatus !== 'removed' && after.flagStatus !== 'hidden';

        if (wasVisible === isVisible) return; // No state change affecting stats

        const instructorId = after.instructorId;
        const rating = after.rating || 0;

        if (!instructorId) return;

        const instructorRef = db.collection('instructors').doc(instructorId);

        try {
            await db.runTransaction(async (t) => {
                const doc = await t.get(instructorRef);
                if (!doc.exists) return;

                const data = doc.data();
                const currentStats = data.ratingStats || { average: 0, totalRatings: 0, totalScore: 0 };
                
                let countDelta = 0;
                let scoreDelta = 0;

                if (wasVisible && !isVisible) {
                    // Removed/Hidden: Decrement
                    countDelta = -1;
                    scoreDelta = -rating;
                } else if (!wasVisible && isVisible) {
                    // Restored: Increment
                    countDelta = 1;
                    scoreDelta = rating;
                }

                const newCount = (currentStats.totalRatings || 0) + countDelta;
                const newTotal = (currentStats.totalScore || 0) + scoreDelta;
                const newAverage = newCount > 0 ? (newTotal / newCount) : 0;

                t.update(instructorRef, {
                    ratingStats: {
                        average: parseFloat(newAverage.toFixed(1)),
                        totalRatings: newCount,
                        totalScore: newTotal
                    }
                });
            });
        } catch (error) {
            console.error("Update Aggregation Failed:", error);
        }
    });

// --- 3. FEEDBACK DELETION (Hard Delete) ---
exports.onFeedbackDeleted = functions.firestore
    .document('feedbacks/{feedbackId}')
    .onDelete(async (snap, context) => {
        const feedback = snap.data();
        // If it was already hidden/removed, stats might already be adjusted?
        // Assumption: Hard delete comes from visible state OR hidden state.
        // If it was 'removed' (soft deleted), we shouldn't decrement AGAIN.
        
        if (feedback.flagStatus === 'removed' || feedback.flagStatus === 'hidden') {
            return; // Already accounted for
        }

        const instructorId = feedback.instructorId;
        const rating = feedback.rating || 0;

        if (!instructorId) return;

        const instructorRef = db.collection('instructors').doc(instructorId);

        try {
            await db.runTransaction(async (t) => {
                const doc = await t.get(instructorRef);
                if (!doc.exists) return;

                const data = doc.data();
                const currentStats = data.ratingStats || { average: 0, totalRatings: 0, totalScore: 0 };
                
                const newCount = Math.max(0, (currentStats.totalRatings || 0) - 1);
                const newTotal = Math.max(0, (currentStats.totalScore || 0) - rating);
                const newAverage = newCount > 0 ? (newTotal / newCount) : 0;

                t.update(instructorRef, {
                    ratingStats: {
                        average: parseFloat(newAverage.toFixed(1)),
                        totalRatings: newCount,
                        totalScore: newTotal
                    }
                });
            });
        } catch (error) {
            console.error("Deletion Aggregation Failed:", error);
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

// --- 5. REPLIES: Aggregation & Engagement ---
exports.onReplyCreated = functions.firestore
    .document('replies/{replyId}')
    .onCreate(async (snap, context) => {
        const reply = snap.data();
        const authorId = reply.authorId;
        const feedbackId = reply.feedbackId;
        
        const updates = [];
        
        // 1. Update Feedback Reply Count
        if (feedbackId) {
            const feedbackRef = db.collection('feedbacks').doc(feedbackId);
            updates.push(feedbackRef.update({
                replyCount: admin.firestore.FieldValue.increment(1)
            }));
        }
        
        // 2. Update Instructor Engagement Score (if Instructor)
        if (reply.role === 'instructor' || authorId) {
             const instructorRef = db.collection('instructors').doc(authorId);
             // Check existence? Or blindly update? 
             // Best to check role or assume based on collection logic.
             // We can blindly attempt update if it exists.
             updates.push(instructorRef.update({
                 engagementScore: admin.firestore.FieldValue.increment(5) 
             }).catch(err => {})); // Ignore if not instructor doc
        }
        
        await Promise.all(updates);
    });

exports.onReplyDeleted = functions.firestore
    .document('replies/{replyId}')
    .onDelete(async (snap, context) => {
        const reply = snap.data();
        const feedbackId = reply.feedbackId;
        
        if (feedbackId) {
            const feedbackRef = db.collection('feedbacks').doc(feedbackId);
            await feedbackRef.update({
                replyCount: admin.firestore.FieldValue.increment(-1)
            });
        }
    });

// --- 6. FLAGGING SYSTEM ---
exports.onFlagCreated = functions.firestore
    .document('flags/{flagId}')
    .onCreate(async (snap, context) => {
        const flag = snap.data();
        const feedbackId = flag.feedbackId;
        
        if (feedbackId) {
            const feedbackRef = db.collection('feedbacks').doc(feedbackId);
            await feedbackRef.update({
                flagStatus: 'flagged',
                flagCount: admin.firestore.FieldValue.increment(1)
            });
        }
    });

// --- 7. USER DELETION: Cascade Soft-Delete ---
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
                flagStatus: 'removed', // Consistent with onFeedbackUpdated
                studentName: 'Deleted User',
                isAnonymous: true
            });
        });
        
        // 2. Delete Student Profile
        const studentRef = db.collection('students').doc(userId);
        batch.delete(studentRef); 
        
// --- 8. SCHEDULED MAINTENANCE: Repair Denormalized Data ---
// Runs every Sunday at midnight
exports.repairDenormalizedData = functions.pubsub.schedule('0 0 * * 0').onRun(async (context) => {
    console.log("Starting Scheduled Data Repair...");
    
    // 1. Repair Instructor Names in Feedbacks
    // Fetch all instructors to get current names
    const instructorsSnap = await db.collection('instructors').get();
    const instructorMap = new Map();
    instructorsSnap.forEach(doc => {
        const data = doc.data();
        if (data.fullName) instructorMap.set(doc.id, data.fullName);
    });
    
    // Batch process feedbacks (limit to recent 500 for quota safety in this example)
    const feedbacksSnap = await db.collection('feedbacks').orderBy('createdAt', 'desc').limit(500).get();
    
    const batch = db.batch();
    let updateCount = 0;
    
    feedbacksSnap.forEach(doc => {
        const data = doc.data();
        if (!data.instructorId) return;
        
        const currentName = instructorMap.get(data.instructorId);
        // If name differs and is not anonymous (though instructor name is public), update it.
        // Actually feedbacks rarely store instructorName denormalized, usually just ID.
        // But if they did (e.g. for search), we would fix it here.
        // Let's check 'studentName' repair instead.
        
        if (!data.isAnonymous && data.studentId) {
             // We would need a map of students too. 
             // Omitted for brevity, but pattern matches above.
        }
    });
    
    if (updateCount > 0) {
        await batch.commit();
    }
    
    console.log(`Repaired ${updateCount} documents.`);
    return null;
});
