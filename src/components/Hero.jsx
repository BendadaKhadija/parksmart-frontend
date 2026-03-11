import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../i18n.jsx';

// Tes images pour le carrousel PC
const carouselImages = [
  '/slide1.png',
  '/slide2.png',
  '/slide3.png',
  '/slide4.png',
  '/slide5.png',
];

function Hero() {
  const [currentImage, setCurrentImage] = useState(0);
  const { t } = useTranslation();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % carouselImages.length);
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="hero-section">
      <div className="hero-container">
        
        <div className="hero-left">
          <h1>
            {t('hero_title1')} <br /> 
            {t('hero_title2')}<span className="highlight">{t('hero_title3')}</span>
          </h1>
          <p>{t('hero_desc')}</p>
          <Link to="/signin" className="btn-hero">{t('hero_cta')}</Link>
        </div>

        <div className="hero-right">
          <div className="carousel-container desktop-carousel">
            {carouselImages.map((img, index) => (
              <img
                key={index}
                src={img}
                alt={`Slide ${index}`}
                className={index === currentImage ? 'carousel-image active' : 'carousel-image'}
              />
            ))}
          </div>
          <img 
            src="/hero1.png" 
            alt="ParkSmart" 
            className="responsive-mockup-image mobile-only-image"
          />
        </div>
      </div>
    </section>
  );
}

export default Hero;