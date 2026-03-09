import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import Navbar from '../components/Navbar';
import axios from 'axios';
import L from 'leaflet';
import BookingGrid from './BookingGrid';

// --- 1. DÉFINITION DES ICÔNES (Rouge pour Parking, Bleu pour Moi) ---

// Icône Parking (Rouge)
const parkingIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// --- NOUVELLE ICÔNE UTILISATEUR (Cercle bleu lumineux) ---
const userIcon = new L.divIcon({
  className: '', // Laisse vide pour annuler les styles par défaut de Leaflet
  html: '<div class="glowing-blue-dot"></div>',
  iconSize: [20, 20],
  iconAnchor: [10, 10], // Centre l'icône (moitié de la taille)
  popupAnchor: [0, -15],
});
// --- 2. PETIT COMPOSANT POUR RECENTRER LA CARTE AUTOMATIQUEMENT ---
function RecenterMap({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo(position, 14, { animate: true, duration: 1.5 }); // Zoom fluide
    }
  }, [position, map]);
  return null;
}

function AccueilCarte() {
  // Position par défaut (Si GPS refusé) : Gare de Rabat
  const defaultPosition = [34.020882, -6.841650]; 
  
  const [userPosition, setUserPosition] = useState(null); // Ma position
  const [mapCenter, setMapCenter] = useState(defaultPosition); // Centre de la carte
  const [parkings, setParkings] = useState([]); 
  
  // États pour la grille de réservation
  const [showGrid, setShowGrid] = useState(false);
  const [selectedParking, setSelectedParking] = useState(null);
  const [occupiedSpots, setOccupiedSpots] = useState([]);
  
  const userStr = sessionStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const userId = user ? user.id : 1;
  const userName = user ? user.prenom || user.nom : "Conducteur";

  // --- SUIVI GPS CONTINU & CHARGEMENT INITIAL ---
  useEffect(() => {
    console.log("🛰️ Lancement du suivi GPS et chargement parkings...");

    // --- CHARGEMENT DES PARKINGS (une seule fois) ---
    const fetchParkings = async () => {
      try {
        console.log("📡 Tentative de récupération des parkings...");
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/parkings`);
        console.log("✅ Parkings reçus :", response.data);
        setParkings(response.data);
      } catch (error) {
        console.error("❌ Erreur chargement parkings", error);
      }
    };
    fetchParkings();

    // --- SUIVI GPS EN TEMPS RÉEL ---
    let watchId = null;
    
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          console.log(`✅ GPS Suivi - Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`);
          const newPos = [latitude, longitude];
          setUserPosition(newPos);
          setMapCenter(newPos);
        },
        (err) => {
          console.warn(`⚠️ Erreur Suivi GPS (code ${err.code}): ${err.message}`);
          // En cas d'erreur, on utilise la position par défaut
          const defaultPos = [34.020882, -6.841650];
          if (userPosition === null) {
            setUserPosition(defaultPos);
            setMapCenter(defaultPos);
          }
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      console.warn("⚠️ Geolocation non disponible.");
      const defaultPos = [34.020882, -6.841650];
      setUserPosition(defaultPos);
      setMapCenter(defaultPos);
    }

    // --- NETTOYAGE ---
    return () => {
      console.log("🛑 Arrêt du suivi GPS.");
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, []);

  // B. OUVRIR LA GRILLE (Correction du bug)
  const openGrid = async (parking) => {
    setSelectedParking(parking);
    try {
        // On sécurise l'appel API
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/parkings/${parking.id}/places-occupees`);
        
        // On vérifie que c'est bien un tableau (évite l'écran blanc)
        if (Array.isArray(res.data)) {
            setOccupiedSpots(res.data);
        } else {
            setOccupiedSpots([]);
        }
        setShowGrid(true);
    } catch (err) {
        console.error("Erreur places occupées", err);
        setOccupiedSpots([]); // En cas d'erreur, on ouvre une grille vide
        setShowGrid(true);
    }
  };

  // C. CONFIRMER LA RÉSERVATION
  const handleConfirmReservation = async (spotNumber) => {
    try {
        await axios.post(`${import.meta.env.VITE_API_URL}/api/reservations`, {
            user_id: userId,
            parking_id: selectedParking.id,
            numero_place: spotNumber
        });
        
        alert(`✅ Place #${spotNumber} réservée avec succès !`);
        setShowGrid(false);
        // On ne recharge plus la page brutalement, on ferme juste la grille
    } catch (err) {
        alert("Erreur lors de la réservation. Veuillez réessayer.");
        console.error(err);
    }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <style>
        {`
          .glowing-blue-dot {
            width: 20px;
            height: 20px;
            background-color: #3b82f6; /* Bleu vif */
            border-radius: 50%;
            border: 3px solid white; /* Contour blanc style Apple Maps */
            box-shadow: 0 0 10px rgba(59, 130, 246, 0.8);
            animation: pulse-glow 1.5s infinite;
          }

          @keyframes pulse-glow {
            0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); }
            70% { box-shadow: 0 0 0 20px rgba(59, 130, 246, 0); }
            100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
          }
        `}
      </style>
      <Navbar />
      
      <div style={{ padding: '20px', backgroundColor: '#f0fdf4', borderBottom: '1px solid #ddd', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div>
           <h2>Bonjour, <span style={{color: '#16a34a'}}>{userName}</span> !</h2>
           <p>Les points <span style={{color:'red', fontWeight:'bold'}}>rouges</span> sont les parkings.</p>
        </div>
        {/* Bouton pour forcer la géolocalisation si besoin */}
        <button onClick={() => window.location.reload()} style={{padding:'10px', background:'white', border:'1px solid #ccc', borderRadius:'5px', cursor:'pointer'}}>
           📍 Ma position
        </button>
      </div>

      <div style={{ flex: 1, position:'relative' }}> 
        <MapContainer 
          center={mapCenter} 
          zoom={13} 
          style={{ height: "100%", width: "100%" }}
          dragging={true}
          touchZoom={true}
          doubleClickZoom={true}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* Composant invisible qui bouge la carte quand le GPS te trouve */}
          <RecenterMap position={userPosition} />

          {/* 1. MARQUEUR DE MA POSITION (BLEU) */}
          {userPosition && (
            <Marker position={userPosition} icon={userIcon}>
              <Popup>📍 Vous êtes ici !</Popup>
            </Marker>
          )}

          {/* 2. MARQUEURS DES PARKINGS (ROUGES) */}
          {parkings.map((parking) => (
            <Marker 
                key={parking.id} 
                position={[parking.latitude, parking.longitude]}
                icon={parkingIcon} // <-- On applique l'icône rouge
            >
              <Popup>
                <div style={{ textAlign: 'center', width: '200px' }}>
                  <img 
                    src={parking.image || "https://images.unsplash.com/photo-1470224114660-3f6686c562eb?q=80&w=1000&auto=format&fit=crop"} 
                    alt="Parking"
                    style={{ width: '100%', borderRadius: '8px', height: '100px', objectFit: 'cover', marginBottom: '10px' }}
                  />
                  <h3 style={{ margin: '0 0 5px 0', color: '#16a34a' }}>{parking.nom}</h3>
                  <p>{parking.adresse}</p>
                  <p style={{ fontWeight: 'bold' }}>{parking.tarif_heure || parking.prix_heure} DH/h</p>

                  <button 
                    onClick={() => openGrid(parking)}
                    style={{
                      width: '100%',
                      backgroundColor: parking.places_disponibles > 0 ? '#16a34a' : '#ccc',
                      color: 'white', border: 'none', 
                      padding: '10px 20px', borderRadius: '20px', 
                      cursor: parking.places_disponibles > 0 ? 'pointer' : 'not-allowed',
                      fontWeight: 'bold', marginTop: '10px'
                    }}
                  >
                    {parking.places_disponibles > 0 ? 'Choisir ma place' : 'COMPLET'}
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}

        </MapContainer>
      </div>

      {/* LA GRILLE DE RÉSERVATION */}
      {showGrid && selectedParking && (
        <BookingGrid 
            totalPlaces={selectedParking.total_places}
            occupiedSpots={occupiedSpots}
            onClose={() => setShowGrid(false)}
            onConfirm={handleConfirmReservation}
        />
      )}

    </div>
  );
}

export default AccueilCarte;