import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { subscribeToProducts } from "../services/product.service";
import { subscribeToConfig } from "../services/config.service";
import { useWhatsappNumber } from "../contexts/WhatsappNumberContext";
import ProductCard from "./ProductCard";
import HeroCarousel from "./HeroCarousel";

// ─── CONSTANTES DEFINIDAS (Para evitar el ReferenceError) ──────────
const trustItems = [
    { icon: "bi-shield-check", title: "Garantía real", desc: "Todos nuestros equipos cuentan con garantía respaldada por el proveedor." },
    { icon: "bi-tools", title: "Servicio técnico", desc: "Reparación profesional con técnicos certificados y repuestos de la mejor calidad." },
    { icon: "bi-headset", title: "Atención personalizada", desc: "Te asesoramos uno a uno para que elijas el equipo perfecto para ti." },
    { icon: "bi-box-seam", title: "Envíos seguros", desc: "Despachamos a todo el Departamento del Putumayo con embalaje protegido y seguimiento." },
];

const reviews = [
    { name: "Valentina R.", rating: 5, text: "Excelente atención. Me ayudaron a escoger el celular ideal para mi trabajo y llegó en perfectas condiciones.", location: "Puerto Asís, Putumayo", avatar: "VR" },
    { name: "Carlos M.", rating: 5, text: "Compré a crédito y el proceso fue muy fácil. El equipo llegó el mismo día. ¡Muy recomendado!", location: "Mocoa, Putumayo", avatar: "CM" },
    { name: "Laura P.", rating: 5, text: "El servicio técnico resolvió el problema de mi teléfono en pocas horas. Profesionales de verdad.", location: "Orito, Putumayo", avatar: "LP" },
    { name: "Andrés F.", rating: 5, text: "Llevo dos compras con ellos y siempre la misma calidad. La asesoría por WhatsApp es rapidísima.", location: "La hormiga, Putumayo", avatar: "AF" },
    { name: "Paula G.", rating: 5, text: "Me garantizaron el precio más bajo de la región. Super satisfecha con mi Samsung.", location: "Puerto Asís, Putumayo", avatar: "PG" },
];

const services = [
    { icon: "bi-phone", title: "Venta de equipos", desc: "Celulares, tablets y accesorios de las mejores marcas. Contado y crédito disponible.", link: "/catalogo", linkText: "Ver catálogo", accent: "var(--gio-red)" },
    { icon: "bi-tools", title: "Servicio técnico", desc: "Diagnóstico, reparación y mantenimiento profesional. Garantía en cada trabajo.", link: "/servicio-tecnico", linkText: "Conocer más", accent: "var(--brand-blue)" },
    { icon: "bi-chat-heart", title: "Asesoría personalizada", desc: "Te orientamos sin presión para que tomes la mejor decisión según tu presupuesto.", link: null, linkText: "Hablar con un asesor", accent: "var(--brand-green)", isWA: true },
];

// ─── COMPONENTE LANDINGPAGE ───────────────────────────────────────
function LandingPage() {
    const [productos, setProductos] = useState([]);
    const [businessName, setBusinessName] = useState("");
    const [isLoading, setIsLoading] = useState(true); // OPTIMIZACIÓN: Carga suave
    const phoneNumber = useWhatsappNumber() || "573248022632";
    const navigate = useNavigate();

    useEffect(() => {
        const unsubProducts = subscribeToProducts(
            (lista) => {
                setProductos(lista);
                setIsLoading(false);
            },
            () => setIsLoading(false)
        );

        const unsubConfig = subscribeToConfig(
            (data) => setBusinessName((data && data.nombre) ? data.nombre : ""),
            () => { }
        );

        // Seguridad: Si Firebase falla o tarda mucho, liberamos la vista en 2 seg
        const timer = setTimeout(() => setIsLoading(false), 2000);

        return () => {
            unsubProducts();
            unsubConfig();
            clearTimeout(timer);
        };
    }, []);

    const destacados = productos.slice(0, 4);
    const waLink = `https://wa.me/${phoneNumber}?text=${encodeURIComponent("Hola GIO TECH, me gustaría recibir asesoría personalizada")}`;

    return (
        <div className="landing-wrapper" style={{ backgroundColor: '#020617', minHeight: '100vh' }}>

            {/* 1. CAROUSEL CON RESERVA DE ESPACIO (Mejora el CLS) */}
            <div style={{ minHeight: '400px', backgroundColor: '#020617' }}>
                <HeroCarousel />
            </div>

            {/* 2. HERO */}
            <section className="landing-hero section-padding-lg">
                <div className="section-inner">
                    <span className="landing-hero-eyebrow">Puerto Asís · Putumayo · Colombia</span>
                    <h1 className="landing-hero-title">
                        Tecnología que<br />
                        <span className="landing-hero-accent">mereces.</span>
                    </h1>
                    <p className="landing-hero-sub">
                        Celulares, servicio técnico y asesoría real.
                    </p>
                    <div className="landing-hero-actions">
                        <Link to="/catalogo" className="landing-btn-primary">Ver productos</Link>
                        <Link to="/servicio-tecnico" className="landing-btn-ghost">Servicio técnico</Link>
                    </div>
                </div>
            </section>

            {/* 3. TRUST ITEMS (Donde estaba el error) */}
            <section className="trust-section section-padding-lg">
                <div className="section-inner">
                    <div className="trust-grid">
                        {trustItems.map((item) => (
                            <div key={item.title} className="trust-item">
                                <div className="trust-icon"><i className={`bi ${item.icon}`}></i></div>
                                <h3 className="trust-title">{item.title}</h3>
                                <p className="trust-desc">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 4. SERVICIOS */}
            <section className="services-section section-padding-lg">
                <div className="section-inner">
                    <div className="section-header">
                        <h2 className="section-title">Nuestros Servicios</h2>
                    </div>
                    <div className="services-grid">
                        {services.map((s) => (
                            <div key={s.title} className="service-card">
                                <div className="service-icon-wrap" style={{
                                    background: s.accent.includes('--') ? `rgba(var(${s.accent.replace('var(', '').replace(')', '')}-rgb, 200, 16, 46), 0.1)` : `${s.accent}12`,
                                    color: s.accent
                                }}>
                                    <i className={`bi ${s.icon}`}></i>
                                </div>
                                <h3 className="service-title">{s.title}</h3>
                                <p className="service-desc">{s.desc}</p>
                                {s.isWA ? (
                                    <a href={waLink} target="_blank" rel="noopener noreferrer" className="service-link" style={{ color: s.accent }}>
                                        {s.linkText} <i className="bi bi-arrow-right ms-1"></i>
                                    </a>
                                ) : (
                                    <Link to={s.link} className="service-link" style={{ color: s.accent }}>
                                        {s.linkText} <i className="bi bi-arrow-right ms-1"></i>
                                    </Link>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 5. RESEÑAS OPTIMIZADAS (Sin texto flotante arriba) */}
            <section className="reviews-section" style={{ minHeight: '450px', backgroundColor: '#020617' }}>
                <div className="landing-container">
                    <div className="section-header">
                        <h2 className="section-title">Lo que dicen nuestros clientes</h2>
                        <div className="mt-4">
                            <a href="https://g.page/r/CUMXzI9Acx9nEAE/review" target="_blank" rel="noopener noreferrer" className="landing-btn-google">
                                <i className="bi bi-google me-2"></i>Califícanos en Google Maps
                            </a>
                        </div>
                    </div>
                </div>
                <div className="reviews-scroll-wrapper">
                    <div className="reviews-track">
                        {reviews.map((r, i) => (
                            <div key={i} className="review-card" style={{ position: 'relative' }}>
                                <div className="review-google-verify" style={{ position: 'absolute', top: '15px', right: '15px', display: 'flex', alignItems: 'center' }}>
                                    <i className="bi bi-patch-check-fill text-primary me-1"></i>
                                    <span style={{ fontSize: '11px' }}>Google Review</span>
                                </div>
                                <div className="review-stars">
                                    {Array.from({ length: r.rating }).map((_, k) => (
                                        <i key={k} className="bi bi-star-fill" style={{ color: '#fbaf08' }}></i>
                                    ))}
                                </div>
                                <p className="review-text">"{r.text}"</p>
                                <div className="review-author">
                                    <div className="review-avatar">{r.avatar}</div>
                                    <div className="review-name">{r.name}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 6. PRODUCTOS DESTACADOS */}
            {!isLoading && destacados.length > 0 && (
                <section className="featured-section section-padding-lg">
                    <div className="section-inner">
                        <div className="section-header">
                            <h2 className="section-title">Productos Destacados</h2>
                        </div>
                        <div className="featured-grid">
                            {destacados.map((producto) => (
                                <div key={producto.id} className="featured-card-wrap">
                                    <ProductCard producto={producto} />
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
}

export default LandingPage;