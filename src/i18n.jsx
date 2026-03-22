import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import ReactCountryFlag from "react-country-flag";
const translations = {
  fr: {
    // --- Navbar ---
    nav_home: "Accueil",
    nav_testimonials: "Témoignages",
    nav_about: "À Propos",
    nav_questions: "Questions",
    nav_solutions: "Solutions",
    nav_signin: "Connexion",
    nav_signup: "Inscription",
    nav_notifications: "Notifications",
    nav_bottom_home: "Accueil",
    nav_bottom_history: "Historique",
    nav_bottom_profile: "Profil",

    // --- Hero ---
    hero_title1: "Transformez le stationnement",
    hero_title2: "avec Park",
    hero_title3: "Smart",
    hero_desc: "ParkSmart est un système en temps réel pour trouver et réserver des places de parking. Il offre une interface simple avec la disponibilité en direct et un processus de réservation rapide. Les gestionnaires peuvent suivre et optimiser les espaces de stationnement efficacement.",
    hero_cta: "Nous Contacter",

    // --- About Us ---
    about_subtitle: "Qui Sommes-Nous",
    about_title: "À Propos de ",
    about_p1: "ParkSmart est une plateforme intelligente qui aide les conducteurs à trouver et réserver rapidement des places de parking en temps réel. Sa carte interactive et ses notifications instantanées rendent le stationnement plus rapide et moins stressant. L'interface conviviale garantit une expérience fluide pour chaque conducteur.",
    about_p2: "Pour les gestionnaires de parking, ParkSmart fournit des outils pour surveiller l'occupation et gérer les réservations efficacement. Il aide à optimiser l'utilisation de l'espace et à améliorer la coordination globale. Notre mission est de rendre le stationnement simple, pratique et fiable pour tous.",
    about_video_fallback: "Votre navigateur ne supporte pas la balise vidéo.",

    // --- Solutions ---
    solutions_title: "Solutions ParkSmart : ",
    solutions_subtitle: " Alliant Matériel & Logiciel",
    solutions_desc: "Une plateforme phygitale unifiée connectant conducteurs et gestionnaires pour une expérience de stationnement fluide et sans friction.",
    sol_visual: "Sélection Visuelle",
    sol_visual_desc: "Choisissez votre place exacte (ex : A-12) sur une carte interactive.",
    sol_cloud: "Synchronisation Cloud",
    sol_cloud_desc: "Mises à jour en temps réel de la disponibilité des places dans la base de données.",
    sol_mobile: "Application Mobile",
    sol_mobile_desc: "Navigation GPS, filtrage intelligent et billetterie QR sécurisée.",
    sol_dashboard: "Tableau de Bord Gestionnaire",
    sol_dashboard_desc: "Outils d'administration pour gérer les parkings et suivre les revenus.",

    // --- Testimonials ---
    testimonials_title: "Témoignages Clients : ",
    testimonials_subtitle: "L'Impact ParkSmart",
    testimonial_1: "ParkSmart a complètement changé ma façon de me garer. Je ne perds plus de temps à chercher une place — en quelques secondes, j'en trouve une disponible à proximité !",
    testimonial_2: "L'interface est super intuitive et les notifications en temps réel sont un vrai plus. Je recommande ParkSmart à tous les conducteurs en ville.",
    testimonial_3: "En tant que gestionnaire de parking, ParkSmart m'a permis de mieux organiser mes places et de suivre les réservations facilement. Un outil indispensable !",
    testimonial_4: "Le paiement sécurisé et le système de QR code rendent tout le processus rapide et sans stress. Bravo à l'équipe ParkSmart !",
    testimonial_name_1: "Yassine El Amrani",
    testimonial_name_2: "Salma Bennani",
    testimonial_name_3: "Karim Tazi",
    testimonial_name_4: "Fatima Zahra Idrissi",

    // --- Questions / FAQ ---
    faq_title: "Stationner Intelligemment",
    faq_subtitle: "Questions Fréquentes",
    faq_q1: "Qu'est-ce que ParkSmart ?",
    faq_a1: "ParkSmart est un système avancé de gestion de parking qui combine matériel et logiciel pour offrir une expérience de stationnement fluide et efficace aux utilisateurs et gestionnaires.",
    faq_q2: "Comment trouver une place de parking ?",
    faq_a2: "Notre application mobile vous permet de voir la disponibilité en temps réel sur une carte. Vous pouvez filtrer par emplacement, prix et équipements, puis réserver votre place instantanément.",
    faq_q3: "Le paiement est-il sécurisé ?",
    faq_a3: "Oui, tous les paiements sont traités via des canaux sécurisés et chiffrés. Nous travaillons avec des fournisseurs de paiement de premier plan pour protéger vos données financières.",
    faq_q4: "Puis-je gérer mon propre parking avec ParkSmart ?",
    faq_a4: "Absolument ! ParkSmart fournit une plateforme dédiée aux gestionnaires de parking pour lister leurs places, suivre l'utilisation et optimiser les opérations.",
    faq_q5: "Que faire si j'ai besoin d'aide ?",
    faq_a5: "Notre équipe de support est disponible 24h/24 et 7j/7 via l'application ou notre site web. Nous sommes là pour vous aider avec toute question ou problème.",
    faq_still_question: "Vous avez encore une question ?",
    faq_still_desc: "Vous ne trouvez pas la réponse à votre question ? Envoyez-nous un email et nous vous répondrons dès que possible !",
    faq_send_email: "Envoyer un Email",

    // --- Footer ---
    footer_quick_links: "Liens Rapides",
    footer_home: "Accueil",
    footer_about: "À Propos",
    footer_contact: "Contact",
    footer_privacy: "Politique de Confidentialité",
    footer_message_title: "Vous avez un message ? Contactez-nous !",
    footer_email_placeholder: "Votre email ici...",
    footer_message_placeholder: "Votre message ici...",
    footer_send: "Envoyer",
    footer_rights: "Tous droits réservés.",

    // --- Connexion ---
    login_welcome: "Bienvenue",
    login_subtitle: "Veuillez entrer vos identifiants pour vous connecter.",
    login_email_placeholder: "Email",
    login_password_placeholder: "Mot de passe",
    login_submit: "Se Connecter",
    login_or: "OU",
    login_google: "Se connecter avec Google",
    login_new: "Nouveau sur ParkSmart ?",
    login_create: "Créer un compte",

    // --- Inscription ---
    signup_title: "Créer un Compte",
    signup_subtitle: "Rejoignez ParkSmart en quelques étapes.",
    signup_prenom_placeholder: "Prénom",
    signup_nom_placeholder: "Nom",
    signup_email_placeholder: "Adresse Email",
    signup_password_placeholder: "Mot de passe",
    signup_role_driver: "Je suis Conducteur",
    signup_role_manager: "Je suis Gestionnaire",
    signup_submit: "S'inscrire",
    signup_or: "OU",
    signup_google: "S'inscrire avec Google",
    signup_already: "Vous avez déjà un compte ?",
    signup_signin: "Se connecter",

    // --- ParkingTimer ---
    timer_title: "Chronomètre Parking",
    timer_pay_now: "PAYER MAINTENANT",
    timer_methods_title: "Méthodes de Paiement",
    timer_choose_method: "Choisir une Méthode de Paiement",
    timer_continue: "CONTINUER",
    timer_payment_detail: "Détail du Paiement",
    timer_payment_review: "Récapitulatif du Paiement",
    timer_order_detail: "Détail de la Commande",
    timer_parking_area: "Zone de Parking",
    timer_duration: "Durée",
    timer_date: "Date",
    timer_total: "Total",
    timer_processing: "TRAITEMENT...",
    timer_confirm: "CONFIRMER LE PAIEMENT",
    timer_3d_secure: "Vérification 3D Secure",
    timer_method_paypal: "PayPal",
    timer_method_google: "Google Pay",
    timer_method_apple: "Apple Pay",
    notif_title: "Notifications",
    drivers_plural: "Conducteurs",
    parkings_plural: "Parkings",

    // --- ClientHistory ---
    history_title: "Mon Historique de Parking",
    history_hours: "Heures",
    history_hour: "/Heure",
    history_detail: "Détail",
    history_review: "Avis",
    history_based_on: "Basé sur {count} Avis",
    history_write_review: "ÉCRIRE UN AVIS",
    history_give_review: "Donner un Avis",
    history_detail_review: "Avis Détaillé",
    history_review_placeholder: "Le parking est très bien...",
    history_submit: "ENVOYER",
    history_parking_detail: "Détail du Parking",
    history_time: "Durée",
    history_total: "Total",
    history_payment_methods: "Méthodes de Paiement",
    history_see_all: "Voir Tout",

    // --- ClientHome ---
    home_review: "Avis",
    home_reviews: "Avis",
    home_place_available: "Place Disponible",
    home_continue: "Continuer",
    home_search_placeholder: "Rechercher un parking...",
    grid_choose_spot: "Choisir une place",
    grid_parking_plan: "Plan du Parking",
    grid_scroll_hint: "Glissez pour voir plus",
    grid_book_button: "Réserver",
    grid_book_button_spot: "Réserver (Place #{spot})",
    alert_spot_reserved: "Place réservée ! Le chronomètre démarre.",
    alert_booking_error: "Erreur lors de la réservation.",
    logout_confirm_title: "Voulez-vous vraiment vous déconnecter ?",
    logout_confirm_button: "Se déconnecter",
    alert_geolocation_unsupported: "⚠️ Votre navigateur ne supporte pas la géolocalisation.",
    alert_geolocation_permission: "📍 Pour voir votre position exacte, veuillez autoriser la localisation :\n\n1. Ouvrez les Paramètres de votre téléphone\n2. Activez la Localisation/GPS\n3. Dans votre navigateur, autorisez ce site à accéder à votre position\n4. Rechargez la page",
    alert_gps_unavailable: "📍 GPS indisponible. Activez le GPS dans les paramètres de votre téléphone puis rechargez la page.",
    alert_gps_timeout: "📍 Le GPS met trop de temps à répondre. Vérifiez que votre GPS est activé et rechargez la page.",
    confirm_stop_reservation: "Voulez-vous vraiment terminer et payer ?",
    alert_payment_validated: "✅ Paiement validé !\nMontant : {amount} DH",
    alert_payment_error: "❌ Erreur lors du paiement.",
    cancel: "Annuler",

    // --- Profile Page ---
    profile_title: "Mon Profil",
    profile_title_details: "Modifier le profil",
    profile_title_payment: "Paiement",
    profile_title_security: "Sécurité",
    profile_title_legal: "Mentions Légales",
    profile_title_help: "Aide & Support",
    profile_title_about: "À Propos de nous",
    profile_title_profile: "Mon Profil Détaillé",
    profile_view: "Voir",
    profile_section_personal: "Personnel",
    profile_section_security: "Sécurité",
    profile_section_about: "À propos",
    profile_logout: "Se déconnecter",
    profile_edit_change_photo: "Changer la photo",
    profile_edit_firstname: "Prénom",
    profile_edit_lastname: "Nom",
    profile_edit_email: "E-Mail",
    profile_edit_save: "Enregistrer les modifications",
    alert_profile_updated: "Profil mis à jour avec succès !",
    alert_profile_update_error: "Erreur lors de la mise à jour du profil.",
    profile_sec_current_pass: "Mot de passe actuel",
    profile_sec_new_pass: "Nouveau mot de passe",
    profile_sec_confirm_pass: "Confirmer",
    profile_sec_update_pass: "Mettre à jour le mot de passe",
    alert_pass_mismatch: "Les mots de passe ne correspondent pas !",
    alert_pass_updated: "Mot de passe modifié avec succès !",
    alert_pass_update_error: "Erreur lors de la modification du mot de passe.",
    alert_network_error: "Erreur réseau ou serveur.",
    profile_detail_member_since: "Membre depuis",
    profile_detail_my_activity: "Mon Activité",
    profile_detail_reservations: "Réservations",
    profile_detail_total_time: "Temps Total",
    loading: "Chargement...",
    error_generic: "Une erreur est survenue.",

    // --- Language ---
    lang_switch: "EN",
    profile_language: "Langue",
  },
  en: {
    // --- Navbar ---
    nav_home: "Home",
    nav_testimonials: "Testimonials",
    nav_about: "About Us",
    nav_questions: "Questions",
    nav_solutions: "Solutions",
    nav_signin: "Sign In",
    nav_signup: "Sign Up",
    nav_notifications: "Notifications",
    nav_bottom_home: "Home",
    nav_bottom_history: "History",
    nav_bottom_profile: "Profile",

    // --- Hero ---
    hero_title1: "Transforming parking",
    hero_title2: "with Park",
    hero_title3: "Smart",
    hero_desc: "ParkSmart is a real-time system for finding and reserving parking spots. It offers an easy interface with live availability and a quick booking process. Managers can track and optimize parking spaces efficiently.",
    hero_cta: "Get in Touch",

    // --- About Us ---
    about_subtitle: "Who We Are",
    about_title: "About ",
    about_p1: "ParkSmart is a smart platform that helps drivers quickly find and reserve parking spots in real time. Its interactive map and instant notifications make parking faster and less stressful. The user-friendly interface ensures a smooth experience for every driver.",
    about_p2: "For parking managers, ParkSmart provides tools to monitor occupancy and manage reservations efficiently. It helps optimize space usage and improve overall coordination. Our mission is to make parking simple, convenient, and reliable for everyone.",
    about_video_fallback: "Your browser does not support the video tag.",

    // --- Solutions ---
    solutions_title: "ParkSmart Solutions: ",
    solutions_subtitle: " Uniting Hardware & Software",
    solutions_desc: "A unified phygital platform connecting drivers and managers for a seamless, frictionless parking experience.",
    sol_visual: "Visual Selection",
    sol_visual_desc: "Choose your exact spot (e.g., A-12) on an interactive map.",
    sol_cloud: "Cloud Sync",
    sol_cloud_desc: "Real-time updates of spot availability across the database.",
    sol_mobile: "Mobile App",
    sol_mobile_desc: "GPS navigation, smart filtering, and secure QR ticketing.",
    sol_dashboard: "Manager Dashboard",
    sol_dashboard_desc: "Admin tools to manage parking lots and track revenue.",

    // --- Testimonials ---
    testimonials_title: "Client Testimonials: ",
    testimonials_subtitle: "ParkSmart Impacts",
    testimonial_1: "ParkSmart completely changed how I park. I no longer waste time looking for a spot — in seconds, I find one available nearby!",
    testimonial_2: "The interface is super intuitive and the real-time notifications are a real plus. I recommend ParkSmart to all city drivers.",
    testimonial_3: "As a parking manager, ParkSmart has helped me better organize my spots and easily track reservations. An essential tool!",
    testimonial_4: "The secure payment and QR code system make the whole process fast and stress-free. Kudos to the ParkSmart team!",
    testimonial_name_1: "Yassine El Amrani",
    testimonial_name_2: "Salma Bennani",
    testimonial_name_3: "Karim Tazi",
    testimonial_name_4: "Fatima Zahra Idrissi",

    // --- Questions / FAQ ---
    faq_title: "Ready to Park Smart",
    faq_subtitle: "Frequently Asked Questions",
    faq_q1: "What is ParkSmart?",
    faq_a1: "ParkSmart is an advanced parking management system that combines hardware and software to provide a seamless and efficient parking experience for users and managers alike.",
    faq_q2: "How do I find a parking spot?",
    faq_a2: "Our mobile app allows you to view real-time parking availability on a map. You can filter by location, price, and amenities, then book your preferred spot instantly.",
    faq_q3: "Is payment processed securely?",
    faq_a3: "Yes, all payments are processed through secure, encrypted channels. We partner with leading payment providers to ensure your financial data is protected.",
    faq_q4: "Can I manage my own parking facility with ParkSmart?",
    faq_a4: "Absolutely! ParkSmart provides a dedicated platform for parking facility managers to list their spots, track usage, and streamline operations.",
    faq_q5: "What if I need help while parking?",
    faq_a5: "Our support team is available 24/7 through the app or our website. We're here to assist you with any issues or questions you may have.",
    faq_still_question: "Still have a question?",
    faq_still_desc: "Can't find the answer to your question? Send us an email and we'll get back to you as soon as possible!",
    faq_send_email: "Send Email",

    // --- Footer ---
    footer_quick_links: "Quick Links",
    footer_home: "Home",
    footer_about: "About Us",
    footer_contact: "Contact",
    footer_privacy: "Privacy Policy",
    footer_message_title: "Have a message? Get in touch!",
    footer_email_placeholder: "Your email here...",
    footer_message_placeholder: "Your message here...",
    footer_send: "Send",
    footer_rights: "All rights reserved.",

    // --- Connexion ---
    login_welcome: "Welcome Back",
    login_subtitle: "Please enter your details to sign in.",
    login_email_placeholder: "Email",
    login_password_placeholder: "Password",
    login_submit: "Sign In",
    login_or: "OR",
    login_google: "Sign in with Google",
    login_new: "New to ParkSmart?",
    login_create: "Create account",

    // --- Inscription ---
    signup_title: "Create Account",
    signup_subtitle: "Join ParkSmart in just a few steps.",
    signup_prenom_placeholder: "First Name",
    signup_nom_placeholder: "Last Name",
    signup_email_placeholder: "Email Address",
    signup_password_placeholder: "Password",
    signup_role_driver: "I am a Driver",
    signup_role_manager: "I am a Manager",
    signup_submit: "Sign Up",
    signup_or: "OR",
    signup_google: "Sign Up with Google",
    signup_already: "Already have an account?",
    signup_signin: "Sign in",

    // --- ParkingTimer ---
    timer_title: "Parking Timer",
    timer_pay_now: "PAY NOW",
    timer_methods_title: "Payment Methods",
    timer_choose_method: "Choose Payment Method",
    timer_continue: "CONTINUE",
    timer_payment_detail: "Payment Detail",
    timer_payment_review: "Payment Review",
    timer_order_detail: "Order Detail",
    timer_parking_area: "Parking Area",
    timer_duration: "Duration",
    timer_date: "Date",
    timer_total: "Total",
    timer_processing: "PROCESSING...",
    timer_confirm: "CONFIRM PAYMENT",
    timer_3d_secure: "3D Secure Verification",
    timer_method_paypal: "PayPal",
    timer_method_google: "Google Pay",
    timer_method_apple: "Apple Pay",
    notif_title: "Notifications",
    drivers_plural: "Drivers",
    parkings_plural: "Parkings",

    // --- ClientHistory ---
    history_title: "My Parking History",
    history_hours: "Hours",
    history_hour: "/Hour",
    history_detail: "Detail",
    history_review: "Review",
    history_based_on: "Based On {count} Review",
    history_write_review: "WRITE A REVIEW",
    history_give_review: "Give A Review",
    history_detail_review: "Detail Review",
    history_review_placeholder: "The Parking Is Very Good...",
    history_submit: "SUBMIT",
    history_parking_detail: "Parking Detail",
    history_time: "Time",
    history_total: "Total",
    history_payment_methods: "Payment Methods",
    history_see_all: "See All",

    // --- ClientHome ---
    home_review: "Review",
    home_reviews: "Reviews",
    home_place_available: "Place Available",
    home_continue: "Continue",
    home_search_placeholder: "Search for a parking...",
    grid_choose_spot: "Choose a Spot",
    grid_parking_plan: "Parking Layout",
    grid_scroll_hint: "Swipe to see more",
    grid_book_button: "Book",
    grid_book_button_spot: "Book (Spot #{spot})",
    alert_spot_reserved: "Spot reserved! The timer is starting.",
    alert_booking_error: "Error during reservation.",
    logout_confirm_title: "Do you really want to log out?",
    logout_confirm_button: "Log Out",
    alert_geolocation_unsupported: "⚠️ Your browser does not support geolocation.",
    alert_geolocation_permission: "📍 To see your exact position, please allow location access:\n\n1. Open your phone's Settings\n2. Enable Location/GPS\n3. In your browser, allow this site to access your location\n4. Reload the page",
    alert_gps_unavailable: "📍 GPS unavailable. Please enable GPS in your phone settings and reload the page.",
    alert_gps_timeout: "📍 GPS is taking too long to respond. Check that your GPS is enabled and reload the page.",
    confirm_stop_reservation: "Do you really want to end and pay?",
    alert_payment_validated: "✅ Payment validated!\nAmount: {amount} DH",
    alert_payment_error: "❌ Error during payment.",
    cancel: "Cancel",

    // --- Profile Page ---
    profile_title: "My Profile",
    profile_title_details: "Edit Profile",
    profile_title_payment: "Payment",
    profile_title_security: "Security",
    profile_title_legal: "Legal Notice",
    profile_title_help: "Help & Support",
    profile_title_about: "About Us",
    profile_title_profile: "My Detailed Profile",
    profile_view: "View",
    profile_section_personal: "Personal",
    profile_section_security: "Security",
    profile_section_about: "About",
    profile_logout: "Log Out",
    profile_edit_change_photo: "Change Photo",
    profile_edit_firstname: "First Name",
    profile_edit_lastname: "Last Name",
    profile_edit_email: "E-Mail",
    profile_edit_save: "Save Changes",
    alert_profile_updated: "Profile updated successfully!",
    alert_profile_update_error: "Error updating profile.",
    profile_sec_current_pass: "Current Password",
    profile_sec_new_pass: "New Password",
    profile_sec_confirm_pass: "Confirm",
    profile_sec_update_pass: "Update Password",
    alert_pass_mismatch: "Passwords do not match!",
    alert_pass_updated: "Password changed successfully!",
    alert_pass_update_error: "Error changing password.",
    alert_network_error: "Network or server error.",
    profile_detail_member_since: "Member since",
    profile_detail_my_activity: "My Activity",
    profile_detail_reservations: "Reservations",
    profile_detail_total_time: "Total Time",
    loading: "Loading...",
    error_generic: "An error occurred.",

    // --- Language ---
    lang_switch: "FR",
    profile_language: "Language",
  }
};

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('parksmart_lang') || 'fr';
  });

  useEffect(() => {
    localStorage.setItem('parksmart_lang', lang);
    document.documentElement.lang = lang;
  }, [lang]);

  const t = useCallback((key, params = {}) => {
    let translation = translations[lang]?.[key] || translations['fr']?.[key] || key;
    Object.keys(params).forEach(p => translation = translation.replace(`{${p}}`, params[p]));
    return translation;
  }, [lang]);
  const toggleLang = () => setLang(prev => prev === 'fr' ? 'en' : 'fr');

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, toggleLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useTranslation must be used within LanguageProvider');
  return context;
}
export function LanguageSwitcher({ className = '' }) {
  const { lang, toggleLang, t } = useTranslation();
  
  return (
    <button
      onClick={toggleLang}
      className={`lang-switcher ${className}`}
      title={lang === 'fr' ? 'Switch to English' : 'Passer en Français'}
      aria-label={lang === 'fr' ? 'Switch to English' : 'Passer en Français'}
      style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', cursor: 'pointer' }}
    >
      {/* On utilise ReactCountryFlag qui affichera un vrai SVG même sur Windows */}
      <ReactCountryFlag 
        countryCode={lang === 'fr' ? 'GB' : 'FR'} 
        svg 
        style={{ width: '24px', height: '24px', borderRadius: '2px' }} 
      />
      <span className="lang-label" style={{ fontWeight: 'bold' }}>{t('lang_switch')}</span>
    </button>
  );
}
