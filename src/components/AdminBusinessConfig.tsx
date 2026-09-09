import { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { updateConfig } from "../services/config.service";
import { ThemeVars } from "../types";

export interface AdminBusinessConfigProps {
  nombreNegocio: string;
  setNombreNegocio: (v: string) => void;
  telefonoNegocio?: string;
  setTelefonoNegocio?: (v: string) => void;
  whatsappNegocio?: string;
  setWhatsappNegocio?: (v: string) => void;
  emailNegocio?: string;
  setEmailNegocio?: (v: string) => void;
  direccionNegocio?: string;
  setDireccionNegocio?: (v: string) => void;
  mapsUrlNegocio?: string;
  setMapsUrlNegocio?: (v: string) => void;
  horariosNegocio?: string;
  setHorariosNegocio?: (v: string) => void;
  logoNegocio: File | null;
  setLogoNegocio: (v: File | null) => void;
  previewLogo: string;
  setPreviewLogo: (v: string) => void;
  themeEnabled: boolean;
  setThemeEnabled: (v: boolean) => void;
  themeStart: string;
  setThemeStart: (v: string) => void;
  themeEnd: string;
  setThemeEnd: (v: string) => void;
  themeVars: ThemeVars;
  setThemeVars: React.Dispatch<React.SetStateAction<ThemeVars>>;
  setError: (v: string) => void;
  setSuccess: (v: string) => void;
}

const THEME_PRESETS = [
  {
    key: "valentine",
    name: "Amor y Amistad",
    icon: "bi-heart-fill",
    vars: {
      "--theme-name": "valentine",
      "--promo-badge-bg": "#d81b60",
      "--promo-badge-text": "#ffffff",
      "--promo-highlight": "rgba(216,27,96,.18)",
    },
  },
  {
    key: "christmas",
    name: "Navidad",
    icon: "bi-tree-fill",
    vars: {
      "--theme-name": "christmas",
      "--promo-badge-bg": "#2e7d32",
      "--promo-badge-text": "#ffffff",
      "--promo-highlight": "rgba(46,125,50,.18)",
    },
  },
  {
    key: "halloween",
    name: "Halloween",
    icon: "bi-moon-stars-fill",
    vars: {
      "--theme-name": "halloween",
      "--promo-badge-bg": "#ff6d00",
      "--promo-badge-text": "#1b1b1b",
      "--promo-highlight": "rgba(255,109,0,.18)",
    },
  },
  {
    key: "blackfriday",
    name: "Black Friday",
    icon: "bi-tag-fill",
    vars: {
      "--theme-name": "blackfriday",
      "--promo-badge-bg": "#111827",
      "--promo-badge-text": "#ffd700",
      "--promo-highlight": "rgba(255,215,0,.2)",
    },
  },
  {
    key: "standard",
    name: "GIO Red Estándar",
    icon: "bi-lightning-charge-fill",
    vars: {
      "--theme-name": "standard",
      "--promo-badge-bg": "#C8102E",
      "--promo-badge-text": "#ffffff",
      "--promo-highlight": "rgba(200,16,46,.18)",
    },
  },
];

function AdminBusinessConfig({
  nombreNegocio,
  setNombreNegocio,
  telefonoNegocio = "3223652569",
  setTelefonoNegocio,
  whatsappNegocio = "3223652569",
  setWhatsappNegocio,
  emailNegocio = "contacto@giotech.com",
  setEmailNegocio,
  direccionNegocio = "Cra. 32 #13 36, Puerto Asís, Putumayo",
  setDireccionNegocio,
  mapsUrlNegocio = "https://maps.google.com/?q=Cra.+32+%2313-36,+Puerto+As%C3%ADs,+Putumayo",
  setMapsUrlNegocio,
  horariosNegocio = "Lunes a Sábado: 8:00 AM - 7:00 PM",
  setHorariosNegocio,
  logoNegocio,
  setLogoNegocio,
  previewLogo,
  setPreviewLogo,
  themeEnabled,
  setThemeEnabled,
  themeStart,
  setThemeStart,
  themeEnd,
  setThemeEnd,
  themeVars,
  setThemeVars,
  setError,
  setSuccess,
}: AdminBusinessConfigProps) {
  const [isSaving, setIsSaving] = useState(false);

  // Local state fallbacks
  const [localTel, setLocalTel] = useState(telefonoNegocio);
  const [localWa, setLocalWa] = useState(whatsappNegocio);
  const [localEmail, setLocalEmail] = useState(emailNegocio);
  const [localDir, setLocalDir] = useState(direccionNegocio);
  const [localMaps, setLocalMaps] = useState(mapsUrlNegocio);
  const [localHorarios, setLocalHorarios] = useState(horariosNegocio);

  useEffect(() => {
    setLocalTel(telefonoNegocio);
  }, [telefonoNegocio]);
  useEffect(() => {
    setLocalWa(whatsappNegocio);
  }, [whatsappNegocio]);
  useEffect(() => {
    setLocalEmail(emailNegocio);
  }, [emailNegocio]);
  useEffect(() => {
    setLocalDir(direccionNegocio);
  }, [direccionNegocio]);
  useEffect(() => {
    setLocalMaps(mapsUrlNegocio);
  }, [mapsUrlNegocio]);
  useEffect(() => {
    setLocalHorarios(horariosNegocio);
  }, [horariosNegocio]);

  const updateTel = (v: string) => {
    setLocalTel(v);
    if (setTelefonoNegocio) setTelefonoNegocio(v);
  };
  const updateWa = (v: string) => {
    setLocalWa(v);
    if (setWhatsappNegocio) setWhatsappNegocio(v);
  };
  const updateEmail = (v: string) => {
    setLocalEmail(v);
    if (setEmailNegocio) setEmailNegocio(v);
  };
  const updateDir = (v: string) => {
    setLocalDir(v);
    if (setDireccionNegocio) setDireccionNegocio(v);
  };
  const updateMaps = (v: string) => {
    setLocalMaps(v);
    if (setMapsUrlNegocio) setMapsUrlNegocio(v);
  };
  const updateHorarios = (v: string) => {
    setLocalHorarios(v);
    if (setHorariosNegocio) setHorariosNegocio(v);
  };

  const toDateOrNull = (s: string): Date | null => (s ? new Date(s) : null);

  const handleDeactivateTheme = () => {
    setThemeEnabled(false);
    setThemeStart("");
    setThemeEnd("");
    setThemeVars({
      "--theme-name": "standard",
      "--promo-badge-bg": "#C8102E",
      "--promo-badge-text": "#ffffff",
      "--promo-highlight": "rgba(200,16,46,.18)",
    });
  };

  const handleSelectPreset = (presetKey: string) => {
    const preset = THEME_PRESETS.find((p) => p.key === presetKey);
    if (!preset || preset.key === "standard") {
      handleDeactivateTheme();
      return;
    }
    setThemeEnabled(true);
    setThemeVars((v) => ({
      ...v,
      ...preset.vars,
    }));
  };

  const handleUpdateConfig = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    setError("");
    setSuccess("");
    setIsSaving(true);
    try {
      let logoUrl = previewLogo;
      if (logoNegocio) {
        const storage = getStorage();
        const logoRef = ref(storage, `config/logo_${Date.now()}`);
        await uploadBytes(logoRef, logoNegocio);
        logoUrl = await getDownloadURL(logoRef);
      }

      const isActuallyEnabled = themeEnabled && themeVars["--theme-name"] !== "standard";

      await updateConfig({
        nombre: nombreNegocio,
        telefono: localTel,
        whatsappNumber: localWa,
        email: localEmail,
        direccion: localDir,
        mapsUrl: localMaps,
        horarios: localHorarios,
        logo: logoUrl,
        theme: {
          enabled: isActuallyEnabled,
          start: isActuallyEnabled ? toDateOrNull(themeStart) : null,
          end: isActuallyEnabled ? toDateOrNull(themeEnd) : null,
          vars: {
            ...themeVars,
            "--theme-name": isActuallyEnabled ? (themeVars["--theme-name"] || "valentine") : "standard",
          },
        },
      });

      setSuccess("¡Configuración del negocio actualizada exitosamente!");
      setLogoNegocio(null);
    } catch (err: unknown) {
      console.error("Error al actualizar configuración:", err);
      const message = err instanceof Error ? err.message : "Error desconocido";
      setError(`Error al actualizar configuración: ${message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setLogoNegocio(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const currentThemeKey = themeVars["--theme-name"] || "valentine";

  return (
    <div className="admin-business-config-container">
      <form onSubmit={handleUpdateConfig}>
        <div className="d-flex flex-column gap-4">
          {/* CARD 1: Identidad & Contacto */}
          <div className="admin-card-pro">
            <div className="admin-card-header-clean mb-3">
              <div className="admin-card-header-icon identity">
                <i className="bi bi-building-fill" />
              </div>
              <div>
                <h3 className="admin-card-title mb-0">
                  1. Identidad de Marca & Contacto
                </h3>
                <p className="admin-card-subtitle mb-0">
                  Datos de la tienda, canales de atención a clientes y logotipo
                </p>
              </div>
            </div>

            <div className="row g-3">
              {/* Nombre de la tienda */}
              <div className="col-12 col-md-6">
                <label htmlFor="nombre-negocio-input" className="form-label fw-semibold">
                  Nombre Comercial de la Tienda
                </label>
                <div className="input-group">
                  <span className="input-group-text">
                    <i className="bi bi-shop" />
                  </span>
                  <input
                    id="nombre-negocio-input"
                    type="text"
                    className="form-control"
                    placeholder="GIO TECH"
                    value={nombreNegocio}
                    onChange={(e) => setNombreNegocio(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Teléfono */}
              <div className="col-12 col-md-6">
                <label htmlFor="telefono-negocio-input" className="form-label fw-semibold">
                  Teléfono Principal de Atención
                </label>
                <div className="input-group">
                  <span className="input-group-text">
                    <i className="bi bi-telephone" />
                  </span>
                  <input
                    id="telefono-negocio-input"
                    type="text"
                    className="form-control"
                    placeholder="3223652569"
                    value={localTel}
                    onChange={(e) => updateTel(e.target.value)}
                  />
                </div>
              </div>

              {/* WhatsApp */}
              <div className="col-12 col-md-6">
                <label htmlFor="whatsapp-negocio-input" className="form-label fw-semibold">
                  WhatsApp Oficial de Ventas
                </label>
                <div className="input-group">
                  <span className="input-group-text text-success">
                    <i className="bi bi-whatsapp" />
                  </span>
                  <input
                    id="whatsapp-negocio-input"
                    type="text"
                    className="form-control"
                    placeholder="573223652569"
                    value={localWa}
                    onChange={(e) => updateWa(e.target.value)}
                  />
                </div>
                <small className="text-muted">
                  Número al que se redirigen las cotizaciones y compras del catálogo.
                </small>
              </div>

              {/* Correo */}
              <div className="col-12 col-md-6">
                <label htmlFor="email-negocio-input" className="form-label fw-semibold">
                  Correo Electrónico de Soporte
                </label>
                <div className="input-group">
                  <span className="input-group-text">
                    <i className="bi bi-envelope" />
                  </span>
                  <input
                    id="email-negocio-input"
                    type="email"
                    className="form-control"
                    placeholder="contacto@giotech.com"
                    value={localEmail}
                    onChange={(e) => updateEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Logo */}
              <div className="col-12">
                <label htmlFor="logo-file-input" className="form-label fw-semibold">
                  Logotipo Oficial de la Tienda
                </label>
                <div className="row g-3 align-items-center">
                  <div className="col-12 col-md-6">
                    <input
                      id="logo-file-input"
                      type="file"
                      className="form-control mb-2"
                      accept="image/*"
                      onChange={handleLogoFileChange}
                    />
                    <input
                      type="text"
                      className="form-control"
                      placeholder="O pega una URL directa (https://.../logo.png)"
                      value={previewLogo}
                      onChange={(e) => {
                        setLogoNegocio(null);
                        setPreviewLogo(e.target.value);
                      }}
                    />
                  </div>

                  <div className="col-12 col-md-6">
                    <div className="admin-logo-preview-box">
                      {previewLogo ? (
                        <img
                          src={previewLogo}
                          alt="Logo Preview"
                          className="admin-logo-preview-img"
                        />
                      ) : (
                        <div className="text-muted fs-7">
                          <i className="bi bi-image fs-4 d-block mb-1" />
                          Sin logotipo cargado
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CARD 2: Sede Física & Horarios */}
          <div className="admin-card-pro">
            <div className="admin-card-header-clean mb-3">
              <div className="admin-card-header-icon location">
                <i className="bi bi-geo-alt-fill" />
              </div>
              <div>
                <h3 className="admin-card-title mb-0">
                  2. Sede Física & Horarios de Atención
                </h3>
                <p className="admin-card-subtitle mb-0">
                  Ubicación oficial, geolocalización y jornada laboral
                </p>
              </div>
            </div>

            <div className="row g-3">
              {/* Dirección */}
              <div className="col-12 col-md-6">
                <label htmlFor="direccion-sede-input" className="form-label fw-semibold">
                  Dirección Oficial del Local
                </label>
                <div className="input-group">
                  <span className="input-group-text">
                    <i className="bi bi-geo-alt" />
                  </span>
                  <input
                    id="direccion-sede-input"
                    type="text"
                    className="form-control"
                    placeholder="Cra. 32 #13 36, Puerto Asís, Putumayo"
                    value={localDir}
                    onChange={(e) => updateDir(e.target.value)}
                  />
                </div>
              </div>

              {/* Horarios */}
              <div className="col-12 col-md-6">
                <label htmlFor="horarios-atencion-input" className="form-label fw-semibold">
                  Horarios de Atención
                </label>
                <div className="input-group">
                  <span className="input-group-text">
                    <i className="bi bi-clock" />
                  </span>
                  <input
                    id="horarios-atencion-input"
                    type="text"
                    className="form-control"
                    placeholder="Lunes a Sábado: 8:00 AM - 7:00 PM"
                    value={localHorarios}
                    onChange={(e) => updateHorarios(e.target.value)}
                  />
                </div>
              </div>

              {/* Google Maps URL */}
              <div className="col-12">
                <label htmlFor="maps-url-input" className="form-label fw-semibold">
                  Enlace de Ubicación en Google Maps
                </label>
                <div className="input-group">
                  <span className="input-group-text">
                    <i className="bi bi-map" />
                  </span>
                  <input
                    id="maps-url-input"
                    type="url"
                    className="form-control"
                    placeholder="https://maps.google.com/..."
                    value={localMaps}
                    onChange={(e) => updateMaps(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* CARD 3: Temporadas & Festividades */}
          <div className="admin-card-pro">
            <div className="admin-card-header-clean mb-3">
              <div className="admin-card-header-icon seasonal">
                <i className="bi bi-palette-fill" />
              </div>
              <div className="flex-grow-1">
                <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                  <h3 className="admin-card-title mb-0">
                    3. Temporadas & Festividades (Temas Visuales)
                  </h3>
                  <div className="d-flex align-items-center gap-3">
                    <span className={`badge ${themeEnabled && currentThemeKey !== "standard" ? "bg-danger-subtle text-danger border border-danger-subtle" : "bg-secondary-subtle text-secondary border border-secondary-subtle"} px-2 py-1`}>
                      {themeEnabled && currentThemeKey !== "standard" ? "Atmósfera Estacional Activa" : "Modo Estándar (Sin Tema)"}
                    </span>
                    <div className="form-check form-switch mb-0">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        role="switch"
                        id="theme-active-switch"
                        checked={themeEnabled && currentThemeKey !== "standard"}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setThemeEnabled(true);
                            if (currentThemeKey === "standard") {
                              setThemeVars(THEME_PRESETS[0].vars);
                            }
                          } else {
                            handleDeactivateTheme();
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
                <p className="admin-card-subtitle mb-0 mt-1">
                  Personaliza la atmósfera de la tienda para fechas especiales con un solo clic o restaura el modo estándar oficial
                </p>
              </div>
            </div>

            {/* Presets Grid */}
            <div className="d-flex align-items-center justify-content-between mb-2">
              <label className="form-label fw-semibold mb-0">
                Presets Estacionales de 1 Clic
              </label>
              <button
                type="button"
                className={`btn btn-sm ${!themeEnabled || currentThemeKey === "standard" ? "btn-dark fw-bold" : "btn-outline-secondary"} d-inline-flex align-items-center gap-1 py-1 px-3`}
                onClick={handleDeactivateTheme}
                title="Desactivar tema y volver al estilo estándar GIO Red"
              >
                <i className="bi bi-x-circle" aria-hidden="true" />
                <span>Desactivar Tema / Modo Estándar</span>
                {(!themeEnabled || currentThemeKey === "standard") && (
                  <span className="badge bg-light text-dark ms-1">(Activo)</span>
                )}
              </button>
            </div>

            <div className="row g-2 mb-3">
              {THEME_PRESETS.filter((p) => p.key !== "standard").map((preset) => {
                const isSelected =
                  themeEnabled && currentThemeKey === preset.key;
                return (
                  <div key={preset.key} className="col-6 col-md-3">
                    <button
                      type="button"
                      className={`btn w-100 d-inline-flex align-items-center justify-content-center gap-2 py-2 px-3 ${
                        isSelected
                          ? "btn-danger fw-bold shadow-sm"
                          : "btn-outline-secondary"
                      }`}
                      onClick={() => handleSelectPreset(preset.key)}
                    >
                      <i className={`bi ${preset.icon}`} aria-hidden="true" />
                      <span>{preset.name}</span>
                      {isSelected && (
                        <span className="badge bg-white text-danger ms-1 fw-bold">(Activo)</span>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Status explanation notice */}
            {(!themeEnabled || currentThemeKey === "standard") ? (
              <div className="p-3 mb-3 rounded border border-secondary-subtle bg-body-tertiary d-flex align-items-center gap-3">
                <i className="bi bi-shield-check text-primary fs-4" />
                <div className="fs-7 text-muted">
                  <strong className="text-body d-block">Modo Estándar GIO TECH Activo</strong>
                  La tienda funciona con sus acentos rojos oficiales corporativos (#C8102E), sin partículas ni decoraciones estacionales adicionales.
                </div>
              </div>
            ) : (
              <div className="p-3 mb-3 rounded border border-danger-subtle bg-danger-subtle d-flex align-items-center gap-3">
                <i className="bi bi-stars text-danger fs-4" />
                <div className="fs-7 text-danger-emphasis">
                  <strong className="d-block">Tema Estacional Activo: {THEME_PRESETS.find(p => p.key === currentThemeKey)?.name || currentThemeKey}</strong>
                  Atmósfera visual, badges temáticos y efectos de partículas sutiles activos para todos los usuarios.
                </div>
              </div>
            )}

            {/* Color Selectors & Date Range */}
            <div className="row g-3 pt-2">
              <div className="col-12 col-md-4">
                <label htmlFor="color-badge-promo-config" className="form-label fw-semibold">
                  Color Fondo Badge Promo
                </label>
                <input
                  id="color-badge-promo-config"
                  type="color"
                  className="form-control form-control-color w-100"
                  value={themeVars["--promo-badge-bg"] || "#d81b60"}
                  onChange={(e) =>
                    setThemeVars((v) => ({
                      ...v,
                      "--promo-badge-bg": e.target.value,
                    }))
                  }
                />
              </div>

              <div className="col-12 col-md-4">
                <label htmlFor="color-texto-promo-config" className="form-label fw-semibold">
                  Color Texto Badge Promo
                </label>
                <input
                  id="color-texto-promo-config"
                  type="color"
                  className="form-control form-control-color w-100"
                  value={themeVars["--promo-badge-text"] || "#ffffff"}
                  onChange={(e) =>
                    setThemeVars((v) => ({
                      ...v,
                      "--promo-badge-text": e.target.value,
                    }))
                  }
                />
              </div>

              <div className="col-12 col-md-4">
                <label htmlFor="resaltado-tarjetas-config" className="form-label fw-semibold">
                  Resaltado de Tarjetas (Glow/Border)
                </label>
                <input
                  id="resaltado-tarjetas-config"
                  type="text"
                  className="form-control"
                  placeholder="rgba(216,27,96,.18) o #hex"
                  value={
                    themeVars["--promo-highlight"] || "rgba(216,27,96,.18)"
                  }
                  onChange={(e) =>
                    setThemeVars((v) => ({
                      ...v,
                      "--promo-highlight": e.target.value,
                    }))
                  }
                />
              </div>

              <div className="col-12 col-md-6">
                <label htmlFor="fecha-inicio-tema" className="form-label fw-semibold">
                  Fecha & Hora de Inicio (Opcional)
                </label>
                <input
                  id="fecha-inicio-tema"
                  type="datetime-local"
                  className="form-control"
                  value={themeStart}
                  onChange={(e) => setThemeStart(e.target.value)}
                />
              </div>

              <div className="col-12 col-md-6">
                <label htmlFor="fecha-fin-tema" className="form-label fw-semibold">
                  Fecha & Hora de Finalización (Opcional)
                </label>
                <input
                  id="fecha-fin-tema"
                  type="datetime-local"
                  className="form-control"
                  value={themeEnd}
                  onChange={(e) => setThemeEnd(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Submit Action */}
          <div className="admin-card-pro d-flex justify-content-end gap-3">
            <button
              type="submit"
              className="btn btn-danger px-5 py-3 fw-bold fs-6 d-inline-flex align-items-center gap-2"
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm"
                    role="status"
                    aria-hidden="true"
                  />
                  <span>Guardando Cambios...</span>
                </>
              ) : (
                <>
                  <i className="bi bi-floppy-fill" />
                  <span>Actualizar Configuración</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default AdminBusinessConfig;
