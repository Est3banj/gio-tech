// src/components/CartFloatingButton.tsx
import React, { useState } from 'react';
import { Button, Offcanvas, ListGroup } from 'react-bootstrap';
import { useCart } from '../contexts/CartContext';
import { useWhatsappNumber } from '../contexts/WhatsappNumberContext';
import { formatPrice } from '../utils/formatters';
import { trackPurchase, trackLead } from '../utils/metaPixel';

const CartFloatingButton: React.FC = () => {
  const { cartItems, removeFromCart, clearCart, cartCount } = useCart();
  const phoneNumber = useWhatsappNumber();
  const [show, setShow] = useState(false);
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  const generarMensajeLista = (): string => {
    if (cartItems.length === 0) {
      return encodeURIComponent("Hola, estoy contactando a GIO TECH. No tengo productos en mi lista de interés.");
    }

    let mensaje = "Hola, estoy interesado en los siguientes productos de GIO TECH:\n\n";
    cartItems.forEach((item, index) => {
      const precioInfo = item.cotizacionType === 'contado'
        ? `Precio al contado: ${formatPrice(item.contado)}`
        : `Cotizar a crédito (Cuotas: Q${formatPrice(item.cuotas6)} / M${formatPrice(item.cuotas8)})`;

      mensaje += `${index + 1}. ${item.nombre} - ${precioInfo}\n`;
    });
    mensaje += "\n¿Podrían darme más información y opciones de compra para estos productos?";
    return encodeURIComponent(mensaje);
  };

  const handleSendToWhatsapp = () => {
    if (cartItems.length > 0) {
      trackPurchase(cartItems);
    }
    trackLead();
    handleClose();
  };

  return (
    <>
      <Button
        variant="danger"
        className="floating-cart-btn rounded-circle shadow-lg"
        onClick={handleShow}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          width: '60px',
          height: '60px',
          fontSize: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1050,
          backgroundColor: 'var(--gio-red)',
          borderColor: 'var(--gio-red)'
        }}
      >
        <i className="bi bi-cart"></i>
        {cartCount > 0 && (
          <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger border border-light">
            {cartCount}
            <span className="visually-hidden">productos en lista</span>
          </span>
        )}
      </Button>

      <Offcanvas show={show} onHide={handleClose} placement="end">
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>Tu Carrito de Intereses ({cartCount})</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body className="d-flex flex-column">
          {cartCount === 0 ? (
            <p className="text-center text-muted flex-grow-1 d-flex align-items-center justify-content-center">
              Tu carrito está vacío. ¡Añade algunos productos!
            </p>
          ) : (
            <>
              <ListGroup className="flex-grow-1 overflow-auto">
                {cartItems.map(item => (
                  <ListGroup.Item key={item.itemId} className="d-flex align-items-center mb-2 p-2">
                    <img 
                      src={item.imagen || "https://via.placeholder.com/50x50?text=IMG"} 
                      alt={item.nombre} 
                      style={{ width: '50px', height: '50px', objectFit: 'contain', marginRight: '10px' }} 
                    />
                    <div className="flex-grow-1">
                      <h6 className="mb-0">{item.nombre}</h6>
                      <small className="text-muted">
                        {item.cotizacionType === 'contado'
                          ? `Opción: Contado (${formatPrice(item.contado)})`
                          : `Opción: Crédito (Cuotas: Q${formatPrice(item.cuotas6)} / M${formatPrice(item.cuotas8)})`}
                      </small>
                    </div>
                    <Button variant="outline-danger" size="sm" onClick={() => removeFromCart(item.itemId)}>
                      <i className="bi bi-trash"></i>
                    </Button>
                  </ListGroup.Item>
                ))}
              </ListGroup>

              <div className="mt-auto d-grid gap-2 p-2 border-top">
                <Button
                  variant="success"
                  href={phoneNumber ? `https://wa.me/${phoneNumber}?text=${generarMensajeLista()}` : '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleSendToWhatsapp}
                  className="fw-bold py-2"
                  style={{ backgroundColor: 'var(--brand-green)', borderColor: 'var(--brand-green)' }}
                  disabled={!phoneNumber}
                >
                  <i className="bi bi-whatsapp me-2"></i> Enviar Cotización
                </Button>
                <Button variant="outline-secondary" onClick={clearCart}>
                  Vaciar Carrito
                </Button>
              </div>
            </>
          )}
        </Offcanvas.Body>
      </Offcanvas>
    </>
  );
};

export default CartFloatingButton;
