import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bell, Clock, MapPin, AlertCircle, CheckCircle, Car, CreditCard, ShieldAlert } from 'lucide-react';
import '../styles/Notifications.css';

const Notifications = ({ onUnreadCountChange, activeReservation }) => {
  const [notifications, setNotifications] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [elapsedTime, setElapsedTime] = useState(0);

  // --- LOGIQUE TIMER (POUR RESERVATION ACTIVE) ---
  useEffect(() => {
    let interval = null;
    if (activeReservation) {
      let startMs = 0;
      
      // 🎯 STRATEGIE PRISE EN COMPTE DU DECALAGE HORAIRE
      // A. Avoir un startMs approximatif via date_arrivee (format ISO du back)
      if (activeReservation.date_arrivee) {
         let dateStr = activeReservation.date_arrivee;
         if (typeof dateStr === 'string') dateStr = dateStr.replace(' ', 'T');
         startMs = new Date(dateStr).getTime();
      }
      // Fallback ancien champ date_debut
      else if (activeReservation.date_debut) {
        let dateStr = activeReservation.date_debut;
        if (typeof dateStr === 'string') dateStr = dateStr.replace(' ', 'T');
        startMs = new Date(dateStr).getTime();
      }

      // B. Recalibration via temps_ecoule_secondes (Prioritaire pour corriger Timezone)
      // On calcule combien de temps s'est écoulé selon le serveur.
      if (activeReservation.temps_ecoule_secondes && activeReservation.temps_ecoule_secondes > 0) {
          const now = Date.now();
          const derivedStart = now - (activeReservation.temps_ecoule_secondes * 1000);
          
          // Si on a déjà un startMs, on regarde s'il y a un décalage suspect (> 1 min)
          if (startMs > 0) {
              const drift = Math.abs(startMs - derivedStart);
              // Si le décalage est grand, c'est un prob de timezone serveur vs client
              // On fait confiance au serveur pour la durée !
              if (drift > 60000) {
                  startMs = derivedStart;
              }
          } else {
              startMs = derivedStart;
          }
      }
      
      // C. Fallback total
      if (startMs === 0) {
          const created = activeReservation.created_at || activeReservation.date_creation;
          if (created) startMs = new Date(created.replace(' ','T')).getTime();
      }

      // 3. Dernier recours : temps relatif (si startMs est toujours 0)
      if (startMs === 0) {
        startMs = Date.now() - ((activeReservation.temps_ecoule_secondes || 0) * 1000);
      }

      const updateTimer = () => {
        const now = Date.now();
        const diffInSeconds = Math.floor((now - startMs) / 1000);
        setElapsedTime(diffInSeconds > 0 ? diffInSeconds : 0);
      };

      updateTimer(); // Appel immédiat
      interval = setInterval(updateTimer, 1000);
    } else {
      setElapsedTime(0);
    }
    return () => clearInterval(interval);
  }, [activeReservation]);

  // Formatage HH:MM:SS
  const formatDuration = (totalSeconds) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    // Pad avec 0 si nécessaire
    const pad = (n) => n.toString().padStart(2, '0');
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  };

  // 🕒 Fonction magique pour calculer le temps écoulé (ex: "Il y a 2 h")
  const formatTempsEcoule = (dateString) => {
    if (!dateString) return "À l'instant";
    const dateNotif = new Date(dateString);
    const maintenant = new Date();
    const differenceMinutes = Math.floor((maintenant - dateNotif) / 60000);

    if (differenceMinutes < 1) return "À l'instant";
    if (differenceMinutes < 60) return `${differenceMinutes} min`;
    if (differenceMinutes < 1440) return `${Math.floor(differenceMinutes / 60)} h`;
    return `${Math.floor(differenceMinutes / 1440)} j`;
  };

  // 1. Récupérer les données depuis la base de données
  useEffect(() => {
   const chargerNotifications = async () => {
      try {
        const token = sessionStorage.getItem('token');
        const userStr = sessionStorage.getItem('user');

        if (!token || !userStr) return;
        
        const user = JSON.parse(userStr);
        // On essaie id_cond, sinon id, sinon id_utilisateur...
        const monId = user.id_cond || user.id || user.id_utilisateur; 
        
        const urlApi = `${import.meta.env.VITE_API_URL}/api/notifications/${monId}`;
        const res = await axios.get(urlApi, {
          headers: { Authorization: `Bearer ${token}` }
        });

        // Filtrer : les notifications lues de plus d'un jour disparaissent
        const unJourEnMs = 24 * 60 * 60 * 1000;
        const maintenant = new Date().getTime();
        
        const notificationsFiltrees = (res.data || []).filter(notif => {
          if (notif.lu === 1) {
            const dateNotifObj = new Date(notif.date_notif || notif.date_creation).getTime();
            if (maintenant - dateNotifObj > unJourEnMs) {
              return false; // exclure si lu et > 1 jour
            }
          }
          return true;
        });

        // Tri par date décroissante
        const sortedNotifs = notificationsFiltrees.sort((a, b) => new Date(b.date_notif || b.date_creation) - new Date(a.date_notif || a.date_creation));

        setNotifications(sortedNotifs);
      } catch (error) {
        console.error('🚨 ERREUR API :', error);
      } finally {
        setChargement(false);
      }
    };

    chargerNotifications();
  }, []);

  // Calculer et envoyer le nombre de notifications non lues
  useEffect(() => {
    const unreadCount = notifications.filter(notif => notif.lu === 0).length;
    if (onUnreadCountChange) {
      onUnreadCountChange(unreadCount);
    }
  }, [notifications, onUnreadCountChange]);

  // 2. Marquer comme lu au clic
  const marquerCommeLu = async (id_notif, dejaLu) => {
    if (dejaLu === 1) return; 

    try {
      const token = sessionStorage.getItem('token');
      await axios.put(`${import.meta.env.VITE_API_URL}/api/notifications/marquer-lu/${id_notif}`, 
        {}, 
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setNotifications(notifications.map(notif => 
        notif.id_notif === id_notif ? { ...notif, lu: 1 } : notif
      ));
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  // Petite animation de chargement
  if (chargement) {
    return (
      <div className="loading-state">
         <div className="spinner"></div>
         <p style={{marginTop: '1rem', color: '#9ca3af', fontSize: '0.875rem'}}>Chargement...</p>
      </div>
    );
  }

  return (
    <div className="notifications-page">
      
      {/* EN-TÊTE DE LA PAGE */}
      <div className="notifications-header">
        <h1 className="notifications-title">
          <Bell className="notifications-title-icon" />
          Mes Alertes
        </h1>
      </div>

      <div className="notifications-container">
        
        {/* --- SECTION 1: ALERTES ACTIVE (Générées localement) --- */}
        {activeReservation && (
           <div className="active-reservation-card">
              {/* Cercle deco en fond */}
              <div className="card-decoration"></div>
              
              <div className="active-header">
                  <div className="status-badge">
                      <span className="status-dot"></span>
                      <span>En cours</span>
                  </div>
                  <Car size={24} style={{color: 'rgba(255,255,255,0.8)'}} />
              </div>
              
              <div className="parking-name-section">
                  <h3 className="parking-label">Stationnement</h3>
                  <div className="parking-value">
                      <MapPin size={16} style={{marginRight: '0.375rem', flexShrink: 0}} />
                      <span style={{overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                        {activeReservation.nom_parking || `Place #${activeReservation.id_place || '?'}`}
                      </span>
                  </div>
              </div>

              <div className="timer-box">
                  <span className="timer-label">
                    <Clock size={12} /> Durée
                  </span>
                  <span className="timer-display">
                      {formatDuration(elapsedTime)}
                  </span>
              </div>
              
              {/* INDICATION DE FACTURATION (Temps réel) */}
              <div className="alert-box" style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', marginTop: '10px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{display: 'flex', alignItems: 'center', gap: '5px'}}><AlertCircle size={16} color="#4ade80" /> Tarif estimé :</span>
                <span style={{fontWeight: 'bold', fontSize: '1.1rem'}}>{((elapsedTime / 3600) * 4).toFixed(2)} DH</span>
              </div>
           </div> 
        )}
        
        {/* --- SECTION 2: LISTE DES NOTIFICATIONS API --- */}
        <div style={{paddingTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem'}}>
            
            {notifications.length === 0 && !activeReservation ? (
              <div className="empty-state">
                <div className="empty-icon-circle">
                   <Bell size={40} color="#d1d5db" />
                </div>
                <h3 style={{color: '#4b5563', fontWeight: 600, marginBottom: '0.25rem'}}>Rien à signaler</h3>
                <p style={{color: '#9ca3af', fontSize: '0.75rem', maxWidth: '200px'}}>Vos notifications et rappels apparaîtront ici.</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div 
                  key={notif.id_notif}
                  onClick={() => marquerCommeLu(notif.id_notif, notif.lu)}
                  className={`notification-item ${notif.lu === 0 ? 'unread' : 'read'}`}
                >
                  <div className="notif-content-wrapper">
                    <div className={`notif-icon-circle ${notif.lu === 0 ? 'unread' : 'read'}`}>
                      {(() => {
                        const t = (notif.titre || '').toLowerCase();
                        if (t.includes('alerte') || t.includes('sécurité')) return <ShieldAlert size={16} color="#ef4444" />;
                        if (t.includes('paiement') || t.includes('facture')) return <CreditCard size={16} color="#3b82f6" />;
                        if (t.includes('bienvenue') || t.includes('succès')) return <CheckCircle size={16} color="#10b981" />;
                        return <Bell size={16} color="#4f46e5" />;
                      })()}
                    </div>
                    
                    <div className="notif-text-area">
                      <div className="notif-header">
                        <h4 className={`notif-title ${notif.lu === 0 ? 'unread' : 'read'}`}>
                          {notif.titre || "Notification"}
                        </h4>
                        <span className="notif-time">
                          {formatTempsEcoule(notif.date_notif || notif.date_creation)}
                        </span>
                      </div>
                      
                      <p className={`notif-message ${notif.lu === 0 ? 'unread' : 'read'}`}>
                        {notif.message}
                      </p>
                    </div>
                  </div>
                  
                  {/* Petit point indicateur pour non lu (style supplémentaire) */}
                  {notif.lu === 0 && (
                     <div className="unread-dot-indicator"></div>
                  )}
                </div>
              ))
            )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;
