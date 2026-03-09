 import React, { useState, useEffect, useRef } from 'react';
import '../styles/ManagerNotifications.css';

const ManagerNotifications = ({ isOpen, onClose, notifications = [], onMarkAllRead, onNotificationClick }) => {
    const panelRef = useRef(null);

    // Fermer si on clique en dehors
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (panelRef.current && !panelRef.current.contains(event.target)) {
                 onClose();
            }
        };

        if (isOpen) {
            setTimeout(() => document.addEventListener("click", handleClickOutside), 0);
        }
        return () => {
            document.removeEventListener("click", handleClickOutside);
        };
    }, [isOpen, onClose]);

    const formatTimeAgo = (date) => {
        if(!date) return "";
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " an(s)";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " mois";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " j";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " h";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " min";
        return "À l'instant";
    };

    if (!isOpen) return null;

    return (
        <div className="notifications-panel" ref={panelRef} onClick={(e) => e.stopPropagation()}>
            <div className="notifications-header">
                <h3>Notifications</h3>
                <button className="mark-read-btn" onClick={onMarkAllRead}>Tout marquer comme lu</button>
            </div>

            <div className="notifications-list">
                {notifications.length === 0 ? (
                    <div className="no-notifications">
                        <i className="fa-regular fa-bell-slash" style={{fontSize:'2rem', marginBottom:'10px'}}></i>
                        <p>Aucune nouvelle notification.</p>
                    </div>
                ) : (
                    notifications.map((notif) => (
                        <div 
                            key={notif.id} 
                            className={`notification-item ${notif.read ? '' : 'unread'}`}
                            onClick={() => onNotificationClick(notif.id)}
                        >
                            <div className="notif-main-content">
                                <div className={`notif-icon ${notif.type}`}>
                                    {notif.type === 'reservation' && <i className="fa-solid fa-calendar-check"></i>}
                                    {notif.type === 'payment' && <i className="fa-solid fa-money-bill-wave"></i>}
                                    {notif.type === 'alert' && <i className="fa-solid fa-triangle-exclamation"></i>}
                                    {notif.type === 'info' && <i className="fa-solid fa-circle-info"></i>}
                                </div>
                                <div className="notif-content">
                                    <span className="notif-title">{notif.title}</span>
                                    <p className="notif-message">{notif.message}</p>
                                    <span className="notif-time">{formatTimeAgo(notif.date)}</span>
                                </div>
                            </div>

                            {/* DÉTAILS ADDITIONNELS (Si lu/cliqué) */}
                            {notif.expanded && notif.details && (
                                <div className="notification-details">
                                    {notif.type === 'reservation' && (
                                        <>
                                            <div className="detail-row"><strong>Client :</strong> <span>{notif.details.nom || "Inconnu"}</span></div>
                                            <div className="detail-row"><strong>Place :</strong> <span>N° {notif.details.place}</span></div>
                                            <div className="detail-row"><strong>Horaire :</strong> <span>
                                                {new Date(notif.details.debut).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} - 
                                                {new Date(notif.details.fin).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                            </span></div>
                                            <div style={{marginTop:'5px', color:'#3b82f6', fontSize:'0.75rem', fontWeight:'600'}}>
                                                <i className="fa-solid fa-check"></i> Confirmé
                                            </div>
                                        </>
                                    )}
                                    {notif.type === 'payment' && (
                                         <div className="detail-row"><strong>Montant :</strong> <span style={{color:'green', fontWeight:'bold'}}>+{notif.details.montant} DH</span></div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
            
            <div className="notifications-footer">
                <button className="view-all-btn" onClick={() => alert("Historique complet à venir !")}>Voir tout l'historique</button>
            </div>
        </div>
    );
};

export default ManagerNotifications;
