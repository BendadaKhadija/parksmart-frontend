import { useState } from 'react';
import { Link } from 'react-router-dom';

function Footer() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    alert(`Message envoyé (simulation) :\nEmail: ${email}\nMessage: ${message}`);
    setEmail('');
    setMessage('');
  };

  return (
    <footer className="footer-section">
      <div className="footer-container">
        
        {/* Colonne 1 : Logo & Réseaux Sociaux */}
        <div className="footer-column footer-about">
          <Link to="/" className="footer-logo-link">
             {/* Assure-toi que LOGO.png est bien dans le dossier public */}
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

        {/* Colonne 2 : Liens Rapides */}
        <div className="footer-column footer-links">
          <h3>Quick Links</h3>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/about">About Us</Link></li>
            <li><Link to="/contact">Contact</Link></li>
            <li><Link to="/privacy">Privacy Policy</Link></li>
          </ul>
        </div>

        {/* Colonne 3 : Formulaire de Contact & Image (Celle qui va disparaître sur mobile) */}
        <div className="footer-column footer-contact-form">
          <h3>Have a message? Get in touch!</h3>
          
          <form className="contact-form" onSubmit={handleSubmit}>
            <input 
              type="email" 
              placeholder="Your email here..." 
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <textarea 
              placeholder="Your message here..." 
              className="form-textarea"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            ></textarea>
            <button type="submit" className="form-button">Send</button>
          </form>

          
        </div>

      </div>

      {/* Barre de Copyright */}
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} ParkSmart. All rights reserved.</p>
      </div>
    </footer>
  );
}

export default Footer;