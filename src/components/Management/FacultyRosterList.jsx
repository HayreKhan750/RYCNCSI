import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const InstructorInsights = ({ instructors = [] }) => {
    const navigate = useNavigate();
    const { deptName } = useParams();
    // Only show top 5
    const topList = instructors.slice(0, 5);

    return (
        <div className="glass-panel">
            <h2 className="panel-title" style={{ marginBottom: '24px' }}>Top Performing Faculty</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {topList.map((inst, idx) => (
                    <div 
                        key={inst.id || idx} 
                        className="rank-row"
                        style={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/management/instructor/${inst.id}`)}
                    >
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                             {/* Rank Badge */}
                             <div className={`rank-idx rank-${idx < 3 ? idx + 1 : 3}`}>
                                 #{idx + 1}
                             </div>

                             <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', marginRight: '12px', border: '2px solid var(--bg-root)' }}>
                                <img 
                                    src={inst.photoURL || `https://ui-avatars.com/api/?name=${inst.displayName || inst.name || inst.instructorName || 'Instructor'}&background=random`} 
                                    alt={inst.name} 
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                             </div>
                             <div className="instructor-info">
                                 <h4>{inst.displayName || inst.name || inst.instructorName}</h4>
                                 <div className="tag-list">
                                    <span className="tag" style={{ textTransform: 'uppercase' }}>{inst.department}</span>
                                 </div>
                             </div>
                        </div>
                        
                        <div className="dept-score" style={{ fontSize: '1.2rem', color: 'var(--success)' }}>
                            {inst.rating}
                        </div>
                    </div>
                ))}
            </div>
            
            <button 
                className="link-btn" 
                style={{ width: '100%', marginTop: '24px', textAlign: 'center' }}
                onClick={() => navigate(`/management/department/${deptName}/roster`)}
            >
                View All Rankings →
            </button>
        </div>
    );
};

export default InstructorInsights;
// Force refresh for roster link update
