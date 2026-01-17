import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { db } from '../firebase';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

const RatingsContext = createContext(null);

export function RatingsProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const unsubRef = useRef(null);

  useEffect(() => {
    // unsubscribe previous
    if (unsubRef.current) { unsubRef.current(); unsubRef.current = null; }
    if (!user) { setItems([]); return; }

    const fetchRatings = async () => {
        try {
            const q = query(
              collection(db, 'feedbacks'),
              where('studentId', '==', user.uid)
            );
            const snap = await getDocs(q);
            const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            
            // Client-side sort
            docs.sort((a, b) => {
                const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
                const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
                return tB - tA;
            });
            setItems(docs);
        } catch (err) {
            console.error('Ratings fetch failed', err);
            setItems([]);
        }
    };
    
    fetchRatings();

    return () => { if (unsubRef.current) unsubRef.current(); };
  }, [user?.uid]);

  const totals = useMemo(() => {
    const totalRated = items.length;
    const avgGiven = totalRated ? Math.round((items.reduce((a, r) => a + (r.overall || 0), 0) / totalRated) * 10) / 10 : 0;
    const recent = items.slice(0, 5);
    return { totalRated, avgGiven, recent };
  }, [items]);

  const createFeedback = async (payload) => {
    const now = serverTimestamp();
    const data = { ...payload, createdAt: now, updatedAt: now, studentId: user.uid };
    await addDoc(collection(db, 'feedbacks'), data);
  };

  const updateFeedback = async (id, patch) => {
    await updateDoc(doc(db, 'feedbacks', id), { ...patch, updatedAt: serverTimestamp() });
  };

  const deleteFeedback = async (id) => {
    await deleteDoc(doc(db, 'feedbacks', id));
  };

  const value = {
    items,
    totals,
    createFeedback,
    updateFeedback,
    deleteFeedback,
  };

  return (
    <RatingsContext.Provider value={value}>{children}</RatingsContext.Provider>
  );
}

export const useRatings = () => useContext(RatingsContext);
