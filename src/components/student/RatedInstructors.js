import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function RatedInstructors({ instructors }) {
  const navigate = useNavigate();

  if (!instructors?.length) return <div className="empty-state">No rated instructors yet.</div>;

  return (
    <div className="discovery-grid-premium" style={{
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', // Fits 3 comfortably
        gap: '16px', padding: '10px'
    }}>
      {instructors.map((inst) => (
        <div key={inst.instructorId || inst.instructorName} className="glass-card" style={{
            minHeight: '200px', // Ultra Compact
            display: 'flex', flexDirection: 'column', 
            height: '100%',
            padding: '16px', 
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '16px',
            boxShadow: '0 4px 15px -5px rgba(0,0,0,0.2)',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            cursor: 'default'
        }}
        onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-3px)';
            e.currentTarget.style.boxShadow = '0 8px 25px -5px rgba(0,0,0,0.3)';
        }}
        onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 15px -5px rgba(0,0,0,0.2)';
        }}
        >
           <div className="card-content" style={{flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
             
             {/* Avatar -- Ultra Compact */}
             <div className="avatar-container" style={{marginBottom: 10, position: 'relative'}}>
                <div style={{
                    width: 50, height: 50, // 50px size
                    borderRadius: '50%',
                    padding: 2,
                    background: 'var(--card-gradient, linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.02)))',
                    border: '1px solid rgba(255,255,255,0.1)',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                }}>
                    <div style={{
                        width: '100%', height: '100%', borderRadius: '50%',
                        overflow: 'hidden', background: 'var(--bg-root)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      {inst.photoURL ? (
                        <img 
                            src={inst.photoURL} 
                            alt={inst.instructorName} 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }}
                        />
                      ) : null}
                      <span style={{
                          display: inst.photoURL ? 'none' : 'flex',
                          fontSize: '1.2rem', fontWeight: 700, 
                          background: 'var(--primary-gradient)',
                          width: '100%', height: '100%',
                          alignItems: 'center', justifyContent: 'center',
                          color: 'white'
                      }}>
                          {(inst.instructorName || 'I').charAt(0)}
                      </span>
                    </div>
                </div>
             </div>

             <div className="instructor-info-premium" style={{marginBottom: 10, textAlign: 'center', width: '100%'}}>
                <h4 style={{
                    fontSize: '0.95rem', marginBottom: 2, fontWeight: 700,
                    background: 'linear-gradient(to right, #fff, #94a3b8)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    letterSpacing: '-0.2px',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                }}>
                    {inst.instructorName}
                </h4>
                <p style={{
                    fontSize: '0.7rem', color: '#818cf8', textTransform: 'uppercase', 
                    letterSpacing: '0.5px', fontWeight: 600, marginBottom: 6
                }}>
                    {inst.deptName}
                </p>
                
                <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    padding: '3px 8px', borderRadius: '50px',
                    background: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.2)'
                }}>
                   <span style={{color: '#fbbf24', fontSize: '0.8rem'}}>★</span>
                   <span style={{color: '#fbbf24', fontWeight: 700, fontSize: '0.8rem'}}>{inst.lastRating}</span>
                   <span style={{color: 'rgba(251, 191, 36, 0.6)', fontSize: '0.7rem', marginLeft: 2}}>
                       ({inst.count})
                   </span>
                </div>
             </div>

             <div style={{marginTop: 'auto', width: '100%'}}>
                 <button 
                    style={{
                        width: '100%', padding: '8px', 
                        borderRadius: '10px', border: 'none',
                        background: 'rgba(255,255,255,0.05)',
                        color: 'var(--text-primary)',
                        fontSize: '0.8rem', fontWeight: 600,
                        cursor: 'pointer', transition: 'all 0.2s',
                        border: '1px solid rgba(255,255,255,0.05)'
                    }}
                    onMouseEnter={e => {
                        e.currentTarget.style.background = 'var(--primary-gradient)';
                        e.currentTarget.style.color = 'white';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                        e.currentTarget.style.color = 'var(--text-primary)';
                        e.currentTarget.style.transform = 'translateY(0)';
                    }}
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
