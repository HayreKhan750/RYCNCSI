import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import useInstructorProfile from '../../hooks/useInstructorProfile';
import DashboardHero from './DashboardHero';
import ReviewList from '../common/ReviewList';
import Header from '../common/Header';
import EditProfileModal from './EditProfileModal';
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

    const [activeTab, setActiveTab] = useState('overview'); 
    const [isEditOpen, setIsEditOpen] = useState(false);

    // Edit Check: Can edit if it's my own profile
    const canEdit = user?.uid && (user.uid === profile?.userId || user.uid === profile?.id || user.uid === targetId);

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
             <Header title="Instructor Profile" />

             <div className="dashboard-content max-w-5xl mx-auto w-full">
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
                    {/* Courses Tab (Future) */}
                    <button 
                         className="profile-tab-item disabled"
                         title="Coming Soon"
                    >
                        Courses
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
                        <div className="profile-layout-grid">
                            {/* LEFT: About */}
                            <div className="profile-left-col">
                                <section className="premium-card profile-card">
                                    <h3 className="profile-section-title">About Me</h3>
                                    <p className="profile-bio-text">
                                        {profile.bio || "No biography provided yet."}
                                    </p>
                                    
                                    {/* Traits / Tags */}
                                    <div className="profile-tags-row">
                                        {['Responsive', 'Clear Explanations', 'Subject Expert'].map((tag, i) => (
                                            <span key={i} className="profile-tag-pill">
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                </section>

                                {/* Teaching Stats (Visual) */}
                                <section>
                                    <h3 className="profile-section-title">Teaching Impact</h3>
                                    <div className="impact-stats-grid">
                                        <div className="impact-stat-card">
                                            <div className="impact-val indigo">{stats?.courseCount || 12}</div>
                                            <div className="impact-label">Courses</div>
                                        </div>
                                        <div className="impact-stat-card">
                                            <div className="impact-val emerald">{stats?.totalStudents || 450}+</div>
                                            <div className="impact-label">Students</div>
                                        </div>
                                        <div className="impact-stat-card">
                                            <div className="impact-val amber">{stats?.avgRating || "0.0"}</div>
                                            <div className="impact-label">Avg Rating</div>
                                        </div>
                                         <div className="impact-stat-card">
                                            <div className="impact-val rose">98%</div>
                                            <div className="impact-label">Response Rate</div>
                                        </div>
                                    </div>
                                </section>
                            </div>

                            {/* RIGHT: Contact / Details */}
                            <div className="profile-right-col">
                                <div className="premium-card connect-card">
                                    <div className="connect-content">
                                        <h3 className="connect-title">Connect</h3>
                                        <p className="connect-text">
                                            Have questions about a course? Send a direct message.
                                        </p>
                                        <button className="btn-message-instructor">
                                            Message Instructor
                                        </button>
                                    </div>
                                    {/* Deco */}
                                    <div className="deco-circle top-right"></div>
                                    <div className="deco-circle bottom-left"></div>
                                </div>
                                
                                <div className="premium-card info-card">
                                    <h3 className="info-card-title">Information</h3>
                                    <div className="info-rows">
                                        <div className="info-row">
                                            <span className="info-label">Department</span>
                                            <span className="info-val">{profile.department || "General"}</span>
                                        </div>
                                        <div className="info-row">
                                            <span className="info-label">Joined</span>
                                            <span className="info-val">September 2024</span>
                                        </div>
                                        <div className="info-row">
                                            <span className="info-label">Language</span>
                                            <span className="info-val">English, Amharic</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'reviews' && (
                         <div className="premium-card reviews-container">
                             <h3 className="profile-section-title">Student Reviews</h3>
                             <ReviewList 
                                reviews={feedbacks} 
                                instructorId={profile.id} 
                                isInstructorView={false} // Student View
                             />
                         </div>
                    )}
                </motion.div>
                
                {/* 4. EDIT MODAL */}
                {isEditOpen && canEdit && (
                    <EditProfileModal
                        profile={profile}
                        onSave={updateProfile}
                        onClose={() => setIsEditOpen(false)}
                    />
                )}
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
