import React, { useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchInstructors } from '../../store/slices/instructorSlice';
import { selectAllInstructors, selectInstructorsLoading } from '../../store/selectors/instructorSelectors';
import { ensureInstructorExists } from '../../utils/ratingService';

export default function RateCourses({ user }) {
  const dispatch = useDispatch();
  const instructors = useSelector(selectAllInstructors);
  const loading = useSelector(selectInstructorsLoading);
  
  const [searchParams, setSearchParams] = useSearchParams();
  const searchTerm = searchParams.get('search') || '';
  const sortBy = searchParams.get('sort') || 'rating'; // 'rating', 'name', 'department'

  const [processingId, setProcessingId] = React.useState(null); 
  const navigate = useNavigate();

  useEffect(() => {
    if (instructors.length === 0) {
        dispatch(fetchInstructors());
    }
  }, [dispatch, instructors.length]);

  const updateParams = (newParams) => {
      const current = Object.fromEntries(searchParams.entries());
      setSearchParams({ ...current, ...newParams });
  };

  const filteredAndSortedInstructors = useMemo(() => {
    // 1. Calculate Global Ranks based on rating
    const withRanks = [...instructors]
        .sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0))
        .map((inst, idx) => ({ ...inst, globalRank: idx + 1 }));

    let result = withRanks;

    // 2. Filter
    if (searchTerm) {
        const lower = searchTerm.toLowerCase();
        result = result.filter(inst => 
          (inst.instructorName && inst.instructorName.toLowerCase().includes(lower)) ||
          (inst.department && inst.department.toLowerCase().includes(lower)) ||
          (inst.email && inst.email.toLowerCase().includes(lower))
        );
    }

    // 3. Sort
    result.sort((a, b) => {
        if (sortBy === 'rating') {
            return (b.avgRating || 0) - (a.avgRating || 0);
        } else if (sortBy === 'name') {
            return (a.instructorName || '').localeCompare(b.instructorName || '');
        } else if (sortBy === 'department') {
            return (a.department || '').localeCompare(b.department || '');
        }
        return 0;
    });

    return result;
  }, [instructors, searchTerm, sortBy]);

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
    <div className="rate-courses-page premium-container" style={{padding: '100px 20px 40px', maxWidth: '1200px', margin: '0 auto'}}>
      <div style={{textAlign: 'center', marginBottom: '40px'}}>
          <h2 style={{fontSize: '3rem', fontWeight: '800', marginBottom: '10px', background: 'linear-gradient(to right, var(--text-primary), #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>Rate Instructors</h2>
          <p style={{color: 'var(--text-secondary)', fontSize: '1.1rem'}}>Find and rate your instructors to help the community.</p>
      </div>

      <div style={{display:'flex', flexDirection:'column', alignItems:'center', gap:'20px', marginBottom:'50px'}}>
        {/* Search Bar */}
        <div style={{position: 'relative', width: '100%', maxWidth: '600px'}}>
            <input 
            type="text" 
            placeholder="🔍 Search instructor or department..." 
            className="premium-input"
            value={searchTerm}
            onChange={(e) => updateParams({ search: e.target.value })}
            style={{
                width: '100%', 
                padding: '16px 24px', 
                borderRadius: '50px', 
                background: 'var(--bg-elevated)', 
                border: '1px solid var(--border-subtle)', 
                color: 'var(--text-primary)', 
                fontSize: '1.1rem', 
                boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                outline: 'none',
                backdropFilter: 'blur(10px)'
            }}
            />
        </div>

        {/* Sort Controls */}
        <div style={{display:'flex', gap:'10px'}}>
            <button 
                onClick={() => updateParams({ sort: 'rating' })}
                style={{
                    padding:'8px 16px', 
                    borderRadius:'20px', 
                    border:'none', 
                    background: sortBy === 'rating' ? 'var(--neon-primary)' : 'var(--bg-elevated)',
                    color: sortBy === 'rating' ? 'white' : 'var(--text-primary)',
                    cursor:'pointer',
                    transition:'all 0.3s'
                }}
            >
                ⭐ Top Rated
            </button>
            <button 
                onClick={() => updateParams({ sort: 'name' })}
                style={{
                    padding:'8px 16px', 
                    borderRadius:'20px', 
                    border:'none', 
                    background: sortBy === 'name' ? 'var(--neon-primary)' : 'var(--bg-elevated)',
                    color: sortBy === 'name' ? 'white' : 'var(--text-primary)',
                    cursor:'pointer',
                    transition:'all 0.3s'
                }}
            >
                🔤 Name
            </button>
            <button 
                onClick={() => updateParams({ sort: 'department' })}
                style={{
                    padding:'8px 16px', 
                    borderRadius:'20px', 
                    border:'none', 
                    background: sortBy === 'department' ? 'var(--neon-primary)' : 'var(--bg-elevated)',
                    color: sortBy === 'department' ? 'white' : 'var(--text-primary)',
                    cursor:'pointer',
                    transition:'all 0.3s'
                }}
            >
                🏢 Department
            </button>
        </div>
      </div>

      <div className="discovery-grid-premium courses-grid-override">
        {filteredAndSortedInstructors.map((inst, index) => (
          <div key={inst.id || `json-${index}`} className="premium-card" style={{display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '30px', textAlign: 'center', position:'relative', overflow:'hidden'}}>
             
             {/* Rank Badge for Top 3 Global */}
             {sortBy === 'rating' && inst.globalRank <= 3 && (
                 <div style={{
                     position:'absolute', 
                     top:'10px', 
                     left:'10px', 
                     background: inst.globalRank === 1 ? 'gold' : inst.globalRank === 2 ? 'silver' : '#cd7f32',
                     color:'black',
                     fontWeight:'bold',
                     padding:'4px 10px',
                     borderRadius:'10px',
                     fontSize:'0.8rem',
                     boxShadow:'0 2px 10px rgba(0,0,0,0.2)'
                 }}>
                     #{inst.globalRank}
                 </div>
             )}

             <div className="avatar-container" style={{marginBottom: '20px'}}>
                <div className="premium-avatar" style={{
                    width: '80px', 
                    height: '80px', 
                    fontSize: '2rem',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0
                }}>
                  {(inst.photoURL || inst.profilePictureUrl || inst.photo) ? (
                    <img 
                        src={inst.photoURL || inst.profilePictureUrl || inst.photo} 
                        alt={inst.instructorName} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} 
                    />
                  ) : (
                    (inst.instructorName || inst.name || 'T').charAt(0)
                  )}
                </div>
                <div className="avatar-glow"></div>
             </div>

             <div className="instructor-info-premium" style={{width: '100%'}}>
                <h4 className="instructor-name-gradient" style={{fontSize: '1.3rem', marginBottom: '4px'}}>
                    {inst.instructorName || inst.displayName || inst.name || inst.fullName || 'Unknown Instructor'}
                </h4>
                <p className="dept-name-premium" style={{marginBottom: '16px', opacity:0.7}}>{inst.department || 'General'}</p>
                
                <div className="rating-pill" style={{margin: '0 auto 20px'}}>
                   <span className="star-icon">⭐</span>
                   <span className="rating-score">
                       {(typeof (inst.avgRating || inst.rating || inst.ratingStats?.average) === 'number') 
                           ? (inst.avgRating || inst.rating || inst.ratingStats?.average).toFixed(1) 
                           : '0.0'}
                   </span>
                   <span className="rating-count">({inst.ratingCount || 0})</span>
                </div>
                
                {/* Engagement / Status Badge */}
                <div className="engagement-badge" style={{
                    marginBottom: '20px', 
                    background: inst.avgRating >= 4.0 ? 'rgba(255, 215, 0, 0.1)' : 'rgba(99, 102, 241, 0.1)', 
                    color: inst.avgRating >= 4.0 ? 'gold' : '#818cf8', 
                    borderColor: inst.avgRating >= 4.0 ? 'rgba(255, 215, 0, 0.2)' : 'rgba(99, 102, 241, 0.2)'
                }}>
                    {inst.avgRating >= 4.0 ? '🔥 High Engagement' : 'Available for Rating'}
                </div>
             </div>

             <div style={{display:'flex', gap:'10px', width: '100%', marginTop: 'auto'}}>
                {inst.isRegistered && (
                    <button className="view-profile-btn-premium" style={{flex: 1}} onClick={() => navigate(`/instructor/${inst.id}`)}>Profile</button>
                )}
                <button 
                    className="action-btn-premium" 
                    onClick={() => handleRateClick(inst)}
                    disabled={processingId === (inst.email || inst.name)}
                    style={{flex: 1}}
                >
                    {processingId === (inst.email || inst.name) ? '...' : 'Rate'}
                </button>
             </div>
          </div>
        ))}
      </div>

      {filteredAndSortedInstructors.length === 0 && (
          <div style={{textAlign:'center', padding: 60, opacity: 0.6, fontSize: '1.2rem'}}>No instructors found matching your search.</div>
      )}
    </div>
  );
}
