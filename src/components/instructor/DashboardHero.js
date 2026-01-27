import React from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import InstructorDashboardCSS from './InstructorDashboard.css'; // Ensure CSS is loaded

const getStatusColor = (badges = []) => {
    if (badges.find(b => b.label === 'Top Rated')) return 'text-amber-400';
    if (badges.find(b => b.label === 'Highly Engaging')) return 'text-indigo-400';
    return 'text-slate-400';
};

const DashboardHero = ({ profile, stats, badges, onEdit }) => {
    const { user } = useSelector(state => state.auth);
    const navigate = useNavigate();

    if (!profile) return null;

    // Use profile data first. If not available, and if in own-dashboard mode (checked via ID match or context), use auth user.
    // For safety, just prioritize profile.
    const displayName = profile.fullName || profile.name || (profile.uid === user?.uid ? user?.displayName : 'Instructor');
    const department = profile.department || profile.departmentId || 'Department of Computer Science'; 
    const profilePic = profile.profilePictureUrl || profile.photoURL || (profile.uid === user?.uid ? user?.photoURL : null) || `https://ui-avatars.com/api/?name=${displayName}&background=random`;

    // Calculate engagement score or use prop
    const engagementScore = stats?.engagementScore || (stats?.reviewCount * 1.5).toFixed(0) || 124;

    const handleEditClick = () => {
        if (onEdit) {
            onEdit();
        } else {
            navigate(`/instructor/${profile.uid || user?.uid}`);
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="dashboard-hero-premium"
        >
            <div className="hero-blur-bg"></div>
            
            <div className="hero-content-premium">
                {/* LEFT: Profile & Status */}
                <div className="hero-left">
                    <div className="hero-avatar-wrapper-lg">
                        <img src={profilePic} alt={displayName} className="hero-avatar-lg" />
                        <div className="hero-status-dot online" title="Active Now"></div>
                        
                        {/* Edit Button Overlay */}
                        <button 
                            onClick={handleEditClick}
                            title="Edit Profile"
                            style={{
                                position: 'absolute',
                                bottom: -5,
                                right: -5,
                                width: 32,
                                height: 32,
                                borderRadius: '50%',
                                background: '#6366f1', // Indigo 500
                                border: '2px solid white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                                color: 'white',
                                fontSize: '14px',
                                zIndex: 10
                            }}
                        >
                            ✏️
                        </button>
                    </div>
                    
                    <div className="hero-identity">
                        <h1 className="hero-name">{displayName}</h1>
                        <p className="hero-role">{department}</p>
                        
                        {badges && badges.length > 0 && (
                            <div className="hero-badge-pill">
                                <span className="badge-icon">{badges[0].icon}</span>
                                <span className={`badge-text ${getStatusColor(badges)}`}>{badges[0].label}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT: Key Performance Indicators */}
                <div className="hero-right">
                    <div className="hero-kpi-group">
                        <div className="hero-kpi">
                            <div className="kpi-value text-amber-400">
                                {Number(stats?.avgRating || 0).toFixed(1)}
                            </div>
                            <div className="kpi-label">Overall Rating</div>
                        </div>
                        
                        <div className="kpi-divider"></div>

                        <div className="hero-kpi">
                            <div className="kpi-value text-indigo-400">
                                {stats?.reviewCount || 0}
                            </div>
                            <div className="kpi-label">Total Reviews</div>
                        </div>

                        <div className="kpi-divider"></div>

                        <div className="hero-kpi">
                            <div className="kpi-value text-emerald-400">
                                {engagementScore}
                            </div>
                            <div className="kpi-label">Engagement</div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default DashboardHero;
