import { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit,
  doc,
  updateDoc,
  deleteDoc,
  addDoc,
  serverTimestamp,
  getCountFromServer 
} from 'firebase/firestore';

export function useAdminData() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalInstructors: 0,
    totalRatings: 0,
    flaggedCount: 0
  });
  const [users, setUsers] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [logs, setLogs] = useState([]);

  // Log action helper
  const logAction = async (action, target, details) => {
    try {
      await addDoc(collection(db, 'admin_logs'), {
        action,
        target,
        details,
        timestamp: serverTimestamp(),
        adminId: 'current-admin-uid' // Replace with actual auth uid if available in context
      });
    } catch (e) { console.error("Log failed", e); }
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Aggregations (using getCountFromServer for efficiency if available, else length)
      // For this demo, we assume client-side counting is okay or use estimated counts
      const studentSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'student')));
      const instructorSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'instructor')));
      const ratingSnap = await getDocs(collection(db, 'feedbacks')); // Assuming feedbacks are ratings
      
      // Mock flagged count or real query if 'flagged' field exists
      // const flaggedSnap = await getCountFromServer(query(collection(db, 'feedbacks'), where('flagged', '==', true)));

      setStats({
        totalStudents: studentSnap.size,
        totalInstructors: instructorSnap.size,
        totalRatings: ratingSnap.size,
        flaggedCount: 5 // Mock for demo
      });

      setUsers([...studentSnap.docs.map(d => ({id: d.id, ...d.data()})), ...instructorSnap.docs.map(d => ({id: d.id, ...d.data()}))]);
      setRatings(ratingSnap.docs.map(d => ({id: d.id, ...d.data()})));

      // Fetch Logs
      const logsSnap = await getDocs(query(collection(db, 'admin_logs'), orderBy('timestamp', 'desc'), limit(20)));
      setLogs(logsSnap.docs.map(d => ({id: d.id, ...d.data()})));

    } catch (err) {
      console.error("Admin fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Actions
  const deleteUser = async (uid) => {
    if(!window.confirm("Delete this user permanently?")) return;
    await deleteDoc(doc(db, 'users', uid));
    await logAction('DELETE_USER', uid, 'Deleted user account');
    setUsers(prev => prev.filter(u => u.id !== uid));
  };

  const approveInstructor = async (uid) => {
    await updateDoc(doc(db, 'users', uid), { status: 'approved' });
    await logAction('APPROVE_INSTRUCTOR', uid, 'Approved instructor application');
    setUsers(prev => prev.map(u => u.id === uid ? {...u, status: 'approved'} : u));
  };

  const deleteRating = async (id) => {
    if(!window.confirm("Delete this rating?")) return;
    await deleteDoc(doc(db, 'feedbacks', id));
    await logAction('DELETE_RATING', id, 'Removed abusive content');
    setRatings(prev => prev.filter(r => r.id !== id));
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return { loading, stats, users, ratings, logs, deleteUser, approveInstructor, deleteRating, refresh: fetchDashboardData };
}
