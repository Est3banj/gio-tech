// src/components/ProductCard.jsx
import React, { useState } from "react";
import { Modal, Button, Card, Row, Col, Badge } from "react-bootstrap";
import { useCart } from "../contexts/CartContext";
import { useWhatsappNumber } from "../contexts/WhatsappNumberContext";

function ProductCard({ producto }) { // `phoneNumber` se obtiene del contexto, no se pasa como prop
  const [mostrar, setMostrar] = useState(false);
  const { addToCart, cartItems } = useCart();
  const safeCartItems = Array.isArray(cartItems) ? cartItems : [];
  const rawPhoneNumber = useWhatsappNumber();
  const phoneNumber = rawPhoneNumber || '573248022632'; // Asegura un número por defecto

  const abrir = () => setMostrar(true);
  const cerrar = () => setMostrar(false);

  // Helper de formato de precio
  function formatoPrecio(valor) {
    if (valor === null || typeof valor === 'undefined' || valor === '') return '—';
    const numero = typeof valor === "string" ? parseFloat(valor.replace(/\s+/g, '').replace(/,/, '.')) : Number(valor);
    if (!isNaN(numero) && Number.isFinite(numero)) {
      return numero.toLocaleString("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0,
      });
    }
    return '—';
  }

  // Desestructuración del producto
  const {
    nombre = "Producto sin nombre",
    descripcion = "",
    contado,
    cuotas6,
    cuotas8,
    imagen,
    // promo
    promoActive,
    promoPrice,
    promoLabel,
    promoStart,
    promoEnd,
    promoPriority,
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

  const priceRegularStr = formatoPrecio(contado);
  const pricePromoStr = formatoPrecio(promoPrice);

  const badgeBg = promoBadgeBg || 'var(--promo-badge-bg, #ff5722)';
  const badgeText = promoBadgeText || 'var(--promo-badge-text, #ffffff)';
  const highlightColor = (promoHighlight && String(promoHighlight).trim()) || 'var(--promo-highlight, rgba(255,87,34,.25))';

  const cuotaInicial = Number(producto?.cuotaInicial || 0);

  const mensajeWhatsAppContadoDirecto = showPromoPrice
    ? `Hola, estoy interesado en comprar el ${nombre}.\nPrecio promocional: ${pricePromoStr} (antes ${priceRegularStr}).\n¿Está disponible para entrega inmediata?`
    : `Hola, estoy interesado en comprar al contado el ${nombre}.\nPrecio: ${priceRegularStr}.\n¿Está disponible para entrega inmediata?`;

  const mensajeWhatsAppCreditoDirecto = solo12Meses && cuotas12
    ? `Hola, estoy interesado en el ${nombre} con el plan especial de 12 meses.\nPrecio ${showPromoPrice ? 'promocional' : 'contado'}: ${showPromoPrice ? pricePromoStr : priceRegularStr}\nCuota inicial: ${formatoPrecio(cuotaInicial)}\n12 cuotas mensuales: ${formatoPrecio(cuotas12)}\n¿Me pueden dar más información?`
    : `Hola, estoy interesado en el ${nombre} y me gustaría cotizarlo a crédito.\nPrecio ${showPromoPrice ? 'promocional' : 'contado'}: ${showPromoPrice ? pricePromoStr : priceRegularStr}\nCuota inicial: ${formatoPrecio(cuotaInicial)}\n16 cuotas quincenales: ${formatoPrecio(cuotas6)}\n8 cuotas mensuales: ${formatoPrecio(cuotas8)}\n¿Me pueden dar más información sobre el crédito?`;

  const isInCartContado = safeCartItems.some(item => (item.productId === producto.id || item.itemId === producto.id) && item.cotizacionType === 'contado');
  const isInCartCredito = safeCartItems.some(item => (item.productId === producto.id || item.itemId === producto.id) && item.cotizacionType === 'credito');

  return (
    <>
      <style>{`
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

        @media (max-width: 480px) {
          .gio-badge-container {
            flex-direction: column;
            align-items: flex-start;
            gap: 6px;
          }
        }

        /* ===== ESTILOS DEL MODAL ===== */
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
        
        /* Plan exclusivo 12 meses */
        .plan-special-box {
          margin-top: 1.25rem;
          padding: 1.25rem;
          background: var(--bg-hover);
          border-radius: var(--radius-md);
          border: 1.5px solid var(--brand-blue);
        }

        .plan-standard-box {
          margin-top: 1.25rem;
          padding: 1.25rem;
          background: var(--bg-hover);
          border-radius: var(--radius-md);
          border: 1px solid var(--border-subtle);
        }
      `}</style>

      <Card
        className="product-card h-100 shadow-sm position-relative"
        onClick={abrir}
        style={{
          cursor: "pointer",
          ...(showPromoBadge
            ? {
              border: `2px solid ${highlightColor}`,
              boxShadow: `0 0 0 4px ${highlightColor} inset, 0 6px 18px rgba(0,0,0,.06)`
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
                color: '#ffffff',
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
                color: promoBadgeText || badgeText,
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
              <Card.Title className="product-card-title mb-0">{nombre}</Card.Title>
            </div>

            {showPromoPrice ? (
              <>
                <Card.Text className="text-muted mb-0"><del>{priceRegularStr}</del></Card.Text>
                <Card.Text className="product-card-price fw-bold fs-5 mb-0" style={{ color: 'var(--gio-red)' }}>
                  {pricePromoStr}
                </Card.Text>
                <Card.Text className="text-muted small">Precio promocional</Card.Text>
              </>
            ) : (
              <>
                <Card.Text className="product-card-price fw-bold text-primary fs-5 mb-0">
                  {priceRegularStr}
                </Card.Text>
                <Card.Text className="text-muted small">Precio al contado</Card.Text>
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
              background: 'linear-gradient(135deg, var(--gio-red), var(--gio-red-dark))',
              color: 'var(--text-white)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              padding: '11px 20px',
              fontSize: '0.9rem',
              fontWeight: '600',
              letterSpacing: '0.01em',
              cursor: 'pointer',
              transition: 'all var(--trans-base)',
              width: '100%',
              fontFamily: 'inherit',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = 'var(--shadow-red)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            Ver detalles
          </button>
        </Card.Body>
      </Card>

      <Modal show={mostrar} onHide={cerrar} centered>
        <Modal.Header closeButton>
          <Modal.Title>{nombre}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p style={{ fontSize: '0.95rem' }}>{descripcion && descripcion.trim() !== "" ? descripcion : "Sin descripción."}</p>

          {showPromoPrice ? (
            <>
              <p className="mb-2"><strong>Precio regular:</strong> <del>{priceRegularStr}</del></p>
              <p className="mb-3"><strong>Precio promocional:</strong> <span style={{ color: 'var(--gio-red)', fontSize: '1.15em' }}>{pricePromoStr}</span> {promoLabel ? <span className="badge ms-2" style={{ backgroundColor: promoBadgeBg || badgeBg, color: promoBadgeText || badgeText }}>{promoLabel}</span> : null}</p>
            </>
          ) : (
            <p className="mb-3"><strong>Precio contado:</strong> <span style={{ color: 'var(--gio-red)', fontSize: '1.15em' }}>{priceRegularStr}</span></p>
          )}

          {cuotaInicial > 0 && (
            <p className="mb-2"><strong>Cuota inicial:</strong> {formatoPrecio(cuotaInicial)}</p>
          )}

          {solo12Meses && cuotas12 ? (
            <div className="plan-special-box">
              <div className="text-center mb-2">
                <Badge bg="info" style={{ fontSize: '0.85rem', padding: '7px 16px', borderRadius: '8px', letterSpacing: '0.03em' }}>
                  PLAN ESPECIAL
                </Badge>
              </div>
              <p className="mb-0 text-center" style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--brand-blue)' }}>
                12 cuotas mensuales de {formatoPrecio(cuotas12)}
              </p>
            </div>
          ) : (
            <div className="plan-standard-box">
              <p className="mb-2"><strong>16 cuotas quincenales:</strong> <span style={{ fontSize: '1.1em', color: 'var(--text-primary)' }}>{formatoPrecio(cuotas6)}</span></p>
              <p className="mb-0"><strong>8 cuotas mensuales:</strong> <span style={{ fontSize: '1.1em', color: 'var(--text-primary)' }}>{formatoPrecio(cuotas8)}</span></p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="d-flex flex-column">
          <h6 className="modal-section-title">💬 Asesoría Directa por WhatsApp</h6>
          <Row className="g-3 w-100 mb-4">
            <Col xs={12} md={6}>
              <Button
                onClick={() => phoneNumber && window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(mensajeWhatsAppContadoDirecto)}`, "_blank")}
                className="w-100 btn-whatsapp-primary"
              >
                <i className="bi bi-whatsapp me-2"></i> Comprar Contado
              </Button>
            </Col>
            <Col xs={12} md={6}>
              <Button
                onClick={() => phoneNumber && window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(mensajeWhatsAppCreditoDirecto)}`, "_blank")}
                className="w-100 btn-whatsapp-secondary"
              >
                <i className="bi bi-whatsapp me-2"></i> Cotizar Crédito
              </Button>
            </Col>
          </Row>

          <p className="modal-section-subtitle">O añade al carrito para comparar después:</p>
          <Row className="g-2 w-100 mb-3">
            <Col xs={12} md={6}>
              <Button
                onClick={() => { addToCart(producto, 'contado'); cerrar(); }}
                className="w-100 btn-cart-outline"
                disabled={isInCartContado}
              >
                {isInCartContado ? '✓ Añadido (Contado)' : <><i className="bi bi-cart-plus me-2"></i> Añadir (Contado)</>}
              </Button>
            </Col>
            <Col xs={12} md={6}>
              <Button
                onClick={() => { addToCart(producto, 'credito'); cerrar(); }}
                className="w-100 btn-cart-outline"
                disabled={isInCartCredito}
              >
                {isInCartCredito ? '✓ Añadido (Crédito)' : <><i className="bi bi-credit-card me-2"></i> Añadir (Crédito)</>}
              </Button>
            </Col>
          </Row>

          <Button variant="secondary" onClick={cerrar} className="mt-3 w-100">
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default ProductCard;