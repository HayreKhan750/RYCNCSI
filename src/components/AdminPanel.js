import React, { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import scheduleData from '../assets/my-file.optimized.json';
import { db } from '../firebase';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import './AdminPanel.css';

export default function AdminPanel() {
  const { user, isAdmin } = useUser();
  const [activeTab, setActiveTab] = useState('overview');
  const [users, setUsers] = useState([]);
  const [allRatings, setAllRatings] = useState([]);
  const [statistics, setStatistics] = useState({
    totalUsers: 0,
    totalCourses: 0,
    totalRatings: 0,
    averageRating: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    // Load ratings from localStorage
    const ratings = JSON.parse(localStorage.getItem('courseRatings') || '{}');
    setAllRatings(Object.values(ratings));

    // Calculate statistics
    const totalCourses = Object.values(scheduleData).reduce((sum, section) => sum + section.length, 0);
    const totalRatings = Object.keys(ratings).length;
    const avgRating = totalRatings > 0
      ? (Object.values(ratings).reduce((sum, r) => sum + (r.rating || 0), 0) / totalRatings).toFixed(2)
      : 0;

    setStatistics({
      totalUsers: users.length,
      totalCourses,
      totalRatings,
      averageRating: avgRating,
    });

    // Load users from Firestore if available
    if (db) {
      try {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const usersData = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setUsers(usersData);
        setStatistics(prev => ({ ...prev, totalUsers: usersData.length }));
      } catch (error) {
        console.warn('Failed to load users from Firestore:', error);
      }
    }
  };

  const handleDeleteRating = (ratingKey) => {
    const ratings = JSON.parse(localStorage.getItem('courseRatings') || '{}');
    delete ratings[ratingKey];
    localStorage.setItem('courseRatings', JSON.stringify(ratings));
    loadData();
  };

  const handleUpdateUserRole = async (userId, newRole) => {
    if (!db) {
      alert('Firestore is not available. User role cannot be updated.');
      return;
    }

    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      alert('User role updated successfully!');
    } catch (error) {
      console.error('Error updating user role:', error);
      alert('Failed to update user role.');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    if (!db) {
      alert('Firestore is not available. User cannot be deleted.');
      return;
    }

    try {
      await deleteDoc(doc(db, 'users', userId));
      setUsers(users.filter(u => u.id !== userId));
      alert('User deleted successfully!');
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user.');
    }
  };

  if (!isAdmin) {
    return (
      <div className="admin-panel">
        <div className="access-denied">
          <h2>Access Denied</h2>
          <p>You need administrator privileges to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h2>Administrative Control Panel</h2>
        <p>Manage users, courses, and system settings</p>
      </div>

      <div className="admin-tabs">
        <button
          className={`admin-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          Users ({users.length})
        </button>
        <button
          className={`admin-tab ${activeTab === 'courses' ? 'active' : ''}`}
          onClick={() => setActiveTab('courses')}
        >
          Courses ({statistics.totalCourses})
        </button>
        <button
          className={`admin-tab ${activeTab === 'ratings' ? 'active' : ''}`}
          onClick={() => setActiveTab('ratings')}
        >
          All Ratings ({allRatings.length})
        </button>
        <button
          className={`admin-tab ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          Settings
        </button>
      </div>

      <div className="admin-content">
        {activeTab === 'overview' && (
          <div className="overview-section">
            <h3>System Overview</h3>
            <div className="stats-grid">
              <div className="stat-card">
                <h4>Total Users</h4>
                <p className="stat-value">{statistics.totalUsers}</p>
              </div>
              <div className="stat-card">
                <h4>Total Courses</h4>
                <p className="stat-value">{statistics.totalCourses}</p>
              </div>
              <div className="stat-card">
                <h4>Total Ratings</h4>
                <p className="stat-value">{statistics.totalRatings}</p>
              </div>
              <div className="stat-card">
                <h4>Average Rating</h4>
                <p className="stat-value">{statistics.averageRating} / 5.0</p>
              </div>
            </div>

            <div className="recent-activity">
              <h4>Recent Activity</h4>
              <div className="activity-list">
                {allRatings.slice(0, 10).map((rating, index) => (
                  <div key={index} className="activity-item">
                    <span>New rating for {rating.courseTitle}</span>
                    <span className="activity-date">
                      {new Date(rating.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="users-section">
            <h3>User Management</h3>
            <div className="users-table">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Student ID</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan="5">No users found. Users will appear here after they sign up.</td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user.id}>
                        <td>{user.displayName || 'N/A'}</td>
                        <td>{user.email}</td>
                        <td>
                          <select
                            value={user.role || 'student'}
                            onChange={(e) => handleUpdateUserRole(user.id, e.target.value)}
                            className="role-select"
                          >
                            <option value="student">Student</option>
                            <option value="instructor">Instructor</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td>{user.studentId || 'N/A'}</td>
                        <td>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="delete-button"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'courses' && (
          <div className="courses-section">
            <h3>Course Management</h3>
            <div className="courses-list">
              {Object.keys(scheduleData).map(section => (
                <div key={section} className="section-group">
                  <h4>{section} ({scheduleData[section].length} courses)</h4>
                  <div className="courses-grid">
                    {scheduleData[section].slice(0, 10).map((course, index) => (
                      <div key={index} className="course-card">
                        <h5>{course.courseTitle}</h5>
                        <p><strong>Course No:</strong> {course.courseNo}</p>
                        {course.instructors && <p><strong>Instructor:</strong> {course.instructors}</p>}
                        {course.room && <p><strong>Room:</strong> {course.room}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'ratings' && (
          <div className="ratings-section">
            <h3>All Ratings & Feedback</h3>
            <div className="ratings-list">
              {allRatings.length === 0 ? (
                <div className="empty-state">No ratings yet.</div>
              ) : (
                allRatings.map((rating, index) => {
                  const ratingKey = Object.keys(JSON.parse(localStorage.getItem('courseRatings') || '{}'))[index];
                  return (
                    <div key={index} className="rating-card">
                      <div className="rating-header">
                        <div>
                          <h4>{rating.courseTitle}</h4>
                          <p><strong>Course No:</strong> {rating.courseNo}</p>
                          {rating.instructors && <p><strong>Instructor:</strong> {rating.instructors}</p>}
                        </div>
                        <div className="rating-actions">
                          <span className="rating-stars">
                            {Array(5).fill(0).map((_, i) => (
                              <span key={i} className={i < rating.rating ? 'star-filled' : 'star-empty'}>
                                ★
                              </span>
                            ))}
                          </span>
                          <button
                            onClick={() => handleDeleteRating(ratingKey)}
                            className="delete-button"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      {rating.feedback && (
                        <div className="rating-feedback">
                          <p>{rating.feedback}</p>
                        </div>
                      )}
                      <p className="rating-date">
                        {new Date(rating.timestamp).toLocaleString()}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="settings-section">
            <h3>System Settings</h3>
            <div className="settings-form">
              <div className="setting-item">
                <label>Export Data</label>
                <button onClick={() => {
                  const data = {
                    users,
                    ratings: allRatings,
                    courses: scheduleData,
                  };
                  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `system-data-${new Date().toISOString()}.json`;
                  a.click();
                }} className="export-button">
                  Export All Data
                </button>
              </div>
              <div className="setting-item">
                <label>Clear All Ratings</label>
                <button onClick={() => {
                  if (window.confirm('Are you sure you want to clear all ratings? This cannot be undone.')) {
                    localStorage.removeItem('courseRatings');
                    loadData();
                    alert('All ratings cleared.');
                  }
                }} className="danger-button">
                  Clear Ratings
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}




