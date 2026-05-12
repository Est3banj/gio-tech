// src/components/ServicioTecnicoPage.tsx
import React from "react";
import { useWhatsappNumber } from "../contexts/WhatsappNumberContext";

interface Reparacion {
    icon: string;
    label: string;
}

interface Paso {
    num: string;
    title: string;
    desc: string;
}

const reparaciones: Reparacion[] = [
    { icon: "bi-phone", label: "Pantallas rotas" },
    { icon: "bi-battery-half", label: "Baterías agotadas" },
    { icon: "bi-usb-plug", label: "Puertos de carga" },
    { icon: "bi-camera", label: "Cámaras dañadas" },
    { icon: "bi-droplet-half", label: "Daños por agua" },
    { icon: "bi-mic", label: "Micrófonos / audio" },
    { icon: "bi-wifi-off", label: "Antena / señal" },
    { icon: "bi-code-square", label: "Software y sistema" },
];

const pasos: Paso[] = [
    {
        num: "01",
        title: "Trae tu equipo",
        desc: "Visítanos en nuestra sede o coordina el envío seguro desde cualquier municipio.",
    },
    {
        num: "02",
        title: "Diagnóstico Reembolsable",
        desc: "Evaluación técnica en 30 min. El costo del diagnóstico se abona al total de tu reparación; ¡si reparas con nosotros, el diagnóstico no te cuesta!",
    },
    {
        num: "03",
        title: "Aprobás y reparamos",
        desc: "Si aceptás el presupuesto, nuestro técnico comienza de inmediato con repuestos de excelente calidad.",
    },
    {
        num: "04",
        title: "Listo con garantía",
        desc: "Te entregamos el equipo funcionando al 100% y con garantía escrita de 15 días.",
    },
];

const ServicioTecnicoPage: React.FC = () => {
    const phoneNumber = useWhatsappNumber() || "573248022632";

    const mensajeWA = encodeURIComponent(
        "Hola GIO TECH, necesito servicio técnico para mi equipo. ¿Cuál es el proceso?"
    );
    const waUrl = `https://wa.me/${phoneNumber}?text=${mensajeWA}`;

    return (
        <div className="landing-wrapper st-page">

            <section className="st-hero section-padding-lg">
                <div className="section-inner">
                    <span className="landing-hero-eyebrow">Servicio Técnico Especializado</span>
                    <h1 className="st-hero-title">
                        Tecnología que<br />
                        <span className="landing-hero-accent">vuelve a la vida.</span>
                    </h1>
                    <p className="st-hero-sub">
                        Diagnóstico profesional · Componentes Certificados · Garantía real de 15 días
                    </p>
                    <a href={waUrl} target="_blank" rel="noopener noreferrer" className="landing-btn-primary">
                        Agendar diagnóstico
                    </a>
                </div>
            </section>

            <section className="st-section section-padding-lg">
                <div className="section-inner">
                    <div className="section-header">
                        <h2 className="section-title">Nuestras Especialidades</h2>
                        <p className="section-sub">Soluciones expertas para cada tipo de daño o marca líder.</p>
                    </div>
                    <div className="repairs-grid">
                        {reparaciones.map((r) => (
                            <div key={r.label} className="repair-item">
                                <div className="repair-icon">
                                    <i className={`bi ${r.icon}`}></i>
                                </div>
                                <span className="repair-label">{r.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="st-section st-section-alt section-padding-lg">
                <div className="section-inner">
                    <div className="section-header">
                        <h2 className="section-title">Proceso de Trabajo</h2>
                        <p className="section-sub">Transparencia, velocidad y calidad en cada paso.</p>
                    </div>
                    <div className="steps-grid">
                        {pasos.map((p) => (
                            <div key={p.num} className="step-card">
                                <div className="step-num">{p.num}</div>
                                <h3 className="step-title">{p.title}</h3>
                                <p className="step-desc">{p.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="st-section">
                <div className="landing-container">
                    <div className="st-guarantee">
                        <div className="st-guarantee-icon">
                            <i className="bi bi-shield-fill-check"></i>
                        </div>
                        <div>
                            <h2 className="st-guarantee-title">Garantía real de 15 días</h2>
                            <p className="st-guarantee-desc">
                                Cada reparación que realizamos cuenta con garantía escrita. Si el mismo problema persiste dentro de los 15 días, lo resolvemos sin costo adicional.
                                Trabajamos con repuestos de alta calidad y rendimiento garantizado, ideales cuando buscas una opción inmediata o más económica frente al componente original, asegurando que tu equipo funcione perfectamente.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="st-cta-section section-padding-lg">
                <div className="section-inner">
                    <div className="st-cta-box">
                        <h2 className="st-cta-title">¿Listo para reparar tu equipo?</h2>
                        <p className="st-cta-sub">
                            Obtén un diagnóstico profesional hoy mismo. Respuesta inmediata por WhatsApp.
                        </p>
                        <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="st-cta-btn"
                        >
                            Chatear con un experto
                        </a>
                        <p className="st-cta-note">
                            <i className="bi bi-geo-alt me-1"></i>
                            Calle 32 #13-36, B-Camilo Torres, Puerto Asís, Putumayo.
                        </p>
                    </div>
                </div>
            </section>

        </div>
    );
};

export default ServicioTecnicoPage;
