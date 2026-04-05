import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

const RecuReservation = ({ reservationData }) => {
  // Styles CSS intégrés 
  const styles = {
    container: {
      maxWidth: '400px',
      margin: '40px auto',
      padding: '30px',
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
      border: '2px dashed #e5e7eb',
      fontFamily: '"Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      color: '#374151'
    },
    header: {
      textAlign: 'center',
      marginBottom: '20px'
    },
    title: {
      color: '#059669', // Vert ParkSmart
      fontSize: '28px',
      fontWeight: 'bold',
      margin: '0 0 5px 0'
    },
    subtitle: {
      color: '#6b7280',
      fontSize: '14px',
      margin: '0'
    },
    qrContainer: {
      display: 'flex',
      justifyContent: 'center',
      backgroundColor: '#f9fafb',
      padding: '20px',
      borderRadius: '8px',
      marginBottom: '20px'
    },
    detailsBox: {
      borderTop: '1px solid #e5e7eb',
      paddingTop: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    },
    row: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: '15px'
    },
    label: {
      color: '#6b7280'
    },
    value: {
      fontWeight: 'bold',
      color: '#111827'
    },
    divider: {
      height: '1px',
      backgroundColor: '#f3f4f6',
      border: 'none',
      margin: '5px 0'
    },
    totalRow: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: '18px',
      borderTop: '2px solid #e5e7eb',
      paddingTop: '15px',
      marginTop: '5px',
      fontWeight: 'bold'
    },
    totalPrice: {
      color: '#059669' // Vert ParkSmart
    },
    footerText: {
      textAlign: 'center',
      fontSize: '12px',
      color: '#9ca3af',
      marginTop: '25px',
      fontStyle: 'italic'
    },
    button: {
      width: '100%',
      padding: '12px',
      marginTop: '20px',
      backgroundColor: '#f3f4f6',
      color: '#4b5563',
      border: 'none',
      borderRadius: '6px',
      fontSize: '15px',
      fontWeight: 'bold',
      cursor: 'pointer',
      transition: 'background 0.2s'
    }
  };

  // Si aucune donnée n'est passée (sécurité pour éviter que l'app plante)
  if (!reservationData) {
    return <div style={{ textAlign: 'center', marginTop: '50px' }}>Chargement du reçu...</div>;
  }

  return (
    <>
      {/* Balise style spéciale pour cacher le bouton lors de l'impression ou capture en PDF */}
      <style>
        {`
          @media print {
            .no-print { display: none !important; }
            body { background-color: white; }
          }
        `}
      </style>

      <div style={styles.container}>
        {/* En-tête */}
        <div style={styles.header}>
          <h2 style={styles.title}>ParkSmart</h2>
          <p style={styles.subtitle}>Reçu de Réservation Officiel</p>
        </div>

        {/* Zone du QR Code */}
        <div style={styles.qrContainer}>
          <QRCodeSVG 
            value={String(reservationData.reservationId)} 
            size={160}
            level={"H"}
          />
        </div>

        {/* Détails */}
        <div style={styles.detailsBox}>
          <div style={styles.row}>
            <span style={styles.label}>N° Réservation:</span>
            <span style={styles.value}>#{reservationData.reservationId}</span>
          </div>
          <div style={styles.row}>
            <span style={styles.label}>Conducteur:</span>
            <span style={styles.value}>{reservationData.nomConducteur}</span>
          </div>
          <div style={styles.row}>
            <span style={styles.label}>Véhicule:</span>
            <span style={{ ...styles.value, textTransform: 'uppercase' }}>
              {reservationData.immatriculation}
            </span>
          </div>
          
          <hr style={styles.divider} />
          
          <div style={styles.row}>
            <span style={styles.label}>Parking:</span>
            <span style={styles.value}>{reservationData.nomParking}</span>
          </div>
          <div style={styles.row}>
            <span style={styles.label}>Place Attribuée:</span>
            <span style={{ ...styles.value, color: '#76ae94', fontSize: '18px', backgroundColor: '#ecfdf5', padding: '2px 8px', borderRadius: '4px' }}>
              {reservationData.place}
            </span>
          </div>
          <div style={styles.row}>
            <span style={styles.label}>Date & Heure:</span>
            <span style={styles.value}>{reservationData.date} à {reservationData.heure}</span>
          </div>
          
          <div style={styles.totalRow}>
            <span>Total Payé:</span>
            <span style={styles.totalPrice}>{reservationData.prix} MAD</span>
          </div>
        </div>

        {/* Message de fin */}
        <p style={styles.footerText}>
          Veuillez présenter ce QR Code au gestionnaire à votre arrivée au parking.
        </p>
        
        {/* Bouton d'impression (classe no-print pour qu'il n'apparaisse pas sur le PDF) */}
        <button 
          className="no-print" 
          style={styles.button}
          onClick={() => window.print()}
          onMouseOver={(e) => e.target.style.backgroundColor = '#e5e7eb'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#f3f4f6'}
        >
          🖨️ Sauvegarder en PDF / Imprimer
        </button>
      </div>
    </>
  );
};

export default RecuReservation;