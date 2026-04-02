import { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/index.css'; 
import { useTranslation } from '../i18n.jsx';

import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

function Connexion() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { t } = useTranslation();

  // --- CONNEXION CLASSIQUE ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setError(''); 
    
    try { 
      console.log("🔵 Tentative de connexion classique...");
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/login`, { email, password });
      
      let { token, user } = response.data; 
      
      if (user.role === 'conducteur') {
         user.role = 'client';
      }
      
      console.log("🟢 Connexion réussie !", user);

      sessionStorage.setItem('token', token);
      sessionStorage.setItem('user', JSON.stringify(user));

      if (user.role === 'gestionnaire') {
          navigate('/admin/dashboard'); 
      } else if (user.role === 'client') { 
          navigate('/home'); 
      } else {
          navigate('/');
      }

    } catch (err) {
      console.error("🔴 Erreur Login :", err);
      if (err.response) {
        if (err.response.status === 500) {
            setError("Erreur interne du serveur (500). Le backend a planté. Consultez les logs sur Railway.");
        } else if (err.response.data && err.response.data.message) {
            setError(err.response.data.message);
        } else {
            setError(`Erreur inattendue du serveur (Code: ${err.response.status}).`);
        }
      } else {
        setError("Impossible de contacter le serveur. Vérifiez votre connexion internet et l'URL de l'API.");
      }
    }
  }; 

  // 👇 2. NOUVELLE FONCTION GOOGLE 👇
  const handleGoogleLogin = async () => {
    try {
      console.log("🔵 Ouverture de la popup Google...");
      
      // On lance la popup Firebase
      const result = await signInWithPopup(auth, googleProvider);
      const userGoogle = result.user;
      
      console.log("🟢 Utilisateur Google validé par Firebase :", userGoogle.email);

      // On récupère le token sécurisé
      const firebaseToken = await userGoogle.getIdToken();

      // On l'envoie à ton backend
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/auth/google`,
        {}, // Le corps de la requête est vide
        {
          headers: { Authorization: `Bearer ${firebaseToken}` }
        }
      ); // 🚨 LA CORRECTION ÉTAIT ICI : on a remplacé }); par );

      // Le backend nous renvoie les infos de l'utilisateur comme pour une connexion normale
      let { token, user } = response.data;

      if (user.role === 'conducteur') {
         user.role = 'client';
      }

      // On sauvegarde la session
      sessionStorage.setItem('token', token);
      sessionStorage.setItem('user', JSON.stringify(user));

      // On redirige
      if (user.role === 'gestionnaire') {
          navigate('/admin/dashboard'); 
      } else {
          navigate('/home'); 
      }

    } catch (err) {
      console.error("🔴 Erreur Google Login :", err);
      if (err.response) {
        if (err.response.status === 401) {
            setError("Le serveur a refusé la connexion Google (401). Vérifiez les clés Firebase sur Railway et consultez les logs du backend.");
        } else if (err.response.data && err.response.data.message) {
            setError(`Erreur Serveur: ${err.response.data.message}`);
        } else {
            setError(`Erreur inattendue du serveur (Code: ${err.response.status}).`);
        }
      } else {
          setError("La connexion avec Google a échoué. Vérifiez votre connexion internet.");
      }
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        
        <div className="auth-image-side"></div>

        <div className="auth-form-side">
          <h2>{t('login_welcome')}</h2>
          <p>{t('login_subtitle')}</p>
          
          <div className="profile-avatar-display">
            <img 
              src="https://marketplace.canva.com/gJly0/MAGDkMgJly0/1/tl/canva-user-profile-icon-vector.-avatar-or-person-icon.-profile-picture%2C-portrait-symbol.-MAGDkMgJly0.png" 
              alt="Profile" 
            />
          </div>
          <form onSubmit={handleLogin} className="auth-form">
            <input 
              type="email" 
              placeholder={t('login_email_placeholder')} 
              className="auth-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
            
            <div className="password-input-container">
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder={t('login_password_placeholder')} 
                className="auth-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)} 
                required 
              />
              <i 
                className={showPassword ? "fa-solid fa-eye" : "fa-solid fa-eye-slash"}
                onClick={() => setShowPassword(!showPassword)}
                style={{ cursor: 'pointer', position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', color: '#666' }}
              ></i>
            </div>
            
            <button type="submit" className="btn-primary-auth">{t('login_submit')}</button>
          </form>
          
          {error && <div style={{ color: '#dc2626', marginTop: '15px', textAlign: 'center', fontWeight: 'bold' }}>{error}</div>}

          <div className="divider"><span>{t('login_or')}</span></div>

          <button type="button" className="btn-google" onClick={handleGoogleLogin}>
            <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google" className="google-icon" />
            {t('login_google')}
          </button>
          
          <div className="auth-footer">
            {t('login_new')} <Link to="/signup" className="auth-link">{t('login_create')}</Link>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Connexion;