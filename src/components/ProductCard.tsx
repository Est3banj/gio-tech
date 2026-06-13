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
  const [autovalidacionStatus, setAutovalidacionStatus] = useState<'pendiente' | 'aprobado' | 'denegado'>('pendiente');
  const [aceptaTerminos, setAceptaTerminos] = useState(false);
  // Sistecredito validation state
  const [validPhase, setValidPhase] = useState<'idle' | 'running' | 'done'>('idle');
  const [validStep, setValidStep] = useState(0); // 0=datos, 1=cupo, 2=historial, 3=resultado
  const [validCupoText, setValidCupoText] = useState('');
  const [validAdvertencia, setValidAdvertencia] = useState('');
  const [validResultType, setValidResultType] = useState<'aplica' | 'no-aplica' | 'condiciones' | null>(null);
  const [validResultMsg, setValidResultMsg] = useState('');
  const validTimers = React.useRef<ReturnType<typeof setTimeout>[]>([]);
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
    setAutovalidacionStatus('pendiente');
    resetValid();
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

  const financierasDisponibles = getFinancierasForProduct(producto.marca, producto.categoria, producto.nombre);

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

  const resetValid = () => {
    validTimers.current.forEach(clearTimeout);
    validTimers.current = [];
    setValidPhase('idle');
    setValidStep(0);
    setValidCupoText('');
    setValidAdvertencia('');
    setValidResultType(null);
    setValidResultMsg('');
  };

  const handleSelectFinanciera = (financiera: Financiera) => {
    setSelectedFinanciera(financiera);
    setFormData({});
    setLinkOpened(false);
    setAutovalidacionStatus('pendiente');
    setAceptaTerminos(false);
    resetValid();
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
    // Nombre completo: al menos 2 palabras (solo Sistecredito)
    if (selectedFinanciera.id === 'sistecredito') {
      const words = (formData.nombres || '').trim().split(/\s+/).filter(Boolean);
      if (words.length < 2) return false;
    }
    // Todas las financieras: debe aceptar términos
    if (!aceptaTerminos) return false;
    return true;
  };

  const nombreCompletoWords = (formData.nombres || '').trim().split(/\s+/).filter(Boolean).length;
  const nombreCompletoInvalido = selectedFinanciera?.id === 'sistecredito' && (formData.nombres?.trim() || '') && nombreCompletoWords < 2;

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
        cupo: 'Cupo disponible',
        primeraCompra: 'Primera compra',
      };
      return labels[key] || key;
    };

    let mensaje = `🧾 *Solicitud de crédito - ${selectedFinanciera.nombre}*\n\n`;
    mensaje += `📱 *Producto:* ${nombre}\n`;
    mensaje += `💰 *Precio:* ${showPromoPrice ? pricePromoStr : priceRegularStr}\n`;
    // Solo Krediya incluye cuotas en el mensaje (las demas las define el asesor)
    if (selectedFinanciera.id === 'krediya') {
      if (cuotaInicial > 0) mensaje += `💵 *Cuota inicial:* ${formatPrice(cuotaInicial)}\n`;
      if (solo12Meses && cuotas12) {
        mensaje += `📆 *12 cuotas mensuales:* ${formatPrice(cuotas12)}\n`;
      } else {
        mensaje += `📆 *16 cuotas quincenales:* ${formatPrice(cuotas6)}\n`;
        mensaje += `📆 *8 cuotas mensuales:* ${formatPrice(cuotas8)}\n`;
      }
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

  /** Validación progresiva para Sistecredito con pasos animados */
  const handleSistecreditoValidar = () => {
    if (validPhase !== 'idle') return;
    if (!isFormValid()) return;

    const cupoStr = (formData.cupo || '').replace(/[^0-9]/g, '');
    const cupo = cupoStr ? parseInt(cupoStr, 10) : null;

    // Arrancar secuencia
    setValidPhase('running');
    setValidStep(0);

    const t: Array<ReturnType<typeof setTimeout>> = [];

    t.push(setTimeout(() => setValidStep(1), 800));          // paso 1: consultando cupo...

    t.push(setTimeout(() => {                                  // paso 2: cupo resultado
      const cupoText = cupo === null ? 'No recuerda' : `$${cupo.toLocaleString('es-CO')}`;
      let advertencia = '';
      if (cupo !== null && (producto.contado || 0) > cupo) {
        const diff = (producto.contado || 0) - cupo;
        advertencia = `El producto ($${(producto.contado || 0).toLocaleString('es-CO')}) supera tu cupo por $${diff.toLocaleString('es-CO')}. Necesitarías un abono adicional.`;
      }
      setValidCupoText(cupoText);
      setValidAdvertencia(advertencia);
      setValidStep(2);
    }, 2000));

    t.push(setTimeout(() => {                                  // paso 3: resultado final
      const esPrimeraCompra = formData.primeraCompra === 'Sí';
      // Unica regla real: primera compra = no aplica para tecnologia
      // El cupo es solo informativo para el asesor, no lo validamos
      const type = esPrimeraCompra ? 'no-aplica' : 'aplica';
      const msg = esPrimeraCompra ? 'No aplica para tecnología' : 'Aplica';

      setValidResultType(type);
      setValidResultMsg(msg);
      setValidStep(3);
      setValidPhase('done');

      if (type === 'aplica') {
        t.push(setTimeout(() => handleEnviarWhatsApp(), 2000));
      }
    }, 3500));

    validTimers.current = t;
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
        .form-field-group input.is-invalid {
          border-color: var(--gio-red);
          box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.15);
        }
        .form-field-group input.is-invalid:focus {
          border-color: var(--gio-red);
          box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.25);
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

        .terminos-checkbox {
          margin-top: 0.5rem;
          padding-top: 0.75rem;
          border-top: 1px solid var(--border-color, #e0e0e0);
        }
        .terminos-checkbox .checkbox-label {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          cursor: pointer;
          font-weight: 400;
          font-size: 0.85rem;
          line-height: 1.4;
        }
        .terminos-checkbox .checkbox-label input[type="checkbox"] {
          margin-top: 0.15rem;
          width: 1rem;
          height: 1rem;
          cursor: pointer;
          flex-shrink: 0;
        }
        .terminos-checkbox .checkbox-label a {
          color: var(--brand-blue, #0d6efd);
          text-decoration: underline;
        }
        .terminos-checkbox .checkbox-label a:hover {
          color: var(--brand-blue-dark, #0a58ca);
        }

        .valid-steps {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .valid-step {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          padding: 0.5rem 0.75rem;
          border-radius: var(--radius-sm);
          font-size: 0.9rem;
          transition: all 0.3s ease;
        }
        .valid-step.active {
          background: rgba(13, 110, 253, 0.08);
        }
        .valid-step.done {
          opacity: 0.85;
        }
        .valid-step.pending {
          opacity: 0.4;
        }
        .valid-step-icon {
          font-size: 1.15rem;
          width: 1.5rem;
          text-align: center;
          flex-shrink: 0;
        }
        .valid-step-text {
          color: var(--text-primary);
        }
        .valid-advertencia {
          font-size: 0.82rem;
          color: #856404;
          background: #fff3cd;
          padding: 0.6rem 0.75rem;
          border-radius: var(--radius-sm);
          margin: 0.25rem 0 0.25rem 2.1rem;
          line-height: 1.3;
        }
        .validation-result {
          text-align: center;
          padding: 1.25rem;
          border-radius: var(--radius-md);
          margin-top: 1rem;
        }
        .validation-result.aplica {
          background: #d1e7dd;
          border: 1.5px solid #0f5132;
          color: #0f5132;
        }
        .validation-result.no-aplica {
          background: #f8d7da;
          border: 1.5px solid #842029;
          color: #842029;
        }
        .validation-result .icon {
          font-size: 2.5rem;
          margin-bottom: 0.5rem;
        }
        .validation-result .reason {
          font-size: 0.85rem;
          margin-top: 0.35rem;
          opacity: 0.85;
        }
        .btn-validar {
          padding: 12px 40px;
          font-weight: 700;
          font-size: 1.05rem;
          border-radius: var(--radius-sm);
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          color: #fff;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .btn-validar:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
        }
        .btn-validar:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
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

              {/* ─── Autovalidación: paso 1 — ir al sitio externo ─── */}
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

              {/* ─── Autovalidación: paso 2 — elegir resultado ─── */}
              {selectedFinanciera.tipo === 'autovalidacion' && linkOpened && autovalidacionStatus === 'pendiente' && (
                <div className="autovalidacion-note text-center">
                  <div className="d-flex align-items-center justify-content-center gap-2 mb-2">
                    <i className="bi bi-check-circle-fill text-success"></i>
                    <span className="fw-semibold" style={{ color: 'var(--text-primary)' }}>Enlace abierto en {selectedFinanciera.nombre}</span>
                  </div>
                  <p className="mb-2" style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    ¿Cómo te fue en la validación?
                  </p>
                  <Row className="g-2">
                    <Col xs={6}>
                      <Button
                        variant=""
                        size="sm"
                        onClick={() => setAutovalidacionStatus('aprobado')}
                        className="w-100"
                        style={{ background: '#28a745', borderColor: '#28a745', color: '#fff', fontWeight: 600, padding: '10px 8px' }}
                      >
                        <i className="bi bi-check-circle me-1"></i> Aprobado
                      </Button>
                    </Col>
                    <Col xs={6}>
                      <Button
                        variant=""
                        size="sm"
                        onClick={() => setAutovalidacionStatus('denegado')}
                        className="w-100"
                        style={{ background: '#dc3545', borderColor: '#dc3545', color: '#fff', fontWeight: 600, padding: '10px 8px' }}
                      >
                        <i className="bi bi-x-circle me-1"></i> Denegado
                      </Button>
                    </Col>
                  </Row>
                  <div className="mt-2">
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => { window.open(selectedFinanciera.urlAutovalidacion, '_blank'); }}
                      style={{ color: 'var(--brand-blue)', textDecoration: 'none', fontSize: '0.85rem' }}
                    >
                      <i className="bi bi-box-arrow-up-right me-1"></i> Volver a abrir {selectedFinanciera.nombre}
                    </Button>
                  </div>
                </div>
              )}

              {/* ─── Autovalidación: resultado denegado ─── */}
              {selectedFinanciera.tipo === 'autovalidacion' && autovalidacionStatus === 'denegado' && (
                <div className="validation-result no-aplica mt-2">
                  <div className="icon"><i className="bi bi-x-circle-fill"></i></div>
                  <div className="fw-bold fs-6">Cupo denegado</div>
                  <div className="reason">No te preocupes, puedes probar con otra financiera</div>
                </div>
              )}

              {/* ─── Formulario: se muestra si no es autovalidación, o si aprobó ─── */}
              {(selectedFinanciera.tipo !== 'autovalidacion' || autovalidacionStatus === 'aprobado') && (
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
                          className={nombreCompletoInvalido ? 'is-invalid' : ''}
                        />
                      )}
                      {/* Sistecredito: hint de nombre completo */}
                      {selectedFinanciera.id === 'sistecredito' && campo.name === 'nombres' && (
                        <small
                          className={`d-block mt-1 ${
                            nombreCompletoInvalido ? 'text-danger' : 'text-muted'
                          }`}
                          style={{ fontSize: '0.75rem' }}
                        >
                          {nombreCompletoInvalido
                            ? 'Ingresá tu nombre y apellido completo'
                            : 'Ej: Juan Pérez'}
                        </small>
                      )}
                    </div>
                  ))}

                  {/* Términos y condiciones (para todas las financieras) */}
                  <div className="form-field-group terminos-checkbox">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={aceptaTerminos}
                        onChange={(e) => setAceptaTerminos(e.target.checked)}
                      />
                      <span>
                        Autorizo el tratamiento de mis datos personales de acuerdo con los{' '}
                        <a href="/terminos" target="_blank" rel="noopener noreferrer">
                          Términos y Condiciones
                        </a>{' '}
                        de GIO TECH
                      </span>
                    </label>
                  </div>
                </div>
              )}

              {/* ─── Sistecredito: validation button ─── */}
              {selectedFinanciera.id === 'sistecredito' && validPhase === 'idle' && (
                <div className="text-center mt-3">
                  <button className="btn-validar" onClick={handleSistecreditoValidar} disabled={!isFormValid()}>
                    <i className="bi bi-shield-check me-2"></i> Validar
                  </button>
                </div>
              )}

              {/* ─── Sistecredito: progressive steps ─── */}
              {selectedFinanciera.id === 'sistecredito' && validPhase !== 'idle' && (
                <div className="valid-steps mt-3">
                  {/* Paso 1: Datos básicos */}
                  <div className={`valid-step ${validStep >= 1 ? 'done' : validStep === 0 ? 'active' : 'pending'}`}>
                    <span className="valid-step-icon">
                      {validStep >= 1
                        ? <i className="bi bi-check-circle-fill text-success"></i>
                        : validStep === 0 && validPhase === 'running'
                        ? <i className="bi bi-hourglass-split text-primary"></i>
                        : <i className="bi bi-circle text-secondary" style={{ opacity: 0.3 }}></i>}
                    </span>
                    <span className="valid-step-text">Datos básicos verificados</span>
                  </div>

                  {/* Paso 2: Cupo */}
                  <div className={`valid-step ${validStep >= 2 ? 'done' : validStep === 1 ? 'active' : 'pending'}`}>
                    <span className="valid-step-icon">
                      {validStep >= 2
                        ? <i className="bi bi-check-circle-fill text-success"></i>
                        : validStep === 1
                        ? <i className="bi bi-hourglass-split text-primary"></i>
                        : <i className="bi bi-circle text-secondary" style={{ opacity: 0.3 }}></i>}
                    </span>
                    <span className="valid-step-text">
                      {validStep < 2 ? 'Consultando cupo...' : `Cupo disponible: ${validCupoText}`}
                    </span>
                  </div>

                  {/* Advertencia producto/cupo */}
                  {validStep >= 2 && validAdvertencia && (
                    <div className="valid-advertencia">
                      <i className="bi bi-exclamation-triangle-fill text-warning me-1"></i>
                      {validAdvertencia}
                    </div>
                  )}

                  {/* Paso 3: Historial */}
                  <div className={`valid-step ${validStep >= 3 ? 'done' : validStep === 2 ? 'active' : 'pending'}`}>
                    <span className="valid-step-icon">
                      {validStep >= 3
                        ? validResultType === 'aplica'
                          ? <i className="bi bi-check-circle-fill text-success"></i>
                          : <i className="bi bi-x-circle-fill text-danger"></i>
                        : validStep === 2
                        ? <i className="bi bi-hourglass-split text-primary"></i>
                        : <i className="bi bi-circle text-secondary" style={{ opacity: 0.3 }}></i>}
                    </span>
                    <span className="valid-step-text">
                      {validStep >= 3 ? validResultMsg : 'Validando historial...'}
                    </span>
                  </div>

                  {/* Resultado final */}
                  {validPhase === 'done' && (
                    <div className={`validation-result ${validResultType === 'no-aplica' ? 'no-aplica' : 'aplica'}`}>
                      {validResultType === 'no-aplica' ? (
                        <>
                          <div className="icon"><i className="bi bi-x-circle-fill"></i></div>
                          <div className="fw-bold fs-6">Cupo denegado</div>
                          <div className="reason">{validResultMsg}</div>
                          <div className="mt-2" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            No te preocupes, puedes probar con otra financiera
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="icon"><i className="bi bi-check-circle-fill"></i></div>
                          <div className="fw-bold fs-6">¡Aplicas para Sistecredito!</div>
                          <div className="reason">Te redirigimos a WhatsApp...</div>
                        </>
                      )}
                    </div>
                  )}
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

          {step === 'credito-form' && selectedFinanciera && selectedFinanciera.id === 'sistecredito' && (
            <>
              {validPhase === 'done' && validResultType === 'no-aplica' && (
                <Button
                  variant=""
                  onClick={() => { setStep('credito-financieras'); resetValid(); }}
                  className="w-100"
                  style={{ background: '#6f42c1', borderColor: '#6f42c1', color: '#fff', padding: '12px', fontWeight: 600 }}
                >
                  <i className="bi bi-arrow-left me-2"></i> Intentar con otra financiera
                </Button>
              )}
              {(validPhase === 'idle' || validPhase === 'running') && (
                <Button variant="outline-secondary" onClick={() => { setStep('credito-financieras'); resetValid(); }} className="mt-2 w-100">
                  ← Volver
                </Button>
              )}
            </>
          )}

          {step === 'credito-form' && selectedFinanciera && selectedFinanciera.id !== 'sistecredito' && (
            <>
              {autovalidacionStatus === 'denegado' ? (
                <Button
                  variant=""
                  onClick={() => { setStep('credito-financieras'); setAutovalidacionStatus('pendiente'); setLinkOpened(false); }}
                  className="w-100"
                  style={{ background: '#6f42c1', borderColor: '#6f42c1', color: '#fff', padding: '12px', fontWeight: 600 }}
                >
                  <i className="bi bi-arrow-left me-2"></i> Intentar con otra financiera
                </Button>
              ) : (
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
            </>
          )}
        </Modal.Footer>
      </Modal>

      {/* 💳 Credit flow is now handled inline via step wizard above */}
    </>
  );
};

export default ProductCard;
