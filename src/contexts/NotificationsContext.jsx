import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, orderBy, query, where, limit } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

const NotificationsContext = createContext(null);

export function NotificationsProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const unsubRef = useRef(null);

  useEffect(() => {
    if (unsubRef.current) { unsubRef.current(); unsubRef.current = null; }
    if (!user) { setItems([]); return; }
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    unsubRef.current = onSnapshot(q, (snap) => {
      setItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, () => setItems([]));
    return () => { if (unsubRef.current) unsubRef.current(); };
  }, [user?.uid]);

  const unreadCount = useMemo(() => items.filter(n => !n.read).length, [items]);

  const value = { items, unreadCount };
  return (
    <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationsContext);
