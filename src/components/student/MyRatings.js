import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchFeedbacks, updateFeedback, deleteFeedback } from '../../store/slices/feedbackSlice';

export default function MyRatings() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  // We access ALL feedbacks effectively since slice merges them. 
  // We selectively render only those belonging to the student.
  const allFeedbacks = useSelector((state) => state.feedbacks.byId);
  
  const [loading, setLoading] = useState(false); // Local loading state for pagination/filtering interaction
  const [errorMsg, setErrorMsg] = useState('');
  
  const [filter, setFilter] = useState(''); // Client-side search
  const [sort, setSort] = useState('date_desc');
  const [deptFilter, setDeptFilter] = useState('');
  const [dateFilter, setDateFilter] = useState(''); // yyyy-mm
  
  const pageSize = 10;
  const [paginationEnd, setPaginationEnd] = useState(false); // Quick naive pagination check

  // Derived User Ratings
  const myRatings = useMemo(() => {
      // Robust filter matching studentId
      return Object.values(allFeedbacks)
        .filter(f => f.studentId === user?.uid)
        .sort((a,b) => (b.createdAt || 0) - (a.createdAt || 0)); // Default sort by date desc for internal list
  }, [allFeedbacks, user?.uid]);

  const [editingId, setEditingId] = useState(null);
  const [editComment, setEditComment] = useState('');
  const [editOverall, setEditOverall] = useState(0);

  const load = async (reset = false) => {
    if (!user) return;
    setLoading(true);
    setErrorMsg('');
    try {
      // Determine filters to pass to server
      // Note: Full text search 'filter' is usually client side unless we have Algolia.
      // We pass structural filters to server.
      const queryFilters = {
          studentId: user.uid,
          limit: pageSize,
          sort,
          deptName: deptFilter || undefined,
          date: dateFilter || undefined,
          // Pagination: If not resetting, find the last timestamp
          lastTimestamp: (!reset && myRatings.length > 0) ? myRatings[myRatings.length - 1].createdAt : undefined
      };

      const resultAction = await dispatch(fetchFeedbacks(queryFilters));
      if (fetchFeedbacks.fulfilled.match(resultAction)) {
           if (resultAction.payload.length < pageSize) {
               setPaginationEnd(true);
           } else {
               setPaginationEnd(false);
           }
      } else {
          setErrorMsg(resultAction.payload || 'Failed to fetch');
      }
    } catch (e) {
      setErrorMsg(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    if (user?.uid) {
        // Initial Load or Filter Change
        load(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid, sort, deptFilter, dateFilter]);

  // Client-Side Search Filtering (Text)
  const displayItems = useMemo(() => {
    let rows = myRatings;
    if (filter) {
      const f = filter.toLowerCase();
      rows = rows.filter(r =>
        (r.instructorName || '').toLowerCase().includes(f) ||
        (r.courseCode || '').toLowerCase().includes(f)
      );
    }
    // Note: Other filters (dept, date, sort) are handled by SERVER fetch in 'load',
    // but we can also double-filter here to be instant if data exists.
    return rows;
  }, [myRatings, filter]);

  const startEdit = (row) => {
    setEditingId(row.id);
    setEditComment(row.comment || row.feedback || '');
    setEditOverall(row.overall || row.rating || 0);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    try {
      await dispatch(updateFeedback({ 
          id: editingId, 
          updates: {
             comment: editComment, 
             feedback: editComment, // Sync legacy fields
             overall: editOverall,
             rating: editOverall // Sync legacy
          } 
      })).unwrap();
      
      setEditingId(null);
      setEditComment('');
      setEditOverall(0);
    } catch (e) {
      setErrorMsg(e.message || 'Failed to update');
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditComment('');
    setEditOverall(0);
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this rating?')) return;
    try {
      await dispatch(deleteFeedback(id)).unwrap();
    } catch (e) {
      setErrorMsg(e.message || 'Failed to delete');
    }
  };

  return (
    <div style={{ padding: 12 }}>
      <h2>My Ratings</h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, margin: '8px 0' }}>
        <input
          placeholder="Search loaded ratings..."
          value={filter}
          onChange={(e)=>setFilter(e.target.value)}
          style={{ flex: 1, padding: 8 }}
        />
        <select value={deptFilter} onChange={(e)=>setDeptFilter(e.target.value)} style={{padding:8}}>
          <option value="">All Departments</option>
          {/* Dynamically populate departments from loaded items? Or hardcode? keeping dynamic for now */}
          {Array.from(new Set(myRatings.map(r => r.deptName).filter(Boolean))).map(d => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <input type="month" value={dateFilter} onChange={(e)=>setDateFilter(e.target.value)} style={{padding:8}} />
        <select value={sort} onChange={(e)=>setSort(e.target.value)} style={{padding:8}}>
          <option value="date_desc">Newest</option>
          <option value="date_asc">Oldest</option>
          <option value="rating_desc">Rating: High to Low</option>
          <option value="rating_asc">Rating: Low to High</option>
        </select>
      </div>

      {errorMsg && <div style={{ color: '#b00020', marginBottom: 8, border:'1px solid red', padding:10, borderRadius:4 }}>{errorMsg}</div>}

      <div style={{ overflowX: 'auto', background:'white', borderRadius: 8, boxShadow:'0 2px 5px rgba(0,0,0,0.05)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{background:'#f8f9fa', borderBottom:'2px solid #e9ecef'}}>
              <th style={{ textAlign: 'left', padding: 12 }}>Instructor</th>
              <th style={{ textAlign: 'left', padding: 12 }}>Course</th>
              <th style={{ textAlign: 'left', padding: 12 }}>Overall</th>
              <th style={{ textAlign: 'left', padding: 12 }}>Comment</th>
              <th style={{ textAlign: 'left', padding: 12 }}>Date</th>
              <th style={{ textAlign: 'left', padding: 12 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayItems.length === 0 ? (
                <tr><td colSpan="6" style={{padding:20, textAlign:'center', color:'#6c757d'}}>No ratings found.</td></tr>
            ) : (
                displayItems.map(r => (
                <tr key={r.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: 12 }}>{r.instructorName || r.instructorId}</td>
                    <td style={{ padding: 12 }}>{r.courseCode || r.courseId}</td>
                    <td style={{ padding: 12 }}>
                        <span style={{fontWeight:'bold', color: (r.overall||r.rating) >= 4 ? '#27ae60' : '#e67e22'}}>
                            {(r.overall || r.rating || 0).toFixed(1)}
                        </span>
                    </td>
                    <td style={{ padding: 12 }}>
                    {editingId === r.id ? (
                        <input value={editComment} onChange={(e)=>setEditComment(e.target.value)} style={{ width: '100%', padding:5 }} />
                    ) : (
                        r.comment || r.feedback || '-'
                    )}
                    </td>
                    <td style={{ padding: 12 }}>
                        {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '-'}
                    </td>
                    <td style={{ padding: 12, display: 'flex', gap: 8 }}>
                    {editingId === r.id ? (
                        <>
                        <button onClick={saveEdit} style={{cursor:'pointer', color:'green'}}>Save</button>
                        <button onClick={cancelEdit} style={{cursor:'pointer', color:'gray'}}>Cancel</button>
                        </>
                    ) : (
                        <>
                        <button onClick={()=>startEdit(r)} style={{cursor:'pointer', color:'#3498db'}}>Edit</button>
                        <button onClick={()=>remove(r.id)} style={{cursor:'pointer', color:'#e74c3c'}}>Delete</button>
                        </>
                    )}
                    </td>
                </tr>
                ))
            )}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 20, textAlign:'center' }}>
        {!paginationEnd && (
          <button 
            disabled={loading} 
            onClick={()=>load(false)}
            style={{padding:'10px 20px', cursor:'pointer', background:'#e9ecef', border:'none', borderRadius:4}}
          >
            {loading ? 'Loading ratings...' : 'Load More Results'}
          </button>
        )}
      </div>
    </div>
  );
}
