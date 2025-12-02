import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchFeedbacks, updateFeedback } from '../../store/slices/feedbackSlice';
import { selectFeedbacksByStudentId, selectFeedbackLoading } from '../../store/selectors/feedbackSelectors';
import PremiumModal from '../common/PremiumModal';

export default function MyRatings({ user }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const ratings = useSelector((state) => selectFeedbacksByStudentId(state, user?.uid));
  const loading = useSelector(selectFeedbackLoading);
  const [modalConfig, setModalConfig] = useState({ isOpen: false, type: 'confirm' });

  useEffect(() => {
    if (user?.uid) {
        dispatch(fetchFeedbacks({ studentId: user.uid }));
    }
  }, [user, dispatch]);

  const confirmDelete = (feedbackId) => {
      setModalConfig({
          isOpen: true,
          title: 'Delete Rating?',
          message: 'Are you sure you want to delete this rating? This action cannot be undone.',
          type: 'danger',
          confirmText: 'Delete',
          onConfirm: () => handleDelete(feedbackId)
      });
  };

  const handleDelete = async (id) => {
    try {
      // Soft delete preference from prompt
      await dispatch(updateFeedback({ id, updates: { deleted: true } })).unwrap();
    } catch (err) {
      console.error("Failed to delete", err);
      setModalConfig({
          isOpen: true,
          title: 'Error',
          message: 'Failed to delete rating. Please try again.',
          type: 'alert',
          confirmText: 'OK'
      });
    }
  };

  if (loading && ratings.length === 0) return <div className="glass-card" style={{padding:40}}>Loading...</div>;

  const activeRatings = ratings.filter(r => !r.deleted);

  return (
    <div className="my-ratings-page">
      <h2 style={{marginBottom: 30}}>My Ratings ({activeRatings.length})</h2>
      
      <div className="ratings-list-layout">
        {activeRatings.map(rating => (
          <div key={rating.id} className="glass-card rating-item" style={{padding: 20}}>
            <div className="instructor-photo" style={{width:60, height:60, background:'#e0e7ff', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'bold', fontSize:20}}>
               {(rating.instructorName || 'T').charAt(0)}
            </div>
            
            <div className="rating-content">
               <h4 style={{margin:0}}>{rating.instructorName}</h4>
               <p style={{margin:'4px 0', opacity:0.7, fontSize:14}}>{rating.courseTitle}</p>
               <div style={{display:'flex', alignItems:'center', gap:10, margin:'8px 0'}}>
                  <span style={{fontWeight:'bold', color:'#fbbf24', fontSize:18}}>{rating.rating} ★</span>
                  <span style={{fontSize:12, opacity:0.5}}>{new Date(rating.timestamp || rating.createdAt?.seconds * 1000).toLocaleDateString()}</span>
               </div>
               <p style={{fontStyle:'italic', opacity:0.8}}>"{rating.feedback}"</p>
               <div className="tags-row" style={{display:'flex', gap:5, marginTop:10}}>
                  {rating.tags && rating.tags.map(t => (
                      <span key={t} style={{fontSize:10, padding:'2px 8px', background:'rgba(0,0,0,0.05)', borderRadius:10}}>{t}</span>
                  ))}
               </div>
               {/* Reaction Summary */}
               <div style={{marginTop: 10, fontSize: 12, opacity: 0.6, display: 'flex', gap: 15}}>
                   <span>👍 {rating.likes || 0} Likes</span>
                   <span>👎 {rating.dislikes || 0} Dislikes</span>
                   <span>💬 {rating.replies?.length || 0} Replies</span>
               </div>
            </div>

            <div className="rating-actions">
               <button className="icon-btn edit-btn" title="Edit" onClick={() => navigate(`/rate/${rating.instructorId}`)}>✎</button>
               <button className="icon-btn delete-btn" title="Delete" onClick={() => confirmDelete(rating.id)}>🗑</button>
            </div>
          </div>
        ))}

        {activeRatings.length === 0 && (
            <div style={{textAlign:'center', padding: 40, opacity: 0.6}}>You haven't submitted any ratings yet.</div>
        )}
      </div>

      <PremiumModal 
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
        {...modalConfig}
      />
    </div>
  );
}
