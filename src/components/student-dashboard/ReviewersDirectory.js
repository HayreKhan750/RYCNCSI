import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTopReviewers } from '../../store/slices/feedbackSlice';
import SkeletonLoader from '../common/SkeletonLoader';

export default function ReviewersDirectory() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { topReviewers } = useSelector((state) => state.feedbacks);
  
  // Local derived state for sorting/filtering
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('reviews'); // 'reviews' | 'helpful'

  useEffect(() => {
    // If we already have data, don't show full loading, just background refresh? 
    // Or just load once.
    const load = async () => {
        setLoading(true);
        try {
            await dispatch(fetchTopReviewers()).unwrap();
        } catch (e) {
            console.error("Failed to load reviewers", e);
        } finally {
            setLoading(false);
        }
    };
    load();
  }, [dispatch]);

  // Filter and Sort
  const filteredReviewers = topReviewers
    .filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
        if (sortBy === 'helpful') return b.helpfulCount - a.helpfulCount;
        return b.reviewCount - a.reviewCount;
    });

  if (loading && (!topReviewers || topReviewers.length === 0)) {
      return (
          <div className="premium-container" style={{padding: '40px 20px', maxWidth: '1200px', margin: '0 auto'}}>
              <div style={{textAlign: 'center', marginBottom: 40}}>
                  <SkeletonLoader width="300px" height="50px" style={{margin:'0 auto 20px'}} />
                  <SkeletonLoader width="500px" height="20px" style={{margin:'0 auto'}} />
              </div>
              <div className="discovery-grid-premium">
                  {[1,2,3,4,5,6].map(i => (
                      <SkeletonLoader key={i} height="300px" borderRadius="24px" />
                  ))}
              </div>
          </div>
      );
  }

  return (
    <div className="reviewers-directory premium-container" style={{padding: '100px 20px 40px', maxWidth: '1200px', margin: '0 auto'}}>
      
      {/* Hero Section */}
      <div style={{textAlign: 'center', marginBottom: '50px'}}>
          <h2 style={{
              fontSize: '3rem', 
              fontWeight: '800', 
              marginBottom: '10px', 
              background: 'linear-gradient(to right, var(--text-primary), #818cf8)', 
              WebkitBackgroundClip: 'text', 
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              color: 'transparent',
              letterSpacing: '-1px'
          }}>
              Top Reviewers
          </h2>
          <p style={{color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto'}}>
              Meet the community members making a difference with their valuable feedback.
          </p>
      </div>

      {/* Controls */}
      <div className="glass-card" style={{
          padding: '12px 24px', 
          marginBottom: '40px', 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: '20px', 
          alignItems: 'center', 
          justifyContent: 'space-between', // Push to edges
          background: 'var(--bg-elevated)',
          backdropFilter: 'blur(10px)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '50px', 
          width: '100%', 
          maxWidth: '800px', // Medium size container
          margin: '0 auto 40px' 
      }}>
          <div className="search-wrapper" style={{flex: '1', minWidth: '200px', maxWidth: '400px', position: 'relative'}}>
              <span style={{position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5, color: 'var(--text-primary)'}}>🔍</span>
              <input 
                  type="text" 
                  placeholder="Search reviewers..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="premium-input"
                  style={{
                      width: '100%', 
                      padding: '10px 16px 10px 40px', 
                      borderRadius: '50px', 
                      background: 'var(--bg-root)', 
                      border: '1px solid var(--border-subtle)', 
                      color: 'var(--text-primary)',
                      fontSize: '0.95rem'
                  }}
              />
          </div>
          
          <div className="sort-wrapper" style={{display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0}}>
              <label style={{color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500, whiteSpace: 'nowrap'}}>Sort by:</label>
              <select 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value)} 
                  className="premium-select"
                  style={{
                      padding: '8px 16px',
                      borderRadius: '12px',
                      background: 'transparent',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-primary)',
                      fontWeight: '500',
                      cursor: 'pointer',
                      outline: 'none',
                      fontSize: '0.9rem'
                  }}
              >
                  <option value="reviews">Most Reviews</option>
                  <option value="helpful">Most Helpful</option>
              </select>
          </div>
      </div>

      {/* Grid */}
      <div className="discovery-grid-premium courses-grid-override">
        {filteredReviewers.map((reviewer, index) => (
            <div key={reviewer.studentId} className="premium-card reviewer-card" style={{height: '100%'}}>
               <div className="card-content-row">
                   <div className="premium-avatar-small" style={{
                       overflow: 'hidden',
                       display: 'flex',
                       alignItems: 'center',
                       justifyContent: 'center',
                       padding: 0
                   }}>
                      {reviewer.photoURL ? (
                        <img 
                            src={reviewer.photoURL} 
                            alt={reviewer.name} 
                            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} 
                        />
                      ) : (
                        <img 
                            src={`https://ui-avatars.com/api/?name=${reviewer.name || 'Student'}&background=random&color=fff`} 
                            alt={reviewer.name} 
                            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} 
                        />
                      )}
                   </div>
                   <div className="reviewer-info">
                       <h4 className="reviewer-name">{reviewer.name || 'Student'}</h4>
                       <p className="reviewer-dept">{reviewer.department || 'Student'}</p>
                   </div>
               </div>
               
               <div className="stats-grid-premium">
                   <div className="stat-item-premium">
                       <span className="stat-icon">📝</span>
                       <span className="stat-val">{reviewer.reviewCount}</span>
                       <span className="stat-lbl">Reviews</span>
                   </div>
                   <div className="stat-item-premium">
                       <span className="stat-icon">👍</span>
                       <span className="stat-val">{reviewer.helpfulCount || 0}</span>
                       <span className="stat-lbl">Helpful</span>
                   </div>
               </div>

               <button 
                  className="view-profile-btn-premium small-btn" 
                  onClick={() => navigate(`/student/${reviewer.studentId}`)} 
               >
                  View Profile
               </button>
            </div>
        ))}
        
        {filteredReviewers.length === 0 && (
            <div className="empty-state" style={{gridColumn: '1/-1', textAlign: 'center', padding: 60, opacity: 0.6}}>
                <div style={{fontSize: '3rem', marginBottom: '20px'}}>🔍</div>
                <h3>No reviewers found</h3>
                <p>Try adjusting your search terms.</p>
            </div>
        )}
      </div>
    </div>
  );
}
