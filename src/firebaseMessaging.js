import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { auth, db } from './firebase';
import { doc, arrayUnion, setDoc } from 'firebase/firestore';

let messagingInstance = null;

async function getMessagingSafe() {
  const supported = await isSupported().catch(() => false);
  if (!supported) return null;
  if (!messagingInstance) messagingInstance = getMessaging();
  return messagingInstance;
}

export async function requestNotificationsPermission() {
  try {
    const messaging = await getMessagingSafe();
    if (!messaging) {
      console.info('FCM not supported in this browser.');
      return null;
    }
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') return null;
    const vapidKey = process.env.REACT_APP_VAPID_KEY || '';
    if (!vapidKey) {
      console.warn('Missing REACT_APP_VAPID_KEY; skipping FCM token retrieval.');
      return null;
    }
    const token = await getToken(messaging, { vapidKey }).catch(() => null);
    if (!token) return null;
    const user = auth.currentUser;
    if (user) {
      await setDoc(
        doc(db, 'users', user.uid),
        { fcmTokens: arrayUnion(token) },
        { merge: true }
      );
    }
    return token;
  } catch (e) {
    console.error('Failed to get notifications permission', e);
    return null;
  }
}

export async function subscribeInAppMessages(handler) {
  const messaging = await getMessagingSafe();
  if (!messaging) return () => {};
  const unsub = onMessage(messaging, (payload) => handler?.(payload));
  return unsub;
}
