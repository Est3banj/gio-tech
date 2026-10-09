import React from "react";
import { Link, Navigate, useSearchParams, useNavigate } from "react-router-dom";
import { useProducts } from "../hooks/useProducts";
import { usePopularProducts } from "../hooks/usePopularProducts";
import { useWhatsappNumber } from "../contexts/whatsapp-number-context";
import ProductCard from "./ProductCard";
import BannerSlider from "./BannerSlider";
import { BrandLogo } from "./BrandLogos";
import { seleccionarDestacados } from "../utils/featured-products";
import { DEFAULT_MAPS_URL } from "./Footer";
import SearchAutocomplete from "./SearchAutocomplete";
import Reveal from "./Reveal";
import { HalloweenHeroDecor } from "./HalloweenDecor";
import ReviewsFeed, { type FeedReview } from "./ReviewsFeed";
import { useOpinions } from "../hooks/useOpinions";
import { getProductIdFromSearchParams } from "../utils/deep-link";
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
];

/** Iniciales para el avatar del feed (2 letras máx.). */
function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0].charAt(0);
  const second = parts.length > 1 ? parts[parts.length - 1].charAt(0) : "";
  return (first + second).toUpperCase();
}

// Datos de prueba SOLO para desarrollo local (/?mockReviews=1).
// En producción import.meta.env.DEV es false y esto se poda del bundle.
const MOCK_OPINIONES_DEV: FeedReview[] = [
  {
    id: "m1",
    name: "Andrea P.",
    rating: 5,
    text: "Compré el iPhone 15 y me lo entregaron el mismo día. La atención en la tienda de Puerto Asís es de primera.",
    location: "Puerto Asís, Putumayo",
    avatar: "AP",
    url: "https://www.google.com/maps",
  },
  {
    id: "m2",
    name: "Jorge M.",
    rating: 5,
    text: "El equipo llegó con todos los accesorios y con garantía. Me asesoraron por WhatsApp antes de comprar.",
    location: "Mocoa, Putumayo",
    avatar: "JM",
  },
  {
    id: "m3",
    name: "Diana C.",
    rating: 4,
    text: "Buena variedad de celulares y precios justos. La financiación con Sistecrédito me salvó el mes.",
    location: "Orito, Putumayo",
    avatar: "DC",
  },
  {
    id: "m4",
    name: "Andrés V.",
    rating: 5,
    text: "Cambiaron la pantalla de mi Moto G en menos de una hora. Trabajo impecable y precio fair.",
    location: "La Hormiga, Putumayo",
    avatar: "AV",
  },
  {
    id: "m5",
    name: "Camila T.",
    rating: 5,
    text: "Súper recomendados. Compré la tablet para mis clases y me la entregaron configurada.",
    location: "Puerto Asís, Putumayo",
    avatar: "CT",
    url: "https://www.google.com/maps",
  },
  {
    id: "m6",
    name: "Hernán L.",
    rating: 5,
    text: "Servicio técnico rápido y honesto: me dijeron el precio antes de empezar y no hubo sorpresas.",
    location: "Sibundoy, Putumayo",
    avatar: "HL",
  },
  {
    id: "m7",
    name: "Rosa E.",
    rating: 4,
    text: "Atención cordial en el mostrador. Me ayudaron a elegir un equipo dentro de mi presupuesto.",
    location: "Mocoa, Putumayo",
    avatar: "RE",
  },
  {
    id: "m8",
    name: "Iván Q.",
    rating: 5,
    text: "Ya es mi segunda compra. El Galaxy S25 llegó antes de lo prometido y con factura al día.",
    location: "Puerto Asís, Putumayo",
    avatar: "IQ",
  },
];

const LandingPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { products } = useProducts();
  const { popularIds } = usePopularProducts();
  const phoneNumber = useWhatsappNumber() || "573223652569";
  const { opinions } = useOpinions();

  // En dev se puede simular el feed con /?mockReviews=1 (no existe en prod).
  const showMockOpiniones = import.meta.env.DEV && searchParams.has("mockReviews");
  const feedReviews: FeedReview[] = showMockOpiniones
    ? MOCK_OPINIONES_DEV
    : opinions.map((o) => ({
        id: o.id,
        name: o.autor,
        rating: o.estrellas,
        text: o.texto,
        location: o.ubicacion || "",
        avatar: initialsFrom(o.autor),
        url: o.perfilUrl || undefined,
      }));

  // Deep links legacy (/?producto=ID o /?id=ID) → directo al detalle.
  // Defensa si LandingPage se renderiza fuera de RootRoute; en sincronía con App.
  const targetProductId = getProductIdFromSearchParams(searchParams);

  if (targetProductId) {
    return <Navigate to={`/producto/${targetProductId}`} replace />;
  }

  // Una sola grilla de productos: ranking real de vistas (top 4),
  // con fallback a rotación editorial si aún no hay datos de vistas.
  const rankingVistas: Product[] = popularIds
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is Product => Boolean(p))
    .slice(0, 4);
  const productosDestacados: Product[] =
    rankingVistas.length > 0 ? rankingVistas : seleccionarDestacados(products, []);
  const waTechLink = `https://wa.me/${phoneNumber}?text=${encodeURIComponent("Hola GIO TECH, me gustaría consultar por el servicio técnico express para mi celular")}`;

  // Conteo por marca (match exacto) para la prueba de inventario en Marcas oficiales
  const brandCounts: Record<string, number> = {};
  for (const p of products) {
    const m = (p.marca ?? "").trim().toLowerCase();
    if (m) brandCounts[m] = (brandCounts[m] ?? 0) + 1;
  }

  const handleSearch = (query: string) => {
    navigate(`/catalogo?buscar=${encodeURIComponent(query)}`);
  };

  const handleSelect = (suggestion: { href?: string }) => {
    if (suggestion.href) navigate(suggestion.href);
  };

  return (
    <div className="landing-wrapper">
      {/* ─── 1. HERO EDITORIAL ─── */}
      <section className="editorial-hero" aria-label="Buscador principal GIO TECH">
        {/* Decor Halloween: bats dentro de los bounds del hero + calabazas en el borde inferior */}
        <HalloweenHeroDecor />
        <div className="landing-container">
          <h1 className="editorial-title">
            Tu nuevo celular al <span className="editorial-accent">mejor precio</span>
            <br />
            en Puerto Asís
          </h1>
          <p className="editorial-sub">
            ¿Buscando smartphone? Aquí te financiamos rápido —incluso si estás reportado o no tienes vida crediticia—, te lo mandamos a cualquier municipio del Putumayo y te respondemos con garantía.
          </p>
          <div className="editorial-search">
            <SearchAutocomplete
              size="lg"
              onSearch={handleSearch}
              onSelect={handleSelect}
              placeholder="¿Qué equipo estás buscando hoy?"
              maxProducts={6}
              maxCategories={5}
              showRecent={true}
              ariaLabel="Buscar productos, marcas, reparaciones"
            />
          </div>
          <div className="editorial-chips">
            {brandShortcuts.map((brand) => (
              <Link
                key={brand.name}
                to={`/catalogo?marca=${encodeURIComponent(brand.queryParam)}`}
                className="editorial-chip"
              >
                {brand.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 2. TRUST PILARS ─── */}
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

      {/* ─── 4. FEATURED PRODUCTS (Recommended) ─── */}
      {productosDestacados.length > 0 && (
        <section className="featured-section featured-products-section" aria-label="Equipos recomendados">
          <div className="landing-container">
            <Reveal>
              <div className="section-header section-header--split">
                <div className="section-header-text">
                  <span className="featured-eyebrow">
                    <i className="bi bi-award-fill me-1" aria-hidden="true" />
                    Recomendados para ti
                  </span>
                  <h2 className="section-title">Equipos destacados</h2>
                  <p className="section-subtitle">
                    Lo que más compran nuestros clientes en Putumayo
                  </p>
                </div>
                <Link to="/catalogo" className="section-header-btn">
                  Ver catálogo completo <i className="bi bi-arrow-right" aria-hidden="true" />
                </Link>
              </div>
            </Reveal>
            <div className="landing-featured-grid">
              {productosDestacados.map((producto, i) => (
                <Reveal key={producto.id} delay={i * 60} className="h-100">
                  <ProductCard producto={producto} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── 8. REVIEWS (feed rotativo de opiniones reales de Google) ─── */}
      <section className="reviews-section" aria-label="Opiniones de clientes">
        <div className="landing-container">
          <div className="section-header">
            <span className="featured-eyebrow">
              <i className="bi bi-star-fill me-1" aria-hidden="true" />
              Lo que dicen nuestros clientes
            </span>
            <h2 className="section-title">Opiniones reales</h2>
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
          {feedReviews.length > 0 && <ReviewsFeed reviews={feedReviews} />}
        </div>
      </section>

      {/* ─── 9. BRAND SHORTCUTS (Footer CRO) ─── */}
      <section className="brand-shortcuts-section" aria-label="Marcas disponibles">
        <div className="landing-container">
          <div className="section-header section-header--split">
            <div className="section-header-text">
              <span className="featured-eyebrow">Trabajamos con</span>
              <h2 className="section-title">Marcas oficiales</h2>
            </div>
            <Link to="/catalogo" className="section-header-btn">
              Ver catálogo <i className="bi bi-arrow-right" aria-hidden="true" />
            </Link>
          </div>
          <div className="brand-shortcuts-grid">
            {brandShortcuts.map((brand, i) => {
              const count = brandCounts[brand.name.trim().toLowerCase()] ?? 0;
              return (
                <Reveal key={brand.name} delay={i * 50}>
                  <Link
                    to={`/catalogo?marca=${encodeURIComponent(brand.queryParam)}`}
                    className="brand-shortcut-card"
                    aria-label={`${brand.name} - ${brand.subtitle}`}
                  >
                    <div className="brand-shortcut-icon-wrap">
                      <BrandLogo brand={brand.name} className="brand-shortcut-logo" />
                    </div>
                    <h3 className="brand-shortcut-name">{brand.name}</h3>
                    <p className="brand-shortcut-subtitle">{brand.subtitle}</p>
                    {count > 0 && (
                      <span className="brand-shortcut-count">
                        {count} equipo{count === 1 ? "" : "s"}
                      </span>
                    )}
                  </Link>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── 10. CTA FINAL ─── */}
      <section className="cta-section cta-section--final" aria-label="Contacto final">
        <div className="landing-container">
          <div className="cta-card cta-card--final">
            <h2 className="cta-title">¿Listo para tu próximo smartphone?</h2>
            <p className="cta-desc">
              Envíos a todo Putumayo · Financiación inmediata · Garantía por escrito
            </p>
            <div className="cta-actions">
              <Link to="/catalogo" className="cta-btn cta-btn--primary">
                <i className="bi bi-phone me-2" aria-hidden="true" />
                Explorar catálogo
              </Link>
              <a
                href={waTechLink}
                target="_blank"
                rel="noopener noreferrer"
                className="cta-btn cta-btn--whatsapp"
              >
                <i className="bi bi-whatsapp me-2" aria-hidden="true" />
                Asesoría WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;