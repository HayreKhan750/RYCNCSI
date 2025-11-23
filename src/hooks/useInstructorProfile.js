import { useState, useEffect } from 'react';
import { db, storage } from '../firebase';
import { collection, getDocs, query, where, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import scheduleData from '../assets/my-file.optimized.json';
import { fetchReplies } from '../utils/feedbackInteractions';

export function useInstructorProfile(user, routeInstructorId) {
  const instructorKey = (routeInstructorId || (user?.email || '')).toLowerCase();
  const [myCourses, setMyCourses] = useState([]);
  const [myRatings, setMyRatings] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [repliesByFeedback, setRepliesByFeedback] = useState({});
  
  // Statistics
  const [stats, setStats] = useState({
    averageRating: 0,
    totalRatings: 0,
    totalStudents: 0,
  });

  useEffect(() => {
    if (!user?.uid || !user?.email) {
      setMyCourses([]);
      setMyRatings([]);
      setProfile(null);
      setLoading(false);
      return;
    }

    const loadData = async () => {
      setLoading(true);
      try {
        let profileData = null;
        let emailForMatching = '';

        // 1. Fetch Profile First
        if (db) {
          // If routeInstructorId is provided, it's likely a UID. 
          // If not, use current user's UID.
          const targetUid = routeInstructorId || user.uid;
          
          const userRef = doc(db, 'users', targetUid);
          const userSnap = await getDoc(userRef);
          const userData = userSnap.exists() ? userSnap.data() : {};
          
          profileData = {
            name: userData.name || userData.displayName || user.displayName || 'Instructor',
            email: userData.email || user.email,
            department: userData.department || '',
            bio: userData.bio || '',
            profilePictureUrl: userData.profilePictureUrl || user.photoURL || '',
            role: userData.role || 'instructor',
            uid: targetUid
          };
          setProfile(profileData);
          emailForMatching = profileData.email;

          // 2. Fetch Ratings (from 'ratings' collection)
          const q = query(
            collection(db, 'ratings'),
            where('instructorId', '==', targetUid) // Match by UID
          );
          const snap = await getDocs(q);
          const rows = snap.docs.map((d) => {
            const data = d.data() || {};
            return {
              id: d.id,
              courseTitle: data.courseTitle || null,
              courseNo: data.courseCode || null,
              rating: typeof data.ratingValue === 'number' ? data.ratingValue : 0, // ratingValue from ratingService
              feedback: data.feedback || '',
              timestamp: data.createdAt?.toMillis ? data.createdAt.toMillis() : Date.now(),
              tags: Array.isArray(data.tags) ? data.tags : [],
              likes: typeof data.likes === 'number' ? data.likes : 0,
            };
          });
          setMyRatings(rows);

          // 3. Calculate Stats
          const avg = rows.length > 0
            ? (rows.reduce((sum, r) => sum + (r.rating || 0), 0) / rows.length).toFixed(2)
            : 0;
          
          // 4. Calculate Courses from Schedule Data using Email
          const courses = [];
          const schedule = Array.isArray(scheduleData?.schedule) ? scheduleData.schedule : [];

          schedule.forEach((dept) => {
            const deptName = dept.department;
            const deptCourses = Array.isArray(dept.courses) ? dept.courses : [];

            deptCourses.forEach((course) => {
              let instructorsArr;
              if (Array.isArray(course.instructor)) {
                instructorsArr = course.instructor;
              } else if (course.instructor) {
                instructorsArr = [{ name: course.instructor, email: null }];
              } else {
                instructorsArr = [];
              }

              const teachesHere = instructorsArr.some((inst) => {
                // Match by Email if available, otherwise Name (less reliable)
                if (emailForMatching && inst.email) {
                    return inst.email.toLowerCase() === emailForMatching.toLowerCase();
                }
                // Fallback to name matching if needed, or if email missing in JSON
                return (inst.name || '').toLowerCase().includes((profileData.name || '').toLowerCase());
              });

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
          
          const totalStudents = courses.reduce((sum, c) => sum + (c.studentCount || 0), 0);

          setStats({
            averageRating: avg,
            totalRatings: rows.length,
            totalStudents,
          });

          // 5. Fetch Replies
          const repliesMap = {};
          for (const r of rows) {
            try {
              const list = await fetchReplies(r.id);
              repliesMap[r.id] = list;
            } catch (_) {
              repliesMap[r.id] = [];
            }
          }
          setRepliesByFeedback(repliesMap);
        }
      } catch (err) {
        console.error("Error loading instructor profile:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, routeInstructorId]);

  const updateProfile = async (newProfileData, imageFile) => {
     if (!user?.uid || !db) return;
     
     let profilePictureUrl = profile?.profilePictureUrl || '';

      if (imageFile && storage) {
        const storageRef = ref(storage, `profilePictures/${user.uid}`);
        await uploadBytes(storageRef, imageFile);
        profilePictureUrl = await getDownloadURL(storageRef);
      }

      const userRef = doc(db, 'users', user.uid);
      const payload = {
        ...newProfileData,
        profilePictureUrl,
        updatedAt: serverTimestamp(),
        // Ensure these defaults
        email: user.email,
        role: profile?.role || 'instructor',
      };

      await setDoc(userRef, payload, { merge: true });
      setProfile((prev) => ({ ...(prev || {}), ...payload }));
  };

  return {
    instructorKey,
    myCourses,
    myRatings,
    profile,
    loading,
    stats,
    repliesByFeedback,
    setRepliesByFeedback,
    updateProfile
  };
}
