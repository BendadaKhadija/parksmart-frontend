import React, { useState, useEffect } from 'react';
import '../styles/ClientHistory.css';
import { useTranslation } from '../i18n.jsx';

const ClientHistory = ({ onDetailViewChange }) => {
    const { t } = useTranslation();
    // États
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [ratingsMap, setRatingsMap] = useState({}); // Pour stocker les notes calculées
    const [selectedBooking, setSelectedBooking] = useState(null); // Si null = Liste, sinon = Détail

    useEffect(() => {
        if (onDetailViewChange) {
            onDetailViewChange(!!selectedBooking);
        }
    }, [selectedBooking, onDetailViewChange]);

    // Récupérer l'ID user
    const storedUser = JSON.parse(sessionStorage.getItem('user')) || {};
    const userId = storedUser.id || storedUser.id_user || 1;

   // --- 1. CHARGEMENT DES DONNÉES ---
    useEffect(() => {
        const token = sessionStorage.getItem('token');
        console.log("Token envoyé :", token); // Vérifions si le token existe !

        fetch(`${import.meta.env.VITE_API_URL}/api/reservations/history/${userId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        })
            .then(async res => {
                // Si le backend dit "Non", on lit son message secret
                if (!res.ok) {
                    const erreurBackend = await res.text(); // On récupère le texte exact de l'erreur
                    console.error("LE BACKEND A DIT :", erreurBackend);
                    throw new Error("Erreur 403 : " + erreurBackend);
                }
                return res.json();
            })
            // ... la suite de ton code (.then(data => ...)
            .then(data => {
                const historyData = data || [];
                
                // --- TRI PAR DATE DE RÉSERVATION (La plus récente en premier) ---
                historyData.sort((a, b) => {
                    // On essaie plusieurs champs possibles pour la date
                    const dateAStr = a.date_arrivee || a.date_debut || a.created_at || a.date_reservation;
                    const dateBStr = b.date_arrivee || b.date_debut || b.created_at || b.date_reservation;
                    
                    const dateA = dateAStr ? new Date(dateAStr) : new Date(0);
                    const dateB = dateBStr ? new Date(dateBStr) : new Date(0);
                    
                    return dateB - dateA; // Décroissant (plus récent en haut)
                });

                console.log("Données reçues de l'API :", historyData);
                setHistory(historyData); 
                setLoading(false);

                // --- FETCH RATINGS FOR EACH UNIQUE PARKING ---
                // On récupère les IDs uniques des parkings
                const uniqueParkingIds = [...new Set(historyData.map(item => item.id_park))];
                
                // On fetch les avis pour chaque parking
                uniqueParkingIds.forEach(id => {
                    fetch(`${import.meta.env.VITE_API_URL}/api/parkings/${id}/reviews`)
                        .then(res => res.json())
                        .then(reviews => {
                            if (Array.isArray(reviews) && reviews.length > 0) {
                                // Calcul de la moyenne
                                const sum = reviews.reduce((acc, r) => acc + r.note, 0);
                                const avg = sum / reviews.length;
                                setRatingsMap(prev => ({
                                    ...prev,
                                    [id]: avg
                                }));
                            }
                        })
                        .catch(err => console.error("Erreur fetch review park " + id, err));
                });
            })
            .catch(err => {
                console.error("Erreur:", err);
                setHistory([]); 
                setLoading(false);
            });
    }, [userId]);

    // --- HELPER : LABEL DE DATE (Aujourd'hui, Hier, etc.) ---
    const getDateLabel = (dateStr) => {
        if (!dateStr) return 'Date inconnue';
        const date = new Date(dateStr);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        const diffDays = Math.round((today - d) / (1000 * 60 * 60 * 24));
        if (diffDays === 0) return "Aujourd'hui";
        if (diffDays === 1) return 'Hier';
        if (diffDays <= 6) return `Il y a ${diffDays} jours`;
        return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
    };

    // --- HELPER : GROUPER L'HISTORIQUE PAR DATE ---
    const groupByDate = (items) => {
        const groups = {};
        items.forEach(item => {
            const label = getDateLabel(item.date_arrivee || item.date_debut || item.created_at || item.date_reservation);
            if (!groups[label]) groups[label] = [];
            groups[label].push(item);
        });
        return groups;
    };

    // Calcul de la durée
    const calculateDuration = (start, end) => {
        if (!end) return "En cours";
        const diff = new Date(end) - new Date(start);
        const hours = Math.floor(diff / (1000 * 60 * 60));
        return `${hours} ${t('history_hours')}`;
    };

    const displayRating = (note) => {
        // Enforce a number or fallback to 4.8 as requested ("exmp 4.8")
        const val = note ? Number(note) : 0; 
        return `⭐ ${val.toFixed(1)}`;
    };

    // --- 2. VUE : DÉTAIL & AVIS (Sous-composant interne) ---
    if (selectedBooking) {
        return (
            <ParkingDetailView 
                booking={selectedBooking} 
                duration={calculateDuration(selectedBooking.date_arrivee, selectedBooking.date_depart)}
                onBack={() => setSelectedBooking(null)} 
                displayRating={displayRating}
                // Passer la note calculée si dispo
                ratingCalculated={ratingsMap[selectedBooking.id_park]}
            />
        );
    }

    // --- 3. VUE : LISTE HISTORIQUE ---
    return (
        <div className="history-container">
            <h2 className="page-title">{t('history_title')}</h2>
            
            {loading ? <p>Chargement...</p> : (
                <div className="history-list">
                    {history && history.length > 0 ? (
                        Object.entries(groupByDate(history)).map(([dateLabel, items]) => (
                        <div key={dateLabel}>
                            {/* --- EN-TÊTE DE GROUPE DATE --- */}
                            <div style={{
                                padding: '8px 4px 4px 4px',
                                marginBottom: '8px',
                                marginTop: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px'
                            }}>
                                <span style={{
                                    fontWeight: '700',
                                    fontSize: '0.9rem',
                                    color: '#5d7564',
                                    whiteSpace: 'nowrap'
                                }}>{dateLabel}</span>
                                <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }}></div>
                            </div>

                            {/* --- CARTES DU GROUPE --- */}
                            {items.map((item) => (
                        <div key={item.id_resa} className="history-card">
                            <div 
                                className="card-img-wrapper" 
                                style={{ 
                                    width: '72px', height: '72px', flexShrink: 0, 
                                    backgroundColor: '#f0f0f0', borderRadius: '8px',
                                    overflow: 'hidden', display: 'flex', 
                                    alignItems: 'center', justifyContent: 'center',
                                    border: '1px solid #ddd'
                                }}
                            >
                                {item.image ? (
                                    <img 
                                        src={
                                            item.image.startsWith('http') 
                                            ? item.image 
                                            : `${import.meta.env.VITE_API_URL}/${item.image.replace(/\\/g, '/').replace(/^\//, '')}`
                                        } 
                                        alt={item.nom} 
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.parentElement.querySelector('.fallback-text').style.display = 'block';
                                        }}
                                    />
                                ) : null}

                                <span className="fallback-text" style={{ 
                                    display: item.image ? 'none' : 'block', 
                                    fontSize: '28px', fontWeight: 'bold', color: '#aaa' 
                                }}>P</span>
                            </div>

                            {/* Infos */}
                            <div className="card-info">
                                <h3>{item.nom}</h3>
                                <p className="address">{item.adresse}</p>
                                <div className="card-price-row">
                                    <span className="price">{item.tarif_heure} DH{t('history_hour')}</span>
                                    {/* Note Dynamique dans la liste */}
                                    <span className="rating">
                                        {/* Affiche note calculée si dispo, sinon 0 */}
                                        {displayRating(ratingsMap[item.id_park] !== undefined ? ratingsMap[item.id_park] : item.note)}
                                    </span>
                                </div>
                            </div>

                            {/* Droite : Durée + Bouton */}
                            <div className="card-actions">
                                <span className="duration-text">
                                    {calculateDuration(item.date_arrivee, item.date_depart)}
                                </span>
                                <button 
                                    className="btn-detail"
                                    onClick={() => setSelectedBooking(item)}
                                >
                                    {t('history_detail')}
                                </button>
                            </div>
                        </div>
                        ))}
                        </div>
                        ))
                    ) : (
                        <p style={{ textAlign: 'center', marginTop: '20px' }}>Aucun historique trouvé.</p>
                    )}
                        
                    
                </div>
                
            )}
        </div>
    );
};

// --- COMPOSANT DÉTAIL & MODAL ---
const ParkingDetailView = ({ booking, duration, onBack, displayRating, ratingCalculated }) => {
    const { t } = useTranslation();
    const [view, setView] = useState('detail'); // 'detail', 'reviews'
    const [showWriteModal, setShowWriteModal] = useState(false);
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");
    const [reviewsList, setReviewsList] = useState([]);
    const [stats, setStats] = useState({ average: 0, total: 0, breakdown: [0,0,0,0,0] });

    // Charger les avis quand on va sur la page 'reviews'
    useEffect(() => {
        if (view === 'reviews') {
            fetchReviews();
        }
    }, [view]);

    const fetchReviews = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/parkings/${booking.id_park}/reviews`);
            const data = await res.json();
            if (Array.isArray(data)) {
                setReviewsList(data);
                // Calculer les stats
                const total = data.length;
                if (total > 0) {
                    const sum = data.reduce((acc, r) => acc + r.note, 0);
                    const avg = (sum / total).toFixed(1);
                    const breakdown = [0,0,0,0,0];
                    data.forEach(r => {
                        const star = Math.round(r.note);
                        if (star >= 1 && star <= 5) breakdown[5 - star]++;
                    });
                    setStats({ average: avg, total: total, breakdown: breakdown });
                }
            }
        } catch (error) {
            console.error("Erreur chargement avis:", error);
        }
    };

    const submitReview = async () => {
        if (rating === 0) {
            alert("Veuillez sélectionner des étoiles (1 à 5) avant d'envoyer !");
            return;
        }

        const storedUser = JSON.parse(sessionStorage.getItem('user')) || {};
        const userId = storedUser.id || storedUser.id_user || 1;

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/reviews`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json', 
                    'Authorization': `Bearer ${sessionStorage.getItem('token')}` 
                },
                body: JSON.stringify({
                    id_park: booking.id_park,
                    id_user: userId,
                    note: rating,
                    commentaire: comment
                })
            });
            
            if(res.ok) {
                alert("Avis envoyé avec succès !");
                setComment("");
                setRating(0);
                setShowWriteModal(false); // Ferme la modale
                fetchReviews(); // Recharger les avis
            } else {
                const errData = await res.json();
                alert("Erreur serveur : " + (errData.message || "Erreur inconnue"));
            }
        } catch(e) { 
            console.error(e);
            alert("Erreur de connexion");
        }
    };

    // --- VUE : LISTE DES AVIS (IMAGE 1) ---
    if (view === 'reviews') {
        return (
            <div className={`detail-container ${showWriteModal ? 'blur-content' : ''}`}>
                <div className="detail-header">
                    <button onClick={() => setView('detail')} className="back-arrow">←</button>
                    <h3>{t('history_review')}</h3>
                    <div style={{width: 24}}></div>
                </div>

                <div className="reviews-summary">
                    <div className="rating-big">
                        <span className="rating-number">{stats.average}</span>
                        <div className="stars-row">
                            {[1,2,3,4,5].map(s => <span key={s} style={{color: s <= Math.round(stats.average) ? '#fbbf24' : '#e2e8f0'}}>★</span>)}
                        </div>
                        <span className="review-count">{t('history_based_on').replace('{count}', stats.total)}</span>
                    </div>

                    <div className="rating-bars">
                        {[5, 4, 3, 2, 1].map((star, index) => {
                            const count = stats.breakdown[5 - star];
                            const percent = stats.total > 0 ? (count / stats.total) * 100 : 0;
                            return (
                                <div key={star} className="rating-bar-row">
                                    <span className="star-label">{star}</span>
                                    <div className="bar-bg">
                                        <div className="bar-fill" style={{width: `${percent}%`}}></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="reviews-list-scroll">
                    {reviewsList.map((rev, idx) => (
                        <div key={idx} className="review-item-full">
                            <div className="review-user-header">
                                <b>{rev.user_name || "Utilisateur"}</b>
                                <span className="review-date">{new Date(rev.date_avis).toLocaleDateString()}</span>
                            </div>
                            <div className="review-stars-small">
                                {[1,2,3,4,5].map(s => <span key={s} style={{color: s <= rev.note ? '#fbbf24' : '#e2e8f0'}}>★</span>)}
                            </div>
                            <p className="review-text-content">{rev.message}</p>
                        </div>
                    ))}
                    <div style={{height: 100}}></div>
                </div>

                <div className="bottom-fixed-action">
                    <button className="btn-success-full" onClick={() => setShowWriteModal(true)}>
                        {t('history_write_review')}
                    </button>
                </div>

                {/* MODAL WRITE REVIEW (Slide Up) */}
                {showWriteModal && (
                    <div className="write-review-overlay" onClick={() => setShowWriteModal(false)}>
                        <div className="write-review-sheet" onClick={(e) => e.stopPropagation()}>
                            <div className="sheet-handle"></div>
                            
                            <h2 className="title-center">{t('history_give_review')}</h2>
                            
                            <div className="star-input-large">
                                {[1,2,3,4,5].map(star => (
                                    <span key={star} 
                                            className={star <= rating ? "star-large full" : "star-large"}
                                            onClick={() => setRating(star)}>★</span>
                                ))}
                            </div>

                            <div className="form-box">
                                <label>{t('history_detail_review')}</label>
                                <textarea 
                                    placeholder={t('history_review_placeholder')}
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                ></textarea>
                            </div>

                            <button className="btn-success-full no-radius" onClick={submitReview}>
                                {t('history_submit')}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // --- VUE DEFAULT : DETAIL BOOKING ---
    return (
        <div className="detail-container">
            {/* Header */}
            <div className="detail-header">
                <button onClick={onBack} className="back-arrow">←</button>
                <h3>{t('history_detail')}</h3>
                <div style={{width: 24}}></div>
            </div>

            <h2 className="section-title">{t('history_parking_detail')}</h2>

            {/* Carte Info */}
            <div className="detail-card">
                <div className="detail-card-top">
                    {/* ... (Image Code) ... */}
                    <div style={{ 
                        width: '80px', height: '80px', borderRadius: '10px', 
                        overflow: 'hidden', marginRight: '15px',
                        backgroundColor: '#f0f0f0', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', flexShrink: 0
                    }}>
                        {booking.image ? (
                            <img 
                                src={
                                    booking.image.startsWith('http') 
                                    ? booking.image 
                                    : `${import.meta.env.VITE_API_URL}/${booking.image.replace(/\\/g, '/').replace(/^\//, '')}`
                                } 
                                alt="Parking" 
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.parentElement.querySelector('.fallback-p').style.display = 'block';
                                }}
                            />
                        ) : null}
                        
                        <span className="fallback-p" style={{ 
                            display: booking.image ? 'none' : 'block', 
                            fontWeight: 'bold', color: '#999', fontSize: '24px'
                        }}>P</span>
                    </div>

                    <div className="detail-text">
                        <h4>{booking.nom}</h4>
                        <p>{booking.adresse}</p>
                    </div>
                    {/* Note Dynamique dans le détail */}
                    <span className="detail-rating">
                        {ratingCalculated ? displayRating(ratingCalculated) : displayRating(booking.note)}
                    </span>
                </div>
                
                <div className="detail-stats">
                    <div className="stat-row">
                        <span>{t('history_time')}</span>
                        <b>{duration}</b>
                    </div>
                    <div className="stat-row">
                        <span>{t('history_total')}</span>
                        <b className="green-total">{booking.prix_total} DH</b>
                    </div>
                </div>
            </div>

            <h3 className="section-title">{t('history_payment_methods')}</h3>
            <div className="payment-box">
                <div className="google-logo">G</div>
                <span>Google Pay</span>
            </div>

            {/* Bouton Review qui mène à la page des avis */}
            <div className="bottom-action" style={{marginTop: 30}}>
                <div className="review-link-card" onClick={() => setView('reviews')}>
                    <span style={{fontWeight:'bold'}}>{t('history_review')}</span>
                    <span style={{color:'#6F9C76', cursor:'pointer'}}>{t('history_see_all')} <i className="fa-solid fa-chevron-right"></i></span>
                </div>
            </div>
        </div>
    );
};

export default ClientHistory;
