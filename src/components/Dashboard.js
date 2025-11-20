import React, { useEffect, useState } from 'react';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { auth, BYPASS_AUTH, db } from '../firebase';
import { collection, getDocs, limit, orderBy, query, where, getCountFromServer } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import RatingFeedback from './RatingFeedback';
import RateInstructor from './student/RateInstructor';
import MyRatings from './student/MyRatings';
import EditProfile from './EditProfile';
import StudentProfile from './StudentProfile';
import InstructorProfile from './InstructorProfile';
import AdminPanel from './AdminPanel';
import './Dashboard.css';
import { useNotifications } from '../contexts/NotificationsContext';
import { requestNotificationsPermission } from '../firebaseMessaging';

export default function Dashboard() {
  const { user, profile, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const navigate = useNavigate();

  const [overview, setOverview] = useState({ totalRated: 0, avgGiven: 0, recent: [] });
  const { unreadCount } = useNotifications() || { unreadCount: 0 };

  const role = profile?.role || 'student';
  const isStudent = role === 'student';
  const isInstructor = role === 'instructor';
  const isAdmin = role === 'admin';

  const handleSignOut = async () => {
    if (BYPASS_AUTH) {
      window.location.href = '/';
      return;
    }
    try {
      await signOut(auth);
      navigate('/');
    } catch (err) {
      console.error('Sign out failed', err);
    }
  };

  // Load student overview metrics
  useEffect(() => {
    const loadOverview = async () => {
      if (!user || role !== 'student') return;
      try {
        const baseQ = query(collection(db, 'feedbacks'), where('studentId', '==', user.uid));
        const countSnap = await getCountFromServer(baseQ);
        const total = countSnap.data().count || 0;

        // compute avg on last 100 docs to reduce load (full aggregation could be done server-side)
        const avgQ = query(
          collection(db, 'feedbacks'),
          where('studentId', '==', user.uid),
          orderBy('createdAt', 'desc'),
          limit(100)
        );
        const avgSnap = await getDocs(avgQ);
        const avgRows = avgSnap.docs.map(d => d.data());
        const avg = avgRows.length ? (avgRows.reduce((a, r) => a + (r.overall || 0), 0) / avgRows.length) : 0;

        const recentQ = query(
          collection(db, 'feedbacks'),
          where('studentId', '==', user.uid),
          orderBy('createdAt', 'desc'),
          limit(5)
        );
        const recentSnap = await getDocs(recentQ);
        const recent = recentSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        setOverview({ totalRated: total, avgGiven: Math.round(avg * 10) / 10, recent });
      } catch (e) {
        // fail silently to avoid blocking dashboard
        setOverview({ totalRated: 0, avgGiven: 0, recent: [] });
      }
    };
    loadOverview();
  }, [user, role]);

  if (loading && !user) {
    return (
      <div className="dashboard-container" style={{ padding: 16 }}>
        Loading your dashboard…
      </div>
    );
  }

  const getTabs = () => {
    const tabs = [];
    
    if (isStudent) {
      tabs.push(
        { id: 'dashboard', label: 'Dashboard', icon: '📊' },
        { id: 'profile', label: 'Edit Profile', icon: '👤' },
        { id: 'rating', label: 'Rate Courses', icon: '⭐' },
        { id: 'myratings', label: 'My Ratings', icon: '🗂️' },
        { id: 'help', label: 'Help / FAQ', icon: '❓' }
      );
    } else if (isInstructor) {
      tabs.push(
        { id: 'dashboard', label: 'Dashboard', icon: '📊' },
        { id: 'profile', label: 'My Profile', icon: '👤' },
        { id: 'rating', label: 'View Ratings', icon: '⭐' }
      );
    } else if (isAdmin) {
      tabs.push(
        { id: 'dashboard', label: 'Dashboard', icon: '📊' },
        { id: 'admin', label: 'Admin Panel', icon: '⚙️' },
        { id: 'rating', label: 'All Ratings', icon: '⭐' },
        { id: 'help', label: 'Help / FAQ', icon: '❓' }
      );
    } else {
      // Default to student experience if role is unknown
      tabs.push(
        { id: 'dashboard', label: 'Dashboard', icon: '📊' },
        { id: 'profile', label: 'My Profile', icon: '👤' },
        { id: 'rating', label: 'Rate Courses', icon: '⭐' },
        { id: 'myratings', label: 'My Ratings', icon: '🗂️' },
        { id: 'help', label: 'Help / FAQ', icon: '❓' }
      );
    }
    
    return tabs;
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="dashboard-welcome">
            <h2>Welcome, {user?.displayName || user?.email}!</h2>
            <p className="user-role">Role: <span className="role-badge">{role || 'Student'}</span></p>
            
            {isStudent && (
              <div className="dashboard-cards">
                <div className="dashboard-card">
                  <h3>✅ Total Instructors Rated</h3>
                  <p style={{ fontSize: 28, fontWeight: 700 }}>{overview.totalRated}</p>
                </div>
                <div className="dashboard-card">
                  <h3>⭐ Average Rating You Gave</h3>
                  <p style={{ fontSize: 28, fontWeight: 700 }}>{overview.avgGiven || 0}★</p>
                </div>
                <div className="dashboard-card">
                  <h3>🧑‍🏫 Rate New Instructor</h3>
                  <p>Provide feedback on your courses and instructors</p>
                  <button onClick={() => setActiveTab('rating')} className="card-button">Rate Now</button>
                </div>
              </div>
            )}

            {isStudent && overview.recent?.length > 0 && (
              <div style={{ marginTop: 24, textAlign: 'left' }}>
                <h3 style={{ color: '#1f2937' }}>Recent Activity</h3>
                <ul style={{ listStyle: 'none', padding: 0, marginTop: 12 }}>
                  {overview.recent.map(r => (
                    <li key={r.id} style={{ padding: '12px 16px', background: '#fff', borderRadius: 10, border: '1px solid #e5e7eb', marginBottom: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 600 }}>{r.courseCode || r.courseTitle || r.courseId}</div>
                          <div style={{ fontSize: 13, color: '#6b7280' }}>{r.instructorName || r.instructorId}</div>
                        </div>
                        <div style={{ fontWeight: 600 }}>{(r.overall || 0)}★</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {isInstructor && (
              <div className="dashboard-cards">
                <div className="dashboard-card">
                  <h3>📖 My Courses</h3>
                  <p>Manage your courses and view student enrollments</p>
                  <button onClick={() => setActiveTab('profile')} className="card-button">
                    View Courses
                  </button>
                </div>
                <div className="dashboard-card">
                  <h3>⭐ View Ratings</h3>
                  <p>See ratings and feedback from students</p>
                  <button onClick={() => setActiveTab('rating')} className="card-button">
                    View Ratings
                  </button>
                </div>
              </div>
            )}

            {isAdmin && (
              <div className="dashboard-cards">
                <div className="dashboard-card">
                  <h3>⚙️ Admin Panel</h3>
                  <p>Manage users, courses, and system settings</p>
                  <button onClick={() => setActiveTab('admin')} className="card-button">
                    Open Admin Panel
                  </button>
                </div>
                <div className="dashboard-card">
                  <h3>⭐ All Ratings</h3>
                  <p>View and manage all course ratings and feedback</p>
                  <button onClick={() => setActiveTab('rating')} className="card-button">
                    View All Ratings
                  </button>
                </div>
                <div className="dashboard-card">
                  <h3>📊 Statistics</h3>
                  <p>View system statistics and reports</p>
                  <button onClick={() => setActiveTab('admin')} className="card-button">
                    View Statistics
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      
      case 'profile':
        if (isStudent) {
          return <EditProfile />;
        } else if (isInstructor) {
          return <InstructorProfile />;
        }
        return <div>Profile page coming soon...</div>;
      
      case 'rating':
        // Prefer the Firestore-backed RateInstructor by default
        if (isInstructor) return <div>Ratings view coming soon…</div>;
        return <RateInstructor />;
      
      case 'myratings':
        return <MyRatings />;
      
      case 'admin':
        if (isAdmin) {
          return <AdminPanel />;
        }
        return <div>Access denied. Admin privileges required.</div>;
      
      case 'help':
        return (
          <div>
            <h2>Help / FAQ</h2>
            <p>For support, contact admin@cncs.edu</p>
            <ul>
              <li>How to rate: Go to "Rate Courses", select department → instructor → course, then submit ratings.</li>
              <li>Editing ratings: Open "My Ratings" and click Edit.</li>
              <li>Deleting ratings: Open "My Ratings" and click Delete.</li>
            </ul>
          </div>
        );
      
      default:
        return <div>Page not found</div>;
    }
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-left">
          <h2>Rate Your CNCS Instructors</h2>
          <p className="user-info">
            {user?.displayName || user?.email}
            {role && <span className="role-indicator">({role})</span>}
          </p>
        </div>
        <div className="header-actions">
          <button className="icon-btn" title={`Notifications${unreadCount ? ` (${unreadCount})` : ''}`} onClick={requestNotificationsPermission}>
            🔔{unreadCount ? <span style={{ marginLeft: 6, background:'#ef4444', color:'#fff', borderRadius: 8, padding: '0 6px', fontSize: 12 }}>{unreadCount}</span> : null}
          </button>
          <div className="avatar" title={user?.displayName || user?.email}>
            {user?.photoURL ? (
              <img src={user.photoURL} alt="avatar" />
            ) : (
              <span>{(user?.displayName?.[0] || user?.email?.[0] || 'S').toUpperCase()}</span>
            )}
          </div>
          <button onClick={handleSignOut} className="sign-out-button">Sign out</button>
        </div>
      </header>

      <div className="dashboard-layout">
        <aside className="dashboard-sidebar">
          <div className="sidebar-title">Menu</div>
          <div className="sidebar-nav">
            {getTabs().map((tab) => (
              <button
                key={tab.id}
                className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="tab-icon">{tab.icon}</span>
                <span className="tab-label">{tab.label}</span>
              </button>
            ))}
            <button className="nav-tab" onClick={handleSignOut}>
              <span className="tab-icon">🚪</span>
              <span className="tab-label">Logout</span>
            </button>
          </div>
        </aside>
        <section className="dashboard-content">
          {renderContent()}
        </section>
      </div>
    </div>
  );
}
