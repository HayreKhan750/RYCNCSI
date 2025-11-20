/* eslint-disable no-undef */
// Firebase Messaging service worker (compat build for background notifications)
importScripts('https://www.gstatic.com/firebasejs/10.12.4/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.4/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyCLo2N3SH2vx4iqBRHm9kPOHYbuo7FaiGs",
  authDomain: "rycncsi.firebaseapp.com",
  projectId: "rycncsi",
  storageBucket: "rycncsi.appspot.com",
  messagingSenderId: "493736749179",
  appId: "1:493736749179:web:fe0f83a45260522f981ade",
  measurementId: "G-DDEWJT5L03"
});

const messaging = firebase.messaging();

// Optional: customize background notification handling
messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || 'Notification';
  const options = {
    body: payload.notification?.body,
    icon: '/logo192.png'
  };
  self.registration.showNotification(title, options);
});
