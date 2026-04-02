import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/index.css';
import { useTranslation } from '../i18n.jsx';

function Inscription() {
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    password: '',
    role: 'conducteur', 
  });
  
  const [error, setError] = useState('');
  
  const [previewImage, setPreviewImage] = useState(null);
  const [showPassword, setShowPassword] = useState(false); 
  const [selectedFile, setSelectedFile] = useState(null);
  
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
  const file = e.target.files[0];
  if (file) {
    setPreviewImage(URL.createObjectURL(file));
    setSelectedFile(file); 
  }
};

  const handleRegister = async (e) => {
  e.preventDefault();
  setError('');

  // 👇 CRÉATION jjDU FORM DATA (Le paquet spécial pour envoyer des fichiers)
  const dataToSend = new FormData();
  dataToSend.append('nom', formData.nom);
  dataToSend.append('prenom', formData.prenom);
  dataToSend.append('email', formData.email);
  dataToSend.append('password', formData.password);
  dataToSend.append('role', formData.role);

  // 👇 C'EST ICI LA LIGNE QUI TE MANQUAIT !
  if (selectedFile) {
    dataToSend.append('image', selectedFile); // On envoie le fichier sous le nom 'image'
  }

  try {
    // On envoie 'dataToSend' au lieu de l'objet JSON
    await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/signup`, dataToSend, {
      headers: { "Content-Type": "multipart/form-data" }, // Important pour dire au serveur qu'un fichier arrive
    });
    
    alert("Compte créé avec succès ! Connecte-toi.");
    navigate('/signin');
  } catch (err) {
    console.error(err);
    setError(err.response?.data?.message || "Erreur lors de l'inscription.");
  }
};

  return (
    <div className="auth-container">
      <div className="auth-card">
        
        {/* IMAGE GAUCHE */}
        <div className="auth-image-side"></div>

        {/* FORMULAIRE DROITE */}
        <div className="auth-form-side">
          <h2>{t('signup_title')}</h2>
          <p className="subtitle">{t('signup_subtitle')}</p>

          {/* CERCLE PHOTO (Visuel uniquement pour l'instant) */}
          <div className="profile-upload" onClick={() => document.getElementById('profilePictureInput').click()}>
              <img 
                src={previewImage || "https://marketplace.canva.com/gJly0/MAGDkMgJly0/1/tl/canva-user-profile-icon-vector.-avatar-or-person-icon.-profile-picture%2C-portrait-symbol.-MAGDkMgJly0.png"} 
                alt="Profile" 
              />
              <div className="plus-icon">+</div>
              <input 
                  type="file" 
                  id="profilePictureInput" 
                  style={{ display: 'none' }} 
                  accept="image/*" 
                  onChange={handleFileChange} 
              />
          </div>
          
          <form onSubmit={handleRegister} className="auth-form">
            {/* Conteneur pour aligner Prénom et Nom */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                
                {/* CHAMP PRÉNOM */}
                <input 
                    type="text" 
                    name="prenom" 
                    placeholder={t('signup_prenom_placeholder')} 
                    className="auth-input" 
                    onChange={handleChange} 
                    required 
                    style={{ marginBottom: 0 }} 
                />

                {/* CHAMP NOM */}
                <input 
                    type="text" 
                    name="nom" 
                    placeholder={t('signup_nom_placeholder')} 
                    className="auth-input" 
                    onChange={handleChange} 
                    required 
                    style={{ marginBottom: 0 }} 
                />
            </div>
            <input 
                type="email" 
                name="email" 
                placeholder={t('signup_email_placeholder')} 
                className="auth-input" 
                onChange={handleChange} 
                required 
            />
            
            <div className="password-input-container">
              <input 
                  type={showPassword ? "text" : "password"} 
                  name="password" 
                  placeholder={t('signup_password_placeholder')} 
                  className="auth-input" 
                  onChange={handleChange} 
                  required 
              />
                  <i 
                  className={showPassword ? "fa-solid fa-eye" : "fa-solid fa-eye-slash"}
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ cursor: 'pointer', position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', color: '#666' }}
                  ></i>
            </div>
            
            {/* ✅ 3. VALEURS CORRIGÉES ICI */}
            <select name="role" className="auth-input" onChange={handleChange}>
              <option value="conducteur">{t('signup_role_driver')}</option>
              <option value="gestionnaire">{t('signup_role_manager')}</option>
            </select>

            <button type="submit" className="btn-primary-auth">{t('signup_submit')}</button>
          </form>
          
          {error && <div style={{color: 'red', marginTop: '10px', fontSize: '0.9rem', textAlign: 'center'}}>{error}</div>}
          
          <div className="divider"><span>{t('signup_or')}</span></div>

          <button type="button" className="btn-google" onClick={() => alert("Simulation Google")}>
            <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google" className="google-icon" />
            {t('signup_google')}
          </button>
          <div className="auth-footer">
            {t('signup_already')} <Link to="/signin" className="auth-link">{t('signup_signin')}</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Inscription;