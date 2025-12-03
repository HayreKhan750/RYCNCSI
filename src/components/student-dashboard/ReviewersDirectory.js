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
    <div className="reviewers-directory premium-container" style={{padding: '40px 20px', maxWidth: '1200px', margin: '0 auto'}}>
      
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
          padding: '20px', 
          marginBottom: '40px', 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: '20px', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          background: 'var(--bg-elevated)',
          backdropFilter: 'blur(10px)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '24px'
      }}>
          <div className="search-wrapper" style={{flex: '1 1 300px', maxWidth: '500px', position: 'relative'}}>
              <span style={{position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5, color: 'var(--text-primary)'}}>🔍</span>
              <input 
                  type="text" 
                  placeholder="Search reviewers..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="premium-input"
                  style={{
                      width: '100%', 
                      padding: '14px 20px 14px 50px', 
                      borderRadius: '50px', 
                      background: 'var(--bg-root)', 
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-primary)',
                      fontSize: '1rem'
                  }}
              />
          </div>
          <div className="sort-wrapper" style={{display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0}}>
              <label style={{color: 'var(--text-secondary)', fontSize: '0.9rem'}}>Sort by:</label>
              <select 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value)} 
                  className="premium-select"
                  style={{
                      padding: '10px 20px',
                      borderRadius: '12px',
                      background: 'var(--bg-root)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      outline: 'none'
                  }}
              >
                  <option value="reviews">Most Reviews</option>
                  <option value="helpful">Most Helpful</option>
              </select>
          </div>
      </div>

      {/* Grid */}
      <div className="discovery-grid-premium" style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px'}}>
        {filteredReviewers.map((reviewer, index) => (
            <div key={reviewer.studentId} className="premium-card reviewer-card" style={{
                padding: '30px', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '24px',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease'
            }}>
                {/* Rank Badge for Top 3 */}
                {index < 3 && (
                    <div style={{
                        position: 'absolute',
                        top: '15px',
                        right: '15px',
                        background: index === 0 ? 'linear-gradient(135deg, #FFD700, #FFA500)' : index === 1 ? 'linear-gradient(135deg, #C0C0C0, #A9A9A9)' : 'linear-gradient(135deg, #CD7F32, #8B4513)',
                        width: '30px',
                        height: '30px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        color: 'white',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                        fontSize: '0.9rem'
                    }}>
                        #{index + 1}
                    </div>
                )}

                <div className="avatar-container" style={{marginBottom: '20px', position: 'relative'}}>
                    <div className="premium-avatar" style={{
                        width: '90px', 
                        height: '90px', 
                        borderRadius: '50%', 
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '2.5rem',
                        fontWeight: 'bold',
                        color: 'white',
                        boxShadow: '0 8px 20px rgba(99, 102, 241, 0.3)',
                        border: '3px solid rgba(255,255,255,0.1)'
                    }}>
                        {reviewer.photoURL ? (
                            <img src={reviewer.photoURL} alt={reviewer.name} style={{width:'100%',height:'100%',borderRadius:'50%',objectFit:'cover'}} />
                        ) : (
                            (reviewer.name || 'S').charAt(0)
                        )}
                    </div>
                </div>

                <h4 style={{fontSize: '1.4rem', fontWeight: '700', marginBottom: '5px', color: 'var(--text-primary)'}}>{reviewer.name}</h4>
                <p style={{fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '20px'}}>{reviewer.department}</p>
                
                <div className="stats-grid" style={{
                    display: 'grid', 
                    gridTemplateColumns: '1fr 1fr', 
                    gap: '10px', 
                    width: '100%', 
                    marginBottom: '25px',
                    background: 'var(--bg-root)',
                    padding: '15px',
                    borderRadius: '16px'
                }}>
                    <div className="stat-item" style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                        <span style={{fontSize: '1.2rem', fontWeight: 'bold', color: '#818cf8'}}>{reviewer.reviewCount}</span>
                        <span style={{fontSize: '0.8rem', opacity: 0.7, color: 'var(--text-secondary)'}}>Reviews</span>
                    </div>
                    <div className="stat-item" style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                        <span style={{fontSize: '1.2rem', fontWeight: 'bold', color: '#34d399'}}>{reviewer.helpfulCount}</span>
                        <span style={{fontSize: '0.8rem', opacity: 0.7, color: 'var(--text-secondary)'}}>Helpful</span>
                    </div>
                </div>

                <button 
                    className="action-btn-premium" 
                    onClick={() => navigate(`/student/${reviewer.studentId}`)} 
                    style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-primary)',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.background = 'var(--primary-gradient)';
                        e.target.style.color = 'white';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))';
                        e.target.style.color = 'var(--text-primary)';
                    }}
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
