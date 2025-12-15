import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchInstructors } from '../../store/slices/instructorSlice';
import { submitFeedback } from '../../store/slices/feedbackSlice';
import { feedbackService } from '../../services/feedbackService';
import scheduleData from '../../assets/my-file.optimized.json';
import '../../styles/RatingPage.css';

const profanityBlocked = (text) => {
  if (!text) return false;
  const bad = ['damn','hell','shit','fuck'];
  const lower = text.toLowerCase();
  return bad.some(w => lower.includes(w));
};

export default function RateInstructor() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const instructorState = useSelector((state) => state.instructors);
  
  const [departments, setDepartments] = useState([]); // from schedule JSON
  const [instructors, setInstructors] = useState([]); // derived from selected course
  const [sections, setSections] = useState([]); // courses for selected department
  const [coursesById, setCoursesById] = useState({});

  const [deptId, setDeptId] = useState(''); // department name
  const [courseId, setCourseId] = useState(''); // course key
  const [instructorId, setInstructorId] = useState(''); // instructor key (email or name)

  const [ratings, setRatings] = useState({
    clarity: 0,
    engagement: 0,
    organization: 0,
    fairness: 0,
    punctuality: 0,
  });
  const [comment, setComment] = useState('');
  const [tags, setTags] = useState([]);
  const tagOptions = ['Helpful','Strict','Engaging','Clear','Organized','Challenging','Approachable'];
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [showToast, setShowToast] = useState(false);

  // Ensure instructors are loaded for rating matching
  useEffect(() => {
      if (instructorState.status === 'idle') {
          dispatch(fetchInstructors());
      }
  }, [dispatch, instructorState.status]);

  // load departments from schedule JSON once
  useEffect(() => {
    const schedule = Array.isArray(scheduleData?.schedule) ? scheduleData.schedule : [];
    const depts = schedule.map((d) => ({
      id: d.department,
      name: d.department,
      courses: Array.isArray(d.courses) ? d.courses : [],
    }));
    setDepartments(depts);
  }, []);

  // load courses when dept changes (from JSON)
  useEffect(() => {
    setInstructors([]);
    setInstructorId('');
    setSections([]);
    setCourseId('');
    if (!deptId) return;

    const dept = departments.find((d) => d.id === deptId);
    if (!dept) return;

    const courseMap = {};
    const secs = [];

    (Array.isArray(dept.courses) ? dept.courses : []).forEach((course) => {
      const courseKey = `${dept.id}|${course.course_code || course.course_title}`;
      courseMap[courseKey] = {
        id: courseKey,
        code: course.course_code,
        title: course.course_title,
        raw: course,
      };
      secs.push({ id: courseKey, courseId: courseKey });
    });

    setSections(secs);
    setCoursesById(courseMap);
  }, [deptId, departments]);

  // load instructors for selected course (from JSON) and sort by rating from Redux
  useEffect(() => {
    const fetchAndSortInstructors = async () => {
        setInstructors([]);
        setInstructorId('');
        if (!deptId || !courseId) return;

        const course = coursesById[courseId]?.raw;
        if (!course) return;

        let instructorsArr;
        if (Array.isArray(course.instructor)) {
          instructorsArr = course.instructor;
        } else if (course.instructor) {
          instructorsArr = [{ name: course.instructor, email: null }];
        } else {
          instructorsArr = [];
        }

        const list = instructorsArr.map((inst) => {
          const key = (inst.email || inst.name || '').toLowerCase();
          // Find in Redux store to get real rating
          // Logic: search by id/email matching or name matching
          const found = Object.values(instructorState.byId).find(
              reduxInst => {
                  const rName = (reduxInst.fullName || reduxInst.instructorName || '').toLowerCase();
                  const rEmail = (reduxInst.email || '').toLowerCase();
                  return rName === key || rEmail === key; // simplistic match
              }
          );

          return {
            id: key,
            displayName: inst.name,
            email: inst.email || null,
            // Use Redux rating or 0
            avgRating: found?.avgRating || found?.ratingStats?.average || 0
          };
        }).filter((i) => i.id);

        // Sort by average rating descending
        list.sort((a, b) => b.avgRating - a.avgRating);
        setInstructors(list);
    };

    fetchAndSortInstructors();
  }, [deptId, courseId, coursesById, instructorState.byId]);

  const overall = useMemo(() => {
    const vals = Object.values(ratings).filter(Boolean);
    if (vals.length === 0) return 0;
    return Math.round((vals.reduce((a,b)=>a+b,0) / vals.length) * 10) / 10;
  }, [ratings]);

  const setStar = (key, val) => setRatings(prev => ({ ...prev, [key]: val }));

  const selectedCourse = courseId ? coursesById[courseId] : null;

  const validate = () => {
    if (!deptId) return 'Please select a department';
    if (!courseId) return 'Please select a course';
    if (!instructorId) return 'Please select an instructor';
    if (Object.values(ratings).some(v => v === 0)) return 'Please rate all criteria (1-5)';
    if (comment && comment.length < 5) return 'Comment is too short';
    if (profanityBlocked(comment)) return 'Please remove inappropriate words from your comment';
    return '';
  };

  const submit = async () => {
    setError('');
    setSuccess('');
    const v = validate();
    if (v) { setError(v); return; }
    setLoading(true);
    try {
      // duplicate guard via Service
      const isDuplicate = await feedbackService.checkDuplicateFeedback(user.uid, instructorId, courseId);
      if (isDuplicate) {
        setError('You have already rated this instructor for this course.');
        setLoading(false);
        return;
      }

      const instructor = instructors.find(i => i.id === instructorId);
      const dept = departments.find(d => d.id === deptId);
      const payload = {
        studentId: user.uid,
        deptId,
        deptName: dept?.name || null,
        instructorId,
        instructorName: instructor?.displayName || null,
        studentName: user.displayName || 'Student',
        studentPhoto: user.photoURL || null,
        courseId,
        courseCode: selectedCourse?.code || null,
        courseTitle: selectedCourse?.title || null,
        ratings,
        overall,
        text: comment, // Schema alignment
        comment, // (Legacy support)
        tags,
        status: 'published',
        meta: {
            likes: 0,
            dislikes: 0,
            hasReply: false
        }
        // createdAt/updatedAt handled by Service/Thunk
      };
      
      await dispatch(submitFeedback(payload)).unwrap();

      setSuccess('Feedback submitted successfully');
      setShowToast(true);
      setTimeout(()=> setShowToast(false), 2000);
      // reset
      setRatings({ clarity:0, engagement:0, organization:0, fairness:0, punctuality:0 });
      setComment('');
      setTags([]);
      setCourseId('');
    } catch (e) {
      setError(e.message || 'Failed to submit feedback');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rating-page-container">
      <div className="premium-card">
          <h2 className="rating-title">Rate Instructor</h2>

          {/* Filters */}
          <div className="form-grid">
              <div className="section-selector">
                <label className="form-label">Department</label>
                <select className="premium-input" value={deptId} onChange={e=>setDeptId(e.target.value)}>
                  <option value="">-- Select Department --</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div className="section-selector">
                <label className="form-label">Course</label>
                <select className="premium-input" value={courseId} onChange={e=>setCourseId(e.target.value)} disabled={!deptId}>
                  <option value="">-- Select Course --</option>
                  {sections.map(s => {
                    const c = coursesById[s.courseId];
                    if (!c) return null;
                    return (
                      <option key={s.id} value={c.id}>{c.code} — {c.title}</option>
                    );
                  })}
                </select>
              </div>
          </div>

          <div className="section-selector" style={{marginBottom: '40px'}}>
            <label className="form-label">Instructor (Sorted by Rating)</label>
            <select className="premium-input" value={instructorId} onChange={e=>setInstructorId(e.target.value)} disabled={!courseId}>
              <option value="">-- Select Instructor --</option>
              {instructors.map(i => (
                <option key={i.id} value={i.id}>
                    {i.displayName} {i.avgRating > 0 ? `(⭐ ${i.avgRating.toFixed(1)})` : ''}
                </option>
              ))}
            </select>
          </div>

          {selectedCourse && (
            <div className="rating-form">
              <h3 className="course-title">{selectedCourse.title}</h3>
              
              <div className="overall-score">
                  <div className="overall-value">{overall || 0}</div>
                  <div className="overall-label">Overall Rating</div>
              </div>

              <div className="criteria-grid">
                  {Object.keys(ratings).map(key => (
                      <div key={key} className="criteria-item">
                        <label className="criteria-label">{key}</label>
                        <StarRow value={ratings[key]} onSelect={(v)=>setStar(key, v)} />
                      </div>
                  ))}
              </div>

              <div className="form-group">
                <label className="form-label">Comment (optional)</label>
                <textarea
                  className="premium-input"
                  rows={4}
                  value={comment}
                  onChange={e=>setComment(e.target.value)}
                  placeholder="Share your experience..."
                  style={{resize: 'vertical'}}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Tags (optional)</label>
                <div className="tags-container">
                  {tagOptions.map(t => {
                    const checked = tags.includes(t);
                    return (
                      <label key={t} className={`tag-label ${checked ? 'checked' : ''}`}>
                        <input type="checkbox" checked={checked} onChange={() => {
                          setTags(prev => checked ? prev.filter(x => x !== t) : [...prev, t]);
                        }} style={{display: 'none'}} />
                        {t}
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="form-actions">
                <button className="save-button" disabled={loading} onClick={submit}>
                    {loading ? 'Submitting…' : 'Submit Feedback'}
                </button>
                <button className="cancel-button" disabled={loading} onClick={()=>{ setCourseId(''); setComment(''); setRatings({ clarity:0, engagement:0, organization:0, fairness:0, punctuality:0 }); }}>
                    Cancel
                </button>
              </div>

              {error && <div className="error-msg">{error}</div>}
              {success && <div className="success-msg">{success}</div>}
            </div>
          )}

          {showToast && (
            <div style={{ position: 'fixed', bottom: 30, right: 30, background: '#10b981', color: '#fff', padding: '15px 25px', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)', fontWeight: '600', zIndex: 100, animation: 'slideIn 0.3s ease' }}>
              Feedback submitted successfully! 🚀
            </div>
          )}
      </div>
    </div>
  );
}

function StarRow({ value, onSelect }) {
  return (
    <div className="star-rating">
      {[1,2,3,4,5].map(s => (
        <span 
            key={s} 
            className={`star ${s <= value ? 'filled' : ''}`} 
            onClick={()=>onSelect(s)}
        >
            ★
        </span>
      ))}
    </div>
  );
}
