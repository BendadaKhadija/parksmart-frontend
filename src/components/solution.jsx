import React from 'react';
import './solutions.css';
import { useTranslation } from '../i18n.jsx';

function SolutionsSection() {
  const { t } = useTranslation();
  return (
    <section className="solutions-section">
      <div className="main-container">
        
        <div className="section-header">
          <h2>{t('solutions_title')}<span className="highlight">{t('solutions_subtitle')}</span></h2>
          <p className="intro">
            {t('solutions_desc')}
          </p>
        </div>
        <div className="solutions-content">
          
          <div className="left-column">
            <div className="features-grid">
              
              <div className="feature-card">
                <div className="feature-icon"><i className="fa-solid fa-layer-group"></i></div>
                <h4>{t('sol_visual')}</h4>
                <p>{t('sol_visual_desc')}</p>
              </div>

              <div className="feature-card">
                <div className="feature-icon"><i className="fa-solid fa-cloud-arrow-up"></i></div>
                <h4>{t('sol_cloud')}</h4>
                <p>{t('sol_cloud_desc')}</p>
              </div>

              <div className="feature-card">
                <div className="feature-icon"><i className="fa-solid fa-mobile-screen-button"></i></div>
                <h4>{t('sol_mobile')}</h4>
                <p>{t('sol_mobile_desc')}</p>
              </div>

              <div className="feature-card">
                <div className="feature-icon"><i className="fa-solid fa-chart-line"></i></div>
                <h4>{t('sol_dashboard')}</h4>
                <p>{t('sol_dashboard_desc')}</p>
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