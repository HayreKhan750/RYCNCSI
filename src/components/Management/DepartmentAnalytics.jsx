import { useNavigate } from 'react-router-dom';

const DepartmentAnalytics = ({ departments = [] }) => {
    const navigate = useNavigate();
    // If no data, use empty array or skeleton; mapping handles empty gracefully
    const maxRating = 5;

    return (
        <div className="glass-panel">
            <div className="panel-header">
                 <div>
                    <h2 className="panel-title">Department Performance</h2>
                    <p className="panel-subtitle">Rating vs. Engagement Heatmap</p>
                 </div>
                 <button className="link-btn" onClick={() => navigate('/management/departments')}>
                     View Full Report →
                 </button>
            </div>
            
            <div className="heatmap-list">
                {departments.map((dept) => {
                    // Determine color based on sentiment/rating
                    let barColor = 'var(--academic-blue)';
                    if (dept.rating >= 4.5) barColor = 'var(--success)';
                    else if (dept.rating < 3.5) barColor = 'var(--warning)';

                    return (
                    <div key={dept.name} className="dept-row">
                        <div className="dept-header">
                            <span className="dept-name">{dept.name}</span>
                            <span className="dept-score">{dept.rating} <span style={{fontSize: '0.8rem', color: '#94a3b8'}}>/ 5.0</span></span>
                        </div>
                        
                        <div className="progress-track">
                            <div 
                                className="progress-bar" 
                                style={{ width: `${(dept.rating / maxRating) * 100}%`, backgroundColor: barColor }}
                            ></div>
                        </div>
                        
                        <div className="dept-meta">
                             <span>{dept.students} Active Students</span>
                             <span style={{ color: barColor }}>{dept.sentiment} Sentiment</span>
                        </div>
                    </div>
                  );
                })}
            </div>
        </div>
    );
};

export default DepartmentAnalytics;
