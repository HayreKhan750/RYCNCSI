import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useInstructorProfile } from '../hooks/useInstructorProfile';
import ProfileHeader from './instructor/ProfileHeader';
import CoursesList from './instructor/CoursesList';
import RatingsList from './instructor/RatingsList';
import AnalyticsDashboard from './instructor/AnalyticsDashboard';
import ProfileEditForm from './instructor/ProfileEditForm';
import { fetchReplies, postReply } from '../utils/feedbackInteractions';
import './Profile.css';

export default function InstructorProfile() {
  const { user } = useSelector((state) => state.auth);
  const { id: routeInstructorId } = useParams();
  
  const {
    profile,
    myCourses,
    myRatings,
    stats,
    loading,
    repliesByFeedback,
    setRepliesByFeedback,
    updateProfile
  } = useInstructorProfile(user, routeInstructorId);

  const [activeSection, setActiveSection] = useState('courses');
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  const handleSaveProfile = async (formData, imageFile) => {
    setSavingProfile(true);
    await updateProfile(formData, imageFile);
    setSavingProfile(false);
    setIsEditing(false);
  };

  const handlePostReply = async (feedbackId, text, parentId) => {
    if (!user) return;
    try {
      const authorRole = profile?.role || 'instructor';
      await postReply({
        feedbackId,
        authorId: user.uid,
        authorRole,
        authorName: profile?.name || user.displayName || user.email,
        text,
        parentReplyId: parentId,
      });
      
      // Refresh replies
      const list = await fetchReplies(feedbackId);
      setRepliesByFeedback((prev) => ({ ...prev, [feedbackId]: list }));
    } catch (err) {
      console.error("Failed to post reply", err);
    }
  };

  if (loading) {
    return <div className="profile-container" style={{ padding: 20 }}>Loading profile...</div>;
  }

  return (
    <div className="profile-container">
      <ProfileHeader 
        profile={profile} 
        stats={{
            averageRating: stats.averageRating,
            totalRatings: stats.totalRatings,
            myCoursesCount: myCourses.length
        }}
        onEdit={(!routeInstructorId || routeInstructorId === user?.uid || (user?.email && routeInstructorId?.toLowerCase() === user.email.toLowerCase())) ? () => setIsEditing(true) : null} 
        isEditing={isEditing} 
      />

      {isEditing && (
        <ProfileEditForm 
            profile={profile} 
            onSave={handleSaveProfile} 
            onCancel={() => setIsEditing(false)} 
            saving={savingProfile} 
        />
      )}

      <div className="profile-tabs">
        <button
          className={`profile-tab ${activeSection === 'courses' ? 'active' : ''}`}
          onClick={() => setActiveSection('courses')}
        >
          My Courses ({myCourses.length})
        </button>
        <button
          className={`profile-tab ${activeSection === 'ratings' ? 'active' : ''}`}
          onClick={() => setActiveSection('ratings')}
        >
          Student Ratings ({myRatings.length})
        </button>
        <button
          className={`profile-tab ${activeSection === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveSection('analytics')}
        >
          Performance & Insights
        </button>
      </div>

      <div className="profile-content">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search courses or ratings..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        {activeSection === 'courses' && (
          <CoursesList courses={myCourses} searchTerm={searchTerm} />
        )}

        {activeSection === 'ratings' && (
          <RatingsList 
            ratings={myRatings} 
            searchTerm={searchTerm} 
            repliesByFeedback={repliesByFeedback}
            onPostReply={handlePostReply}
            user={user}
          />
        )}

        {activeSection === 'analytics' && (
          <AnalyticsDashboard 
            myCourses={myCourses} 
            myRatings={myRatings} 
            stats={stats} 
          />
        )}
      </div>
    </div>
  );
}
