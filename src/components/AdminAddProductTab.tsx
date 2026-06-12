import { FormEvent } from "react";
import { Card, Form, Row, Col, Button, Badge } from "react-bootstrap";
import { createProduct, updateProduct } from "../services/product.service";
import { Product, ProductSpecs } from "../types";

interface AdminAddProductTabProps {
  nombreProducto: string;
  setNombreProducto: (v: string) => void;
  descripcionProducto: string;
  setDescripcionProducto: (v: string) => void;
  contadoProducto: string;
  setContadoProducto: (v: string) => void;
  cuotas6Producto: string;
  setCuotas6Producto: (v: string) => void;
  cuotas8Producto: string;
  setCuotas8Producto: (v: string) => void;
  imagenProducto: string;
  setImagenProducto: (v: string) => void;
  cuotaInicialProducto: string;
  setCuotaInicialProducto: (v: string) => void;
  editandoProducto: Product | null;
  setEditandoProducto: (v: Product | null) => void;
  promoActivo: boolean;
  setPromoActivo: (v: boolean) => void;
  promoPrice: string;
  setPromoPrice: (v: string) => void;
  promoBadgeText: string;
  setPromoBadgeText: (v: string) => void;
  promoBadgeBg: string;
  setPromoBadgeBg: (v: string) => void;
  promoHighlight: string;
  setPromoHighlight: (v: string) => void;
  nuevoActivo: boolean;
  setNuevoActivo: (v: boolean) => void;
  nuevoBadgeText: string;
  setNuevoBadgeText: (v: string) => void;
  nuevoBadgeBg: string;
  setNuevoBadgeBg: (v: string) => void;
  badgeMode: string;
  setBadgeMode: (v: string) => void;
  solo12Meses: boolean;
  setSolo12Meses: (v: boolean) => void;
  cuotas12Producto: string;
  setCuotas12Producto: (v: string) => void;
  setSuccess: (v: string) => void;
  setError: (v: string) => void;
}

function AdminAddProductTab({
  nombreProducto,
  setNombreProducto,
  descripcionProducto,
  setDescripcionProducto,
  contadoProducto,
  setContadoProducto,
  cuotas6Producto,
  setCuotas6Producto,
  cuotas8Producto,
  setCuotas8Producto,
  imagenProducto,
  setImagenProducto,
  cuotaInicialProducto,
  setCuotaInicialProducto,
  editandoProducto,
  setEditandoProducto,
  promoActivo,
  setPromoActivo,
  promoPrice,
  setPromoPrice,
  promoBadgeText,
  setPromoBadgeText,
  promoBadgeBg,
  setPromoBadgeBg,
  promoHighlight,
  setPromoHighlight,
  nuevoActivo,
  setNuevoActivo,
  nuevoBadgeText,
  setNuevoBadgeText,
  nuevoBadgeBg,
  setNuevoBadgeBg,
  badgeMode,
  setBadgeMode,
  solo12Meses,
  setSolo12Meses,
  cuotas12Producto,
  setCuotas12Producto,
  setSuccess,
  setError,
}: AdminAddProductTabProps) {
  function parseDescriptionToSpecs(description: string = ""): ProductSpecs {
    if (!description || typeof description !== "string") return {
      almacenamiento: null,
      ram: null,
      camara: null,
      pantalla: null,
      bateria: null,
    };
    const text = description.toLowerCase();

    const toNum = (v: string | number | undefined | null): number | null => {
      if (v === 0 || v) {
        const s = String(v)
          .replace(/[^0-9.,]/g, "")
          .replace(",", ".");
        const n = Number(s);
        return Number.isFinite(n) ? n : null;
      }
      return null;
    };

    const almacenamientoMatch = text.match(/\b(\d{2,4})\s?gb\b/);
    const almacenamiento = almacenamientoMatch
      ? toNum(almacenamientoMatch[1])
      : null;

    const ramMatch =
      text.match(/\b(\d{1,2})\s?gb\s?de\s?ram\b/) ||
      text.match(/\b(\d{1,2})\s?gb\s?ram\b/) ||
      text.match(/\b(\d{1,2})\s?gb\b/);
    const ram = ramMatch ? toNum(ramMatch[1]) : null;

    const camMatch =
      text.match(/(\d{2,4})\s?mp\b/) ||
      text.match(/cámara\s?de\s?(\d{2,4})\s?mp/);
    const camara = camMatch ? toNum(camMatch[1] || camMatch[2]) : null;

    const screenMatch =
      text.match(/(\d{1,2}(?:[.,]\d)?)\s?(?:pulgadas|")/) ||
      text.match(/pantalla.*?(\d{1,2}(?:[.,]\d)?)/);
    const pantalla = screenMatch
      ? toNum((screenMatch[1] || screenMatch[2] || "").replace(",", "."))
      : null;

    const batMatch = text.match(/(\d{3,5})\s?m(?:ah)?\b/);
    const bateria = batMatch ? toNum(batMatch[1]) : null;

    return {
      almacenamiento: almacenamiento || null,
      ram: ram || null,
      camara: camara || null,
      pantalla: pantalla || null,
      bateria: bateria || null,
    };
  }

  const resetProductoForm = () => {
    setNombreProducto("");
    setDescripcionProducto("");
    setContadoProducto("");
    setCuotas6Producto("");
    setCuotas8Producto("");
    setImagenProducto("");
    setCuotaInicialProducto("");

    setPromoActivo(false);
    setPromoPrice("");
    setPromoBadgeText("PROMO");
    setPromoBadgeBg("#d81b60");
    setPromoHighlight("");

    setNuevoActivo(false);
    setNuevoBadgeText("NUEVO");
    setNuevoBadgeBg("#28a745");

    setBadgeMode("promo");

    setSolo12Meses(false);
    setCuotas12Producto("");

    setEditandoProducto(null);
  };

  const handleSubmitProducto = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    const specs = parseDescriptionToSpecs(descripcionProducto || "");

    const parseNumberSafe = (v: string): number | null => {
      if (v === "" || v === null || typeof v === "undefined") return null;
      const s = String(v).replace(/\s+/g, "").replace(/,/, ".");
      const n = Number(s);
      return Number.isFinite(n) ? n : null;
    };

    const contadoVal = parseNumberSafe(contadoProducto);
    const cuotas6Val = parseNumberSafe(cuotas6Producto);
    const cuotas8Val = parseNumberSafe(cuotas8Producto);
    const cuotaInicialVal = parseNumberSafe(cuotaInicialProducto);

    try {
      const payload: Omit<Product, 'id'> = {
        nombre: nombreProducto,
        descripcion: descripcionProducto,
        contado: contadoVal,
        cuotas6: cuotas6Val,
        cuotas8: cuotas8Val,
        imagen: imagenProducto,
        cuotaInicial: cuotaInicialVal,
        specs: specs,
        promo: !!promoActivo,
        promoPrice: promoActivo ? Number(promoPrice || 0) : null,
        promoBadgeText: promoActivo ? promoBadgeText || "PROMO" : null,
        promoBadgeBg: promoActivo ? promoBadgeBg || null : null,
        promoHighlight: promoActivo ? promoHighlight || null : null,
        nuevo: !!nuevoActivo,
        nuevoBadgeText: nuevoActivo ? nuevoBadgeText || "NUEVO" : null,
        nuevoBadgeBg: nuevoActivo ? nuevoBadgeBg || null : null,
        badgeMode: (badgeMode || "promo") as 'none' | 'promo' | 'nuevo' | 'ambos',
        solo12Meses: !!solo12Meses,
        cuotas12: solo12Meses ? parseNumberSafe(cuotas12Producto) : null,
      };

      if (editandoProducto) {
        await updateProduct(editandoProducto.id, payload);
        setSuccess("Producto actualizado exitosamente!");
      } else {
        await createProduct(payload);
        setSuccess("Producto agregado exitosamente!");
      }
      resetProductoForm();
    } catch (err: unknown) {
      console.error("Error al guardar producto:", err);
      const message = err instanceof Error ? err.message : "Error desconocido";
      setError(`Error al guardar producto: ${message}`);
    }
  };

  return (
    <Card className="p-4 mb-4 shadow-sm">
      <h3 className="mb-3">
        {editandoProducto ? "Editar Producto" : "Agregar Nuevo Producto"}
      </h3>
      <p className="text-muted mb-3">
        Complete el formulario para agregar un nuevo producto al catálogo.
        Para editar un producto existente, vaya a la sección "Productos".
      </p>
      <Form onSubmit={handleSubmitProducto}>
        <Form.Group className="mb-3">
          <Form.Label>Nombre</Form.Label>
          <Form.Control
            type="text"
            value={nombreProducto}
            onChange={(e) => setNombreProducto(e.target.value)}
            required
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Descripción</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            value={descripcionProducto}
            onChange={(e) => setDescripcionProducto(e.target.value)}
          />
        </Form.Group>
        <Row className="g-3">
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>Precio Contado</Form.Label>
              <Form.Control
                type="number"
                value={contadoProducto}
                onChange={(e) => setContadoProducto(e.target.value)}
                required
              />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>16 Cuotas Quincenales</Form.Label>
              <Form.Control
                type="number"
                value={cuotas6Producto}
                disabled={solo12Meses}
                onChange={(e) => {
                  const v = e.target.value;
                  setCuotas6Producto(v);
                  if (v === "" || v === null) {
                    setCuotas8Producto("");
                  } else {
                    const n = Number(
                      String(v).replace(/\s+/g, "").replace(/,/, "."),
                    );
                    setCuotas8Producto(
                      Number.isFinite(n) ? String(n * 2) : "",
                    );
                  }
                }}
              />
              {solo12Meses && (
                <Form.Text className="text-muted">
                  Deshabilitado (modo 12 meses activo)
                </Form.Text>
              )}
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>8 Cuotas Mensuales</Form.Label>
              <Form.Control
                type="number"
                value={cuotas8Producto}
                disabled={solo12Meses}
                onChange={(e) => setCuotas8Producto(e.target.value)}
              />
              <Form.Text className="text-muted">
                {solo12Meses
                  ? "Deshabilitado (modo 12 meses activo)"
                  : "Se completa automáticamente como el doble de las 16 quincenas (editable)."}
              </Form.Text>
            </Form.Group>
          </Col>
        </Row>

        <Row className="g-3">
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>Cuota Inicial (opcional)</Form.Label>
              <Form.Control
                type="number"
                value={cuotaInicialProducto}
                onChange={(e) => setCuotaInicialProducto(e.target.value)}
                min={0}
                placeholder="0"
              />
            </Form.Group>
          </Col>
          <Col md={8}>
            <Form.Group className="mb-3">
              <Form.Label>URL Imagen</Form.Label>
              <Form.Control
                type="text"
                value={imagenProducto}
                onChange={(e) => setImagenProducto(e.target.value)}
                placeholder="https://…"
              />
            </Form.Group>
          </Col>
        </Row>

        <Card className="p-3 mb-3">
          <div className="d-flex align-items-center justify-content-between">
            <h5 className="mb-0">
              Promoción
              {promoActivo && (
                <Badge bg="danger" className="ms-2">
                  ACTIVA
                </Badge>
              )}
            </h5>
            <Form.Check
              type="switch"
              id="promo-switch"
              label={promoActivo ? "Promo activa" : "Promo inactiva"}
              checked={promoActivo}
              onChange={(e) => setPromoActivo(e.target.checked)}
            />
          </div>

          <Row className="mt-2 g-3">
            <Col md={3}>
              <Form.Label>Precio promo</Form.Label>
              <Form.Control
                type="number"
                value={promoPrice}
                disabled={!promoActivo}
                onChange={(e) => setPromoPrice(e.target.value)}
                placeholder="ej. 899000"
              />
            </Col>
            <Col md={3}>
              <Form.Label>Texto del badge</Form.Label>
              <Form.Control
                value={promoBadgeText}
                disabled={!promoActivo}
                onChange={(e) => setPromoBadgeText(e.target.value)}
                placeholder="PROMO"
              />
            </Col>
            <Col md={3}>
              <Form.Label>Color badge</Form.Label>
              <Form.Control
                type="color"
                value={promoBadgeBg}
                disabled={!promoActivo}
                onChange={(e) => setPromoBadgeBg(e.target.value)}
              />
            </Col>
            <Col md={3}>
              <Form.Label>Highlight tarjeta</Form.Label>
              <Form.Control
                value={promoHighlight}
                disabled={!promoActivo}
                onChange={(e) => setPromoHighlight(e.target.value)}
                placeholder="rgba(...) o #hex (opcional)"
              />
            </Col>
          </Row>

          <Row className="mt-2 g-3 align-items-center">
            <Col md={6}>
              <Form.Label>Tipo de etiqueta</Form.Label>
              <Form.Select
                value={badgeMode}
                onChange={(e) => setBadgeMode(e.target.value)}
              >
                <option value="none">Ninguna</option>
                <option value="promo">Sólo Promo</option>
                <option value="nuevo">Sólo Nuevo</option>
                <option value="ambos">Promo + Nuevo</option>
              </Form.Select>
              <Form.Text className="text-muted">
                Selecciona qué etiqueta(es) deben mostrarse en el
                catálogo.
              </Form.Text>
            </Col>
          </Row>

          <hr />

          <div className="d-flex align-items-center justify-content-between">
            <h6 className="mb-0">Producto Nuevo</h6>
            <Form.Check
              type="switch"
              id="nuevo-switch"
              label={nuevoActivo ? "Nuevo activo" : "Nuevo inactivo"}
              checked={nuevoActivo}
              onChange={(e) => setNuevoActivo(e.target.checked)}
            />
          </div>

          <Row className="mt-2 g-3">
            <Col md={6}>
              <Form.Label>Texto badge nuevo</Form.Label>
              <Form.Control
                type="text"
                value={nuevoBadgeText}
                disabled={!nuevoActivo}
                onChange={(e) => setNuevoBadgeText(e.target.value)}
                placeholder="NUEVO"
              />
            </Col>
            <Col md={6}>
              <Form.Label>Color badge nuevo</Form.Label>
              <Form.Control
                type="color"
                value={nuevoBadgeBg}
                disabled={!nuevoActivo}
                onChange={(e) => setNuevoBadgeBg(e.target.value)}
              />
            </Col>
          </Row>

          <Form.Text className="text-muted">
            Si dejas colores vacíos, se usarán los del{" "}
            <strong>tema de temporada</strong> (si está activo).
          </Form.Text>
        </Card>

        <Card
          className="p-3 mb-3"
          style={{ borderLeft: "4px solid #2196f3" }}
        >
          <div className="d-flex align-items-center justify-content-between">
            <h5 className="mb-0">
              Financiación Exclusiva 12 Meses
              {solo12Meses && (
                <Badge bg="info" className="ms-2">
                  ACTIVA
                </Badge>
              )}
            </h5>
            <Form.Check
              type="switch"
              id="solo12meses-switch"
              label={solo12Meses ? "Activo" : "Inactivo"}
              checked={solo12Meses}
              onChange={(e) => setSolo12Meses(e.target.checked)}
            />
          </div>

          <Row className="mt-3 g-3">
            <Col md={12}>
              <Form.Label>Cuota Mensual (12 meses)</Form.Label>
              <Form.Control
                type="number"
                value={cuotas12Producto}
                disabled={!solo12Meses}
                onChange={(e) => setCuotas12Producto(e.target.value)}
                placeholder="ej. 150000"
              />
              <Form.Text className="text-muted">
                <strong>Importante:</strong> Cuando se active esta opción,
                el producto mostrará <strong>ÚNICAMENTE</strong> el plan
                de 12 cuotas mensuales en el catálogo. Los campos de 16
                quincenas y 8 meses se deshabilitarán pero sus valores se
                conservarán.
              </Form.Text>
            </Col>
          </Row>
        </Card>

        <Button variant="primary" type="submit" className="me-2">
          {editandoProducto ? "Actualizar Producto" : "Agregar Producto"}
        </Button>
{editandoProducto && (
          <Button variant="secondary" onClick={resetProductoForm}>
            Cancelar Edición
          </Button>
        )}
      </Form>
    </Card>
  );
}

export default AdminAddProductTab;
