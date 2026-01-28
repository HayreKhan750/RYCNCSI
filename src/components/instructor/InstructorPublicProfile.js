import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import useInstructorProfile from '../../hooks/useInstructorProfile';
import DashboardHero from './DashboardHero';
import ReviewList from '../common/ReviewList';
import Header from '../common/Header';

import EditProfileModal from './EditProfileModal';
import MessageModal from './MessageModal';
import AIInsightCard from './AIInsightCard';
import { TrendingUp } from 'lucide-react';
import { useMemo } from 'react';
import './InstructorDashboard.css';

const InstructorPublicProfile = () => {
    const { id } = useParams();
    const { user } = useSelector(state => state.auth);
    
    // If no ID is provided, and we are an instructor, show our own profile (preview mode)
    // If ID is provided, fetch that instructor.
    const targetId = id || user?.uid;

    const { 
        profile, 
        stats, 
        feedbacks, 
        loading,
        updateProfile 
    } = useInstructorProfile(targetId);

    // Calculate Trend Data (Ported from InstructorDashboard)
    const trendPath = useMemo(() => {
         const validFeedbacks = feedbacks || [];
         if (validFeedbacks.length < 2) return null;
         
         const sorted = [...validFeedbacks].sort((a,b) => (a.createdAt || 0) - (b.createdAt || 0)); // Sort by date
         
         const points = sorted.map((f, i) => {
             const rating = f.rating || f.ratingValue || 0;
             const x = (i / (sorted.length - 1)) * 500;
             const y = 200 - ((rating / 5) * 200);
             return `${x},${y}`;
         }).join(' L ');
         return `M ${points}`;
    }, [feedbacks]);

    const [activeTab, setActiveTab] = useState('overview'); 
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isMessageOpen, setIsMessageOpen] = useState(false);

    // Edit Check: Can edit if it's my own profile
    const canEdit = user?.uid && (user.uid === profile?.userId || user.uid === profile?.id || user.uid === targetId);
    
    // Hide back button if viewing own profile (acts as dashboard)
    const isOwnProfile = user?.uid === targetId;

    if (loading) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
    );

    if (!profile) return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-500">
            <h2 className="text-xl font-bold mb-2">Instructor Not Found</h2>
            <p>The profile you are looking for does not exist or is unavailable.</p>
        </div>
    );

    const badges = [
        { label: 'Top Rated', icon: '🏅' },
        { label: 'Verified Faculty', icon: '🎓' }
    ];

    return (
        <div className="instructor-dashboard-container pb-20">
             {/* Conditionally render header based on if it's a student viewing or instructor previewing */}
             <Header title="Instructor Profile" showBack={!isOwnProfile} />

             <div className="dashboard-content max-w-[1280px] mx-auto w-full px-6">
                {/* 1. HERO */}
                <DashboardHero profile={profile} stats={stats} badges={badges} />

                {/* 2. NAVIGATION TABS */}
                <div className="profile-tabs-nav">
                    <button 
                        onClick={() => setActiveTab('overview')}
                        className={`profile-tab-item ${activeTab === 'overview' ? 'active' : ''}`}
                    >
                        Overview
                    </button>
                    <button 
                         onClick={() => setActiveTab('reviews')}
                         className={`profile-tab-item ${activeTab === 'reviews' ? 'active' : ''}`}
                    >
                        Reviews ({stats?.reviewCount || 0})
                    </button>
                </div>

                {/* 3. CONTENT AREA */}
                <motion.div 
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    {activeTab === 'overview' && (
                        <div className="profile-layout-grid-premium">
                            {/* TOP: About Me */}
                            <div className="premium-card profile-card" style={{gridColumn: '1 / -1', marginBottom: '1.5rem'}}>
                                <h3 className="profile-section-title">About Me</h3>
                                <p className="profile-bio-text">
                                    {profile.bio || "No biography provided yet."}
                                </p>
                                <div className="profile-tags-row">
                                    {stats?.topTags?.slice(0,3).map((tag, i) => (
                                        <span key={i} className="profile-tag-pill">#{tag}</span>
                                    ))}
                                </div>
                            </div>
                            
                            {/* SPLIT ROW: AI + GRAPH */}
                            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', width: '100%' }}>
                                
                                {/* 1. AI Insights */}
                                <div className="grid-area-stats" style={{ flex: 1, minWidth: '350px' }}>
                                   <AIInsightCard topTraits={stats?.topTags?.slice(0,3)} />
                                </div>

                                <div className="bento-panel glass-effect p-6" style={{ flex: 1, minWidth: '350px', display: 'flex', flexDirection: 'column' }}>
                                     <div className="panel-title-premium mb-4" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                                         <span>Performance Trajectory</span>
                                         <TrendingUp size={18} color="#4ade80" />
                                     </div>
                                     <div className="iep-chart-container" style={{position: 'relative', height: '250px', width: '100%', flex: 1}}>
                                        {/* Simple SVG Chart (Reused Style) */}
                                        <svg width="100%" height="100%" viewBox="0 0 500 200" preserveAspectRatio="none">
                                            <defs>
                                                <linearGradient id="gradDash" x1="0%" y1="0%" x2="0%" y2="100%">
                                                    <stop offset="0%" stopColor="#818cf8" stopOpacity={0.4} />
                                                    <stop offset="100%" stopColor="#818cf8" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            {/* Grid Lines */}
                                            <line x1="0" y1="150" x2="500" y2="150" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                                            <line x1="0" y1="100" x2="500" y2="100" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                                            <line x1="0" y1="50" x2="500" y2="50" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />

                                            {trendPath ? (
                                                <>
                                                    <path d={`${trendPath} L 500 200 L 0 200 Z`} fill="url(#gradDash)" />
                                                    <path d={trendPath} fill="none" stroke="#818cf8" strokeWidth="3" strokeLinecap="round" />
                                                </>
                                            ) : (
                                                <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fill="#64748b">
                                                    Not enough data yet for trajectory
                                                </text>
                                            )}
                                        </svg>
                                     </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'reviews' && (
                         <div className="premium-card reviews-container" style={{backdropFilter: 'none', WebkitBackdropFilter: 'none'}}>
                             <h3 className="profile-section-title">Student Reviews</h3>
                             <ReviewList 
                                reviews={feedbacks} 
                                instructorId={profile.id} 
                                isInstructorView={false} // Student View
                             />
                         </div>
                    )}

                </motion.div>
                
                {/* 4. MODALS */}
                {isEditOpen && canEdit && (
                    <EditProfileModal
                        profile={profile}
                        onSave={updateProfile}
                        onClose={() => setIsEditOpen(false)}
                    />
                )}
                
                <MessageModal 
                    isOpen={isMessageOpen}
                    onClose={() => setIsMessageOpen(false)}
                    instructorName={profile?.fullName?.split(' ')[0]}
                    instructorId={targetId}
                />
            </div>


             {/* Floating Edit Button (Mobile/Secondary) */}
             {canEdit && (
                 <button 
                    onClick={() => setIsEditOpen(true)}
                    className="floating-edit-btn"
                    title="Edit Profile"
                 >
                    ✏️
                 </button>
             )}
        </div>
    );
};

export default InstructorPublicProfile;
