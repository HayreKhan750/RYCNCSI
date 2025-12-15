import { db } from '../firebase';
import { collection, query, where, getDocs, orderBy, limit, doc, getDoc, getCountFromServer } from 'firebase/firestore';
import { instructorService } from './instructorService';

export const managementService = {
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

  // 2. Department Analytics
  fetchDepartmentAnalytics: async () => {
    try {
        // Use the consistent instructor list
        const instructors = await instructorService.fetchAllInstructors();
        
        const deptMap = {};

        // Aggregate from Instructors
        instructors.forEach(inst => {
            const dept = inst.department || 'General';
            if (!deptMap[dept]) {
                deptMap[dept] = { 
                    name: dept, 
                    instructorCount: 0, 
                    totalRatingSum: 0, 
                    totalRatingCount: 0 
                };
            }
            deptMap[dept].instructorCount++;
            
            // Unpack aggregated ratings from instructor object
            if (inst.totalRatings > 0) {
                 // Reconstruct sum to aggregate correctly
                 deptMap[dept].totalRatingSum += (inst.avgRating * inst.totalRatings);
                 deptMap[dept].totalRatingCount += inst.totalRatings;
            }
        });

        // Format
        return Object.values(deptMap).map(d => {
            const avg = d.totalRatingCount > 0 ? (d.totalRatingSum / d.totalRatingCount) : 0;
            return {
                name: d.name,
                instructorCount: d.instructorCount,
                ratingCount: d.totalRatingCount,
                students: d.totalRatingCount, // Proxy for active students
                rating: avg.toFixed(1),
                sentiment: calculateSentiment(avg)
            };
        });

    } catch (error) {
        console.error("Error fetching dept analytics:", error);
        throw error;
    }
  },

  // 3. Feedback Feed
  fetchRecentFeedback: async (limitCount = 20) => {
    try {
        const q = query(collection(db, 'feedbacks'), orderBy('createdAt', 'desc'), limit(limitCount));
        const snapshot = await getDocs(q);
        const feedbacks = [];
        
        snapshot.forEach(doc => {
            const data = doc.data();
            feedbacks.push({
                id: doc.id,
                ...data,
                studentName: data.anonymous ? 'Anonymous' : (data.studentName || 'Student'),
                instructorName: data.instructorName || data.instructorId, // Ideally fetch name if ID is used
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
  
  // 4. Instructor Leaderboard
  fetchTopInstructors: async () => {
      try {
        // Get the master list
        const instructors = await instructorService.fetchAllInstructors();

        // Sort by avgRating
        // Sort by avgRating
        // Filter out those with 0 ratings to avoid clustering
        // Filter out "Unknown" names
        return instructors
            .filter(i => 
                i.ratingCount > 0 && 
                i.instructorName && 
                !i.instructorName.includes('Unknown') && 
                i.instructorName.toLowerCase() !== 'dr. unknown'
            )
            .sort((a, b) => b.avgRating - a.avgRating)
            .slice(0, 5)
            .map(i => ({
                id: i.id,
                instructorName: i.instructorName,
                // Map to common fields expected by UI components
                name: i.instructorName,
                displayName: i.instructorName,
                department: i.department,
                rating: i.avgRating.toFixed(1),
                count: i.ratingCount,
                photo: i.photo || i.photoURL || i.profilePictureUrl,
                tags: i.tags || ['General']
            }));

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
