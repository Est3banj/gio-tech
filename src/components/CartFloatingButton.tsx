// src/components/CartFloatingButton.tsx
import React, { useState } from 'react';
import { Button, Offcanvas, ListGroup, Form } from 'react-bootstrap';
import { useCart } from '../contexts/cart-context';
import { useWhatsappNumber } from '../contexts/whatsapp-number-context';
import { formatPrice } from '../utils/formatters';
import { trackLead } from '../utils/metaPixel';
import { buildCartWhatsAppMessage, buildWhatsAppUrl } from '../utils/whatsapp-messages';

const MUNICIPIOS_PUTUMAYO = [
  'Puerto Asís',
  'Mocoa',
  'Orito',
  'Valle del Guamuez (La Hormiga)',
  'Villagarzón',
  'Puerto Caicedo',
  'Puerto Guzmán',
  'Sibundoy',
  'San Francisco',
  'Santiago',
  'Colón',
  'San Miguel',
  'Otro / Fuera de Putumayo',
];

const CartFloatingButton: React.FC = () => {
  const {
    cartItems,
    removeFromCart,
    incrementQuantity,
    decrementQuantity,
    clearCart,
    cartCount,
  } = useCart();
  const phoneNumber = useWhatsappNumber();
  const [show, setShow] = useState(false);
  const [nombreCliente, setNombreCliente] = useState('');
  const [municipioCliente, setMunicipioCliente] = useState('Puerto Asís');
  const [otroMunicipio, setOtroMunicipio] = useState('');

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  const municipioFinal = municipioCliente === 'Otro / Fuera de Putumayo'
    ? (otroMunicipio.trim() || 'Fuera de Putumayo')
    : municipioCliente;

  const totalContadoEstimado = cartItems.reduce(
    (sum, item) => sum + ((item.contado || 0) * (item.cantidad || 1)),
    0
  );

  const handleSendToWhatsapp = () => {
    if (cartItems.length > 0) {
      // Valor del lead calculado sobre el total de contado acumulado con cantidades
      const totalValue = totalContadoEstimado;
      const totalUnits = cartItems.reduce((sum, item) => sum + (item.cantidad || 1), 0);

      trackLead({
        content_type: 'product',
        content_ids: cartItems.map(item => item.productId),
        value: totalValue,
        num_items: totalUnits,
        currency: 'COP',
      });
    } else {
      trackLead();
    }
    handleClose();
  };

  const whatsappMessage = buildCartWhatsAppMessage(cartItems, {
    nombre: nombreCliente,
    municipio: municipioFinal,
  });

  const whatsappUrl = phoneNumber
    ? buildWhatsAppUrl(phoneNumber, whatsappMessage)
    : '#';

  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          .floating-cart-btn {
            bottom: 20px !important;
            right: 18px !important;
            width: 48px !important;
            height: 48px !important;
            font-size: 1.25rem !important;
          }
        }
        .cart-item-qty-btn {
          width: 28px;
          height: 28px;
          padding: 0;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          font-weight: bold;
        }
        .cart-item-qty-badge {
          min-width: 26px;
          text-align: center;
          font-weight: 700;
          font-size: 0.9rem;
        }
      `}</style>
      <Button
        variant="danger"
        className="floating-cart-btn rounded-circle shadow-lg"
        onClick={handleShow}
        aria-label={`Ver carrito de cotización (${cartCount} productos)`}
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
          borderColor: 'var(--gio-red)',
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

      <Offcanvas show={show} onHide={handleClose} placement="end" style={{ maxWidth: '420px', width: '100%' }}>
        <Offcanvas.Header closeButton className="border-bottom">
          <Offcanvas.Title className="fw-bold fs-5">
            <i className="bi bi-cart3 me-2 text-danger"></i> Tu Carrito ({cartCount})
          </Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body className="d-flex flex-column p-3">
          {cartCount === 0 ? (
            <div className="text-center text-muted flex-grow-1 d-flex flex-column align-items-center justify-content-center">
              <i className="bi bi-cart-x text-muted mb-3" style={{ fontSize: '3rem' }}></i>
              <p className="mb-0 fw-semibold">Tu carrito de cotización está vacío.</p>
              <small className="text-muted">¡Añadí algunos productos del catálogo para cotizar!</small>
            </div>
          ) : (
            <>
              {/* Lista de productos */}
              <ListGroup className="flex-grow-1 overflow-auto mb-3 pe-1" variant="flush">
                {cartItems.map(item => {
                  const qty = item.cantidad || 1;
                  const itemSubtotal = (item.contado || 0) * qty;

                  return (
                    <ListGroup.Item
                      key={item.itemId}
                      className="d-flex flex-column p-2 mb-2 rounded border bg-light shadow-sm"
                    >
                      <div className="d-flex align-items-center">
                        <img
                          src={item.imagen || 'https://via.placeholder.com/60x60?text=IMG'}
                          alt={item.nombre}
                          style={{
                            width: '54px',
                            height: '54px',
                            objectFit: 'contain',
                            marginRight: '12px',
                            borderRadius: '8px',
                            background: '#fff',
                            padding: '3px',
                          }}
                        />
                        <div className="flex-grow-1 me-2" style={{ minWidth: 0 }}>
                          <h6 className="mb-1 text-truncate fw-bold fs-6">{item.nombre}</h6>
                          <div className="small text-muted">
                            {item.cotizacionType === 'contado' ? (
                              <span className="text-success fw-semibold">
                                Contado: {formatPrice(item.contado)}
                              </span>
                            ) : item.solo12Meses && item.cuotas12 ? (
                              <span className="text-primary fw-semibold">
                                Crédito: 12x {formatPrice(item.cuotas12)}
                              </span>
                            ) : item.cuotas6 || item.cuotas8 ? (
                              <span className="text-primary fw-semibold">
                                Crédito: Q{formatPrice(item.cuotas6)} / M{formatPrice(item.cuotas8)}
                              </span>
                            ) : (
                              <span className="text-primary fw-semibold">Crédito a validar</span>
                            )}
                          </div>
                          {qty > 1 && (
                            <div className="small text-dark fw-bold">
                              Subtotal: {formatPrice(itemSubtotal)}
                            </div>
                          )}
                        </div>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          className="p-1"
                          style={{ width: '32px', height: '32px' }}
                          title="Eliminar producto"
                          aria-label={`Eliminar ${item.nombre}`}
                          onClick={() => removeFromCart(item.itemId)}
                        >
                          <i className="bi bi-trash"></i>
                        </Button>
                      </div>

                      {/* Controles de cantidad */}
                      <div className="d-flex align-items-center justify-content-between mt-2 pt-2 border-top">
                        <span className="small text-muted fw-semibold">Cantidad:</span>
                        <div className="d-flex align-items-center gap-1">
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            className="cart-item-qty-btn"
                            title="Disminuir cantidad"
                            aria-label="Disminuir cantidad"
                            onClick={() => decrementQuantity(item.itemId)}
                          >
                            <i className="bi bi-dash"></i>
                          </Button>
                          <span className="cart-item-qty-badge">{qty}</span>
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            className="cart-item-qty-btn"
                            title="Aumentar cantidad"
                            aria-label="Aumentar cantidad"
                            onClick={() => incrementQuantity(item.itemId)}
                          >
                            <i className="bi bi-plus"></i>
                          </Button>
                        </div>
                      </div>
                    </ListGroup.Item>
                  );
                })}
              </ListGroup>

              {/* Sección de Pre-checkout: Datos del Cliente */}
              <div className="p-3 bg-light rounded border mb-3">
                <h6 className="fw-bold mb-2 text-dark small text-uppercase letter-spacing">
                  <i className="bi bi-person-lines-fill me-1 text-primary"></i> Datos para el pedido
                </h6>
                <Form.Group className="mb-2">
                  <Form.Label className="small text-muted mb-1">Nombre del cliente</Form.Label>
                  <Form.Control
                    type="text"
                    size="sm"
                    placeholder="Tu nombre completo"
                    value={nombreCliente}
                    onChange={(e) => setNombreCliente(e.target.value)}
                    aria-label="Nombre del cliente"
                  />
                </Form.Group>
                <Form.Group>
                  <Form.Label className="small text-muted mb-1">Municipio de entrega</Form.Label>
                  <Form.Select
                    size="sm"
                    value={municipioCliente}
                    onChange={(e) => setMunicipioCliente(e.target.value)}
                    aria-label="Municipio de entrega"
                  >
                    {MUNICIPIOS_PUTUMAYO.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </Form.Select>
                  {municipioCliente === 'Otro / Fuera de Putumayo' && (
                    <Form.Control
                      type="text"
                      size="sm"
                      className="mt-2"
                      placeholder="Escribe tu ciudad o municipio"
                      value={otroMunicipio}
                      onChange={(e) => setOtroMunicipio(e.target.value)}
                      aria-label="Escribe tu ciudad o municipio"
                    />
                  )}
                </Form.Group>
              </div>

              {/* Resumen de Total y Botones de Acción */}
              <div className="mt-auto border-top pt-3">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span className="fw-semibold text-muted">Total Estimado Contado:</span>
                  <span className="fs-5 fw-bold text-danger">
                    {formatPrice(totalContadoEstimado)}
                  </span>
                </div>

                <div className="d-grid gap-2">
                  <Button
                    variant="success"
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleSendToWhatsapp}
                    className="fw-bold py-2 shadow-sm"
                    style={{ backgroundColor: 'var(--brand-green)', borderColor: 'var(--brand-green)' }}
                    disabled={!phoneNumber}
                  >
                    <i className="bi bi-whatsapp me-2"></i> Enviar Pedido a WhatsApp
                  </Button>
                  <Button variant="outline-secondary" size="sm" onClick={clearCart}>
                    Vaciar Carrito
                  </Button>
                </div>
              </div>
            </>
          )}
        </Offcanvas.Body>
      </Offcanvas>
    </>
  );
};

export default CartFloatingButton;

