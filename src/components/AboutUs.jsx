import { useTranslation } from '../i18n.jsx';

function AboutUs() {
  const { t } = useTranslation();

  return (
    <section className="about-section">
      <div className="container">
        
        <div className="about-left">
          <p className="sub-heading">{t('about_subtitle')}</p>
          <h2 className="single-line">{t('about_title')}<span className="highlight">ParkSmart</span></h2>
          <p>{t('about_p1')}</p>
          <p>{t('about_p2')}</p>
        </div>

        <div className="about-right">
          <video 
            src="/about-video.mp4"
            autoPlay
            loop
            muted
            playsInline
          >
            {t('about_video_fallback')}
          </video>
        </div>

      </div>
    </section>
  );
}

export default AboutUs;