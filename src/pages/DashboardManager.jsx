import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/DashboardManager.css'; 
import ManagerNotifications from './ManagerNotifications';
import ValidationSortieManager from './ValidationSortieManager';
import { Html5Qrcode } from "html5-qrcode";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function DashboardManager() {
  const navigate = useNavigate();
  const videoRef = useRef(null);
   
  // --- ÉTATS ---
  const [activeTab, setActiveTab] = useState('overview'); 
  const [user, setUser] = useState(null); 
  const [loading, setLoading] = useState(true);
  const [scanData, setScanData] = useState(null);

  // Données
  const [myParkings, setMyParkings] = useState([]); 
  const [reservations, setReservations] = useState([]);
  const [earnings, setEarnings] = useState([]); // Tous les revenus
  const [monthlyEarnings, setMonthlyEarnings] = useState([]); // Revenus du mois filtrés
  const [totalMonthly, setTotalMonthly] = useState(0); // Total du mois
  const [totalAllTime, setTotalAllTime] = useState(0); // Total global
  const [totalToday, setTotalToday] = useState(0); // Total aujourd'hui
  const [reviews, setReviews] = useState([]); // Avis pour un parking
   
  // Modals (Fenêtres)
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showEditParkingModal, setShowEditParkingModal] = useState(false);
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false); // Modal Plan Parking
  const [showNotifications, setShowNotifications] = useState(false); // Notifications
  const [managerNotifications, setManagerNotifications] = useState([]); // Liste des notifs
  const [unreadCount, setUnreadCount] = useState(0);

  // Édition Profil
  const [profileData, setProfileData] = useState({ nom: '', email: '' });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  // --- GESTION NOTIFICATIONS ---
  useEffect(() => {
    if (!myParkings) return; // besoin des parkings pour les noms

    const generated = [];

    // 1. Réservations
    reservations.forEach(r => {
        const pkName = myParkings.find(p => (p.id_park || p.id) === r.id_parking)?.nom || "votre parking";
        generated.push({
            id: `res-${r.id_reservation}`,
            type: 'reservation',
            title: 'Nouvelle Réservation',
            message: `${r.nom_conducteur || 'Un client'} a réservé une place au ${pkName}.`,
            date: r.date_reservation || r.created_at || r.date_debut,
            read: false,
            expanded: false,
            details: {
                nom: r.nom_conducteur,
                place: r.numero_place,
                debut: r.date_debut,
                fin: r.date_fin
            }
        });
    });

    // 2. Revenus
    earnings.forEach(e => {
        generated.push({
            id: `pay-${e.id_transaction || Math.random()}`,
            type: 'payment',
            title: 'Paiement Reçu',
            message: `Vous avez reçu un paiement de ${parseFloat(e.montant || 0).toFixed(2)} DH.`,
            date: e.date_paiement || e.created_at,
            read: true, // Auto-lu car c'est de l'argent ;)
            expanded: false,
            details: {
                montant: parseFloat(e.montant || 0).toFixed(2)
            }
        });
    });

    // On fusionne avec l'état existant pour ne pas perdre le statut "read"
    setManagerNotifications(prev => {
        const existingMap = new Map(prev.map(n => [n.id, n]));
        
        const merged = generated.map(n => {
            if(existingMap.has(n.id)) {
                const ex = existingMap.get(n.id);
                return { 
                    ...n, 
                    read: ex.read, 
                    expanded: ex.expanded 
                };
            }
            return n;
        });

        // Tri + Slice
        const sorted = merged.sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0, 50);
        
        // Update Count
        const count = sorted.filter(n => !n.read).length;
        setUnreadCount(count);
        
        return sorted;
    });

  }, [reservations, earnings, myParkings]);

  const handleMarkAllRead = () => {
    const updated = managerNotifications.map(n => ({...n, read: true}));
    setManagerNotifications(updated);
    setUnreadCount(0);
  };

  const handleNotificationClick = (id) => {
    const updated = managerNotifications.map(n => {
        if (n.id === id) {
            return { ...n, read: true, expanded: !n.expanded };
        }
        return n;
    });
    setManagerNotifications(updated);
    setUnreadCount(updated.filter(n => !n.read).length);
  };

  // Édition Parking
  const [editingParking, setEditingParking] = useState(null);
  const [selectedParkingForMap, setSelectedParkingForMap] = useState(null); // Parking sélectionné pour le plan

  // Formulaire Ajout Parking
  const [formData, setFormData] = useState({
    nom: '', adresse: '', latitude: '', longitude: '', 
    prix_heure: '', image_url: '', nb_rangees: '', nb_places_par_rangee: ''      
  });

  // Stats Hebdomadaires pour le Graphique
  const [weeklyStats, setWeeklyStats] = useState([]);

  useEffect(() => {
    if (!reservations) return;

    const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    const counts = [0, 0, 0, 0, 0, 0, 0];

    const now = new Date();
    // Trouver le Lundi de la semaine courante
    const dayOfWeek = now.getDay(); // 0(Dim) ... 6(Sam)
    const distanceToMonday = (dayOfWeek + 6) % 7; 
    const monday = new Date(now);
    monday.setDate(now.getDate() - distanceToMonday);
    monday.setHours(0, 0, 0, 0);

    const nextMonday = new Date(monday);
    nextMonday.setDate(monday.getDate() + 7);

    reservations.forEach(r => {
        const d = new Date(r.date_debut);
        // Si la réservation est dans la semaine courante (Lundi 00h -> Lundi suivant 00h)
        if (d >= monday && d < nextMonday) {
            let dayIndex = d.getDay(); // 0=Dim, 1=Lun
            // Mapper 1->0 ... 0->6
            const mapIndex = dayIndex === 0 ? 6 : dayIndex - 1;
            counts[mapIndex] += 1;
        }
    });

    const finalData = days.map((label, i) => ({
        name: label,
        tx: counts[i]
    }));
    
    setWeeklyStats(finalData);

  }, [reservations]);

  // --- UTILITAIRES ---
  const getImageUrl = (path) => {
      if (!path) return "https://cdn-icons-png.flaticon.com/512/149/149071.png";
      if (path.startsWith('blob:')) return path;
      if (path.startsWith('http')) return path;
      return `${import.meta.env.VITE_API_URL}${path}`;
  };

  const formatDate = (dateString) => {
      if(!dateString) return "-";
      return new Date(dateString).toLocaleString('fr-FR');
  };

  // --- CHARGEMENT DES DONNÉES ---
  useEffect(() => {
    const storedUser = sessionStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      setProfileData({ nom: parsedUser.nom || '', email: parsedUser.email || '' });
      
      const idGest = parsedUser.id_gest || parsedUser.id;
      if (idGest) {
        fetchMyParkings();
        fetchReservations();
        fetchEarnings();
     }
    } else {
      setLoading(false); 
      navigate('/signin');
    }
  }, []);
// 1. PARKINGS
  const fetchMyParkings = async () => { // Plus besoin de idGest ici
    try {
      const token = sessionStorage.getItem('token');
      // ✅ APRÈS : /api/my-parkings
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/my-parkings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMyParkings(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Erreur parkings", err);
      setLoading(false);
    }
  };

  // 2. RÉSERVATIONS
  const fetchReservations = async () => { // Plus besoin de idGest ici
      try {
          const token = sessionStorage.getItem('token');
          // ❌ AVANT : /api/manager/reservations/${idGest}
          // ✅ APRÈS : /api/manager/reservations
          const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/manager/reservations`, {
              headers: { Authorization: `Bearer ${token}` }
          });
          setReservations(res.data);
      } catch (err) {
          console.error("Erreur réservations", err);
      }
  };

  // 3. REVENUS
  const fetchEarnings = async () => { // Plus besoin de idGest ici
      try {
          const token = sessionStorage.getItem('token');
          // ✅ APRÈS : /api/manager/earnings
          const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/manager/earnings`, {
              headers: { Authorization: `Bearer ${token}` }
          });
          setEarnings(res.data);
      } catch (err) {
          console.error("Erreur revenus", err);
      }
  };

  // --- TRAITEMENT DES DONNEES (CALCULS & TABLEAU) ---
  useEffect(() => {
    if (!earnings) return;

    // 1. Enrichir les données (Join avec Réservations si nom manquant)
    const enrichedEarnings = earnings.map(e => {
        let nom = e.nom_conducteur || e.nom_user || (e.nom ? `${e.nom} ${e.prenom || ''}` : null);
        
        // Essai de récupération depuis les réservations (si id_reservation présent)
        if (!nom && reservations.length > 0) {
            // On cherche par id_reservation ou parfois id_transaction
            const match = reservations.find(r => 
                (e.id_reservation && r.id_reservation === e.id_reservation) ||
                (e.reservation_id && r.id_reservation === e.reservation_id)
            );
            if (match) nom = match.nom_conducteur;
        }

        return {
            ...e,
            nom_display: nom || "Client App",
            montant_display: parseFloat(e.montant || e.amount || 0),
            date_display: e.date_paiement || e.created_at || new Date().toISOString()
        };
    });

    // 2. Calculs Totaux
    const totalGlobal = enrichedEarnings.reduce((acc, curr) => acc + curr.montant_display, 0);
    setTotalAllTime(totalGlobal);

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const todayString = now.toDateString();

    // 3. Filtrer Mois Courant
    const filteredMonth = enrichedEarnings.filter(e => {
        const d = new Date(e.date_display);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
    // Trier par date décroissante (plus récent en haut)
    filteredMonth.sort((a, b) => new Date(b.date_display) - new Date(a.date_display));
    
    setMonthlyEarnings(filteredMonth);
    
    const totalM = filteredMonth.reduce((acc, curr) => acc + curr.montant_display, 0);
    setTotalMonthly(totalM);

    // 4. Filtrer Aujourd'hui
    const filteredToday = enrichedEarnings.filter(e => {
        const d = new Date(e.date_display);
        return d.toDateString() === todayString;
    });
    const totalD = filteredToday.reduce((acc, curr) => acc + curr.montant_display, 0);
    setTotalToday(totalD);

  }, [earnings, reservations]); 

  // 4. AVIS
  const handleShowReviews = async (parkingId) => {
      try {
        const token = sessionStorage.getItem('token');
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/parkings/${parkingId}/reviews`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        setReviews(res.data);
        setShowReviewsModal(true);
      } catch (error) {
          alert("Impossible de charger les avis.");
      }
  };

  // --- ACTIONS ---
const handleDeleteParking = async (id) => {
      if(!window.confirm("Supprimer ce parking définitivement ?")) return;
      
      try {
          // 1. On va chercher le token dans le sessionStorage !
          const token = sessionStorage.getItem('token'); 

          // 2. On envoie la requête
          await axios.delete(`${import.meta.env.VITE_API_URL}/api/parkings/${id}`, {
              headers: {
                  Authorization: `Bearer ${token}`
              }
          });

          // 3. Mise à jour de l'affichage
          setMyParkings(myParkings.filter(p => (p.id_park || p.id) !== id));
          
      } catch (error) {
          console.error("Erreur lors de la suppression :", error.response?.data || error.message);
          alert("❌ Erreur suppression.");
      }
  };
  const openEditParkingModal = (parking) => {
      setEditingParking({
          ...parking,
          nb_rangees: parking.nb_rangees || 0,
          nb_places_par_rangee: parking.nb_places_par_rangee || 0
      });
      setShowEditParkingModal(true);
  };

  const handleOpenMap = (parking) => {
    setSelectedParkingForMap(parking);
    setShowMapModal(true);
  };

  const handleSaveParkingEdit = async () => {
    if (!editingParking) return;
    const parkingId = editingParking.id_park || editingParking.id;

    const dataToSend = {
        nom: editingParking.nom,
        adresse: editingParking.adresse,
        tarif_heure: parseFloat(editingParking.tarif_heure || editingParking.prix_heure),
        nb_rangees: parseInt(editingParking.nb_rangees),
        nb_places_par_rangee: parseInt(editingParking.nb_places_par_rangee)
    };

    try {
        const token = sessionStorage.getItem('token');
        await axios.put(`${import.meta.env.VITE_API_URL}/api/parkings/${parkingId}`, dataToSend, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        setMyParkings(myParkings.map(p => 
            (p.id_park === parkingId || p.id === parkingId) ? { ...p, ...dataToSend } : p
        ));
        
        setShowEditParkingModal(false);
        alert("✅ Parking modifié !");
    } catch (error) {
        alert("❌ Erreur modification.");
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
        setSelectedFile(file);
        setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleUpdateProfile = async () => {
      try {
          const token = sessionStorage.getItem('token');
          const idUser = user.id_gest || user.id;

          const formDataObj = new FormData();
          formDataObj.append('id_user', idUser);
          formDataObj.append('nom', profileData.nom);
          formDataObj.append('email', profileData.email);
          if (selectedFile) {
              formDataObj.append('image', selectedFile);
          }

          const res = await axios.put(`${import.meta.env.VITE_API_URL}/api/manager/update`, formDataObj, {
              headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
          });

          const updatedUser = { 
              ...user, 
              nom: profileData.nom, 
              email: profileData.email,
              photo: res.data.newImage || user.photo 
          };

          setUser(updatedUser);
          sessionStorage.setItem('user', JSON.stringify(updatedUser));
          
          alert("✅ Profil mis à jour !");
          setShowProfileModal(false);
      } catch (error) {
          console.error(error);
          alert("❌ Erreur mise à jour profil.");
      }
  };

  const handleSubmitParking = async (e) => {
    e.preventDefault();
    const token = sessionStorage.getItem('token');
    
    const rows = parseInt(formData.nb_rangees) || 0;
    const placesPerRow = parseInt(formData.nb_places_par_rangee) || 0;
    
    const payload = {
        ...formData,
        tarif_heure: parseFloat(formData.prix_heure),
        nb_rangees: rows,
        nb_places_par_rangee: placesPerRow
    };

    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/admin/parking`, payload, {
          headers: { 'Authorization': `Bearer ${token}` }
      });
      alert("✅ Parking ajouté !");
      setActiveTab('parkings'); 
      fetchMyParkings(user.id_gest || user.id);
    } catch (error) {
      alert("Erreur ajout parking.");
    }
  };

  useEffect(() => {
    let html5QrCode;

    // On lance le scanner SEULEMENT si on est sur l'onglet 'scanner' 
    // ET qu'on n'a pas déjà scanné un code (!scanData)
    if (activeTab === 'scanner' && !scanData) {
        
        // "qr-reader" sera l'ID de la div où s'affichera la vidéo
        html5QrCode = new Html5Qrcode("qr-reader");
        
        html5QrCode.start(
            { facingMode: "environment" }, // Utilise la caméra arrière par défaut
            {
                fps: 10,    // Nombre d'analyses par seconde
                qrbox: { width: 250, height: 250 } // Le carré de scan au milieu
            },
            (decodedText) => {
               // Remplacer votre html5QrCode.stop().then(...) par ceci :
html5QrCode.stop().then(async () => {
    try {
        const token = sessionStorage.getItem('token');
        
        // On interroge notre nouvelle route backend !
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/reservations/${decodedText}`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const vraieResa = response.data;

        setScanData({
            reservationId: vraieResa.id_resa,
            nomConducteur: vraieResa.nom_client || "Nom inconnu", 
            place: vraieResa.place,
            prix: vraieResa.prix_total
        });

    } catch (error) {
        console.error("Erreur :", error);
        alert("Réservation introuvable !");
        setScanData(null); 
    }
}).catch(err => console.error("Erreur d'arrêt:", err));
            },
            (errorMessage) => {
                // Ignorez ça, c'est juste la caméra qui dit "Je n'ai rien trouvé pour l'instant"
            }
        ).catch((err) => {
            console.error("Impossible de lancer la caméra :", err);
        });
    }

    // Sécurité : On éteint la caméra si l'utilisateur change d'onglet
    return () => {
        if (html5QrCode && html5QrCode.isScanning) {
            html5QrCode.stop().catch(console.error);
        }
    };
  }, [activeTab, scanData]);

  if (loading) return <div className="loading-screen">Chargement...</div>;
  if (!user) return null;
// --- CALCULS ---
  const totalPlaces = myParkings.reduce((acc, curr) => {
    return acc + ((parseInt(curr.nb_rangees) * parseInt(curr.nb_places_par_rangee)) || curr.total_places || 0);
  }, 0);
  return (
    <div className={`dashboard-container ${showProfileModal || showLogoutModal || showEditParkingModal || showReviewsModal ? 'blur-background' : ''}`}>
      
      {/* SIDEBAR */}
      <div className="sidebar">
        <div className="logo-container">
           <img src="/LOGO.png" alt="Logo" className="logo-img" />
        </div>
        
        <div className="menu-section-label">Menu Principal</div>
        <MenuItem icon="fa-chart-pie" label="Vue d'ensemble" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
        <MenuItem icon="fa-square-parking" label="Mes Parkings" active={activeTab === 'parkings' || activeTab === 'add-parking'} onClick={() => setActiveTab('parkings')} />
        <MenuItem icon="fa-calendar-check" label="Réservations" active={activeTab === 'bookings'} onClick={() => setActiveTab('bookings')} />
        
        <div className="menu-section-label">Opérations</div>
        <MenuItem icon="fa-expand" label="Scanner" active={activeTab === 'scanner'} onClick={() => setActiveTab('scanner')} />
        <MenuItem icon="fa-wallet" label="Revenus" active={activeTab === 'earnings'} onClick={() => setActiveTab('earnings')} />
        
        <div className="logout-btn" onClick={() => setShowLogoutModal(true)}>
          <i className="fa-solid fa-right-from-bracket" style={{marginRight: '10px'}}></i> Déconnexion
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="main-content">
        <div className="dashboard-header">
          <div className="header-title">
            <h2>Bonjour, {user.nom}</h2>
            <p>Gestion de vos parkings en temps réel.</p>
          </div>
          <div className="header-actions" style={{position:'relative'}}>
            {/* Cloche de Notification */}
            <div 
                className={`btn-icon ${showNotifications ? 'active' : ''}`} 
                onClick={() => setShowNotifications(!showNotifications)}
                style={{
                  position:'relative', 
                  width:'45px', height:'45px', 
                  background:'white', 
                  border:'1px solid #e2e8f0', 
                  marginRight:'0', 
                  color: showNotifications ? '#10b981' : '#64748b'
                }}>
                <i className="fa-regular fa-bell" style={{fontSize:'1.2rem'}}></i>
                {/* Petit point rouge AVEC LE CHIFFRE si non-lu */}
                {unreadCount > 0 && (
                    <span style={{
                        position:'absolute', top:'-5px', right:'-5px', 
                        minWidth:'18px', height:'18px', 
                        background:'#ef4444', color:'white',
                        borderRadius:'50%', border:'2px solid white',
                        fontSize:'0.7rem', fontWeight:'bold',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        padding:'0 4px'
                    }}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </div>

            {/* Panneau Notifications (Composant séparé) */}
            <ManagerNotifications 
                isOpen={showNotifications} 
                onClose={() => setShowNotifications(false)}
                notifications={managerNotifications}
                onMarkAllRead={handleMarkAllRead}
                onNotificationClick={handleNotificationClick}
            />

            <div className="user-profile-pic" onClick={() => {
                 setPreviewImage(getImageUrl(user.photo));
                 setShowProfileModal(true);
            }}>
                <img src={getImageUrl(user.photo)} alt="Profil" />
            </div>
          </div>
        </div>

        {/* --- ONGLETS --- */}

      {/* 1. VUE D'ENSEMBLE */}
        {activeTab === 'overview' && (
           <>
            <div className="stats-grid">
               <StatCard title="Places Totales" value={totalPlaces} icon="fa-warehouse" color="#6366f1" />
               <StatCard title="Revenus (Global)" value={`${totalAllTime.toFixed(2)} DH`} icon="fa-sack-dollar" color="#16a34a" />
               <StatCard title="Revenus (Ce mois)" value={`${totalMonthly.toFixed(2)} DH`} icon="fa-chart-line" color="#10b981" />
               <StatCard title="Parkings Actifs" value={myParkings.length} icon="fa-car" color="#4318FF" />
            </div>

            {/* SECTION GRAPHIQUE */}
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginTop:'20px' }}>
                {/* ... (Le reste du graphique reste identique, ne changez rien en dessous) ... */}
                <div className="card-white" style={{ flex: '2', minWidth: '400px' }}>
                    <div className="card-header">
                        <h3>Réservations de la Semaine</h3>
                    </div>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={weeklyStats}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} />
                                <Tooltip cursor={{fill: '#f4f7fe'}} contentStyle={{borderRadius: '10px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} />
                                <Bar dataKey="tx" fill="#4318FF" radius={[10, 10, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Dernières réservations */}
                <div className="card-white" style={{ flex: '1', minWidth: '300px' }}>
                    <div className="card-header">
                        <h3>Récent</h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {reservations.slice(0, 3).map((res, index) => (
                           <div key={index} style={{ paddingBottom: '10px', borderBottom: '1px solid #f1f5f9' }}>
                              <div style={{display:'flex', justifyContent:'space-between', marginBottom:'5px'}}>
                                  <span style={{fontWeight:'600', color:'#1e293b'}}>{res.nom_conducteur || "Client"}</span>
                                  <span className={`status-badge ${res.statut === 'En cours' ? 'pending' : 'success'}`}>
                                      {res.statut}
                                  </span>
                              </div>
                              <div style={{fontSize:'0.85rem', color:'#64748b'}}>
                                  {new Date(res.date_debut).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - Place {res.numero_place}
                              </div>
                           </div> 
                        ))}
                        {reservations.length === 0 && <p style={{color:'#94a3b8'}}>Aucune réservation.</p>}
                    </div>
                </div>
            </div>
           </>
        )}
        {activeTab === 'parkings' && (
          <div className="card-white">
            <div className="card-header">
               <h3>Mes Parkings</h3>
               <button className="btn-primary" onClick={() => setActiveTab('add-parking')}>+ Ajouter</button>
            </div>
            <table className="custom-table">
              <thead><tr><th>Nom</th><th>Adresse</th><th>Capacité</th><th>Prix/H</th><th>Avis</th><th>Actions</th></tr></thead>
              <tbody>
                {myParkings.map(p => (
                  <tr key={p.id || p.id_park}>
                    <td style={{fontWeight:'bold'}}>{p.nom}</td>
                    <td>{p.adresse}</td>
                    <td>{(p.nb_rangees * p.nb_places_par_rangee) || p.total_places} places</td>
                    <td>{p.tarif_heure || p.prix_heure} DH</td>
                    <td>
                        <button className="btn-icon star" onClick={() => handleShowReviews(p.id_park || p.id)}>
                            <i className="fa-solid fa-eye" style={{color: '#fbbf24'}}></i>
                        </button>
                    </td>
                    <td>
                        {/* <button className="btn-icon" title="Voir le plan" onClick={() => handleOpenMap(p)} style={{marginRight:'5px'}}>
                           <i className="fa-solid fa-map-location-dot" style={{color:'#3b82f6'}}></i>
                        </button> */}
                        <button className="btn-icon" onClick={() => openEditParkingModal(p)}>
                            <i className="fa-solid fa-pen"></i>
                        </button>
                        <button className="btn-icon delete" onClick={() => handleDeleteParking(p.id_park || p.id)}>
                            <i className="fa-solid fa-trash"></i>
                        </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
{activeTab === 'add-parking' && (
             <div className="card-white" style={{maxWidth:'800px', margin:'0 auto'}}>
                <h3 style={{marginBottom:'25px', color:'#1e293b'}}>Ajouter un nouveau parking</h3>
                
                <form onSubmit={handleSubmitParking}>
                   {/* Ligne 1 : Nom et Prix */}
                   <div style={{display:'flex', gap:'20px', marginBottom:'15px'}}>
                       <div style={{flex:1}}>
                           <label style={{display:'block', marginBottom:'5px', fontWeight:'500', color:'#64748b'}}>Nom du Parking</label>
                           <input 
                               className="input-style" 
                               name="nom" 
                               value={formData.nom}
                               onChange={(e) => setFormData({...formData, nom: e.target.value})} 
                               required 
                           />
                       </div>
                       <div style={{flex:1}}>
                           <label style={{display:'block', marginBottom:'5px', fontWeight:'500', color:'#64748b'}}>Prix / Heure (DH)</label>
                           <input 
                               type="number"
                               className="input-style" 
                               name="prix_heure" 
                               value={formData.prix_heure}
                               onChange={(e) => setFormData({...formData, prix_heure: e.target.value})} 
                               required
                           />
                       </div>
                   </div>

                   {/* Ligne 2 : Adresse */}
                   <div style={{marginBottom:'15px'}}>
                       <label style={{display:'block', marginBottom:'5px', fontWeight:'500', color:'#64748b'}}>Adresse Complète</label>
                       <input 
                           className="input-style" 
                           name="adresse" 
                           value={formData.adresse}
                           onChange={(e) => setFormData({...formData, adresse: e.target.value})} 
                           required 
                       />
                   </div>

                   {/* Ligne 3 : Latitude / Longitude */}
                   <div style={{display:'flex', gap:'20px', marginBottom:'25px'}}>
                        <div style={{flex:1}}>
                            <label style={{display:'block', marginBottom:'5px', fontWeight:'500', color:'#64748b'}}>Latitude</label>
                            <input 
                                className="input-style" 
                                name="latitude" 
                                value={formData.latitude}
                                onChange={(e) => setFormData({...formData, latitude: e.target.value})} 
                            />
                        </div>
                        <div style={{flex:1}}>
                            <label style={{display:'block', marginBottom:'5px', fontWeight:'500', color:'#64748b'}}>Longitude</label>
                            <input 
                                className="input-style" 
                                name="longitude" 
                                value={formData.longitude}
                                onChange={(e) => setFormData({...formData, longitude: e.target.value})} 
                            />
                        </div>
                   </div>

                   {/* BLOC BLEU : Configuration Capacité */}
                   <div style={{
                       backgroundColor:'#f0f9ff', 
                       border:'1px solid #bae6fd', 
                       borderRadius:'8px', 
                       padding:'20px', 
                       marginBottom:'25px'
                   }}>
                       <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'15px', color:'#0369a1', fontWeight:'bold'}}>
                           <i className="fa-solid fa-calculator"></i> Configuration de la capacité
                       </div>
                       
                       <div style={{display:'flex', gap:'20px', marginBottom:'15px'}}>
                           <div style={{flex:1}}>
                               <label style={{display:'block', marginBottom:'5px', fontWeight:'500', color:'#475569'}}>Nombre de Rangées</label>
                               <input 
                                   type="number"
                                   className="input-style" 
                                   placeholder="Ex: 3" 
                                   name="nb_rangees" 
                                   style={{background:'white'}}
                                   value={formData.nb_rangees}
                                   onChange={(e) => setFormData({...formData, nb_rangees: e.target.value})} 
                               />
                           </div>
                           <div style={{flex:1}}>
                               <label style={{display:'block', marginBottom:'5px', fontWeight:'500', color:'#475569'}}>Places par Rangée</label>
                               <input 
                                   type="number"
                                   className="input-style" 
                                   placeholder="Ex: 10" 
                                   name="nb_places_par_rangee" 
                                   style={{background:'white'}}
                                   value={formData.nb_places_par_rangee}
                                   onChange={(e) => setFormData({...formData, nb_places_par_rangee: e.target.value})} 
                               />
                           </div>
                       </div>

                       <div style={{
                           borderTop:'1px dashed #cbd5e1', 
                           paddingTop:'15px', 
                           color:'#334155', 
                           fontWeight:'600'
                       }}>
                           Total estimé : <span style={{fontWeight:'normal'}}>{formData.nb_rangees || 0} rangées × {formData.nb_places_par_rangee || 0} places = </span> 
                           <span style={{color:'#4318FF', fontSize:'1.1rem', fontWeight:'bold'}}>
                                { (parseInt(formData.nb_rangees || 0) * parseInt(formData.nb_places_par_rangee || 0)) } places
                           </span>
                       </div>
                   </div>

                   {/* Image URL */}
                   <div style={{marginBottom:'30px'}}>
                       <label style={{display:'block', marginBottom:'5px', fontWeight:'500', color:'#64748b'}}>Image URL (Optionnel)</label>
                       <input 
                           className="input-style" 
                           name="image_url" 
                           value={formData.image_url}
                           onChange={(e) => setFormData({...formData, image_url: e.target.value})} 
                       />
                   </div>

                   {/* Boutons d'action */}
                   <div style={{display:'flex', gap:'15px'}}>
                       <button 
                           type="button" 
                           className="btn-outline" 
                           style={{flex:1}} 
                           onClick={() => setActiveTab('parkings')}
                       >
                           Annuler
                       </button>
                       <button 
                           type="submit" 
                           className="btn-primary" 
                           style={{flex:1, backgroundColor:'#86bf96', borderColor:'#86bf96'}} // Couleur verte comme sur l'image
                       >
                           Confirmer et Ajouter
                       </button>
                   </div>
                </form>
             </div>
        )}
        {activeTab === 'bookings' && (
            <div className="card-white">
                <h3>Réservations Reçues</h3>
                <div className="table-container">
                    <table className="custom-table">
                        <thead>
                            <tr>
                                <th>Conducteur</th><th>Début</th><th>Fin</th><th>Place N°</th><th>Montant</th><th>Statut</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reservations.length === 0 ? <tr><td colSpan="6">Aucune réservation.</td></tr> : reservations.map(r => (
                                <tr key={r.id_reservation}>
                                    <td><strong>{r.nom_conducteur || "Client"}</strong></td>
                                    <td>{formatDate(r.date_debut)}</td>
                                    <td>{formatDate(r.date_fin)}</td>
                                    <td>{r.numero_place || "?"}</td>
                                    <td>{r.montant_total} DH</td>
                                    <td>
                                        <span className={`status-badge ${r.statut === 'Terminé' ? 'success' : r.statut === 'En cours' ? 'pending' : 'error'}`}>
                                            {r.statut}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}
        {activeTab === 'earnings' && (
            <div className="card-white">
                <div style={{display:'flex', gap:'30px', alignItems:'center', marginBottom:'20px'}}>
                    <h3 style={{margin:0}}>Historique des Revenus</h3>
                    
                    <div className="earning-badge">
                        <span className="label">Aujourd'hui</span>
                        <span className="amount">+{totalToday.toFixed(2)} DH</span>
                    </div>

                    <div className="earning-badge" style={{borderColor:'#16a34a', color:'#16a34a'}}>
                        <span className="label">Ce Mois</span>
                        <span className="amount">+{totalMonthly.toFixed(2)} DH</span>
                    </div>
                </div>

                <table className="custom-table">
    <thead>
        <tr>
            <th>Date Paiement</th>
            <th>Conducteur</th> 
            <th>Type Carte</th>
            <th>Montant</th>
        </tr>
    </thead>
    <tbody>
        {monthlyEarnings.length === 0 ? (
            <tr>
                {/* <-- 2. Attention : colSpan passe de 3 à 4 */}
                <td colSpan="4">Aucun revenu ce mois-ci.</td>
            </tr>
        ) : (
            monthlyEarnings.map((e, index) => (
                <tr key={index}>
                    <td>{formatDate(e.date_display)}</td>

                    {/* <-- 3. Nouvelle cellule Données Validées */}
                    <td style={{ fontWeight: 'bold', color: '#444' }}>
                        {e.nom_display}
                    </td>

                    <td>{e.type_carte || "Carte Bancaire"}</td>
                    <td style={{ color: 'green', fontWeight: 'bold' }}>
                        +{e.montant_display.toFixed(2)} DH
                    </td>
                </tr>
            ))
        )}
    </tbody>
</table>
            </div>
        )}

        {activeTab === 'scanner' && (
             <div className="card-white centered-scan">
                 <h3>Scanner de Contrôle</h3>
                 
                 {scanData ? (
                     <ValidationSortieManager 
                         scanData={scanData} 
                         onClose={() => setScanData(null)} 
                     />
                 ) : (
                     <div className="scanner-frame" style={{ border: 'none', background: 'transparent' }}>
                         {/* C'est ICI que la bibliothèque va injecter la vidéo magiquement */}
                         <div id="qr-reader" style={{ width: "100%", borderRadius: "12px", overflow: "hidden" }}></div>
                     </div>
                 )}
             </div>
        )}

      </div>

      {/* --- MODALES --- */}

      {/* 1. MODALE PROFIL (Stylisée) */}
      {showProfileModal && (
        <div className="modal-overlay">
           <div className="modal-content">
              <div className="modal-header">
                  <h3>Modifier mon Profil</h3>
                  <button className="close-btn" onClick={() => setShowProfileModal(false)}>×</button>
              </div>
              
              <div className="profile-body" style={{textAlign:'center'}}>
                   <div style={{width:'100px', height:'100px', borderRadius:'50%', overflow:'hidden', margin:'0 auto 20px', border:'3px solid #e2e8f0', position:'relative'}}>
                        <img src={previewImage || getImageUrl(user.photo)} alt="Profil" style={{width:'100%', height:'100%', objectFit:'cover'}} />
                   </div>
                   
                   <div style={{textAlign:'left'}}>
                       <label style={{fontSize:'0.9rem', fontWeight:'600', color:'#64748b'}}>Nom complet</label>
                       <input 
                           type="text" 
                           className="input-style" 
                           value={profileData.nom} 
                           onChange={(e) => setProfileData({...profileData, nom: e.target.value})}
                       />

                       <label style={{fontSize:'0.9rem', fontWeight:'600', color:'#64748b'}}>Email</label>
                       <input 
                           type="email" 
                           className="input-style" 
                           value={profileData.email} 
                           onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                       />

                       <label style={{fontSize:'0.9rem', fontWeight:'600', color:'#64748b'}}>Changer Photo</label>
                       <input type="file" className="input-style" onChange={handleFileChange} />
                   </div>
              </div>

              <div className="modal-footer" style={{marginTop:'20px'}}>
                  <button className="btn-outline" onClick={() => setShowProfileModal(false)}>Annuler</button>
                  <button className="btn-primary" onClick={handleUpdateProfile}>Enregistrer</button>
              </div>
           </div>
        </div>
      )}

   {/* 2. MODALE MODIFICATION PARKING */}
      {showEditParkingModal && editingParking && (
          <div className="modal-overlay">
              <div className="modal-content">
                  <div className="modal-header">
                      <h3>Modifier Parking</h3>
                      <button className="close-btn" onClick={() => setShowEditParkingModal(false)}>×</button>
                  </div>
                  
                  <label>Nom du parking</label>
                  <input className="input-style" value={editingParking.nom} onChange={(e) => setEditingParking({...editingParking, nom: e.target.value})} />
                  
                  <label>Adresse</label>
                  <input className="input-style" value={editingParking.adresse} onChange={(e) => setEditingParking({...editingParking, adresse: e.target.value})} />
                  
                  <label>Prix/H</label>
                  <input type="number" className="input-style" value={editingParking.tarif_heure || editingParking.prix_heure} onChange={(e) => setEditingParking({...editingParking, tarif_heure: e.target.value})} />
                  
                  {/* Ligne pour Rangées et Places (Désactivés) */}
                  <div className="form-row form-row-dimensions">
                       <div className="form-col">
                           <label>Rangées</label>
                           <input 
                               type="number" 
                               className="input-style input-disabled" 
                               value={editingParking.nb_rangees} 
                               disabled 
                               title="La taille du parking ne peut pas être modifiée"
                           />
                       </div>
                       <div className="form-col">
                           <label>Places / Rangée</label>
                           <input 
                               type="number" 
                               className="input-style input-disabled" 
                               value={editingParking.nb_places_par_rangee} 
                               disabled 
                               title="La taille du parking ne peut pas être modifiée"
                           />
                       </div>
                  </div>

                  <div className="modal-footer modal-footer-spaced">
                      <button className="btn-outline" onClick={() => setShowEditParkingModal(false)}>Annuler</button>
                      <button className="btn-primary" onClick={handleSaveParkingEdit}>Enregistrer</button>
                  </div>
              </div>
          </div>
      )}

      {/* 3. MODALE AVIS (Restylisée) */}
      {showReviewsModal && (
          <div className="modal-overlay">
              <div className="modal-content" style={{maxHeight: '500px', display:'flex', flexDirection:'column'}}>
                  <div className="modal-header">
                      <h3>Avis Clients</h3>
                      <button className="close-btn" onClick={() => setShowReviewsModal(false)}>×</button>
                  </div>
                  
                  <div style={{overflowY: 'auto', flex:1}}>
                      {reviews.length === 0 ? <p style={{textAlign:'center', color:'#94a3b8', padding:'20px'}}>Aucun avis pour le moment.</p> : (
                          <ul className="reviews-list">
                              {reviews.map((rev, i) => (
                                  <li key={i} className="review-item">
                                      <div className="review-header">
                                          <strong>{rev.user_name || "Client"}</strong>
                                          <div className="stars">
                                              {[...Array(5)].map((_, idx) => (
                                                  <i key={idx} className={`fa-star ${idx < rev.note ? "fa-solid" : "fa-regular"}`} style={{color: '#fbbf24', fontSize:'0.8rem'}}></i>
                                              ))}
                                          </div>
                                      </div>
                                      <p className="review-text" style={{fontStyle:'italic', color:'#555', margin:'5px 0'}}>"{rev.message}"</p>
                                      <span className="review-date" style={{fontSize:'0.75rem', color:'#999'}}>{formatDate(rev.date_avis)}</span>
                                  </li>
                              ))}
                          </ul>
                      )}
                  </div>
              </div>
          </div>
      )}

      {/* 4. MODALE LOGOUT */}
      {showLogoutModal && (
          <div className="modal-overlay">
              <div className="modal-content">
                  <h3>Déconnexion</h3>
                  <p>Voulez-vous vraiment quitter ?</p>
      {/* 5. MODALE PLAN PARKING (NOUVEAU) */}
      {showMapModal && selectedParkingForMap && (
        <div className="modal-overlay">
            <div className="modal-content" style={{maxWidth: '800px', width:'90%'}}>
               <div className="modal-header">
                  <h3>Plan: {selectedParkingForMap.nom}</h3>
                  <button className="close-btn" onClick={() => setShowMapModal(false)}>×</button>
               </div>
               
               <div style={{padding:'20px', overflowY:'auto', maxHeight:'60vh'}}>
                   <div style={{display:'flex', gap:'20px', marginBottom:'20px', fontSize:'0.9rem'}}>
                      <div style={{display:'flex', alignItems:'center', gap:'5px'}}>
                          <div style={{width:'15px', height:'15px', background:'#e2e8f0', borderRadius:'4px'}}></div> Libre
                      </div>
                      <div style={{display:'flex', alignItems:'center', gap:'5px'}}>
                          <div style={{width:'15px', height:'15px', background:'#ef4444', borderRadius:'4px'}}></div> Occupé
                      </div>
                      <div style={{display:'flex', alignItems:'center', gap:'5px'}}>
                          <div style={{width:'15px', height:'15px', background:'#f59e0b', borderRadius:'4px'}}></div> Réservé
                      </div>
                   </div>

                   {/* GRID DU PARKING */}
                   <div style={{
                       display: 'grid',
                       gridTemplateColumns: `repeat(${selectedParkingForMap.nb_places_par_rangee || 10}, 1fr)`,
                       gap: '10px',
                       marginTop:'10px'
                   }}>
                       {Array.from({ length: (selectedParkingForMap.nb_rangees || 0) * (selectedParkingForMap.nb_places_par_rangee || 0) }).map((_, idx) => {
                           // Simulation occcupation (tu pourras connecter ça au backend plus tard)
                           // On regarde si une réservation active correspond à cette place (si on a numero_place)
                           const placeNum = idx + 1;
                           // On cherche si ce parking a une resa active sur ce numero (Besoin que 'reservations' soit dispo globalement)
                           const isReserved = reservations.some(r => r.numero_place == placeNum && r.statut === 'En cours');
                           
                           return (
                               <div key={idx} style={{
                                   aspectRatio: '1/1',
                                   backgroundColor: isReserved ? '#ef4444' : '#e2e8f0',
                                   borderRadius: '6px',
                                   display: 'flex',
                                   alignItems: 'center',
                                   justifyContent: 'center',
                                   fontWeight: 'bold',
                                   color: isReserved ? 'white' : '#64748b',
                                   fontSize: '0.8rem',
                                   border: isReserved ? '2px solid #b91c1c' : '1px solid #cbd5e1'
                               }}>
                                   {placeNum}
                               </div>
                           );
                       })}
                       {((selectedParkingForMap.nb_rangees || 0) * (selectedParkingForMap.nb_places_par_rangee || 0)) === 0 && (
                           <div style={{gridColumn:'1 / -1', textAlign:'center', color:'#94a3b8', padding:'30px'}}>
                               Configuration du plan non définie (Rangées/Places).
                           </div>
                       )}
                   </div>
               </div>
            </div>
        </div>
      )}

                  <div className="modal-footer" style={{justifyContent:'flex-end'}}>
                      <button className="btn-outline" onClick={() => setShowLogoutModal(false)}>Annuler</button>
                      <button className="btn-primary" style={{background:'#ef4444', border:'none'}} onClick={() => {
                          sessionStorage.clear();
                          navigate('/signin');
                      }}>Déconnecter</button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
}

// PETITS COMPOSANTS 
const MenuItem = ({ icon, label, active, onClick }) => (
   <div className={`menu-item ${active ? 'active' : ''}`} onClick={onClick}>
      <i className={`fa-solid ${icon}`}></i> {label}
   </div>
);

const StatCard = ({ title, value, icon, color }) => (
  <div className="stat-card">
    <div className="icon-wrapper" style={{ background: `${color}20`, color: color }}>
      <i className={`fa-solid ${icon}`}></i>
    </div>
    <div className="stat-info">
      <h4>{title}</h4>
      <div className="stat-value">{value}</div>
    </div>
  </div>
);

export default DashboardManager;