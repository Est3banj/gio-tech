// src/components/ProductCard.tsx
import React, { useState, useEffect } from "react";
import { Modal, Button, Card, Row, Col, Badge } from "react-bootstrap";
import { useCart } from "../contexts/CartContext";
import { useWhatsappNumber } from "../contexts/WhatsappNumberContext";
import { formatPrice } from "../utils/formatters";
import { recordProductView } from "../services/productStats.service";
import { FINANCIERAS, getFinancierasForProduct } from "../data/financieras";
import type { Product, CotizacionType, Financiera } from "../types";

interface ProductCardProps {
  producto: Product;
  isPopular?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({ producto, isPopular = false }) => {
  const [mostrar, setMostrar] = useState(false);
  const [step, setStep] = useState<'product' | 'payment' | 'credito-financieras' | 'credito-form'>('product');
  const [paymentAction, setPaymentAction] = useState<'comprar' | 'carrito'>('comprar');
  const [selectedFinanciera, setSelectedFinanciera] = useState<Financiera | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [linkOpened, setLinkOpened] = useState(false);
  const { addToCart } = useCart();
  const rawPhoneNumber = useWhatsappNumber();
  const phoneNumber = rawPhoneNumber || '573248022632';

  // Registrar vista del producto
  useEffect(() => {
    if (producto?.id) {
      recordProductView(producto.id);
    }
  }, [producto?.id]);

  const abrir = () => { setMostrar(true); setStep('product'); };
  const cerrar = () => {
    setMostrar(false);
    setStep('product');
    setSelectedFinanciera(null);
    setFormData({});
    setLinkOpened(false);
  };

  const {
    nombre = "Producto sin nombre",
    descripcion = "",
    contado,
    cuotas6,
    cuotas8,
    imagen,
    promoPrice,
    promoBadgeBg,
    promoBadgeText,
    promoHighlight,
    nuevo,
    nuevoBadgeText,
    nuevoBadgeBg,
    badgeMode,
    solo12Meses,
    cuotas12,
  } = producto || {};

  const productAny = producto as unknown as Record<string, unknown>;
  const promoStart = productAny.promoStart;
  const promoEnd = productAny.promoEnd;

  const effectivePromoActive = producto?.promo;

  const getMillis = (ts: unknown): number | null => {
    if (!ts) return null;
    if (typeof ts === 'number') return ts;
    if (typeof ts === 'object' && ts !== null && 'toMillis' in ts && typeof (ts as { toMillis: () => number }).toMillis === 'function') {
      return (ts as { toMillis: () => number }).toMillis();
    }
    const n = +new Date(ts as string | number);
    return Number.isFinite(n) ? n : null;
  };

  const nowMs = Date.now();
  const startMs = getMillis(promoStart);
  const endMs = getMillis(promoEnd);
  const inWindow = (!startMs || nowMs >= startMs) && (!endMs || nowMs <= endMs);

  const countedPromoPrice = Number(promoPrice);
  const countedContado = Number(contado);
  const hasPromoPrice = Number.isFinite(countedPromoPrice) && countedPromoPrice > 0 && Number.isFinite(countedContado) && countedContado > 0 && countedPromoPrice < countedContado;

  const effectiveBadgeMode = badgeMode || 'promo';
  const showPromoBadge = (effectiveBadgeMode === 'promo' || effectiveBadgeMode === 'ambos') && !!effectivePromoActive && inWindow;
  const showNuevoBadge = (effectiveBadgeMode === 'nuevo' || effectiveBadgeMode === 'ambos') && !!nuevo;

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

  const financierasDisponibles = getFinancierasForProduct(producto.marca, producto.categoria);

  const handleSeleccionTipo = (tipo: CotizacionType) => {
    if (tipo === 'contado') {
      if (paymentAction === 'comprar') {
        if (phoneNumber) {
          window.open(
            `https://wa.me/${phoneNumber}?text=${encodeURIComponent(mensajeWhatsAppContadoDirecto)}`,
            '_blank'
          );
        }
      } else {
        addToCart(producto, tipo);
        cerrar();
      }
    } else {
      setStep('credito-financieras');
    }
  };

  const handleSelectFinanciera = (financiera: Financiera) => {
    setSelectedFinanciera(financiera);
    setFormData({});
    setLinkOpened(false);
    setStep('credito-form');
  };

  const handleFieldChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const isFormValid = (): boolean => {
    if (!selectedFinanciera) return false;
    for (const campo of selectedFinanciera.campos) {
      if (campo.required && !formData[campo.name]?.trim()) return false;
    }
    return true;
  };

  const handleEnviarWhatsApp = () => {
    if (!selectedFinanciera) return;

    const lineLabel = (key: string): string => {
      const labels: Record<string, string> = {
        nombres: 'Nombres y apellidos',
        cedula: 'Cédula',
        fechaNacimiento: 'Fecha y lugar de nacimiento',
        fechaExpedicion: 'Fecha y lugar de expedición',
        celular: 'Celular',
        email: 'Correo electrónico',
        compradoAntes: '¿Ha comprado antes?',
        reportesNegativos: '¿Reportes negativos?',
      };
      return labels[key] || key;
    };

    let mensaje = `🧾 *Solicitud de crédito - ${selectedFinanciera.nombre}*\n\n`;
    mensaje += `📱 *Producto:* ${nombre}\n`;
    mensaje += `💰 *Precio:* ${showPromoPrice ? pricePromoStr : priceRegularStr}\n`;
    if (cuotaInicial > 0) mensaje += `💵 *Cuota inicial:* ${formatPrice(cuotaInicial)}\n`;
    if (solo12Meses && cuotas12) {
      mensaje += `📆 *12 cuotas mensuales:* ${formatPrice(cuotas12)}\n`;
    } else {
      mensaje += `📆 *16 cuotas quincenales:* ${formatPrice(cuotas6)}\n`;
      mensaje += `📆 *8 cuotas mensuales:* ${formatPrice(cuotas8)}\n`;
    }
    mensaje += `\n👤 *Datos del cliente:*\n`;
    for (const [key, value] of Object.entries(formData)) {
      mensaje += `▸ ${lineLabel(key)}: ${value}\n`;
    }

    if (phoneNumber) {
      window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(mensaje)}`, '_blank');
    }
    if (paymentAction === 'carrito') {
      addToCart(producto, 'credito');
    }
    cerrar();
  };

  return (
    <>
      <style>{`
        .modal-section-title {
          font-size: 1.1rem;
          font-weight: 600;
          margin-bottom: 1rem;
          text-align: center;
          color: var(--text-primary);
        }
        
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

        .financiera-card {
          background: var(--bg-hover);
          border: 2px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 1rem;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: center;
        }
        .financiera-card:hover {
          border-color: var(--brand-blue);
          box-shadow: 0 0 12px rgba(13, 110, 253, 0.15);
          transform: translateY(-2px);
        }
        .financiera-card img {
          max-height: 48px;
          max-width: 100%;
          object-fit: contain;
          margin-bottom: 0.5rem;
        }
        .financiera-card .financiera-name {
          font-weight: 600;
          font-size: 0.9rem;
          color: var(--text-primary);
        }
        .financiera-card .financiera-badge {
          font-size: 0.75rem;
          padding: 2px 8px;
          border-radius: 20px;
          display: inline-block;
          margin-top: 4px;
        }
        .badge-autovalidacion {
          background: #fff3cd;
          color: #856404;
        }
        .badge-asesor {
          background: #d1e7dd;
          color: #0f5132;
        }
        .financiera-card-disabled {
          opacity: 0.45;
          cursor: not-allowed !important;
          filter: grayscale(0.8);
          border-color: var(--border-subtle, #e0e0e0) !important;
        }
        .financiera-card-disabled:hover {
          transform: none !important;
          box-shadow: none !important;
          border-color: var(--border-subtle, #e0e0e0) !important;
        }
        .autovalidacion-note {
          font-size: 0.85rem;
          color: var(--text-muted);
          background: var(--bg-hover);
          padding: 0.75rem 1rem;
          border-radius: var(--radius-sm);
          border: 1px dashed var(--border-color);
          margin-top: 0.5rem;
        }

        .form-field-group {
          margin-bottom: 1rem;
        }
        .form-field-group label {
          font-weight: 600;
          font-size: 0.9rem;
          color: var(--text-primary);
          margin-bottom: 0.35rem;
          display: block;
        }
        .form-field-group input,
        .form-field-group select {
          width: 100%;
          padding: 0.6rem 0.75rem;
          border: 1.5px solid var(--border-color);
          border-radius: var(--radius-sm);
          background: var(--bg-secondary);
          color: var(--text-primary);
          font-size: 0.95rem;
        }
        .form-field-group input:focus {
          outline: none;
          border-color: var(--brand-blue);
          box-shadow: 0 0 0 3px rgba(13, 110, 253, 0.15);
        }
        .radio-group {
          display: flex;
          gap: 1rem;
          margin-top: 0.25rem;
        }
        .radio-group label {
          font-weight: 400;
          display: flex;
          align-items: center;
          gap: 0.35rem;
          cursor: pointer;
        }

        @media (max-width: 480px) {
          .gio-badge-container {
            flex-direction: column;
            align-items: flex-start;
            gap: 6px;
          }
        }

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
              {promoBadgeText || 'PROMO'}
            </span>
          </div>

          {isPopular && (
            <div className="gio-badge-wrapper">
              <span
                className="gio-badge"
                style={{
                  backgroundColor: '#ff6b35',
                  color: '#ffffff',
                }}
              >
                🔥 HOT
              </span>
            </div>
          )}
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
              <Card.Text className="product-card-price fw-bold fs-5 mb-0" style={{ color: 'var(--brand-blue)' }}>
                {priceRegularStr}
              </Card.Text>
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
      </Card>

      <Modal show={mostrar} onHide={cerrar} centered>
        <Modal.Header closeButton>
          <Modal.Title>{nombre}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {/* ─── Step: product | payment — show product info ─── */}
          {(step === 'product' || step === 'payment') && (
            <>
              <p style={{ fontSize: '0.95rem' }}>{descripcion && descripcion.trim() !== "" ? descripcion : "Sin descripción."}</p>

              {showPromoPrice ? (
                <>
                  <p className="mb-2"><strong>Precio regular:</strong> <del>{priceRegularStr}</del></p>
                  <p className="mb-3"><strong>Precio promocional:</strong> <span style={{ color: 'var(--gio-red)', fontSize: '1.15em' }}>{pricePromoStr}</span> {promoBadgeText ? <span className="badge ms-2" style={{ backgroundColor: promoBadgeBg || badgeBg, color: '#fff' }}>{promoBadgeText}</span> : null}</p>
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
            </>
          )}

          {/* ─── Step: credito-financieras — pick a financiera ─── */}
          {step === 'credito-financieras' && (
            <>
              <h6 className="modal-section-title">Elige una financiera</h6>
              <Row className="g-3">
                {FINANCIERAS.map((f) => {
                  const isAvailable = financierasDisponibles.some((df) => df.id === f.id);
                  return (
                    <Col xs={6} key={f.id}>
                      <div
                        className={`financiera-card${!isAvailable ? ' financiera-card-disabled' : ''}`}
                        onClick={() => isAvailable && handleSelectFinanciera(f)}
                      >
                        <img src={f.logo} alt={f.nombre} loading="lazy" />
                        <div className="financiera-name">{f.nombre}</div>
                        <span className={`financiera-badge ${f.tipo === 'autovalidacion' ? 'badge-autovalidacion' : 'badge-asesor'}`}>
                          {f.tipo === 'autovalidacion' ? 'Autovalidación' : 'Asesor'}
                        </span>
                        {!isAvailable && (
                          <div className="text-muted small mt-1" style={{ fontSize: '0.7rem', lineHeight: 1.2 }}>
                            No disponible<br />para este producto
                          </div>
                        )}
                      </div>
                    </Col>
                  );
                })}
              </Row>
            </>
          )}

          {/* ─── Step: credito-form — fill form ─── */}
          {step === 'credito-form' && selectedFinanciera && (
            <>
              <div className="text-center mb-3">
                <img src={selectedFinanciera.logo} alt={selectedFinanciera.nombre} style={{ maxHeight: 40, objectFit: 'contain' }} />
                <h6 className="mt-2 fw-bold">{selectedFinanciera.nombre}</h6>
              </div>

              {selectedFinanciera.tipo === 'autovalidacion' && !linkOpened && (
                <div className="autovalidacion-note text-center">
                  <p className="mb-2">Primero valida tu crédito:</p>
                  <Button
                    variant=""
                    size="sm"
                    onClick={() => {
                      window.open(selectedFinanciera.urlAutovalidacion, '_blank');
                      setLinkOpened(true);
                    }}
                    style={{ background: '#ffc107', borderColor: '#ffc107', color: '#000', fontWeight: 600 }}
                  >
                    <i className="bi bi-box-arrow-up-right me-1"></i> Ir a {selectedFinanciera.nombre}
                  </Button>
                </div>
              )}

              {(!(selectedFinanciera.tipo === 'autovalidacion') || linkOpened) && (
                <div className="mt-2">
                  {selectedFinanciera.campos.map((campo) => (
                    <div className="form-field-group" key={campo.name}>
                      <label>
                        {campo.label}
                        {campo.required && <span style={{ color: 'var(--gio-red)' }}> *</span>}
                      </label>
                      {campo.type === 'radio' && campo.options ? (
                        <div className="radio-group">
                          {campo.options.map((opt) => (
                            <label key={opt}>
                              <input
                                type="radio"
                                name={campo.name}
                                value={opt}
                                checked={formData[campo.name] === opt}
                                onChange={(e) => handleFieldChange(campo.name, e.target.value)}
                              />
                              {opt}
                            </label>
                          ))}
                        </div>
                      ) : (
                        <input
                          type={campo.type || 'text'}
                          placeholder={campo.label}
                          value={formData[campo.name] || ''}
                          onChange={(e) => handleFieldChange(campo.name, e.target.value)}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer className="d-flex flex-column">
          {step === 'product' && (
            <>
              <h6 className="modal-section-title">¿Qué quieres hacer?</h6>
              <Row className="g-3 w-100 mb-4">
                <Col xs={12} md={6}>
                  <Button
                    variant=""
                    onClick={() => { setPaymentAction('comprar'); setStep('payment'); }}
                    className="w-100 btn-comprar-animate"
                    style={{ background: '#28a745', borderColor: '#28a745', color: '#fff', padding: '15px' }}
                  >
                    <i className="bi bi-whatsapp me-2"></i> Comprar Ahora
                  </Button>
                </Col>
                <Col xs={12} md={6}>
                  <Button
                    variant=""
                    onClick={() => { setPaymentAction('carrito'); setStep('payment'); }}
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
          )}

          {step === 'payment' && (
            <>
              <h6 className="modal-section-title">
                {paymentAction === 'comprar' ? '💬 Elige cómo pagar:' : '🛒 Elige cómo pagar:'}
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
              <Button variant="outline-secondary" onClick={() => setStep('product')} className="mt-2 w-100">
                ← Volver
              </Button>
            </>
          )}

          {step === 'credito-financieras' && (
            <>
              <Button variant="outline-secondary" onClick={() => setStep('payment')} className="w-100">
                ← Volver
              </Button>
            </>
          )}

          {step === 'credito-form' && (
            <>
              <Button
                variant=""
                onClick={handleEnviarWhatsApp}
                className="w-100"
                disabled={!isFormValid()}
                style={{
                  background: isFormValid() ? '#25D366' : '#6c757d',
                  borderColor: isFormValid() ? '#25D366' : '#6c757d',
                  color: '#fff',
                  padding: '12px',
                  fontWeight: 600
                }}
              >
                <i className="bi bi-whatsapp me-2"></i> Enviar solicitud por WhatsApp
              </Button>
              <Button variant="outline-secondary" onClick={() => setStep('credito-financieras')} className="mt-2 w-100">
                ← Volver
              </Button>
            </>
          )}
        </Modal.Footer>
      </Modal>

      {/* 💳 Credit flow is now handled inline via step wizard above */}
    </>
  );
};

export default ProductCard;
