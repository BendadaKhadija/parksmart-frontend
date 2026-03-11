import React, { useState, useEffect, useRef } from 'react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import axios from 'axios';
import { FaArrowLeft, FaGoogle, FaApple, FaPaypal, FaCreditCard, FaLock } from 'react-icons/fa';
import { useTranslation } from '../i18n.jsx';
// Si tu n'utilises pas router, tu peux commenter cette ligne, sinon garde-la :
// import { useNavigate } from 'react-router-dom'; 

function ProcessingStep({ onDone, styles, t }) {
    const onDoneRef = useRef(onDone);
    useEffect(() => {
        const timer = setTimeout(() => onDoneRef.current(), 1200);
        return () => clearTimeout(timer);
    }, []);
    return (
        <div style={{ ...styles.container, justifyContent: 'center', alignItems: 'center' }}>
            <div className="spinner" style={{ width: '50px', height: '50px', border: '5px solid #eee', borderTop: '5px solid #6c9a75', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            <h3 style={{ marginTop: '20px', color: '#333' }}>Connexion à la banque...</h3>
            <p style={{ color: '#666', fontSize: '14px', textAlign: 'center', marginTop: '10px' }}>
                Veuillez ne pas fermer cette fenêtre pendant le traitement sécurisé.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '30px', color: '#888', fontSize: '12px' }}>
                <FaLock /> {t('timer_3d_secure')}
            </div>
        </div>
    );
}

const ParkingTimer = ({ reservation, onStop, onPaymentStart }) => {
    const { t } = useTranslation();
    console.log("Données de la réservation reçues :", reservation);
    // Si tu n'as pas de router configuré, on utilise window.location.reload() à la fin
    // const navigate = useNavigate(); 
    
    // --- ETATS ---
    const [step, setStep] = useState('timer'); // 'timer', 'payment', 'summary'
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [billData, setBillData] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('credit_card');
    const [isLoading, setIsLoading] = useState(false);
    const [confirmedId, setConfirmedId] = useState(null);
    const [cardDetails, setCardDetails] = useState({ number: '', expiry: '', cvv: '', name: '' });
    const [cardError, setCardError] = useState('');

  // --- 1. LOGIQUE TIMER PERSISTANT ---
    useEffect(() => {
        // Si pas de réservation ou si on n'est pas sur le timer, on ne fait rien
        if (!reservation || step !== 'timer') return;
        
        // 🎯 NOUVELLE LOGIQUE ULTIME
        let startMs = 0;
        const now = Date.now();

        // A. Essayer de parser date_arrivee (format ISO standard du back)
        if (reservation.date_arrivee) {
             const dateStr = typeof reservation.date_arrivee === 'string' 
                 ? reservation.date_arrivee
                 : reservation.date_arrivee;
             const parsed = new Date(dateStr).getTime();
             if (!isNaN(parsed) && parsed > 0) {
                  startMs = parsed;
             }
        }
        // Fallback ancient champ date_debut
        else if (reservation.date_debut) {
            const dateStr = typeof reservation.date_debut === 'string' 
                ? reservation.date_debut.replace(' ', 'T') 
                : reservation.date_debut;
            const parsed = new Date(dateStr).getTime();
            
            if (!isNaN(parsed) && parsed > 0) {
                 startMs = parsed;
            }
        }

        // B. Recalibration via temps_ecoule_secondes (Priorité absolue si dispo car vient du serveur)
        // Ceci résout le problème de timezone : On déduit le startMs "local" depuis la durée "serveur".
        if (reservation.temps_ecoule_secondes > 0) {
             const derivedStart = now - (reservation.temps_ecoule_secondes * 1000);
             
             // Si on avait un startMs via date_debut, on compare
             if (startMs > 0) {
                 const diff = Math.abs(startMs - derivedStart);
                 // Si la différence est > 60 secondes, on fait confiance au serveur (temps_ecoule)
                 // car date_debut a probablement un décalage horaire.
                 if (diff > 60000) {
                     startMs = derivedStart;
                 }
             } else {
                 startMs = derivedStart;
             }
        }

        // C. Fallback final (date_creation)
        if (startMs === 0 && (reservation.created_at || reservation.date_creation)) {
             const created = reservation.created_at || reservation.date_creation;
             const createdStr = typeof created === 'string' ? created.replace(' ', 'T') : created;
             startMs = new Date(createdStr).getTime();
        }
        
        const updateTimer = () => {
             const currentNow = Date.now();
             // Si startMs est dans le futur (malgré tout), on affiche 0
             const diffInSeconds = Math.floor((currentNow - startMs) / 1000);
             
             setElapsedSeconds(prev => {
                 // 🔔 NOTIFICATION LOCALE À 15 MINUTES (900s)
                 if (prev < 900 && diffInSeconds >= 900) {
                     const msgTitle = "Rappel ParkSmart";
                     const msgBody = "15 minutes se sont écoulées depuis le début de votre réservation.";
                     const notifOptions = { body: msgBody, icon: '/logo192.png', vibrate: [200, 100, 200] };

                     if (Notification.permission === 'granted') {
                         // ESSAYER VIA SERVICE WORKER (Meilleur pour mobile / background)
                         if ('serviceWorker' in navigator) {
                             navigator.serviceWorker.ready.then(registration => {
                                 registration.showNotification(msgTitle, notifOptions);
                             }).catch(err => {
                                 console.warn("SW notif failed, trying standard:", err);
                                 new Notification(msgTitle, notifOptions);
                             });
                         } else {
                             new Notification(msgTitle, notifOptions);
                         }
                     } else {
                         // Fallback alert si permission refusée ou non gérée
                         // On met un petit setTimeout pour ne pas bloquer le render
                         setTimeout(() => alert(`🔔 ${msgBody}`), 500);
                     }
                 }
                 return diffInSeconds > 0 ? diffInSeconds : 0;
             });
        };

        // On lance tout de suite updateTimer pour ne pas attendre 1 seconde
        updateTimer();

        // Puis on rafraîchit chaque seconde
        const interval = setInterval(updateTimer, 1000);

        return () => clearInterval(interval);
    }, [reservation, step]); // Ce bloc s'exécute quand la réservation est chargée
    // Formatage du temps
    const formatTime = (totalSeconds) => {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        const pad = (num) => num.toString().padStart(2, '0');
        return { 
            h: pad(hours), 
            m: pad(minutes), 
            s: pad(seconds), 
            str: `${pad(hours)}h ${pad(minutes)}m` 
        };
    };

    const time = formatTime(elapsedSeconds);
    const percentage = (elapsedSeconds % 60) * (100 / 60); 

    // --- 2. ACTION : ARRÊTER LE CHRONO ---
    const handleStop = async () => {
        setIsLoading(true);
        const token = sessionStorage.getItem('token'); // IMPORTANT POUR LA BDD
        // Récupération de l'ID (gère plusieurs formats possibles)
        const idToSend = reservation.id_resa || reservation.id || reservation.id_reservation;
        setConfirmedId(idToSend);
        try {
            console.log("Envoi demande STOP pour ID:", idToSend);
            
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/reservation/stop`, 
                { id_resa: idToSend },
                { headers: { Authorization: `Bearer ${token}` } } // Ajout du header Auth
            );
     
            console.log("Réponse STOP:", response.data);

            setBillData({
                montant: response.data.montant, 
                duree: response.data.duree || time.str 
            });
            if (onPaymentStart) onPaymentStart();
            setStep('payment');

        } catch (error) {
            console.error("Erreur STOP:", error);
            // Calcul approximatif : 4 DH / heure (Exemple)
            const prixEstime = ((elapsedSeconds / 3600) * 4).toFixed(2);
            setBillData({ montant: prixEstime, duree: time.str }); 
            setStep('payment');
        } finally {
            setIsLoading(false);
        }
    };

    // --- 3. FINALISER (PAIEMENT) ---
    const handleFinalize = async () => {
        setIsLoading(true);
        const token = sessionStorage.getItem('token');
        const finalId = confirmedId || reservation.id_resa || reservation.id;

        if (!finalId) {
            alert("Erreur critique : ID Réservation introuvable");
            setIsLoading(false);
            return;
        }        
        try {
            console.log("Envoi Paiement BDD...");
            
            await axios.post(`${import.meta.env.VITE_API_URL}/api/paiement/confirm`, {
                id_resa: finalId,
                montant: billData.montant,
                mode: paymentMethod,
                date_paiement: new Date().toISOString()
            }, { 
                headers: { Authorization: `Bearer ${token}` } 
            });

            alert("✅ Paiement validé ! Merci et à bientôt.");
            if (onStop) {
                onStop(); 
            } else {
                window.location.reload();
            }

        } catch (error) {
            console.error("Erreur Paiement:", error);
            alert("❌ Erreur de connexion lors du paiement.");
        } finally {
            setIsLoading(false);
        }
    };

    // --- Styles CSS en objet (TON DESIGN ORIGINAL) ---
const styles = {
    container: { padding: '20px', paddingBottom: '80px', fontFamily: "'Segoe UI', sans-serif", maxWidth: '400px', margin: '0 auto', backgroundColor: '#fff', minHeight: '100vh', display: 'flex', flexDirection: 'column' },
    header: { display: 'flex', alignItems: 'center', gap: '15px', color: '#6c9a75', marginBottom: '20px' },
    title: { margin: 0, fontSize: '20px', color: '#333', fontWeight:'bold' },
    timerWrapper: { display: 'flex', justifyContent: 'center', margin: '30px 0' },
    priceList: { border: '1px solid #6c9a75', borderRadius: '12px', padding: '15px', marginBottom: '20px' },
    priceRow: { display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #eee', color: '#555' },
    mainButton: { width: '100%', padding: '15px', backgroundColor: '#6c9a75', color: 'white', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginTop: 'auto', marginBottom:'10px' },
    option: { display: 'flex', justifyContent: 'space-between', padding: '15px', border: '1px solid #eee', borderRadius: '10px', marginBottom:'10px', cursor:'pointer', alignItems:'center' },
    optionActive: { display: 'flex', justifyContent: 'space-between', padding: '15px', border: '2px solid #6c9a75', backgroundColor: '#f0f9f0', borderRadius: '10px', marginBottom:'10px', cursor:'pointer', alignItems:'center' },
    detailRow: { display: 'flex', justifyContent: 'space-between', marginBottom: '15px', fontSize:'15px' },
    inputField: { width: '100%', padding: '15px', borderRadius: '10px', border: '1px solid #ccc', fontSize: '16px', boxSizing: 'border-box', outline: 'none' }
};

// --- RENDU : Gestion des erreurs si pas de réservation ---
if (!reservation) {
    return (
        <div style={{padding:50, textAlign:'center', color:'red', fontWeight:'bold'}}>
            ⚠️ PROBLÈME : Aucune réservation reçue par le minuteur.<br/><br/>
        </div>
    );
}
    // 1. VUE TIMER
    if (step === 'timer') {
        return (
            <div style={styles.container}>
                <div style={styles.header}><h2 style={{...styles.title, margin:'auto'}}>{t('timer_title')}</h2></div>
                <div style={styles.timerWrapper}>
                    <div style={{ width: 220, height: 220 }}>
                        <CircularProgressbar 
                            value={percentage} 
                            text={`${time.h}:${time.m}:${time.s}`} 
                            styles={buildStyles({ pathColor: `#6c9a75`, trailColor: '#eee', textColor: '#333', textSize: '16px' })} 
                            strokeWidth={8} 
                        />
                    </div>
                </div>
                
                <div style={styles.priceList}>
                    <div style={styles.priceRow}><span>1 Heure</span> <span>4.00 DH</span></div>
                    <div style={styles.priceRow}><span>2 Heures</span> <span>8.00 DH</span></div>
                    <div style={styles.priceRow}><span>3 Heures</span> <span>12.00 DH</span></div>
                </div>
                <button style={styles.mainButton} onClick={handleStop} disabled={isLoading}>
                    {isLoading ? "CALCUL..." : t('timer_pay_now')}
                </button>
            </div>
        );
    }

    // 2. VUE CHOIX PAIEMENT
    if (step === 'payment') {
        return (
            <div style={styles.container}>
                <div style={styles.header}>
                    <FaArrowLeft onClick={() => setStep('timer')} style={{cursor:'pointer'}} />
                    <h2 style={styles.title}>{t('timer_methods_title')}</h2>
                </div>
                <h4 style={{marginBottom:'20px'}}>{t('timer_choose_method')}</h4>

                {[
                    {id:'credit_card', icon: <FaCreditCard color="#333" size={24}/>, label: "Carte Bancaire (Sécurisé)"},
                    {id:'paypal', icon: <FaPaypal color="#003087" size={24}/>, label: "Paypal"},
                    {id:'google', icon: <FaGoogle color="#DB4437" size={24}/>, label: "Google Pay"},
                    {id:'apple', icon: <FaApple color="#000" size={24}/>, label: "Apple Pay"}
                ].map(opt => (
                    <div key={opt.id} style={paymentMethod === opt.id ? styles.optionActive : styles.option} onClick={() => setPaymentMethod(opt.id)}>
                        <div style={{display:'flex', gap:'15px', alignItems:'center'}}>{opt.icon} <b>{opt.label}</b></div>
                        <input type="radio" checked={paymentMethod === opt.id} readOnly style={{accentColor:'#6c9a75', width:18, height:18}}/>
                    </div>
                ))}

                <button style={styles.mainButton} onClick={() => {
                    if (paymentMethod === 'credit_card') {
                        setStep('card_details');
                    } else {
                        setStep('processing');
                    }
}}>{t('timer_continue')}</button>
            </div>
        );
    }

    // 2.5 VUE CARTE BANCAIRE ET PROCESSING
    if (step === 'card_details') {
        const handleCardSubmit = () => {
            const { number, expiry, cvv, name } = cardDetails;
            if (!number || number.length < 16) {
                setCardError('Veuillez entrer un numéro de carte valide.');
                return;
            }
            if (!expiry || expiry.length < 5) {
                setCardError('Veuillez entrer une date d\'expiration valide.');
                return;
            }
            if (!cvv || cvv.length < 3) {
                setCardError('Veuillez entrer un CVV valide.');
                return;
            }
            if (!name || name.length < 2) {
                setCardError('Veuillez entrer le nom sur la carte.');
                return;
            }
            setCardError('');
            setStep('processing');
        };

        return (
            <div style={styles.container}>
                <div style={styles.header}>
                    <FaArrowLeft onClick={() => setStep('payment')} style={{cursor:'pointer'}} />
                    <h2 style={styles.title}>Détails de la Carte</h2>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div style={{ position: 'relative' }}>
                        <label style={{ fontSize: '14px', color: '#555', marginBottom: '5px', display: 'block', fontWeight: 'bold' }}>Numéro de carte</label>
                        <input type="text" placeholder="1234 5678 9101 1121" maxLength="19" style={{...styles.inputField, borderColor: cardError && !cardDetails.number ? 'red' : '#ccc'}} value={cardDetails.number} onChange={(e) => setCardDetails({...cardDetails, number: e.target.value})} />
                        <FaCreditCard style={{ position: 'absolute', right: '15px', top: '35px', color: '#aaa' }} />
                    </div>
                    <div style={{ display: 'flex', gap: '15px' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ fontSize: '14px', color: '#555', marginBottom: '5px', display: 'block', fontWeight: 'bold' }}>Date d'exp.</label>
                            <input type="text" placeholder="MM/YY" maxLength="5" style={{...styles.inputField, borderColor: cardError && !cardDetails.expiry ? 'red' : '#ccc'}} value={cardDetails.expiry} onChange={(e) => {
                                let val = e.target.value.replace(/\D/g, '');
                                if (val.length >= 3) { val = val.slice(0,2) + '/' + val.slice(2,4); }
                                setCardDetails({...cardDetails, expiry: val});
                            }} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ fontSize: '14px', color: '#555', marginBottom: '5px', display: 'block', fontWeight: 'bold' }}>CVV</label>
                            <input type="password" placeholder="123" maxLength="3" style={{...styles.inputField, borderColor: cardError && !cardDetails.cvv ? 'red' : '#ccc'}} value={cardDetails.cvv} onChange={(e) => setCardDetails({...cardDetails, cvv: e.target.value.replace(/\D/g, '')})} />
                        </div>
                    </div>
                    <div>
                        <label style={{ fontSize: '14px', color: '#555', marginBottom: '5px', display: 'block', fontWeight: 'bold' }}>Nom sur la carte</label>
                        <input type="text" placeholder="Titulaire de la carte" style={{...styles.inputField, borderColor: cardError && !cardDetails.name ? 'red' : '#ccc'}} value={cardDetails.name} onChange={(e) => setCardDetails({...cardDetails, name: e.target.value})} />
                    </div>
                </div>

                {cardError && <div style={{ color: 'red', fontSize: '14px', marginTop: '10px' }}>{cardError}</div>}

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '20px', color: '#6c9a75', fontSize: '14px', backgroundColor: '#f0f9f0', padding: '10px', borderRadius: '8px' }}>
                    <FaLock />
                    <span>Vos informations de paiement sont sécurisées avec un chiffrement SSL 256-bit.</span>
                </div>

                <button style={{ ...styles.mainButton, marginTop: '30px' }} onClick={handleCardSubmit}>
                    Payer {parseFloat(billData?.montant || 0).toFixed(2)} DH
                </button>
            </div>
        );
    }

    if (step === 'processing') {
        return (
            <ProcessingStep onDone={() => setStep('summary')} styles={styles} t={t} />
        );
    }

    // 3. VUE RESUME
    if (step === 'summary' && billData) {
        // Sécurité si billData.montant est une string ou un nombre
        const montant = parseFloat(billData.montant || 0);
        const total = montant.toFixed(2);

        return (
            <div style={styles.container}>
                 <div style={styles.header}>
                    <FaArrowLeft onClick={() => setStep('payment')} style={{cursor:'pointer'}} />
                    <h2 style={styles.title}>{t('timer_payment_detail')}</h2>
                </div>
                
                <div style={{textAlign:'center', margin:'20px 0'}}>
                   <div style={{width:80, height:80, backgroundColor:'#6c9a75', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto'}}>
                        <span style={{color:'white', fontSize:'40px'}}>✓</span>
                   </div>
                   <h3 style={{marginTop:'15px'}}>{t('timer_payment_review')}</h3>
                </div>

                <div style={{border:'1px solid #ddd', borderRadius:'12px', padding:'20px'}}>
                    <h4 style={{marginTop:0}}>{t('timer_order_detail')}</h4>
                    <div style={styles.detailRow}>
                        <span style={{color:'#777'}}>{t('timer_parking_area')}</span>
                        <strong>{reservation.nom_parking || "Parking Smart"}</strong>
                    </div>
                     <div style={styles.detailRow}>
                        <span style={{color:'#777'}}>{t('timer_duration')}</span>
                        <strong>{billData.duree}</strong>
                    </div>
                     <div style={styles.detailRow}>
                        <span style={{color:'#777'}}>{t('timer_date')}</span>
                        <strong>{new Date().toLocaleDateString()}</strong>
                    </div>
                    <hr style={{borderTop:'1px dashed #ccc', margin:'15px 0'}}/>
                    <div style={{display:'flex', justifyContent:'space-between', fontSize:'18px', fontWeight:'bold'}}>
                        <span>{t('timer_total')}</span>
                        <span style={{color:'#6c9a75'}}>{total} DH</span>
                    </div>
                </div>

                <button style={styles.mainButton} onClick={handleFinalize} disabled={isLoading}>
                    {isLoading ? t('timer_processing') : t('timer_confirm')}
                </button>
            </div>
            
        );
        
    }

    return null;
    
};

export default ParkingTimer;