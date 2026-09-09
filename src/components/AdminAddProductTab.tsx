import { useState, useEffect, FormEvent } from "react";
import { createProduct, updateProduct } from "../services/product.service";
import { Product, ProductSpecs } from "../types";
import { extractProductSpecs, sanitizeSpecs } from "../utils/specs-parser";
import { formatPrice } from "../utils/formatters";
import ProductImage from "./common/ProductImage";

export interface AdminAddProductTabProps {
  nombreProducto: string;
  setNombreProducto: (v: string) => void;
  marcaProducto?: string;
  setMarcaProducto?: (v: string) => void;
  categoriaProducto?: string;
  setCategoriaProducto?: (v: string) => void;
  esDestacado?: boolean;
  setEsDestacado?: (v: boolean) => void;
  stockProducto?: string;
  setStockProducto?: (v: string) => void;
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
  specsAlmacenamiento?: string;
  setSpecsAlmacenamiento?: (v: string) => void;
  specsRam?: string;
  setSpecsRam?: (v: string) => void;
  specsCamara?: string;
  setSpecsCamara?: (v: string) => void;
  specsPantalla?: string;
  setSpecsPantalla?: (v: string) => void;
  specsBateria?: string;
  setSpecsBateria?: (v: string) => void;
  setSuccess: (v: string) => void;
  setError: (v: string) => void;
  onCancel?: () => void;
}

const BRANDS = [
  "Apple",
  "Samsung",
  "Xiaomi",
  "Motorola",
  "Tecno",
  "Infinix",
  "Honor",
  "Realme",
  "Huawei",
  "Otra",
];

const CATEGORIES = [
  "Celulares",
  "Accesorios",
  "Audio",
  "Tablets",
  "Smartwatch",
  "Servicio Técnico",
  "Otros",
];

const STORAGE_PILLS = [64, 128, 256, 512, 1024];
const RAM_PILLS = [4, 6, 8, 12, 16];
const BATTERY_PILLS = [4000, 5000, 6000];
const SCREEN_PILLS = ["6.1", "6.6", "6.7", "6.8"];

function AdminAddProductTab({
  nombreProducto,
  setNombreProducto,
  marcaProducto = "Xiaomi",
  setMarcaProducto,
  categoriaProducto = "Celulares",
  setCategoriaProducto,
  esDestacado = false,
  setEsDestacado,
  stockProducto = "10",
  setStockProducto,
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
  specsAlmacenamiento = "",
  setSpecsAlmacenamiento,
  specsRam = "",
  setSpecsRam,
  specsCamara = "",
  setSpecsCamara,
  specsPantalla = "",
  setSpecsPantalla,
  specsBateria = "",
  setSpecsBateria,
  setSuccess,
  setError,
  onCancel,
}: AdminAddProductTabProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Local state fallbacks if setters are not provided
  const [localMarca, setLocalMarca] = useState(marcaProducto);
  const [localCategoria, setLocalCategoria] = useState(categoriaProducto);
  const [localDestacado, setLocalDestacado] = useState(esDestacado);
  const [localStock, setLocalStock] = useState(stockProducto);
  const [localAlm, setLocalAlm] = useState(specsAlmacenamiento);
  const [localRam, setLocalRam] = useState(specsRam);
  const [localCam, setLocalCam] = useState(specsCamara);
  const [localPan, setLocalPan] = useState(specsPantalla);
  const [localBat, setLocalBat] = useState(specsBateria);

  useEffect(() => {
    setLocalMarca(marcaProducto);
  }, [marcaProducto]);
  useEffect(() => {
    setLocalCategoria(categoriaProducto);
  }, [categoriaProducto]);
  useEffect(() => {
    setLocalDestacado(esDestacado);
  }, [esDestacado]);
  useEffect(() => {
    setLocalStock(stockProducto);
  }, [stockProducto]);
  useEffect(() => {
    setLocalAlm(specsAlmacenamiento);
  }, [specsAlmacenamiento]);
  useEffect(() => {
    setLocalRam(specsRam);
  }, [specsRam]);
  useEffect(() => {
    setLocalCam(specsCamara);
  }, [specsCamara]);
  useEffect(() => {
    setLocalPan(specsPantalla);
  }, [specsPantalla]);
  useEffect(() => {
    setLocalBat(specsBateria);
  }, [specsBateria]);

  // When editing a product, hydrate specs from product if present
  useEffect(() => {
    if (editandoProducto) {
      if (editandoProducto.marca && setMarcaProducto) setMarcaProducto(editandoProducto.marca);
      if (editandoProducto.categoria && setCategoriaProducto) setCategoriaProducto(editandoProducto.categoria);
      if (typeof editandoProducto.esDestacado === "boolean" && setEsDestacado) setEsDestacado(editandoProducto.esDestacado);
      if (typeof editandoProducto.stock === "number" && setStockProducto) setStockProducto(String(editandoProducto.stock));

      const existingSpecs = extractProductSpecs(editandoProducto);
      if (existingSpecs.almacenamiento && setSpecsAlmacenamiento) setSpecsAlmacenamiento(String(existingSpecs.almacenamiento));
      if (existingSpecs.ram && setSpecsRam) setSpecsRam(String(existingSpecs.ram));
      if (existingSpecs.camara && setSpecsCamara) setSpecsCamara(String(existingSpecs.camara));
      if (existingSpecs.pantalla && setSpecsPantalla) setSpecsPantalla(String(existingSpecs.pantalla));
      if (existingSpecs.bateria && setSpecsBateria) setSpecsBateria(String(existingSpecs.bateria));
    }
  }, [editandoProducto]);

  const updateMarca = (v: string) => {
    setLocalMarca(v);
    if (setMarcaProducto) setMarcaProducto(v);
  };
  const updateCategoria = (v: string) => {
    setLocalCategoria(v);
    if (setCategoriaProducto) setCategoriaProducto(v);
  };
  const updateDestacado = (v: boolean) => {
    setLocalDestacado(v);
    if (setEsDestacado) setEsDestacado(v);
  };
  const updateStock = (v: string) => {
    setLocalStock(v);
    if (setStockProducto) setStockProducto(v);
  };
  const updateAlm = (v: string) => {
    setLocalAlm(v);
    if (setSpecsAlmacenamiento) setSpecsAlmacenamiento(v);
  };
  const updateRam = (v: string) => {
    setLocalRam(v);
    if (setSpecsRam) setSpecsRam(v);
  };
  const updateCam = (v: string) => {
    setLocalCam(v);
    if (setSpecsCamara) setSpecsCamara(v);
  };
  const updatePan = (v: string) => {
    setLocalPan(v);
    if (setSpecsPantalla) setSpecsPantalla(v);
  };
  const updateBat = (v: string) => {
    setLocalBat(v);
    if (setSpecsBateria) setSpecsBateria(v);
  };

  const resetProductoForm = () => {
    setNombreProducto("");
    updateMarca("Xiaomi");
    updateCategoria("Celulares");
    updateDestacado(false);
    updateStock("10");
    setDescripcionProducto("");
    setContadoProducto("");
    setCuotas6Producto("");
    setCuotas8Producto("");
    setImagenProducto("");
    setCuotaInicialProducto("");

    updateAlm("");
    updateRam("");
    updateCam("");
    updatePan("");
    updateBat("");

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
    if (onCancel) onCancel();
  };

  const parseNumberSafe = (v: string): number | null => {
    if (v === "" || v === null || typeof v === "undefined") return null;
    const s = String(v).replace(/\s+/g, "").replace(/,/, ".");
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  };

  const handleSubmitProducto = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    const explicitSpecs: ProductSpecs = sanitizeSpecs({
      almacenamiento: parseNumberSafe(localAlm),
      ram: parseNumberSafe(localRam),
      camara: parseNumberSafe(localCam),
      pantalla: parseNumberSafe(localPan),
      bateria: parseNumberSafe(localBat),
    });

    const fallbackSpecs = extractProductSpecs({
      nombre: nombreProducto,
      descripcion: descripcionProducto,
      categoria: localCategoria,
      marca: localMarca,
    });

    const finalSpecs: ProductSpecs = {
      almacenamiento: explicitSpecs.almacenamiento ?? fallbackSpecs.almacenamiento,
      ram: explicitSpecs.ram ?? fallbackSpecs.ram,
      camara: explicitSpecs.camara ?? fallbackSpecs.camara,
      pantalla: explicitSpecs.pantalla ?? fallbackSpecs.pantalla,
      bateria: explicitSpecs.bateria ?? fallbackSpecs.bateria,
    };

    const contadoVal = parseNumberSafe(contadoProducto);
    const cuotas6Val = parseNumberSafe(cuotas6Producto);
    const cuotas8Val = parseNumberSafe(cuotas8Producto);
    const cuotaInicialVal = parseNumberSafe(cuotaInicialProducto);
    const stockVal = parseNumberSafe(localStock) ?? 10;

    try {
      const payload: Omit<Product, "id"> = {
        nombre: nombreProducto.trim(),
        marca: localMarca,
        categoria: localCategoria,
        esDestacado: !!localDestacado,
        stock: stockVal,
        enStock: stockVal > 0,
        descripcion: descripcionProducto.trim(),
        contado: contadoVal,
        cuotas6: cuotas6Val,
        cuotas8: cuotas8Val,
        imagen: imagenProducto.trim(),
        cuotaInicial: cuotaInicialVal,
        specs: finalSpecs,
        promo: !!promoActivo,
        promoPrice: promoActivo ? parseNumberSafe(promoPrice) : null,
        promoBadgeText: promoActivo ? promoBadgeText || "PROMO" : null,
        promoBadgeBg: promoActivo ? promoBadgeBg || null : null,
        promoHighlight: promoActivo ? promoHighlight || null : null,
        nuevo: !!nuevoActivo,
        nuevoBadgeText: nuevoActivo ? nuevoBadgeText || "NUEVO" : null,
        nuevoBadgeBg: nuevoActivo ? nuevoBadgeBg || null : null,
        badgeMode: (badgeMode || "promo") as "none" | "promo" | "nuevo" | "ambos",
        solo12Meses: !!solo12Meses,
        cuotas12: solo12Meses ? parseNumberSafe(cuotas12Producto) : null,
        createdAt: editandoProducto?.createdAt || new Date(),
      };

      if (editandoProducto) {
        await updateProduct(editandoProducto.id, payload);
        setSuccess(`¡Producto "${nombreProducto}" actualizado exitosamente!`);
      } else {
        await createProduct(payload);
        setSuccess(`¡Producto "${nombreProducto}" registrado exitosamente en el catálogo!`);
      }
      resetProductoForm();
    } catch (err: unknown) {
      console.error("Error al guardar producto:", err);
      const message = err instanceof Error ? err.message : "Error desconocido";
      setError(`Error al guardar producto: ${message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Specs preview calculation
  const previewSpecs: ProductSpecs = {
    almacenamiento: parseNumberSafe(localAlm),
    ram: parseNumberSafe(localRam),
    camara: parseNumberSafe(localCam),
    pantalla: parseNumberSafe(localPan),
    bateria: parseNumberSafe(localBat),
  };

  return (
    <div className="admin-add-product-container">
      <form onSubmit={handleSubmitProducto}>
        <div className="row g-4">
          {/* ─── Left Column: Form Cards ─────────────── */}
          <div className="col-12 col-xl-8 d-flex flex-column gap-4">
            {/* CARD 1: Información Comercial */}
            <div className="admin-card-pro">
              <div className="admin-card-header-clean mb-3">
                <div className="admin-card-header-icon commercial">
                  <i className="bi bi-tag-fill" />
                </div>
                <div>
                  <h3 className="admin-card-title mb-0">
                    1. Información Comercial
                  </h3>
                  <p className="admin-card-subtitle mb-0">
                    Detalles principales, marca oficial, categoría y visibilidad
                  </p>
                </div>
              </div>

              <div className="row g-3">
                {/* Nombre */}
                <div className="col-12 col-md-8">
                  <label htmlFor="nombre-producto-input" className="form-label fw-semibold">
                    Nombre del Producto <span className="text-danger">*</span>
                  </label>
                  <input
                    id="nombre-producto-input"
                    type="text"
                    className="form-control"
                    placeholder="Ej: Xiaomi Redmi Note 13 Pro 4G"
                    value={nombreProducto}
                    onChange={(e) => setNombreProducto(e.target.value)}
                    required
                  />
                </div>

                {/* Marca */}
                <div className="col-6 col-md-4">
                  <label htmlFor="marca-producto-select" className="form-label fw-semibold">Marca</label>
                  <select
                    id="marca-producto-select"
                    className="form-select"
                    value={localMarca}
                    onChange={(e) => updateMarca(e.target.value)}
                  >
                    {BRANDS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Categoría */}
                <div className="col-6 col-md-6">
                  <label htmlFor="categoria-producto-select" className="form-label fw-semibold">Categoría</label>
                  <select
                    id="categoria-producto-select"
                    className="form-select"
                    value={localCategoria}
                    onChange={(e) => updateCategoria(e.target.value)}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Stock Switch & Destacado */}
                <div className="col-12 col-md-6 d-flex align-items-center gap-4 pt-2">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      role="switch"
                      id="destacado-switch"
                      checked={localDestacado}
                      onChange={(e) => updateDestacado(e.target.checked)}
                    />
                    <label
                      className="form-check-label fw-semibold d-inline-flex align-items-center gap-1"
                      htmlFor="destacado-switch"
                    >
                      <i className="bi bi-star-fill text-warning" aria-hidden="true" />
                      <span>Producto Destacado</span>
                    </label>
                  </div>

                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      role="switch"
                      id="stock-active-switch"
                      checked={(parseNumberSafe(localStock) ?? 10) > 0}
                      onChange={(e) =>
                        updateStock(e.target.checked ? "10" : "0")
                      }
                    />
                    <label
                      className="form-check-label fw-semibold d-inline-flex align-items-center gap-1"
                      htmlFor="stock-active-switch"
                    >
                      <i className="bi bi-box-seam" aria-hidden="true" />
                      <span>En Stock</span>
                    </label>
                  </div>
                </div>

                {/* Descripción */}
                <div className="col-12">
                  <label htmlFor="descripcion-producto-textarea" className="form-label fw-semibold">
                    Descripción Comercial & Puntos Fuertes
                  </label>
                  <textarea
                    id="descripcion-producto-textarea"
                    className="form-control"
                    rows={3}
                    placeholder="Ej: Pantalla AMOLED de 120Hz, cámara triple de 200MP con OIS, carga rápida de 67W Turbo Charge..."
                    value={descripcionProducto}
                    onChange={(e) => setDescripcionProducto(e.target.value)}
                  />
                  <small className="text-muted">
                    El sistema también puede auto-extraer especificaciones de este texto si no se llenan manualmente abajo.
                  </small>
                </div>
              </div>
            </div>

            {/* CARD 2: Especificaciones Técnicas Explícitas */}
            <div className="admin-card-pro">
              <div className="admin-card-header-clean mb-3">
                <div className="admin-card-header-icon specs">
                  <i className="bi bi-cpu-fill" />
                </div>
                <div>
                  <h3 className="admin-card-title mb-0">
                    2. Especificaciones Técnicas Explícitas
                  </h3>
                  <p className="admin-card-subtitle mb-0">
                    Chips de rendimiento que aparecen en la tarjeta de producto
                  </p>
                </div>
              </div>

              <div className="row g-3">
                {/* Almacenamiento */}
                <div className="col-12 col-md-6">
                  <label htmlFor="almacenamiento-input" className="form-label fw-semibold">
                    Almacenamiento (GB / TB)
                  </label>
                  <div className="d-flex gap-1 flex-wrap mb-2">
                    {STORAGE_PILLS.map((p) => (
                      <button
                        key={p}
                        type="button"
                        className={`btn btn-xs ${
                          localAlm === String(p)
                            ? "btn-danger fw-bold"
                            : "btn-outline-secondary"
                        }`}
                        onClick={() => updateAlm(String(p))}
                      >
                        {p >= 1024 ? `${p / 1024}TB` : `${p}GB`}
                      </button>
                    ))}
                  </div>
                  <input
                    id="almacenamiento-input"
                    type="number"
                    className="form-control"
                    placeholder="Ej: 256 (en GB)"
                    value={localAlm}
                    onChange={(e) => updateAlm(e.target.value)}
                  />
                </div>

                {/* RAM */}
                <div className="col-12 col-md-6">
                  <label htmlFor="ram-input" className="form-label fw-semibold">
                    Memoria RAM (GB)
                  </label>
                  <div className="d-flex gap-1 flex-wrap mb-2">
                    {RAM_PILLS.map((p) => (
                      <button
                        key={p}
                        type="button"
                        className={`btn btn-xs ${
                          localRam === String(p)
                            ? "btn-danger fw-bold"
                            : "btn-outline-secondary"
                        }`}
                        onClick={() => updateRam(String(p))}
                      >
                        {p}GB
                      </button>
                    ))}
                  </div>
                  <input
                    id="ram-input"
                    type="number"
                    className="form-control"
                    placeholder="Ej: 8 (en GB)"
                    value={localRam}
                    onChange={(e) => updateRam(e.target.value)}
                  />
                </div>

                {/* Cámara */}
                <div className="col-12 col-md-4">
                  <label htmlFor="camara-input" className="form-label fw-semibold">
                    Cámara Principal (MP)
                  </label>
                  <input
                    id="camara-input"
                    type="number"
                    className="form-control"
                    placeholder="Ej: 50, 108, 200"
                    value={localCam}
                    onChange={(e) => updateCam(e.target.value)}
                  />
                </div>

                {/* Batería */}
                <div className="col-12 col-md-4">
                  <label htmlFor="bateria-input" className="form-label fw-semibold">
                    Batería (mAh)
                  </label>
                  <div className="d-flex gap-1 mb-1">
                    {BATTERY_PILLS.map((b) => (
                      <button
                        key={b}
                        type="button"
                        className={`btn btn-xs ${
                          localBat === String(b)
                            ? "btn-danger"
                            : "btn-outline-secondary"
                        }`}
                        onClick={() => updateBat(String(b))}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                  <input
                    id="bateria-input"
                    type="number"
                    className="form-control"
                    placeholder="Ej: 5000"
                    value={localBat}
                    onChange={(e) => updateBat(e.target.value)}
                  />
                </div>

                {/* Pantalla */}
                <div className="col-12 col-md-4">
                  <label htmlFor="pantalla-input" className="form-label fw-semibold">
                    Pantalla (pulgadas)
                  </label>
                  <div className="d-flex gap-1 mb-1">
                    {SCREEN_PILLS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        className={`btn btn-xs ${
                          localPan === s
                            ? "btn-danger"
                            : "btn-outline-secondary"
                        }`}
                        onClick={() => updatePan(s)}
                      >
                        {s}&quot;
                      </button>
                    ))}
                  </div>
                  <input
                    id="pantalla-input"
                    type="number"
                    step="0.1"
                    className="form-control"
                    placeholder="Ej: 6.67"
                    value={localPan}
                    onChange={(e) => updatePan(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* CARD 3: Precios & Financiación */}
            <div className="admin-card-pro">
              <div className="admin-card-header-clean mb-3">
                <div className="admin-card-header-icon pricing">
                  <i className="bi bi-currency-dollar" />
                </div>
                <div>
                  <h3 className="admin-card-title mb-0">
                    3. Precios & Financiación
                  </h3>
                  <p className="admin-card-subtitle mb-0">
                    Valores de contado, planes quincenales, mensuales y promociones
                  </p>
                </div>
              </div>

              <div className="row g-3">
                {/* Contado */}
                <div className="col-12 col-md-6">
                  <label htmlFor="contado-producto-input" className="form-label fw-semibold">
                    Precio de Contado ($ COP) <span className="text-danger">*</span>
                  </label>
                  <div className="input-group">
                    <span className="input-group-text">$</span>
                    <input
                      id="contado-producto-input"
                      type="number"
                      className="form-control"
                      placeholder="1250000"
                      value={contadoProducto}
                      onChange={(e) => setContadoProducto(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Cuota Inicial */}
                <div className="col-12 col-md-6">
                  <label htmlFor="cuota-inicial-input" className="form-label fw-semibold">
                    Cuota Inicial Sugerida (opcional)
                  </label>
                  <div className="input-group">
                    <span className="input-group-text">$</span>
                    <input
                      id="cuota-inicial-input"
                      type="number"
                      className="form-control"
                      placeholder="0"
                      value={cuotaInicialProducto}
                      onChange={(e) => setCuotaInicialProducto(e.target.value)}
                    />
                  </div>
                </div>

                {/* 16 Quincenas */}
                <div className="col-12 col-md-6">
                  <label htmlFor="cuotas-16q-input" className="form-label fw-semibold">
                    16 Cuotas Quincenales
                  </label>
                  <div className="input-group">
                    <span className="input-group-text">$</span>
                    <input
                      id="cuotas-16q-input"
                      type="number"
                      className="form-control"
                      placeholder="85000"
                      value={cuotas6Producto}
                      disabled={solo12Meses}
                      onChange={(e) => {
                        const v = e.target.value;
                        setCuotas6Producto(v);
                        if (!v) {
                          setCuotas8Producto("");
                        } else {
                          const n = Number(v);
                          setCuotas8Producto(Number.isFinite(n) ? String(n * 2) : "");
                        }
                      }}
                    />
                  </div>
                  <small className="text-muted">
                    Auto-sugiere las 8 cuotas mensuales como el doble.
                  </small>
                </div>

                {/* 8 Meses */}
                <div className="col-12 col-md-6">
                  <label htmlFor="cuotas-8m-input" className="form-label fw-semibold">
                    8 Cuotas Mensuales
                  </label>
                  <div className="input-group">
                    <span className="input-group-text">$</span>
                    <input
                      id="cuotas-8m-input"
                      type="number"
                      className="form-control"
                      placeholder="170000"
                      value={cuotas8Producto}
                      disabled={solo12Meses}
                      onChange={(e) => setCuotas8Producto(e.target.value)}
                    />
                  </div>
                </div>

                {/* Financiación 12 meses */}
                <div className="col-12">
                  <div className="admin-sub-card p-3 border rounded">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <div className="d-flex align-items-center gap-2">
                        <i className="bi bi-calendar3 text-primary fs-5" />
                        <span className="fw-semibold">
                          Financiación Exclusiva 12 Meses
                        </span>
                      </div>
                      <div className="form-check form-switch mb-0">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          role="switch"
                          id="switch-12meses"
                          checked={solo12Meses}
                          onChange={(e) => setSolo12Meses(e.target.checked)}
                        />
                      </div>
                    </div>

                    {solo12Meses && (
                      <div className="row g-2 mt-1">
                        <div className="col-12 col-md-6">
                          <label htmlFor="cuotas-12m-input" className="form-label">
                            Valor Cuota Mensual (12 meses)
                          </label>
                          <div className="input-group">
                            <span className="input-group-text">$</span>
                            <input
                              id="cuotas-12m-input"
                              type="number"
                              className="form-control"
                              placeholder="150000"
                              value={cuotas12Producto}
                              onChange={(e) =>
                                setCuotas12Producto(e.target.value)
                              }
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Promoción & Badges */}
                <div className="col-12">
                  <div className="admin-sub-card p-3 border rounded">
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <div className="d-flex align-items-center gap-2">
                        <i className="bi bi-lightning-charge-fill text-warning fs-5" />
                        <span className="fw-semibold">
                          Promoción & Badges Visuales
                        </span>
                      </div>
                      <div className="form-check form-switch mb-0">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          role="switch"
                          id="switch-promo"
                          checked={promoActivo}
                          onChange={(e) => setPromoActivo(e.target.checked)}
                        />
                        <label
                          className="form-check-label fw-semibold"
                          htmlFor="switch-promo"
                        >
                          {promoActivo ? "Promo Activa" : "Promo Inactiva"}
                        </label>
                      </div>
                    </div>

                    {promoActivo && (
                      <div className="row g-3">
                        <div className="col-12 col-md-4">
                          <label htmlFor="precio-promo-input" className="form-label">Precio Promo ($ COP)</label>
                          <input
                            id="precio-promo-input"
                            type="number"
                            className="form-control"
                            placeholder="899000"
                            value={promoPrice}
                            onChange={(e) => setPromoPrice(e.target.value)}
                          />
                        </div>
                        <div className="col-12 col-md-4">
                          <label htmlFor="texto-badge-promo-input" className="form-label">Texto Badge Promo</label>
                          <input
                            id="texto-badge-promo-input"
                            type="text"
                            className="form-control"
                            placeholder="PROMO"
                            value={promoBadgeText}
                            onChange={(e) => setPromoBadgeText(e.target.value)}
                          />
                        </div>
                        <div className="col-12 col-md-4">
                          <label htmlFor="color-badge-promo-input" className="form-label">Color Badge</label>
                          <input
                            id="color-badge-promo-input"
                            type="color"
                            className="form-control form-control-color w-100"
                            value={promoBadgeBg}
                            onChange={(e) => setPromoBadgeBg(e.target.value)}
                          />
                        </div>
                      </div>
                    )}

                    <hr className="my-3" />

                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span className="fw-semibold">Etiqueta &quot;Nuevo&quot;</span>
                      <div className="form-check form-switch mb-0">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          role="switch"
                          id="switch-nuevo"
                          checked={nuevoActivo}
                          onChange={(e) => setNuevoActivo(e.target.checked)}
                        />
                      </div>
                    </div>

                    {nuevoActivo && (
                      <div className="row g-3">
                        <div className="col-6">
                          <label htmlFor="texto-badge-nuevo-input" className="form-label">Texto Badge Nuevo</label>
                          <input
                            id="texto-badge-nuevo-input"
                            type="text"
                            className="form-control"
                            placeholder="NUEVO"
                            value={nuevoBadgeText}
                            onChange={(e) => setNuevoBadgeText(e.target.value)}
                          />
                        </div>
                        <div className="col-6">
                          <label htmlFor="color-badge-nuevo-input" className="form-label">Color Badge</label>
                          <input
                            id="color-badge-nuevo-input"
                            type="color"
                            className="form-control form-control-color w-100"
                            value={nuevoBadgeBg}
                            onChange={(e) => setNuevoBadgeBg(e.target.value)}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* CARD 4: Imagen del Producto */}
            <div className="admin-card-pro">
              <div className="admin-card-header-clean mb-3">
                <div className="admin-card-header-icon image">
                  <i className="bi bi-image-fill" />
                </div>
                <div>
                  <h3 className="admin-card-title mb-0">
                    4. Imagen Oficial del Producto
                  </h3>
                  <p className="admin-card-subtitle mb-0">
                    URL pública de la fotografía del equipo en fondo blanco o transparente
                  </p>
                </div>
              </div>

              <div className="row g-3">
                <div className="col-12">
                  <label htmlFor="imagen-producto-url-input" className="form-label fw-semibold">
                    URL de la Imagen <span className="text-danger">*</span>
                  </label>
                  <input
                    id="imagen-producto-url-input"
                    type="url"
                    className="form-control"
                    placeholder="https://i.imgur.com/... o https://firebasestorage.googleapis.com/..."
                    value={imagenProducto}
                    onChange={(e) => setImagenProducto(e.target.value)}
                  />
                  <small className="text-muted">
                    Puedes pegar un enlace directo de Imgur, Firebase Storage, o la web oficial del fabricante.
                  </small>
                </div>
              </div>
            </div>
          </div>

          {/* ─── Right Column: Live Card Preview & Actions ─── */}
          <div className="col-12 col-xl-4">
            <div className="admin-sticky-preview-wrapper">
              {/* LIVE PREVIEW CARD */}
              <div className="admin-card-pro mb-4">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <span className="admin-preview-badge">
                    <i className="bi bi-eye-fill me-1" /> Live Preview
                  </span>
                  <span className="text-muted fs-7">Vista del Cliente</span>
                </div>

                {/* Preview Box */}
                <div className="admin-live-product-card-preview">
                  {/* Badges preview */}
                  <div className="d-flex gap-1 mb-2">
                    {promoActivo && (
                      <span
                        className="badge"
                        style={{
                          backgroundColor: promoBadgeBg || "#d81b60",
                          color: "#fff",
                        }}
                      >
                        {promoBadgeText || "PROMO"}
                      </span>
                    )}
                    {nuevoActivo && (
                      <span
                        className="badge"
                        style={{
                          backgroundColor: nuevoBadgeBg || "#28a745",
                          color: "#fff",
                        }}
                      >
                        {nuevoBadgeText || "NUEVO"}
                      </span>
                    )}
                    {localDestacado && (
                      <span className="badge bg-warning text-dark d-inline-flex align-items-center gap-1">
                        <i className="bi bi-star-fill" aria-hidden="true" />
                        <span>DESTACADO</span>
                      </span>
                    )}
                  </div>

                  {/* Image Stage */}
                  <div className="admin-preview-image-stage">
                    <ProductImage
                      src={imagenProducto}
                      alt={nombreProducto || "Preview del producto"}
                      brand={localMarca}
                      category={localCategoria}
                      variant="preview"
                      className="admin-preview-img"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>

                  {/* Brand & Name */}
                  <div className="admin-preview-brand-tag mt-2">
                    {localMarca}
                  </div>
                  <h4 className="admin-preview-title">
                    {nombreProducto || "Nombre del Producto"}
                  </h4>

                  {/* Specs Rail */}
                  <div className="admin-row-specs-chips mb-3">
                    {previewSpecs.almacenamiento && (
                      <span className="admin-spec-pill">
                        <i className="bi bi-sd-card me-1" />
                        {previewSpecs.almacenamiento >= 1024
                          ? `${previewSpecs.almacenamiento / 1024}TB`
                          : `${previewSpecs.almacenamiento}GB`}
                      </span>
                    )}
                    {previewSpecs.ram && (
                      <span className="admin-spec-pill">
                        <i className="bi bi-memory me-1" />
                        {previewSpecs.ram}GB
                      </span>
                    )}
                    {previewSpecs.camara && (
                      <span className="admin-spec-pill">
                        <i className="bi bi-camera me-1" />
                        {previewSpecs.camara}MP
                      </span>
                    )}
                    {previewSpecs.bateria && (
                      <span className="admin-spec-pill">
                        <i className="bi bi-battery-charging me-1" />
                        {previewSpecs.bateria}mAh
                      </span>
                    )}
                    {previewSpecs.pantalla && (
                      <span className="admin-spec-pill">
                        <i className="bi bi-phone me-1" />
                        {previewSpecs.pantalla}&quot;
                      </span>
                    )}
                  </div>

                  {/* Pricing Box */}
                  <div className="admin-preview-pricing-box">
                    <div className="d-flex align-items-baseline gap-2">
                      <span className="admin-preview-contado">
                        {formatPrice(promoActivo && promoPrice ? promoPrice : contadoProducto || 0)}
                      </span>
                      {promoActivo && contadoProducto && (
                        <span className="admin-preview-old-price">
                          {formatPrice(contadoProducto)}
                        </span>
                      )}
                    </div>

                    <div className="admin-preview-cuotas">
                      {solo12Meses && cuotas12Producto ? (
                        <span>12 cuotas de {formatPrice(cuotas12Producto)}</span>
                      ) : cuotas6Producto ? (
                        <span>16 quincenas de {formatPrice(cuotas6Producto)}</span>
                      ) : (
                        <span className="text-muted">Solo contado</span>
                      )}
                    </div>
                  </div>

                  {/* Simulated CTA */}
                  <button
                    type="button"
                    className="btn btn-danger w-100 mt-3 d-flex align-items-center justify-content-center gap-2 py-2"
                    disabled
                  >
                    <span>Cotizar / Financiar</span>
                    <i className="bi bi-arrow-right-short" />
                  </button>
                </div>
              </div>

              {/* ACTION BUTTONS CARD */}
              <div className="admin-card-pro">
                <button
                  type="submit"
                  className="btn btn-danger w-100 py-3 fw-bold fs-6 d-flex align-items-center justify-content-center gap-2 mb-2"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm"
                        role="status"
                        aria-hidden="true"
                      />
                      <span>Guardando...</span>
                    </>
                  ) : editandoProducto ? (
                    <>
                      <i className="bi bi-check2-circle fs-5" />
                      <span>Actualizar Producto</span>
                    </>
                  ) : (
                    <>
                      <i className="bi bi-plus-circle-fill fs-5" />
                      <span>Guardar Producto</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  className="btn btn-outline-secondary w-100 py-2"
                  onClick={resetProductoForm}
                  disabled={isSubmitting}
                >
                  {editandoProducto ? "Cancelar Edición" : "Limpiar Formulario"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

export default AdminAddProductTab;
