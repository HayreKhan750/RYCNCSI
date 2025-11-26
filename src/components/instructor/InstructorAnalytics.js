import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { db } from '../../firebase';
import { collection, getDocs, orderBy, query, where } from 'firebase/firestore';

export default function InstructorAnalytics() {
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
          orderBy('createdAt', 'asc')
        );
        const snap = await getDocs(q);
        setItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } finally { setLoading(false); }
    };
    run();
  }, [user?.uid]);

  const stats = useMemo(() => {
    const total = items.length;
    const avg = total ? (items.reduce((a, r) => a + (r.overall || 0), 0) / total) : 0;
    const courseMap = new Map();
    items.forEach(f => {
      const key = f.courseCode || f.courseTitle || f.courseId;
      if (!key) return;
      const arr = courseMap.get(key) || [];
      arr.push(f.overall || 0);
      courseMap.set(key, arr);
    });
    const courseAverages = Array.from(courseMap.entries()).map(([k, arr]) => ({
      course: k,
      avg: Math.round((arr.reduce((a,b)=>a+b,0)/arr.length)*10)/10,
      count: arr.length,
    }));
    const pos = items.filter(f => (f.overall||0) > 3).length;
    const neu = items.filter(f => (f.overall||0) === 3).length;
    const neg = items.filter(f => (f.overall||0) < 3).length;
    return { total, avg: Math.round(avg*10)/10, courseAverages, distribution: { pos, neu, neg } };
  }, [items]);

  if (loading) return <div>Loading analytics…</div>;

  return (
    <div>
      <h2>Performance Analytics</h2>
      <div className="dashboard-cards" style={{ marginTop: 16 }}>
        <div className="dashboard-card"><h3>⭐ Average Rating</h3><p style={{ fontSize: 28, fontWeight: 700 }}>{stats.avg}★</p></div>
        <div className="dashboard-card"><h3>💬 Total Feedbacks</h3><p style={{ fontSize: 28, fontWeight: 700 }}>{stats.total}</p></div>
        <div className="dashboard-card"><h3>🙂/😐/🙁</h3><p style={{ fontSize: 16, fontWeight: 600 }}>{stats.distribution.pos}/{stats.distribution.neu}/{stats.distribution.neg}</p></div>
      </div>

      <div style={{ marginTop: 24 }}>
        <h3>Course Averages</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12 }}>
          {stats.courseAverages.map(c => (
            <div key={c.course} className="dashboard-card">
              <h4 style={{ margin: 0 }}>{c.course}</h4>
              <p style={{ margin: '8px 0 0 0', fontWeight: 700 }}>{c.avg}★ <span style={{ color: '#6b7280', fontWeight: 400 }}>({c.count})</span></p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <button onClick={() => {
          // Export CSV
          const rows = [['Course','Average','Count'], ...stats.courseAverages.map(c => [c.course, c.avg, c.count])];
          const csv = rows.map(r => r.map(x => `"${String(x).replaceAll('"','""')}"`).join(',')).join('\n');
          const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url; a.download = 'course-averages.csv'; a.click();
          URL.revokeObjectURL(url);
        }}>Export Analytics (CSV)</button>
      </div>

      <p style={{ color: '#6b7280', marginTop: 8 }}>Charts (Line/Bar/Pie) can be added with Recharts/Chart.js as a follow-up.</p>
    </div>
  );
}
