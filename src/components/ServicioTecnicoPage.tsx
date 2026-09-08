// src/components/ServicioTecnicoPage.tsx
import React, { useState, useMemo } from 'react';
import { useWhatsappNumber } from '../contexts/whatsapp-number-context';
import { DEFAULT_MAPS_URL } from './Footer';
import {
  PUTUMAYO_MUNICIPALITIES,
  type PutumayoMunicipality,
} from '../data/repair-prices';

export const FACEBOOK_REPAIR_VIDEO_URL = 'https://www.facebook.com/share/v/1EeYRgs6MY/?mibextid=wwXIfr';
export const FACEBOOK_REPAIR_EMBED_URL = 'https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2Fshare%2Fv%2F1EeYRgs6MY%2F&show_text=false&autoplay=true';
export const DEFAULT_LOCAL_VIDEO_SRC = '';

export interface ServicioTecnicoPageProps {
  videoSrc?: string;
  posterSrc?: string;
  facebookUrl?: string;
}

export interface BrandOption {
  id: string;
  name: string;
  iconClass: string;
  defaultModel: string;
}

export interface FallaOption {
  id: string;
  label: string;
  iconClass: string;
}

export const REPAIR_BRANDS: BrandOption[] = [
  { id: 'apple', name: 'Apple', iconClass: 'bi-apple', defaultModel: 'iPhone 13' },
  { id: 'samsung', name: 'Samsung', iconClass: 'bi-phone', defaultModel: 'Galaxy A54' },
  { id: 'xiaomi', name: 'Xiaomi', iconClass: 'bi-phone', defaultModel: 'Redmi Note 13 Pro' },
  { id: 'motorola', name: 'Motorola', iconClass: 'bi-phone', defaultModel: 'Moto G54' },
  { id: 'tecno', name: 'Tecno', iconClass: 'bi-phone', defaultModel: 'Spark 20' },
  { id: 'infinix', name: 'Infinix', iconClass: 'bi-phone', defaultModel: 'Hot 40 Pro' },
  { id: 'huawei', name: 'Huawei', iconClass: 'bi-phone', defaultModel: 'Nova Y70' },
  { id: 'vivo', name: 'Vivo', iconClass: 'bi-phone', defaultModel: 'Vivo Y35' },
  { id: 'oppo', name: 'Oppo', iconClass: 'bi-phone', defaultModel: 'Reno 11' },
  { id: 'realme', name: 'Realme', iconClass: 'bi-phone', defaultModel: 'Realme C55' },
  { id: 'zte', name: 'ZTE', iconClass: 'bi-phone', defaultModel: 'Blade V40' },
  { id: 'otra', name: 'Otra', iconClass: 'bi-grid', defaultModel: '' },
];

export const REPAIR_FAILURES: FallaOption[] = [
  { id: 'pantalla', label: 'Pantalla o Visor roto', iconClass: 'bi-phone-vibrate' },
  { id: 'bateria', label: 'Batería o no retiene carga', iconClass: 'bi-battery-charging' },
  { id: 'pin_carga', label: 'Pin de carga o no conecta', iconClass: 'bi-lightning-charge' },
  { id: 'placa_no_prende', label: 'No prende o falla en placa', iconClass: 'bi-cpu' },
  { id: 'mojado', label: 'Equipo mojado o daño por líquido', iconClass: 'bi-droplet-half' },
  { id: 'camara_audio', label: 'Cámaras o micrófonos', iconClass: 'bi-camera' },
  { id: 'mantenimiento', label: 'Mantenimiento preventivo', iconClass: 'bi-tools' },
  { id: 'otra', label: 'Otra falla técnica', iconClass: 'bi-wrench-adjustable-circle' },
];

const ServicioTecnicoPage: React.FC<ServicioTecnicoPageProps> = ({
  videoSrc = DEFAULT_LOCAL_VIDEO_SRC,
  posterSrc,
  facebookUrl = FACEBOOK_REPAIR_VIDEO_URL,
}) => {
  // WhatsApp Number from context
  let phoneNumber = '573223652569';
  try {
    const ctxNumber = useWhatsappNumber();
    if (ctxNumber) phoneNumber = ctxNumber;
  } catch {
    phoneNumber = '573223652569';
  }

  // State
  const [selectedBrand, setSelectedBrand] = useState<string>('apple');
  const [modelInput, setModelInput] = useState<string>('iPhone 13');
  const [selectedFalla, setSelectedFalla] = useState<string>('pantalla');
  const [clientName, setClientName] = useState<string>('');
  const [clientMunicipality, setClientMunicipality] = useState<PutumayoMunicipality>('Puerto Asís');
  const [clientSymptoms, setClientSymptoms] = useState<string>('');

  const handleOpenFacebook = () => {
    window.open(facebookUrl, '_blank', 'noopener,noreferrer');
  };

  // Handle Brand Selection
  const handleSelectBrand = (brand: BrandOption) => {
    setSelectedBrand(brand.id);
    const currentMatchesAnyDefault = REPAIR_BRANDS.some((b) => b.defaultModel === modelInput);
    if (!modelInput || currentMatchesAnyDefault) {
      setModelInput(brand.defaultModel);
    }
  };

  // Build WhatsApp URL
  const whatsappUrl = useMemo(() => {
    const brandObj = REPAIR_BRANDS.find((b) => b.id === selectedBrand);
    const brandName = brandObj ? brandObj.name : 'Otra Marca';
    const fallaObj = REPAIR_FAILURES.find((f) => f.id === selectedFalla);
    const fallaLabel = fallaObj ? fallaObj.label : 'Falla técnica';

    let msg = `🛠️ *SOLICITUD DE COTIZACIÓN - SERVICIO TÉCNICO GIO TECH*\n\n`;

    if (clientName.trim() || clientMunicipality.trim()) {
      msg += `👤 *Datos del Cliente:*\n`;
      if (clientName.trim()) msg += `▸ Nombre: ${clientName.trim()}\n`;
      if (clientMunicipality.trim()) msg += `▸ Municipio: ${clientMunicipality.trim()}\n`;
      msg += `\n`;
    }

    msg += `📱 *Dispositivo:*\n`;
    msg += `▸ Marca: ${brandName}\n`;
    msg += `▸ Modelo: ${modelInput.trim() || 'No especificado'}\n\n`;

    msg += `🔧 *Falla o Síntoma:*\n`;
    msg += `▸ Diagnóstico inicial: ${fallaLabel}\n`;
    if (clientSymptoms.trim()) {
      msg += `▸ Detalle del síntoma: ${clientSymptoms.trim()}\n`;
    }
    msg += `\n`;

    msg += `📍 *Sede Física:* Cra. 32 #13 36, Puerto Asís, Putumayo\n`;
    msg += `Hola, deseo consultar disponibilidad de repuestos en bodega y cotización para mi equipo.`;

    return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(msg)}`;
  }, [selectedBrand, selectedFalla, modelInput, clientName, clientMunicipality, clientSymptoms, phoneNumber]);

  return (
    <div className="landing-wrapper st-page">
      <section className="st-hero section-padding-lg">
        <div className="section-inner">
          {/* Header Ultra-Minimalista */}
          <div className="st-hero-header text-center mb-4">
            <span className="landing-hero-eyebrow">
              <i className="bi bi-shield-check me-2 text-danger"></i>
              Laboratorio Técnico Especializado · Puerto Asís, Putumayo
            </span>
            <h1 className="st-hero-title">
              Servicio Técnico &<br />
              <span className="landing-hero-accent">Cotización Inmediata.</span>
            </h1>
            <p className="st-hero-sub">
              Diagnóstico profesional en laboratorio, repuestos con garantía escrita y confirmación directa con el técnico.
            </p>
          </div>

          {/* Tarjeta Central Unificada Estilo Apple Support */}
          <div className="st-quoter-card">
            {/* 1. Selector de Marca (Pills sobrios) */}
            <div className="st-field-block">
              <label className="st-field-label">
                <i className="bi bi-tag-fill me-2 text-danger"></i>
                1. Marca del Dispositivo
              </label>
              <div className="st-brands-chips">
                {REPAIR_BRANDS.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    className={`st-brand-chip ${selectedBrand === b.id ? 'active' : ''}`}
                    onClick={() => handleSelectBrand(b)}
                  >
                    <i className={`bi ${b.iconClass} me-2`}></i>
                    <span>{b.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Input de Modelo Exacto */}
            <div className="st-field-block">
              <label htmlFor="st-model-input" className="st-field-label">
                <i className="bi bi-phone me-2 text-danger"></i>
                2. Modelo Exacto del Celular
              </label>
              <input
                id="st-model-input"
                type="text"
                className="form-control st-input"
                placeholder="Ej: iPhone 13, Redmi Note 13 Pro, Galaxy A54..."
                value={modelInput}
                onChange={(e) => setModelInput(e.target.value)}
              />
            </div>

            {/* 3. Selector de Falla o Síntoma */}
            <div className="st-field-block">
              <label className="st-field-label">
                <i className="bi bi-tools me-2 text-danger"></i>
                3. Falla o Síntoma Principal
              </label>
              <div className="st-fallas-grid">
                {REPAIR_FAILURES.map((falla) => (
                  <button
                    key={falla.id}
                    type="button"
                    className={`st-falla-chip ${selectedFalla === falla.id ? 'active' : ''}`}
                    onClick={() => setSelectedFalla(falla.id)}
                  >
                    <i className={`bi ${falla.iconClass} st-falla-chip-icon`}></i>
                    <span className="st-falla-chip-title">{falla.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Datos del Cliente & Municipio */}
            <div className="st-field-block">
              <label className="st-field-label">
                <i className="bi bi-person-lines-fill me-2 text-danger"></i>
                4. Tus Datos y Ubicación en Putumayo
              </label>
              <div className="row g-3">
                <div className="col-12 col-md-6">
                  <label htmlFor="st-client-name" className="st-sublabel">
                    Tu Nombre Completo:
                  </label>
                  <input
                    id="st-client-name"
                    type="text"
                    className="form-control st-input"
                    placeholder="Ej: Carlos Morales"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                  />
                </div>
                <div className="col-12 col-md-6">
                  <label htmlFor="st-municipality-select" className="st-sublabel">
                    Municipio de Putumayo:
                  </label>
                  <select
                    id="st-municipality-select"
                    className="form-select st-select"
                    value={clientMunicipality}
                    onChange={(e) => setClientMunicipality(e.target.value as PutumayoMunicipality)}
                  >
                    {PUTUMAYO_MUNICIPALITIES.map((mun) => (
                      <option key={mun} value={mun}>
                        {mun}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* 5. Detalle adicional (Opcional) */}
            <div className="st-field-block">
              <label htmlFor="st-symptoms-input" className="st-field-label">
                <i className="bi bi-chat-left-text me-2 text-danger"></i>
                5. Detalle Adicional o Síntomas (Opcional)
              </label>
              <textarea
                id="st-symptoms-input"
                rows={2}
                className="form-control st-input"
                placeholder="Ej: El táctil no responde en la parte superior, se cayó al agua, etc."
                value={clientSymptoms}
                onChange={(e) => setClientSymptoms(e.target.value)}
              />
            </div>

            {/* Microcopy Elegante: Cero Precios en Web, confirmación en 5m */}
            <div className="st-microcopy-banner">
              <i className="bi bi-clock-history fs-4 text-danger flex-shrink-0"></i>
              <div>
                <strong className="d-block text-primary">Cotización exacta en 5 minutos por WhatsApp</strong>
                <span className="text-secondary">
                  Confirmamos disponibilidad inmediata de repuestos en bodega (Original, OLED, Incell o Calidad AAA) con póliza de garantía escrita.
                </span>
              </div>
            </div>

            {/* Botón Principal CTA */}
            <div className="text-center mt-4">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="st-whatsapp-cta-btn"
              >
                <i className="bi bi-whatsapp me-2"></i>
                Solicitar Cotización con el Técnico en WhatsApp
              </a>
            </div>
          </div>

          {/* Showcase de Video en Laboratorio (Soporte Híbrido: Nativo + Showcase Facebook) */}
          <div className="st-video-showcase">
            <div className="st-video-header text-center">
              <span className="st-video-badge">
                <i className="bi bi-geo-alt-fill me-1 text-danger"></i>
                Grabado en nuestra sede física de Puerto Asís
              </span>
              <h2 className="st-video-title">
                Laboratorio en Acción: Reparación de iPhone
              </h2>
              <p className="st-video-sub">
                Procedimientos de alta precisión y cambio de componentes realizados en nuestra sede de Puerto Asís con repuestos certificados.
              </p>
            </div>

            {videoSrc ? (
              <>
                <div className="st-video-player-container">
                  <video
                    controls
                    playsInline
                    poster={posterSrc}
                    className="st-native-video"
                    aria-label="Laboratorio en Acción: Reparación de iPhone"
                  >
                    <source src={videoSrc} type="video/mp4" />
                    Tu navegador no soporta la reproducción de video HTML5.
                  </video>
                </div>
                <div className="st-video-footer text-center">
                  <a
                    href={facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="st-video-fb-btn"
                  >
                    <i className="bi bi-facebook me-2"></i>
                    <span>Ver video completo en Facebook</span>
                    <i className="bi bi-box-arrow-up-right ms-2"></i>
                  </a>
                </div>
              </>
            ) : (
              <div className="st-facebook-showcase-container">
                <div
                  className="st-facebook-showcase-card"
                  role="button"
                  tabIndex={0}
                  aria-label="Ver video completo de reparación en Facebook"
                  onClick={handleOpenFacebook}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleOpenFacebook();
                    }
                  }}
                >
                  <div className="st-facebook-showcase-backdrop">
                    {posterSrc && (
                      <img
                        src={posterSrc}
                        alt="Laboratorio en Acción: Reparación de iPhone"
                        className="st-facebook-showcase-poster"
                      />
                    )}
                    <div className="st-facebook-backdrop-overlay" />
                  </div>

                  <div className="st-facebook-showcase-content">
                    <div className="st-facebook-badge-pill">
                      <i className="bi bi-facebook me-2"></i>
                      <span>Laboratorio GIO TECH · Puerto Asís</span>
                    </div>

                    <div className="st-facebook-play-disc" aria-hidden="true">
                      <i className="bi bi-play-fill st-facebook-play-icon"></i>
                    </div>

                    <div className="st-facebook-showcase-details text-center">
                      <h3 className="st-facebook-showcase-headline">
                        Proceso en Laboratorio: Cambio de Batería iPhone 13 Pro Max
                      </h3>
                      <p className="st-facebook-showcase-desc">
                        Conocé nuestras instalaciones, instrumental de precisión y el proceso técnico garantizado en Puerto Asís.
                      </p>
                    </div>

                    <a
                      href={facebookUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="st-facebook-action-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      aria-label="Ver video completo en Facebook"
                    >
                      <i className="bi bi-facebook me-2"></i>
                      <span>Ver video completo en Facebook</span>
                      <i className="bi bi-box-arrow-up-right ms-2"></i>
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Pie de Página de Confianza (Single Micro-Bar) */}
          <div className="st-trust-microbar text-center">
            <span className="st-microbar-item">
              <i className="bi bi-geo-alt-fill me-1 text-danger"></i>
              Laboratorio GIO TECH: Cra. 32 #13 36, Puerto Asís, Putumayo
            </span>
            <span className="st-microbar-separator d-none d-md-inline">·</span>
            <span className="st-microbar-item">
              <i className="bi bi-clock-fill me-1 text-primary"></i>
              Horarios: L-S 8:00 AM - 7:00 PM
            </span>
            <span className="st-microbar-separator d-none d-md-inline">·</span>
            <a
              href={DEFAULT_MAPS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="st-microbar-link"
            >
              <i className="bi bi-map-fill me-1"></i>
              Ver en Google Maps
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ServicioTecnicoPage;
