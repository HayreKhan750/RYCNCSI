import { db } from '../firebase';
import { collection, query, where, getDocs, orderBy, limit, doc, getDoc, getCountFromServer, updateDoc, serverTimestamp, deleteDoc, addDoc, runTransaction } from 'firebase/firestore';
import { instructorService } from './instructorService';
import { serializeFirestoreData } from '../utils/serialization';

export const managementService = {

  // 3. Feedback Feed
  fetchRecentFeedback: async (limitCount = 20) => {
    try {
        const q = query(collection(db, 'feedbacks'), orderBy('createdAt', 'desc'), limit(limitCount));
        const snapshot = await getDocs(q);
        
        // Fetch instructors to hydrate missing department info
        const instructors = await instructorService.fetchAllInstructors();
        const instMap = {};
        instructors.forEach(i => {
           instMap[i.id] = i.department || 'General';
           if(i.userId) instMap[i.userId] = i.department || 'General';
        });

        const feedbacks = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            const serializedData = serializeFirestoreData(data);
            
            // Hydrate Department if missing (Critical for Dept Detail Page filtering)
            const dept = data.deptName || data.department || instMap[data.instructorId] || 'General';

            feedbacks.push({
                id: doc.id,
                ...serializedData, // Safe clean data (includes deptName/department from doc)
                department: dept, // Explicit override/hydration
                deptName: dept,
                studentName: data.anonymous ? 'Anonymous' : (data.studentName || 'Student'),
                instructorName: data.instructorName || data.instructorId, 
                rating: data.overall || data.rating || 0,
                time: timeAgo(data.createdAt || data.timestamp)
            });
        });
        return feedbacks;
    } catch (error) {
        console.error("Feed error:", error);
        throw error;
    }
  },
  // 1. Dashboard Stats (Enterprise Scale)
  fetchDashboardStats: async () => {
    try {
      // 1. Fetch Accurate Counts (O(1))
      const totalRatingsSnap = await getCountFromServer(collection(db, 'feedbacks'));
      const totalRatings = totalRatingsSnap.data().count;

      // 2. Fetch Instructors (Optimized Service)
      const instructors = await instructorService.fetchAllInstructors();
      const totalInstructors = instructors.length;
      
      const departments = [...new Set(instructors.map(i => i.department || 'General'))];
      const totalDepartments = departments.length;
      
      // 3. Fetch Recent Feedbacks for Trends & Rolling Avg (Sample Size: 1000)
      // Calculating true average at Google-scale requires pre-aggregation (Cloud Functions).
      // For usage here, we sample the last 1000 to give a "Recent Quality" metric.
      const feedbacksSnapshot = await getDocs(query(collection(db, 'feedbacks'), orderBy('createdAt', 'desc'), limit(1000)));
      const recentFeedbacks = feedbacksSnapshot.docs.map(doc => ({ ...doc.data(), createdAt: doc.data().createdAt }));

      const avgRating = recentFeedbacks.length > 0 
        ? (recentFeedbacks.reduce((acc, curr) => acc + (curr.overall || curr.rating || 0), 0) / recentFeedbacks.length).toFixed(1) 
        : "0.0";

      // Calculate Engagement (Ratings this month)
      const now = new Date();
      const monthlyCount = recentFeedbacks.filter(r => {
          const rawDate = r.createdAt || r.timestamp;
          if (!rawDate) return false;
          const date = rawDate.toDate ? rawDate.toDate() : new Date(rawDate);
          return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      }).length;

      return {
        totalInstructors,
        totalDepartments,
        avgRating,
        totalRatings, // Now accurate even if > 1000
        engagementThisMonth: monthlyCount,
        departmentsList: departments
      };
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      throw error;
    }
  },

  // 2. Department Analytics (Real-Time from Feedbacks)
  fetchDepartmentAnalytics: async () => {
    try {
        // Fetch all feedbacks for accurate aggregation
        // In production, this should be a cached cloud function result.
        const snapshot = await getDocs(query(collection(db, 'feedbacks'), limit(500))); // Limit for client performance
        
        const deptMap = {};

        // We also need to map instructor IDs to departments if the feedback doesn't have it
        const instructors = await instructorService.fetchAllInstructors();
        const instDeptMap = {};
        instructors.forEach(i => {
            if(i.userId) instDeptMap[i.userId] = i.department || 'General';
            if(i.id) instDeptMap[i.id] = i.department || 'General';
        });

        snapshot.forEach(doc => {
            const data = doc.data();
            const rating = Number(data.rating || data.ratingValue || data.score || 0);

            if (rating > 0) {
                // Determine Department
                // 1. Try direct field
                // 2. Try lookup via instructorId
                // 3. Fallback
                const dept = data.deptName || data.department || instDeptMap[data.instructorId] || 'General';
                
                if (!deptMap[dept]) {
                    deptMap[dept] = { 
                        name: dept, 
                        totalRatingSum: 0, 
                        totalRatingCount: 0,
                        engagement: 0
                    };
                }
                
                deptMap[dept].totalRatingSum += rating;
                deptMap[dept].totalRatingCount += 1;
                deptMap[dept].engagement += 1; // Count as 1 interaction
            }
        });

        // Count Instructors per Department
        const deptInstructorValues = {};
        instructors.forEach(i => {
            const dName = i.department || 'General';
            if (!deptInstructorValues[dName]) deptInstructorValues[dName] = 0;
            deptInstructorValues[dName]++;
        });

        // Format for UI
        const results = Object.values(deptMap).map(d => {
            const avg = d.totalRatingCount > 0 ? (d.totalRatingSum / d.totalRatingCount) : 0;
            // console.log(`[DEBUG] Dept: ${d.name} -> Sum: ${d.totalRatingSum}, Count: ${d.totalRatingCount}, Avg: ${avg}`);
            return {
                name: d.name,
                instructorCount: deptInstructorValues[d.name] || 0, // Real count from instructor list
                ratingCount: d.totalRatingCount,
                students: d.totalRatingCount, 
                rating: avg.toFixed(1),
                sentiment: calculateSentiment(avg)
            };
        });
        
        // console.log("[DEBUG] Results:", results);
        
        // Ensure we at least return the known departments even if empty
        const knownDepts = [...new Set(Object.values(instDeptMap))];
        knownDepts.forEach(d => {
            if (!results.find(r => r.name === d)) {
                results.push({ 
                    name: d, 
                    rating: "0.0", 
                    sentiment: 'No Data', 
                    ratingCount: 0,
                    instructorCount: deptInstructorValues[d] || 0 
                });
            }
        });

        return results.sort((a,b) => b.rating - a.rating);

    } catch (error) {
        console.error("Error fetching dept analytics:", error);
        throw error;
    }
  },


  
  // 4. Instructor Leaderboard
  fetchTopInstructors: async () => {
      try {
        // Get the master list
        const instructors = await instructorService.fetchAllInstructors();

        return instructors
            .filter(i => {
                // Robust Name Check: Use fullName (guaranteed by service) or fallbacks
                const name = i.fullName || i.instructorName || i.name;
                return name && !name.includes('Unknown') && name.toLowerCase() !== 'dr. unknown';
            })
            .sort((a, b) => b.avgRating - a.avgRating)
            // .slice(0, 5) // REMOVED: Allow Redux to hold all, let UI component slice if needed.
            .map(i => {
                const finalName = i.fullName || i.instructorName || i.name || 'Instructor';
                return {
                    id: i.id,
                    instructorName: finalName,
                    // Map to common fields expected by UI components
                    name: finalName,
                    displayName: finalName,
                    department: i.department,
                    rating: i.avgRating.toFixed(1),
                    count: i.totalRatings || i.ratingCount,
                    photo: i.photo || i.photoURL || i.profilePictureUrl,
                    tags: i.tags || ['General']
                };
            });

      } catch (e) {
          console.error(e);
          return [];
      }
  }
};

// Utilities
function calculateSentiment(rating) {
    if (rating >= 4.5) return 'Very High';
    if (rating >= 4.0) return 'High';
    if (rating >= 3.0) return 'Medium';
    if (rating >= 2.0) return 'Low';
    return 'Critical';
}

function timeAgo(dateInput) {
    if (!dateInput) return 'Unknown';
    const date = dateInput.toDate ? dateInput.toDate() : new Date(dateInput);
    const seconds = Math.floor((new Date() - date) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m ago";
    return "Just now";
}
