import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useTranslation, LanguageSwitcher } from '../i18n.jsx';

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useTranslation();

  // Detect language
  const lang = localStorage.getItem('parksmart_lang') || 'fr';

  // If English, show compact client nav (icons + short labels)
  const isEnglish = lang === 'en';

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* 1. LOGO */}
        <Link to="/" className="logo-container" style={{ display: 'flex', alignItems: 'center' }} onClick={() => setIsOpen(false)}>
          <img
            src="/LOGO.png"
            alt="ParkSmart Logo"
            style={{ height: '200px', width: 'auto', margin: '0', marginLeft: '-20px' }}
          />
        </Link>

        {/* 2. ICÔNE BURGER (Visible seulement sur mobile) */}
        <div className="menu-icon" onClick={() => setIsOpen(!isOpen)}>
          <i className={isOpen ? "fa-solid fa-times" : "fa-solid fa-bars"}></i>
        </div>

        {/* 3. LES LIENS (Menu) */}
        {isEnglish ? (
          <ul className={isOpen ? "nav-menu active compact-client-nav" : "nav-menu compact-client-nav"}>
            <li className="nav-item">
              <NavLink to="/" className={({ isActive }) => isActive ? "nav-links active" : "nav-links"} onClick={() => setIsOpen(false)}>
                <i className="fa-solid fa-house"></i>
                <div style={{ fontSize: '12px', marginTop: '2px' }}>{t('nav_home')}</div>
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/notifications" className={({ isActive }) => isActive ? "nav-links active" : "nav-links"} onClick={() => setIsOpen(false)}>
                <i className="fa-solid fa-bell"></i>
                <div style={{ fontSize: '12px', marginTop: '2px' }}>{t('nav_notifications') || 'Notif'}</div>
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/history" className={({ isActive }) => isActive ? "nav-links active" : "nav-links"} onClick={() => setIsOpen(false)}>
                <i className="fa-solid fa-clock-rotate-left"></i>
                <div style={{ fontSize: '12px', marginTop: '2px' }}>{t('history_title') || 'History'}</div>
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/profile" className={({ isActive }) => isActive ? "nav-links active" : "nav-links"} onClick={() => setIsOpen(false)}>
                <i className="fa-solid fa-user"></i>
                <div style={{ fontSize: '12px', marginTop: '2px' }}>{t('profile_title') || 'Profile'}</div>
              </NavLink>
            </li>
            <li className="nav-item mobile-btn">
              <LanguageSwitcher />
            </li>
          </ul>
        ) : (
          <ul className={isOpen ? "nav-menu active" : "nav-menu"}>
            <li className="nav-item">
              <NavLink to="/" className={({ isActive }) => isActive ? "nav-links active" : "nav-links"} onClick={() => setIsOpen(false)}>{t('nav_home')}</NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/testimonials" className={({ isActive }) => isActive ? "nav-links active" : "nav-links"} onClick={() => setIsOpen(false)}>{t('nav_testimonials')}</NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/about" className={({ isActive }) => isActive ? "nav-links active" : "nav-links"} onClick={() => setIsOpen(false)}>{t('nav_about')}</NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/questions" className={({ isActive }) => isActive ? "nav-links active" : "nav-links"} onClick={() => setIsOpen(false)}>{t('nav_questions')}</NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/solution" className={({ isActive }) => isActive ? "nav-links active" : "nav-links"} onClick={() => setIsOpen(false)}>{t('nav_solutions')}</NavLink>
            </li>
            {/* Boutons d'action dans le menu mobile */}
            <li className="nav-item mobile-btn">
              <Link to="/signin" className="btn-signin" onClick={() => setIsOpen(false)}>{t('nav_signin')}</Link>
            </li>
            <li className="nav-item mobile-btn">
              <Link to="/signup" className="btn-signup" onClick={() => setIsOpen(false)}>{t('nav_signup')}</Link>
            </li>
            <li className="nav-item mobile-btn">
              <LanguageSwitcher />
            </li>
          </ul>
        )}

        {/* 4. BOUTONS DESKTOP (Cachés sur mobile) */}
        <div className="desktop-btn">
          <LanguageSwitcher />
          <Link to="/signin" className="btn-signin">{t('nav_signin')}</Link>
          <Link to="/signup" className="btn-signup">{t('nav_signup')}</Link>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;