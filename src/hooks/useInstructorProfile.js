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
        // 1. Calculate Courses from Schedule Data
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
              const key = (inst?.email || inst?.name || '').toLowerCase();
              return key && key === instructorKey;
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

        // 2. Fetch Profile
        if (db) {
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

          // 3. Fetch Ratings
          const q = query(
            collection(db, 'feedbacks'),
            where('instructorId', '==', instructorKey)
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

          // 4. Calculate Stats
          const avg = rows.length > 0
            ? (rows.reduce((sum, r) => sum + (r.rating || 0), 0) / rows.length).toFixed(2)
            : 0;
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
  }, [user, instructorKey, routeInstructorId]);

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
