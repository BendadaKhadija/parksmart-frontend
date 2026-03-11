import { useTranslation } from '../i18n.jsx';

function Testimonials() {
  const { t } = useTranslation();

  const testimonialData = [
    { name: t('testimonial_name_1'), text: t('testimonial_1') },
    { name: t('testimonial_name_2'), text: t('testimonial_2') },
    { name: t('testimonial_name_3'), text: t('testimonial_3') },
    { name: t('testimonial_name_4'), text: t('testimonial_4') },
  ];

  const duplicatedData = [...testimonialData, ...testimonialData];

  return (
    <section className="testimonials">
      <h2>{t('testimonials_title')}<span className="highlight">{t('testimonials_subtitle')}</span></h2>
      <div className="testimonials-wrapper">
        <div className="testimonials-slider">
          
          {duplicatedData.map((item, index) => (
            <div className="testimonial-card" key={index}>
              <div className="author-icon">{item.name.charAt(0)}</div>
              <p>"{item.text}"</p>
              <span className="author">- {item.name}</span>
            </div>
          ))}

        </div>
      </div>
    </section>
  );
}
export default Testimonials;