import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="navbar">
      <div className="navbar-container">
        
        {/* 1. LOGO */}
        {/* Dans Navbar.jsx */}
<Link to="/" className="logo-container" style={{ display: 'flex', alignItems: 'center' }} onClick={() => setIsOpen(false)}>
    <img
      src="/LOGO.png"
      alt="ParkSmart Logo"
      style={{ height: '200px', width: 'auto', margin: '0', marginLeft: '-20px' }}
    />
</Link>

        {/* 2. ICÔNE BURGER (Visible seulement sur mobile) */}
        <div className="menu-icon" onClick={() => setIsOpen(!isOpen)}>
          <i className={isOpen ? "fa-solid fa-times" : "fa-solid fa-bars"}></i>
        </div>

        {/* 3. LES LIENS (Menu) */}
        <ul className={isOpen ? "nav-menu active" : "nav-menu"}>
          <li className="nav-item">
            <NavLink to="/" className={({ isActive }) => isActive ? "nav-links active" : "nav-links"} onClick={() => setIsOpen(false)}>Home</NavLink>
          </li>
          <li className="nav-item">
            <NavLink to="/testimonials" className={({ isActive }) => isActive ? "nav-links active" : "nav-links"} onClick={() => setIsOpen(false)}>Testimonials</NavLink>
          </li>
          <li className="nav-item">
            <NavLink to="/about" className={({ isActive }) => isActive ? "nav-links active" : "nav-links"} onClick={() => setIsOpen(false)}>About Us</NavLink>
          </li>
          <li className="nav-item">
            <NavLink to="/questions" className={({ isActive }) => isActive ? "nav-links active" : "nav-links"} onClick={() => setIsOpen(false)}>Questions</NavLink>
          </li>
              <li className="nav-item">
                <NavLink to="/solution" className={({ isActive }) => isActive ? "nav-links active" : "nav-links"} onClick={() => setIsOpen(false)}>Solutions</NavLink>
              </li>

              {/* Boutons d'action dans le menu mobile */}
              <li className="nav-item mobile-btn">
                <Link to="/signin" className="btn-signin" onClick={() => setIsOpen(false)}>Sign In</Link>
              </li>
              <li className="nav-item mobile-btn">
                <Link to="/signup" className="btn-signup" onClick={() => setIsOpen(false)}>Sign Up</Link>
              </li>
            </ul>

        {/* 4. BOUTONS DESKTOP (Cachés sur mobile) */}
        <div className="desktop-btn">
            <Link to="/signin" className="btn-signin">Sign In</Link>
            <Link to="/signup" className="btn-signup">Sign Up</Link>
        </div>

      </div>
    </nav>
  );
}

export default Navbar;