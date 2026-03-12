// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth"; 
import { getMessaging, getToken, isSupported, onMessage } from "firebase/messaging"; // 👈 On importe 'isSupported' et 'onMessage'

// 🔒 Sécurité : Les clés de configuration ne doivent jamais être en clair dans le code.
// Utilisez des variables d'environnement comme décrit dans votre rapport.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
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
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
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