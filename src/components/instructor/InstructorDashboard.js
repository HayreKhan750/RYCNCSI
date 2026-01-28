import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import useInstructorProfile from '../../hooks/useInstructorProfile';
import ReviewList from '../common/ReviewList'; // Imported for full reviews tab
import EditProfileModal from '../instructor-profile/EditProfileModal'; // Import Modal
import { instructorService } from '../../services/instructorService';
import Header from '../common/Header';
import MetricsGrid from './MetricsCards'; // Renamed import for clarity
import PerformanceAnalytics from './PerformanceAnalytics';
import AIInsightCard from './AIInsightCard';
import RecentFeedbackPanel from './RecentFeedbackPanel';
import DashboardHero from './DashboardHero'; // Premium Hero

import { TrendingUp } from 'lucide-react'; 
import './InstructorDashboard.css';

import { generateInstructorReport } from '../../utils/AppReportGenerator';


const InstructorDashboard = () => {
    const { user } = useSelector(state => state.auth);
    const { mode } = useSelector(state => state.theme || { mode: 'light' });
    const { 
        profile, 
        stats, 
        feedbacks,
        loading,
        error, // Get error from hook
        updateProfile // Needed for Edit Modal
    } = useInstructorProfile();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = React.useState('overview');
    const [isEditOpen, setIsEditOpen] = React.useState(false); // Modal State

    // Mock Badges (In real app, derive from stats)
    const badges = [
        { label: 'Top Rated', icon: '🏅' },
        { label: 'Highly Engaging', icon: '🔥' },
        { label: 'Quick Responder', icon: '⚡' }
    ];

    const handleDownloadingReport = () => {
        if (!profile) return;
        generateInstructorReport(profile, stats, feedbacks);
    };

    // Calculate Trend Data (Ported from Executive Profile)
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

    if (loading) {
        return (
            <div className="dashboard-loading">
                <div className="spinner"></div>
                <p style={{ marginTop: 10, color: '#666' }}>Loading Dashboard...</p>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="dashboard-error">
                <h2>Unable to Load Profile</h2>
                <p>We couldn't fetch your instructor data.</p>
                {/* DISPLAY ACTUAL ERROR */}
                {error && (
                    <div className="auth-alert" style={{maxWidth:400, margin:'10px auto'}}>
                        ⚠ Debug: {error}
                    </div>
                )}
                {!error && <p>This might be a connection issue or a permission error.</p>}
                
                 <div className="flex gap-4 mt-4" style={{flexDirection:'column', alignItems:'center'}}>
                     {/* RECOVERY BUTTON */}
                     {error && error.includes('found') && (
                         <button 
                            onClick={() => {
                                const { createInstructorProfile } = require('../../store/slices/instructorSlice');
                                const { useDispatch } = require('react-redux');
                                // Note: We can't easily hook in here without Refactoring. 
                                // Simpler: Redirect to a "Setup" page or reload.
                                // Actually, let's just make the button call a window function or use a simple inline dispatch if possible, 
                                // but hooks rule prevents that.
                                // BETTER: Just tell them to re-register or use valid dispatch if I can get it.
                                // BETTER: Just tell them to re-register or use valid dispatch if I can get it.
                                // WAIT - I am inside the component, I have 'dispatch' available via hook? No, I need to get it.
                                navigate('/instructor/setup?mode=recovery');
                            }} 
                            className="btn-header-action"
                            style={{background: '#10b981', borderColor: '#10b981'}}
                         >
                            Initialize Missing Profile
                         </button>
                     )}
                     
                     <div className="flex gap-4">
                        <button onClick={() => window.location.reload()} className="btn-header-action">Retry Connection</button>
                        <button onClick={() => navigate('/dashboard')} className="btn-header-action secondary">Go to Home</button>
                     </div>
                </div>
            </div>
        );
    }

    return (
        <div className="instructor-dashboard-container" data-theme={mode}>
            <Header title="Instructor Portal" />

            <div className="dashboard-content">
                
                {/* 0. WELCOME HEADER (Floating) */}
                <div className="dashboard-welcome-section" style={{display:'flex', justifyContent:'space-between', alignItems:'flex-end'}}>
                    <div>
                        <h1 className="welcome-title-premium">
                            Welcome back, <span className="text-gradient-premium">{profile?.fullName?.split(' ')[0] || 'Instructor'}</span>
                        </h1>
                        <p className="welcome-date">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>

                    {/* Report Button Moved Here */}
                    <button 
                        onClick={handleDownloadingReport}
                        className="btn-premium"
                        style={{
                            display:'flex', alignItems:'center', gap: 8, 
                            padding: '10px 20px', borderRadius: '50px', fontSize: '0.9rem',
                            background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)'
                        }}
                    >
                        <span style={{fontSize:'1.1rem'}}>📥</span> Export Report
                    </button>
                </div>

                {/* 0.5 HERO PROFILE (Persistent) */}
                <div style={{marginBottom: '2rem'}}>
                    <DashboardHero 
                        profile={profile} 
                        stats={stats} 
                        badges={badges} 
                        onEdit={() => setIsEditOpen(true)}
                    />
                </div>

                {/* TAB NAVIGATION */}
                <div style={{
                    display:'flex', gap: 30, marginBottom: 25, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 0
                }}>
                    {['Overview', 'Reviews'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => {
                                const key = tab.toLowerCase();
                                setActiveTab(key);
                            }}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: activeTab === tab.toLowerCase() ? '#60a5fa' : 'rgba(255,255,255,0.6)',
                                padding: '10px 0',
                                fontSize: '1rem',
                                fontWeight: 500,
                                cursor: 'pointer',
                                borderBottom: activeTab === tab.toLowerCase() ? '2px solid #60a5fa' : '2px solid transparent',
                                transition: 'all 0.2s'
                            }}
                        >
                            {tab === 'Reviews' ? 'Reviews (' + (feedbacks?.length || 0) + ')' : tab}
                        </button>
                    ))}
                </div>

                {/* TAB CONTENT RENDERER */}
                
                {/* 1. OVERVIEW TAB */}
                {activeTab === 'overview' && (
                    <div className="ultra-bento-grid">
                        
                        {/* AREA: BIO (Moved to Top) */}
                        <div className="bento-panel glass-effect p-6" style={{gridColumn: '1 / -1', marginBottom: '1.5rem'}}>
                            <h3 className="panel-title-premium mb-4">About Me</h3>
                            <p style={{color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '1rem'}}>
                                {profile?.bio || profile?.about || "Welcome to my instructor profile! I'm passionate about teaching and helping students succeed. Check back here for updates on my courses and teaching philosophy."}
                            </p>
                        </div>

                        {/* NEW SPLIT ROW: AI + GRAPH */}
                        <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                            
                            {/* 1. AI Insights */}
                            <div className="grid-area-stats" style={{ flex: 1, minWidth: '350px' }}>
                               {/* Calculate Top Traits from Feedbacks */}
                               {(() => {
                                   // Simple Tag Frequency Analysis
                                   const tagCounts = {};
                                   feedbacks?.forEach(f => {
                                       if (f.tags && Array.isArray(f.tags)) {
                                           f.tags.forEach(t => {
                                               tagCounts[t] = (tagCounts[t] || 0) + 1;
                                           });
                                       }
                                   });
                                   const sortedTags = Object.entries(tagCounts)
                                       .sort((a,b) => b[1] - a[1])
                                       .slice(0, 3)
                                       .map(([tag]) => tag);
                                    
                                   return (
                                       <AIInsightCard topTraits={sortedTags} />
                                   );
                               })()}
                            </div>

                            {/* 2. Performance Graph */}
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
                        



                        
                        {/* Removed Control Centre entirely as requested */}
                    </div>
                )}

                {/* 2. REVIEWS TAB */}
                {activeTab === 'reviews' && (
                    <div className="bento-panel glass-effect" style={{padding: '20px'}}>
                         <ReviewList 
                            reviews={feedbacks || []} 
                            instructorId={user?.uid} 
                            isInstructorView={true} 
                        />
                    </div>
                )}


                {/* MODAL RENDERER */}
                {isEditOpen && (
                    <EditProfileModal 
                        profile={profile} 
                        email={user?.email || profile?.email} 
                        currentPhotoURL={profile?.profilePictureUrl || profile?.photoURL || (profile?.uid === user?.uid ? user?.photoURL : null)}
                        onSave={updateProfile} 
                        onClose={() => setIsEditOpen(false)} 
                    />
                )}
            </div>
        </div>
    );
};

export default InstructorDashboard;
