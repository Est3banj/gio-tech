// src/components/Footer.jsx
import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';

const Footer = () => {
  const phoneNumber = '573248022632'; // Tu número de WhatsApp aquí
  // Reemplaza con la URL real de tu página de Facebook
  const facebookPageUrl = 'https://www.facebook.com/share/1CUYUF25YF/?mibextid=wwXIfr';
  // Reemplaza con tu dirección física
  const businessAddress = 'Calle 32 #13-36,B-Camilo Torres, Puerto Asís, Putumayo.';

  return (
    <footer className="gio-footer mt-auto">
      <Container>
        <Row className="justify-content-center">
          <Col md={10} lg={8} className="text-center">

            {/* Redes sociales */}
            <div className="mb-3">
              <a
                href={facebookPageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="social-icon icon-facebook"
                aria-label="Facebook"
              >
                <i className="bi bi-facebook"></i>
              </a>
              <a
                href={`https://wa.me/${phoneNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="social-icon icon-whatsapp"
                aria-label="WhatsApp"
              >
                <i className="bi bi-whatsapp"></i>
              </a>
            </div>

            {/* Info de contacto */}
            <div className="footer-contact mb-3">
              <p className="mb-1">
                <i className="bi bi-geo-alt-fill me-2" style={{ color: 'var(--gio-red)' }}></i>
                {businessAddress}
              </p>
              <p className="mb-1">
                <i className="bi bi-telephone-fill me-2" style={{ color: 'var(--gio-red)' }}></i>
                <a href={`tel:${phoneNumber}`} className="text-white text-decoration-none" style={{ opacity: 0.75 }}>{phoneNumber}</a>
              </p>
            </div>

            {/* Links legales */}
            <p className="mb-2" style={{ fontSize: '0.8rem' }}>
              <a href="#" className="footer-link mx-2">Términos y Condiciones</a>
              <span style={{ color: 'var(--border-color)' }}>|</span>
              <a href="#" className="footer-link mx-2">Política de Privacidad</a>
            </p>

            {/* Copyright */}
            <p className="footer-copy mb-0">
              &copy; {new Date().getFullYear()} GIO TECH. Todos los derechos reservados.
            </p>

          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;