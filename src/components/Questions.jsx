import { useState } from 'react';

const faqs = [
  {
    question: "What is ParkSmart?",
    answer: "ParkSmart is an advanced parking management system that combines hardware and software to provide a seamless and efficient parking experience for users and managers alike."
  },
  {
    question: "How do I find a parking spot?",
    answer: "Our mobile app allows you to view real-time parking availability on a map. You can filter by location, price, and amenities, then book your preferred spot instantly."
  },
  {
    question: "Is payment processed securely?",
    answer: "Yes, all payments are processed through secure, encrypted channels. We partner with leading payment providers to ensure your financial data is protected."
  },
  {
    question: "Can I manage my own parking facility with ParkSmart?",
    answer: "Absolutely! ParkSmart provides a dedicated platform for parking facility managers to list their spots, track usage, and streamline operations."
  },
  {
    question: "What if I need help while parking?",
    answer: "Our support team is available 24/7 through the app or our website. We're here to assist you with any issues or questions you may have."
  }
];

function FaqItem({ item, index, isOpen, onToggle }) {
  return (
    <div className={isOpen ? 'faq-item open' : 'faq-item'}>
      <div className="faq-question" onClick={onToggle}>
        <span>{item.question}</span>
        <div className="faq-icon">&#x25BC;</div> {/* Flèche vers le bas */}
      </div>
      <div className="faq-answer">
        <p>{item.answer}</p>
      </div>
    </div>
  );
}

function Questions() {
  const [openQuestion, setOpenQuestion] = useState(null);

  const handleToggle = (index) => {
    setOpenQuestion(openQuestion === index ? null : index);
  };

  return (
    <section className="faq-section">
      <div className="container">
        {/* Partie Gauche : Titre et bloc de contact */}
        <div className="faq-content-left">
          <p className="sub-heading">Ready to Park Smart</p> {/* Texte au-dessus */}
          <h2>Frequently Asked <br />Questions</h2> {/* Titre principal */}

          <div className="faq-contact-box">
            <h3>Still have a question?</h3>
            <p>
              Can't find the answer to your question? Send us an email and
              we'll get back to you as soon as possible!
            </p>
            <a href="mailto:contact@parksmart.com" className="btn-send-email">
              Send Email
            </a>
          </div>
        </div>

        {/* Partie Droite : Accordéon des questions */}
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