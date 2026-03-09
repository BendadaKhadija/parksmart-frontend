// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth"; 
import { getMessaging, getToken, isSupported, onMessage } from "firebase/messaging"; // 👈 On importe 'isSupported' et 'onMessage'

const firebaseConfig = {
  apiKey: "AIzaSyBvLnDH1RHKzCSJxidecZZYgEo_30dwGrM",
  authDomain: "parksmart-44ee4.firebaseapp.com",
  projectId: "parksmart-44ee4",
  storageBucket: "parksmart-44ee4.firebasestorage.app",
  messagingSenderId: "936828579738",
  appId: "1:936828579738:web:08a585ad48a9b500925423"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// 🛡️ SÉCURITÉ : On initialise la messagerie uniquement si le navigateur le permet
export let messaging = null;
isSupported().then((supported) => {
  if (supported) {
    messaging = getMessaging(app);
  } else {
    console.warn("⚠️ Ce navigateur ou ce mode (ex: Navigation Privée) ne supporte pas les notifications.");
  }
});

// La fonction pour demander le Token
export const requestFirebaseToken = async () => {
  try {
    // Si la messagerie n'a pas pu se charger (navigation privée, etc.), on annule
    if (!messaging) {
      console.log("❌ Impossible de demander le token : environnement non supporté.");
      return null;
    }

    console.log("Demande de permission pour les notifications...");
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      const token = await getToken(messaging, { 
        // ⚠️ N'oublie pas de mettre ta vraie VAPID Key ici si tu l'as trouvée !
        vapidKey: "BF_dxKl4YZXYLpFE0XdIFj1mFAHAtuahx41XzJ258vW" 
      });
      console.log('✅ FCM Token généré :', token);
      return token;
    } else {
      console.warn("❌ Permission refusée par l'utilisateur.");
      return null;
    }
  } catch (error) {
    console.error("🚨 Erreur lors de la récupération du Token Firebase :", error);
    return null;
  }
};

// Écouter les messages quand l'application est AU PREMIER PLAN (ouverte)
export const onMessageListener = (callback) => {
  if (!messaging) return;
  return onMessage(messaging, (payload) => {
    callback(payload);
  });
};