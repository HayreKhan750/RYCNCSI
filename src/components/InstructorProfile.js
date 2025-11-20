import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, storage } from '../firebase';
import { collection, getDocs, query, where, doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import scheduleData from '../assets/my-file.optimized.json';
import './Profile.css';

export default function InstructorProfile() {
  const { user } = useAuth();
  const [myCourses, setMyCourses] = useState([]);
  const [myRatings, setMyRatings] = useState([]);
  const [activeSection, setActiveSection] = useState('courses');
  const [searchTerm, setSearchTerm] = useState('');

  // Profile info from Firestore users collection
  const [profile, setProfile] = useState(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: '',
    department: '',
    bio: '',
  });
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);

  // Load instructor's courses and ratings
  useEffect(() => {
    if (!user?.uid || !user?.email) {
      setMyCourses([]);
      setMyRatings([]);
      setProfile(null);
      return;
    }

    const loginEmail = String(user.email).toLowerCase();
    const courses = [];

    // scheduleData: { academic_year, semester, schedule: [ { department, courses: [...] } ] }
    const schedule = Array.isArray(scheduleData?.schedule) ? scheduleData.schedule : [];

    schedule.forEach((dept) => {
      const deptName = dept.department;
      const deptCourses = Array.isArray(dept.courses) ? dept.courses : [];

      deptCourses.forEach((course) => {
        // instructor can be array of { name, email } or a string
        let instructorsArr;
        if (Array.isArray(course.instructor)) {
          instructorsArr = course.instructor;
        } else if (course.instructor) {
          instructorsArr = [{ name: course.instructor, email: null }];
        } else {
          instructorsArr = [];
        }

        const teachesHere = instructorsArr.some((inst) =>
          inst?.email && String(inst.email).toLowerCase() === loginEmail
        );

        if (teachesHere) {
          courses.push({
            id: `${deptName || 'dept'}-${course.course_code || course.course_title}`,
            department: deptName,
            courseTitle: course.course_title,
            courseCode: course.course_code,
            lectureHours: course.lecture_hours,
            period: course.period,
            room: course.room,
            studentCount: course.student_count,
            instructors: instructorsArr,
          });
        }
      });
    });

    setMyCourses(courses);

    const loadProfileAndRatings = async () => {
      if (!db) {
        setProfile(null);
        setMyRatings([]);
        return;
      }

      try {
        // Load instructor profile from users collection
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        const userData = userSnap.exists() ? userSnap.data() : {};
        const mergedProfile = {
          name: userData.name || user.displayName || user.email,
          email: user.email,
          department: userData.department || '',
          bio: userData.bio || '',
          profilePictureUrl: userData.profilePictureUrl || '',
          role: userData.role || 'instructor',
        };
        setProfile(mergedProfile);
        setProfileForm({
          name: mergedProfile.name,
          department: mergedProfile.department,
          bio: mergedProfile.bio,
        });

        // Load ratings for this instructor from Firestore `feedbacks`
        const q = query(
          collection(db, 'feedbacks'),
          where('instructorId', '==', loginEmail),
        );
        const snap = await getDocs(q);
        const rows = snap.docs.map((d) => {
          const data = d.data() || {};
          return {
            id: d.id,
            courseTitle: data.courseTitle || null,
            courseNo: data.courseCode || null,
            rating: typeof data.overall === 'number' ? data.overall : 0,
            feedback: data.comment || '',
            timestamp: data.createdAt?.toMillis ? data.createdAt.toMillis() : Date.now(),
            tags: Array.isArray(data.tags) ? data.tags : [],
            likes: typeof data.likes === 'number' ? data.likes : 0,
          };
        });
        setMyRatings(rows);
      } catch (e) {
        setProfile(null);
        setMyRatings([]);
      }
    };

    loadProfileAndRatings();
  }, [user]);

  // Calculate statistics
  const averageRating = myRatings.length > 0
    ? (myRatings.reduce((sum, r) => sum + (r.rating || 0), 0) / myRatings.length).toFixed(2)
    : 0;

  const totalRatings = myRatings.length;

  // Aggregate tags and popular reviews
  const tagCounts = myRatings.reduce((acc, r) => {
    (r.tags || []).forEach((tag) => {
      const key = String(tag).trim();
      if (!key) return;
      acc[key] = (acc[key] || 0) + 1;
    });
    return acc;
  }, {});

  const topTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tag, count]) => ({ tag, count }));

  const popularReviews = [...myRatings]
    .filter((r) => r.feedback)
    .sort((a, b) => (b.likes || 0) - (a.likes || 0))
    .slice(0, 3);

  const filteredCourses = myCourses.filter(course => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      course.courseTitle?.toLowerCase().includes(search) ||
      course.courseNo?.toLowerCase().includes(search) ||
      course.section?.toLowerCase().includes(search)
    );
  });

  const filteredRatings = myRatings.filter(rating => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      rating.courseTitle?.toLowerCase().includes(search) ||
      rating.courseNo?.toLowerCase().includes(search) ||
      rating.feedback?.toLowerCase().includes(search)
    );
  });

  const handleProfileInputChange = (e) => {
    const { name, value } = e.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setProfileImageFile(e.target.files[0]);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!user?.uid || !db) return;
    setSavingProfile(true);

    try {
      let profilePictureUrl = profile?.profilePictureUrl || '';

      if (profileImageFile && storage) {
        const storageRef = ref(storage, `profilePictures/${user.uid}`);
        await uploadBytes(storageRef, profileImageFile);
        profilePictureUrl = await getDownloadURL(storageRef);
      }

      const userRef = doc(db, 'users', user.uid);
      const payload = {
        name: profileForm.name || profile?.name || user.email,
        email: user.email,
        role: profile?.role || 'instructor',
        department: profileForm.department || '',
        bio: profileForm.bio || '',
        profilePictureUrl,
        updatedAt: serverTimestamp(),
      };

      await setDoc(userRef, payload, { merge: true });
      setProfile((prev) => ({ ...(prev || {}), ...payload }));
      setEditingProfile(false);
      setProfileImageFile(null);
    } catch (err) {
      // Silently fail for now; could add UI error message
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-avatar instructor">
          {profile?.profilePictureUrl ? (
            <img
              src={profile.profilePictureUrl}
              alt={profile.name}
              style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
            />
          ) : (
            <span>{(profile?.name || user?.displayName || user?.email || 'I').charAt(0).toUpperCase()}</span>
          )}
        </div>
        <div className="profile-info">
          <h2>{profile?.name || user?.displayName || 'Instructor'}</h2>
          <p className="profile-email">{profile?.email || user?.email}</p>
          {profile?.department && (
            <p className="profile-id">Department: {profile.department}</p>
          )}
          <p className="profile-role">Role: Instructor</p>
          {profile?.bio && !editingProfile && (
            <p style={{ marginTop: '8px', maxWidth: '600px' }}>{profile.bio}</p>
          )}
          <div className="profile-stats">
            <div className="stat-item">
              <span className="stat-value">{myCourses.length}</span>
              <span className="stat-label">Courses</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{totalRatings}</span>
              <span className="stat-label">Ratings</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{averageRating}</span>
              <span className="stat-label">Avg Rating</span>
            </div>
          </div>
        </div>
      </div>

      <div className="profile-content" style={{ marginBottom: '20px' }}>
        <h3>My Profile</h3>
        {!editingProfile ? (
          <div>
            <p><strong>Name:</strong> {profile?.name || user?.displayName || 'Instructor'}</p>
            <p><strong>Email:</strong> {profile?.email || user?.email}</p>
            <p><strong>Department:</strong> {profile?.department || 'Not set'}</p>
            <p><strong>Bio:</strong> {profile?.bio || 'Add a short bio to tell students about yourself.'}</p>
            <button
              className="enroll-button"
              style={{ marginTop: '10px' }}
              onClick={() => setEditingProfile(true)}
            >
              Edit Profile
            </button>
          </div>
        ) : (
          <form onSubmit={handleSaveProfile} style={{ display: 'grid', gap: '10px', maxWidth: '600px' }}>
            <div>
              <label><strong>Name</strong></label>
              <input
                type="text"
                name="name"
                value={profileForm.name}
                onChange={handleProfileInputChange}
                className="search-input"
              />
            </div>
            <div>
              <label><strong>Department</strong></label>
              <input
                type="text"
                name="department"
                value={profileForm.department}
                onChange={handleProfileInputChange}
                className="search-input"
              />
            </div>
            <div>
              <label><strong>Bio</strong></label>
              <textarea
                name="bio"
                value={profileForm.bio}
                onChange={handleProfileInputChange}
                className="search-input"
                rows={3}
              />
            </div>
            <div>
              <label><strong>Profile Picture</strong></label>
              <input type="file" accept="image/*" onChange={handleProfileImageChange} />
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button type="submit" className="enroll-button" disabled={savingProfile}>
                {savingProfile ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                className="unenroll-button"
                onClick={() => {
                  setEditingProfile(false);
                  setProfileForm({
                    name: profile?.name || user?.displayName || '',
                    department: profile?.department || '',
                    bio: profile?.bio || '',
                  });
                  setProfileImageFile(null);
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

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
          <div className="courses-section">
            <h3>My Teaching Courses</h3>
            {filteredCourses.length === 0 ? (
              <div className="empty-state">
                <p>No courses found matching your search.</p>
              </div>
            ) : (
              <div className="courses-grid">
                {filteredCourses.map((course) => (
                  <div key={course.id} className="course-card">
                    <div className="course-card-header">
                      <h4>{course.courseTitle}</h4>
                      <span className="course-badge">{course.department}</span>
                    </div>
                    <div className="course-card-body">
                      <p><strong>Course Code:</strong> {course.courseCode}</p>
                      {course.department && <p><strong>Department:</strong> {course.department}</p>}
                      {course.lectureHours && <p><strong>Hours:</strong> {course.lectureHours}</p>}
                      {course.period && <p><strong>Period:</strong> {course.period}</p>}
                      {course.room && <p><strong>Room:</strong> {course.room}</p>}
                      {course.studentCount && <p><strong>Students:</strong> {course.studentCount}</p>}
                      {course.instructors && (
                        <p><strong>Instructors:</strong> {course.instructors.map((i) => i.name).join(', ')}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeSection === 'ratings' && (
          <div className="ratings-section">
            <h3>Student Ratings & Feedback</h3>
            {filteredRatings.length === 0 ? (
              <div className="empty-state">
                <p>No ratings received yet.</p>
              </div>
            ) : (
              <div className="ratings-list">
                {filteredRatings.map((rating, index) => (
                  <div key={index} className="rating-card">
                    <div className="rating-header">
                      <h4>{rating.courseTitle}</h4>
                      <span className="rating-stars">
                        {Array(5).fill(0).map((_, i) => (
                          <span key={i} className={i < rating.rating ? 'star-filled' : 'star-empty'}>
                            ★
                          </span>
                        ))}
                        <span className="rating-value">({rating.rating}/5)</span>
                      </span>
                    </div>
                    <p><strong>Course No:</strong> {rating.courseNo}</p>
                    {rating.feedback && (
                      <div className="rating-feedback">
                        <strong>Feedback:</strong>
                        <p>{rating.feedback}</p>
                      </div>
                    )}
                    <p className="rating-date">
                      Rated on: {new Date(rating.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeSection === 'analytics' && (
          <div className="analytics-section">
            <h3>Teaching Analytics</h3>
            <div className="analytics-grid">
              <div className="analytics-card">
                <h4>Total Courses</h4>
                <p className="analytics-value">{myCourses.length}</p>
              </div>
              <div className="analytics-card">
                <h4>Total Ratings</h4>
                <p className="analytics-value">{myRatings.length}</p>
              </div>
              <div className="analytics-card">
                <h4>Average Rating</h4>
                <p className="analytics-value">{averageRating} / 5.0</p>
              </div>
              <div className="analytics-card">
                <h4>Total Students</h4>
                <p className="analytics-value">
                  {myCourses.reduce((sum, c) => sum + (c.studentCount || 0), 0)}
                </p>
              </div>
            </div>

            {myRatings.length > 0 && (
              <div className="rating-distribution">
                <h4>Rating Distribution</h4>
                {[5, 4, 3, 2, 1].map(star => {
                  const count = myRatings.filter(r => r.rating === star).length;
                  const percentage = (count / myRatings.length) * 100;
                  return (
                    <div key={star} className="distribution-bar">
                      <span>{star}★</span>
                      <div className="bar-container">
                        <div className="bar-fill" style={{ width: `${percentage}%` }}></div>
                      </div>
                      <span>{count} ({percentage.toFixed(1)}%)</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}




