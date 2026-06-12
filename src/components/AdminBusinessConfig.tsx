import { ChangeEvent } from "react";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Card, Form, Row, Col, Button } from "react-bootstrap";
import { updateConfig } from "../services/config.service";
import { ThemeVars } from "../types";

interface AdminBusinessConfigProps {
  nombreNegocio: string;
  setNombreNegocio: (v: string) => void;
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

function AdminBusinessConfig({
  nombreNegocio,
  setNombreNegocio,
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
  const storage = getStorage();

  const toDateOrNull = (s: string): Date | null => (s ? new Date(s) : null);

  const handleUpdateConfig = async () => {
    setError("");
    setSuccess("");
    try {
      let logoUrl = previewLogo;
      if (logoNegocio) {
        const logoRef = ref(storage, `config/logo_${Date.now()}`);
        await uploadBytes(logoRef, logoNegocio);
        logoUrl = await getDownloadURL(logoRef);
      }
      await updateConfig({
        nombre: nombreNegocio,
        logo: logoUrl,
        theme: {
          enabled: themeEnabled,
          start: toDateOrNull(themeStart),
          end: toDateOrNull(themeEnd),
          vars: themeVars,
        },
      });
      setSuccess("Configuración actualizada exitosamente!");
      setLogoNegocio(null);
    } catch (err: unknown) {
      console.error("Error al actualizar configuración:", err);
      const message = err instanceof Error ? err.message : "Error desconocido";
      setError(`Error al actualizar configuración: ${message}`);
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

  return (
    <Card className="p-4 mb-4 shadow-sm">
      <h3 className="mb-3">Configuración del Negocio</h3>
      <Form
        onSubmit={(e) => {
          e.preventDefault();
          handleUpdateConfig();
        }}
      >
        <Row className="g-3">
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Nombre del Negocio</Form.Label>
              <Form.Control
                type="text"
                value={nombreNegocio}
                onChange={(e) => setNombreNegocio(e.target.value)}
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Logo del Negocio (URL o archivo)</Form.Label>
              <Form.Control
                type="file"
                accept="image/*"
                onChange={handleLogoFileChange}
              />
              <Form.Control
                type="text"
                className="mt-2"
                value={previewLogo}
                onChange={(e) => {
                  setLogoNegocio(null);
                  setPreviewLogo(e.target.value);
                }}
                placeholder="O pega una URL (https://ejemplo.com/logo.png)"
              />
              {previewLogo && (
                <img
                  src={previewLogo}
                  alt="Preview Logo"
                  style={{ height: "80px", marginTop: "10px" }}
                  className="d-block"
                />
              )}
              <Form.Text className="text-muted">
                Sube un archivo o pega la URL de tu logo (ej: desde Firebase Storage, Imgur,
                etc.)
              </Form.Text>
            </Form.Group>
          </Col>
        </Row>

        <Card className="p-3 mb-3">
          <div className="d-flex align-items-center justify-content-between">
            <h5 className="mb-0">Tema de temporada</h5>
            <Form.Check
              type="switch"
              label={themeEnabled ? "Tema activo" : "Tema inactivo"}
              checked={themeEnabled}
              onChange={(e) => setThemeEnabled(e.target.checked)}
            />
          </div>

          <Row className="mt-2 g-3">
            <Col md={6}>
              <Form.Label>Inicio (opcional)</Form.Label>
              <Form.Control
                type="datetime-local"
                value={themeStart}
                onChange={(e) => setThemeStart(e.target.value)}
              />
            </Col>
            <Col md={6}>
              <Form.Label>Fin (opcional)</Form.Label>
              <Form.Control
                type="datetime-local"
                value={themeEnd}
                onChange={(e) => setThemeEnd(e.target.value)}
              />
            </Col>

            <Col md={4}>
              <Form.Label>Color badge promo</Form.Label>
              <Form.Control
                type="color"
                value={themeVars["--promo-badge-bg"] || "#d81b60"}
                onChange={(e) =>
                  setThemeVars((v) => ({
                    ...v,
                    ["--promo-badge-bg"]: e.target.value,
                  }))
                }
              />
            </Col>
            <Col md={4}>
              <Form.Label>Texto badge promo</Form.Label>
              <Form.Control
                type="color"
                value={themeVars["--promo-badge-text"] || "#ffffff"}
                onChange={(e) =>
                  setThemeVars((v) => ({
                    ...v,
                    ["--promo-badge-text"]: e.target.value,
                  }))
                }
              />
            </Col>
            <Col md={4}>
              <Form.Label>Resaltado tarjetas</Form.Label>
              <Form.Control
                value={
                  themeVars["--promo-highlight"] || "rgba(216,27,96,.18)"
                }
                onChange={(e) =>
                  setThemeVars((v) => ({
                    ...v,
                    ["--promo-highlight"]: e.target.value,
                  }))
                }
              />
            </Col>
          </Row>

          <div className="d-flex gap-2 mt-3">
            <Button
              size="sm"
              variant="secondary"
              onClick={() =>
                setThemeVars((v) => ({
                  ...v,
                  "--promo-badge-bg": "#d81b60",
                  "--promo-badge-text": "#ffffff",
                  "--promo-highlight": "rgba(216,27,96,.18)",
                  "--theme-name": "valentine",
                }))
              }
            >
              💘 Amor y Amistad
            </Button>
            <Button
              size="sm"
              variant="success"
              onClick={() =>
                setThemeVars((v) => ({
                  ...v,
                  "--promo-badge-bg": "#2e7d32",
                  "--promo-badge-text": "#ffffff",
                  "--promo-highlight": "rgba(46,125,50,.18)",
                  "--theme-name": "christmas",
                }))
              }
            >
              🎄 Navidad
            </Button>
            <Button
              size="sm"
              variant="warning"
              onClick={() =>
                setThemeVars((v) => ({
                  ...v,
                  "--promo-badge-bg": "#ff6d00",
                  "--promo-badge-text": "#1b1b1b",
                  "--promo-highlight": "rgba(255,109,0,.18)",
                  "--theme-name": "halloween",
                }))
              }
            >
              🎃 Halloween
            </Button>
          </div>
        </Card>

        <Button variant="primary" type="submit">
          Actualizar Configuración
        </Button>
      </Form>
    </Card>
  );
}

export default AdminBusinessConfig;
