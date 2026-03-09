import React from 'react';
import './Solution.css';

function SolutionsSection() {
  return (
    <section className="solutions-section">
      <div className="main-container">
        
        {/* --- 1. EN-TÊTE : Titre Large (Couvre tout) --- */}
        <div className="section-header">
          <h2>ParkSmart Solutions: <span className="highlight"> Uniting Hardware & Software</span></h2>
          <p className="intro">
            A unified phygital platform connecting drivers and managers for a seamless, frictionless parking experience.
          </p>
        </div>
        {/* --- 2. CONTENU : Les Colonnes en dessous --- */}
        <div className="solutions-content">
          
          {/* GAUCHE : Les Cartes */}
          <div className="left-column">
            <div className="features-grid">
              
              <div className="feature-card">
                <div className="feature-icon"><i className="fa-solid fa-layer-group"></i></div>
                <h4>Visual Selection</h4>
                <p>Choose your exact spot (e.g., A-12) on an interactive map.</p>
              </div>

              <div className="feature-card">
                <div className="feature-icon"><i className="fa-solid fa-cloud-arrow-up"></i></div>
                <h4>Cloud Sync</h4>
                <p>Real-time updates of spot availability across the database.</p>
              </div>

              <div className="feature-card">
                <div className="feature-icon"><i className="fa-solid fa-mobile-screen-button"></i></div>
                <h4>Mobile App</h4>
                <p>GPS navigation, smart filtering, and secure QR ticketing.</p>
              </div>

              <div className="feature-card">
                <div className="feature-icon"><i className="fa-solid fa-chart-line"></i></div>
                <h4>Manager Dashboard</h4>
                <p>Admin tools to manage parking lots and track revenue.</p>
              </div>

            </div>
          </div>

          {/* DROITE : La Vidéo */}
          <div className="right-column">
            <div className="video-wrapper">
               <video 
                className="solution-video"
                src="/car.mp4"
                autoPlay 
                loop 
                muted 
                playsInline
              />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

export default SolutionsSection;