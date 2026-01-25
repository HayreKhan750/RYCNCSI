import { db } from '../firebase';
import {
  doc,
  getDoc
} from 'firebase/firestore';
import { feedbackService } from './feedbackService';

export const studentService = {
  // Fetch Full Profile Package
  fetchStudentProfile: async (uid) => {
      try {
        // 1. Fetch User Profile & Student Stats (Parallel)
        const [userSnap, studentSnap] = await Promise.all([
            getDoc(doc(db, 'users', uid)),
            getDoc(doc(db, 'students', uid))
        ]);
        
        let userData = {};
        if (userSnap.exists()) userData = userSnap.data();
        
        let studentData = {};
        if (studentSnap.exists()) studentData = studentSnap.data();
        
        const profile = {
          id: uid,
          // Identity (Users)
          name: userData.fullName || userData.name || 'Student',
          email: userData.email || '',
          profilePictureUrl: userData.profilePictureUrl || userData.photoURL || '',
          role: userData.role || 'student',
          joinedAt: userData.createdAt?.toDate ? userData.createdAt.toDate().toISOString() : new Date().toISOString(),
          
          // Metadata (Students)
          department: userData.departmentId || studentData.departmentId || 'Not set',
          campusId: studentData.campusId || userData.campusId || 'main',
          year: studentData.year || userData.year || '1',
          
          // Stats (Students)
          stats: {
              reviewsCount: studentData.stats?.reviewsCount || userData.stats?.reviewsCount || 0,
              helpfulVotes: studentData.stats?.helpfulVotes || userData.stats?.helpfulVotes || 0
          }
        };

        // 2. Fetch User's Ratings (My Ratings)
        let myRatings = await feedbackService.fetchFeedbacks({ studentId: uid, limit: 50, sort: 'date_desc' });
        
        // 2b. Hydrate Instructor Names (Fix for missing denormalized data)
        const instructorIds = [...new Set(myRatings.map(r => r.instructorId).filter(Boolean))];
        if (instructorIds.length > 0) {
            // Optimize: Batch fetch might be better but IDs are few per student usually
            // We use Promise.all for simplicity
            const instructorDocs = await Promise.all(
                instructorIds.map(id => getDoc(doc(db, 'users', id)))
            );
            
            const instructorMap = {};
            instructorDocs.forEach(d => {
                if (d.exists()) {
                    instructorMap[d.id] = {
                        name: d.data().displayName || d.data().name || 'Instructor',
                        photo: d.data().photoURL || d.data().profilePictureUrl || ''
                    };
                }
            });

            // Patch ratings
            myRatings = myRatings.map(r => {
                const info = instructorMap[r.instructorId];
                if (info) {
                    return { ...r, instructorName: info.name, instructorPhoto: info.photo };
                }
                return r;
            });
        }
        
        // 3. Rate Stats
        const totalRatings = myRatings.length;

        const avgGiven = totalRatings 
            ? (myRatings.reduce((sum, r) => sum + (r.rating || r.overall || 0), 0) / totalRatings).toFixed(1)
            : 0;
            
        // 4. Rated Instructors (Aggregation)
        const instMap = new Map();
        myRatings.forEach((r) => {
          const key = r.instructorId || 'unknown';
          if (!key || key === 'unknown') return;
          
          const existing = instMap.get(key) || {
            instructorId: r.instructorId,
            instructorName: r.instructorName,
            deptName: r.deptName,
            count: 0,
            lastRating: r.rating || 0,
          };
          existing.count += 1;
          existing.lastRating = r.rating || existing.lastRating; 
          instMap.set(key, existing);
        });
        const ratedInstructors = Array.from(instMap.values());

        // 5. User Reactions & Flags (Best Effort / Private)
        let userReactions = {};
        let userFlags = [];
        try {
            const [rx, fl] = await Promise.all([
                feedbackService.fetchUserReactions(uid),
                feedbackService.fetchUserFlags(uid)
            ]);
            userReactions = rx;
            userFlags = fl;
        } catch (e) {
            // Likely permission denied when viewing another user's profile.
            // This is expected behavior for public views.
            // console.warn("Could not fetch private user data (reactions/flags)", e);
        }

        return {
            profile,
            myRatings,
            // Combined Stats: "Avg Given" is calculated on client from ratings. "Reviews Count" from DB.
            // Combined Stats: "Avg Given" is calculated on client from ratings. 
            // "Reviews Count" is now calculated locally to ensure accuracy if DB stats lag.
            stats: { 
                totalRatings: myRatings.length, 
                avgGiven,
                reviewsCount: myRatings.filter(r => (r.feedback && r.feedback.trim().length > 0) || (r.text && r.text.trim().length > 0) || (r.comment && r.comment.trim().length > 0)).length,
                helpfulVotes: profile.stats.helpfulVotes
            },
            ratedInstructors,
            userReactions,
            userFlags
        };
      } catch (error) {
          console.error("Error fetching student profile:", error);
          throw error;
      }
  }
};
