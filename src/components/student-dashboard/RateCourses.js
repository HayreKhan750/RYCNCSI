import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import scheduleData from '../../assets/my-file.optimized.json';
import { ensureInstructorExists } from '../../utils/ratingService';

export default function RateCourses({ user }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [instructors, setInstructors] = useState([]);
  const [filteredInstructors, setFilteredInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null); // Track which instructor is being processed
  const navigate = useNavigate();

  useEffect(() => {
    const fetchInstructors = async () => {
      try {
        // 1. Parse JSON to get unique instructors
        const jsonInstructorsMap = new Map();
        
        if (scheduleData && Array.isArray(scheduleData.schedule)) {
            scheduleData.schedule.forEach(dept => {
                if (Array.isArray(dept.courses)) {
                    dept.courses.forEach(course => {
                        if (Array.isArray(course.instructor)) {
                            course.instructor.forEach(inst => {
                                const email = inst.email ? inst.email.toLowerCase() : null;
                                const name = inst.name;
                                const key = email || name; // Prefer email as key

                                if (key && !jsonInstructorsMap.has(key)) {
                                    jsonInstructorsMap.set(key, {
                                        name: name,
                                        email: email,
                                        department: dept.department,
                                        courses: [course.course_title],
                                        source: 'json'
                                    });
                                } else if (key) {
                                    // Append course if already exists
                                    const existing = jsonInstructorsMap.get(key);
                                    if (!existing.courses.includes(course.course_title)) {
                                        existing.courses.push(course.course_title);
                                    }
                                }
                            });
                        }
                    });
                }
            });
        }

        // 2. Fetch Firestore Instructors to get IDs, Photos, and Ratings
        const q = query(collection(db, 'users'), where('role', '==', 'instructor'));
        const querySnapshot = await getDocs(q);
        const firestoreInstructors = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // 3. Merge Data
        const mergedInstructors = [];
        const processedFirestoreIds = new Set();

        jsonInstructorsMap.forEach((val, key) => {
            // Try to find in Firestore by Email
            let match = firestoreInstructors.find(f => f.email && f.email.toLowerCase() === val.email);
            
            // If no email match, try fuzzy name match
            if (!match) {
                match = firestoreInstructors.find(f => f.displayName && f.displayName.toLowerCase() === val.name.toLowerCase());
            }

            if (match) {
                processedFirestoreIds.add(match.id);
                mergedInstructors.push({
                    ...val,
                    ...match,
                    displayName: match.displayName || val.name,
                    department: match.department || val.department,
                    isRegistered: true
                });
            } else {
                mergedInstructors.push({
                    ...val,
                    displayName: val.name,
                    id: null, // No Firestore ID yet
                    isRegistered: false,
                    averageRating: 0,
                    ratingCount: 0
                });
            }
        });

        // Add remaining Firestore instructors
        firestoreInstructors.forEach(f => {
            if (!processedFirestoreIds.has(f.id)) {
                mergedInstructors.push({
                    ...f,
                    courses: [],
                    isRegistered: true
                });
            }
        });

        setInstructors(mergedInstructors);
        setFilteredInstructors(mergedInstructors);
      } catch (error) {
        console.error("Error fetching instructors:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInstructors();
  }, []);

  useEffect(() => {
    if (!searchTerm) {
      setFilteredInstructors(instructors);
      return;
    }
    const lower = searchTerm.toLowerCase();
    const filtered = instructors.filter(inst => 
      (inst.displayName && inst.displayName.toLowerCase().includes(lower)) ||
      (inst.department && inst.department.toLowerCase().includes(lower)) ||
      (inst.email && inst.email.toLowerCase().includes(lower))
    );
    setFilteredInstructors(filtered);
  }, [searchTerm, instructors]);

  const handleRateClick = async (inst) => {
      if (inst.id) {
          navigate(`/rate/${inst.id}`);
      } else {
          // Unregistered instructor - create placeholder first
          setProcessingId(inst.email || inst.name);
          try {
              const newId = await ensureInstructorExists(inst);
              navigate(`/rate/${newId}`);
          } catch (error) {
              console.error("Error preparing instructor for rating:", error);
              alert("Failed to prepare instructor for rating. Please try again.");
          } finally {
              setProcessingId(null);
          }
      }
  };

  if (loading) return <div style={{padding:40, textAlign:'center'}}>Loading instructors...</div>;

  return (
    <div className="rate-courses-page">
      <input 
        type="text" 
        placeholder="🔍 Search instructor or department..." 
        className="search-bar-large"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <div className="courses-grid-layout">
        {filteredInstructors.map((inst, index) => (
          <div key={inst.id || `json-${index}`} className="glass-card instructor-card-lg">
            <div className="card-banner"></div>
            <div className="card-avatar-wrapper">
               {inst.photoURL ? (
                 <img src={inst.photoURL} alt={inst.displayName} style={{width:'100%', height:'100%', objectFit:'cover'}} />
               ) : (
                 <div style={{width:'100%', height:'100%', background:'#e0e7ff', display:'flex', alignItems:'center', justifyContent:'center', fontSize: 24, fontWeight:'bold', color:'#6366f1'}}>
                   {(inst.displayName || 'T').charAt(0)}
                 </div>
               )}
            </div>
            <div className="card-content">
              <span className="dept">{inst.department || 'General'}</span>
              <h3>{inst.displayName || 'Unknown Instructor'}</h3>
              <div className="rating-badge-sm" style={{justifyContent:'center', margin:'10px 0'}}>
                 <span>⭐ {inst.averageRating?.toFixed(1) || 'New'}</span>
                 <span style={{opacity:0.7, fontSize:'0.8rem'}}> ({inst.ratingCount || 0})</span>
              </div>
              
              {!inst.isRegistered && (
                  <div style={{fontSize:'12px', color:'#6366f1', marginBottom:'10px', textAlign:'center', fontWeight:'bold'}}>
                      Available for Rating
                  </div>
              )}

              <div style={{display:'flex', gap:'10px', marginTop:'15px'}}>
                {inst.isRegistered && (
                    <button className="rate-btn secondary" onClick={() => navigate(`/instructor/${inst.id}`)}>View Profile</button>
                )}
                <button 
                    className="rate-btn" 
                    onClick={() => handleRateClick(inst)}
                    disabled={processingId === (inst.email || inst.name)}
                    style={{width: inst.isRegistered ? 'auto' : '100%'}}
                >
                    {processingId === (inst.email || inst.name) ? 'Preparing...' : 'Rate Now'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredInstructors.length === 0 && (
          <div style={{textAlign:'center', padding: 40, opacity: 0.6}}>No instructors found.</div>
      )}
    </div>
  );
}
