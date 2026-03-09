import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/index.css';

function Inscription() {
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    password: '',
    role: 'conducteur', // ✅ 1. Valeur par défaut corrigée
  });
  
  const [error, setError] = useState('');
  
  // États pour l'image et l'œil
  const [previewImage, setPreviewImage] = useState(null);
  const [showPassword, setShowPassword] = useState(false); 
  const [selectedFile, setSelectedFile] = useState(null);
  
  const navigate = useNavigate();

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

  // 👇 CRÉATION DU FORM DATA (Le paquet spécial pour envoyer des fichiers)
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
          <h2>Create Account</h2>
          <p className="subtitle">Join ParkSmart in just a few steps.</p>

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
                    placeholder="Prénom (First Name)" 
                    className="auth-input" 
                    onChange={handleChange} 
                    required 
                    style={{ marginBottom: 0 }} 
                />

                {/* CHAMP NOM */}
                <input 
                    type="text" 
                    name="nom" 
                    placeholder="Nom (Last Name)" 
                    className="auth-input" 
                    onChange={handleChange} 
                    required 
                    style={{ marginBottom: 0 }} 
                />
            </div>
            <input 
                type="email" 
                name="email" 
                placeholder="Email Address" 
                className="auth-input" 
                onChange={handleChange} 
                required 
            />
            
            <div className="password-input-container">
              <input 
                  type={showPassword ? "text" : "password"} 
                  name="password" 
                  placeholder="Password" 
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
              <option value="conducteur">I am a Driver (Conducteur)</option>
              <option value="gestionnaire">I am a Manager (Gestionnaire)</option>
            </select>

            <button type="submit" className="btn-primary-auth">Sign Up</button>
          </form>
          
          {error && <div style={{color: 'red', marginTop: '10px', fontSize: '0.9rem', textAlign: 'center'}}>{error}</div>}
          
          <div className="divider"><span>OR</span></div>

          <button type="button" className="btn-google" onClick={() => alert("Simulation Google")}>
            <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google" className="google-icon" />
            Sign Up with Google
          </button>
          <div className="auth-footer">
            Already have an account? <Link to="/signin" className="auth-link">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Inscription;