// src/components/Header.tsx
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useConfig, useThemeMode } from "../hooks";
import { toDisplayUrl } from "./common/image-blank-detection";
import { HalloweenHeaderDecor } from "./HalloweenDecor";

export const DEFAULT_HEADER_ADDRESS = "Cra. 32 #13 36, Puerto Asís, Putumayo";

const Header: React.FC = () => {
  const { config } = useConfig();
  const { isDarkMode, toggleTheme } = useThemeMode();
  const location = useLocation();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isHeroPage = location.pathname === "/" || location.pathname === "/servicio-tecnico";
  const isSolid = scrolled || !isHeroPage;

  const address = config?.direccion?.trim() || DEFAULT_HEADER_ADDRESS;

  const isThemeActive = Boolean(config?.theme?.enabled);
  const themeVars = config?.theme?.vars || {};
  const currentThemeName = (themeVars['--theme-name'] || (config?.theme as { name?: string })?.name || '').toLowerCase();
  const isValentine = isThemeActive && currentThemeName === 'valentine';
  const isChristmas = isThemeActive && currentThemeName === 'christmas';
  const isHalloween = isThemeActive && currentThemeName === 'halloween';
  const isBlackFriday = isThemeActive && currentThemeName === 'blackfriday';

  const renderTrustContent = () => (
    <>
      {isValentine && (
        <>
          <span className="trust-item trust-item-seasonal">
            <span className="seasonal-ticker-pill">
              <i className="bi bi-heart-fill me-1" aria-hidden="true" />
              Amor y Amistad
            </span>
            <strong>Mes de Amor y Amistad</strong>: Celulares a cuotas sin inicial
          </span>
          <span className="trust-divider" aria-hidden="true">•</span>
        </>
      )}
      {isChristmas && (
        <>
          <span className="trust-item trust-item-seasonal">
            <span className="seasonal-ticker-pill seasonal-ticker-pill-christmas">
              <i className="bi bi-tree-fill me-1" aria-hidden="true" />
              Navidad GIO
            </span>
            <strong>Temporada Navideña</strong>: Estrena hoy con las mejores cuotas
          </span>
          <span className="trust-divider" aria-hidden="true">•</span>
        </>
      )}
      {isHalloween && (
        <>
          <span className="trust-item trust-item-seasonal">
            <span className="seasonal-ticker-pill seasonal-ticker-pill-halloween">
              <i className="bi bi-moon-stars-fill me-1" aria-hidden="true" />
              Halloween Tech
            </span>
            <strong>Especial Halloween</strong>: Ofertas de miedo en tecnología
          </span>
          <span className="trust-divider" aria-hidden="true">•</span>
        </>
      )}
      {isBlackFriday && (
        <>
          <span className="trust-item trust-item-seasonal">
            <span className="seasonal-ticker-pill seasonal-ticker-pill-blackfriday">
              <i className="bi bi-tag-fill me-1" aria-hidden="true" />
              Black Friday GIO
            </span>
            <strong>Black Friday</strong>: Precios insuperables y crédito inmediato
          </span>
          <span className="trust-divider" aria-hidden="true">•</span>
        </>
      )}
      <span className="trust-item">
        <i className="bi bi-geo-alt-fill text-danger me-1" aria-hidden="true"></i>
        Tienda física: <strong>{address}</strong>
      </span>
      <span className="trust-divider" aria-hidden="true">•</span>
      <span className="trust-item">
        <i className="bi bi-truck text-primary me-1" aria-hidden="true"></i>
        Envíos seguros a todo el <strong>Putumayo</strong>
      </span>
      <span className="trust-divider" aria-hidden="true">•</span>
      <span className="trust-item">
        <i className="bi bi-shield-check text-success me-1" aria-hidden="true"></i>
        <strong>Garantía Directa</strong>
      </span>
      <span className="trust-divider" aria-hidden="true">•</span>
    </>
  );

  return (
    <header className={`gio-header ${isSolid || isMobileMenuOpen ? "scrolled" : ""}`}>
      {/* Decor Halloween: wrapper propio recortado (NO overflow en el header) */}
      <HalloweenHeaderDecor />

      {/* ─── Micro-Trust Bar Unificada (Infinite Marquee) ─── */}
      <div className="gio-top-trust-bar" role="region" aria-label="Información de confianza">
        <div className="trust-marquee-track">
          <div className="trust-marquee-group">
            {renderTrustContent()}
            {renderTrustContent()}
          </div>
          <div className="trust-marquee-group" aria-hidden="true">
            {renderTrustContent()}
            {renderTrustContent()}
          </div>
        </div>
      </div>

      {/* ─── Main Navigation Row ─── */}
      <div className="gio-header-main">
        <div className="section-inner d-flex justify-content-between align-items-center">
          <div className="header-brand d-flex align-items-center gap-2 gap-md-3">
            {config?.logo && (
              <Link to="/" className="d-flex align-items-center text-decoration-none" onClick={closeMobileMenu}>
                <img
                  src={toDisplayUrl(config.logo)}
                  alt={config.nombre || "Logo"}
                  className="gio-logo"
                />
              </Link>
            )}
            {config?.nombre && (
              <Link to="/" className="text-decoration-none" onClick={closeMobileMenu}>
                <h2 className="fw-bold text-primary mb-0 header-title d-none d-sm-block">
                  {config.nombre}
                </h2>
              </Link>
            )}
          </div>

          <nav className="header-nav-desktop d-none d-lg-flex mb-0 mx-auto" aria-label="Navegación principal">
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

          <div className="header-actions d-flex align-items-center gap-2 gap-md-3">
            <button
              onClick={toggleTheme}
              className="theme-toggle-btn"
              title={isDarkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
              aria-label="Toggle theme"
            >
              <i className={`bi ${isDarkMode ? "bi-sun-fill" : "bi-moon-fill"}`}></i>
            </button>

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
      </div>

      {/* ─── Mobile Menu Overlay ─── */}
      <div className={`mobile-nav-overlay d-lg-none ${isMobileMenuOpen ? "open" : ""}`}>
        <nav className="mobile-nav-container" aria-label="Navegación móvil">
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
    </header>
  );
};

export default Header;
