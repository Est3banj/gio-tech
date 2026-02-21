import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { subscribeToConfig } from "../services/config.service";

function Header() {
  const [config, setConfig] = useState({});
  const location = useLocation();

  // Estado del Menú Móvil Independiente
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Lógica de Modo Oscuro
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) return savedTheme === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add("dark-mode");
      localStorage.setItem("theme", "dark");
    } else {
      document.body.classList.remove("dark-mode");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

  useEffect(() => {
    // Listener para la configuración del negocio desde Firestore
    const unsub = subscribeToConfig(
      (data) => setConfig(data),
      (error) => console.error("Header config error:", error)
    );
    return () => unsub(); // Limpiar el listener al desmontar el componente
  }, []);

  // Bloquear scroll del body cuando el menú móvil está abierto
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);
  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  // Lógica para Header Transparente -> Sólido en Scroll
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Inicializar
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Determinar si la página actual soporta header transparente (Hero)
  const isHeroPage = location.pathname === "/" || location.pathname === "/servicio-tecnico";

  // El header es sólido si:
  // 1. Ya se hizo scroll
  // 2. NO es una página con Hero.
  const isSolid = scrolled || !isHeroPage;

  return (
    <>
      <header className={`gio-header ${isSolid || isMobileMenuOpen ? "scrolled" : ""}`}>
        <div className="section-inner d-flex justify-content-between align-items-center">

          {/* Brand Area */}
          <div className="header-brand d-flex align-items-center gap-2 gap-md-3">
            {config.logo && (
              <img
                src={config.logo}
                alt={config.nombre || "Logo"}
                className="gio-logo"
              />
            )}
            {config.nombre && (
              <h2 className="fw-bold text-primary mb-0 header-title d-none d-sm-block">
                {config.nombre}
              </h2>
            )}
          </div>

          {/* Desktop Navigation (Renderizado condicional por CSS d-none d-lg-flex) */}
          <nav className="header-nav-desktop d-none d-lg-flex mb-0 mx-auto">
            <ul className="nav align-items-center mb-0">
              <li className="nav-item">
                <Link to="/" className={`nav-link-gio ${location.pathname === "/" ? "active" : ""}`}>Inicio</Link>
              </li>
              <li className="nav-item">
                <Link to="/catalogo" className={`nav-link-gio ${location.pathname === "/catalogo" ? "active" : ""}`}>Catálogo</Link>
              </li>
              <li className="nav-item">
                <Link to="/servicio-tecnico" className={`nav-link-gio ${location.pathname === "/servicio-tecnico" ? "active" : ""}`}>Servicio Técnico</Link>
              </li>
            </ul>
          </nav>

          {/* Actions Area: Theme Toggle & Hamburger */}
          <div className="header-actions d-flex align-items-center gap-3">
            <button
              onClick={toggleTheme}
              className="theme-toggle-btn"
              title={isDarkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
              aria-label="Toggle theme"
            >
              <i className={`bi ${isDarkMode ? "bi-sun-fill" : "bi-moon-fill"}`}></i>
            </button>

            {/* Hamburger Button (d-lg-none) */}
            <button
              className="mobile-menu-toggle d-lg-none"
              onClick={toggleMobileMenu}
              aria-label="Toggle mobile menu"
              aria-expanded={isMobileMenuOpen}
            >
              <i className={`bi ${isMobileMenuOpen ? "bi-x-lg" : "bi-list"}`}></i>
            </button>
          </div>
        </div>
      </header>

      {/* Structural Mobile Menu Overlay - Desacoplado del header flow, posicionado fixamente */}
      <div className={`mobile-nav-overlay d-lg-none ${isMobileMenuOpen ? "open" : ""}`}>
        <nav className="mobile-nav-container">
          <ul className="mobile-nav-list">
            <li>
              <Link to="/" className={`mobile-nav-link ${location.pathname === "/" ? "active" : ""}`} onClick={closeMobileMenu}>Inicio</Link>
            </li>
            <li>
              <Link to="/catalogo" className={`mobile-nav-link ${location.pathname === "/catalogo" ? "active" : ""}`} onClick={closeMobileMenu}>Catálogo</Link>
            </li>
            <li>
              <Link to="/servicio-tecnico" className={`mobile-nav-link ${location.pathname === "/servicio-tecnico" ? "active" : ""}`} onClick={closeMobileMenu}>Servicio Técnico</Link>
            </li>
          </ul>
        </nav>
      </div>
    </>
  );
}

export default Header;