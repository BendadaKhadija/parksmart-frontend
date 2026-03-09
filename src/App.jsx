import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import React, { useEffect } from 'react';
import { onMessageListener } from './firebase';

// IMPORTS DES COMPOSANTS
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Testimonials from './components/Testimonials';
import Questions from './components/Questions';
import Connexion from './pages/Connexion';
import Inscription from './pages/inscription'; 
import AboutUs from './components/AboutUs';
import Solution from './components/solution.jsx';
import Footer from './components/Footer';
import DashboardManager from './pages/DashboardManager';
import ClientHome from './pages/ClientHome';
import Notifications from './pages/Notifications'; 

// 1. Protecteur pour l'Admin/Gestionnaire
function RequireManager({ children }) {
  // 👇 C'EST ICI LE POINT CRITIQUE : sessionStorage, pas localStorage !
  const userString = sessionStorage.getItem('user'); 
  
  if (!userString) return <Navigate to="/signin" replace />;
  const user = JSON.parse(userString);

  // Si ce n'est pas un gestionnaire, on le renvoie à l'accueil client
  if (user.role !== 'gestionnaire') {
      return <Navigate to="/home" replace />; 
  }
  return children;
}

// 2. Protecteur pour le Client/Conducteur
function RequireClient({ children }) {
  // 👇 ICI AUSSI : sessionStorage !
  const userString = sessionStorage.getItem('user');
  
  if (!userString) return <Navigate to="/signin" replace />;
  const user = JSON.parse(userString);
  
  // Si c'est un gestionnaire qui essaie de venir ici, on l'expulse vers son dashboard
  if (user.role === 'gestionnaire') {
    return <Navigate to="/admin/dashboard" replace />;
  }
  return children;
}
// ==========================================
// 🏠 PAGE D'ACCUEIL
// ==========================================
function HomePage() {
  return (
    <>
      <Hero />
      <Testimonials />
      <AboutUs />
      <Questions /> 
      <Solution />
      <Footer />
    </>
  );
}

// ==========================================
// 🔀 COMPOSANT INTERMÉDIAIRE (ROUTAGE)
// ==========================================
function AppContent() {
  const location = useLocation();
  
  // Écoute des notifications Firebase en premier plan
  useEffect(() => {
    const unsubscribe = onMessageListener((payload) => {
      console.log("Message reçu en premier plan :", payload);
      const title = payload?.notification?.title || payload?.data?.title || "Nouvelle notification";
      const body = payload?.notification?.body || payload?.data?.body || "";
      
      if (Notification.permission === 'granted') {
        new Notification(title, {
          body: body,
          icon: '/logo192.png'
        });
      } else {
        alert(`🔔 ${title}\n${body}`);
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // On cache la navbar sur les routes d'dashboard uniquement (et notifications si besoin)
  // CLIENT VEUT LE HEADER SUR LOGIN/SIGNUP
  const hideNavbarRoutes = ['/admin/dashboard', '/notifications', '/client-home', '/home'];
  const shouldShowNavbar = !hideNavbarRoutes.includes(location.pathname);

  return (
    <>
      {shouldShowNavbar && <Navbar />}
      
      <Routes>
        <Route path="/" element={<HomePage />} />
        
        {/* Authentification */}
        <Route path="/signin" element={<Connexion />} />
        <Route path="/signup" element={<Inscription />} />
        
        {/* Pages publiques */}
        <Route path="/testimonials" element={<Testimonials />} />
        <Route path="/about" element={<AboutUs />} /> 
        <Route path="/questions" element={<Questions />} /> 
        <Route path="/solution" element={<Solution />} />
        
        {/* ========================================== */}
        {/* 🔒 PAGES PRIVÉES (PROTÉGÉES)               */}
        {/* ========================================== */}
        
        {/* Dashboard Manager protégé */}
        <Route 
          path="/admin/dashboard" 
          element={
            <RequireManager>
              <DashboardManager />
            </RequireManager>
          } 
        />
        
        {/* Espace Client protégé */}
        <Route 
          path="/client-home" 
          element={
            <RequireClient>
              <ClientHome />
            </RequireClient>
          } 
        /> 
        <Route 
          path="/notifications" 
          element={
            <RequireClient>
              <Notifications />
            </RequireClient>
          } 
        />
        {/* Sécurité si le login renvoie vers /home */}
        <Route 
          path="/home" 
          element={
            <RequireClient>
              <ClientHome />
            </RequireClient>
          } 
        />
        
      </Routes>
    </>
  );
}

// ==========================================
// 🚀 POINT D'ENTRÉE PRINCIPAL
// ==========================================
function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;