import React, { useState, useMemo, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { addReply, deleteFeedback, deleteReply, flagFeedback, toggleLike } from '../../store/slices/feedbackSlice';
import { feedbackService } from '../../services/feedbackService';
import PremiumModal from './PremiumModal';

const ReviewList = ({ reviews = [], instructorId, isInstructorView = false, showInstructorInfo = false }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user } = useSelector(state => state.auth); 
    const [sortBy, setSortBy] = useState('newest'); 
    const [filterRating, setFilterRating] = useState('all');
    
    // Optimistic Logic
    const [optimisticReviews, setOptimisticReviews] = useState(reviews);
    const [userReactions, setUserReactions] = useState({});

    useEffect(() => {
        setOptimisticReviews(reviews);
    }, [reviews]);

    useEffect(() => {
        if (reviews.length > 0 && user?.uid) {
            feedbackService.fetchUserReactions(user.uid).then(setUserReactions);
        }
    }, [reviews, user]);
    
    // Reply State
    const [expandedId, setExpandedId] = useState(null);
    const [replyText, setReplyText] = useState({});
    const [repliesMap, setRepliesMap] = useState({}); // { [feedbackId]: [replies] }

    // Premium Search & Filter State
    const [searchTerm, setSearchTerm] = useState('');

    // Modal State
    const [deleteModal, setDeleteModal] = useState({ 
        isOpen: false, 
        type: null, // 'review' | 'reply'
        id: null,
        parentId: null // for replies
    });
    
    // Flag State
    const [flagModal, setFlagModal] = useState({ isOpen: false, id: null });
    const [successModal, setSuccessModal] = useState({ isOpen: false, message: '' });

    // Fetch Replies on Load
    useEffect(() => {
        let isMounted = true;
        
        const loadReplies = async () => {
             // Fetch in parallel
             const results = await Promise.all(
                 reviews.map(async (r) => {
                     try {
                         const fetched = await feedbackService.fetchReplies(r.id);
                         return { id: r.id, data: fetched };
                     } catch (e) {
                         console.error("Error fetching replies for", r.id, e);
                         return { id: r.id, data: [] };
                     }
                 })
             );
             
             if (isMounted) {
                 setRepliesMap(prev => {
                     const next = { ...prev };
                     let hasChanges = false;
                     results.forEach(({id, data}) => {
                         if (data && data.length > 0) {
                             next[id] = data;
                             hasChanges = true;
                         }
                     });
                     return hasChanges ? next : prev;
                 });
             }
        };
        
        if (reviews.length > 0) {
            loadReplies();
        }
        
        return () => { isMounted = false; };
    }, [reviews]);

    const toggleReplies = (id) => {
        setExpandedId(expandedId === id ? null : id);
    };

    const submitReply = async (feedbackId) => {
        const text = replyText[feedbackId];
        if (!text || !text.trim()) return;
        if (!user || !user.uid) {
            setSuccessModal({ isOpen: true, message: "You must be logged in to reply." });
            return;
        }

        // Check if user is the feedback author trying to be the first replier
        const review = optimisticReviews.find(r => r.id === feedbackId);
        const existingReplies = repliesMap[feedbackId] || [];
        
        if (review && review.studentId === user.uid && existingReplies.length === 0) {
             setSuccessModal({ isOpen: true, message: "You cannot be the first to reply to your own feedback. Please wait for an instructor or another user to reply first." });
             return;
        }

        try {
          // 1. Submit to Backend (via Redux)
          const resultAction = await dispatch(addReply({ 
              feedbackId, 
              replyData: {
                  authorId: user.uid,
                  authorName: user.fullName || user.displayName || user.name || (user.email && user.email.split('@')[0]) || 'Student',
                  role: isInstructorView ? 'instructor' : 'student', 
                  text
              }
          }));
          
          const result = resultAction.unwrap ? await resultAction.unwrap() : resultAction.payload;

          // 2. Update Local State (Optimistic or Confirmed)
          const newReply = result.reply || result; // Handle structure variation
          
          setRepliesMap(prev => ({
              ...prev,
              [feedbackId]: [...(prev[feedbackId] || []), newReply]
          }));
          
          setReplyText(prev => ({ ...prev, [feedbackId]: '' }));
        } catch (e) {
            console.error("Failed to submit reply", e);
            const msg = e.message || (typeof e === 'string' ? e : 'Unknown error');
            setSuccessModal({ isOpen: true, message: "Failed to submit reply: " + msg });
        }
    };

    // Delete Handlers
    const promptDeleteReview = (reviewId) => {
        setDeleteModal({
            isOpen: true,
            type: 'review',
            id: reviewId,
            parentId: null
        });
    };

    const promptDeleteReply = (feedbackId, replyId) => {
        setDeleteModal({
            isOpen: true,
            type: 'reply',
            id: replyId,
            parentId: feedbackId
        });
    };

    const confirmDelete = async () => {
        const { type, id, parentId } = deleteModal;
        
        try {
            if (type === 'review') {
                if (!id) throw new Error("ID is missing");
                await dispatch(deleteFeedback(id)).unwrap();
            } else if (type === 'reply') {
                if (!id) throw new Error("Reply ID is missing");
                await dispatch(deleteReply({ feedbackId: parentId, replyId: id })).unwrap();
                setRepliesMap(prev => ({
                    ...prev,
                    [parentId]: prev[parentId].filter(r => r.id !== id)
                }));
            }
        } catch (e) {
            console.error("Delete failed:", e);
            setSuccessModal({ isOpen: true, message: "Failed to delete item." });
        }
        
        setDeleteModal({ isOpen: false, type: null, id: null, parentId: null });
    };

    const promptFlag = (id) => {
        setFlagModal({ isOpen: true, id });
    };

    const handleReaction = async (feedbackId, type) => {
        if (!user?.uid) {
             setSuccessModal({ isOpen: true, message: "Please log in to react to reviews." });
             return;
        }
    
        const reviewIndex = optimisticReviews.findIndex(r => r.id === feedbackId);
        if (reviewIndex === -1) return;
        const review = optimisticReviews[reviewIndex];
    
        // Prevent self-reaction
        if (review.studentId === user.uid) {
            setSuccessModal({ isOpen: true, message: "You cannot rate your own review." });
            return;
        }
    
        const currentReaction = userReactions[feedbackId];
        const isRemoving = currentReaction === type;
        const isSwitching = currentReaction && currentReaction !== type;
    
        const newReviews = [...optimisticReviews];
        const target = { ...newReviews[reviewIndex] };
    
        // Initialize if undefined
        target.likesCount = target.likesCount || 0;
        target.dislikesCount = target.dislikesCount || 0;
    
        if (type === 'like') {
            if (isRemoving) target.likesCount = Math.max(0, target.likesCount - 1);
            else {
                target.likesCount++;
                if (isSwitching) target.dislikesCount = Math.max(0, target.dislikesCount - 1);
            }
        } else {
            if (isRemoving) target.dislikesCount = Math.max(0, target.dislikesCount - 1);
            else {
                target.dislikesCount++;
                if (isSwitching) target.likesCount = Math.max(0, target.likesCount - 1);
            }
        }
        
        newReviews[reviewIndex] = target;
        setOptimisticReviews(newReviews);
        setUserReactions(prev => ({ ...prev, [feedbackId]: isRemoving ? null : type }));
    
        try {
            await dispatch(toggleLike({ feedbackId, userId: user.uid, isLike: type === 'like' })).unwrap();
        } catch (e) {
            console.error("Reaction failed:", e);
            // Revert on failure? Ideally yes, but for now we log.
        }
    };

    const confirmFlag = async (reason) => {
        if (!flagModal.id) return;
        try {
            await dispatch(flagFeedback({
                feedbackId: flagModal.id,
                userId: user?.uid,
                reason: reason || 'Instructor Flagged', // Use input reason or default
                details: 'Flagged via Instructor Dashboard'
            })).unwrap();
            
            // Show Premium Success Modal instead of alert
            setSuccessModal({ isOpen: true, message: "Content has been flagged for review." });
        } catch (e) {
            console.error("Flag failed:", e);
            setSuccessModal({ isOpen: true, message: "Failed to flag content. Please try again." });
        }
        setFlagModal({ isOpen: false, id: null });
    };

    // Style Constants
    const btnBaseStyle = {
        width: '36px', height: '36px', borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: '1px solid rgba(255,255,255,0.1)',
        background: 'rgba(255,255,255,0.03)',
        color: '#94a3b8', cursor: 'pointer', transition: 'all 0.2s',
        fontSize: '0.9rem', outline: 'none'
    };

    // 1. Filter & Sort Logic 
    const processedReviews = useMemo(() => {
        let result = [...optimisticReviews];
        if (filterRating !== 'all') {
            result = result.filter(r => Math.round(r.rating) === Number(filterRating));
        }

        result.sort((a, b) => {
            const dateA = new Date(a.createdAt || a.timestamp || 0);
            const dateB = new Date(b.createdAt || b.timestamp || 0);
            const rateA = Number(a.rating || 0);
            const rateB = Number(b.rating || 0);

            switch (sortBy) {
                case 'newest': return dateB - dateA;
                case 'lowest': return rateA - rateB;
                case 'highest': return rateB - rateA;
                default: return dateB - dateA;
            }
        });

        return result;
    }, [optimisticReviews, sortBy, filterRating]);

    // 2. Search Filter
    const filteredReviews = useMemo(() => {
        let result = [...processedReviews];
        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            result = result.filter(r => 
                (r.text && r.text.toLowerCase().includes(lower)) ||
                (r.feedback && r.feedback.toLowerCase().includes(lower)) ||
                (r.comment && r.comment.toLowerCase().includes(lower)) ||
                (r.studentName && r.studentName.toLowerCase().includes(lower))
            );
        }
        return result;
    }, [processedReviews, searchTerm]);

    const timeAgo = (date) => {
        if (!date) return 'Just now';
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " years ago";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " months ago";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " days ago";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " hours ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " minutes ago";
        return Math.floor(seconds) + " seconds ago";
    };

    const getSortedReplies = (rId) => {
        const list = repliesMap[rId] || [];
        return [...list].sort((a, b) => {
            const tA = new Date(a.createdAt || 0).getTime();
            const tB = new Date(b.createdAt || 0).getTime();
            return tA - tB;
        });
    };

    if (!reviews || reviews.length === 0) {
        return (
            <div className="text-center py-8 text-slate-400 italic">
                No reviews yet.
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Controls Panel */}
            <div className="glass-card" style={{
                padding: '12px 24px', 
                marginBottom: '24px', 
                display: 'flex', flexWrap: 'wrap', gap: '20px', 
                alignItems: 'center', justifyContent: 'space-between',
                background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '50px',
                backdropFilter: 'none', WebkitBackdropFilter: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
            }}>
                <div className="search-wrapper" style={{flex: '1', minWidth: '200px', maxWidth: '250px', position: 'relative'}}>
                    <span style={{position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5, color: 'var(--text-primary)'}}>🔍</span>
                    <input 
                        type="text" 
                        placeholder="Search your reviews..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="premium-input"
                        style={{
                            width: '100%', padding: '10px 16px 10px 40px', borderRadius: '50px', 
                            background: 'var(--bg-root)', border: '1px solid var(--border-subtle)', 
                            color: 'var(--text-primary)', fontSize: '0.95rem', outline: 'none'
                        }}
                    />
                </div>
                
                <div style={{display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap'}}>
                    <div className="sort-wrapper" style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                        <label style={{color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500}}>Sort:</label>
                        <select 
                            value={sortBy} 
                            onChange={(e) => setSortBy(e.target.value)} 
                            className="premium-select"
                            style={{
                                padding: '8px 16px', borderRadius: '12px', background: 'transparent',
                                border: '1px solid var(--border-subtle)', color: 'var(--text-primary)',
                                fontWeight: '500', cursor: 'pointer', outline: 'none', fontSize: '0.9rem'
                            }}
                        >
                            <option value="newest">Newest First</option>
                            <option value="highest">Highest Rated</option>
                            <option value="lowest">Lowest Rated</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-3">
                         <span style={{color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500}}>Filter:</span>
                         <div className="flex gap-2">
                             {[5,4,3,2,1].map(star => (
                                 <button
                                    key={star}
                                    onClick={() => setFilterRating(filterRating === star ? 'all' : star)}
                                    style={{
                                        transition: 'all 0.2s',
                                        background: filterRating === star ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255,255,255,0.05)',
                                        border: filterRating === star ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid transparent',
                                        color: filterRating === star ? '#fbbf24' : '#94a3b8',
                                        padding: '6px 10px', borderRadius: '8px', fontSize: '0.8rem',
                                        fontWeight: filterRating === star ? '600' : '500', cursor: 'pointer'
                                    }}
                                 >
                                     {star}★
                                 </button>
                             ))}
                         </div>
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="activity-feed-premium" style={{display:'flex', flexDirection:'column', gap: 24}}>
                {filteredReviews.map((review) => {
                    const replies = getSortedReplies(review.id);
                    const showReplies = expandedId === review.id;
                    const replyCount = replies.length || review.replies?.length || 0;
                    const isMyKey = user?.uid === review.studentId;

                    return (
                    <div key={review.id} className="premium-card activity-card-premium" style={{
                        flexDirection:'column', padding: 0, overflow:'hidden',
                        background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
                        borderRadius: '24px', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.3)',
                        backdropFilter: 'none', WebkitBackdropFilter: 'none',
                        transform: 'none', filter: 'none'
                    }}>
                        {/* Header */}
                        <div className="activity-header-premium" style={{
                            padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', 
                            display:'flex', justifyContent:'space-between', alignItems:'center',
                            background: 'linear-gradient(to right, rgba(255,255,255,0.02), transparent)'
                        }}>
                           <div className="activity-meta" style={{display:'flex', alignItems:'center'}}>
                              <div style={{
                                  width: 40, height: 40, borderRadius: '50%', 
                                  background: 'var(--primary-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: '1.2rem', marginRight: 12, color: 'white'
                              }}>
                                  {showInstructorInfo 
                                    ? (review.instructorName || 'I').charAt(0) 
                                    : (review.studentName || 'S').charAt(0)}
                              </div>
                              <div>
                                  <h4 style={{margin:0, fontSize:'1.1rem', color:'var(--text-primary)'}}>
                                      {showInstructorInfo 
                                        ? (review.instructorName || 'Instructor') 
                                        : (review.studentName || 'Anonymous Student')}
                                  </h4>
                                  <span className="activity-date" style={{opacity: 0.5, fontSize:'0.85rem', color:'var(--text-secondary)'}}>
                                      {timeAgo(review.createdAt || review.timestamp)}
                                  </span>
                              </div>
                           </div>
                           
                           <div style={{display:'flex', alignItems:'center', gap: 12}}>
                                <div className="activity-rating" style={{
                                   fontWeight:'800', color:'#fbbf24', fontSize:'1.4rem', 
                                   background: 'rgba(251, 191, 36, 0.1)', padding: '4px 12px',
                                   borderRadius: '12px', border: '1px solid rgba(251, 191, 36, 0.2)'
                               }}>
                                  {review.rating} <span style={{fontSize:'1rem'}}>★</span>
                               </div>
                               
                               {/* EDIT & DELETE ACTIONS (Owner) */}
                               {isMyKey && (
                                   <div style={{display:'flex', gap:8}}>
                                       <button 
                                           onClick={() => navigate(`/rate/${review.instructorId}`)}
                                           title="Edit Review"
                                           style={{
                                               background: 'none', border:'none', cursor:'pointer',
                                               color: 'var(--primary)', opacity: 0.8, fontSize: '1rem'
                                           }}
                                       >
                                           ✏️
                                       </button>
                                       <button 
                                           onClick={() => promptDeleteReview(review.id)}
                                           title="Delete Review"
                                           style={{
                                               background: 'none', border:'none', cursor:'pointer',
                                               color: '#ef4444', opacity: 0.7, fontSize: '1rem'
                                           }}
                                       >
                                           🗑️
                                       </button>
                                   </div>
                               )}
                           </div>
                        </div>

                        {/* Content */}
                        <div className="activity-content" style={{padding: '24px', position: 'relative'}}>
                           {/* Sentiment Badge logic */}
                           {(() => {
                               let label = 'CONSTRUCTIVE';
                               let bg = '#fffbeb'; // amber-50
                               let color = '#b45309'; // amber-700
                               let border = '#fcd34d'; // amber-300
                               let icon = '🔧';

                               if (review.rating >= 4) {
                                   label = 'POSITIVE';
                                   bg = '#ecfdf5'; // emerald-50
                                   color = '#047857'; // emerald-700
                                   border = '#6ee7b7'; // emerald-300
                                   icon = '😃';
                               } else if (review.rating <= 2) {
                                   label = 'CRITICAL';
                                   bg = '#fef2f2'; // red-50
                                   color = '#b91c1c'; // red-700
                                   border = '#fca5a5'; // red-300
                                   icon = '⚠️';
                               }

                               return (
                                   <div style={{
                                       position: 'absolute',
                                       top: '-12px',
                                       right: '24px',
                                       zIndex: 10
                                   }}>
                                       <span style={{
                                           display: 'inline-flex', alignItems: 'center', gap: 6,
                                           padding: '4px 12px', borderRadius: '50px',
                                           background: bg, color: color, border: `1px solid ${border}`,
                                           fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase'
                                       }}>
                                           <span>{icon}</span> {label}
                                       </span>
                                   </div>
                               );
                           })()}

                           <div className="activity-comment" style={{
                               background:'var(--bg-root)', padding:'20px', borderRadius:'16px', 
                               fontStyle:'italic', borderLeft:'4px solid var(--primary)',
                               color: 'var(--text-primary)', lineHeight: 1.6, fontSize: '1.05rem'
                           }}>
                               "{review.text || review.feedback || review.comment}"
                           </div>
                           
                           {review.tags && review.tags.length > 0 && (
                               <div style={{display:'flex', gap:8, marginTop:20, flexWrap:'wrap'}}>
                                  {review.tags.map(tag => (
                                      <span key={tag} style={{
                                          fontSize:'0.8rem', padding:'6px 14px', borderRadius:20, 
                                          background:'var(--bg-root)', border:'1px solid var(--border-subtle)',
                                          color: 'var(--text-secondary)'
                                      }}>
                                          #{tag}
                                      </span>
                                  ))}
                               </div>
                           )}
                        </div>

                        {/* Actions */}
                        <div className="activity-actions" style={{
                            padding: '16px 24px', background:'rgba(0,0,0,0.02)', 
                            display:'flex', gap: 16, alignItems: 'center',
                            borderTop:'1px solid var(--border-subtle)'
                        }}>
                           <div style={{display:'flex', gap: 12}}>
                                {/* Like/Dislike Buttons - HIDDEN for Owner */}
                               {!isMyKey && (
                                   <>
                                       <button 
                                          className={`glass-pill-btn like ${userReactions[review.id] === 'like' ? 'active' : ''}`}
                                          style={{
                                              ...btnBaseStyle, 
                                              color: (userReactions[review.id] === 'like' || review.likesCount > 0) ? '#818cf8': '#94a3b8',
                                              borderColor: (userReactions[review.id] === 'like') ? '#818cf8': 'rgba(255,255,255,0.1)',
                                              background: (userReactions[review.id] === 'like') ? 'rgba(129, 140, 248, 0.15)' : 'rgba(255,255,255,0.03)'
                                          }}
                                          title="Helpful"
                                          onClick={(e) => { 
                                              const btn = e.currentTarget;
                                              btn.style.transform = 'scale(0.9)'; 
                                              setTimeout(() => btn.style.transform = 'scale(1)', 100); 
                                              handleReaction(review.id, 'like');
                                          }}
                                       >
                                          👍
                                       </button>
                                       <span style={{display:'flex', alignItems:'center', fontSize:'0.9rem', fontWeight:600}}>
                                           {review.likesCount || 0}
                                       </span>

                                       <button 
                                           className={`glass-pill-btn dislike ${userReactions[review.id] === 'dislike' ? 'active' : ''}`}
                                           style={{
                                               ...btnBaseStyle,
                                               color: (userReactions[review.id] === 'dislike') ? '#ef4444' : '#94a3b8',
                                               borderColor: (userReactions[review.id] === 'dislike') ? '#ef4444' : 'rgba(255,255,255,0.1)',
                                               background: (userReactions[review.id] === 'dislike') ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255,255,255,0.03)'
                                           }}
                                           title="Not Helpful"
                                           onClick={(e) => { 
                                              const btn = e.currentTarget;
                                              btn.style.transform = 'scale(0.9)'; 
                                              setTimeout(() => btn.style.transform = 'scale(1)', 100); 
                                              handleReaction(review.id, 'dislike');
                                          }}
                                       >
                                          👎
                                       </button>
                                       <span style={{display:'flex', alignItems:'center', fontSize:'0.9rem', fontWeight:600}}>
                                           {review.dislikesCount || 0}
                                       </span>
                                   </>
                               )}

                                {/* Reply Button */}
                                <button 
                                   style={{
                                       ...btnBaseStyle,
                                       background: showReplies ? 'var(--primary-gradient)' : 'rgba(255,255,255,0.03)',
                                       color: showReplies ? 'white' : '#94a3b8',
                                       border: showReplies ? 'none' : '1px solid rgba(255,255,255,0.1)'
                                   }}
                                     onClick={(e) => { 
                                        const btn = e.currentTarget;
                                        toggleReplies(review.id);
                                        btn.style.transform = 'scale(0.9)'; 
                                        setTimeout(() => btn.style.transform = 'scale(1)', 100); 
                                    }} 
                                   title="Reply"
                                >
                                   💬
                                </button>
                                {replyCount > 0 && (
                                    <span style={{display:'flex', alignItems:'center', fontSize:'0.9rem', fontWeight:600}}>
                                        {replyCount}
                                    </span>
                                )}
                           </div>

                           {!isInstructorView && !isMyKey && (
                               <button 
                                  style={{...btnBaseStyle, marginLeft: 'auto'}}
                                  title="Report"
                                  onClick={() => promptFlag(review.id)}
                               >
                                  🚩
                               </button>
                           )}
                           
                           {isInstructorView && (
                                <button 
                                    style={{...btnBaseStyle, marginLeft: 'auto'}} 
                                    title="Flag as Inappropriate"
                                    onClick={() => promptFlag(review.id)}
                                >
                                    🚩
                                </button>
                           )}
                        </div>

                        {/* Threaded Replies View */}
                        {showReplies && (
                          <div className="replies-section" style={{padding: '0 24px 24px', background:'rgba(0,0,0,0.02)'}}>
                              {replies.length > 0 ? (
                                  <div style={{display: 'flex', flexDirection: 'column', gap: 16, marginTop: 20}}>
                                      {replies.map((reply, idx) => (
                                          <div key={reply.id || idx} style={{display: 'flex', gap: 12, marginBottom: 16}}>
                                              <div style={{
                                                  minWidth: 32, height: 32, borderRadius: '50%', 
                                                  background: 'var(--bg-root)', border: '1px solid var(--border-subtle)',
                                                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem'
                                              }}>
                                                  {(reply.authorName || 'S').charAt(0)}
                                              </div>
                                              <div style={{flex: 1}}>
                                                  <div style={{background: 'var(--bg-root)', padding: '12px 16px', borderRadius: '0 16px 16px 16px', border: '1px solid var(--border-subtle)'}}>
                                                      <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 4}}>
                                                          <span style={{fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)'}}>
                                                              {reply.authorName || 'Student'}
                                                          </span>
                                                          <div style={{display:'flex', gap:8, alignItems:'center'}}>
                                                              <span style={{fontSize: '0.75rem', opacity: 0.5}}>{timeAgo(reply.createdAt)}</span>
                                                              
                                                              {/* DELETE REPLY BUTTON */}
                                                              {user?.uid === reply.authorId && (
                                                                  <button 
                                                                      onClick={() => promptDeleteReply(review.id, reply.id)}
                                                                      style={{background:'none', border:'none', cursor:'pointer', fontSize:'0.8rem', opacity:0.5}}
                                                                      title="Delete"
                                                                  >
                                                                      ❌
                                                                  </button>
                                                              )}
                                                          </div>
                                                      </div>
                                                      <p style={{margin: 0, fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.5}}>{reply.text}</p>
                                                  </div>
                                              </div>
                                          </div>
                                      ))}
                                  </div>
                              ) : (
                                  <div style={{opacity: 0.6, fontStyle: 'italic', padding:'24px 0', textAlign: 'center', color: 'var(--text-secondary)'}}>No replies yet.</div>
                              )}

                              {/* Reply Input Area */}
                              <div style={{marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border-subtle)'}}>
                                  <div style={{display: 'flex', gap: 12}}>
                                      <input 
                                          type="text" 
                                          placeholder="Write a reply..." 
                                          value={replyText[review.id] || ''}
                                          onChange={(e) => setReplyText(prev => ({...prev, [review.id]: e.target.value}))}
                                          style={{
                                              flex: 1, padding: '12px 16px', borderRadius: '24px', 
                                              border: '1px solid var(--border-subtle)', background: 'var(--bg-root)',
                                              color: 'var(--text-primary)', outline: 'none'
                                          }}
                                          onKeyDown={(e) => {
                                              if (e.key === 'Enter') {
                                                  e.preventDefault();
                                                  submitReply(review.id);
                                              }
                                          }}
                                      />
                                      <button 
                                          onClick={() => submitReply(review.id)}
                                          disabled={!replyText[review.id]}
                                          style={{
                                              background: replyText[review.id] ? 'var(--primary-gradient)' : 'var(--bg-root)',
                                              color: replyText[review.id] ? 'white' : 'var(--text-muted)',
                                              border: replyText[review.id] ? 'none' : '1px solid var(--border-subtle)',
                                              padding: '0 20px', borderRadius: '24px', cursor: replyText[review.id] ? 'pointer' : 'default',
                                              fontWeight: 600, transition: 'all 0.2s'
                                          }}
                                      >
                                          Send
                                      </button>
                                  </div>
                              </div>
                          </div>
                      )}
                    </div>
                    );
                })}
            </div>

            {/* Premium Delete Modal */}
            <PremiumModal 
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal(prev => ({ ...prev, isOpen: false }))}
                title={deleteModal.type === 'review' ? "Delete Review?" : "Delete Reply?"}
                message={deleteModal.type === 'review' 
                    ? "This will permanently remove your review. This action cannot be undone."
                    : "Are you sure you want to delete this reply?"}
                type="danger"
                confirmText="Delete"
                onConfirm={confirmDelete}
            />

            {/* Premium Flag Modal - With Input */}
            <PremiumModal 
                isOpen={flagModal.isOpen}
                onClose={() => setFlagModal({ isOpen: false, id: null })}
                title="Flag Content"
                message="Please provide a reason for flagging this content (optional)."
                type="input"
                inputPlaceholder="e.g. Inappropriate language, Spam..."
                confirmText="Flag Content"
                cancelText="Cancel"
                onConfirm={confirmFlag}
            />

            {/* Success/Alert Modal */}
            <PremiumModal
                isOpen={successModal.isOpen}
                onClose={() => setSuccessModal({ isOpen: false, message: '' })}
                title="Notification"
                message={successModal.message}
                type="alert"
                confirmText="OK"
                onConfirm={() => setSuccessModal({ isOpen: false, message: '' })}
            />
        </div>
    );
};

export default ReviewList;
