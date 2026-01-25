import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchFeedbacks } from '../../store/slices/feedbackSlice';
import { selectFeedbacksByStudentId, selectFeedbackLoading } from '../../store/selectors/feedbackSelectors';
import ActivityDashboard from '../student/ActivityDashboard';
import { useStudentProfile } from '../../hooks/useStudentProfile';
import { feedbackService } from '../../services/feedbackService';

export default function ReviewsAndActivity({ user }) {
  const dispatch = useDispatch();
  
  const { userReactions } = useStudentProfile({ uid: user?.uid });
  
  const rawRatings = useSelector((state) => selectFeedbacksByStudentId(state, user?.uid));
  const loading = useSelector(selectFeedbackLoading);
  
  // Local state for replies
  const [repliesMap, setRepliesMap] = useState({});

  useEffect(() => {
    if (user?.uid) {
        dispatch(fetchFeedbacks({ studentId: user.uid }));
    }
  }, [user, dispatch]);

  // Fetch replies for loaded ratings
  useEffect(() => {
      const fetchAllReplies = async () => {
          if (!rawRatings.length) return;
          
          const newReplies = {};
          await Promise.all(rawRatings.map(async (r) => {
              try {
                  const fetched = await feedbackService.fetchReplies(r.id);
                  if (fetched && fetched.length > 0) {
                      newReplies[r.id] = fetched;
                  }
              } catch (e) {
                  console.error("Error fetching replies for", r.id, e);
              }
          }));
          
          if (Object.keys(newReplies).length > 0) {
              setRepliesMap(prev => ({ ...prev, ...newReplies }));
          }
      };
      
      fetchAllReplies();
  }, [rawRatings]);
  
  // Robust Date Handling & Filtering
  const [filter, setFilter] = useState('all');

  const processedRatings = useMemo(() => {
     let result = rawRatings.map(r => {
         const replies = repliesMap[r.id] || r.replies || [];
         
         // Robust Timestamp Conversion
         let validDate = r.createdAt;
         if (r.createdAt && typeof r.createdAt === 'object' && r.createdAt.seconds) {
             validDate = new Date(r.createdAt.seconds * 1000); // Firestore Timestamp
         } else if (r.timestamp) {
             validDate = new Date(r.timestamp);
         }

         return {
             ...r,
             replies: replies, // Attach fetched replies
             createdAt: validDate, 
             // ActivityDashboard fallback if dependent on other fields
             timestamp: validDate
         };
     });

     if (filter === 'replied') {
         result = result.filter(r => r.replies && r.replies.length > 0);
     }

     return result;
  }, [rawRatings, repliesMap, filter]);

  if (loading && processedRatings.length === 0 && filter === 'all') return <div className="glass-card" style={{padding:40, textAlign:'center'}}>Loading your activity...</div>;

  return (
    <div className="reviews-activity-page">
       <div style={{marginBottom: 24, display:'flex', alignItems:'center', justifyContent: 'space-between', flexWrap:'wrap', gap: 16}}>
           <div style={{display:'flex', alignItems:'center', gap: 12}}>
                <h2 className="page-title" style={{margin:0}}>My Reviews & Activity</h2>
                <span className="badge" style={{background:'rgba(255,255,255,0.1)', padding:'4px 12px', borderRadius:20, fontSize:'0.9rem'}}>{processedRatings.length}</span>
           </div>

           {/* Filter Toggle */}
           <div style={{
               background: 'var(--bg-elevated)', 
               padding: '4px', borderRadius: '50px', 
               display: 'flex', gap: '4px',
               border: '1px solid var(--border-subtle)'
           }}>
               <button 
                  onClick={() => setFilter('all')}
                  style={{
                      background: filter === 'all' ? 'var(--primary)' : 'transparent',
                      color: filter === 'all' ? 'white' : 'var(--text-secondary)',
                      padding: '6px 16px', borderRadius: '20px', border: 'none',
                      fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s'
                  }}
               >
                   All
               </button>
               <button 
                  onClick={() => setFilter('replied')}
                  style={{
                      background: filter === 'replied' ? 'var(--primary)' : 'transparent',
                      color: filter === 'replied' ? 'white' : 'var(--text-secondary)',
                      padding: '6px 16px', borderRadius: '20px', border: 'none',
                      fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s'
                  }}
               >
                   Replied
               </button>
           </div>
       </div>
       
       <ActivityDashboard 
          ratings={processedRatings}
          isOwnProfile={true}
          user={user}
          userReactions={userReactions}
       />
    </div>
  );
}
