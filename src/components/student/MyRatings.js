import React, { useEffect, useMemo, useRef, useState } from 'react';
import { db } from '../../firebase';
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp,
  limit,
  startAfter,
} from 'firebase/firestore';
import { useSelector } from 'react-redux';

export default function MyRatings() {
  const { user } = useSelector((state) => state.auth);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');
  const [sort, setSort] = useState('date_desc');
  const [deptFilter, setDeptFilter] = useState('');
  const [dateFilter, setDateFilter] = useState(''); // yyyy-mm
  const [hasMore, setHasMore] = useState(true);
  const pageSize = 10;
  const lastDocRef = useRef(null);
  const [editingId, setEditingId] = useState(null);
  const [editComment, setEditComment] = useState('');
  const [editOverall, setEditOverall] = useState(0);

  const load = async (reset = true) => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      const base = [
        collection(db, 'feedbacks'),
        where('studentId', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(pageSize)
      ];
      const q = lastDocRef.current ? query(...base, startAfter(lastDocRef.current)) : query(...base);
      const snap = await getDocs(q);
      const rows = snap.docs.map(d => ({ id: d.id, _doc: d, ...d.data() }));
      lastDocRef.current = snap.docs[snap.docs.length - 1] || lastDocRef.current;
      setHasMore(snap.docs.length === pageSize);
      setItems(prev => reset ? rows : [...prev, ...rows]);
    } catch (e) {
      setError(e.message || 'Failed to load ratings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    lastDocRef.current = null;
    load(true); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  const filtered = useMemo(() => {
    let rows = items;
    if (filter) {
      const f = filter.toLowerCase();
      rows = rows.filter(r =>
        (r.instructorName || '').toLowerCase().includes(f) ||
        (r.courseCode || '').toLowerCase().includes(f)
      );
    }
    if (deptFilter) {
      rows = rows.filter(r => (r.deptName || '').toLowerCase() === deptFilter.toLowerCase());
    }
    if (dateFilter) {
      rows = rows.filter(r => {
        const d = r.createdAt?.toDate ? r.createdAt.toDate() : null;
        if (!d) return false;
        const ym = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
        return ym === dateFilter;
      });
    }
    if (sort === 'date_asc') rows = [...rows].sort((a,b)=>(a.createdAt?.seconds||0)-(b.createdAt?.seconds||0));
    if (sort === 'date_desc') rows = [...rows].sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0));
    if (sort === 'rating_desc') rows = [...rows].sort((a,b)=>(b.overall||0)-(a.overall||0));
    if (sort === 'rating_asc') rows = [...rows].sort((a,b)=>(a.overall||0)-(b.overall||0));
    return rows;
  }, [items, filter, sort, deptFilter, dateFilter]);

  const startEdit = (row) => {
    setEditingId(row.id);
    setEditComment(row.comment || '');
    setEditOverall(row.overall || 0);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    try {
      await updateDoc(doc(db, 'feedbacks', editingId), {
        comment: editComment,
        overall: editOverall,
        updatedAt: serverTimestamp(),
      });
      setEditingId(null);
      setEditComment('');
      setEditOverall(0);
      // no reload needed; UI is real-time if combined with RatingsContext later
      // for now, manually patch state
      setItems(prev => prev.map(it => it.id === editingId ? { ...it, comment: editComment, overall: editOverall } : it));
    } catch (e) {
      setError(e.message || 'Failed to update');
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
      await deleteDoc(doc(db, 'feedbacks', id));
      setItems(prev => prev.filter(it => it.id !== id));
    } catch (e) {
      setError(e.message || 'Failed to delete');
    }
  };

  if (loading) return <div style={{ padding: 12 }}>Loading…</div>;

  return (
    <div style={{ padding: 12 }}>
      <h2>My Ratings</h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, margin: '8px 0' }}>
        <input
          placeholder="Search by instructor or course"
          value={filter}
          onChange={(e)=>setFilter(e.target.value)}
          style={{ flex: 1 }}
        />
        <select value={deptFilter} onChange={(e)=>setDeptFilter(e.target.value)}>
          <option value="">All Departments</option>
          {Array.from(new Set(items.map(r => r.deptName).filter(Boolean))).map(d => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <input type="month" value={dateFilter} onChange={(e)=>setDateFilter(e.target.value)} />
        <select value={sort} onChange={(e)=>setSort(e.target.value)}>
          <option value="date_desc">Newest</option>
          <option value="date_asc">Oldest</option>
          <option value="rating_desc">Rating: High to Low</option>
          <option value="rating_asc">Rating: Low to High</option>
        </select>
      </div>

      {error && <div style={{ color: '#b00020', marginBottom: 8 }}>{error}</div>}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: 8 }}>Instructor</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Course</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Overall</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Comment</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Date</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => (
              <tr key={r.id} style={{ borderTop: '1px solid #eee' }}>
                <td style={{ padding: 8 }}>{r.instructorName || r.instructorId}</td>
                <td style={{ padding: 8 }}>{r.courseCode || r.courseId}</td>
                <td style={{ padding: 8 }}>{r.overall?.toFixed ? r.overall.toFixed(1) : r.overall}</td>
                <td style={{ padding: 8 }}>
                  {editingId === r.id ? (
                    <input value={editComment} onChange={(e)=>setEditComment(e.target.value)} style={{ width: '100%' }} />
                  ) : (
                    r.comment || '-'
                  )}
                </td>
                <td style={{ padding: 8 }}>{r.createdAt?.toDate ? r.createdAt.toDate().toLocaleDateString() : '-'}</td>
                <td style={{ padding: 8, display: 'flex', gap: 8 }}>
                  {editingId === r.id ? (
                    <>
                      <button onClick={saveEdit}>Save</button>
                      <button onClick={cancelEdit}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <button onClick={()=>startEdit(r)}>Edit</button>
                      <button onClick={()=>remove(r.id)}>Delete</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 12 }}>
        {hasMore && (
          <button disabled={loading} onClick={()=>load(false)}>
            {loading ? 'Loading…' : 'Load More'}
          </button>
        )}
      </div>
    </div>
  );
}
