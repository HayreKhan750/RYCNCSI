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

        // 3. Fetch all feedbacks to calculate ratings
        const ratingsQ = query(collection(db, 'feedbacks'));
        const ratingsSnap = await getDocs(ratingsQ);
        const ratingMap = {}; // instructorId -> { total, count }
        
        ratingsSnap.docs.forEach(doc => {
            const data = doc.data();
            if (data.instructorId && data.rating) {
                // instructorId in feedbacks is the generated key (email or name)
                const key = data.instructorId.toLowerCase();
                if (!ratingMap[key]) {
                    ratingMap[key] = { total: 0, count: 0 };
                }
                ratingMap[key].total += data.rating;
                ratingMap[key].count += 1;
            }
        });

        // 4. Merge Data
        const mergedInstructors = [];
        const processedFirestoreIds = new Set();

        jsonInstructorsMap.forEach((val, key) => {
            // Calculate rating from map
            const lookupKey = key.toLowerCase();
            const stats = ratingMap[lookupKey] || { total: 0, count: 0 };
            const avgRating = stats.count > 0 ? stats.total / stats.count : 0;

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
                    isRegistered: true,
                    averageRating: avgRating,
                    ratingCount: stats.count
                });
            } else {
                mergedInstructors.push({
                    ...val,
                    displayName: val.name,
                    id: null, // No Firestore ID yet
                    isRegistered: false,
                    averageRating: avgRating,
                    ratingCount: stats.count
                });
            }
        });

        // Add remaining Firestore instructors (who might not be in JSON but are registered)
        firestoreInstructors.forEach(f => {
            if (!processedFirestoreIds.has(f.id)) {
                // For these, we might not have a link to the JSON key easily unless we know their email matches a key
                // But if they are not in JSON map, maybe they don't have ratings from the JSON-based system?
                // Or maybe they have ratings under their UID? 
                // For now, assume 0 or check if their email matches a key in ratingMap
                let avgRating = 0;
                let ratingCount = 0;
                if (f.email) {
                     const stats = ratingMap[f.email.toLowerCase()];
                     if (stats) {
                         avgRating = stats.total / stats.count;
                         ratingCount = stats.count;
                     }
                }

                mergedInstructors.push({
                    ...f,
                    courses: [],
                    isRegistered: true,
                    averageRating: avgRating,
                    ratingCount
                });
            }
        });

        // Sort by rating descending
        mergedInstructors.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));

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

  if (loading) return <div style={{padding:40, textAlign:'center', color:'white'}}>Loading instructors...</div>;

  return (
    <div className="rate-courses-page premium-container" style={{padding: '40px 20px', maxWidth: '1200px', margin: '0 auto'}}>
      <div style={{textAlign: 'center', marginBottom: '40px'}}>
          <h2 style={{fontSize: '3rem', fontWeight: '800', marginBottom: '10px', background: 'linear-gradient(to right, #fff, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>Rate Instructors</h2>
          <p style={{color: 'rgba(255,255,255,0.6)', fontSize: '1.1rem'}}>Find and rate your instructors to help the community.</p>
      </div>

      <div style={{position: 'relative', maxWidth: '600px', margin: '0 auto 50px'}}>
        <input 
          type="text" 
          placeholder="🔍 Search instructor or department..." 
          className="premium-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
              width: '100%', 
              padding: '16px 24px', 
              borderRadius: '50px', 
              background: 'rgba(255,255,255,0.05)', 
              border: '1px solid rgba(255,255,255,0.1)', 
              color: 'white', 
              fontSize: '1.1rem', 
              boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
              outline: 'none',
              backdropFilter: 'blur(10px)'
          }}
        />
      </div>

      <div className="discovery-grid-premium" style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px'}}>
        {filteredInstructors.map((inst, index) => (
          <div key={inst.id || `json-${index}`} className="premium-card" style={{display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '30px', textAlign: 'center'}}>
             <div className="avatar-container" style={{marginBottom: '20px'}}>
                <div className="premium-avatar" style={{width: '80px', height: '80px', fontSize: '2rem'}}>
                  {(inst.displayName || 'T').charAt(0)}
                </div>
             </div>

             <div className="instructor-info-premium" style={{width: '100%'}}>
                <p className="dept-name-premium" style={{marginBottom: '8px'}}>{inst.department || 'General'}</p>
                <h4 className="instructor-name-gradient" style={{fontSize: '1.3rem', marginBottom: '16px'}}>{inst.displayName || 'Unknown Instructor'}</h4>
                
                <div className="rating-pill" style={{margin: '0 auto 20px'}}>
                   <span className="star-icon">★</span>
                   <span className="rating-score">{inst.averageRating?.toFixed(1) || '0.0'}</span>
                   <span className="rating-count">({inst.ratingCount || 0})</span>
                </div>
                
                {!inst.isRegistered && (
                  <div className="engagement-badge" style={{marginBottom: '20px', background: 'rgba(99, 102, 241, 0.1)', color: '#818cf8', borderColor: 'rgba(99, 102, 241, 0.2)'}}>
                      Available for Rating
                  </div>
                )}
             </div>

             <div style={{display:'flex', gap:'10px', width: '100%', marginTop: 'auto'}}>
                {inst.isRegistered && (
                    <button className="view-profile-btn-premium" style={{flex: 1, background: 'transparent', border: '1px solid rgba(255,255,255,0.2)'}} onClick={() => navigate(`/instructor/${inst.id}`)}>Profile</button>
                )}
                <button 
                    className="view-profile-btn-premium" 
                    onClick={() => handleRateClick(inst)}
                    disabled={processingId === (inst.email || inst.name)}
                    style={{flex: 1, background: 'linear-gradient(135deg, var(--neon-primary), var(--neon-secondary))', border: 'none', color: 'white'}}
                >
                    {processingId === (inst.email || inst.name) ? '...' : 'Rate'}
                </button>
             </div>
          </div>
        ))}
      </div>

      {filteredInstructors.length === 0 && (
          <div style={{textAlign:'center', padding: 60, opacity: 0.6, fontSize: '1.2rem'}}>No instructors found matching your search.</div>
      )}
    </div>
  );
}
