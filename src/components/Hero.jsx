import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

// Tes images pour le carrousel PC
const carouselImages = [ // Renommé pour plus de clarté
  '/slide1.png',
  '/slide2.png',
  '/slide3.png',
  '/slide4.png',
  '/slide5.png',
];

function Hero() {
  const [currentImage, setCurrentImage] = useState(0);

  // L'animation du carrousel
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % carouselImages.length);
    }, 2500);

    return () => clearInterval(timer);
  }, []);

  return (
    <section className="hero-section">
      <div className="hero-container">
        
        {/* PARTIE GAUCHE : TEXTE */}
        <div className="hero-left">
          <h1>
            Transforming parking <br /> 
            with Park<span className="highlight">Smart</span>
          </h1>
          <p>
            ParkSmart is a real-time system for finding and reserving parking spots.
            It offers an easy interface with live availability and a quick booking process.
            Managers can track and optimize parking spaces efficiently.
          </p>
          <Link to="/signin" className="btn-hero">Get in Touch</Link>
        </div>

        {/* PARTIE DROITE : AFFICHAGE CONDITIONNEL DES IMAGES */}
        <div className="hero-right">
          
          {/* 1. CARROUSEL (Visible sur PC, caché sur mobile) */}
          <div className="carousel-container desktop-carousel"> {/* Ajout de la classe "desktop-carousel" */}
            {carouselImages.map((img, index) => (
              <img
                key={index}
                src={img}
                alt={`Slide ${index}`}
                className={index === currentImage ? 'carousel-image active' : 'carousel-image'}
              />
            ))}
          </div>

          {/* 2. IMAGE MOCKUP (Visible sur mobile, caché sur PC) */}
          <img 
            src="/hero1.png" 
            alt="ParkSmart Responsive Design" 
            className="responsive-mockup-image mobile-only-image" // Nouvelles classes
          />

        </div>

      </div>
    </section>
  );
}

export default Hero;