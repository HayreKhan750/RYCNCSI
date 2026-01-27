import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchInstructorProfile } from '../../../store/slices/instructorSlice';
import { selectInstructorById } from '../../../store/selectors/instructorSelectors';
import FeedbackStream from '../FeedbackStream';
import { ArrowLeft, Edit3, Mail, BookOpen, UserCheck, ShieldCheck, Award, TrendingUp, Users } from 'lucide-react';
import Header from '../../common/Header';
import './InstructorExecutiveProfile.css';

const InstructorExecutiveProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    
    const { recentFeedback } = useSelector(state => state.management);
    const { data: activeProfileData } = useSelector(state => state.instructors.activeProfile);
    const ReduxInstructor = useSelector(state => selectInstructorById(state, id));
    
    React.useEffect(() => {
        if (!ReduxInstructor && (!activeProfileData || activeProfileData.id !== id)) {
            dispatch(fetchInstructorProfile(id));
        }
    }, [dispatch, id, ReduxInstructor, activeProfileData]);

    // Data Merging
    const rawData = ReduxInstructor || activeProfileData || {};
    
    const instructor = {
        ...rawData,
        displayName: rawData.displayName || rawData.name || rawData.instructorName || 'Instructor',
        email: rawData.email || 'No email provided',
        department: rawData.department || rawData.Dept || 'General Department',
        rating: rawData.rating || rawData.avgRating || 0,
        bio: rawData.bio || `Instructor in the ${rawData.department || 'General'} department. Dedicated to student success.`,
        photoURL: rawData.photoURL || rawData.profilePictureUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(rawData.displayName || rawData.name || 'INS')}&background=random&size=200`,
        courses: Array.isArray(rawData.courses) ? rawData.courses : [],
        isVerified: rawData.isRegistered || false,
        role: rawData.role || 'Instructor'
    };

    // Use profile-specific ratings if available, otherwise fallback to global filter
    const feedback = activeProfileData?.ratings || recentFeedback.filter(f => f.instructorId === id);

    // Calculate Trend Data
    const trendPath = useMemo(() => {
         if (feedback.length < 2) return null;
         const sorted = [...feedback].sort((a,b) => a.timestamp - b.timestamp);
         const points = sorted.map((f, i) => {
             const x = (i / (sorted.length - 1)) * 500;
             const y = 200 - ((f.rating / 5) * 200);
             return `${x},${y}`;
         }).join(' L ');
         return `M ${points}`;
    }, [feedback]);

    return (
        <div className="iep-container">
            <Header title={instructor.department ? instructor.department.toUpperCase() : ''} showBack={true} />
            
            {/* Banner Section */}
            <div className="iep-banner-wrapper">
                <div className="iep-banner"></div>
                {/* Back button removed (moved to Header) */}
            </div>

            {/* Header Content */}
            <div className="iep-header-content">
                <div className="iep-avatar-wrapper">
                    <img src={instructor.photoURL} alt="Profile" className="iep-avatar" />
                </div>
                <div className="iep-identity">
                    <h1 className="iep-name">{instructor.displayName}</h1>
                    <div className="iep-badge-row">
                        <span className="iep-badge">
                            <BookOpen size={14} /> {instructor.department}
                        </span>
                        {instructor.isVerified && (
                             <span className="iep-badge verified">
                                <ShieldCheck size={14} /> Verified Faculty
                             </span>
                        )}
                        <span className="iep-badge">
                            {instructor.courses.length} Courses
                        </span>
                    </div>
                </div>
            </div>

            {/* Main Grid */}
            <div className="iep-grid">
                {/* Left Column: Info & Bio */}
                <div className="iep-col-left">
                     {/* Bio Card */}
                    <div className="iep-card" style={{background: 'rgba(30, 41, 59, 0.7)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.05)'}}>
                        <h3 className="iep-card-title">About</h3>
                        <p style={{lineHeight: 1.6, color: '#ecf0f1', fontSize: '1rem'}}>
                            {instructor.bio}
                        </p>
                    </div>

                    {/* Contact Card */}
                    <div className="iep-card" style={{background: 'rgba(30, 41, 59, 0.7)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.05)'}}>
                        <h3 className="iep-card-title">Contact Info</h3>
                        <div className="iep-info-row">
                            <Mail className="iep-info-icon" style={{color: '#818cf8'}} />
                            <div className="iep-info-content">
                                <h4 style={{color: '#94a3b8'}}>Email Address</h4>
                                <p style={{color: 'white'}}>{instructor.email}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Stats & Feedback */}
                <div className="iep-col-right">
                    {/* Stats Row */}
                    <div className="iep-stats-row">
                         <div className="iep-stat-card">
                             <div className="iep-stat-val">{instructor.rating.toFixed(1)}</div>
                             <div className="iep-stat-label">Avg Rating</div>
                         </div>
                         <div className="iep-stat-card">
                             <div className="iep-stat-val">{feedback.length}</div>
                             <div className="iep-stat-label">Reviews</div>
                         </div>
                          <div className="iep-stat-card">
                             <div className="iep-stat-val">A+</div>
                             <div className="iep-stat-label">Engagement</div>
                         </div>
                    </div>

                    {/* Analytics Chart */}
                    <div className="iep-card">
                         <div className="iep-card-title">
                             <span>Performance Traiectory</span>
                             <TrendingUp size={18} color="#4ade80" />
                         </div>
                         <div className="iep-chart-container" style={{position: 'relative'}}>
                            {/* Simple SVG Chart */}
                            <svg width="100%" height="100%" viewBox="0 0 500 200" preserveAspectRatio="none">
                                <defs>
                                    <linearGradient id="grad1" x1="0%" y1="0%" x2="0%" y2="100%">
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
                                        <path d={`${trendPath} L 500 200 L 0 200 Z`} fill="url(#grad1)" />
                                        <path d={trendPath} fill="none" stroke="#818cf8" strokeWidth="3" strokeLinecap="round" />
                                    </>
                                ) : (
                                    <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fill="#64748b">
                                        Not enough data yet
                                    </text>
                                )}
                            </svg>
                         </div>
                    </div>

                    {/* Feedback Stream */}
                    <div className="iep-card">
                        <h3 className="iep-card-title">Student Feedback</h3>
                        <FeedbackStream feedback={feedback} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InstructorExecutiveProfile;
