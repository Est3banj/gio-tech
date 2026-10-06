import React, { useState, useEffect, useMemo } from "react";
import { useParams, Link, Navigate, useSearchParams } from "react-router-dom";
import { useProducts } from "../hooks/useProducts";
import { useCart } from "../contexts/cart-context";
import { useWhatsappNumber } from "../contexts/whatsapp-number-context";
import { buildContadoWhatsAppMessage, buildCreditoWhatsAppMessage, buildWhatsAppUrl, appendConsentEvidence } from "../utils/whatsapp-messages";
import { trackLead } from "../utils/metaPixel";
import { recordProductView } from "../services/productStats.service";
import { recordLegalConsent } from "../services/legal-consent.service";
import { useProductPricing } from "./product-card/useProductPricing";
import CreditForm from "./product-card/CreditForm";
import type { CreditFormStatus, AutovalidacionStatus } from "./product-card/CreditForm";
import type { ValidacionPhase, ValidacionResultType, ValidacionStatus } from "./product-card/SistecreditoValidation";
import ProductCardView from "./product-card/ProductCardView";
import PriceDisplay from "./product-card/PriceDisplay";
import PlanCuotas from "./product-card/PlanCuotas";
import FinancieraGrid from "./product-card/FinancieraGrid";
import ProductImage from "./common/ProductImage";
import { getProductType, FINANCIERAS } from "../data/financieras";
import { extractProductSpecs } from "../utils/specs-parser";
import type { Product, CotizacionType, Financiera } from "../types";
import ProductCard from "./ProductCard";
import Reveal from "./Reveal";
import "./product-page.css";

type Step = 'product' | 'payment' | 'credito-financieras' | 'credito-form';

interface ProductPageProps {
  productId?: string;
}

const ProductPage: React.FC<ProductPageProps> = ({ productId: propProductId }) => {
  const { productId: paramProductId } = useParams<{ productId?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { products, isLoading } = useProducts();
  const { addToCart } = useCart();
  const rawPhoneNumber = useWhatsappNumber();
  const phoneNumber = rawPhoneNumber || '573223652569';

  // Product ID from prop, param, or query param (deep link)
  const productId = propProductId || paramProductId || searchParams.get("producto") || searchParams.get("id") || "";

  // Find product
  const producto = useMemo(() => {
    if (!productId || products.length === 0) return null;
    return products.find((p) => String(p.id).trim() === productId.trim()) || null;
  }, [productId, products]);

  // Track view on mount
  useEffect(() => {
    if (producto?.id) {
      recordProductView(producto.id);
    }
  }, [producto?.id]);

  // Product not found
  if (!producto) {
    if (isLoading) {
      return (
        <div className="product-page-loading">
          <div className="spinner-border text-danger" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
        </div>
      );
    }
    return (
      <div className="product-page-not-found">
        <div className="container py-5 text-center">
          <i className="bi bi-search display-1 text-muted mb-3" />
          <h2 className="text-primary mb-2">Producto no encontrado</h2>
          <p className="text-muted mb-4">El producto que buscas no existe o ha sido removido.</p>
          <Link to="/catalogo" className="btn btn-primary">
            <i className="bi bi-arrow-left me-2" /> Volver al catálogo
          </Link>
        </div>
      </div>
    );
  }

  // Pricing derivations
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
    tieneFinanciacion,
  } = der;

  // Specs extraction
  const isAccesorio = useMemo(() => {
    const cat = (producto.categoria || '').toLowerCase();
    if (cat.includes('accesorio') || cat.includes('accessory')) return true;
    return getProductType(producto.marca, producto.nombre, producto.categoria) === 'accesorio';
  }, [producto.marca, producto.nombre, producto.categoria]);

  const specs = useMemo(() => {
    if (isAccesorio) {
      return { almacenamiento: null, ram: null, camara: null, pantalla: null, bateria: null };
    }
    return extractProductSpecs(producto);
  }, [producto, isAccesorio]);

  const hasAnySpec = Boolean(
    !isAccesorio && (specs.almacenamiento || specs.ram || specs.camara || specs.pantalla || specs.bateria)
  );

  // State
  const [step, setStep] = useState<Step>('product');
  const [paymentAction, setPaymentAction] = useState<'comprar' | 'carrito'>('comprar');
  const [selectedFinanciera, setSelectedFinanciera] = useState<Financiera | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [autovalidacionStatus, setAutovalidacionStatus] = useState<AutovalidacionStatus>('pendiente');
  const [formValid, setFormValid] = useState(false);
  const [validPhase, setValidPhase] = useState<ValidacionPhase>('idle');
  const [validResultType, setValidResultType] = useState<ValidacionResultType>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showThumbnails, setShowThumbnails] = useState(false);

  // Gallery images (mock - would come from product.images in real scenario)
  const galleryImages = useMemo(() => {
    const main = producto.imagen;
    const additional = producto.imagenes || [];
    return main ? [main, ...additional] : [];
  }, [producto.imagen, producto.imagenes]);

  // WhatsApp message for contado
  const mensajeWhatsAppContadoDirecto = buildContadoWhatsAppMessage({
    nombre,
    showPromoPrice,
    pricePromoStr,
    priceRegularStr,
  });

  // Handlers
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
    if (!selectedFinanciera || !formValid) return;

    const mensaje = appendConsentEvidence(
      buildCreditoWhatsAppMessage({
        financiera: selectedFinanciera,
        nombre,
        precioStr: showPromoPrice ? pricePromoStr : priceRegularStr,
        cuotaInicialStr,
        solo12Meses,
        cuotas12Str,
        cuotas6Str,
        cuotas8Str,
        formData,
      })
    );

    trackLead({
      content_type: 'product',
      content_ids: [producto.id],
      content_name: producto.nombre,
      value: producto.cuotas6 || producto.cuotas8 || 0,
      currency: 'COP',
    });

    recordLegalConsent('credit');

    if (phoneNumber) {
      window.open(buildWhatsAppUrl(phoneNumber, mensaje), '_blank');
    }
  };

  const handleShare = async () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const shareUrl = `${origin}/producto/${producto.id}`;
    const shareData = {
      title: `${nombre} | GIO TECH`,
      text: `Mira el ${nombre} en GIO TECH Putumayo:`,
      url: shareUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') return;
      }
    }

    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(shareUrl);
      } catch {
        window.prompt('Copia este enlace:', shareUrl);
      }
    }
  };

  const productType = getProductType(producto?.marca, producto?.nombre, producto?.categoria);
  const breadcrumbItems = [
    { label: "Inicio", href: "/" },
    { label: "Catálogo", href: "/catalogo" },
    { label: nombre, href: undefined },
  ];

  return (
    <div className="product-page">
      {/* Breadcrumb */}
      <nav className="product-breadcrumb" aria-label="Navegación">
        <div className="container">
          <ol className="breadcrumb mb-0">
            {breadcrumbItems.map((item, idx) => (
              <li key={item.label} className="breadcrumb-item">
                {item.href ? (
                  <Link to={item.href} className="text-muted">{item.label}</Link>
                ) : (
                  <span className="text-truncate" style={{ maxWidth: '200px' }}>{item.label}</span>
                )}
              </li>
            ))}
          </ol>
        </div>
      </nav>

      <main className="product-main">
        <div className="container">
          <div className="product-page-grid">
            {/* ─── LEFT: GALLERY ─── */}
            <aside className="product-gallery" aria-label="Galería de imágenes">
              <div className="product-gallery-main">
                <div className="product-gallery-viewport">
                  <ProductImage
                    src={galleryImages[selectedImageIndex] || producto.imagen}
                    alt={`${nombre} - Vista ${selectedImageIndex + 1}`}
                    brand={producto.marca}
                    category={producto.categoria}
                    className="product-main-image"
                    loading="eager"
                    decoding="async"
                  />
                </div>
              </div>

              {galleryImages.length > 1 && (
                <div className="product-gallery-thumbs" role="list" aria-label="Miniaturas">
                  {galleryImages.map((img, idx) => (
                    <button
                      key={idx}
                      className={`product-thumb ${idx === selectedImageIndex ? 'active' : ''}`}
                      onClick={() => setSelectedImageIndex(idx)}
                      aria-label={`Ver imagen ${idx + 1}`}
                      aria-current={idx === selectedImageIndex ? 'true' : 'false'}
                      role="listitem"
                    >
                      <ProductImage
                        src={img}
                        alt={`${nombre} - Miniatura ${idx + 1}`}
                        brand={producto.marca}
                        category={producto.categoria}
                        variant="thumb"
                        className="product-thumb-image"
                      />
                    </button>
                  ))}
                </div>
              )}

              <div className="product-gallery-actions">
                <button
                  className="btn btn-outline-secondary btn-sm"
                  onClick={handleShare}
                  aria-label="Compartir producto"
                >
                  <i className="bi bi-share" aria-hidden="true" />
                </button>
              </div>
            </aside>

            {/* ─── RIGHT: DETAILS ─── */}
            <section className="product-details" aria-labelledby="product-title">
              <header className="product-header">
                {producto.marca && (
                  <span className="product-brand-tag">{producto.marca}</span>
                )}
                <h1 id="product-title" className="product-title">{nombre}</h1>
              </header>

              {/* Specs chips */}
              <div className="product-specs-rail" role="list" aria-label="Especificaciones">
                {!isAccesorio && specs.almacenamiento && (
                  <span className="spec-chip" role="listitem">
                    <i className="bi bi-sd-card" aria-hidden="true"></i>
                    <span>{specs.almacenamiento >= 1024 ? `${specs.almacenamiento / 1024}TB` : `${specs.almacenamiento}GB`}</span>
                  </span>
                )}
                {!isAccesorio && specs.ram && (
                  <span className="spec-chip" role="listitem">
                    <i className="bi bi-memory" aria-hidden="true"></i>
                    <span>{specs.ram}GB RAM</span>
                  </span>
                )}
                {!isAccesorio && specs.camara && (
                  <span className="spec-chip" role="listitem">
                    <i className="bi bi-camera" aria-hidden="true"></i>
                    <span>{specs.camara}MP</span>
                  </span>
                )}
                {!isAccesorio && specs.bateria && (
                  <span className="spec-chip" role="listitem">
                    <i className="bi bi-battery-charging" aria-hidden="true"></i>
                    <span>{specs.bateria}mAh</span>
                  </span>
                )}
                {!isAccesorio && specs.pantalla && (
                  <span className="spec-chip" role="listitem">
                    <i className="bi bi-phone" aria-hidden="true"></i>
                    <span>{specs.pantalla}"</span>
                  </span>
                )}
                {(!hasAnySpec || isAccesorio) && (
                  <span className="spec-chip spec-chip-default" role="listitem">
                    <i className="bi bi-shield-check" aria-hidden="true"></i>
                    <span>Garantía Oficial</span>
                  </span>
                )}
              </div>

              {/* Description */}
              {descripcion && (
                <div className="product-description">
                  <p>{descripcion}</p>
                </div>
              )}

              {/* ─── PRICING ─── */}
              <div className="product-pricing">
                <PriceDisplay variant="page" der={der} />
              </div>

              {/* ─── ACTION BUTTONS ─── */}
              <div className="product-actions">
                <div className="product-action-row">
                  <button
                    type="button"
                    className="btn btn-primary btn-lg product-btn-contado"
                    onClick={() => handleSeleccionTipo('contado')}
                    aria-label={tieneFinanciacion ? `Cotizar o financiar ${nombre}` : `Cotizar o comprar ${nombre}`}
                  >
                    <span>{tieneFinanciacion ? 'Cotizar / Financiar' : 'Cotizar / Comprar'}</span>
                    <i className="bi bi-arrow-right-short ms-2" aria-hidden="true" />
                  </button>
                </div>

                {tieneFinanciacion && (
                  <div className="product-financing-hint">
                    <i className="bi bi-credit-card me-1" aria-hidden="true" />
                    <span>Disponible en {financierasDisponibles.length} financiera{financierasDisponibles.length > 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>

              {/* ─── SHIPPING & WARRANTY ─── */}
              <div className="product-benefits">
                <div className="benefit-item">
                  <i className="bi bi-truck me-2" aria-hidden="true" />
                  <span>Envíos a todo Putumayo</span>
                </div>
                <div className="benefit-item">
                  <i className="bi bi-shield-check me-2" aria-hidden="true" />
                  <span>Garantía por escrito</span>
                </div>
                <div className="benefit-item">
                  <i className="bi bi-credit-card-2-front me-2" aria-hidden="true" />
                  <span>Financiación inmediata</span>
                </div>
              </div>

              {/* ─── STEP-BASED CONTENT (Payment/Financing) ─── */}
              {step !== 'product' && (
                <div className="product-step-content" role="dialog" aria-modal="true" aria-labelledby="step-title">
                  <div className="step-header">
                    <button
                      type="button"
                      className="btn btn-link p-0"
                      onClick={() => { setStep('product'); setSelectedFinanciera(null); }}
                      aria-label="Volver a detalles del producto"
                    >
                      <i className="bi bi-arrow-left me-1" /> Volver
                    </button>
                    <button
                      type="button"
                      className="btn btn-link p-0 ms-auto"
                      onClick={() => { setStep('product'); setSelectedFinanciera(null); }}
                      aria-label="Cerrar"
                    >
                      <i className="bi bi-x" />
                    </button>
                  </div>

                  {step === 'payment' && (
                    <div className="step-content">
                      <h3 id="step-title" className="step-title">¿Cómo deseas pagar?</h3>
                      <div className="modal-segmented-control" role="radiogroup" aria-label="Tipo de pago">
                        <button
                          type="button"
                          role="radio"
                          aria-checked={true}
                          className="segmented-btn segmented-btn-contado"
                          onClick={() => handleSeleccionTipo('contado')}
                        >
                          <i className="bi bi-cash me-2" aria-hidden="true" /> Contado
                        </button>
                        {tieneFinanciacion && (
                          <button
                            type="button"
                            role="radio"
                            aria-checked={false}
                            className="segmented-btn segmented-btn-credito"
                            onClick={() => setStep('credito-financieras')}
                          >
                            <i className="bi bi-credit-card me-2" aria-hidden="true" /> Crédito
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {step === 'credito-financieras' && (
                    <div className="step-content">
                      <h3 id="step-title" className="step-title">Selecciona una financiera</h3>
                      <FinancieraGrid
                        financieras={financierasDisponibles}
                        onSelect={handleSelectFinanciera}
                      />
                    </div>
                  )}

                  {step === 'credito-form' && selectedFinanciera && (
                    <div className="step-content">
                      <h3 id="step-title" className="step-title">
                        <img src={`/logoscredito/${selectedFinanciera.id.toLowerCase()}.webp`} alt={selectedFinanciera.nombre} className="financiera-logo-sm me-2" />
                        {selectedFinanciera.nombre}
                      </h3>
                      <CreditForm
                        financiera={selectedFinanciera}
                        producto={producto}
                        der={der}
                        onStatusChange={handleCreditFormStatus}
                        onValidacionChange={handleValidacionStatus}
                      />
                      <div className="credit-form-actions">
                        <button
                          type="button"
                          className="btn btn-outline-secondary w-100"
                          onClick={() => { setStep('credito-financieras'); setSelectedFinanciera(null); }}
                        >
                          <i className="bi bi-arrow-left me-2" /> Cambiar financiera
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary w-100 btn-validar"
                          onClick={handleEnviarWhatsApp}
                          disabled={!formValid || validPhase === 'validating'}
                          aria-busy={validPhase === 'validating'}
                        >
                          {validPhase === 'validating' ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
                              Validando...
                            </>
                          ) : (
                            <>
                              <i className="bi bi-whatsapp me-2" aria-hidden="true" />
                              Enviar por WhatsApp
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ─── RECOMMENDED PRODUCTS ─── */}
              <section className="recommended-section" aria-label="Productos recomendados">
                <div className="recommended-header">
                  <h2 className="recommended-title">También te puede interesar</h2>
                </div>
                <RecommendedProducts currentProductId={producto.id} />
              </section>
            </section>
          </div>
        </div>
      </main>

      {/* Mobile Sticky CTA */}
      <div className="product-mobile-cta d-lg-none">
        <div className="container">
          <div className="mobile-cta-grid">
            <button
              type="button"
              className="btn btn-outline-primary mobile-cta-btn"
              onClick={() => handleSeleccionTipo('contado')}
            >
              <i className="bi bi-cart-plus me-2" /> Agregar al carrito
            </button>
            <button
              type="button"
              className="btn btn-primary mobile-cta-btn"
              onClick={() => handleSeleccionTipo('contado')}
            >
              <i className="bi bi-whatsapp me-2" /> Cotizar por WhatsApp
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Recommended Products Component (reuses ProductCard)
function RecommendedProducts({ currentProductId }: { currentProductId: string }) {
  const { products } = useProducts();
  const { popularIds } = usePopularProducts();
  const { seleccionarDestacados } = require("../utils/featured-products");

  const recomendados = useMemo(() => {
    return seleccionarDestacados(products, popularIds)
      .filter((p) => String(p.id) !== String(currentProductId))
      .slice(0, 4);
  }, [products, popularIds, currentProductId]);

  if (recomendados.length === 0) return null;

  return (
    <div className="recommended-grid">
      {recomendados.map((producto, i) => (
        <Reveal key={producto.id} delay={i * 60}>
          <ProductCard producto={producto} usePageNavigation />
        </Reveal>
      ))}
    </div>
  );
}

export default ProductPage;