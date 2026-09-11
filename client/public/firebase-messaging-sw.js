importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging.js');

firebase.initializeApp({
  apiKey: "AIzaSyAnb2wKWv5Mx0aY4yWumYrfB69AX1jK7hM",
  authDomain: "evconnect-60823.firebaseapp.com",
  projectId: "evconnect-60823",
  storageBucket: "evconnect-60823.firebasestorage.app",
  messagingSenderId: "862815489749",
  appId: "1:862815489749:web:2e47e3a1efc2f698c05c5c"
});

const messaging = firebase.messaging();