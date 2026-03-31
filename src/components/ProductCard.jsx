// src/components/ProductCard.jsx
import React, { useState } from "react";
import { Modal, Button, Card, Row, Col, Badge } from "react-bootstrap";
import { useCart } from "../contexts/CartContext";
import { useWhatsappNumber } from "../contexts/WhatsappNumberContext";
import { formatPrice } from "../utils/formatters";

function ProductCard({ producto }) { // `phoneNumber` se obtiene del contexto, no se pasa como prop
  const [mostrar, setMostrar] = useState(false);
  const [tipoSeleccionado, setTipoSeleccionado] = useState(null); // null, 'comprar', 'carrito'
  const { addToCart } = useCart();
  const rawPhoneNumber = useWhatsappNumber();
  const phoneNumber = rawPhoneNumber || '573248022632'; // Asegura un número por defecto

  const abrir = () => { setMostrar(true); setTipoSeleccionado(null); };
  const cerrar = () => { setMostrar(false), setTipoSeleccionado(null); };

  // Desestructuración del producto
  const {
    nombre = "Producto sin nombre",
    descripcion = "",
    contado,
    cuotas6,
    cuotas8,
    imagen,
    // promo
    promoPrice,
    promoLabel,
    promoStart,
    promoEnd,
    promoBadgeBg,
    promoBadgeText,
    promoHighlight,
    // nuevo + display
    nuevo,
    nuevoBadgeText,
    nuevoBadgeBg,
    badgeMode,
    // financiación 12 meses
    solo12Meses,
    cuotas12,
  } = producto || {};

  // Compatibilidad promo flag
  const effectivePromoActive = (producto?.promoActive !== undefined ? producto.promoActive
    : (producto?.promo !== undefined ? producto.promo
      : undefined));

  // Helpers promo timing
  const getMillis = (ts) => {
    if (!ts) return null;
    if (typeof ts === 'number') return ts;
    if (typeof ts?.toMillis === 'function') return ts.toMillis();
    const n = +new Date(ts);
    return Number.isFinite(n) ? n : null;
  };
  const nowMs = Date.now();
  const startMs = getMillis(promoStart);
  const endMs = getMillis(promoEnd);
  const inWindow = (!startMs || nowMs >= startMs) && (!endMs || nowMs <= endMs);

  // Validez precio promo (solo para mostrar precio promocional)
  const countedPromoPrice = Number(promoPrice);
  const countedContado = Number(contado);
  const hasPromoPrice = Number.isFinite(countedPromoPrice) && countedPromoPrice > 0 && Number.isFinite(countedContado) && countedContado > 0 && countedPromoPrice < countedContado;

  // Modo de badges y flags de visibilidad (separado: badge vs precio)
  const effectiveBadgeMode = badgeMode || 'promo';
  const showPromoBadge = (effectiveBadgeMode === 'promo' || effectiveBadgeMode === 'ambos') && !!effectivePromoActive && inWindow;
  const showNuevoBadge = (effectiveBadgeMode === 'nuevo' || effectiveBadgeMode === 'ambos') && !!nuevo;

  // Si hay precio promo válido, mostrar precio promo en UI
  const showPromoPrice = hasPromoPrice && inWindow && !!effectivePromoActive;

  const priceRegularStr = formatPrice(contado);
  const pricePromoStr = formatPrice(promoPrice);

  const badgeBg = promoBadgeBg || 'var(--promo-badge-bg, #ff5722)';
  const highlightColor = (promoHighlight && String(promoHighlight).trim()) || 'var(--promo-highlight, rgba(255,87,34,.25))';

  const cuotaInicial = Number(producto?.cuotaInicial || 0);

  const mensajeWhatsAppContadoDirecto = showPromoPrice
    ? `Hola, estoy interesado en comprar el ${nombre}.\nPrecio promocional: ${pricePromoStr} (antes ${priceRegularStr}).\n¿Está disponible para entrega inmediata?`
    : `Hola, estoy interesado en comprar al contado el ${nombre}.\nPrecio: ${priceRegularStr}.\n¿Está disponible para entrega inmediata?`;

  const mensajeWhatsAppCreditoDirecto = solo12Meses && cuotas12
    ? `Hola, estoy interesado en el ${nombre} con el plan especial de 12 meses.\nPrecio ${showPromoPrice ? 'promocional' : 'contado'}: ${showPromoPrice ? pricePromoStr : priceRegularStr}\nCuota inicial: ${formatPrice(cuotaInicial)}\n12 cuotas mensuales: ${formatPrice(cuotas12)}\n¿Me pueden dar más información?`
    : `Hola, estoy interesado en el ${nombre} y me gustaría cotizarlo a crédito.\nPrecio ${showPromoPrice ? 'promocional' : 'contado'}: ${showPromoPrice ? pricePromoStr : priceRegularStr}\nCuota inicial: ${formatPrice(cuotaInicial)}\n16 cuotas quincenales: ${formatPrice(cuotas6)}\n8 cuotas mensuales: ${formatPrice(cuotas8)}\n¿Me pueden dar más información sobre el crédito?`;

  // Función para manejar la selección de tipo (contado o crédito)
  const handleSeleccionTipo = (tipo) => {
    if (tipoSeleccionado === 'comprar') {
      const mensaje = tipo === 'contado' ? mensajeWhatsAppContadoDirecto : mensajeWhatsAppCreditoDirecto;
      phoneNumber && window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(mensaje)}`, "_blank");
    } else if (tipoSeleccionado === 'carrito') {
      addToCart(producto, tipo);
      cerrar();
    }
  };

  return (
    <>
      <style>{`
        /* Título del modal */
        .modal-section-title {
          font-size: 1.1rem;
          font-weight: 600;
          margin-bottom: 1rem;
          text-align: center;
          color: var(--text-primary);
        }
        
        /* Contenedor de etiquetas */
        .gio-badge-container {
          position: absolute;
          top: 10px;
          left: 10px;
          right: 10px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 8px;
          pointer-events: none;
          z-index: 20;
        }
        .gio-badge-wrapper {
          pointer-events: auto;
          display: inline-block;
        }
        .gio-badge {
          padding: 6px 12px;
          border-radius: var(--radius-sm);
          font-weight: 700;
          font-size: 0.85rem;
          display: inline-block;
          box-shadow: var(--shadow-sm);
        }

        /* Animación shimmer para botón de comprar */
        @keyframes shimmer {
          0% { box-shadow: 0 0 0 0 rgba(40, 167, 69, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(40, 167, 69, 0); }
          100% { box-shadow: 0 0 0 0 rgba(40, 167, 69, 0); }
        }
        .btn-comprar-animate {
          animation: shimmer 2s infinite;
          cursor: pointer;
        }
        .btn-comprar-animate:hover {
          animation: none;
          transform: scale(1.05);
        }

        @media (max-width: 480px) {
          .gio-badge-container {
            flex-direction: column;
            align-items: flex-start;
            gap: 6px;
          }
        }

        /* ===== CORRECCIÓN PARA MODO OSCURO (MODAL) ===== */
        .modal-content {
          background-color: var(--bg-secondary) !important;
          color: var(--text-primary) !important;
          border: 1px solid var(--border-color) !important;
        }
        .modal-header, .modal-footer {
          border-color: var(--border-color) !important;
          background-color: transparent !important;
        }
        .modal-title {
          color: var(--text-primary) !important;
        }
        /* Esto asegura que la 'X' de cerrar sea blanca en modo oscuro */
        .btn-close {
          filter: var(--icon-filter, invert(0)); 
        }

        .modal-body p {
          line-height: 1.7;
          margin-bottom: 1rem;
          color: var(--text-primary);
        }
        
        .modal-body p strong {
          font-weight: 700;
          color: var(--text-primary);
          font-size: 1.05em;
        }
        
        /* Cajas de planes adaptables */
        .plan-special-box {
          margin-top: 1.25rem;
          padding: 1.25rem;
          background: var(--bg-hover);
          border-radius: var(--radius-md);
          border: 1.5px solid var(--brand-blue);
          color: var(--text-primary);
        }

        .plan-standard-box {
          margin-top: 1.25rem;
          padding: 1.25rem;
          background: var(--bg-hover);
          border-radius: var(--radius-md);
          border: 1px solid var(--border-subtle);
          color: var(--text-primary);
        }
      `}</style>

      <Card
        className="product-card h-100 shadow-sm position-relative"
        onClick={abrir}
        style={{
          cursor: "pointer",
          backgroundColor: 'var(--bg-secondary)',
          color: 'var(--text-primary)',
          border: `1px solid var(--border-color)`,
          ...(showPromoBadge
            ? {
              border: `2px solid ${highlightColor}`,
              boxShadow: `0 0 15px ${highlightColor}`
            }
            : {})
        }}
      >
        <div className="gio-badge-container" aria-hidden={!showPromoBadge && !showNuevoBadge}>
          <div className="gio-badge-wrapper" style={{ visibility: showNuevoBadge ? 'visible' : 'hidden' }}>
            <span
              className="gio-badge"
              style={{
                backgroundColor: nuevoBadgeBg || '#28a745',
                color: '#ffffff'
              }}
            >
              {nuevoBadgeText || 'NUEVO'}
            </span>
          </div>

          <div className="gio-badge-wrapper" style={{ visibility: showPromoBadge ? 'visible' : 'hidden' }}>
            <span
              className="gio-badge"
              style={{
                backgroundColor: promoBadgeBg || badgeBg,
                color: '#ffffff',
              }}
            >
              {promoLabel || promoBadgeText || 'PROMO'}
            </span>
          </div>
        </div>

        <Card.Img
          variant="top"
          src={imagen || "https://via.placeholder.com/300x300?text=Sin+imagen"}
          alt={nombre}
          className="product-card-img"
          loading="lazy"
        />
        <Card.Body className="text-center d-flex flex-column">
          <div>
            <div className="d-flex justify-content-between align-items-start mb-1">
              <Card.Title className="product-card-title mb-0" style={{ color: 'var(--text-primary)' }}>
                {nombre}
              </Card.Title>
            </div>

            {showPromoPrice ? (
              <>
                <Card.Text className="text-muted mb-0"><del>{priceRegularStr}</del></Card.Text>
                <Card.Text className="product-card-price fw-bold fs-5 mb-0" style={{ color: 'var(--gio-red)' }}>
                  {pricePromoStr}
                </Card.Text>
              </>
            ) : (
              <>
                <Card.Text className="product-card-price fw-bold fs-5 mb-0" style={{ color: 'var(--brand-blue)' }}>
                  {priceRegularStr}
                </Card.Text>
              </>
            )}
          </div>

          <button
            className="btn-ver-detalles"
            onClick={(e) => {
              e.stopPropagation();
              abrir();
            }}
            style={{
              marginTop: 'auto',
              background: 'var(--bg-hover)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              padding: '11px 20px',
              fontSize: '0.9rem',
              fontWeight: '600',
              cursor: 'pointer',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <i className="bi bi-cart-plus"></i> Ver detalles
          </button>
        </Card.Body>
      </Card >

      <Modal show={mostrar} onHide={cerrar} centered>
        <Modal.Header closeButton>
          <Modal.Title>{nombre}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p style={{ fontSize: '0.95rem' }}>{descripcion && descripcion.trim() !== "" ? descripcion : "Sin descripción."}</p>

          {showPromoPrice ? (
            <>
              <p className="mb-2"><strong>Precio regular:</strong> <del>{priceRegularStr}</del></p>
              <p className="mb-3"><strong>Precio promocional:</strong> <span style={{ color: 'var(--gio-red)', fontSize: '1.15em' }}>{pricePromoStr}</span> {promoLabel ? <span className="badge ms-2" style={{ backgroundColor: promoBadgeBg || badgeBg, color: '#fff' }}>{promoLabel}</span> : null}</p>
            </>
          ) : (
            <p className="mb-3"><strong>Precio contado:</strong> <span style={{ color: 'var(--gio-red)', fontSize: '1.15em' }}>{priceRegularStr}</span></p>
          )}

          {cuotaInicial > 0 && (
            <p className="mb-2"><strong>Cuota inicial:</strong> {formatPrice(cuotaInicial)}</p>
          )}

          {solo12Meses && cuotas12 ? (
            <div className="plan-special-box">
              <div className="text-center mb-2">
                <Badge bg="info" style={{ fontSize: '0.85rem', padding: '7px 16px', borderRadius: '8px', letterSpacing: '0.03em' }}>
                  PLAN ESPECIAL
                </Badge>
              </div>
              <p className="mb-0 text-center" style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--brand-blue)' }}>
                12 cuotas mensuales de {formatPrice(cuotas12)}
              </p>
            </div>
          ) : (
            <div className="plan-standard-box">
              <p className="mb-2"><strong>16 cuotas quincenales:</strong> <span style={{ fontSize: '1.1em', color: 'var(--text-primary)' }}>{formatPrice(cuotas6)}</span></p>
              <p className="mb-0"><strong>8 cuotas mensuales:</strong> <span style={{ fontSize: '1.1em', color: 'var(--text-primary)' }}>{formatPrice(cuotas8)}</span></p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="d-flex flex-column">
          {!tipoSeleccionado ? (
            <>
              <h6 className="modal-section-title">¿Qué quieres hacer?</h6>
              <Row className="g-3 w-100 mb-4">
                <Col xs={12} md={6}>
                  <Button
                    variant=""
                    onClick={() => setTipoSeleccionado('comprar')}
                    className="w-100 btn-comprar-animate"
                    style={{ background: '#28a745', borderColor: '#28a745', color: '#fff', padding: '15px' }}
                  >
                    <i className="bi bi-whatsapp me-2"></i> Comprar Ahora
                  </Button>
                </Col>
                <Col xs={12} md={6}>
                  <Button
                    variant=""
                    onClick={() => setTipoSeleccionado('carrito')}
                    className="w-100"
                    style={{ background: '#0d6efd', borderColor: '#0d6efd', color: '#fff', padding: '15px' }}
                  >
                    <i className="bi bi-cart-plus me-2"></i> Añadir al Carrito
                  </Button>
                </Col>
              </Row>
              <Button variant="outline-secondary" onClick={cerrar} className="mt-2 w-100" style={{ borderColor: '#6c757d', color: '#6c757d' }}>
                Cerrar
              </Button>
            </>
          ) : (
            <>
              <h6 className="modal-section-title">
                {tipoSeleccionado === 'comprar' ? '💬 Elige cómo pagar:' : '🛒 Elige cómo pagar:'}
              </h6>
              <Row className="g-3 w-100 mb-4">
                <Col xs={12} md={6}>
                  <Button
                    variant=""
                    onClick={() => handleSeleccionTipo('contado')}
                    className="w-100"
                    style={{ background: '#28a745', borderColor: '#28a745', color: '#fff', padding: '15px' }}
                  >
                    <i className="bi bi-cash me-2"></i> Contado
                  </Button>
                </Col>
                <Col xs={12} md={6}>
                  <Button
                    variant=""
                    onClick={() => handleSeleccionTipo('credito')}
                    className="w-100"
                    style={{ background: '#0d6efd', borderColor: '#0d6efd', color: '#fff', padding: '15px' }}
                  >
                    <i className="bi bi-credit-card me-2"></i> Crédito
                  </Button>
                </Col>
              </Row>
              <Button variant="outline-secondary" onClick={() => setTipoSeleccionado(null)} className="mt-2 w-100">
                ← Volver
              </Button>
            </>
          )}
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default ProductCard;