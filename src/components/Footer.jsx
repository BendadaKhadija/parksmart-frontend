import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../i18n.jsx';

function Footer() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const { t } = useTranslation();

  const handleSubmit = (e) => {
    e.preventDefault();
    alert(`Message envoyé (simulation) :\nEmail: ${email}\nMessage: ${message}`);
    setEmail('');
    setMessage('');
  };

  return (
    <footer className="footer-section">
      <div className="footer-container">
        
        <div className="footer-column footer-about">
          <Link to="/" className="footer-logo-link">
             <img src="/LOGO.png" alt="ParkSmart" className="footer-logo-img" /> 
          </Link>
          <p>
            ParkSmart rend la mobilité urbaine plus intelligente, plus propre et plus efficace pour tous.
            Trouvez votre place en un clic.
          </p>
          <div className="social-icons">
            <a href="#"><i className="fab fa-facebook-f"></i></a>
            <a href="#"><i className="fab fa-twitter"></i></a>
            <a href="#"><i className="fab fa-instagram"></i></a>
            <a href="#"><i className="fab fa-linkedin-in"></i></a>
          </div>
        </div>

        <div className="footer-column footer-links">
          <h3>{t('footer_quick_links')}</h3>
          <ul>
            <li><Link to="/">{t('footer_home')}</Link></li>
            <li><Link to="/about">{t('footer_about')}</Link></li>
            <li><Link to="/contact">{t('footer_contact')}</Link></li>
            <li><Link to="/privacy">{t('footer_privacy')}</Link></li>
          </ul>
        </div>

        <div className="footer-column footer-contact-form">
          <h3>{t('footer_message_title')}</h3>
          
          <form className="contact-form" onSubmit={handleSubmit}>
            <input 
              type="email" 
              placeholder={t('footer_email_placeholder')} 
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <textarea 
              placeholder={t('footer_message_placeholder')} 
              className="form-textarea"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            ></textarea>
            <button type="submit" className="form-button">{t('footer_send')}</button>
          </form>
        </div>

      </div>

      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} ParkSmart. {t('footer_rights')}</p>
      </div>
    </footer>
  );
}

export default Footer;