import React, { useEffect, useMemo, useState } from 'react';
import { db } from '../../firebase';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import scheduleData from '../../assets/my-file.optimized.json';
import '../RatingFeedback.css';

const profanityBlocked = (text) => {
  if (!text) return false;
  const bad = ['damn','hell','shit','fuck'];
  const lower = text.toLowerCase();
  return bad.some(w => lower.includes(w));
};

export default function RateInstructor() {
  const { user } = useAuth();
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

  // load instructors for selected course (from JSON) and sort by rating
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
          return {
            id: key,
            displayName: inst.name,
            email: inst.email || null,
            avgRating: 0 // Default
          };
        }).filter((i) => i.id);

        // Fetch ratings for these instructors to sort them
        try {
            const ratingsPromises = list.map(async (inst) => {
                const q = query(collection(db, 'feedbacks'), where('instructorId', '==', inst.id));
                const snap = await getDocs(q);
                if (snap.empty) return { ...inst, avgRating: 0 };
                
                const total = snap.docs.reduce((sum, d) => sum + (d.data().rating || 0), 0);
                const avg = total / snap.size;
                return { ...inst, avgRating: avg };
            });

            const enrichedList = await Promise.all(ratingsPromises);
            // Sort by average rating descending
            enrichedList.sort((a, b) => b.avgRating - a.avgRating);
            setInstructors(enrichedList);
        } catch (err) {
            console.error("Error sorting instructors:", err);
            setInstructors(list); // Fallback to unsorted
        }
    };

    fetchAndSortInstructors();
  }, [deptId, courseId, coursesById]);

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
      // duplicate guard
      const dupQ = query(
        collection(db, 'feedbacks'),
        where('studentId','==', user.uid),
        where('instructorId','==', instructorId),
        where('courseId','==', courseId)
      );
      const dupSnap = await getDocs(dupQ);
      if (!dupSnap.empty) {
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
        courseId,
        courseCode: selectedCourse?.code || null,
        courseTitle: selectedCourse?.title || null,
        ratings,
        overall,
        comment,
        tags,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await addDoc(collection(db, 'feedbacks'), payload);
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
    <div className="rating-feedback-container premium-container" style={{maxWidth: '800px', margin: '40px auto', padding: '0 20px'}}>
      <div className="premium-card" style={{padding: '40px', background: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '24px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)'}}>
          <h2 style={{textAlign: 'center', fontSize: '2.5rem', fontWeight: '800', marginBottom: '30px', background: 'linear-gradient(to right, #fff, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>Rate Instructor</h2>

          {/* Filters */}
          <div className="form-grid" style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px'}}>
              <div className="section-selector">
                <label style={{display: 'block', marginBottom: '8px', color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', fontWeight: '600'}}>Department</label>
                <select className="premium-input" value={deptId} onChange={e=>setDeptId(e.target.value)} style={{width: '100%', padding: '12px', borderRadius: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: '1rem'}}>
                  <option value="">-- Select Department --</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div className="section-selector">
                <label style={{display: 'block', marginBottom: '8px', color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', fontWeight: '600'}}>Course</label>
                <select className="premium-input" value={courseId} onChange={e=>setCourseId(e.target.value)} disabled={!deptId} style={{width: '100%', padding: '12px', borderRadius: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: '1rem', opacity: !deptId ? 0.5 : 1}}>
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
            <label style={{display: 'block', marginBottom: '8px', color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', fontWeight: '600'}}>Instructor (Sorted by Rating)</label>
            <select className="premium-input" value={instructorId} onChange={e=>setInstructorId(e.target.value)} disabled={!courseId} style={{width: '100%', padding: '12px', borderRadius: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: '1rem', opacity: !courseId ? 0.5 : 1}}>
              <option value="">-- Select Instructor --</option>
              {instructors.map(i => (
                <option key={i.id} value={i.id}>
                    {i.displayName} {i.avgRating > 0 ? `(⭐ ${i.avgRating.toFixed(1)})` : ''}
                </option>
              ))}
            </select>
          </div>

          {selectedCourse && (
            <div className="rating-form animate-fade-in">
              <h3 style={{fontSize: '1.5rem', marginBottom: '20px', color: 'white', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px'}}>{selectedCourse.title}</h3>
              
              <div className="overall-score" style={{textAlign: 'center', marginBottom: '30px'}}>
                  <div style={{fontSize: '3rem', fontWeight: '800', color: '#fbbf24', textShadow: '0 0 20px rgba(251, 191, 36, 0.4)'}}>{overall || 0}</div>
                  <div style={{color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '2px', fontSize: '0.8rem'}}>Overall Rating</div>
              </div>

              <div className="criteria-grid" style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px'}}>
                  {Object.keys(ratings).map(key => (
                      <div key={key} className="form-group" style={{background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '12px'}}>
                        <label style={{display: 'block', marginBottom: '10px', textTransform: 'capitalize', color: 'rgba(255,255,255,0.8)'}}>{key}</label>
                        <StarRow value={ratings[key]} onSelect={(v)=>setStar(key, v)} />
                      </div>
                  ))}
              </div>

              <div className="form-group" style={{marginBottom: '30px'}}>
                <label style={{display: 'block', marginBottom: '10px', color: 'rgba(255,255,255,0.8)'}}>Comment (optional)</label>
                <textarea
                  className="premium-input"
                  rows={4}
                  value={comment}
                  onChange={e=>setComment(e.target.value)}
                  placeholder="Share your experience..."
                  style={{width: '100%', padding: '15px', borderRadius: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: '1rem', resize: 'vertical'}}
                />
              </div>

              <div className="form-group" style={{marginBottom: '40px'}}>
                <label style={{display: 'block', marginBottom: '10px', color: 'rgba(255,255,255,0.8)'}}>Tags (optional)</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {tagOptions.map(t => {
                    const checked = tags.includes(t);
                    return (
                      <label key={t} style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: 6, 
                          padding: '8px 16px', 
                          borderRadius: '20px', 
                          cursor: 'pointer',
                          background: checked ? 'var(--neon-primary)' : 'rgba(255,255,255,0.05)',
                          border: checked ? '1px solid var(--neon-primary)' : '1px solid rgba(255,255,255,0.1)',
                          color: checked ? 'white' : 'rgba(255,255,255,0.6)',
                          transition: 'all 0.2s ease'
                      }}>
                        <input type="checkbox" checked={checked} onChange={() => {
                          setTags(prev => checked ? prev.filter(x => x !== t) : [...prev, t]);
                        }} style={{display: 'none'}} />
                        {t}
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="form-actions" style={{display: 'flex', gap: '20px'}}>
                <button className="save-button" disabled={loading} onClick={submit} style={{flex: 1, padding: '15px', borderRadius: '12px', background: 'linear-gradient(135deg, var(--neon-primary), var(--neon-secondary))', border: 'none', color: 'white', fontWeight: '700', fontSize: '1.1rem', cursor: 'pointer', boxShadow: '0 10px 30px rgba(99, 102, 241, 0.4)'}}>
                    {loading ? 'Submitting…' : 'Submit Feedback'}
                </button>
                <button className="cancel-button" disabled={loading} onClick={()=>{ setCourseId(''); setComment(''); setRatings({ clarity:0, engagement:0, organization:0, fairness:0, punctuality:0 }); }} style={{padding: '15px 30px', borderRadius: '12px', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'white', fontWeight: '600', cursor: 'pointer'}}>
                    Cancel
                </button>
              </div>

              {error && <div className="error" style={{ marginTop: 20, padding: '15px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '12px', color: '#fca5a5', textAlign: 'center' }}>{error}</div>}
              {success && <div className="success" style={{ marginTop: 20, padding: '15px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '12px', color: '#6ee7b7', textAlign: 'center' }}>{success}</div>}
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
    <div className="star-rating" style={{display: 'flex', gap: '5px'}}>
      {[1,2,3,4,5].map(s => (
        <span 
            key={s} 
            className={`star ${s <= value ? 'filled' : ''}`} 
            onClick={()=>onSelect(s)}
            style={{
                fontSize: '1.5rem', 
                cursor: 'pointer', 
                color: s <= value ? '#fbbf24' : 'rgba(255,255,255,0.2)',
                transition: 'all 0.2s ease',
                transform: s <= value ? 'scale(1.1)' : 'scale(1)'
            }}
        >
            ★
        </span>
      ))}
    </div>
  );
}
