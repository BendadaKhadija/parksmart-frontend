// Les données des témoignages (tu peux en ajouter)
const testimonialData = [
  {
    name: "Harshit Mishra",
    text: "ParkSmart has completely transformed society's parking system. The addition of automatic barriers... has made parking smoother and more secure."
  },
  {
    name: "Abhishek Singh",
    text: "ParkSmart has greatly improved our parking operations at the mall. Their innovative solutions have streamlined traffic flow, maximized parking space usage..."
  },
  {
    name: "Saurabh Yadav",
    text: "We were facing significant challenges with overcrowded parking spaces... ParkSmart system effectively optimized parking spaces and streamlined the entire process."
  },
  {
    name: "Rahul Sharma",
    text: "The integration of ParkSmart has significantly enhanced the security and ease of use in our private residential complex. Residents appreciate the smooth entry/exit..."
  }
];

// On double la liste pour l'effet de boucle infinie
const duplicatedData = [...testimonialData, ...testimonialData];

function Testimonials() {
  return (
    <section className="testimonials">
      <h2>Client Testimonials: <span className="highlight">ParkSmart Impacts</span></h2>
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