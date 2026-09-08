import React from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { useProducts } from "../hooks/useProducts";
import { usePopularProducts } from "../hooks/usePopularProducts";
import { useWhatsappNumber } from "../contexts/whatsapp-number-context";
import ProductCard from "./ProductCard";
import BannerSlider from "./BannerSlider";
import { BrandLogo } from "./BrandLogos";
import { seleccionarDestacados } from "../utils/featured-products";
import { DEFAULT_MAPS_URL } from "./Footer";
import type { Product } from "../types";

interface TrustItem {
  icon: string;
  title: string;
  desc: string;
}

export interface BrandShortcut {
  name: string;
  queryParam: string;
  subtitle: string;
}

interface Review {
  name: string;
  rating: number;
  text: string;
  location: string;
  avatar: string;
}

const trustItems: TrustItem[] = [
  {
    icon: "bi-geo-alt-fill",
    title: "Sede Física en Puerto Asís",
    desc: "Cra. 32 #13 36. Atención presencial, respaldo directo y compra con total tranquilidad en tienda local.",
  },
  {
    icon: "bi-credit-card-2-front-fill",
    title: "Financiación Inmediata",
    desc: "Sistecrédito, Krediya, PayJoy, Esmiopción sin tarjeta de crédito y con aprobación en minutos.",
  },
  {
    icon: "bi-truck",
    title: "Envíos a todo Putumayo",
    desc: "Despachos 100% asegurados a Mocoa, Orito, La Hormiga, Villagarzón y todo el departamento.",
  },
  {
    icon: "bi-shield-check",
    title: "Garantía Real por Escrito",
    desc: "Garantía legal directa por escrito en todos nuestros smartphones, accesorios y reparaciones.",
  },
];

export const brandShortcuts: BrandShortcut[] = [
  { name: "Apple", queryParam: "Apple", subtitle: "iPhone & iPad" },
  { name: "Samsung", queryParam: "Samsung", subtitle: "Galaxy S, A & Z" },
  { name: "Xiaomi", queryParam: "Xiaomi", subtitle: "Redmi & POCO" },
  { name: "Motorola", queryParam: "Motorola", subtitle: "Moto G & Edge" },
  { name: "Tecno", queryParam: "Tecno", subtitle: "Spark & Camon" },
  { name: "Infinix", queryParam: "Infinix", subtitle: "Hot & Note" },
  { name: "Honor", queryParam: "Honor", subtitle: "Magic & Serie X" },
];

const reviews: Review[] = [
  {
    name: "Valentina R.",
    rating: 5,
    text: "Excelente atención. Me asesoraron para elegir el celular ideal para mi trabajo y llegó impecable.",
    location: "Puerto Asís, Putumayo",
    avatar: "VR",
  },
  {
    name: "Carlos M.",
    rating: 5,
    text: "Compré a crédito con Sistecrédito y el proceso fue súper rápido. El equipo lo retiré el mismo día.",
    location: "Mocoa, Putumayo",
    avatar: "CM",
  },
  {
    name: "Laura P.",
    rating: 5,
    text: "El servicio técnico resolvió el problema de pantalla de mi teléfono en 45 minutos. Profesionales reales.",
    location: "Orito, Putumayo",
    avatar: "LP",
  },
  {
    name: "Andrés F.",
    rating: 5,
    text: "Llevo dos compras con ellos y siempre la misma seriedad. La asesoría por WhatsApp es inmediata.",
    location: "La Hormiga, Putumayo",
    avatar: "AF",
  },
  {
    name: "Paula G.",
    rating: 5,
    text: "Me garantizaron el mejor precio de la región con garantía por escrito. Totalmente recomendados.",
    location: "Puerto Asís, Putumayo",
    avatar: "PG",
  },
];

const LandingPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { products } = useProducts();
  const { popularIds } = usePopularProducts();
  const phoneNumber = useWhatsappNumber() || "573223652569";

  const hasProductQuery = Boolean(searchParams.get("producto") || searchParams.get("id"));

  if (hasProductQuery) {
    return <Navigate to={`/catalogo?${searchParams.toString()}`} replace />;
  }

  const productosDestacados: Product[] = seleccionarDestacados(products, popularIds);
  const waTechLink = `https://wa.me/${phoneNumber}?text=${encodeURIComponent("Hola GIO TECH, me gustaría consultar por el servicio técnico express para mi celular")}`;

  return (
    <div className="landing-wrapper">
      {/* 1. HERO BANNER SLIDER */}
      <section className="landing-banner-section banner-section" aria-label="Banners y promociones destacadas">
        <BannerSlider />
      </section>

      {/* 2. 4 PILARES DE CONFIANZA */}
      <section className="trust-section" aria-label="Pilares de confianza GIO TECH">
        <div className="landing-container">
          <div className="trust-grid">
            {trustItems.map((item) => (
              <div key={item.title} className="trust-item">
                <div className="trust-icon" aria-hidden="true">
                  <i className={`bi ${item.icon}`} />
                </div>
                <h2 className="trust-title">{item.title}</h2>
                <p className="trust-desc">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. EQUIPOS DESTACADOS (ARRIBA - CRO) */}
      <section className="featured-section featured-products-section" aria-label="Equipos destacados del día">
        <div className="landing-container">
          <div className="section-header">
            <span className="featured-eyebrow">
              <i className="bi bi-fire me-1" aria-hidden="true" />
              Smartphones recomendados
            </span>
            <h2 className="section-title">Equipos Destacados</h2>
            <p className="section-sub">
              Los celulares más cotizados del día con disponibilidad inmediata en Puerto Asís y precios de contado o a cuotas.
            </p>
          </div>

          {productosDestacados.length > 0 ? (
            <div className="featured-grid landing-featured-grid products-grid">
              {productosDestacados.map((producto) => (
                <div key={producto.id} className="featured-card-wrap">
                  <ProductCard producto={producto} isPopular={producto.esDestacado} />
                </div>
              ))}
            </div>
          ) : (
            <div className="featured-empty-placeholder text-center py-5">
              <p className="text-muted">Cargando los mejores equipos para ti...</p>
            </div>
          )}

          <div className="featured-catalog-cta">
            <Link to="/catalogo" className="featured-catalog-btn" aria-label="Explorar todo el catálogo de celulares">
              <i className="bi bi-phone me-2" aria-hidden="true" />
              <span>Explorar todo el catálogo de celulares</span>
              <i className="bi bi-arrow-right ms-2" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* 4. ATAJOS RÁPIDOS POR MARCA */}
      <section className="brand-shortcuts-section" aria-label="Marcas destacadas de smartphones">
        <div className="landing-container">
          <div className="section-header">
            <span className="brand-shortcuts-eyebrow">
              <i className="bi bi-grid-fill me-1" aria-hidden="true" />
              Filtrado directo
            </span>
            <h2 className="section-title">Atajos Rápidos por Marca</h2>
            <p className="section-sub">
              Explorá al instante los modelos disponibles de las marcas líderes en tecnología móvil.
            </p>
          </div>

          <div className="brand-shortcuts-grid">
            {brandShortcuts.map((brand) => (
              <Link
                key={brand.name}
                to={`/catalogo?marca=${encodeURIComponent(brand.queryParam)}`}
                className="brand-shortcut-card"
                aria-label={`Ver celulares de la marca ${brand.name}`}
              >
                <div className="brand-shortcut-icon-wrap">
                  <BrandLogo
                    brand={brand.name}
                    className="brand-shortcut-logo"
                    alt={`Logo oficial ${brand.name}`}
                  />
                </div>
                <span className="brand-shortcut-name">{brand.name}</span>
                <span className="brand-shortcut-subtitle">{brand.subtitle}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 5. SERVICIO TÉCNICO EXPRESS */}
      <section className="lab-express-section" aria-label="Servicio técnico express de celulares">
        <div className="landing-container">
          <div className="lab-express-card">
            <div className="lab-express-badge">
              <i className="bi bi-tools me-1" aria-hidden="true" />
              Laboratorio Técnico Especializado
            </div>
            <h2 className="lab-express-title">
              ¿Pantalla rota o batería degradada? Reparaciones en 45 min en Puerto Asís con garantía
            </h2>
            <p className="lab-express-desc">
              Contamos con banco de trabajo profesional, técnicos certificados e instrumental de precisión para reparar tu iPhone o Android en tiempo récord con repuestos de máxima calidad.
            </p>

            <div className="lab-express-features">
              <div className="lab-express-feature-item">
                <i className="bi bi-stopwatch text-danger me-2" aria-hidden="true" />
                <span>Reparación express en 45 minutos</span>
              </div>
              <div className="lab-express-feature-item">
                <i className="bi bi-patch-check-fill text-success me-2" aria-hidden="true" />
                <span>Garantía real por escrito</span>
              </div>
              <div className="lab-express-feature-item">
                <i className="bi bi-clipboard2-pulse text-primary me-2" aria-hidden="true" />
                <span>Diagnóstico inicial sin costo</span>
              </div>
              <div className="lab-express-feature-item">
                <i className="bi bi-shield-lock-fill text-warning me-2" aria-hidden="true" />
                <span>Técnicos certificados iPhone & Android</span>
              </div>
            </div>

            <div className="lab-express-actions">
              <Link to="/servicio-tecnico" className="landing-btn-primary" aria-label="Ir a cotizar servicio técnico">
                <i className="bi bi-wrench-adjustable me-2" aria-hidden="true" />
                <span>Cotizar Reparación Express</span>
              </Link>
              <a
                href={waTechLink}
                target="_blank"
                rel="noopener noreferrer"
                className="landing-btn-ghost"
                aria-label="Contactar al laboratorio técnico por WhatsApp"
              >
                <i className="bi bi-whatsapp text-success me-2" aria-hidden="true" />
                <span>Hablar con el Técnico</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 6. SEDE FÍSICA & RESEÑAS GOOGLE MAPS */}
      <section className="store-physical-section" aria-label="Sede física y opiniones en Google Maps">
        <div className="landing-container">
          {/* Tarjeta de Sede Física */}
          <div className="store-physical-card">
            <div className="store-physical-grid">
              <div className="store-physical-info">
                <span className="store-physical-eyebrow">
                  <i className="bi bi-shop me-1" aria-hidden="true" />
                  Punto de Atención Presencial
                </span>
                <h3 className="store-physical-heading">Visítanos en Nuestra Sede Oficial</h3>
                <div className="store-physical-details">
                  <div className="store-physical-item">
                    <div className="store-physical-icon" aria-hidden="true">
                      <i className="bi bi-geo-alt-fill" />
                    </div>
                    <div>
                      <div className="store-physical-title">Dirección</div>
                      <div className="store-physical-value">Cra. 32 #13 36, Puerto Asís, Putumayo</div>
                    </div>
                  </div>
                  <div className="store-physical-item">
                    <div className="store-physical-icon" aria-hidden="true">
                      <i className="bi bi-clock-fill" />
                    </div>
                    <div>
                      <div className="store-physical-title">Horarios de Atención</div>
                      <div className="store-physical-value">Lunes a Sábado: 8:00 AM - 7:00 PM</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="store-physical-action text-md-end">
                <a
                  href={DEFAULT_MAPS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="landing-btn-google-primary"
                  aria-label="Abrir dirección de GIO TECH en Google Maps"
                >
                  <i className="bi bi-geo-alt-fill text-danger me-2" aria-hidden="true" />
                  <span>Abrir en Google Maps</span>
                  <i className="bi bi-box-arrow-up-right ms-2" aria-hidden="true" />
                </a>
              </div>
            </div>
          </div>

          {/* Sección de Reseñas */}
          <div className="section-header">
            <h2 className="section-title">Lo que dicen nuestros clientes</h2>
            <p className="section-sub">
              Opiniones 100% reales de clientes que compran y reparan con nosotros en Putumayo.
            </p>
            <div className="mt-4">
              <a
                href="https://g.page/r/CUMXzI9Acx9nEAE/review"
                target="_blank"
                rel="noopener noreferrer"
                className="landing-btn-google"
                aria-label="Dejar reseña en Google Maps"
              >
                <i className="bi bi-google me-2" aria-hidden="true" />
                <span>Califícanos en Google Maps</span>
              </a>
            </div>
          </div>
        </div>

        {/* Carrusel horizontal de testimonios */}
        <div className="reviews-scroll-wrapper" role="region" aria-label="Carrusel de opiniones de clientes">
          <div className="reviews-track">
            {reviews.map((r, i) => (
              <div key={i} className="review-card">
                <div className="review-google-verify">
                  <i className="bi bi-patch-check-fill text-primary me-1" aria-hidden="true" />
                  <span>Google Review</span>
                </div>
                <div className="review-stars" aria-label={`Calificación: ${r.rating} de 5 estrellas`}>
                  {Array.from({ length: r.rating }).map((_, k) => (
                    <i key={k} className="bi bi-star-fill" aria-hidden="true" />
                  ))}
                </div>
                <p className="review-text">"{r.text}"</p>
                <div className="review-author">
                  <div className="review-avatar" aria-hidden="true">{r.avatar}</div>
                  <div>
                    <div className="review-name">{r.name}</div>
                    <small className="text-muted" style={{ fontSize: '0.75rem' }}>{r.location}</small>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
