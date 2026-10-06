import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import Fuse from "fuse.js";
import { useProducts } from "../hooks/useProducts";
import { normalizeText } from "../utils/formatters";
import ProductImage from "./common/ProductImage";
import { getProductBrand } from "../components/Catalogo";
import type { Product } from "../types";
import "./search-autocomplete.css";

interface SearchAutocompleteProps {
  /** Controlled input value */
  value?: string;
  /** Called when input value changes */
  onChange?: (value: string) => void;
  /** Initial search value (uncontrolled) */
  initialValue?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Custom className for input wrapper */
  className?: string;
  /** Maximum number of product suggestions */
  maxProducts?: number;
  /** Maximum number of category suggestions */
  maxCategories?: number;
  /** Show recent searches */
  showRecent?: boolean;
  /** Called when a suggestion is selected */
  onSelect?: (suggestion: SearchSuggestion) => void;
  /** Called when user submits search (Enter) */
  onSearch?: (query: string) => void;
  /** Input ref for external control */
  inputRef?: React.RefObject<HTMLInputElement>;
  /** Auto focus on mount */
  autoFocus?: boolean;
  /** Input size */
  size?: "sm" | "md" | "lg";
  /** Disable autocomplete */
  disabled?: boolean;
  /** Custom aria-label */
  ariaLabel?: string;
}

export interface SearchSuggestion {
  type: "product" | "category" | "recent";
  id: string;
  label: string;
  sublabel?: string;
  image?: string;
  brand?: string;
  price?: string;
  originalPrice?: string;
  href?: string;
  icon?: string;
  data?: Product;
}

const RECENT_SEARCHES_KEY = "gio-tech-recent-searches";
const MAX_RECENT = 5;

const CATEGORIES = [
  { id: "smartphones", label: "Smartphones", icon: "bi-phone", count: 0 },
  { id: "accesorios", label: "Accesorios", icon: "bi-box-seam", count: 0 },
  { id: "reparacion", label: "Reparación", icon: "bi-tools", count: 0 },
  { id: "tablets", label: "Tablets", icon: "bi-tablet", count: 0 },
  { id: "audio", label: "Audio", icon: "bi-headphones", count: 0 },
  { id: "smartwatch", label: "Smartwatches", icon: "bi-smartwatch", count: 0 },
];

const SearchAutocomplete: React.FC<SearchAutocompleteProps> = ({
  value,
  onChange,
  initialValue = "",
  placeholder = "Buscar productos, marcas, reparaciones...",
  className = "",
  maxProducts = 5,
  maxCategories = 4,
  showRecent = true,
  onSelect,
  onSearch,
  inputRef,
  autoFocus = false,
  size = "md",
  disabled = false,
  ariaLabel = "Buscar productos",
} = {}) => {
  const isControlled = value !== undefined;
  const [internalQuery, setInternalQuery] = useState(initialValue);
  const query = isControlled ? value : internalQuery;
  const setQuery = isControlled ? onChange : setInternalQuery;
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRefInternal = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { products, isLoading } = useProducts();

  // Refs
  const mergedInputRef = inputRef || inputRefInternal;

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        setRecentSearches(JSON.parse(stored).slice(0, MAX_RECENT));
      }
    } catch {
      setRecentSearches([]);
    }
  }, []);

  // Save recent search
  const saveRecentSearch = useCallback((term: string) => {
    const trimmed = term.trim();
    if (!trimmed || trimmed.length < 2) return;
    setRecentSearches((prev) => {
      const filtered = prev.filter((s) => s.toLowerCase() !== trimmed.toLowerCase());
      const updated = [trimmed, ...filtered].slice(0, MAX_RECENT);
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  // Fuse.js instances
  const productFuse = useMemo(
    () =>
      new Fuse(
        products.filter((p) => p.nombre),
        {
          keys: [
            { name: "nombre", weight: 0.5 },
            { name: "marca", weight: 0.3 },
            { name: "categoria", weight: 0.15 },
            { name: "descripcion", weight: 0.05 },
          ],
          threshold: 0.35,
          ignoreLocation: true,
          minMatchCharLength: 1,
          includeScore: true,
        }
      ),
    [products]
  );

  const categoryFuse = useMemo(
    () =>
      new Fuse(CATEGORIES, {
        keys: ["label"],
        threshold: 0.4,
        ignoreLocation: true,
      }),
    []
  );

  // Productos destacados para "acceso rápido" cuando el buscador está vacío
  const quickAccessProducts = useMemo((): Product[] => {
    const featured = products.filter((p) => p.esDestacado);
    return (featured.length ? featured : products).slice(0, maxProducts);
  }, [products, maxProducts]);

  // Compute suggestions
  const suggestions = useMemo((): SearchSuggestion[] => {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 1) {
      // Estado vacío: acceso rápido (productos destacados) + recientes + categorías
      const result: SearchSuggestion[] = [];
      if (quickAccessProducts.length > 0) {
        result.push(
          ...quickAccessProducts.map((p) => ({
            type: "product" as const,
            id: `quick-${p.id}`,
            label: p.nombre,
            sublabel: p.marca,
            image: p.imagen,
            brand: p.marca,
            price: p.contado ? `$${Number(p.contado).toLocaleString("es-CO")}` : undefined,
            originalPrice:
              p.precio && p.precio !== p.contado
                ? `$${Number(p.precio).toLocaleString("es-CO")}`
                : undefined,
            href: `/producto/${p.id}`,
            data: p,
          }))
        );
      }
      if (showRecent && recentSearches.length > 0) {
        result.push(
          ...recentSearches.slice(0, 3).map((term) => ({
            type: "recent" as const,
            id: `recent-${term}`,
            label: term,
            icon: "bi-clock-history",
            href: `/catalogo?buscar=${encodeURIComponent(term)}`,
          }))
        );
      }
      result.push(
        ...CATEGORIES.slice(0, maxCategories).map((cat) => ({
          type: "category" as const,
          id: `cat-${cat.id}`,
          label: cat.label,
          icon: cat.icon,
          href: `/catalogo?categoria=${cat.id}`,
        }))
      );
      return result;
    }

    const all: SearchSuggestion[] = [];

    // Category matches
    const catResults = categoryFuse.search(trimmed);
    catResults.slice(0, maxCategories).forEach((r) => {
      all.push({
        type: "category",
        id: `cat-${r.item.id}`,
        label: r.item.label,
        icon: r.item.icon,
        href: `/catalogo?categoria=${r.item.id}`,
      });
    });

    // Product matches
    const prodResults = productFuse.search(trimmed);
    prodResults.slice(0, maxProducts).forEach((r) => {
      const p = r.item;
      all.push({
        type: "product",
        id: `prod-${p.id}`,
        label: p.nombre,
        sublabel: p.marca,
        image: p.imagen,
        brand: p.marca,
        price: p.contado ? `$${Number(p.contado).toLocaleString("es-CO")}` : undefined,
        originalPrice: p.precio && p.precio !== p.contado ? `$${Number(p.precio).toLocaleString("es-CO")}` : undefined,
        href: `/producto/${p.id}`,
        data: p,
      });
    });

    return all;
  }, [query, products, quickAccessProducts, recentSearches, maxProducts, maxCategories, showRecent]);

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    onChange?.(value);
    if (!isOpen && value.trim()) setIsOpen(true);
  };

  // Handle focus — siempre abre para mostrar acceso rápido + categorías
  const handleFocus = () => {
    setIsOpen(true);
  };

  // Handle blur (delayed to allow clicks)
  const handleBlur = () => {
    setTimeout(() => setIsOpen(false), 200);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const maxIndex = suggestions.length - 1;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev < maxIndex ? prev + 1 : 0));
        if (!isOpen) setIsOpen(true);
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : maxIndex));
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
          selectSuggestion(suggestions[highlightedIndex]);
        } else if (query.trim()) {
          onSearch?.(query.trim());
          saveRecentSearch(query.trim());
          setIsOpen(false);
        }
        break;
      case "Escape":
        setIsOpen(false);
        mergedInputRef?.current?.blur();
        break;
      case "Tab":
        if (highlightedIndex >= 0) {
          e.preventDefault();
          selectSuggestion(suggestions[highlightedIndex]);
        }
        break;
    }
  };

  const selectSuggestion = (suggestion: SearchSuggestion) => {
    if (onSelect) {
      onSelect(suggestion);
    } else if (suggestion.href) {
      if (suggestion.type === "product") {
        navigate(suggestion.href);
      } else {
        window.location.href = suggestion.href;
      }
    }
    if (suggestion.type !== "category" && query.trim()) {
      saveRecentSearch(query.trim());
    }
    setQuery("");
    setIsOpen(false);
    mergedInputRef?.current?.blur();
  };

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Clear highlighted index when query changes
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [query]);

  // Auto focus
  useEffect(() => {
    if (autoFocus && mergedInputRef.current) {
      mergedInputRef.current.focus();
    }
  }, [autoFocus]);

  // Size classes
  const sizeClasses = {
    sm: "search-autocomplete-sm",
    md: "",
    lg: "search-autocomplete-lg",
  };

  const inputSizeClasses = {
    sm: "form-control-sm",
    md: "",
    lg: "form-control-lg",
  };

  if (disabled) {
    return (
      <div className={`search-autocomplete ${className}`} ref={wrapperRef}>
        <input
          ref={mergedInputRef}
          type="text"
          className={`form-control ${inputSizeClasses[size]}`}
          placeholder={placeholder}
          value={query}
          onChange={handleChange}
          disabled
          aria-label={ariaLabel}
        />
      </div>
    );
  }

  return (
    <div
      ref={wrapperRef}
      className={`search-autocomplete ${className} ${sizeClasses[size]} ${isOpen ? "open" : ""}`}
    >
      <div className="search-autocomplete-input-wrapper">
        <span className="search-autocomplete-icon" aria-hidden="true">
          <i className="bi bi-search" />
        </span>
        <input
          ref={mergedInputRef}
          type="text"
          className={`form-control ${inputSizeClasses[size]} search-autocomplete-input`}
          placeholder={placeholder}
          value={query}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          spellCheck={false}
          autoFocus={autoFocus}
          aria-label={ariaLabel}
          aria-autocomplete="list"
          aria-controls="search-autocomplete-results"
          aria-expanded={isOpen}
          aria-activedescendant={highlightedIndex >= 0 ? `search-suggestion-${highlightedIndex}` : undefined}
        />
        {query && (
          <button
            type="button"
            className="search-autocomplete-clear"
            onClick={() => {
              setQuery("");
              setHighlightedIndex(-1);
              mergedInputRef.current?.focus();
            }}
            aria-label="Limpiar búsqueda"
          >
            <i className="bi bi-x-lg" />
          </button>
        )}
      </div>

      {isOpen && (
        <div
          id="search-autocomplete-results"
          className="search-autocomplete-results"
          role="listbox"
          aria-label="Sugerencias de búsqueda"
        >
          {suggestions.length > 0 ? (
            <>
              {!query.trim() && quickAccessProducts.length > 0 && (
                <div className="search-section-header">Acceso rápido</div>
              )}
              {suggestions.map((suggestion, idx) => (
                <button
                  key={suggestion.id}
                  id={`search-suggestion-${idx}`}
                  className={`search-suggestion ${suggestion.type} ${highlightedIndex === idx ? "highlighted" : ""}`}
                  type="button"
                  role="option"
                  aria-selected={highlightedIndex === idx}
                  onClick={() => selectSuggestion(suggestion)}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                >
                  {suggestion.type === "product" && (
                    <>
                      {suggestion.image && (
                        <ProductImage
                          src={suggestion.image}
                          alt=""
                          brand={suggestion.brand}
                          variant="thumb"
                          className="suggestion-image"
                        />
                      )}
                      <div className="suggestion-content">
                        <span className="suggestion-label">{suggestion.label}</span>
                        {suggestion.sublabel && (
                          <span className="suggestion-sublabel">{suggestion.sublabel}</span>
                        )}
                        {suggestion.price && (
                          <span className="suggestion-price">
                            {suggestion.price}
                            {suggestion.originalPrice && (
                              <span className="suggestion-original-price">{suggestion.originalPrice}</span>
                            )}
                          </span>
                        )}
                      </div>
                      <span className="suggestion-badge product">Producto</span>
                    </>
                  )}

                  {suggestion.type === "category" && (
                    <>
                      {suggestion.icon && (
                        <i className={`bi ${suggestion.icon} suggestion-category-icon`} aria-hidden="true" />
                      )}
                      <span className="suggestion-label">{suggestion.label}</span>
                      <span className="suggestion-badge category">Categoría</span>
                    </>
                  )}

                  {suggestion.type === "recent" && (
                    <>
                      {suggestion.icon && (
                        <i className={`bi ${suggestion.icon} suggestion-recent-icon`} aria-hidden="true" />
                      )}
                      <span className="suggestion-label">{suggestion.label}</span>
                      <span className="suggestion-badge recent">Reciente</span>
                    </>
                  )}
                </button>
              ))}
            </>
          ) : (
            <div className="search-suggestion-empty">
              {query.trim() ? (
                <>
                  <i className="bi bi-search" aria-hidden="true" />
                  <span>No se encontraron resultados para "{query}"</span>
                  <button
                    type="button"
                    className="btn btn-link p-0 mt-2"
                    onClick={() => navigate(`/catalogo?buscar=${encodeURIComponent(query.trim())}`)}
                  >
                    Ver todo el catálogo <i className="bi bi-arrow-right ms-1" />
                  </button>
                </>
              ) : (
                <>
                  <i className="bi bi-search" aria-hidden="true" />
                  <span>Escribe para buscar productos, marcas o categorías</span>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchAutocomplete;