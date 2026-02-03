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
    <footer className="bg-dark text-white mt-auto py-3">
      <Container>
        <Row className="justify-content-center"> {/* Centrar contenido del footer */}
          <Col md={10} lg={8} className="text-center">
            <p className="mb-2">&copy; {new Date().getFullYear()} GIO TECH. Todos los derechos reservados.</p>
            
            <p className="mb-3">
              <a href="#" className="text-white mx-2 text-decoration-none">Términos y Condiciones</a> |
              <a href="#" className="text-white mx-2 text-decoration-none">Política de Privacidad</a>
            </p>

            {/* INFORMACIÓN DE CONTACTO ADICIONAL */}
            <div className="contact-info mb-3">
              <p className="mb-1">
                <i className="bi bi-geo-alt-fill me-2"></i> {/* Ícono de ubicación */}
                Dirección: {businessAddress}
              </p>
              <p className="mb-1">
                <i className="bi bi-telephone-fill me-2"></i> {/* Ícono de teléfono */}
                Teléfono: <a href={`tel:${phoneNumber}`} className="text-white text-decoration-none">{phoneNumber}</a>
              </p>
            </div>

            {/* SECCIÓN DE REDES SOCIALES */}
            <div className="social-icons mb-2">
              <a href={facebookPageUrl} target="_blank" rel="noopener noreferrer" className="text-white mx-2 fs-4">
                <i className="bi bi-facebook"></i> {/* Ícono de Facebook */}
              </a>
              <a href={`https://wa.me/${phoneNumber}`} target="_blank" rel="noopener noreferrer" className="text-white mx-2 fs-4">
                <i className="bi bi-whatsapp"></i> {/* Ícono de WhatsApp */}
              </a>
            </div>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;