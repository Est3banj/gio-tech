import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useParams, Link, Navigate, useSearchParams, useLocation, useNavigate } from "react-router-dom";
import { useProducts, reloadProducts } from "../hooks/useProducts";
import { usePopularProducts } from "../hooks/usePopularProducts";
import { useCart } from "../contexts/cart-context";
import { useWhatsappNumber } from "../contexts/whatsapp-number-context";
import { buildProductWhatsAppMessage, buildCreditoWhatsAppMessage, buildWhatsAppUrl, appendConsentEvidence } from "../utils/whatsapp-messages";
import { trackLead } from "../utils/metaPixel";
import { recordProductView } from "../services/productStats.service";
import { recordLegalConsent } from "../services/legal-consent.service";
import { useProductPricing } from "./product-card/useProductPricing";
import CreditForm from "./product-card/CreditForm";
import type { CreditFormStatus } from "./product-card/CreditForm";
import type { ValidacionPhase, ValidacionStatus } from "./product-card/SistecreditoValidation";
import PriceDisplay from "./product-card/PriceDisplay";
import PlanCuotas from "./product-card/PlanCuotas";
import FinancieraGrid from "./product-card/FinancieraGrid";
import ProductImage from "./common/ProductImage";
import { getProductType, FINANCIERAS } from "../data/financieras";
import { extractProductSpecs } from "../utils/specs-parser";
import { seleccionarDestacados } from "../utils/featured-products";
import type { Product, Financiera } from "../types";
import ProductCard from "./ProductCard";
import "./product-page.css";

type Step = 'product' | 'credito-financieras' | 'credito-form';

interface ProductPageProps {
  productId?: string;
}

const ProductPage: React.FC<ProductPageProps> = ({ productId: propProductId }) => {
  const { productId: paramProductId } = useParams<{ productId?: string }>();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { products, isLoading, error } = useProducts();
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

  // Pricing derivations (hook-safe: useProductPricing no usa hooks internos y tolera null)
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
    if (!producto) return false;
    const cat = (producto.categoria || '').toLowerCase();
    if (cat.includes('accesorio') || cat.includes('accessory')) return true;
    return getProductType(producto.marca, producto.nombre, producto.categoria) === 'accesorio';
  }, [producto]);

  const specs = useMemo(() => {
    if (!producto || isAccesorio) {
      return { almacenamiento: null, ram: null, camara: null, pantalla: null, bateria: null };
    }
    return extractProductSpecs(producto);
  }, [producto, isAccesorio]);

  const hasAnySpec = Boolean(
    !isAccesorio && (specs.almacenamiento || specs.ram || specs.camara || specs.pantalla || specs.bateria)
  );

  // State
  const [step, setStep] = useState<Step>('product');
  const [selectedFinanciera, setSelectedFinanciera] = useState<Financiera | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [formValid, setFormValid] = useState(false);
  const [validPhase, setValidPhase] = useState<ValidacionPhase>('idle');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  // Logo de financiera caído (404/asset inexistente): nombre de la financiera
  // SOLO como fallback visible, nunca junto al logo (keyed por id para que
  // cambiar de financiera reintente el logo nuevo).
  const [logoFailedId, setLogoFailedId] = useState<string | null>(null);

  // Gallery images (mock - would come from product.images in real scenario)
  // Guard: Firestore es editable desde el admin, así que `imagenes` puede
  // llegar como string u objeto. Sin el Array.isArray, `[main, ...additional]`
  // repartiría un string carácter por carácter en las miniaturas.
  const galleryImages = useMemo(() => {
    if (!producto) return [];
    const main = producto.imagen;
    const additional = Array.isArray(producto.imagenes) ? producto.imagenes : [];
    const extra = additional.filter((img): img is string => typeof img === 'string' && img.trim() !== '');
    return main ? [main, ...extra] : [];
  }, [producto]);

  // Catálogo no disponible ≠ producto inexistente.
  // Si la suscripción a Firestore falló (offline, permisos, red) o la lista
  // vino vacía, `producto` también es null pero el producto SÍ existe: antes
  // se le decía al usuario "Producto no encontrado / no existe o ha sido
  // removido", que es mentira y era el reporte de "algunos productos no se
  // muestran". El 404 real solo se muestra cuando HAY catálogo y el id no está.
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

    if (error || products.length === 0) {
      return (
        <div className="product-page-load-error" role="alert">
          <div className="container py-5 text-center">
            <i className="bi bi-cloud-slash display-1 text-muted mb-3" aria-hidden="true" />
            <h2 className="text-primary mb-2">No pudimos cargar el catálogo</h2>
            <p className="text-muted mb-4">
              {error
                ? "Revisa tu conexión e inténtalo de nuevo: el producto puede seguir disponible."
                : "El catálogo no respondió. Inténtalo de nuevo en unos segundos."}
            </p>
            <button type="button" className="btn btn-primary" onClick={reloadProducts}>
              <i className="bi bi-arrow-clockwise me-2" aria-hidden="true" /> Reintentar
            </button>
            <div className="mt-3">
              <Link to="/catalogo" className="btn btn-outline-secondary">
                <i className="bi bi-arrow-left me-2" aria-hidden="true" /> Volver al catálogo
              </Link>
            </div>
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

  // Handlers
  const handleComprarWhatsApp = () => {
    trackLead({
      content_type: 'product',
      content_ids: [producto.id],
      content_name: producto.nombre,
      value: der.contado || 0,
      currency: 'COP',
    });
    if (phoneNumber) {
      window.open(
        buildWhatsAppUrl(
          phoneNumber,
          buildProductWhatsAppMessage({ nombre })
        ),
        '_blank'
      );
    }
  };

  const handleAgregarCarrito = () => {
    // trackAddToCart vive dentro de CartContext (NO duplicar acá)
    addToCart(producto, 'contado');
  };

  const handleSelectFinanciera = (financiera: Financiera) => {
    setSelectedFinanciera(financiera);
    setFormData({});
    setFormValid(false);
    setValidPhase('idle');
    setStep('credito-form');
  };

  const handleCreditFormStatus = (status: CreditFormStatus) => {
    setFormData(status.formData);
    setFormValid(status.isValid);
  };

  const handleValidacionStatus = (status: ValidacionStatus) => {
    setValidPhase(status.validPhase);
  };

  const handleSwitchFinanciera = (finId: string) => {
    const fin = FINANCIERAS.find((f) => f.id === finId);
    if (fin) {
      handleSelectFinanciera(fin);
    } else {
      setStep('credito-financieras');
    }
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

  // Origen del detalle: ProductCard/SearchAutocomplete dejan { from } en el
  // history state. Solo catálogo/tienda califican para navigate(-1): el
  // browser restaura scroll + filtros (?marca= etc.) de la entrada de
  // origen. Carga directa u otro origen (landing, otra ficha) → link
  // normal a /catalogo (push → arranca arriba).
  const desdeCatalogo = (() => {
    const from = (location.state as { from?: string } | null)?.from;
    return typeof from === "string" && (from === "/catalogo" || from.startsWith("/catalogo?") || from === "/tienda" || from.startsWith("/tienda?"));
  })();

  const handleVolverCatalogo = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (!desdeCatalogo) return; // Link navega normal a /catalogo
    event.preventDefault();
    navigate(-1);
  };

  return (
    <div className="product-page">
      {/* Back + Breadcrumb */}
      <nav className="product-breadcrumb" aria-label="Navegación">
        <div className="container">
          <Link to="/catalogo" className="product-back-link" onClick={handleVolverCatalogo}>
            <i className="bi bi-chevron-left" aria-hidden="true" />
            Volver al catálogo
          </Link>
          <ol className="breadcrumb mb-0">
            {breadcrumbItems.map((item) => (
              <li key={item.label} className="breadcrumb-item">
                {item.href ? (
                  <Link
                    to={item.href}
                    className="text-muted"
                    onClick={item.href === "/catalogo" ? handleVolverCatalogo : undefined}
                  >
                    {item.label}
                  </Link>
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

              {/* ─── PURCHASE BOX (precio + CTAs + hint) ───
                   En desktop ≥992 la caja queda sticky (estilo MercadoLibre):
                   visible mientras se scrollea la columna derecha. En móvil y
                   en el wizard de crédito se queda en flujo normal. */}
              <div className={`product-buybox${step === 'product' ? ' buybox-sticky' : ''}`}>
                <div className="product-pricing">
                  <PriceDisplay variant="page" der={der} />
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
                </div>

                <div className="product-actions">
                  <div className="product-actions-row">
                    <button
                      type="button"
                      className="btn btn-primary btn-lg product-btn-contado"
                      onClick={handleComprarWhatsApp}
                    >
                      <i className="bi bi-whatsapp me-2" aria-hidden="true" />
                      <span>Comprar por WhatsApp</span>
                    </button>
                    {tieneFinanciacion && (
                      <button
                        type="button"
                        className="btn btn-outline-primary btn-lg product-btn-financiar"
                        onClick={() => setStep('credito-financieras')}
                      >
                        <i className="bi bi-credit-card me-2" aria-hidden="true" />
                        <span>Financiar</span>
                      </button>
                    )}
                  </div>

                  {tieneFinanciacion && (
                    <div className="product-financing-hint">
                      <i className="bi bi-credit-card me-1" aria-hidden="true" />
                      <span>Disponible en {financierasDisponibles.length} financiera{financierasDisponibles.length > 1 ? 's' : ''}</span>
                    </div>
                  )}

                  {/* Acción fantasma (NO tercer CTA de compra): con la barra
                      sticky móvil eliminada (patrón ML: 0 fixed en móvil) el
                      carrito se agrega DESDE el buybox, en flujo. Conserva
                      addToCart + trackAddToCart y NO abre WhatsApp (bug
                      paymentAction). */}
                  <button
                    type="button"
                    className="product-btn-addcart"
                    onClick={handleAgregarCarrito}
                  >
                    <i className="bi bi-cart-plus" aria-hidden="true" />
                    <span>Agregar al carrito</span>
                  </button>
                </div>
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
                  {/* Panel único: header + contenido comparten un solo contenedor.
                      Sin este wrapper, .product-step-content (flex) trataba a
                      .step-header y .step-content como DOS paneles lado a lado —
                      recortado en 375px. */}
                  <div className="step-panel">
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

                    {step === 'credito-financieras' && (
                      <div className="step-content">
                        <h3 id="step-title" className="step-title">Selecciona una financiera</h3>
                        <FinancieraGrid
                          financierasDisponibles={financierasDisponibles}
                          onSelect={handleSelectFinanciera}
                        />
                      </div>
                    )}

                    {step === 'credito-form' && selectedFinanciera && (
                      <div className="step-content">
                        <h3
                          id="step-title"
                          className="step-title"
                          aria-label={selectedFinanciera.nombre}
                        >
                          <img
                            src={`/logoscredito/${selectedFinanciera.id.toLowerCase()}.webp`}
                            alt=""
                            className={`financiera-logo-sm${logoFailedId === selectedFinanciera.id ? ' d-none' : ''}`}
                            onError={() => setLogoFailedId(selectedFinanciera.id)}
                          />
                          {logoFailedId === selectedFinanciera.id && (
                            <span className="financiera-name-fallback">
                              {selectedFinanciera.nombre}
                            </span>
                          )}
                        </h3>
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
                </div>
              )}
            </section>

            {/* ─── LEFT BOTTOM: DESCRIPCIÓN + RECOMENDADOS ───
                 Vive en la COLUMNA IZQUIERDA (debajo de la galería), fuera de
                 .product-details: la buybox sticky (columna derecha) ya no
                 flota sobre las cards al scrollear. El runway del sticky lo
                 da .product-details estirado a la fila completa del grid
                 (grid-row: 1 / span 2 + align stretch). */}
            <div className="product-lower">
              {descripcion && (
                <div className="product-description">
                  <p>{descripcion}</p>
                </div>
              )}

              <RecommendedProducts currentProductId={producto.id} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

// ─── Recommended Products: carrusel scroll-snap con huella fija (ML) ───
// Reemplaza la grilla: la longitud vertical deja de crecer con el
// inventario y el layout no se reorganiza bajo el pulgar. El track es una
// región focuseable (tabindex=0) para desplazarlo con el teclado.
function RecommendedProducts({ currentProductId }: { currentProductId: string }) {
  const { products } = useProducts();
  const { popularIds, isLoading: cargandoPopulares } = usePopularProducts();
  const trackRef = useRef<HTMLDivElement>(null);
  const [trackEstado, setTrackEstado] = useState({
    scrolleable: false,
    alInicio: true,
    alFinal: true,
  });

  const recomendados = useMemo(() => {
    // Pide 6 candidatos y los usa todos DESPUÉS de excluir el producto
    // actual (el carrusel necesita inventario para tener scroll real;
    // antes la grilla recortaba a 4). Con count=4 (FEATURED_COUNT) y el
    // producto actual dentro de los destacados del día, la exclusión
    // dejaba 3 cards → una columna vacía.
    return seleccionarDestacados(products, popularIds, undefined, 6)
      .filter((p) => String(p.id) !== String(currentProductId))
      .slice(0, 6);
  }, [products, popularIds, currentProductId]);

  const sincronizarTrack = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setTrackEstado({
      scrolleable: max > 4,
      alInicio: el.scrollLeft <= 4,
      alFinal: el.scrollLeft >= max - 4,
    });
  }, []);

  // Identidad del contenido del track. Si cambia (llegan los stats de
  // popularidad, o el catálogo vivo actualiza), React reordena/remezcla
  // las slides y el navegador re-snap-ea SIGUIENDO al elemento que tenía
  // el snap → el carrusel saltaba de la 1ª a la 4ª card (medido: scrollLeft
  // 2 → 728 a los ~1s de cargar). Al cambiar la lista, se vuelve al inicio.
  const lista = recomendados.map((p) => String(p.id)).join('|');

  // Recalcula flechas/estados al montar, al cambiar la lista y al
  // redimensionar: de eso dependen los botones y sus estados disabled.
  useEffect(() => {
    const el = trackRef.current;
    if (el && el.scrollLeft !== 0) el.scrollLeft = 0;
    sincronizarTrack();
  }, [lista, sincronizarTrack]);

  useEffect(() => {
    window.addEventListener('resize', sincronizarTrack);
    return () => window.removeEventListener('resize', sincronizarTrack);
  }, [sincronizarTrack]);

  const desplazar = (direccion: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    const slide = el.querySelector<HTMLElement>('.recommended-slide');
    const paso = (slide?.offsetWidth || 224) + 12; // ancho + gap (huella ML)
    el.scrollBy?.({ left: direccion * paso, behavior: 'smooth' });
  };

  // Espera a los stats de popularidad: renderizar con el fallback y
  // reemplazar la lista 1s después cambiaba las cards bajo el usuario
  // (y disparaba el salto de snap de arriba). Un solo render con la lista
  // final.
  if (cargandoPopulares || recomendados.length === 0) return null;

  return (
    <section className="recommended-section" aria-labelledby="recommended-title">
      <div className="recommended-header">
        <h2 id="recommended-title" className="recommended-title">También te puede interesar</h2>
        {trackEstado.scrolleable && (
          <div className="recommended-nav">
            <button
              type="button"
              className="recommended-nav-btn"
              onClick={() => desplazar(-1)}
              disabled={trackEstado.alInicio}
              aria-label="Desplazar a productos recomendados anteriores"
            >
              <i className="bi bi-chevron-left" aria-hidden="true" />
            </button>
            <button
              type="button"
              className="recommended-nav-btn"
              onClick={() => desplazar(1)}
              disabled={trackEstado.alFinal}
              aria-label="Desplazar a más productos recomendados"
            >
              <i className="bi bi-chevron-right" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>

      <div
        className="recommended-track"
        ref={trackRef}
        tabIndex={0}
        role="region"
        aria-label="Productos recomendados"
        onScroll={sincronizarTrack}
      >
        {recomendados.map((producto) => (
          <div className="recommended-slide" key={producto.id}>
            <ProductCard producto={producto} />
          </div>
        ))}
      </div>
    </section>
  );
}

export default ProductPage;