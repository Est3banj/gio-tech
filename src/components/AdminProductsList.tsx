import { useState, useMemo } from "react";
import { Product } from "../types";
import { extractProductSpecs } from "../utils/specs-parser";
import { formatPrice } from "../utils/formatters";
import { updateProduct } from "../services/product.service";
import ProductImage from "./common/ProductImage";

interface AdminProductsListProps {
  productos: Product[];
  onEdit: (producto: Product) => void;
  onDelete: (id: string) => void;
  onAddNew?: () => void;
}

const BRANDS = [
  "Todas",
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
  "Todas",
  "Celulares",
  "Accesorios",
  "Audio",
  "Tablets",
  "Smartwatch",
  "Otros",
];

type StockFilterType = "all" | "in_stock" | "out_of_stock" | "promo" | "nuevo" | "destacado";

function AdminProductsList({
  productos,
  onEdit,
  onDelete,
  onAddNew,
}: AdminProductsListProps) {
  const [search, setSearch] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("Todas");
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const [stockFilter, setStockFilter] = useState<StockFilterType>("all");
  const [updatingStockId, setUpdatingStockId] = useState<string | null>(null);

  // Filter products
  const filteredProducts = useMemo(() => {
    return productos.filter((p) => {
      // Search text
      if (search.trim()) {
        const s = search.toLowerCase();
        const nom = (p.nombre || "").toLowerCase();
        const desc = (p.descripcion || "").toLowerCase();
        const marca = (p.marca || "").toLowerCase();
        const cat = (p.categoria || "").toLowerCase();
        if (
          !nom.includes(s) &&
          !desc.includes(s) &&
          !marca.includes(s) &&
          !cat.includes(s)
        ) {
          return false;
        }
      }

      // Brand filter
      if (selectedBrand !== "Todas") {
        const pMarca = (p.marca || "").toLowerCase();
        if (selectedBrand === "Otra") {
          const known = BRANDS.map((b) => b.toLowerCase());
          if (known.includes(pMarca)) return false;
        } else if (!pMarca.includes(selectedBrand.toLowerCase())) {
          return false;
        }
      }

      // Category filter
      if (selectedCategory !== "Todas") {
        const pCat = (p.categoria || "").toLowerCase();
        if (!pCat.includes(selectedCategory.toLowerCase())) {
          return false;
        }
      }

      // Stock / Status filter
      const isOut = p.stock !== undefined && p.stock !== null && p.stock <= 0;
      if (stockFilter === "in_stock" && isOut) return false;
      if (stockFilter === "out_of_stock" && !isOut) return false;
      if (stockFilter === "promo" && !p.promo) return false;
      if (stockFilter === "nuevo" && !p.nuevo) return false;
      if (stockFilter === "destacado" && !p.esDestacado) return false;

      return true;
    });
  }, [productos, search, selectedBrand, selectedCategory, stockFilter]);

  const handleToggleStock = async (producto: Product) => {
    const isCurrentlyOut =
      producto.stock !== undefined &&
      producto.stock !== null &&
      producto.stock <= 0;
    const newStock = isCurrentlyOut ? 10 : 0;
    const newEnStock = newStock > 0;
    setUpdatingStockId(producto.id);
    try {
      await updateProduct(producto.id, { stock: newStock, enStock: newEnStock });
    } catch (err) {
      console.error("Error toggling stock:", err);
    } finally {
      setUpdatingStockId(null);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setSelectedBrand("Todas");
    setSelectedCategory("Todas");
    setStockFilter("all");
  };

  const hasActiveFilters =
    search !== "" ||
    selectedBrand !== "Todas" ||
    selectedCategory !== "Todas" ||
    stockFilter !== "all";

  return (
    <div className="admin-products-container">
      {/* ─── Control Bar & Filters ───────────────────── */}
      <div className="admin-card-pro admin-controls-card mb-4">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-3">
          <div>
            <h2 className="admin-section-heading mb-1">Lista de Productos</h2>
            <p className="admin-section-sub mb-0">
              Explora, busca y administra el catálogo oficial de GIO TECH.
            </p>
          </div>
          {onAddNew && (
            <button
              type="button"
              className="btn btn-danger d-inline-flex align-items-center gap-2 px-3 py-2 fw-semibold"
              onClick={onAddNew}
            >
              <i className="bi bi-plus-lg" />
              <span>Nuevo Producto</span>
            </button>
          )}
        </div>

        <div className="row g-2 align-items-center">
          {/* Search Input */}
          <div className="col-12 col-md-4">
            <div className="admin-search-input-wrap">
              <i className="bi bi-search admin-search-icon" aria-hidden="true" />
              <input
                type="text"
                className="form-control admin-search-input"
                placeholder="Buscar por nombre, marca o modelo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Buscar productos"
              />
              {search && (
                <button
                  type="button"
                  className="admin-search-clear-btn"
                  onClick={() => setSearch("")}
                  aria-label="Limpiar búsqueda"
                >
                  <i className="bi bi-x-circle-fill" />
                </button>
              )}
            </div>
          </div>

          {/* Brand Filter */}
          <div className="col-6 col-md-2">
            <select
              className="form-select admin-filter-select"
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              aria-label="Filtrar por marca"
            >
              {BRANDS.map((b) => (
                <option key={b} value={b}>
                  {b === "Todas" ? "Marca: Todas" : b}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div className="col-6 col-md-2">
            <select
              className="form-select admin-filter-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              aria-label="Filtrar por categoría"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c === "Todas" ? "Categoría: Todas" : c}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="col-8 col-md-3">
            <select
              className="form-select admin-filter-select"
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value as StockFilterType)}
              aria-label="Filtrar por estado"
            >
              <option value="all">Estado: Todos</option>
              <option value="in_stock">En Stock</option>
              <option value="out_of_stock">Agotados</option>
              <option value="promo">En Promoción</option>
              <option value="nuevo">Nuevos</option>
              <option value="destacado">Destacados</option>
            </select>
          </div>

          {/* Reset Filters */}
          <div className="col-4 col-md-1 d-flex justify-content-end">
            <button
              type="button"
              className={`btn btn-sm ${
                hasActiveFilters ? "btn-outline-danger" : "btn-outline-secondary"
              } w-100 py-2`}
              onClick={clearFilters}
              disabled={!hasActiveFilters}
              title="Restablecer filtros"
            >
              <i className="bi bi-arrow-counterclockwise me-1" />
              <span className="d-none d-lg-inline">Limpiar</span>
            </button>
          </div>
        </div>

        {/* Results Counter Bar */}
        <div className="d-flex justify-content-between align-items-center mt-3 pt-2 border-top border-subtle text-muted fs-7">
          <span>
            Mostrando <strong>{filteredProducts.length}</strong> de{" "}
            <strong>{productos.length}</strong> productos
          </span>
          {hasActiveFilters && (
            <span className="badge bg-danger-subtle text-danger border border-danger-subtle">
              Filtros activos
            </span>
          )}
        </div>
      </div>

      {/* ─── Desktop Table View (>= 768px) ──────────── */}
      <div className="admin-card-pro p-0 overflow-hidden d-none d-md-block shadow-sm">
        <div className="table-responsive">
          <table className="table admin-pro-table mb-0 align-middle">
            <thead>
              <tr>
                <th style={{ width: "70px" }}>Foto</th>
                <th>Producto & Ficha</th>
                <th>Precios & Cuotas</th>
                <th style={{ width: "130px" }}>Stock</th>
                <th style={{ width: "130px" }}>Badges</th>
                <th style={{ width: "140px" }} className="text-end">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((producto) => {
                const specs = extractProductSpecs(producto);
                const isOut =
                  producto.stock !== undefined &&
                  producto.stock !== null &&
                  producto.stock <= 0;
                const isUpdatingThis = updatingStockId === producto.id;

                return (
                  <tr key={producto.id} className="admin-table-row">
                    {/* Thumbnail 48x48 */}
                    <td>
                      <div className="admin-product-thumb-box">
                        <ProductImage
                          src={producto.imagen}
                          alt={producto.nombre}
                          brand={producto.marca}
                          category={producto.categoria}
                          variant="thumb"
                          className="admin-product-thumb-img"
                        />
                      </div>
                    </td>

                    {/* Name & Specs */}
                    <td>
                      <div className="admin-product-info-cell">
                        <div className="d-flex align-items-center gap-2 mb-1">
                          <span className="admin-product-row-name">
                            {producto.nombre}
                          </span>
                          {producto.marca && (
                            <span className="badge admin-badge-brand">
                              {producto.marca}
                            </span>
                          )}
                          {producto.esDestacado && (
                            <span className="badge bg-warning text-dark d-inline-flex align-items-center gap-1">
                              <i className="bi bi-star-fill" aria-hidden="true" />
                              <span>Destacado</span>
                            </span>
                          )}
                        </div>

                        {/* Specs Pills */}
                        <div className="admin-row-specs-chips">
                          {specs.almacenamiento && (
                            <span className="admin-spec-pill">
                              <i className="bi bi-sd-card me-1" />
                              {specs.almacenamiento >= 1024
                                ? `${specs.almacenamiento / 1024}TB`
                                : `${specs.almacenamiento}GB`}
                            </span>
                          )}
                          {specs.ram && (
                            <span className="admin-spec-pill">
                              <i className="bi bi-memory me-1" />
                              {specs.ram}GB RAM
                            </span>
                          )}
                          {specs.camara && (
                            <span className="admin-spec-pill">
                              <i className="bi bi-camera me-1" />
                              {specs.camara}MP
                            </span>
                          )}
                          {specs.bateria && (
                            <span className="admin-spec-pill">
                              <i className="bi bi-battery-charging me-1" />
                              {specs.bateria}mAh
                            </span>
                          )}
                          {specs.pantalla && (
                            <span className="admin-spec-pill">
                              <i className="bi bi-phone me-1" />
                              {specs.pantalla}&quot;
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Prices */}
                    <td>
                      <div className="admin-product-price-cell">
                        <div className="admin-contado-price">
                          {formatPrice(producto.contado)}
                        </div>
                        <div className="admin-cuota-price text-muted">
                          {producto.solo12Meses && producto.cuotas12 ? (
                            <span>
                              12x {formatPrice(producto.cuotas12)}
                            </span>
                          ) : producto.cuotas6 ? (
                            <span>
                              16Q {formatPrice(producto.cuotas6)}
                              {producto.cuotas8 && (
                                <> &middot; 8M {formatPrice(producto.cuotas8)}</>
                              )}
                            </span>
                          ) : (
                            <span>Sin crédito</span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Stock Switch */}
                    <td>
                      <div className="form-check form-switch admin-stock-switch-wrap mb-0">
                        <input
                          className="form-check-input admin-stock-switch"
                          type="checkbox"
                          role="switch"
                          id={`stock-switch-${producto.id}`}
                          checked={!isOut}
                          disabled={isUpdatingThis}
                          onChange={() => handleToggleStock(producto)}
                        />
                        <label
                          className={`form-check-label admin-stock-label ${
                            !isOut ? "in-stock" : "out-of-stock"
                          }`}
                          htmlFor={`stock-switch-${producto.id}`}
                        >
                          {isUpdatingThis
                            ? "..."
                            : !isOut
                            ? "En stock"
                            : "Agotado"}
                        </label>
                      </div>
                    </td>

                    {/* Badges */}
                    <td>
                      <div className="d-flex flex-wrap gap-1">
                        {producto.promo && (
                          <span className="badge bg-danger">
                            {producto.promoBadgeText || "PROMO"}
                          </span>
                        )}
                        {producto.nuevo && (
                          <span className="badge bg-success">
                            {producto.nuevoBadgeText || "NUEVO"}
                          </span>
                        )}
                        {!producto.promo && !producto.nuevo && (
                          <span className="badge bg-secondary-subtle text-secondary">
                            Normal
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="text-end">
                      <div className="d-inline-flex gap-1">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary admin-action-btn"
                          onClick={() => onEdit(producto)}
                          title="Editar producto"
                          aria-label={`Editar ${producto.nombre}`}
                        >
                          <i className="bi bi-pencil-square" />
                          <span className="ms-1 d-none d-xl-inline">Editar</span>
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger admin-action-btn"
                          onClick={() => onDelete(producto.id)}
                          title="Eliminar producto"
                          aria-label={`Eliminar ${producto.nombre}`}
                        >
                          <i className="bi bi-trash3" />
                          <span className="ms-1 d-none d-xl-inline">Eliminar</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Mobile Touch Cards (< 768px) ────────────── */}
      <div className="d-md-none d-flex flex-column gap-3">
        {filteredProducts.map((producto) => {
          const specs = extractProductSpecs(producto);
          const isOut =
            producto.stock !== undefined &&
            producto.stock !== null &&
            producto.stock <= 0;
          const isUpdatingThis = updatingStockId === producto.id;

          return (
            <div key={producto.id} className="admin-card-pro admin-mobile-touch-card">
              <div className="d-flex gap-3 align-items-start mb-2">
                <div className="admin-product-thumb-box-mobile flex-shrink-0">
                  <ProductImage
                    src={producto.imagen}
                    alt={producto.nombre}
                    brand={producto.marca}
                    category={producto.categoria}
                    variant="thumb"
                    className="admin-product-thumb-img"
                  />
                </div>

                <div className="flex-grow-1 min-w-0">
                  <div className="d-flex align-items-center gap-1 mb-1 flex-wrap">
                    {producto.marca && (
                      <span className="badge admin-badge-brand">
                        {producto.marca}
                      </span>
                    )}
                    {producto.promo && (
                      <span className="badge bg-danger">PROMO</span>
                    )}
                    {producto.nuevo && (
                      <span className="badge bg-success">NUEVO</span>
                    )}
                    {producto.esDestacado && (
                      <span className="badge bg-warning text-dark d-inline-flex align-items-center gap-1" title="Producto Destacado">
                        <i className="bi bi-star-fill" aria-hidden="true" />
                      </span>
                    )}
                  </div>
                  <h4 className="admin-mobile-card-title mb-1">
                    {producto.nombre}
                  </h4>
                  <div className="admin-contado-price fs-6 text-danger fw-bold">
                    {formatPrice(producto.contado)}
                  </div>
                </div>
              </div>

              {/* Specs Pills */}
              <div className="admin-row-specs-chips mb-3">
                {specs.almacenamiento && (
                  <span className="admin-spec-pill">
                    {specs.almacenamiento >= 1024
                      ? `${specs.almacenamiento / 1024}TB`
                      : `${specs.almacenamiento}GB`}
                  </span>
                )}
                {specs.ram && (
                  <span className="admin-spec-pill">{specs.ram}GB RAM</span>
                )}
                {specs.bateria && (
                  <span className="admin-spec-pill">{specs.bateria}mAh</span>
                )}
                {specs.pantalla && (
                  <span className="admin-spec-pill">{specs.pantalla}&quot;</span>
                )}
              </div>

              {/* Stock Switch & Buttons */}
              <div className="d-flex justify-content-between align-items-center pt-2 border-top border-subtle">
                <div className="form-check form-switch mb-0">
                  <input
                    className="form-check-input admin-stock-switch"
                    type="checkbox"
                    role="switch"
                    id={`stock-switch-mob-${producto.id}`}
                    checked={!isOut}
                    disabled={isUpdatingThis}
                    onChange={() => handleToggleStock(producto)}
                  />
                  <label
                    className={`form-check-label admin-stock-label ${
                      !isOut ? "in-stock" : "out-of-stock"
                    }`}
                    htmlFor={`stock-switch-mob-${producto.id}`}
                  >
                    {!isOut ? "En stock" : "Agotado"}
                  </label>
                </div>

                <div className="d-flex gap-2">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary px-3"
                    onClick={() => onEdit(producto)}
                  >
                    <i className="bi bi-pencil-square me-1" /> Editar
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger px-3"
                    onClick={() => onDelete(producto.id)}
                  >
                    <i className="bi bi-trash3 me-1" /> Eliminar
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredProducts.length === 0 && (
        <div className="admin-card-pro text-center py-5">
          <div className="admin-empty-icon-wrap mb-3">
            <i className="bi bi-search text-muted fs-1" />
          </div>
          <h4 className="fw-bold mb-2">No se encontraron productos</h4>
          <p className="text-muted mb-4 max-w-md mx-auto">
            {hasActiveFilters
              ? "No hay productos que coincidan con los filtros y términos de búsqueda seleccionados."
              : "Aún no tienes productos registrados en el catálogo de GIO TECH."}
          </p>
          {hasActiveFilters ? (
            <button
              type="button"
              className="btn btn-outline-secondary px-4 py-2"
              onClick={clearFilters}
            >
              <i className="bi bi-arrow-counterclockwise me-2" />
              Restablecer filtros
            </button>
          ) : (
            onAddNew && (
              <button
                type="button"
                className="btn btn-danger px-4 py-2"
                onClick={onAddNew}
              >
                <i className="bi bi-plus-lg me-2" />
                Agregar Primer Producto
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}

export default AdminProductsList;