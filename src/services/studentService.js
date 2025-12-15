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
        const myRatings = await feedbackService.fetchFeedbacks({ studentId: uid, limit: 50, sort: 'date_desc' });
        
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

        // 5. User Reactions & Flags
        const userReactions = await feedbackService.fetchUserReactions(uid);
        const userFlags = await feedbackService.fetchUserFlags(uid);

        return {
            profile,
            myRatings,
            // Combined Stats: "Avg Given" is calculated on client from ratings. "Reviews Count" from DB.
            stats: { 
                totalRatings: myRatings.length, 
                avgGiven,
                reviewsCount: profile.stats.reviewsCount,
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
