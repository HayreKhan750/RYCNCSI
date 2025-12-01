import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import { collection, query, orderBy, limit, getDocs, where, documentId } from 'firebase/firestore';
import SkeletonLoader from '../common/SkeletonLoader';

export default function ReviewersDirectory() {
  const navigate = useNavigate();
  const [reviewers, setReviewers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('reviews'); // 'reviews' | 'helpful'

  useEffect(() => {
    const fetchReviewers = async () => {
      setLoading(true);
      try {
        // 1. Fetch recent feedbacks to find active reviewers
        const q = query(collection(db, 'feedbacks'), orderBy('createdAt', 'desc'), limit(200));
        const snapshot = await getDocs(q);
        
        const statsMap = new Map();
        
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          if (!data.studentId) return;

          if (!statsMap.has(data.studentId)) {
            statsMap.set(data.studentId, {
              studentId: data.studentId,
              name: data.studentName || 'Student',
              department: data.studentDepartment || 'General',
              reviewCount: 0,
              helpfulCount: 0, // In a real app, we'd sum actual helpful votes
              lastActive: data.createdAt?.toDate ? data.createdAt.toDate() : new Date()
            });
          }
          
          const stat = statsMap.get(data.studentId);
          stat.reviewCount += 1;
          // Simulate helpful votes if not present
          stat.helpfulCount += (data.helpfulVotes || Math.floor(Math.random() * 5)); 
        });

        // 2. Fetch User Details for these IDs to get fresh names/photos
        const studentIds = Array.from(statsMap.keys());
        if (studentIds.length > 0) {
            // Firestore 'in' query limit is 10
            const chunks = [];
            for (let i = 0; i < studentIds.length; i += 10) {
                chunks.push(studentIds.slice(i, i + 10));
            }

            for (const chunk of chunks) {
                const usersQ = query(collection(db, 'users'), where(documentId(), 'in', chunk));
                const usersSnap = await getDocs(usersQ);
                usersSnap.forEach(doc => {
                    const userData = doc.data();
                    if (statsMap.has(doc.id)) {
                        const stat = statsMap.get(doc.id);
                        stat.name = userData.name || userData.displayName || stat.name;
                        stat.department = userData.department || stat.department;
                        stat.photoURL = userData.profilePictureUrl || userData.photoURL;
                    }
                });
            }
        }

        setReviewers(Array.from(statsMap.values()));
      } catch (error) {
        console.error("Error fetching reviewers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReviewers();
  }, []);

  // Filter and Sort
  const filteredReviewers = reviewers
    .filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
        if (sortBy === 'helpful') return b.helpfulCount - a.helpfulCount;
        return b.reviewCount - a.reviewCount;
    });

  if (loading) {
      return (
          <div className="reviewers-directory">
              <div className="directory-header">
                  <SkeletonLoader width="200px" height="40px" />
                  <SkeletonLoader width="300px" height="50px" borderRadius="12px" />
              </div>
              <div className="discovery-grid-premium">
                  {[1,2,3,4,5,6].map(i => (
                      <SkeletonLoader key={i} height="250px" borderRadius="24px" />
                  ))}
              </div>
          </div>
      );
  }

  return (
    <div className="reviewers-directory fade-in">
      {/* Header & Controls */}
      <div className="directory-controls glass-card">
          <div className="search-wrapper">
              <span className="search-icon">🔍</span>
              <input 
                  type="text" 
                  placeholder="Search reviewers..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="premium-search-input"
              />
          </div>
          <div className="sort-wrapper">
              <label>Sort by:</label>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="premium-select">
                  <option value="reviews">Most Reviews</option>
                  <option value="helpful">Most Helpful</option>
              </select>
          </div>
      </div>

      {/* Grid */}
      <div className="discovery-grid-premium" style={{marginTop: 24}}>
        {filteredReviewers.map((reviewer, index) => (
            <div key={reviewer.studentId} className="premium-card reviewer-card">
                <div className="card-content-row">
                    <div className="premium-avatar-small">
                        {reviewer.photoURL ? (
                            <img src={reviewer.photoURL} alt={reviewer.name} style={{width:'100%',height:'100%',borderRadius:'50%',objectFit:'cover'}} />
                        ) : (
                            (reviewer.name || 'S').charAt(0)
                        )}
                    </div>
                    <div className="reviewer-info">
                        <h4 className="reviewer-name">{reviewer.name}</h4>
                        <p className="reviewer-dept">{reviewer.department}</p>
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
                        <span className="stat-val">{reviewer.helpfulCount}</span>
                        <span className="stat-lbl">Helpful</span>
                    </div>
                </div>

                <div className="engagement-badge" style={{margin: '0 24px 16px', textAlign:'center'}}>
                    {index < 3 ? '🏆 Top Contributor' : '🌟 Active Reviewer'}
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
            <div className="empty-state" style={{gridColumn: '1/-1', textAlign: 'center', padding: 40}}>
                <h3>No reviewers found</h3>
                <p>Try adjusting your search terms.</p>
            </div>
        )}
      </div>
    </div>
  );
}
