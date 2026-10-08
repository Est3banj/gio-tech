import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import Fuse from "fuse.js";
import { useProducts } from "../hooks/useProducts";
import { normalizeText } from "../utils/formatters";
import ProductCard from "./ProductCard";
import { Row, Col } from "react-bootstrap";
import SearchAutocomplete from "./SearchAutocomplete";
import type { Product } from "../types";
import "./shop-page.css";

interface PriceRange {
  min: number;
  max: number;
}

const ShopPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { products: allProducts, isLoading } = useProducts();

  // URL-synced state
  const [searchQuery, setSearchQuery] = useState(searchParams.get("buscar") || "");
  const [selectedBrands, setSelectedBrands] = useState<string[]>(
    searchParams.get("marcas")?.split(",").filter(Boolean) || []
  );
  const [priceRange, setPriceRange] = useState<PriceRange>({
    min: Number(searchParams.get("precioMin")) || 0,
    max: Number(searchParams.get("precioMax")) || 0,
  });
  const [sortBy, setSortBy] = useState(
    searchParams.get("orden") || "default"
  );
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);

  // Price range bounds from products
  const priceBounds = useMemo(() => {
    const prices = allProducts
      .map((p) => parseFloat(String(p.contado ?? p.precio ?? 0)) || 0)
      .filter((p) => p > 0);
    return {
      min: prices.length ? Math.min(...prices) : 0,
      max: prices.length ? Math.max(...prices) : 10000000,
    };
  }, [allProducts]);

  // Initialize price range from bounds if not set
  useEffect(() => {
    if (priceRange.min === 0 && priceRange.max === 0 && priceBounds.max > 0) {
      setPriceRange({ min: priceBounds.min, max: priceBounds.max });
    }
  }, [priceBounds]);

  // Known brands (same as Catalogo)
  const KNOWN_BRAND_MAP: Record<string, { canonical: string; aliases: string[] }> = {
    apple: { canonical: "Apple", aliases: ["apple", "iphone", "ipad", "macbook", "airpods"] },
    samsung: { canonical: "Samsung", aliases: ["samsung", "galaxy"] },
    xiaomi: { canonical: "Xiaomi", aliases: ["xiaomi", "redmi", "poco", "mi"] },
    redmi: { canonical: "Redmi", aliases: ["redmi"] },
    poco: { canonical: "Poco", aliases: ["poco"] },
    motorola: { canonical: "Motorola", aliases: ["motorola", "moto"] },
    tecno: { canonical: "Tecno", aliases: ["tecno", "spark", "camon", "pova"] },
    infinix: { canonical: "Infinix", aliases: ["infinix", "hot", "zero", "smart", "note"] },
    honor: { canonical: "Honor", aliases: ["honor"] },
    huawei: { canonical: "Huawei", aliases: ["huawei"] },
    realme: { canonical: "Realme", aliases: ["realme"] },
    oppo: { canonical: "Oppo", aliases: ["oppo"] },
    vivo: { canonical: "Vivo", aliases: ["vivo"] },
    zte: { canonical: "ZTE", aliases: ["zte", "blade"] },
    google: { canonical: "Google", aliases: ["google", "pixel"] },
  };

  // Extract available brands from current products
  const availableBrands = useMemo(() => {
    const brandCounts: Record<string, number> = {};
    allProducts.forEach((p) => {
      const raw = p.marca?.trim();
      if (!raw) return;
      const lower = raw.toLowerCase();
      const canonical = KNOWN_BRAND_MAP[lower]?.canonical || raw.charAt(0).toUpperCase() + raw.slice(1);
      brandCounts[canonical] = (brandCounts[canonical] || 0) + 1;
    });
    return Object.entries(brandCounts)
      .map(([brand, count]) => ({ brand, count }))
      .sort((a, b) => a.brand.localeCompare(b.brand));
  }, [allProducts]);

  // Search with Fuse.js
  const fuse = useMemo(
    () =>
      new Fuse(allProducts, {
        keys: [
          { name: "nombre", weight: 0.4 },
          { name: "marca", weight: 0.3 },
          { name: "categoria", weight: 0.2 },
          { name: "descripcion", weight: 0.1 },
        ],
        threshold: 0.4,
        ignoreLocation: true,
        minMatchCharLength: 1,
      }),
    [allProducts]
  );

  // Filter pipeline
  const filteredProducts = useMemo(() => {
    let baseList: Product[] = allProducts;

    // Search query
    if (searchQuery.trim()) {
      baseList = fuse.search(searchQuery.trim()).map((r) => r.item);
    }

    // Brand filter
    if (selectedBrands.length > 0) {
      baseList = baseList.filter((producto) => {
        const brand = getProductBrand(producto);
        return selectedBrands.includes(brand);
      });
    }

    // Price filter
    baseList = baseList.filter((producto) => {
      const precio = parseFloat(String(producto.contado ?? producto.precio ?? 0)) || 0;
      const minOk = priceRange.min === 0 || precio >= priceRange.min;
      const maxOk = priceRange.max === 0 || precio <= priceRange.max;
      return minOk && maxOk;
    });

    // Sort
    return [...baseList].sort((a, b) => {
      const priceA = parseFloat(String(a.contado ?? a.precio ?? 0)) || 0;
      const priceB = parseFloat(String(b.contado ?? b.precio ?? 0)) || 0;
      switch (sortBy) {
        case "price_asc":
          return priceA - priceB;
        case "price_desc":
          return priceB - priceA;
        case "name_asc":
          return (a.nombre || "").localeCompare(b.nombre || "");
        case "name_desc":
          return (b.nombre || "").localeCompare(a.nombre || "");
        case "newest":
          return new Date(b.fechaCreacion || 0).getTime() - new Date(a.fechaCreacion || 0).getTime();
        default:
          return 0;
      }
    });
  }, [allProducts, searchQuery, selectedBrands, priceRange, sortBy]);

  // Sync URL with state (debounced)
  const syncUrl = useCallback(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("buscar", searchQuery);
    if (selectedBrands.length) params.set("marcas", selectedBrands.join(","));
    if (priceRange.min > 0) params.set("precioMin", String(priceRange.min));
    if (priceRange.max > 0) params.set("precioMax", String(priceRange.max));
    if (sortBy !== "default") params.set("orden", sortBy);
    navigate(`${location.pathname}?${params.toString()}`, { replace: true });
  }, [navigate, location.pathname]);

  // Debounced URL sync
  useEffect(() => {
    const timer = setTimeout(syncUrl, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedBrands, priceRange, sortBy, syncUrl]);

  // Brand helpers
  function getProductBrand(p: Product): string {
    const raw = p.marca?.trim();
    if (raw) {
      const lower = raw.toLowerCase();
      if (KNOWN_BRAND_MAP[lower]) return KNOWN_BRAND_MAP[lower].canonical;
      return raw.charAt(0).toUpperCase() + raw.slice(1);
    }
    const nombreNorm = normalizeText(p.nombre || "");
    for (const [, info] of Object.entries(KNOWN_BRAND_MAP)) {
      for (const alias of info.aliases) {
        const pattern = new RegExp(`(^|\\s)${alias}(\\s|$)`, "i");
        if (pattern.test(nombreNorm)) return info.canonical;
      }
    }
    return "";
  }

  // Handlers
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    syncUrl();
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const toggleBrand = (brand: string) => {
    setSelectedBrands((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
    );
  };

  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedBrands([]);
    setPriceRange({ min: 0, max: 0 });
    setSortBy("default");
  };

  const hasActiveFilters =
    searchQuery ||
    selectedBrands.length > 0 ||
    priceRange.min > 0 ||
    priceRange.max > 0 ||
    sortBy !== "default";

  const formatPrice = (val: number) => {
    if (!val || val >= 1000000) return val >= 1000000 ? `$${(val / 1000000).toFixed(1)}M` : "";
    return `$${(val / 1000).toFixed(0)}k`;
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("es-CO").format(num);
  };

  return (
    <div className="shop-page">
      {/* Mobile Filter Toggle */}
      <button
        className="shop-mobile-filter-toggle d-lg-none"
        onClick={() => setShowFiltersMobile(!showFiltersMobile)}
        aria-expanded={showFiltersMobile}
        aria-controls="shop-filters-sidebar"
        aria-label={showFiltersMobile ? "Cerrar filtros" : "Abrir filtros"}
      >
        <i className="bi bi-funnel" />
        <span>Filtros</span>
        {hasActiveFilters && <span className="filter-badge">{selectedBrands.length + (priceRange.min > 0 || priceRange.max > 0 ? 1 : 0) + (searchQuery ? 1 : 0)}</span>}
      </button>

      {/* Mobile Filter Overlay */}
      {showFiltersMobile && (
        <div
          className="shop-mobile-overlay"
          onClick={() => setShowFiltersMobile(false)}
          aria-hidden="true"
        />
      )}

      <div className="shop-layout">
        {/* ─── SIDEBAR FILTERS ─── */}
        <aside
          id="shop-filters-sidebar"
          className="shop-sidebar"
          aria-label="Filtros de productos"
          role="complementary"
        >
          <div className="sidebar-header d-flex align-items-center justify-content-between">
            <h2 className="sidebar-title mb-0">Filtros</h2>
            <button
              type="button"
              className="btn btn-link text-danger p-0 sidebar-close d-lg-none"
              onClick={() => setShowFiltersMobile(false)}
              aria-label="Cerrar filtros"
            >
              <i className="bi bi-x-lg" />
            </button>
          </div>

          <div className="sidebar-content">
            {/* Search */}
            <div className="sidebar-section">
              <SearchAutocomplete
                size="sm"
                value={searchQuery}
                onChange={setSearchQuery}
                onSearch={(query) => syncUrl()}
                placeholder="Buscar iPhone, Samsung, reparación..."
                maxProducts={4}
                maxCategories={3}
                showRecent={true}
                onSelect={(suggestion) => {
                  if (suggestion.href) {
                    if (suggestion.type === "product") {
                      window.location.href = suggestion.href;
                    } else {
                      window.location.href = suggestion.href;
                    }
                  }
                }}
                ariaLabel="Buscar productos en el catálogo"
                disabled={isLoading}
              />
            </div>

            {/* Categories/Brands */}
            {availableBrands.length > 0 && (
              <div className="sidebar-section">
                <div className="sidebar-section-header d-flex align-items-center justify-content-between">
                  <h3 className="sidebar-section-title mb-0">Marcas</h3>
                  {selectedBrands.length > 0 && (
                    <button
                      type="button"
                      className="btn btn-link text-danger text-decoration-none p-0 fs-sm"
                      onClick={() => setSelectedBrands([])}
                    >
                      Limpiar
                    </button>
                  )}
                </div>
                <div className="brand-list">
                  {availableBrands.map(({ brand, count }) => (
                    <label key={brand} className="brand-option">
                      <input
                        type="checkbox"
                        checked={selectedBrands.includes(brand)}
                        onChange={() => toggleBrand(brand)}
                        className="brand-checkbox"
                      />
                      <span className="brand-name">{brand}</span>
                      <span className="brand-count">({count})</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Price Range */}
            <div className="sidebar-section">
              <div className="sidebar-section-header d-flex align-items-center justify-content-between">
                <h3 className="sidebar-section-title mb-0">Rango de precio</h3>
                {(priceRange.min > 0 || priceRange.max > 0) && (
                  <button
                    type="button"
                    className="btn btn-link text-danger text-decoration-none p-0 fs-sm"
                    onClick={() => setPriceRange({ min: 0, max: 0 })}
                  >
                    Limpiar
                  </button>
                )}
              </div>
              <div className="price-range-display mb-2">
                <span className="price-min">{formatPrice(priceRange.min || priceBounds.min)}</span>
                <span className="price-separator">–</span>
                <span className="price-max">
                  {priceRange.max > 0 ? formatPrice(priceRange.max) : formatPrice(priceBounds.max)}
                </span>
              </div>
              <div className="price-slider-wrapper">
                <input
                  type="range"
                  className="form-range price-range-min"
                  min={priceBounds.min}
                  max={priceBounds.max}
                  step={10000}
                  value={priceRange.min || priceBounds.min}
                  onChange={(e) => setPriceRange({ min: Number(e.target.value), max: priceRange.max })}
                  aria-label="Precio mínimo"
                />
                <input
                  type="range"
                  className="form-range price-range-max"
                  min={priceBounds.min}
                  max={priceBounds.max}
                  step={10000}
                  value={priceRange.max || priceBounds.max}
                  onChange={(e) => setPriceRange({ min: priceRange.min, max: Number(e.target.value) })}
                  aria-label="Precio máximo"
                />
              </div>
              <div className="price-inputs d-flex gap-2 mt-2">
                <input
                  type="number"
                  className="form-control form-control-sm"
                  placeholder="Mín"
                  value={priceRange.min || ""}
                  onChange={(e) => setPriceRange({ min: Number(e.target.value) || 0, max: priceRange.max })}
                  min={priceBounds.min}
                  max={priceBounds.max}
                  step={10000}
                  style={{ width: "70px" }}
                />
                <input
                  type="number"
                  className="form-control form-control-sm"
                  placeholder="Máx"
                  value={priceRange.max || ""}
                  onChange={(e) => setPriceRange({ min: priceRange.min, max: Number(e.target.value) || 0 })}
                  min={priceBounds.min}
                  max={priceBounds.max}
                  step={10000}
                  style={{ width: "70px" }}
                />
              </div>
            </div>

            {/* Sort */}
            <div className="sidebar-section">
              <label htmlFor="shop-sort" className="sidebar-section-title">
                Ordenar
              </label>
              <select
                id="shop-sort"
                className="form-select form-select-sm"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="default">Destacados</option>
                <option value="price_asc">Precio: menor a mayor</option>
                <option value="price_desc">Precio: mayor a menor</option>
                <option value="name_asc">Nombre: A-Z</option>
                <option value="name_desc">Nombre: Z-A</option>
                <option value="newest">Más nuevos</option>
              </select>
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <div className="sidebar-section sidebar-clear">
                <button
                  type="button"
                  className="btn btn-outline-danger w-100"
                  onClick={clearAllFilters}
                >
                  <i className="bi bi-funnel me-2" />
                  Limpiar todos los filtros
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* ─── MAIN CONTENT ─── */}
        <main className="shop-main" role="main">
          {/* Toolbar */}
          <div className="shop-toolbar">
            <div className="toolbar-left">
              <div className="results-count">
                <strong>{filteredProducts.length}</strong> {filteredProducts.length === 1 ? "producto" : "productos"} encontrado{filteredProducts.length !== 1 ? "s" : ""}
              </div>
              {hasActiveFilters && (
                <span className="active-filters-badge">
                  <i className="bi bi-funnel-fill me-1" />
                  Filtros activos
                </span>
              )}
            </div>

            <div className="toolbar-right">
              <div className="view-toggle" role="group" aria-label="Vista">
                <button
                  type="button"
                  className={`btn btn-sm ${viewMode === "grid" ? "btn-primary" : "btn-outline-secondary"}`}
                  onClick={() => setViewMode("grid")}
                  aria-pressed={viewMode === "grid"}
                  aria-label="Vista en cuadrícula"
                >
                  <i className="bi bi-grid-3x3-gap" />
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${viewMode === "list" ? "btn-primary" : "btn-outline-secondary"}`}
                  onClick={() => setViewMode("list")}
                  aria-pressed={viewMode === "list"}
                  aria-label="Vista en lista"
                >
                  <i className="bi bi-list" />
                </button>
              </div>
            </div>
          </div>

          {/* Product Grid/List */}
          {isLoading ? (
            <div className="shop-loading">
              <div className="spinner-border text-danger" role="status">
                <span className="visually-hidden">Cargando...</span>
              </div>
              <p className="mt-3 text-muted fw-semibold">Cargando catálogo...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="shop-empty text-center py-5 px-3">
              <div className="empty-icon mb-3">
                <i className="bi bi-search display-1 text-muted" />
              </div>
              <h3 className="fw-bold mb-2">No se encontraron productos</h3>
              <p className="text-muted mb-4" style={{ maxWidth: "400px", margin: "0 auto" }}>
                No hay productos que coincidan con tus filtros. Probá ajustando tu búsqueda o
                <button className="btn btn-link text-danger p-0" onClick={clearAllFilters}>
                  limpiando los filtros
                </button>.
              </p>
              <button className="btn btn-primary px-4 py-2" onClick={clearAllFilters}>
                <i className="bi bi-arrow-counterclockwise me-2" />
                Ver todos los productos
              </button>
            </div>
          ) : (
            <>
              <div className="shop-products" role="list">
                {viewMode === "grid" ? (
                  <Row className="g-3 g-sm-3 g-md-4 g-lg-4 justify-content-start">
                    {filteredProducts.map((producto) => (
                      <Col key={producto.id} xs={12} sm={6} md={6} lg={4} xl={4} xxl={3} className="d-flex">
                        <ProductCard
                          producto={producto}
                        />
                      </Col>
                    ))}
                  </Row>
                ) : (
                  <div className="shop-list">
                    {filteredProducts.map((producto) => (
                      <div key={producto.id} className="shop-list-item" role="listitem">
                        <ProductCard
                          producto={producto}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Pagination placeholder */}
              <nav className="shop-pagination" aria-label="Paginación">
                <ul className="pagination justify-content-center">
                  <li className="page-item disabled">
                    <span className="page-link">Anterior</span>
                  </li>
                  <li className="page-item active">
                    <span className="page-link">1</span>
                  </li>
                  <li className="page-item">
                    <span className="page-link">2</span>
                  </li>
                  <li className="page-item">
                    <span className="page-link">3</span>
                  </li>
                  <li className="page-item">
                    <span className="page-link">Siguiente</span>
                  </li>
                </ul>
              </nav>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default ShopPage;