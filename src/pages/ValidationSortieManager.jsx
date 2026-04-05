import React, { useState } from 'react';
import axios from 'axios';

const ValidationSortieManager = ({ scanData, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Styles intégrés
  const styles = {
    container: { maxWidth: '400px', margin: '20px auto', padding: '20px', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 8px 30px rgba(0,0,0,0.12)', fontFamily: 'sans-serif' },
    statusBadge: { backgroundColor: '#d1fae5', color: '#065f46', padding: '10px', borderRadius: '8px', textAlign: 'center', fontWeight: 'bold', fontSize: '16px', marginBottom: '20px' },
    sectionTitle: { fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px solid #eee', paddingBottom: '5px', marginBottom: '15px', marginTop: '20px' },
    clientName: { fontSize: '24px', fontWeight: 'bold', color: '#111827', textAlign: 'center', margin: '10px 0' },
    detailRow: { display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '16px' },
    placeBadge: { backgroundColor: '#ecfdf5', color: '#059669', padding: '4px 10px', borderRadius: '6px', fontWeight: 'bold', border: '1px solid #10b981' },
    actionButton: { width: '100%', padding: '15px', backgroundColor: '#059669', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginTop: '25px' },
    successMsg: { textAlign: 'center', color: '#059669', padding: '30px 10px' }
  };

  const handleLibererPlace = async () => {
    setIsLoading(true);
    try {
      const token = sessionStorage.getItem('token');
      
      // Appel API pour libérer la place
      await axios.post(`${import.meta.env.VITE_API_URL}/api/parking/liberer`, {
        id_resa: scanData.reservationId,
        place: scanData.place
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setIsSuccess(true);
      
      // Fermer après 2 secondes
      setTimeout(() => {
        if (onClose) onClose();
      }, 2000);

    } catch (error) {
      console.error("Erreur lors de la libération de la place:", error);
      alert("Erreur lors de la libération de la place.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!scanData) return null;

  if (isSuccess) {
    return (
      <div style={styles.container}>
        <div style={styles.successMsg}>
          <div style={{ fontSize: '50px', marginBottom: '10px' }}>✅</div>
          <h2 style={{ margin: 0 }}>Sortie Validée !</h2>
          <p style={{ color: '#6b7280' }}>La barrière est ouverte et la place <b>{scanData.place}</b> est maintenant libre.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.statusBadge}>
        ✅ PAYÉ - AUTORISÉ À SORTIR
      </div>

      <div style={styles.sectionTitle}>Vérification Client</div>
      <div style={styles.clientName}>
        {scanData.nomConducteur}
      </div>

      <div style={styles.sectionTitle}>Détails du Stationnement</div>
      <div style={styles.detailRow}>
        <span style={{ color: '#6b7280' }}>N° Réservation:</span>
        <span style={{ fontWeight: 'bold' }}>#{scanData.reservationId}</span>
      </div>
      <div style={styles.detailRow}>
        <span style={{ color: '#6b7280' }}>Place libérée:</span>
        <span style={styles.placeBadge}>{scanData.place}</span>
      </div>
      <div style={styles.detailRow}>
        <span style={{ color: '#6b7280' }}>Total Réglé:</span>
        <span style={{ fontWeight: 'bold' }}>{scanData.prix} DH</span>
      </div>

      <button 
        style={{...styles.actionButton, opacity: isLoading ? 0.7 : 1}} 
        onClick={handleLibererPlace}
        disabled={isLoading}
      >
        {isLoading ? 'Mise à jour...' : '🔓 Valider Sortie & Libérer Place'}
      </button>
    </div>
  );
};

// C'est cette ligne qui manquait à  votre application !
export default ValidationSortieManager;