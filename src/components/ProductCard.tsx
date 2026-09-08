// src/components/ProductCard.tsx
import React, { useState } from "react";
import { Modal, Button, Row, Col } from "react-bootstrap";
import { useCart } from "../contexts/cart-context";
import { useWhatsappNumber } from "../contexts/whatsapp-number-context";
import { buildContadoWhatsAppMessage, buildCreditoWhatsAppMessage, buildWhatsAppUrl } from "../utils/whatsapp-messages";
import { trackLead } from "../utils/metaPixel";
import { recordProductView } from "../services/productStats.service";
import { useProductPricing } from "./product-card/useProductPricing";
import CreditForm from "./product-card/CreditForm";
import type { CreditFormStatus, AutovalidacionStatus } from "./product-card/CreditForm";
import type { ValidacionPhase, ValidacionResultType, ValidacionStatus } from "./product-card/SistecreditoValidation";
import ProductCardView from "./product-card/ProductCardView";
import PriceDisplay from "./product-card/PriceDisplay";
import PlanCuotas from "./product-card/PlanCuotas";
import FinancieraGrid from "./product-card/FinancieraGrid";
import { getProductType, FINANCIERAS } from "../data/financieras";
import "./product-card/product-card.css";
import type { Product, CotizacionType, Financiera } from "../types";

interface ProductCardProps {
  producto: Product;
  isPopular?: boolean;
  autoOpen?: boolean;
  onCloseModal?: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({
  producto,
  isPopular = false,
  autoOpen = false,
  onCloseModal,
}) => {
  const [mostrar, setMostrar] = useState(false);
  const [step, setStep] = useState<'product' | 'payment' | 'credito-financieras' | 'credito-form'>('product');
  const [paymentAction, setPaymentAction] = useState<'comprar' | 'carrito'>('comprar');
  const [selectedFinanciera, setSelectedFinanciera] = useState<Financiera | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  // Espejos del estado de CreditForm/SistecreditoValidation (los usa el footer del modal)
  const [autovalidacionStatus, setAutovalidacionStatus] = useState<AutovalidacionStatus>('pendiente');
  const [formValid, setFormValid] = useState(false);
  const [validPhase, setValidPhase] = useState<ValidacionPhase>('idle');
  const [validResultType, setValidResultType] = useState<ValidacionResultType>(null);
  const [modalCopied, setModalCopied] = useState(false);
  const { addToCart } = useCart();
  const rawPhoneNumber = useWhatsappNumber();
  const phoneNumber = rawPhoneNumber || '573223652569';

  // Registrar vista del producto SOLO cuando el usuario abre los detalles
  const abrir = () => {
    if (producto?.id) {
      recordProductView(producto.id);
    }
    setMostrar(true);
    setStep('product');
  };

  // Auto-abrir modal si la prop autoOpen es verdadera (deep links)
  React.useEffect(() => {
    if (autoOpen) {
      abrir();
    }
  }, [autoOpen]);

  const cerrar = () => {
    setMostrar(false);
    setStep('product');
    setSelectedFinanciera(null);
    setFormData({});
    setAutovalidacionStatus('pendiente');
    setFormValid(false);
    setValidPhase('idle');
    setValidResultType(null);
    onCloseModal?.();
  };

  const handleShareModal = async () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const shareUrl = `${origin}/catalogo?producto=${encodeURIComponent(producto.id)}`;
    const shareData = {
      title: `${producto.nombre} | GIO TECH`,
      text: `Mira el ${producto.nombre} en GIO TECH Putumayo:`,
      url: shareUrl,
    };

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
      }
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setModalCopied(true);
        setTimeout(() => setModalCopied(false), 2000);
      } catch {
        window.prompt('Copia este enlace para compartir:', shareUrl);
      }
    }
  };

  const der = useProductPricing(producto);

  const {
    nombre,
    descripcion,
    contado,
    showPromoPrice,
    priceRegularStr,
    pricePromoStr,
    cuotaInicial,
    cuotaInicialStr,
    solo12Meses,
    cuotas12,
    cuotas12Str,
    cuotas6Str,
    cuotas8Str,
    financierasDisponibles,
  } = der;

  const mensajeWhatsAppContadoDirecto = buildContadoWhatsAppMessage({
    nombre,
    showPromoPrice,
    pricePromoStr,
    priceRegularStr,
  });

  const handleSeleccionTipo = (tipo: CotizacionType) => {
    if (tipo === 'contado') {
      if (paymentAction === 'comprar') {
        trackLead({
          content_type: 'product',
          content_ids: [producto.id],
          content_name: producto.nombre,
          value: der.contado || 0,
          currency: 'COP',
        });
        if (phoneNumber) {
          window.open(
            buildWhatsAppUrl(phoneNumber, mensajeWhatsAppContadoDirecto),
            '_blank'
          );
        }
      } else {
        addToCart(producto, tipo);
        cerrar();
      }
    } else if (der.tieneFinanciacion) {
      setStep('credito-financieras');
    }
  };

  const handleSelectFinanciera = (financiera: Financiera) => {
    setSelectedFinanciera(financiera);
    setFormData({});
    setAutovalidacionStatus('pendiente');
    setFormValid(false);
    setValidPhase('idle');
    setValidResultType(null);
    setStep('credito-form');
  };

  const handleCreditFormStatus = (status: CreditFormStatus) => {
    setFormData(status.formData);
    setAutovalidacionStatus(status.autovalidacionStatus);
    setFormValid(status.isValid);
  };

  const handleValidacionStatus = (status: ValidacionStatus) => {
    setValidPhase(status.validPhase);
    setValidResultType(status.validResultType);
  };

  const handleEnviarWhatsApp = () => {
    if (!selectedFinanciera) return;
    if (!formValid) return;

    const mensaje = buildCreditoWhatsAppMessage({
      financiera: selectedFinanciera,
      nombre,
      precioStr: showPromoPrice ? pricePromoStr : priceRegularStr,
      cuotaInicialStr,
      solo12Meses,
      cuotas12Str,
      cuotas6Str,
      cuotas8Str,
      formData,
    });

    trackLead({
      content_type: 'product',
      content_ids: [producto.id],
      content_name: producto.nombre,
      value: producto.cuotas6 || producto.cuotas8 || 0,
      currency: 'COP',
    });

    if (phoneNumber) {
      window.open(buildWhatsAppUrl(phoneNumber, mensaje), '_blank');
    }
    if (paymentAction === 'carrito') {
      addToCart(producto, 'credito');
    }
    cerrar();
  };

  const productType = getProductType(producto?.marca, producto?.nombre, producto?.categoria);

  const handleSwitchFinanciera = (finId: string) => {
    const fin = FINANCIERAS.find((f) => f.id === finId);
    if (fin) {
      handleSelectFinanciera(fin);
    } else {
      setStep('credito-financieras');
    }
  };

  const handleContactAsesorForAbono = () => {
    const msg = `Hola, quiero cotizar a crédito el ${nombre}. Como es mi primera compra en Sistecrédito, me gustaría recibir asesoría para un plan con abono inicial o alternativas disponibles.`;
    if (phoneNumber) {
      window.open(buildWhatsAppUrl(phoneNumber, msg), '_blank');
    }
    cerrar();
  };

  return (
    <>
      

      <ProductCardView producto={producto} isPopular={isPopular} der={der} onVerDetalles={abrir} />

      <Modal show={mostrar} onHide={cerrar} centered>
        <Modal.Header closeButton>
          <div className="d-flex align-items-center gap-2 flex-grow-1 me-2 justify-content-between">
            <Modal.Title className="m-0 fs-5">{nombre}</Modal.Title>
            <Button
              variant="outline-secondary"
              size="sm"
              className="d-inline-flex align-items-center gap-1 py-1 px-2 me-2"
              onClick={handleShareModal}
              title="Compartir producto"
              aria-label={`Compartir ${nombre}`}
            >
              <i className={modalCopied ? "bi bi-check2 text-success" : "bi bi-share"} />
              <small className="fw-semibold">{modalCopied ? "¡Copiado!" : "Compartir"}</small>
            </Button>
          </div>
        </Modal.Header>
        <Modal.Body>
          {/* ─── Step: product | payment — show product info ─── */}
          {(step === 'product' || step === 'payment') && (
            <>
              <p style={{ fontSize: '0.95rem' }}>{descripcion && descripcion.trim() !== "" ? descripcion : "Sin descripción."}</p>

              <PriceDisplay variant="modal" der={der} />

              {der.mostrarPlanCuotas && (
                <PlanCuotas
                  cuotaInicial={cuotaInicial}
                  cuotaInicialStr={cuotaInicialStr}
                  solo12Meses={solo12Meses}
                  cuotas12={cuotas12}
                  cuotas12Str={cuotas12Str}
                  cuotas6Str={cuotas6Str}
                  cuotas8Str={cuotas8Str}
                />
              )}

            </>
          )}

          {/* ─── Step: credito-financieras — pick a financiera ─── */}
          {step === 'credito-financieras' && (
            <FinancieraGrid financierasDisponibles={financierasDisponibles} onSelect={handleSelectFinanciera} />
          )}

          {/* ─── Step: credito-form — fill form ─── */}
          {step === 'credito-form' && selectedFinanciera && (
            <CreditForm
              key={selectedFinanciera.id}
              financiera={selectedFinanciera}
              contado={contado}
              productType={productType}
              productName={nombre}
              onValidSubmit={() => handleEnviarWhatsApp()}
              onStatusChange={handleCreditFormStatus}
              onValidacionStatusChange={handleValidacionStatus}
              onSwitchFinanciera={handleSwitchFinanciera}
              onContactAsesor={handleContactAsesorForAbono}
            />
          )}
        </Modal.Body>
        <Modal.Footer className="d-flex flex-column">
          {step === 'product' && (
            <>
              <h6 className="modal-section-title">
                <i className="bi bi-bag-check me-2 text-primary"></i> ¿Qué quieres hacer?
              </h6>
              <Row className="g-3 w-100 mb-3">
                <Col xs={12} md={6}>
                  <Button
                    variant=""
                    onClick={() => { setPaymentAction('comprar'); setStep('payment'); }}
                    className="w-100 btn-action-comprar"
                  >
                    <i className="bi bi-whatsapp me-2"></i> Comprar Ahora
                  </Button>
                </Col>
                <Col xs={12} md={6}>
                  <Button
                    variant=""
                    onClick={() => { setPaymentAction('carrito'); setStep('payment'); }}
                    className="w-100 btn-action-carrito"
                  >
                    <i className="bi bi-cart-plus me-2"></i> Añadir al Carrito
                  </Button>
                </Col>
              </Row>
              <Button variant="outline-secondary" onClick={cerrar} className="mt-2 w-100 btn-modal-back">
                Cerrar
              </Button>
            </>
          )}

          {step === 'payment' && (
            <>
              <h6 className="modal-section-title">
                <i className="bi bi-wallet2 me-2 text-primary"></i> Elige cómo pagar:
              </h6>
              {/* Segmented control moderno tipo iOS */}
              <div className={`modal-segmented-control mb-3${!der.tieneFinanciacion ? ' single-option' : ''}`}>
                <button
                  type="button"
                  onClick={() => handleSeleccionTipo('contado')}
                  className="segmented-btn segmented-btn-contado"
                >
                  <i className="bi bi-cash-stack me-2"></i>
                  <span>Contado</span>
                </button>
                {der.tieneFinanciacion && (
                  <button
                    type="button"
                    onClick={() => handleSeleccionTipo('credito')}
                    className="segmented-btn segmented-btn-credito"
                  >
                    <i className="bi bi-credit-card-2-front me-2"></i>
                    <span>Crédito</span>
                  </button>
                )}
              </div>

              <Button variant="outline-secondary" onClick={() => setStep('product')} className="mt-1 w-100 btn-modal-back">
                <i className="bi bi-arrow-left me-1"></i> Volver
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
                  onClick={() => { setStep('credito-financieras'); setValidPhase('idle'); setValidResultType(null); }}
                  className="w-100"
                  style={{ background: '#6f42c1', borderColor: '#6f42c1', color: '#fff', padding: '12px', fontWeight: 600 }}
                >
                  <i className="bi bi-arrow-left me-2"></i> Intentar con otra financiera
                </Button>
              )}
              {(validPhase === 'idle' || validPhase === 'running') && (
                <Button variant="outline-secondary" onClick={() => { setStep('credito-financieras'); setValidPhase('idle'); setValidResultType(null); }} className="mt-2 w-100">
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
                  onClick={() => { setStep('credito-financieras'); setAutovalidacionStatus('pendiente'); }}
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
                    disabled={!formValid}
                    style={{
                      background: formValid ? '#25D366' : '#6c757d',
                      borderColor: formValid ? '#25D366' : '#6c757d',
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
