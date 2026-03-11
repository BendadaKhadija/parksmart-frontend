import { useState } from 'react';
import { useTranslation } from '../i18n.jsx';

function FaqItem({ item, index, isOpen, onToggle }) {
  return (
    <div className={isOpen ? 'faq-item open' : 'faq-item'}>
      <div className="faq-question" onClick={onToggle}>
        <span>{item.question}</span>
        <div className="faq-icon">&#x25BC;</div>
      </div>
      <div className="faq-answer">
        <p>{item.answer}</p>
      </div>
    </div>
  );
}

function Questions() {
  const [openQuestion, setOpenQuestion] = useState(null);
  const { t } = useTranslation();

  const faqs = [
    { question: t('faq_q1'), answer: t('faq_a1') },
    { question: t('faq_q2'), answer: t('faq_a2') },
    { question: t('faq_q3'), answer: t('faq_a3') },
    { question: t('faq_q4'), answer: t('faq_a4') },
    { question: t('faq_q5'), answer: t('faq_a5') },
  ];

  const handleToggle = (index) => {
    setOpenQuestion(openQuestion === index ? null : index);
  };

  return (
    <section className="faq-section">
      <div className="container">
        <div className="faq-content-left">
          <p className="sub-heading">{t('faq_title')}</p>
          <h2>{t('faq_subtitle')}</h2>

          <div className="faq-contact-box">
            <h3>{t('faq_still_question')}</h3>
            <p>{t('faq_still_desc')}</p>
            <a href="mailto:contact@parksmart.com" className="btn-send-email">
              {t('faq_send_email')}
            </a>
          </div>
        </div>

        <div className="faq-accordion-right">
          {faqs.map((item, index) => (
            <FaqItem
              key={index}
              item={item}
              index={index}
              isOpen={openQuestion === index}
              onToggle={() => handleToggle(index)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default Questions;