// src/components/Footer.tsx
import React, { useContext } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useConfig } from '../hooks/useConfig';
import { toDisplayUrl } from './common/image-blank-detection';
import { WhatsappNumberContext, DEFAULT_WHATSAPP_NUMBER } from '../contexts/whatsapp-number-context';
import { openCookiePreferences } from '../services/consent.service';
import { HalloweenFooterDecor } from './HalloweenDecor';

export const DEFAULT_FOOTER_ADDRESS = 'Cra. 32 #13 36, Puerto Asís, Putumayo';
export const DEFAULT_MAPS_URL = 'https://maps.google.com/?q=GIO+TECH,+Cra.+32+%2313+36,+Puerto+As%C3%ADs,+Putumayo';
export const DEFAULT_FACEBOOK_URL = 'https://www.facebook.com/share/1CUYUF25YF/?mibextid=wwXIfr';
export { DEFAULT_WHATSAPP_NUMBER };

const Footer: React.FC = () => {
  const { config } = useConfig();
  const asesorWhatsapp = useContext(WhatsappNumberContext);

  const whatsappNumber = asesorWhatsapp || config?.whatsappNumber || DEFAULT_WHATSAPP_NUMBER;
  const phoneNumber = config?.telefono || whatsappNumber;
  const facebookPageUrl = config?.redesSociales?.facebook || DEFAULT_FACEBOOK_URL;
  const instagramUrl = config?.redesSociales?.instagram;
  const tiktokUrl = config?.redesSociales?.tiktok;
  const businessAddress = config?.direccion || DEFAULT_FOOTER_ADDRESS;
  const businessName = config?.nombre || 'GIO TECH';
  const logoUrl = config?.logo || '/logo.png';
  const currentYear = new Date().getFullYear();

  return (
    <footer className="gio-footer mt-auto" role="contentinfo">
      {/* Decor Halloween: araña en hilo colgando del borde superior, lateral */}
      <HalloweenFooterDecor />
      <Container>
        {/* Fila Principal de 3 Columnas */}
        <Row className="gy-4 gx-lg-5 mb-4">
          {/* Columna 1: Marca */}
          <Col xs={12} md={4} className="footer-col footer-col-brand">
            <Link to="/" className="footer-brand mb-2 d-inline-flex align-items-center gap-2 text-decoration-none">
              <img
                src={toDisplayUrl(logoUrl)}
                alt={businessName}
                className="footer-brand-logo"
                loading="lazy"
              />
              <span className="footer-brand-title">{businessName}</span>
            </Link>
            <p className="footer-tagline mb-3">
              Tecnología, smartphones y servicio técnico especializado en Putumayo.
            </p>
            <div className="footer-social-badges d-flex align-items-center gap-2">
              {facebookPageUrl && (
                <a
                  href={facebookPageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-social-badge social-facebook"
                  aria-label="Facebook"
                  title="Facebook"
                >
                  <i className="bi bi-facebook" aria-hidden="true"></i>
                </a>
              )}
              {instagramUrl && (
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-social-badge social-instagram"
                  aria-label="Instagram"
                  title="Instagram"
                >
                  <i className="bi bi-instagram" aria-hidden="true"></i>
                </a>
              )}
              {tiktokUrl && (
                <a
                  href={tiktokUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-social-badge social-tiktok"
                  aria-label="TikTok"
                  title="TikTok"
                >
                  <i className="bi bi-tiktok" aria-hidden="true"></i>
                </a>
              )}
              {whatsappNumber && (
                <a
                  href={`https://wa.me/${whatsappNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-social-badge social-whatsapp"
                  aria-label="WhatsApp"
                  title="WhatsApp"
                >
                  <i className="bi bi-whatsapp" aria-hidden="true"></i>
                </a>
              )}
            </div>
          </Col>

          {/* Columna 2: Navegación & Legal */}
          <Col xs={12} sm={6} md={4} className="footer-col">
            <h3 className="footer-col-heading">Navegación & Legal</h3>
            <ul className="footer-nav-list list-unstyled mb-0">
              <li className="footer-nav-item">
                <Link to="/catalogo" className="footer-nav-link">
                  <i className="bi bi-phone me-2 footer-link-icon" aria-hidden="true"></i>
                  <span>Catálogo de Equipos</span>
                </Link>
              </li>
              <li className="footer-nav-item">
                <Link to="/servicio-tecnico" className="footer-nav-link">
                  <i className="bi bi-wrench-adjustable me-2 footer-link-icon" aria-hidden="true"></i>
                  <span>Servicio Técnico</span>
                </Link>
              </li>
              <li className="footer-nav-item">
                <Link to="/terminos" className="footer-nav-link">
                  <i className="bi bi-shield-check me-2 footer-link-icon" aria-hidden="true"></i>
                  <span>Términos y Garantías</span>
                </Link>
              </li>
              <li className="footer-nav-item">
                <Link to="/cookies" className="footer-nav-link">
                  <i className="bi bi-cookie me-2 footer-link-icon" aria-hidden="true"></i>
                  <span>Política de cookies</span>
                </Link>
              </li>
              <li className="footer-nav-item">
                <button
                  type="button"
                  className="footer-nav-link footer-nav-btn"
                  onClick={openCookiePreferences}
                >
                  <i className="bi bi-sliders me-2 footer-link-icon" aria-hidden="true"></i>
                  <span>Preferencias de cookies</span>
                </button>
              </li>
              <li className="footer-nav-item">
                <a
                  href="mailto:giotech.telefonia@gmail.com?subject=PQRS%20GIO%20TECH"
                  className="footer-nav-link"
                >
                  <i className="bi bi-envelope-at me-2 footer-link-icon" aria-hidden="true"></i>
                  <span>Canal de PQRS / Soporte</span>
                </a>
              </li>
            </ul>
          </Col>

          {/* Columna 3: Sede Puerto Asís */}
          <Col xs={12} sm={6} md={4} className="footer-col">
            <h3 className="footer-col-heading">Sede Puerto Asís</h3>
            <div className="footer-location-info">
              <div className="footer-location-row mb-2">
                <i className="bi bi-geo-alt me-2 text-danger flex-shrink-0 mt-1" aria-hidden="true"></i>
                <a
                  href={DEFAULT_MAPS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-address-link"
                  title="Ver en Google Maps"
                >
                  <span>{businessAddress}</span>
                  <i className="bi bi-box-arrow-up-right ms-1 footer-external-icon" aria-hidden="true"></i>
                </a>
              </div>
              <div className="footer-location-row mb-2">
                <i className="bi bi-clock me-2 text-muted flex-shrink-0 mt-1" aria-hidden="true"></i>
                <span className="footer-location-text">Lunes a Sábado: 8:00 AM - 7:00 PM</span>
              </div>
              {phoneNumber && (
                <div className="footer-location-row mb-2">
                  <i className="bi bi-telephone me-2 text-muted flex-shrink-0 mt-1" aria-hidden="true"></i>
                  <a href={`tel:${phoneNumber}`} className="footer-phone-link">
                    {phoneNumber}
                  </a>
                </div>
              )}
              {whatsappNumber && (
                <div className="footer-location-row">
                  <i className="bi bi-whatsapp me-2 text-success flex-shrink-0 mt-1" aria-hidden="true"></i>
                  <a
                    href={`https://wa.me/${whatsappNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="footer-whatsapp-text-link"
                  >
                    Atención WhatsApp
                  </a>
                </div>
              )}
            </div>
          </Col>
        </Row>

        {/* Ribbon de Pagos & Financieras */}
        <div className="footer-finance-ribbon py-2 px-3 px-md-4 mb-4">
          <div className="footer-ribbon-content d-flex flex-column flex-md-row align-items-center justify-content-between gap-3">
            {/* Grupo 1: Financiación */}
            <div className="footer-ribbon-group d-flex flex-wrap align-items-center justify-content-center justify-content-md-start gap-2">
              <span className="footer-ribbon-title">Financiación:</span>
              <div className="footer-partner-logos d-flex flex-wrap align-items-center justify-content-center gap-2">
                <div className="finance-logo-card" title="Sistecrédito">
                  <img src="/logoscredito/sistecredito.webp" alt="Sistecrédito" className="finance-logo-img" loading="lazy" />
                </div>
                <div className="finance-logo-card" title="Esmiopción">
                  <img src="/logoscredito/esmiopcion.webp" alt="Esmiopción" className="finance-logo-img" loading="lazy" />
                </div>
                <div className="finance-logo-card" title="PayJoy">
                  <img src="/logoscredito/pajoy.webp" alt="PayJoy" className="finance-logo-img" loading="lazy" />
                </div>
                <div className="finance-logo-card" title="Krediya">
                  <img src="/logoscredito/krediya.webp" alt="Krediya" className="finance-logo-img" loading="lazy" />
                </div>
                <div className="finance-logo-card" title="Celya">
                  <img src="/logoscredito/celya.webp" alt="Celya" className="finance-logo-img" loading="lazy" />
                </div>
              </div>
            </div>

            {/* Grupo 2: Medios de Pago */}
            <div className="footer-ribbon-group d-flex flex-wrap align-items-center justify-content-center justify-content-md-end gap-2">
              <span className="footer-ribbon-title">Medios de Pago:</span>
              <div className="footer-payment-chips d-flex flex-wrap align-items-center justify-content-center gap-2">
                <span className="payment-chip">
                  <i className="bi bi-phone text-primary me-1" aria-hidden="true"></i>Nequi
                </span>
                <span className="payment-chip">
                  <i className="bi bi-bank text-warning me-1" aria-hidden="true"></i>Bancolombia
                </span>
                <span className="payment-chip">
                  <i className="bi bi-cash-stack text-success me-1" aria-hidden="true"></i>Efectivo en Tienda
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Sub-footer Minimalista */}
        <div className="footer-bottom pt-3 border-top">
          <p className="footer-copy-text mb-0 text-center">
            &copy; {currentYear} <strong>{businessName}</strong> · Puerto Asís, Putumayo. Todos los derechos reservados.
          </p>
        </div>
      </Container>
    </footer>
  );
};

export default Footer;
