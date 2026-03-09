function AboutUs() {
  return (
    <section className="about-section">
      <div className="container">
        
        {/* Colonne de Gauche (Texte) */}
        <div className="about-left">
          <p className="sub-heading">Who We Are</p>
          <h2 className="single-line">About <span className="highlight">ParkSmart</span></h2>
          <p>
            ParkSmart is a smart platform that helps drivers quickly find and reserve parking spots in real time. Its interactive map and instant notifications make parking faster and less stressful. The user-friendly interface ensures a smooth experience for every driver.
          </p>
          <p>
            For parking managers, ParkSmart provides tools to monitor occupancy and manage reservations efficiently. It helps optimize space usage and improve overall coordination. Our mission is to make parking simple, convenient, and reliable for everyone.
          </p>
        </div>

        {/* Colonne de Droite (Vidéo) */}
        <div className="about-right">
          <video 
            src="/about-video.mp4" /* Le fichier de ton dossier /public */
            autoPlay  /* Joue automatiquement */
            loop      /* Recommence en boucle */
            muted     /* Obligatoire pour l'autoplay sur Chrome */
            playsInline /* Pour que ça marche sur iPhone */
          >
            Your browser does not support the video tag.
          </video>
        </div>

      </div>
    </section>
  );
}

export default AboutUs;