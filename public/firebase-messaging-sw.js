// public/firebase-messaging-sw.js

// On importe les scripts Firebase pour l'arrière-plan
importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-messaging-compat.js');

// Ta configuration exacte
const firebaseConfig = {
  apiKey: "AIzaSyBvLnDH1RHKzCSJxidecZZYgEo_30dwGrM",
  authDomain: "parksmart-44ee4.firebaseapp.com",
  projectId: "parksmart-44ee4",
  storageBucket: "parksmart-44ee4.firebasestorage.app",
  messagingSenderId: "936828579738",
  appId: "1:936828579738:web:08a585ad48a9b500925423"
};

// Initialisation
firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Gérer la notification quand l'app est en arrière-plan
messaging.onBackgroundMessage(function(payload) {
  console.log('🔔 [Service Worker] Notification reçue : ', payload);
  
  // Gérer le cas où notify vient de 'data' ou 'notification'
  const notificationTitle = payload.notification?.title || payload.data?.title || 'Nouvelle notification';
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.body || '',
    icon: '/logo192.png',
    data: payload.data
  };

  // IL EST CRUCIAL DE RETOURNER LA PROMESSE SUR TÉLÉPHONE POUR NE PAS TUER LE PROCESSUS EN ARRIÈRE-PLAN
  return self.registration.showNotification(notificationTitle, notificationOptions);
});