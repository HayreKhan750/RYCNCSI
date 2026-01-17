import React from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import useInstructorProfile from '../../hooks/useInstructorProfile';
import { instructorService } from '../../services/instructorService';
import Header from '../common/Header';
import MetricsGrid from './MetricsCards'; // Renamed import for clarity
import PerformanceAnalytics from './PerformanceAnalytics';
import AIInsightCard from './AIInsightCard';
import RecentFeedbackPanel from './RecentFeedbackPanel';
import DashboardHero from './DashboardHero'; // Premium Hero
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
        error // Get error from hook
    } = useInstructorProfile();
    const navigate = useNavigate();

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

            <div className="dashboard-content-premium">
                
                {/* 0. WELCOME HEADER (Floating) */}
                <div className="dashboard-welcome-section">
                    <h1 className="welcome-title-premium">
                        Welcome back, <span className="text-gradient-premium">{profile?.fullName?.split(' ')[0] || 'Instructor'}</span>
                    </h1>
                    <p className="welcome-date">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>

                {/* PREMIUM BENTO GRID (v3) */}
                <div className="ultra-bento-grid">
                    
                    {/* AREA: HERO (Profile Summary) */}
                    <div className="grid-area-hero">
                        <DashboardHero 
                            profile={profile} 
                            stats={stats} 
                            badges={badges} 
                        />
                    </div>

                    {/* AREA: STATS (Metrics) */}
                    <div className="grid-area-stats">
                        <MetricsGrid 
                            stats={stats || {}} 
                            onMetricClick={(type) => console.log('Metric clicked:', type)} 
                        />
                    </div>

                    {/* AREA: MAIN (Charts) */}
                    <div className="grid-area-charts bento-panel glass-effect">
                        <div className="panel-header-premium">
                            <h3 className="panel-title-premium">
                                <span className="icon-glow">📈</span> Engagement Trends
                            </h3>
                            <select className="premium-select-pill">
                                <option>This Semester</option>
                                <option>Last 6 Months</option>
                            </select>
                        </div>
                        <div className="chart-container-premium">
                            <PerformanceAnalytics />
                        </div>
                    </div>

                    {/* AREA: SIDEBAR (Quick Actions & Tools) */}
                    <div className="grid-area-sidebar">
                        
                        {/* Compact AI Card */}
                        <div className="sidebar-item">
                            <AIInsightCard />
                        </div>

                        {/* Quick Actions Restyled */}
                        <div className="sidebar-item bento-panel glass-effect p-6">
                            <h3 className="panel-title-premium mb-4">Control Centre</h3>
                            <div className="quick-actions-premium-list">
                                <button className="qa-item" onClick={() => navigate('/instructor/reviews')}>
                                    <div className="qa-icon-box blue">💬</div>
                                    <div className="qa-info">
                                        <span className="qa-label">Reviews</span>
                                        <span className="qa-sub">Respond</span>
                                    </div>
                                </button>
                                <button className="qa-item" onClick={() => navigate('/instructor/courses')}>
                                    <div className="qa-icon-box green">📚</div>
                                    <div className="qa-info">
                                        <span className="qa-label">Courses</span>
                                        <span className="qa-sub">Manage</span>
                                    </div>
                                </button>
                                <button className="qa-item" onClick={() => navigate(`/instructor/${user?.uid}`)}>
                                    <div className="qa-icon-box purple">👤</div>
                                    <div className="qa-info">
                                        <span className="qa-label">Profile</span>
                                        <span className="qa-sub">Edit</span>
                                    </div>
                                </button>
                                <button className="qa-item" onClick={handleDownloadingReport}>
                                    <div className="qa-icon-box pink">📥</div>
                                    <div className="qa-info">
                                        <span className="qa-label">Report</span>
                                        <span className="qa-sub">Export</span>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Term Report Callout */}
                         <div className="sidebar-item highlight-card-premium" onClick={handleDownloadingReport}>
                            <div className="glow-orb"></div>
                            <div className="hc-content">
                                <span className="hc-icon">📑</span>
                                <div className="hc-text">
                                    <span className="hc-title">Term Report Ready</span>
                                    <span className="hc-desc">Download your summary</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* AREA: FEEDBACK (Bottom Wide) */}
                    <div className="grid-area-feedback bento-panel glass-effect">
                        <div className="panel-header-premium">
                            <h3 className="panel-title-premium">
                                <span className="icon-glow">💬</span> Student Feedback
                            </h3>
                            <button className="link-btn-premium" onClick={() => navigate('/instructor/reviews')}>
                                View All →
                            </button>
                        </div>
                        <RecentFeedbackPanel />
                    </div>

                </div>
            </div>
        </div>
    );
};

export default InstructorDashboard;
