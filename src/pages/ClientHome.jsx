import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import axios from 'axios'; 
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import ParkingTimer from '../components/ParkingTimer.jsx';
import '../styles/ClientHome.css'; 
import { FaCamera } from 'react-icons/fa';
import ClientHistory from './ClientHistory';
import Notification from './Notifications.jsx';
import { useTranslation } from '../i18n.jsx';
import { LanguageSwitcher } from '../i18n.jsx';

// --- CONFIG ICONS DELETED TO USE DYNAMIC ONES INSIDE COMPONENT ---


function RecenterMap({ position }) { const map = useMap(); const hasCentered = useRef(false); useEffect(() => { if (position && !hasCentered.current) { map.flyTo(position, 15, { animate: true, duration: 2 }); hasCentered.current = true; } }, [position, map]); return null; }
function MapClickHandler({ onMapClick }) { useMapEvents({ click: () => onMapClick() }); return null; }

// --- HELPER: Compute rotation from touches ---
const getAngle = (touches) => {
    const t1 = touches[0];
    const t2 = touches[1];
    return Math.atan2(t2.clientY - t1.clientY, t2.clientX - t1.clientX) * 180 / Math.PI;
};

function ClientHome() {
  const { t } = useTranslation();
  // --- NAVIGATION ---
  const [currentReservation, setCurrentReservation] = useState(null);
  const [activeTab, setActiveTab] = useState('home'); 
  const [profilePage, setProfilePage] = useState('main'); 
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [historyDetailView, setHistoryDetailView] = useState(false);
  const [occupiedSpots, setOccupiedSpots] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadNotifications, setUnreadNotifications] = useState(0);
 
  const [placesDuParking, setPlacesDuParking] = useState([]);
  // --- DATA USER ---
  const [userData, setUserData] = useState({ prenom: '', nom: '', email: '' });
  const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' });
  const [expandedFAQ, setExpandedFAQ] = useState(null);

  // --- MAP STATE ---
  const defaultPosition = [34.020882, -6.841650]; 
  const [userPosition, setUserPosition] = useState(null);
  const [parkings, setParkings] = useState([]);
  const [selectedParking, setSelectedParking] = useState(null);
  const [parkingRating, setParkingRating] = useState({ note: '-', total: 0 }); // <-- NOUVEAU STATE POUR LES AVIS
  const [showGrid, setShowGrid] = useState(false);
  const [activeFloor, setActiveFloor] = useState(1);

const [imageFile, setImageFile] = useState(null);
const [imagePreview, setImagePreview] = useState(null);
  // --- ÉTAT DES PLACES ET RÉSERVATION ---
  // occupiedSpots = places prises par les autres
  // On initialise avec un tableau vide : aucune place n'est prise au début.
  const [chosenSpot, setChosenSpot] = useState(null);
  const isPayingRef = useRef(false);

  // --- MAP ROTATION ---
  const [mapRotation, setMapRotation] = useState(0);
  const mapRotationRef = useRef(mapRotation);
  
  // Sync Ref
  useEffect(() => { mapRotationRef.current = mapRotation; }, [mapRotation]);

  // --- GESTURE & TOUCH ROTATION ---
  useEffect(() => {
      const container = document.getElementById('map-rotation-container');
      if (!container) return;

      let startAngle = 0;
      let initialRotation = 0;

      const getTouchAngle = (touches) => {
          const t1 = touches[0];
          const t2 = touches[1];
          return Math.atan2(t2.clientY - t1.clientY, t2.clientX - t1.clientX) * 180 / Math.PI;
      };

      const handleTouchStart = (e) => {
          if (e.touches.length === 2) {
              startAngle = getTouchAngle(e.touches);
              initialRotation = mapRotationRef.current;
          }
      };

      const handleTouchMove = (e) => {
          if (e.touches.length === 2) {
              e.preventDefault();
              const currentAngle = getTouchAngle(e.touches);
              // Calculate delta and add to initial rotation
              let delta = currentAngle - startAngle;
              setMapRotation(initialRotation - delta); // INVERSION DE LA ROTATION
          }
      };

      container.addEventListener('touchstart', handleTouchStart, { passive: false });
      container.addEventListener('touchmove', handleTouchMove, { passive: false });
      
      return () => {
          container.removeEventListener('touchstart', handleTouchStart);
          container.removeEventListener('touchmove', handleTouchMove);
      };
  }, []);

  // --- DYNAMIC ICONS (Counter-Rotation via CSS Variable for Performance) ---
  const createRotatedHtml = (innerHtml, width, height) => {
      // On utilise une variable CSS pour la rotation inverse.
      // Cela évite de recréer l'icône à chaque frame et assure une synchro parfaite.
      return `<div style="transform: rotate(calc(-1 * var(--map-rotation, 0deg))); width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">${innerHtml}</div>`;
  };

  // Note: On retire [mapRotation] des dépendances car la rotation est gérée par CSS
  const userIcon = useMemo(() => L.divIcon({
        className: 'custom-user-icon',
        html: createRotatedHtml( 
            `<div style="width: 20px; height: 20px; background-color: #3b82f6; border-radius: 50%; border: 3px solid white;" class="user-pulse-marker"></div>`,
            30, 30
        ),
        iconSize: [30, 30],
        iconAnchor: [15, 15]
  }), []); 

  // Fonction pour créer l'icône de parking dynamiquement avec son prix
  const createParkingIcon = (parking) => {
      const prix = parking.tarif_heure || parking.tarif_horaire || parking.prix_heure || '10'; // Valeur par défaut 10 si non défini
      return L.divIcon({
          className: 'custom-parking-icon',
          html: createRotatedHtml(
              `<div class="parking-pulse-container" style="width: 45px; height: 50px; position: relative; display: flex; flex-direction: column; align-items: center;">
                   <div class="parking-pulse-ring" style="top: 35%; width: 35px; height: 35px;"></div>
                   <img src="https://cdn-icons-png.flaticon.com/512/3005/3005359.png" style="width: 35px; height: 35px; object-fit: contain; position: relative; z-index: 2;" />
                   <div style="background-color: white; border-radius: 4px; padding: 2px 5px; font-weight: 800; font-size: 11px; box-shadow: 0 2px 4px rgba(0,0,0,0.3); z-index: 3; margin-top: -3px; color: #1e293b; border: 1px solid #e2e8f0; white-space: nowrap;">
                       ${prix} DH/h
                   </div>
               </div>`,
              45, 50
          ),
          iconSize: [45, 50],
          iconAnchor: [22.5, 50],
          popupAnchor: [0, -50]
      });
  };

  useEffect(() => {
   const verifierReservationExistante = async () => {
        try {
            // 1. Récupérer le token du stockage local
            const token = sessionStorage.getItem('token'); 
            const user = JSON.parse(sessionStorage.getItem('user'));

            if (!token || !user) return; // Si pas connecté, on ne vérifie pas

            // 2. Envoyer le token dans le header Authorization
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/reservation/active`, {
                headers: {
                    Authorization: `Bearer ${token}` // <--- C'EST CA QUI MANQUE
                },
                params: {
                    userId: user.id // Optionnel si ton back utilise le token pour trouver l'ID
                }
            });

            // Traitement de la réponse...
            if (res.data) {
                console.log("Réservation active trouvée :", res.data);
                setCurrentReservation(res.data);
                if (res.data.id_place) {
                    setOccupiedSpots(prev => prev.includes(res.data.id_place) ? prev : [...prev, res.data.id_place]);
                }
            }

        } catch (error) {
            // Si c'est une 404, c'est une bonne nouvelle (pas de réservation active)
            if (error.response && error.response.status === 404) {
                console.log("Aucune réservation active (C'est normal).");
            } else {
                console.error("Erreur vérification réservation:", error);
            }
        }
    };

    verifierReservationExistante();
  }, []);

  // --- CHARGER LE BADGE NOTIFICATIONS AU DÉMARRAGE ---
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const token = sessionStorage.getItem('token');
        const userStr = sessionStorage.getItem('user');
        if (!token || !userStr) return;
        const user = JSON.parse(userStr);
        const monId = user.id_cond || user.id || user.id_utilisateur;
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/notifications/${monId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const unread = (res.data || []).filter(n => n.lu === 0).length;
        setUnreadNotifications(unread);
      } catch (e) {
        setUnreadNotifications(0);
      }
    };
    fetchUnreadCount();
  }, []);

  // --- CHARGEMENT INITIAL & SUIVI GPS ---
  useEffect(() => {
    console.log("🛰️ Lancement du suivi GPS...");

    let watchId = null;

    if (!navigator.geolocation) {
      alert(t('alert_geolocation_unsupported'));
      setUserPosition([34.020882, -6.841650]);
    } else {
        // Demander la permission et obtenir la position exacte
        // enableHighAccuracy: true FORCE le GPS hardware (pas juste le WiFi/IP)
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const { latitude, longitude, accuracy } = pos.coords;
            console.log(`✅ GPS Rapide - Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}, Précision: ${accuracy.toFixed(0)}m`);
            setUserPosition([latitude, longitude]);
          },
          (err) => {
            console.warn(`⚠️ GPS rapide échoué (code ${err.code}), position par défaut.`);
            if (err.code === 1) {
                alert(t('alert_geolocation_permission'));
            } else if (err.code === 2) {
                alert(t('alert_gps_unavailable'));
            } else if (err.code === 3) {
                alert(t('alert_gps_timeout'));
            }
            setUserPosition([34.020882, -6.841650]);
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
        );

        // 2. Puis suivi précis en arrière-plan pour affiner
        watchId = navigator.geolocation.watchPosition(
          (pos) => {
            const { latitude, longitude, accuracy } = pos.coords;
            console.log(`✅ GPS Suivi - Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}, Précision: ${accuracy.toFixed(0)}m`);
            setUserPosition([latitude, longitude]);
          },
          (err) => {
            console.warn(`⚠️ Erreur Suivi GPS (code ${err.code}): ${err.message}`);
          },
          { 
            enableHighAccuracy: true,
            timeout: 20000,
            maximumAge: 10000 
          }
        );
    }

    // 2. Charger les parkings
    const fetchParkings = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/parkings`);
            setParkings(res.data);
        } catch (error) {
            console.error("❌ Erreur chargement parkings :", error);
        }
    };
    fetchParkings();

    // 3. RECUP USER
    const storedUser = sessionStorage.getItem('user');
    if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUserData({ 
          id: parsedUser.id_cond || parsedUser.id || parsedUser.id_utilisateur,        
          prenom: parsedUser.prenom || '', 
          nom: parsedUser.nom || '', 
          email: parsedUser.email || '',
          photo: parsedUser.photo || ''       
        });
    }

    // Nettoyer le suivi GPS quand le composant est démonté
    return () => {
      console.log("🛑 Arrêt du suivi GPS.");
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    };
  }, []); // Se lance une seule fois au montage
 // --- RAFRAÎCHISSEMENT AUTOMATIQUE ---
useEffect(() => {
    let intervalId; 

    if (selectedParking) {
        // 1. Récupération des places
        const fetchPlaces = () => {
            axios.get(`${import.meta.env.VITE_API_URL}/api/places/${selectedParking.id_park}`)
                .then(res => {
                    // 🔥 LA CORRECTION EST ICI 🔥
                    // On utilise la version avec callback de setState pour accéder à l'état précédent
                    setPlacesDuParking(prevPlaces => {
                        // On compare grossièrement les deux tableaux (version facile)
                        // S'ils sont identiques, on retourne l'ancien tableau pour annuler le re-rendu
                        if (JSON.stringify(prevPlaces) === JSON.stringify(res.data)) {
                            return prevPlaces; 
                        }
                        // Sinon, on met à jour avec les nouvelles données
                        return res.data;
                    });
                })
                .catch(err => console.error("Erreur silencieuse chargement places:", err));
        };

        fetchPlaces();
        intervalId = setInterval(fetchPlaces, 3000);

        // 2. NOUVEAU: Récupération des avis/notes (Table `avis`) avec la bonne route
        axios.get(`${import.meta.env.VITE_API_URL}/api/parkings/${selectedParking.id_park}/reviews`)
            .then(res => {
                const avisList = res.data;
                if (avisList && avisList.length > 0) {
                    // Calcul de la moyenne des notes
                    const sommeNotes = avisList.reduce((acc, curr) => acc + Number(curr.note), 0);
                    const moyenne = (sommeNotes / avisList.length).toFixed(1);
                    setParkingRating({ note: moyenne, total: avisList.length });
                } else {
                    // Aucun avis trouvé
                    setParkingRating({ note: "Nouveau", total: 0 });
                }
            })
            .catch(err => {
                // Si l'API d'avis n'existe pas encore ou échoue, on affiche des valeurs par défaut pour ne pas bloquer
                console.log("Avis non trouvés, utilisation des valeurs par défaut", err.message);
                setParkingRating({ 
                    note: selectedParking.note || (4.0 + (selectedParking.id_park % 5) * 0.2).toFixed(1), 
                    total: selectedParking.nb_avis || (50 + (selectedParking.id_park % 10) * 15) 
                });
            });
    }

    return () => {
        if (intervalId) clearInterval(intervalId);
    };
}, [selectedParking]);
const checkActiveReservation = () => {
    const token = sessionStorage.getItem('token');
    const userStr = sessionStorage.getItem('user');
    if (!token || !userStr) return;

    const user = JSON.parse(userStr);

    // On renvoie le userId car le backend semble s'en servir pour filtrer
    axios.get(`${import.meta.env.VITE_API_URL}/api/reservation/active`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { userId: user.id }
    }) 
        .then(res => {
            // Uniquement mettre à jour si différent pour éviter boucles infinies
            // Mais ici on veut rafraichir le temps écoulé, donc on force un peu update
            setCurrentReservation(prev => {
                if (!prev) return res.data;
                // Si l'ID est le même, on update juste le temps écoulé
                if (prev.id_resa === res.data.id_resa || prev.id === res.data.id) {
                     return { ...prev, temps_ecoule_secondes: res.data.temps_ecoule_secondes };
                }
                return res.data;
            });
            // Si une réservation est trouvée, on ajoute la place aux places occupées visuellement
            setOccupiedSpots(prev => {
                if (!prev.includes(res.data.id_place)) return [...prev, res.data.id_place];
                return prev;
            });
        })
        .catch(err => {
            if (err.response && err.response.status === 404) {
                if (!isPayingRef.current) {
                    setCurrentReservation(null);
                }
            } else {
                console.error("Erreur lors de la vérification :", err);
            }
        });
};

// --- POLL RESERVATION TO KEEP TIMER SYNCED ---
useEffect(() => {
    if (!currentReservation) return;
    const interval = setInterval(() => {
        if (sessionStorage.getItem('token')) {
            checkActiveReservation();
        }
    }, 15000);
    return () => clearInterval(interval);
}, [currentReservation]);

 const handleStartReservation = async () => {
      if (!chosenSpot) return;
      const token = sessionStorage.getItem('token');

      try {
          const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/reservation/start`, {
              id_place: chosenSpot
          }, {
              headers: { Authorization: `Bearer ${token}` }
          });

          console.log("Succès réservation :", res.data);

          // 🔥 LA CORRECTION EST ICI 🔥
          // Au lieu de bricoler un faux objet 'newResa', on recharge la VRAIE 
          // réservation depuis la BDD (exactement l'effet magique du F5 !)
          checkActiveReservation(); 

          // On met à jour l'affichage de la grille
          setOccupiedSpots([...occupiedSpots, chosenSpot]); 
          setShowGrid(false); 
          alert(t('alert_spot_reserved'));

      } catch (error) {
          console.error("Erreur API Réservation :", error.response || error);
          const msg = error.response?.data?.message || t('alert_network_error');
          alert(`❌ ${msg}`);
      }
  };

  const handleStopReservation = async () => {
      if (!currentReservation) return;
      const token = sessionStorage.getItem('token');

      if(!window.confirm(t('confirm_stop_reservation'))) return;

      try {
          const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/reservation/stop`, {
              id_resa: currentReservation.id_resa
          }, {
              headers: { Authorization: `Bearer ${token}` }
          });

          // Calculer le montant réel basé sur le temps écoulé et le tarif
          const tempsEcouleSecondes = currentReservation.temps_ecoule_secondes || 0;
          const tempsEcouleHeures = tempsEcouleSecondes / 3600;
          const tarif = parseFloat(
            selectedParking?.tarif_heure || 
            selectedParking?.tarif_horaire ||
            (currentReservation && parkings.find(p => p.id_park === currentReservation.id_park)?.tarif_heure) ||
            10
          );
          
          // Appliquer le minimum d'1 heure (comme le backend)
          const heuresFacturees = Math.max(1, Math.ceil(tempsEcouleHeures * 4) / 4); // Arrondir à 0.25h (15 min)
          const montantCalcule = (heuresFacturees * tarif).toFixed(2);
          const montantBackend = res.data.montant || montantCalcule;
          
          const tempsMinutes = Math.floor(tempsEcouleSecondes / 60);
          const tempsSecondes = tempsEcouleSecondes % 60;
          const tempsHeures = Math.floor(tempsEcouleSecondes / 3600);
          
          const affichageTemps = tempsHeures > 0 
            ? `${tempsHeures}h ${tempsMinutes % 60}m ${tempsSecondes}s`
            : `${tempsMinutes}m ${tempsSecondes}s`;
          
          alert(
            t('alert_payment_validated', { amount: montantBackend }) + 
            `\n\n📊 Détail de facturation:\nTemps: ${affichageTemps}\nTarif: ${tarif} DH/h\nMinimum horaire: 1 heure\nHeures facturées: ${heuresFacturees}h\nMontant: ${heuresFacturees}h × ${tarif} DH/h = ${montantCalcule} DH`
          );

          // RESET
          setOccupiedSpots(occupiedSpots.filter(id => id !== currentReservation.id_place));
          setCurrentReservation(null);
          setChosenSpot(null);

      } catch (error) {
          console.error(error);
          alert(t('alert_payment_error'));
      }
  };
// 2. AJOUTE LA GESTION DE L'IMAGE
  const handleImageChange = (e) => {
      const file = e.target.files[0];
      if (file) {
          setImageFile(file);
          setImagePreview(URL.createObjectURL(file));
      }
  };
const handleUpdateUser = async () => {
    try {
        const formData = new FormData();
        
        // Envoyer l'ID utilisateur (comme le fait DashboardManager)
        const storedUser = JSON.parse(sessionStorage.getItem('user'));
        const idUser = storedUser?.id_cond || storedUser?.id || storedUser?.id_utilisateur;
        if (idUser) formData.append('id_user', idUser);
        
        formData.append('nom', userData.nom);
        formData.append('prenom', userData.prenom);
        formData.append('email', userData.email);

        if (imageFile) {
            formData.append('image', imageFile); // Même nom que l'inscription et le manager
        }
        
        const url = `${import.meta.env.VITE_API_URL}/api/profile`;
        
        const response = await axios.put(url, formData, {
            headers: {
                'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
                'Content-Type': 'multipart/form-data'
            }
        });

        if (response.status === 200) {
            alert(t('alert_profile_updated'));
            
            // On récupère l'user mis à jour (gestion de la structure de réponse)
            let updatedUser = response.data.user || (response.data.id_user ? response.data : null);

            if (updatedUser) {
                // On applique la même logique que Connexion : conducteur -> client
                if (updatedUser.role === 'conducteur') {
                    updatedUser.role = 'client';
                }
                
                // --- FIX: Forcer la mise à jour de l'image (Cache-Busting) ---
                if (updatedUser.photo) {
                    const timestamp = new Date().getTime();
                    // Si l'URL contient déjà '?', on utilise '&', sinon '?'
                    const sep = updatedUser.photo.includes('?') ? '&' : '?';
                    updatedUser.photo = `${updatedUser.photo}${sep}t=${timestamp}`;
                } else if (imagePreview) {
                    // Si le backend n'a pas renvoyé de photo mais qu'on a un preview local, on l'utilise temporairement
                    // (Même si c'est un blob, ça marchera pour la session courante)
                    updatedUser.photo = imagePreview;
                }

                console.log("Mise à jour locale effectuée :", updatedUser);
                setUserData(updatedUser);
                sessionStorage.setItem('user', JSON.stringify(updatedUser)); // On sauvegarde dans la session
            } else {
                // Fallback si l'API ne renvoie pas l'user complet
                const fallbackUser = { ...userData, ...Object.fromEntries(formData) };
                
                // Si on a une image preview, on force son affichage immédiat
                if (imagePreview) {
                    fallbackUser.photo = imagePreview;
                }

                // On enlève l'objet File pour éviter de le stocker (ça plante JSON.stringify)
                delete fallbackUser.avatar; 
                
                setUserData(fallbackUser);
                sessionStorage.setItem('user', JSON.stringify(fallbackUser));
            }

            setImageFile(null); 
            setImagePreview(null);
        }
    } catch (error) {
        console.error("Erreur mise à jour:", error);
        alert(t('alert_profile_update_error'));
    }
};
  const handleUpdatePassword = async () => {
      if(passwordData.new !== passwordData.confirm) { alert(t('alert_pass_mismatch')); return; }
      
      try {
          // Utilisation de la route générique de mise à jour utilisateur avec le champ password
          const formData = new FormData();
          const storedUser = JSON.parse(sessionStorage.getItem('user'));
          const idUser = storedUser?.id_cond || storedUser?.id || storedUser?.id_utilisateur;
          
          if (idUser) formData.append('id_user', idUser);
          formData.append('password', passwordData.new); // On envoie le nouveau mot de passe
          // On peut aussi envoyer currentPassword si le backend le demande pour vérification
          formData.append('currentPassword', passwordData.current); 

          const token = sessionStorage.getItem('token');
          // On tente d'utiliser la route de mise à jour globale qui existe (POST /api/profile)
          await axios.put(`${import.meta.env.VITE_API_URL}/api/profile`, formData, { 
              headers: { 
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'multipart/form-data'
              } 
          });

          alert(t('alert_pass_updated')); 
          setProfilePage('main'); 
          setPasswordData({ current: '', new: '', confirm: '' });

      } catch (error) { 
          console.error("Erreur Password:", error);
          alert("❌ " + (error.response?.data?.message || t('alert_pass_update_error'))); 
      }
  };
  
  const performLogout = () => { sessionStorage.clear(); window.location.href = '/signin'; };
  const handleChange = (e) => setUserData({ ...userData, [e.target.name]: e.target.value });
  const handlePassChange = (e) => setPasswordData({ ...passwordData, [e.target.name]: e.target.value });

  // --- MAP FUNCTIONS ---
  const closePanel = () => { setSelectedParking(null); setShowGrid(false); };
  const handleMarkerClick = (parking) => { setSelectedParking(parking); setShowGrid(false); setChosenSpot(null); setActiveFloor(1); };
  const handleSelectSpot = (id) => setChosenSpot(id === chosenSpot ? null : id);
  const getSmartParkingImage = (parkingItem) => {
    // 1. Si pas de parking sélectionné, image par défaut
    if (!parkingItem) return "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80";

    // 2. On cherche le champ image (essaie plusieurs noms possibles)
    // Remplace ces noms par ceux de TA base de données
    const rawPath = parkingItem.photo || parkingItem.image || parkingItem.img_url;

    // 3. Si le champ est vide dans la BDD, image par défaut
    if (!rawPath) return "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80";

    // 4. Si c'est déjà un lien internet complet (http...), on le garde
    if (rawPath.startsWith('http')) return rawPath;

    // 5. CORRECTION WINDOWS : Remplace les antis-slashs "\" par des slashs "/"
    let cleanPath = rawPath.replace(/\\/g, '/');

    // 6. Ajoute le "/" au début s'il manque
    if (!cleanPath.startsWith('/')) {
        cleanPath = '/' + cleanPath;
    }

    // 7. Retourne l'URL complète avec le serveur
    return `${import.meta.env.VITE_API_URL}${cleanPath}`;
};
const renderGridRows = () => {
    if (!selectedParking) {
        return <div style={{ padding: '20px', textAlign: 'center' }}>{t('loading')}</div>;
    }

    // 1. On prend les vraies données du parking actuel (100% dynamique)
    const placesParRangee = selectedParking.nb_places_par_rangee; 
    const nombreDeRangees = selectedParking.nb_rangees;

    // --- TEST DE DÉBOGAGE POUR TON BACKEND ---
    const totalAttendu = nombreDeRangees * placesParRangee;
    console.log(`[Parking ${selectedParking.nom}] - Rangées: ${nombreDeRangees} | Places/Rangée: ${placesParRangee}`);
    console.log(`Places attendues mathématiquement : ${totalAttendu}`);
    console.log(`Places réellement reçues de la BDD : ${placesDuParking.length}`);
    if (totalAttendu !== placesDuParking.length) {
        console.warn("⚠️ ATTENTION : Le nombre de places générées dans la BDD ne correspond pas aux dimensions du parking !");
    }
    // -----------------------------------------

    // 2. On découpe les places dynamiquement
    const rows = [];
    for (let i = 0; i < placesDuParking.length; i += placesParRangee) {
        rows.push(placesDuParking.slice(i, i + placesParRangee));
    }

    // Afficher le message "Glisser pour voir plus" seulement s'il y a plus de 6 places par rangée
    const showScrollHint = placesParRangee > 6;

    // 3. Rendu de la grille
    return (
        <div className="parking-layout-container">
            {showScrollHint && (
                <div className="scroll-hint">
                    {t('grid_scroll_hint')} <i className="fa-solid fa-arrow-right-long"></i>
                </div>
            )}
            <div className="parking-scroll-area">
                {rows.map((rowPlaces, rowIndex) => (
                    <div key={rowIndex} className="parking-row">
                        {rowPlaces.map((place, index) => {
                            const isMySpot = currentReservation && currentReservation.id_place === place.id_place;
                            const isOccupied = place.disponibilite === 0 || occupiedSpots.includes(place.id_place) || isMySpot;
                            const isSelected = chosenSpot === place.id_place;
                            const isLastInRow = index === rowPlaces.length - 1;

                            return (
                                <div key={place.id_place} className={`slot-wrapper ${isLastInRow ? 'last-slot' : ''}`}>
                                    {isOccupied ? (
                                        <div className="occupied-spot-wrapper">
                                            {/* Ton image locale avec la classe qui fait le transform: scale(1.4) */}
                                            <img src="/car.png" alt="Occupé" className={`car-icon ${isMySpot ? 'my-car' : ''}`} />
                                        </div>
                                    ) : (
                                        <div className={`free-spot ${isSelected ? 'selected' : ''}`} onClick={() => handleSelectSpot(place.id_place)}>
                                            {place.numero}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
};
const renderProfileContent = () => {
    // 1. Image par défaut améliorée (un avatar neutre)
    let avatarUrl = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png";

    if (userData.photo) {
        // 1. Si c'est un BLOB (preview local instantané) ou DATA (base64), on l'utilise direct
        if (userData.photo.startsWith('blob:') || userData.photo.startsWith('data:')) {
            avatarUrl = userData.photo;
        } 
        // 2. Si c'est une URL complète (Google, Cloudinary, etc.)
        else if (userData.photo.startsWith('http')) {
            avatarUrl = userData.photo;
        } 
        // 3. Sinon, c'est un chemin relatif vers notre API (ex: uploads/photo.jpg)
        else {
            // Nettoyer le chemin (gérer les antis-slashs de Windows)
            let cleanPath = userData.photo.replace(/\\/g, '/');
            if (!cleanPath.startsWith('/')) {
                cleanPath = '/' + cleanPath;
            }
            avatarUrl = `${import.meta.env.VITE_API_URL}${cleanPath}`;
        }
    }
    
    // Titres dynamiques
    let title = t('profile_title');
    if(profilePage === 'details') title = t('profile_title_details');
    if(profilePage === 'payment') title = t('profile_title_payment');
    if(profilePage === 'security') title = t('profile_title_security');
    if(profilePage === 'legal') title = t('profile_title_legal');
    if(profilePage === 'help') title = t('profile_title_help');
    if(profilePage === 'about') title = t('profile_title_about');
    if(profilePage === 'profile') title = t('profile_title_profile');

            // En-tête commun
            const header = (
                <div className="profile-header-top">
                    {profilePage !== 'main' && (
                        <button className="btn-back-profile" onClick={() => setProfilePage('main')}>←</button>
                    )}
                    <span className="profile-title">{title}</span>
                    <div style={{width: 30}}></div>
                </div>
            );

            // --- PAGE PRINCIPALE DU PROFIL ---
            if (profilePage === 'main') {
                const initial = userData.nom ? userData.nom.charAt(0).toUpperCase() : "U";
                
                return (
                    <div className="profile-container">
                        <div className="profile-user-card" style={{cursor: 'pointer'}}>
                        <img 
            src={avatarUrl} 
            alt="Profil" 
            style={{
                width: 80, 
                height: 80, 
                borderRadius: '50%', 
                objectFit: 'cover', 
                marginBottom: 10, 
                border: '2px solid #ddd',
                cursor: 'pointer'
            }}
            onClick={() => setProfilePage('profile')}
            onError={(e) => {
                e.target.onerror = null; // Empêche la boucle infinie si le fallback échoue
                // Image grise simple encodée en Base64 (Fonctionne 100% hors ligne)
                e.target.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="; 
                // Tu peux aussi mettre le chemin d'une image locale : "/images/default-user.png"
            }} 
        />
                    <div className="user-text" style={{cursor: 'pointer', flex: 1}}>
                        <h3>{userData.nom}</h3>
                        <p>{userData.email}</p>
                    </div>
                    <button className="btn-view-profile" onClick={() => setProfilePage('profile')}>
                      <i className="fa-solid fa-eye"></i> {t('profile_view')}
                    </button>
                </div>

                <div className="menu-section">
                    <span className="section-title">{t('profile_section_personal')}</span>
                    <div className="menu-item" onClick={() => setProfilePage('details')}>
                        <div className="icon-box"><i className="fa-solid fa-user-pen"></i></div>
                        <span className="menu-label">{t('profile_title_details')}</span>
                        <i className="fa-solid fa-chevron-right arrow"></i>
                    </div>
                    <div className="menu-item" onClick={() => setProfilePage('payment')}>
                        <div className="icon-box"><i className="fa-solid fa-wallet"></i></div>
                        <span className="menu-label">{t('profile_title_payment')}</span>
                        <i className="fa-solid fa-chevron-right arrow"></i>
                    </div>
                </div>
                
                <div className="menu-section">
                    <span className="section-title">{t('profile_section_security')}</span>
                    <div className="menu-item" onClick={() => setProfilePage('security')}>
                        <div className="icon-box"><i className="fa-solid fa-lock"></i></div>
                        <span className="menu-label">{t('profile_title_security')}</span>
                        <i className="fa-solid fa-chevron-right arrow"></i>
                    </div>
                </div>

                <div className="menu-section">
                    <span className="section-title">{t('profile_section_about')}</span>
                    {/* --- AJOUT DU BOUTON POUR CHANGER DE LANGUE --- */}
                    <div className="menu-item">
                        <div className="icon-box"><i className="fa-solid fa-globe"></i></div>
                        <span className="menu-label">{t('profile_language')}</span>
                        <LanguageSwitcher />
                    </div>

                    <div className="menu-item" onClick={() => setProfilePage('about')}>
                        <div className="icon-box"><i className="fa-solid fa-info"></i></div>
                        <span className="menu-label">{t('profile_title_about')}</span>
                        <i className="fa-solid fa-chevron-right arrow"></i>
                    </div>
                    <div className="menu-item" onClick={() => setProfilePage('legal')}>
                        <div className="icon-box"><i className="fa-solid fa-file-shield"></i></div>
                        <span className="menu-label">{t('profile_title_legal')}</span>
                        <i className="fa-solid fa-chevron-right arrow"></i>
                    </div>
                    <div className="menu-item" onClick={() => setProfilePage('help')}>
                        <div className="icon-box"><i className="fa-solid fa-circle-question"></i></div>
                        <span className="menu-label">{t('profile_title_help')}</span><i className="fa-solid fa-chevron-right arrow"></i>
                    </div>
                </div>
                
                <button className="btn-logout" onClick={() => setShowLogoutModal(true)}>
                    {t('profile_logout')} <i className="fa-solid fa-arrow-right-from-bracket"></i>
                </button>
            </div>
        );
    }

    // --- PAGE DETAILS (MODIFICATION) ---
    if (profilePage === 'details') return (
        <div className="profile-subpage">
            {header}
            
            {/* Zone upload photo */}
            <div className="fade-in-element" style={{display:'flex', flexDirection:'column', alignItems:'center', marginBottom: 20, animationDelay: '0.1s'}}>
                <img 
                    src={imagePreview || avatarUrl} 
                    alt="Aperçu" 
                    style={{
                        width: 100, 
                        height: 100, 
                        borderRadius: '50%', 
                        objectFit: 'cover', 
                        border: '2px solid #6c9a75'
                    }}
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
                    }}
                />
                <label style={{marginTop: 10, color: '#007bff', cursor: 'pointer', fontWeight:'bold'}}>
                    <i className="fa-solid fa-camera"></i> {t('profile_edit_change_photo')}
                    <input type="file" accept="image/*" onChange={handleImageChange} style={{display:'none'}} />
                </label>
            </div>

            {/* Champ PRÉNOM */}
<div className="form-group fade-in-element" style={{animationDelay: '0.2s'}}>
    <label>{t('profile_edit_firstname')}</label>
    <input 
        type="text" 
        name="prenom" 
        value={userData.prenom} 
        onChange={handleChange} 
        placeholder={t('signup_prenom_placeholder')}
    />
</div>

            <div className="form-group fade-in-element" style={{animationDelay: '0.3s'}}>
                <label>{t('profile_edit_lastname')}</label>
                <input 
                    type="text" 
                    name="nom" 
                    value={userData.nom} 
                    onChange={handleChange} 
                    placeholder={t('signup_nom_placeholder')}
                />
            </div>
            <div className="form-group fade-in-element" style={{animationDelay: '0.4s'}}>
                <label>{t('profile_edit_email')}</label>
                <input type="text" name="email" value={userData.email} onChange={handleChange} />
            </div>
            <button className="btn-save fade-in-element" style={{animationDelay: '0.5s'}} onClick={handleUpdateUser}>{t('profile_edit_save')}</button>
        </div>
    );

    // --- AUTRES PAGES (Pas de changement ici, sauf header) ---
    if (profilePage === 'security') return (
        <div className="profile-subpage">
            {header}
            <div className="form-group fade-in-element" style={{animationDelay: '0.1s'}}><label>{t('profile_sec_current_pass')}</label><input type="password" name="current" placeholder="••••••••" value={passwordData.current} onChange={handlePassChange} /></div>
            <div className="form-group fade-in-element" style={{animationDelay: '0.2s'}}><label>{t('profile_sec_new_pass')}</label><input type="password" name="new" placeholder="••••••••" value={passwordData.new} onChange={handlePassChange} /></div>
            <div className="form-group fade-in-element" style={{animationDelay: '0.3s'}}><label>{t('profile_sec_confirm_pass')}</label><input type="password" name="confirm" placeholder="••••••••" value={passwordData.confirm} onChange={handlePassChange} /></div>
            <button className="btn-save fade-in-element" style={{animationDelay: '0.4s'}} onClick={handleUpdatePassword}>{t('profile_sec_update_pass')}</button>
        </div>
    );
    
    if (profilePage === 'payment') return (
        <div className="profile-subpage">
            {header}
            <div className="payment-option fade-in-element" style={{animationDelay: '0.1s'}}><div className="pay-left"><i className="fa-brands fa-paypal" style={{color:'#003087'}}></i> {t('timer_method_paypal')}</div><input type="radio" name="payment" /></div>
            <div className="payment-option fade-in-element" style={{animationDelay: '0.2s'}}><div className="pay-left"><i className="fa-brands fa-google" style={{color:'#DB4437'}}></i> {t('timer_method_google')}</div><input type="radio" name="payment" defaultChecked /></div>
            <div className="payment-option fade-in-element" style={{animationDelay: '0.3s'}}><div className="pay-left"><i className="fa-brands fa-apple"></i> {t('timer_method_apple')}</div><input type="radio" name="payment" /></div>
        </div>
    );

    // --- PAGE MENTIONS LÉGALES ---
    if (profilePage === 'legal') return (
        <div className="profile-subpage legal-page">
            {header}
            <div className="legal-content">
                <div className="legal-item">
                    <h4>{t('faq_q1')}</h4>
                    <p>{t('faq_a1')}</p>
                </div>

                <div className="legal-item">
                    <h4>{t('faq_q3')}</h4>
                    <p>{t('faq_a3')}</p>
                </div>

                <div className="legal-item">
                    <h4>{t('footer_privacy')}</h4>
                    <p>{t('faq_a5')}</p>
                </div>

                <div className="legal-item">
                    <h4>{t('about_title')}</h4>
                    <p>{t('about_p1')}</p>
                </div>

                <div className="legal-item">
                    <h4>{t('solutions_title')}</h4>
                    <p>{t('solutions_desc')}</p>
                </div>
            </div>
        </div>
    );

    // --- PAGE AIDE & SUPPORT (ACCORDÉON) ---
    if (profilePage === 'help') return (
        <div className="profile-subpage help-page">
            {header}
            <div className="help-content">
                <div className="faq-list">
                    <div 
                        className={`faq-item ${expandedFAQ === 1 ? 'open' : ''}`}
                        onClick={() => setExpandedFAQ(expandedFAQ === 1 ? null : 1)}
                    >
                        <div className="faq-question">
                            <span>{t('faq_q2')}</span>
                            <i className={`fa-solid fa-chevron-down ${expandedFAQ === 1 ? 'rotated' : ''}`}></i>
                        </div>
                        <div className="faq-answer">
                            <p>{t('faq_a2')}</p>
                        </div>
                    </div>

                    <div 
                        className={`faq-item ${expandedFAQ === 2 ? 'open' : ''}`}
                        onClick={() => setExpandedFAQ(expandedFAQ === 2 ? null : 2)}
                    >
                        <div className="faq-question">
                            <span>{t('faq_q3')}</span>
                            <i className={`fa-solid fa-chevron-down ${expandedFAQ === 2 ? 'rotated' : ''}`}></i>
                        </div>
                        <div className="faq-answer">
                            <p>{t('faq_a3')}</p>
                        </div>
                    </div>

                    <div 
                        className={`faq-item ${expandedFAQ === 3 ? 'open' : ''}`}
                        onClick={() => setExpandedFAQ(expandedFAQ === 3 ? null : 3)}
                    >
                        <div className="faq-question">
                            <span>{t('faq_q4')}</span>
                            <i className={`fa-solid fa-chevron-down ${expandedFAQ === 3 ? 'rotated' : ''}`}></i>
                        </div>
                        <div className="faq-answer">
                            <p>{t('faq_a4')}</p>
                        </div>
                    </div>

                    <div 
                        className={`faq-item ${expandedFAQ === 4 ? 'open' : ''}`}
                        onClick={() => setExpandedFAQ(expandedFAQ === 4 ? null : 4)}
                    >
                        <div className="faq-question">
                            <span>{t('profile_title_details')}</span>
                            <i className={`fa-solid fa-chevron-down ${expandedFAQ === 4 ? 'rotated' : ''}`}></i>
                        </div>
                        <div className="faq-answer">
                            <p>{t('about_p2')}</p>
                        </div>
                    </div>

                    <div 
                        className={`faq-item ${expandedFAQ === 5 ? 'open' : ''}`}
                        onClick={() => setExpandedFAQ(expandedFAQ === 5 ? null : 5)}
                    >
                        <div className="faq-question">
                            <span>{t('faq_q5')}</span>
                            <i className={`fa-solid fa-chevron-down ${expandedFAQ === 5 ? 'rotated' : ''}`}></i>
                        </div>
                        <div className="faq-answer">
                            <p>{t('faq_a5')}</p>
                        </div>
                    </div>

                    <div 
                        className={`faq-item ${expandedFAQ === 6 ? 'open' : ''}`}
                        onClick={() => setExpandedFAQ(expandedFAQ === 6 ? null : 6)}
                    >
                        <div className="faq-question">
                            <span>{t('faq_subtitle')}</span>
                            <i className={`fa-solid fa-chevron-down ${expandedFAQ === 6 ? 'rotated' : ''}`}></i>
                        </div>
                        <div className="faq-answer">
                            <p>{t('faq_still_desc')}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    // --- PAGE À PROPOS DE PARKSMART ---
    if (profilePage === 'about') return (
        <div className="profile-subpage about-page">
            {header}
            <div className="about-section-container">
                <div className="about-hero-section">
                    <div className="about-icon"><i className="fa-solid fa-square-parking"></i></div>
                    <h2 className="about-hero-title">ParkSmart</h2>
                    <p className="about-hero-subtitle">{t('hero_desc')}</p>
                </div>

                <div className="about-content">
                    <div className="about-section about-section-fade-in">
                        <h3 className="about-section-title">{t('about_subtitle')}</h3>
                        <p className="about-section-text">
                            {t('about_p1')}
                        </p>
                    </div>

                    <div className="about-section about-section-fade-in">
                        <h3 className="about-section-title">{t('solutions_title')}</h3>
                        <p className="about-section-text">
                            {t('solutions_desc')}
                        </p>
                    </div>

                    <div className="about-section about-section-fade-in">
                        <h3 className="about-section-title">{t('solutions_subtitle')}</h3>
                        <ul className="about-features-list">
                            <li><i className="fa-solid fa-map"></i> {t('sol_visual')}</li>
                            <li><i className="fa-solid fa-hand-holding-dollar"></i> {t('sol_cloud')}</li>
                            <li><i className="fa-solid fa-clock"></i> {t('sol_mobile')}</li>
                            <li><i className="fa-solid fa-lock"></i> {t('sol_dashboard')}</li>
                            <li><i className="fa-solid fa-history"></i> {t('history_title')}</li>
                            <li><i className="fa-solid fa-bell"></i> {t('notif_title')}</li>
                        </ul>
                    </div>

                    <div className="about-section about-section-fade-in">
                        <h3 className="about-section-title">{t('faq_q1')}</h3>
                        <p className="about-section-text">
                           {t('faq_a1')}
                        </p>
                    </div>

                    <div className="about-section about-section-fade-in">
                        <h3 className="about-section-title">{t('footer_contact')}</h3>
                        <p className="about-section-text">
                            {t('faq_still_desc')}
                        </p>
                    </div>
                </div>

                <div className="about-stats">
                    <div className="stat-item">
                        <div className="stat-number">1k+</div>
                        <div className="stat-label">{t('drivers_plural')}</div>
                    </div>
                    <div className="stat-item">
                        <div className="stat-number">50+</div>
                        <div className="stat-label">{t('parkings_plural')}</div>
                    </div>
                    <div className="stat-item">
                        <div className="stat-number">24/7</div>
                        <div className="stat-label">{t('profile_title_help')}</div>
                    </div>
                </div>
            </div>
        </div>
    );

    // --- PAGE PROFIL DÉTAILLÉ ---
    if (profilePage === 'profile') return (
        <div className="profile-subpage profile-detailed">
            {header}
            <div className="profile-detail-card">
                <div className="profile-avatar-section">
                    <div className="profile-avatar-wrapper">
                        <img 
                            src={avatarUrl} 
                            alt="Profil" 
                            className="profile-detail-avatar"
                        />
                        <div className="profile-avatar-badge">
                            <i className="fa-solid fa-check"></i>
                        </div>
                    </div>
                </div>
                
                <div className="profile-info-grid">
                    <div className="profile-info-item">
                        <span className="profile-info-label">{t('profile_edit_firstname')}</span>
                        <span className="profile-info-value">{userData.prenom || t('error_generic')}</span>
                    </div>
                    <div className="profile-info-item">
                        <span className="profile-info-label">{t('profile_edit_lastname')}</span>
                        <span className="profile-info-value">{userData.nom || t('error_generic')}</span>
                    </div>
                    <div className="profile-info-item">
                        <span className="profile-info-label">{t('profile_edit_email')}</span>
                        <span className="profile-info-value">{userData.email || t('error_generic')}</span>
                    </div>
                    <div className="profile-info-item">
                        <span className="profile-info-label">{t('profile_detail_member_since')}</span>
                        <span className="profile-info-value">2024</span>
                    </div>
                </div>

                <div className="profile-stats-section">
                    <h4 className="profile-stats-title">{t('profile_detail_my_activity')}</h4>
                    <div className="profile-stats-grid">
                        <div className="profile-stat-box">
                            <div className="profile-stat-icon"><i className="fa-solid fa-car"></i></div>
                            <div className="profile-stat-content">
                                <span className="profile-stat-number">5</span>
                                <span className="profile-stat-text">{t('profile_detail_reservations')}</span>
                            </div>
                        </div>
                        <div className="profile-stat-box">
                            <div className="profile-stat-icon"><i className="fa-solid fa-clock"></i></div>
                            <div className="profile-stat-content">
                                <span className="profile-stat-number">12h</span>
                                <span className="profile-stat-text">{t('profile_detail_total_time')}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    return null;
  };
  return (
<div className="client-home-wrapper">
    <div className="mobile-wrapper">
      {/* MODALE DECONNEXION */}
      {showLogoutModal && (
          <div className="logout-modal-overlay">
              <div className="logout-modal-content">
                  <h3>{t('logout_confirm_title')}</h3>
                  <div className="logout-actions">
                      <button className="btn-cancel-logout" onClick={() => setShowLogoutModal(false)}>{t('cancel')}</button>
                      <button className="btn-confirm-logout" onClick={performLogout}>{t('logout_confirm_button')}</button>
                  </div>
              </div>
          </div>
      )}

      <div className="main-content-area" style={showLogoutModal ? {filter: 'blur(5px)', pointerEvents: 'none'} : {}}>
          
          {activeTab === 'home' && (
  <>
    {/* --- CAS 1 : RÉSERVATION EN COURS (AFFICHE LE TIMER) --- */}
    {currentReservation ? (
       <div style={{ height: '100%', width: '100%', background: '#fff', zIndex: 999 }}>
          <ParkingTimer 
              reservation={currentReservation} 
              onPaymentStart={() => { isPayingRef.current = true; }}
              onStop={() => {
                  isPayingRef.current = false;
                  setCurrentReservation(null);
                  setChosenSpot(null);
                  setOccupiedSpots(prev => prev.filter(id => id !== currentReservation.id_place));
                  window.location.reload(); 
              }} 
          />
       </div>
    ) : (
       /* --- CAS 2 : PAS DE RÉSERVATION (AFFICHE LA CARTE) --- */
       <>
          <div className="search-bar-container">
              <i className="fa-solid fa-magnifying-glass" style={{color: '#94a3b8'}}></i>
               <input 
                type="text" 
                placeholder={t('home_search_placeholder')} 
                className="search-input"
                value={searchQuery}                               
                onChange={(e) => setSearchQuery(e.target.value)}  
              />
          </div>
          
          <div id="map-rotation-container" style={{ height: '100%', width: '100%', position: 'relative', overflow: 'hidden', backgroundColor: '#e2e8f0' }}>
            
            {/* BOUTON RESET NORTH */}
            {mapRotation !== 0 && (
                <div 
                    onClick={() => setMapRotation(0)}
                    style={{
                        position: 'absolute', top: '120px', right: '10px', zIndex: 1000,
                        background: 'white', width: '40px', height: '40px', borderRadius: '50%',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer'
                    }}
                >
                    <i className="fa-solid fa-compass" style={{ fontSize: '24px', color: '#dc2626', transform: `rotate(${mapRotation}deg)`, transition: 'transform 0.3s' }}></i>
                </div>
            )}

            <div style={{ 
                width: '200vmax', 
                height: '200vmax', 
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: `translate(-50%, -50%) rotate(${mapRotation}deg)`, 
                transition: 'transform 0.1s ease-out', 
                transformOrigin: 'center center',
                zIndex: 1,
                '--map-rotation': `${mapRotation}deg` 
            }}>
                <MapContainer center={defaultPosition} zoom={15} style={{ height: "100%", width: "100%" }} zoomControl={false}>
                  <TileLayer
                      url="http://mt0.google.com/vt/lyrs=m&hl=fr&x={x}&y={y}&z={z}"
                      attribution='&copy; Google Maps'
                  />
                  <RecenterMap position={userPosition} />
                  <MapClickHandler onMapClick={closePanel} />
                  
                  {userPosition && <Marker position={userPosition} icon={userIcon} />}
                  
                  {parkings?.filter(parking => 

                    parking.nom && parking.nom.toLowerCase().includes(searchQuery.toLowerCase()))?.map((parking) => (
                      <Marker 
                          key={parking.id_park || parking.id} 
                          position={[parseFloat(parking.latitude), parseFloat(parking.longitude)]} 
                          icon={createParkingIcon(parking)} 
                          eventHandlers={{ 
                              click: (e) => { 
                                  L.DomEvent.stopPropagation(e); 
                                  handleMarkerClick(parking); 
                              } 
                          }} 
                      >
                         <Tooltip 
                            permanent 
                            direction="bottom" 
                            offset={[0, 20]} 
                            className="custom-tooltip-rotated"
                         >
                            {parking.nom}
                         </Tooltip>
                      </Marker>
                  ))}

                </MapContainer> 
            </div>
          </div>

          {/* PANNEAU DETAILS */}
          {selectedParking && !showGrid && (
              <div className="slide-up-panel">
                  <div className="drag-handle"></div>
                  
                  <div className="card-image-container">
                      <img 
                          src={getSmartParkingImage(selectedParking)} 
                          alt="Parking" 
                          className="card-img" 
                      />
                  </div>

                  <div className="pagination-dots">
                      <span className="dot active"></span>
                      <span className="dot"></span>
                      <span className="dot"></span>
                  </div>

                  <div className="card-info">
                      <div className="rating-row">
                          <i className="fa-solid fa-star star-icon"></i>
                          <span className="rating-score">
                              {parkingRating.note}
                          </span>
                          <span className="rating-reviews">
                              ({parkingRating.total} {parkingRating.total > 1 ? t('home_reviews') : t('home_review')})
                          </span>
                      </div>

                      <h2 className="panel-title">{selectedParking.nom}</h2>
                      <p className="panel-address">{selectedParking.adresse || "Ivory Elephant Street"}</p>
                      
                      <div className="info-row">
                          <div className="info-item">
                              <div className="icon-circle">
                                  <i className="fa-solid fa-compass"></i>
                              </div>
                              <span className="info-text">
                                  {userPosition && selectedParking.latitude && selectedParking.longitude
                                      ? (L.latLng(userPosition[0], userPosition[1]).distanceTo(L.latLng(selectedParking.latitude, selectedParking.longitude)) / 1000).toFixed(2)
                                      : '--'}km
                              </span>
                          </div>
                          
                          <div className="info-item">
                              <div className="icon-square">
                                  P
                              </div>
                              <span className="info-text">
                                  {selectedParking.places_disponibles !== undefined 
                                      ? selectedParking.places_disponibles 
                                      : ((selectedParking.nb_rangees || 1) * (selectedParking.nb_places_par_rangee || 10))} {t('home_place_available')}
                              </span>
                          </div>

                            <div className="info-item">
                                <div className="icon-circle" style={{backgroundColor: '#e0f2fe', color: '#2563eb'}}>
                                    <i className="fa-solid fa-coins"></i>
                                </div>
                                <span className="info-text" style={{fontWeight: 'bold', color: '#1e293b'}}>
                                    {selectedParking.tarif_heure || selectedParking.tarif_horaire || '10'} DH/h
                                </span>
                            </div>
                        </div>

                        {/* --- LIGNE DES BOUTONS (Continue + ItinÃ©raire) --- */}
                        <div style={{ display: 'flex', gap: '15px', width: '100%', alignItems: 'center' }}>
                            <button className="btn-continue" onClick={() => setShowGrid(true)}>{t('home_continue')}</button>

                            <button 
                                className="btn-navigate" 
                                style={{ width: '50px', height: '50px', borderRadius: '12px', background: '#e2e8f0', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: 'none', flexShrink: 0 }}
                                onClick={() => {
                                  const lat = selectedParking.latitude;
                                  const lng = selectedParking.longitude;
                                  window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
                              }}
                          >
                              <i className="fa-solid fa-location-arrow"></i>
                          </button>
                      </div>
                  </div>
              </div>
          )}

          {/* GRILLE DES PLACES */}
          {showGrid && (
              <div className="grid-overlay">
                  <div className="grid-header">
                      <button className="btn-back" onClick={() => setShowGrid(false)}>←</button>
                      <span className="grid-title">{t('grid_choose_spot')}</span>
                  </div>
                  <div className="floors-tabs"><strong>{t('grid_parking_plan')}</strong></div>
                  <div className="parking-layout">{renderGridRows()}</div>
                  <div className="grid-footer">
                      <button className="btn-continue" onClick={handleStartReservation} disabled={!chosenSpot}>
                          {chosenSpot ? t('grid_book_button_spot', {spot: chosenSpot}) : t('grid_book_button')}
                      </button>
                  </div>
              </div>
          )}
       </>
    )}
  </>
)}
          {activeTab === 'history' && <ClientHistory onDetailViewChange={setHistoryDetailView} />}
          {activeTab === 'notif' && (
            <Notification 
              onUnreadCountChange={setUnreadNotifications} 
              activeReservation={currentReservation}
              parkingTarif={
                selectedParking?.tarif_heure || 
                selectedParking?.tarif_horaire ||
                (currentReservation && parkings.find(p => p.id_park === currentReservation.id_park)?.tarif_heure) ||
                10
              }
            />
          )}
          {activeTab === 'profile' && renderProfileContent()}
      </div>

      {!showGrid && !showLogoutModal && !historyDetailView && (
          <div className="bottom-nav-bar">
            <div className={`nav-item ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}><i className="fa-solid fa-house"></i><span>{t('nav_bottom_home')}</span></div>
            <div className={`nav-item ${activeTab === 'notif' ? 'active' : ''}`} onClick={() => setActiveTab('notif')}>
              <div style={{position: 'relative', display: 'inline-block'}}>
                <i className="fa-solid fa-bell"></i>
                {unreadNotifications > 0 && (
                  <div className="notification-badge">
                    {unreadNotifications}
                  </div>
                )}
              </div>
              <span>{t('nav_notifications')}</span>
            </div>
            <div className={`nav-item ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}><i className="fa-solid fa-clock-rotate-left"></i><span>{t('nav_bottom_history')}</span></div>
            <div className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}><i className="fa-solid fa-user"></i><span>{t('nav_bottom_profile')}</span></div>
          </div>
      )}
    </div>
   </div> 
  );
}


export default ClientHome;
