import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { db } from '../../firebase';
import { collection, getDocs, limit, orderBy, query, where } from 'firebase/firestore';

export default function InstructorOverview() {
  const { user } = useSelector((state) => state.auth);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const run = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, 'feedbacks'),
          where('instructorId', '==', user.uid),
          orderBy('createdAt', 'desc'),
          limit(100)
        );
        const snap = await getDocs(q);
        setItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [user?.uid]);

  const kpis = useMemo(() => {
    const total = items.length;
    const avg = total ? Math.round((items.reduce((a, r) => a + (r.overall || 0), 0) / total) * 10) / 10 : 0;
    const byCourse = new Map();
    items.forEach(f => {
      const key = f.courseCode || f.courseTitle || f.courseId;
      if (!key) return;
      byCourse.set(key, (byCourse.get(key) || 0) + 1);
    });
    let topCourse = '-';
    let topCount = 0;
    byCourse.forEach((count, k) => { if (count > topCount) { topCount = count; topCourse = k; } });
    const recent = items.slice(0, 3);
    return { total, avg, topCourse, recent };
  }, [items]);

  if (loading) return <div>Loading overview…</div>;

  return (
    <div>
      <h2>Instructor Overview</h2>
      <div className="dashboard-cards" style={{ marginTop: 16 }}>
        <div className="dashboard-card">
          <h3>⭐ Average Rating</h3>
          <p style={{ fontSize: 28, fontWeight: 700 }}>{kpis.avg}★</p>
        </div>
        <div className="dashboard-card">
          <h3>💬 Total Feedbacks</h3>
          <p style={{ fontSize: 28, fontWeight: 700 }}>{kpis.total}</p>
        </div>
        <div className="dashboard-card">
          <h3>📈 Top Course</h3>
          <p style={{ fontSize: 18, fontWeight: 600 }}>{kpis.topCourse}</p>
        </div>
      </div>

      {kpis.recent.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <h3>📅 Latest Feedback</h3>
          <ul style={{ listStyle: 'none', padding: 0, marginTop: 12 }}>
            {kpis.recent.map(r => (
              <li key={r.id} style={{ padding: '12px 16px', background: '#fff', borderRadius: 10, border: '1px solid #e5e7eb', marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{r.courseCode || r.courseTitle || r.courseId}</div>
                    <div style={{ fontSize: 13, color: '#6b7280' }}>{r.comment || '—'}</div>
                  </div>
                  <div style={{ fontWeight: 600 }}>{r.overall || 0}★</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <a href="#" onClick={(e)=>{e.preventDefault(); window.scrollTo({top:0,behavior:'smooth'});}} className="card-button">View All Feedbacks</a>
        <a href="#" onClick={(e)=>{e.preventDefault(); window.scrollTo({top:0,behavior:'smooth'});}} className="card-button">Analytics</a>
      </div>
    </div>
  );
}
