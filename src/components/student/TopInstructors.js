import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getCountFromServer, getAggregateFromServer, sum, average, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';

export default function TopInstructors({ instructors }) {
  const navigate = useNavigate();
  const [hydratedInstructors, setHydratedInstructors] = useState(instructors);

  // Client-Side Hydration to fix "0.0" ratings if backend aggregation fails
  useEffect(() => {
      if (!instructors?.length) return;

      const hydrateStats = async () => {
          const updated = await Promise.all(instructors.map(async (inst) => {
              // If we already have stats, skip
              if (inst.ratingStats?.totalRatings > 0) return inst;

              // Otherwise, fetch real stats from feedbacks
              try {
                  const q = query(collection(db, 'feedbacks'), where('instructorId', '==', inst.id));
                  const snap = await getDocs(q);
                  
                  if (snap.empty) return inst;

                  const ratings = snap.docs.map(d => d.data().rating || d.data().overall || 0);
                  const total = ratings.length;
                  const avg = total > 0 ? ratings.reduce((a, b) => a + b, 0) / total : 0;

                  return {
                      ...inst,
                      ratingStats: {
                          totalRatings: total,
                          average: avg
                      }
                  };
              } catch (e) {
                  return inst;
              }
          }));
          setHydratedInstructors(updated);
      };

      hydrateStats();
  }, [instructors]);


  if (!hydratedInstructors?.length) return (
      <div style={{
          padding: 40, textAlign: 'center', opacity: 0.6, 
          color: 'var(--text-secondary)', fontStyle: 'italic',
          background: 'rgba(255,255,255,0.02)', borderRadius: 20
      }}>
          No data available.
      </div>
  );

  const getDisplayName = (inst) => {
      if (inst.displayName) return inst.displayName;
      if (inst.fullName) return inst.fullName;
      if (inst.name) return inst.name;
      if (inst.instructorName && !inst.instructorName.includes('@')) return inst.instructorName;
      if (inst.instructorName && inst.instructorName.includes('@')) return inst.instructorName.split('@')[0];
      return 'Instructor';
  };

  return (
    <div className="discovery-grid-premium" style={{
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
        gap: '30px', padding: '10px'
    }}>
      {hydratedInstructors.map((inst, index) => {
        const rating = inst.ratingStats?.average || inst.avgRating || 0;
        const count = inst.ratingStats?.totalRatings || inst.reviewCount || 0;
        const isHighEngagement = (inst.engagementScore || 0) > 80;
        
        return (
        <div key={inst.id || index} className={`premium-card rank-${index + 1}`} style={{
            position: 'relative', overflow: 'hidden', minHeight: '400px', display: 'flex', flexDirection: 'column',
            background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.4) 100%)',
            border: '1px solid rgba(255,255,255,0.08)', borderRadius: '32px',
            boxShadow: '0 20px 40px -10px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease'
        }}
        onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-8px)';
            e.currentTarget.style.boxShadow = '0 30px 60px -15px rgba(99,102,241,0.25), inset 0 1px 0 rgba(255,255,255,0.1)';
        }}
        onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 20px 40px -10px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)';
        }}
        >
           {/* Rank Badge */}
           <div style={{
               position: 'absolute', top: 0, right: 0, 
               background: index === 0 ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 
                           index === 1 ? 'linear-gradient(135deg, #94a3b8, #64748b)' : 
                           index === 2 ? 'linear-gradient(135deg, #b45309, #78350f)' : 'rgba(255,255,255,0.1)',
               color: 'white', padding: '12px 24px', borderRadius: '0 32px 0 24px',
               fontWeight: 800, fontSize: '1.2rem', boxShadow: '-5px 5px 15px rgba(0,0,0,0.2)', zIndex: 10
           }}>
             #{index + 1}
           </div>
           
           <div className="card-content" style={{padding: '40px 24px 30px', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
             
             {/* Avatar Area */}
             <div className="avatar-container" style={{marginBottom: 24, position: 'relative'}}>
                <div style={{
                    width: 110, height: 110, borderRadius: '50%', padding: 4,
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.1), transparent)',
                    boxShadow: index === 0 ? '0 0 30px rgba(245, 158, 11, 0.3)' : '0 0 20px rgba(99, 102, 241, 0.2)'
                }}>
                    <div style={{
                        width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', 
                        background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      {(inst.photoURL || inst.profilePictureUrl) ? (
                        <img 
                            src={inst.photoURL || inst.profilePictureUrl} 
                            alt={getDisplayName(inst)} 
                            referrerPolicy="no-referrer"
                            crossOrigin="anonymous"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        />
                      ) : (
                        <span style={{fontSize: '2.5rem', fontWeight: 700, color: '#94a3b8'}}>
                            {getDisplayName(inst).charAt(0)}
                        </span>
                      )}
                    </div>
                </div>
             </div>

             {/* Info Area */}
             <div className="instructor-info-premium" style={{textAlign: 'center', width: '100%', marginBottom: 'auto'}}>
                <h4 style={{
                    margin: '0 0 8px', fontSize: '1.5rem', fontWeight: 700, 
                    background: 'linear-gradient(90deg, #fff, #cbd5e1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
                }}>
                    {getDisplayName(inst)}
                </h4>
                
                <p style={{
                    margin: '0 0 20px', fontSize: '0.9rem', color: '#94a3b8', 
                    textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 500
                }}>
                    {inst.department || 'General Department'}
                </p>
                
                {/* Stats Pill */}
                <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 10,
                    padding: '8px 20px', borderRadius: '50px',
                    background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)',
                    marginBottom: 16
                }}>
                   <span style={{color: '#fbbf24', fontSize: '1.2rem'}}>★</span>
                   <span style={{color: 'white', fontWeight: 700, fontSize: '1.1rem'}}>{rating.toFixed(1)}</span>
                   <span style={{color: '#94a3b8', fontSize: '0.9rem'}}>({count} reviews)</span>
                </div>

                {isHighEngagement && (
                    <div style={{
                        marginTop: 8, fontSize: '0.75rem', color: '#fca5a5', 
                        fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px'
                    }}>
                        🔥 High Engagement
                    </div>
                )}
             </div>

             {/* Action Button */}
             <div style={{width: '100%', marginTop: 24}}>
                 <button 
                    onClick={() => navigate(`/instructor/${encodeURIComponent(inst.id)}`)}
                    style={{
                        width: '100%', padding: '14px', borderRadius: '16px', border: 'none',
                        background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                        color: 'white', fontSize: '1rem', fontWeight: 600, cursor: 'pointer',
                        boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)', transition: 'all 0.2s',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                    }}
                    onMouseEnter={e => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.background = 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)'; // Darker/Richer on hover
                        e.currentTarget.style.boxShadow = '0 8px 20px rgba(99, 102, 241, 0.4)';
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.background = 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)'; // Reset
                        e.currentTarget.style.boxShadow = '0 4px 15px rgba(99, 102, 241, 0.3)';
                    }}
                 >
                    View Profile <span>→</span>
                 </button>
             </div>
           </div>
        </div>
      )})}
    </div>
  );
}
