import React, { useEffect, useState } from 'react';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { doc, getDoc, onSnapshot, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';

export default function InstructorAISummary() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [regenLoading, setRegenLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const ref = doc(db, 'ai_summaries', user.uid);
    const unsub = onSnapshot(ref, (snap) => {
      setSummary(snap.exists() ? snap.data() : null);
      setLoading(false);
    }, (e) => { setError(e.message || 'Failed to load summary'); setLoading(false); });
    return () => unsub();
  }, [user?.uid]);

  const requestRegenerate = async () => {
    if (!user) return;
    setRegenLoading(true);
    try {
      const ref = doc(db, 'ai_summaries', user.uid);
      const existing = await getDoc(ref);
      if (!existing.exists()) {
        await setDoc(ref, { summaryText: '', updatedAt: serverTimestamp(), regenRequested: true, requestedAt: serverTimestamp() });
      } else {
        await updateDoc(ref, { regenRequested: true, requestedAt: serverTimestamp() });
      }
    } catch (e) {
      setError(e.message || 'Failed to request regenerate');
    } finally { setRegenLoading(false); }
  };

  if (!user) return <div style={{ padding: 12 }}>Please sign in.</div>;
  if (loading) return <div style={{ padding: 12 }}>Loading AI summary…</div>;

  return (
    <div style={{ padding: 12 }}>
      <h2>AI Feedback Summary</h2>
      <p style={{ color: '#6b7280' }}>Automatically summarizes your recent student comments.</p>

      <div style={{ marginTop: 12, padding: 16, border: '1px solid #e5e7eb', borderRadius: 12, background: '#fff' }}>
        {summary?.summaryText ? (
          <p style={{ whiteSpace: 'pre-wrap' }}>{summary.summaryText}</p>
        ) : (
          <p style={{ color: '#6b7280' }}>No summary generated yet.</p>
        )}
        <div style={{ marginTop: 8, fontSize: 12, color: '#6b7280' }}>
          {summary?.updatedAt?.toDate ? `Last updated: ${summary.updatedAt.toDate().toLocaleString()}` : '—'}
          {summary?.regenRequested ? ' • Regeneration requested' : ''}
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <button onClick={requestRegenerate} disabled={regenLoading}>
          {regenLoading ? 'Requesting…' : 'Regenerate Summary'}
        </button>
      </div>

      {error && <div style={{ color: '#b00020', marginTop: 8 }}>{error}</div>}
    </div>
  );
}
