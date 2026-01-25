import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function RatedInstructors({ instructors }) {
  const navigate = useNavigate();

  if (!instructors?.length) return <div className="empty-state">No rated instructors yet.</div>;

  return (
    <div className="discovery-grid-premium" style={{
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
        gap: '30px', padding: '10px'
    }}>
      {instructors.map((inst) => (
        <div key={inst.instructorId || inst.instructorName} className="premium-card" style={{minHeight: '380px', display: 'flex', flexDirection: 'column', height: '100%'}}>
           <div className="card-content" style={{flex: 1, display: 'flex', flexDirection: 'column'}}>
             <div className="avatar-container" style={{marginBottom: 20}}>
                <div className="premium-avatar" style={{
                    width: 100, height: 100, // Explicit larger size
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0,
                    margin: '0 auto',
                    borderRadius: '50%',
                    border: '4px solid rgba(255,255,255,0.05)',
                    boxShadow: '0 8px 20px rgba(0,0,0,0.2)'
                }}>
                  {inst.photoURL ? (
                    <img 
                        src={inst.photoURL} 
                        alt={inst.instructorName} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                  ) : (
                    <span style={{fontSize: '2.5rem', fontWeight: 700, color: 'white'}}>
                        {(inst.instructorName || 'I').charAt(0)}
                    </span>
                  )}
                </div>
             </div>

             <div className="instructor-info-premium" style={{marginBottom: 24, textAlign: 'center'}}>
                <h4 className="instructor-name-gradient" style={{fontSize: '1.4rem', marginBottom: 8}}>{inst.instructorName}</h4>
                <p className="dept-name-premium" style={{fontSize: '0.9rem', marginBottom: 16}}>{inst.deptName}</p>
                
                <div className="rating-pill" style={{padding: '6px 16px', fontSize: '1.1rem'}}>
                   <span className="star-icon" style={{fontSize: '1.2rem'}}>★</span>
                   <span className="rating-score">{inst.lastRating}</span>
                </div>
                
                <div className="engagement-badge" style={{
                    marginTop: 12, display: 'inline-block',
                    background: 'rgba(99, 102, 241, 0.1)', color: '#818cf8', 
                    borderColor: 'rgba(99, 102, 241, 0.2)', padding: '6px 12px', fontSize: '0.8rem'
                }}>
                    Rated {inst.count} times
                </div>
             </div>

             <div style={{marginTop: 'auto'}}>
                 <button 
                    className="view-profile-btn-premium"
                    style={{width: '100%', padding: '14px', fontSize: '1rem', borderRadius: '16px'}}
                    onClick={() => navigate(`/instructor/${encodeURIComponent(inst.instructorId)}`)}
                 >
                    View Profile
                 </button>
             </div>
           </div>
        </div>
      ))}
    </div>
  );
}
