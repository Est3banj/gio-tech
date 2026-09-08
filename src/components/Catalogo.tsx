import React, { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Fuse from "fuse.js";
import { useProducts } from "../hooks/useProducts";
import { normalizeText } from "../utils/formatters";
import ProductCard from "./ProductCard";
import { Row, Col, Form, Spinner } from 'react-bootstrap';
import BannerSlider from "./BannerSlider";
import GeminiChat from "./GeminiChat";
import type { Product } from "../types";

interface RangoPrecio {
  value: string;
  label: string;
}

const rangosPrecio: RangoPrecio[] = [
  { value: "", label: "Todos los precios" },
  { value: "0-500000", label: "Hasta $500.000" },
  { value: "500000-1000000", label: "$500.000 - $1.000.000" },
  { value: "1000000-2000000", label: "$1.000.000 - $2.000.000" },
  { value: "2000000-4000000", label: "$2.000.000 - $4.000.000" },
  { value: "4000000-999999999", label: "Más de $4.000.000" },
];

const KNOWN_BRAND_MAP: Record<string, { canonical: string; aliases: string[] }> = {
  apple: { canonical: 'Apple', aliases: ['apple', 'iphone', 'ipad', 'macbook', 'airpods'] },
  samsung: { canonical: 'Samsung', aliases: ['samsung', 'galaxy'] },
  xiaomi: { canonical: 'Xiaomi', aliases: ['xiaomi', 'redmi', 'poco', 'mi'] },
  redmi: { canonical: 'Redmi', aliases: ['redmi'] },
  poco: { canonical: 'Poco', aliases: ['poco'] },
  motorola: { canonical: 'Motorola', aliases: ['motorola', 'moto'] },
  tecno: { canonical: 'Tecno', aliases: ['tecno', 'spark', 'camon', 'pova'] },
  infinix: { canonical: 'Infinix', aliases: ['infinix', 'hot', 'zero', 'smart', 'note'] },
  honor: { canonical: 'Honor', aliases: ['honor'] },
  huawei: { canonical: 'Huawei', aliases: ['huawei'] },
  realme: { canonical: 'Realme', aliases: ['realme'] },
  oppo: { canonical: 'Oppo', aliases: ['oppo'] },
  vivo: { canonical: 'Vivo', aliases: ['vivo'] },
  zte: { canonical: 'ZTE', aliases: ['zte', 'blade'] },
  google: { canonical: 'Google', aliases: ['google', 'pixel'] },
};

export function getProductBrand(p: Product): string {
  const rawMarca = p.marca?.trim();
  if (rawMarca) {
    const lower = rawMarca.toLowerCase();
    if (KNOWN_BRAND_MAP[lower]) {
      return KNOWN_BRAND_MAP[lower].canonical;
    }
    return rawMarca.charAt(0).toUpperCase() + rawMarca.slice(1);
  }

  // Si no tiene marca explícita, inferir desde el nombre
  const nombreNorm = normalizeText(p.nombre || '');
  for (const [, info] of Object.entries(KNOWN_BRAND_MAP)) {
    for (const alias of info.aliases) {
      const pattern = new RegExp(`(^|\\s)${alias}(\\s|$)`, 'i');
      if (pattern.test(nombreNorm)) {
        return info.canonical;
      }
    }
  }

  return '';
}

const Catalogo: React.FC = () => {
  const { products: productos, isLoading } = useProducts();
  const [searchParams, setSearchParams] = useSearchParams();
  const [busqueda, setBusqueda] = useState("");
  const [filtroMarca, setFiltroMarca] = useState(searchParams.get("marca") || "");
  const [filtroPrecio, setFiltroPrecio] = useState("");
  const [ordenamiento, setOrdenamiento] = useState("default");
  const [showGeminiChat, setShowGeminiChat] = useState(false);

  useEffect(() => {
    const marcaParam = searchParams.get("marca");
    if (marcaParam !== null) {
      setFiltroMarca(marcaParam);
    }
  }, [searchParams]);

  // Leer query params de deep linking (?producto=ID o ?id=ID)
  const rawTargetId = searchParams.get("producto") || searchParams.get("id");
  const targetProductId = useMemo(() => {
    if (!rawTargetId) return "";
    try {
      return decodeURIComponent(rawTargetId).trim();
    } catch {
      return rawTargetId.trim();
    }
  }, [rawTargetId]);

  const isTargetProduct = (p: Product | null | undefined): boolean => {
    if (!targetProductId || !p?.id) return false;
    const pId = String(p.id).trim();
    const tId = targetProductId.trim();
    return pId === tId || pId.toLowerCase() === tId.toLowerCase();
  };

  const handleProductModalClose = () => {
    if (searchParams.has("producto") || searchParams.has("id")) {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("producto");
      newParams.delete("id");
      setSearchParams(newParams, { replace: true });
    }
  };

  const deepLinkedProduct = useMemo(() => {
    if (!targetProductId || productos.length === 0) return null;
    return productos.find(isTargetProduct) || null;
  }, [targetProductId, productos]);

  // Marcas extraídas dinámicamente de los productos con conteo y normalización
  const marcasConConteo = useMemo(() => {
    const counts: Record<string, number> = {};
    productos.forEach((p) => {
      const m = getProductBrand(p);
      if (m) {
        counts[m] = (counts[m] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .map(([marca, count]) => ({ marca, count }))
      .sort((a, b) => a.marca.localeCompare(b.marca, undefined, { sensitivity: 'base' }));
  }, [productos]);  // Instancia de Fuse.js para búsqueda difusa inteligente con ponderaciones clave
  const fuse = useMemo(() => {
    return new Fuse(productos, {
      keys: [
        { name: 'nombre', weight: 0.4 },
        { name: 'marca', weight: 0.3 },
        { name: 'categoria', weight: 0.2 },
        { name: 'descripcion', weight: 0.1 },
      ],
      threshold: 0.4,
      ignoreLocation: true,
      minMatchCharLength: 1,
    });
  }, [productos]);

  // Pipeline de filtrado combinando Fuse.js, marca y rango de precio
  const productosFiltrados = useMemo(() => {
    let baseList: Product[];
    const queryTerm = busqueda.trim();

    if (queryTerm) {
      baseList = fuse.search(queryTerm).map((result) => result.item);
    } else {
      baseList = productos;
    }

    return baseList.filter((producto) => {
      let coincideMarca = true;
      if (filtroMarca) {
        const marcaFiltrada = normalizeText(filtroMarca);
        const prodBrand = normalizeText(getProductBrand(producto));
        const rawBrand = producto.marca ? normalizeText(producto.marca) : "";
        const prodName = normalizeText(producto.nombre || "");
        const prodDesc = normalizeText(producto.descripcion || "");

        const aliasMatch = KNOWN_BRAND_MAP[marcaFiltrada]?.aliases.some(
          (alias) => prodName.includes(alias) || prodDesc.includes(alias)
        );

        coincideMarca =
          prodBrand === marcaFiltrada ||
          rawBrand === marcaFiltrada ||
          prodName.includes(marcaFiltrada) ||
          prodDesc.includes(marcaFiltrada) ||
          Boolean(aliasMatch);
      }

      let coincidePrecio = true;
      if (filtroPrecio) {
        const [min, max] = filtroPrecio.split('-').map(Number);
        const precio = parseFloat(String(producto.contado ?? producto.precio ?? 0)) || 0;
        coincidePrecio = precio >= min && precio <= max;
      }

      return coincideMarca && coincidePrecio;
    });
  }, [busqueda, fuse, productos, filtroMarca, filtroPrecio]);

  // Ordenamiento reactivo
  const productosOrdenados = useMemo(() => {
    return [...productosFiltrados].sort((a, b) => {
      const priceA = parseFloat(String(a.contado ?? a.precio ?? 0)) || 0;
      const priceB = parseFloat(String(b.contado ?? b.precio ?? 0)) || 0;
      if (ordenamiento === "price_asc") {
        return priceA - priceB;
      }
      if (ordenamiento === "price_desc") {
        return priceB - priceA;
      }
      if (ordenamiento === "name_asc") {
        return (a.nombre || '').localeCompare(b.nombre || '');
      }
      if (ordenamiento === "name_desc") {
        return (b.nombre || '').localeCompare(a.nombre || '');
      }
      return 0;
    });
  }, [productosFiltrados, ordenamiento]);

  const hasActiveFilters = Boolean(busqueda || filtroMarca || filtroPrecio || ordenamiento !== 'default');

  const handleResetFilters = () => {
    setBusqueda("");
    setFiltroMarca("");
    setFiltroPrecio("");
    setOrdenamiento("default");
  };

  return (
    <>
      <div className="banner-section">
        <BannerSlider />
      </div>

      <section className="catalogo-section section-inner py-3 py-md-4">
        {/* ─── Control Hub Compacto & Unificado ─── */}
        <div className="catalogo-control-hub mb-4">
          {/* Fila 1: Título, Badge de Conteo, Microcopy Legal & Buscador */}
          <div className="catalogo-header-row">
            <div className="catalogo-title-wrap">
              <div className="catalogo-title-line">
                <h1 className="catalogo-title">Catálogo de Dispositivos</h1>
                <span className="catalogo-count-badge">
                  {productosOrdenados.length} {productosOrdenados.length === 1 ? 'equipo' : 'equipos'}
                </span>
              </div>
              <span className="catalogo-legal-hint">
                <i className="bi bi-shield-check text-success"></i>
                Cuotas estimadas sujetas a validación crediticia
              </span>
            </div>

            <div className="catalogo-search-wrap">
              <div className="search-glass-wrapper">
                <i className="bi bi-search search-glass-icon" aria-hidden="true"></i>
                <Form.Control
                  type="text"
                  placeholder="Buscar por nombre o descripción..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="search-glass-input"
                  aria-label="Buscar dispositivos"
                />
                {busqueda && (
                  <button
                    type="button"
                    className="search-glass-clear-btn"
                    onClick={() => setBusqueda("")}
                    aria-label="Limpiar búsqueda"
                  >
                    <i className="bi bi-x-circle-fill"></i>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Fila 2: Barra de Controles de Refinamiento (3 Dropdowns + Limpiar Filtros) */}
          <div className="catalogo-filters-bar">
            <div className="catalogo-dropdowns-group">
              {/* Dropdown Selector de Marcas */}
              <div className="filter-select-wrapper">
                <i className="bi bi-tag filter-select-icon" aria-hidden="true"></i>
                <Form.Select
                  value={filtroMarca}
                  onChange={(e) => setFiltroMarca(e.target.value)}
                  size="sm"
                  aria-label="Filtrar por marca"
                  className="filter-glass-select"
                >
                  <option value="">Todas las marcas ({productos.length})</option>
                  {marcasConConteo.map(({ marca, count }) => (
                    <option key={marca} value={marca}>
                      {marca} ({count})
                    </option>
                  ))}
                </Form.Select>
              </div>

              {/* Dropdown Rango de Precio */}
              <div className="filter-select-wrapper">
                <i className="bi bi-cash-stack filter-select-icon" aria-hidden="true"></i>
                <Form.Select
                  value={filtroPrecio}
                  onChange={(e) => setFiltroPrecio(e.target.value)}
                  size="sm"
                  aria-label="Filtrar por rango de precio"
                  className="filter-glass-select"
                >
                  {rangosPrecio.map((rango) => (
                    <option key={rango.value} value={rango.value}>{rango.label}</option>
                  ))}
                </Form.Select>
              </div>

              {/* Dropdown Ordenamiento */}
              <div className="filter-select-wrapper">
                <i className="bi bi-arrow-down-up filter-select-icon" aria-hidden="true"></i>
                <Form.Select
                  value={ordenamiento}
                  onChange={(e) => setOrdenamiento(e.target.value)}
                  size="sm"
                  aria-label="Ordenar productos"
                  className="filter-glass-select"
                >
                  <option value="default">Destacados</option>
                  <option value="price_asc">Menor precio</option>
                  <option value="price_desc">Mayor precio</option>
                  <option value="name_asc">Nombre: A - Z</option>
                  <option value="name_desc">Nombre: Z - A</option>
                </Form.Select>
              </div>

              {hasActiveFilters && (
                <button
                  type="button"
                  className="btn-reset-filters-compact"
                  onClick={handleResetFilters}
                  title="Limpiar todos los filtros"
                  aria-label="Limpiar filtros"
                >
                  <i className="bi bi-arrow-counterclockwise"></i>
                  <span className="reset-label">Limpiar filtros</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ─── Grid de Productos o Estado Vacío ─── */}
        {isLoading ? (
          <div className="d-flex flex-column justify-content-center align-items-center py-5" style={{ minHeight: '300px' }}>
            <Spinner animation="border" role="status" variant="danger" style={{ width: '3rem', height: '3rem' }}>
              <span className="visually-hidden">Cargando productos...</span>
            </Spinner>
            <p className="mt-3 text-muted fw-semibold">Cargando catálogo de tecnología...</p>
          </div>
        ) : productosOrdenados.length === 0 ? (
          <div className="empty-catalog-state text-center py-5 px-3">
            <div className="empty-catalog-icon mb-3">
              <i className="bi bi-search"></i>
            </div>
            <h4 className="fw-bold mb-2">No se encontraron productos</h4>
            <p className="text-muted mb-4" style={{ maxWidth: '480px', margin: '0 auto' }}>
              Lo sentimos, no se encontraron productos que coincidan con tu búsqueda o filtros. Probá buscando otro término o reiniciando los filtros.
            </p>
            <button
              className="btn btn-primary px-4 py-2"
              onClick={handleResetFilters}
            >
              <i className="bi bi-arrow-counterclockwise me-2"></i> Ver todos los productos
            </button>
          </div>
        ) : (
          <Row className="g-3 g-sm-3 g-md-4 justify-content-start">
            {productosOrdenados.map((producto) => (
              <Col key={producto.id} xs={12} sm={6} md={6} lg={4} xl={4} xxl={3} className="d-flex">
                <ProductCard
                  producto={producto}
                  autoOpen={isTargetProduct(producto)}
                  onCloseModal={handleProductModalClose}
                />
              </Col>
            ))}
          </Row>
        )}

        {/* Deep link fallback si el producto solicitado está fuera del filtro activo */}
        {!isLoading && deepLinkedProduct && !productosOrdenados.some(isTargetProduct) && (
          <div style={{ display: 'none' }}>
            <ProductCard
              producto={deepLinkedProduct}
              autoOpen={true}
              onCloseModal={handleProductModalClose}
            />
          </div>
        )}

        {/* ─── Asistente Gemini Chat FAB ─── */}
        <button
          type="button"
          onClick={() => setShowGeminiChat(true)}
          aria-label="Abrir chat con IA"
          title="Chatea con nuestro asistente IA"
          className="gio-chat-fab"
          style={{
            position: 'fixed',
            bottom: '100px',
            right: '20px',
            width: '56px',
            height: '56px',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1050,
            background: '#0d6efd',
            borderRadius: '50%',
            border: 'none',
            boxShadow: '0 4px 20px rgba(13,110,253,0.4)',
            cursor: 'pointer',
            color: 'white',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'scale(1.08)';
            e.currentTarget.style.boxShadow = '0 6px 28px rgba(13,110,253,0.5)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(13,110,253,0.4)';
          }}
        >
          <i className="bi bi-chat-dots-fill" style={{ fontSize: '1.5rem', lineHeight: 1 }} />
        </button>

        <div
          onClick={() => setShowGeminiChat(true)}
          className="gio-chat-tooltip"
          style={{
            position: 'fixed',
            bottom: '117px',
            right: '90px',
            background: '#fff',
            color: '#212529',
            padding: '8px 16px 8px 14px',
            borderRadius: '20px',
            fontSize: '0.85rem',
            fontWeight: 500,
            boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
            cursor: 'pointer',
            zIndex: 1049,
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            border: '1px solid #e9ecef',
            transition: 'opacity 0.3s ease',
          }}
        >
          <i className="bi bi-chat-dots" style={{ color: '#0d6efd', fontSize: '1rem' }} />
          Te ayudamos a elegir
        </div>

        <style>{`
          .gio-chat-fab {
            animation: gio-fab-pulse 2.5s ease-in-out infinite;
          }
          @keyframes gio-fab-pulse {
            0% { box-shadow: 0 4px 20px rgba(13,110,253,0.4); }
            50% { box-shadow: 0 4px 28px rgba(13,110,253,0.55); }
            100% { box-shadow: 0 4px 20px rgba(13,110,253,0.4); }
          }
          @media (max-width: 768px) {
            .gio-chat-tooltip {
              display: none !important;
            }
            .gio-chat-fab {
              bottom: 85px !important;
              right: 18px !important;
              width: 48px !important;
              height: 48px !important;
            }
            .gio-chat-fab i {
              font-size: 1.25rem !important;
            }
          }
        `}</style>

        {showGeminiChat && (
          <GeminiChat 
            productos={productos} 
            onClose={() => setShowGeminiChat(false)} 
          />
        )}
      </section>
    </>
  );
};

export default Catalogo;

