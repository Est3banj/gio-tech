import React, { useState, useEffect, useRef, useCallback } from "react";
import { BrandLogo } from "../BrandLogos";
import { probeVisuallyBlank, toDisplayUrl } from "./image-blank-detection";

export interface ProductImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> {
  src?: string | null;
  alt: string;
  brand?: string | null;
  category?: string | null;
  fallbackClassName?: string;
  variant?: "card" | "thumb" | "preview" | "banner";
  showBrandLogoInFallback?: boolean;
}

export const getCategoryIcon = (category?: string | null, nameOrAlt?: string | null): string => {
  const cat = (category || "").toLowerCase();
  const nom = (nameOrAlt || "").toLowerCase();
  const text = `${cat} ${nom}`;

  if (
    text.includes("laptop") ||
    text.includes("portatil") ||
    text.includes("portátil") ||
    text.includes("computador") ||
    text.includes("macbook")
  ) {
    return "bi-laptop";
  }
  if (text.includes("tablet") || text.includes("ipad") || text.includes("tab")) {
    return "bi-tablet";
  }
  if (text.includes("smartwatch") || text.includes("reloj") || text.includes("band")) {
    return "bi-smartwatch";
  }
  if (
    text.includes("audio") ||
    text.includes("audifono") ||
    text.includes("audífono") ||
    text.includes("auricular") ||
    text.includes("airpod") ||
    text.includes("buds") ||
    text.includes("parlante") ||
    text.includes("sound")
  ) {
    return "bi-headphones";
  }
  if (
    text.includes("accesorio") ||
    text.includes("cargador") ||
    text.includes("cable") ||
    text.includes("funda") ||
    text.includes("estuche")
  ) {
    return "bi-box-seam";
  }
  if (
    text.includes("tecnico") ||
    text.includes("técnico") ||
    text.includes("reparacion") ||
    text.includes("reparación") ||
    text.includes("pantalla")
  ) {
    return "bi-tools";
  }
  return "bi-phone";
};

export const ProductImage: React.FC<ProductImageProps> = ({
  src,
  alt,
  brand,
  category,
  className = "",
  fallbackClassName = "",
  variant = "card",
  showBrandLogoInFallback = true,
  loading = "lazy",
  decoding = "async",
  style,
  ...restProps
}) => {
  const cleanSrc = typeof src === "string" ? src.trim() : "";
  // Blobs de GitHub se sirven directo desde raw.githubusercontent (sin la
  // cadena blob → github.com/raw → raw.githubusercontent). Hosts ajenos
  // quedan intactos. El probe comparte esta misma normalización.
  const displaySrc = toDisplayUrl(cleanSrc);
  const [hasError, setHasError] = useState(!cleanSrc);
  const [isLoaded, setIsLoaded] = useState(false);

  // Reset error state if src changes
  useEffect(() => {
    setHasError(!cleanSrc);
    setIsLoaded(false);
  }, [cleanSrc]);

  // Guardas contra resoluciones tardías del probe de "imagen vacía":
  // solo concluye si el src vigente sigue siendo el evaluado y el
  // componente sigue montado.
  const cleanSrcRef = useRef(cleanSrc);
  cleanSrcRef.current = cleanSrc;
  const mountedRef = useRef(true);
  const probedSrcRef = useRef<string | null>(null);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    if (!cleanSrc || probedSrcRef.current === cleanSrc) return;
    probedSrcRef.current = cleanSrc;
    void probeVisuallyBlank(cleanSrc).then((blank) => {
      if (blank && mountedRef.current && cleanSrcRef.current === cleanSrc) {
        setHasError(true);
      }
    });
  }, [cleanSrc]);

  const categoryIcon = getCategoryIcon(category, alt);
  const normalizedBrand = (brand || "").trim();

  // If thumbnail variant (e.g. cart drawer, admin table)
  if (variant === "thumb") {
    if (!cleanSrc || hasError) {
      return (
        <div
          className={`product-thumb-fallback ${fallbackClassName}`}
          data-testid="product-image-fallback-thumb"
          role="img"
          aria-label={alt || "Miniatura no disponible"}
          style={style}
        >
          <i className={`bi ${categoryIcon}`} aria-hidden="true" />
        </div>
      );
    }

    return (
      <img
        src={displaySrc}
        alt={alt}
        className={`product-thumb-img ${isLoaded ? "product-image-loaded" : "product-image-loading"} ${className}`}
        loading={loading}
        decoding={decoding}
        onLoad={handleLoad}
        onError={() => setHasError(true)}
        style={style}
        {...restProps}
      />
    );
  }

  // Fallback for card / preview
  if (!cleanSrc || hasError) {
    return (
      <div
        className={`product-image-fallback product-image-fallback-${variant} ${fallbackClassName}`}
        data-testid="product-image-fallback"
        role="img"
        aria-label={alt || "Imagen del producto no disponible"}
      >
        <div className="product-image-fallback-glass">
          {showBrandLogoInFallback && normalizedBrand && (
            <div className="product-image-fallback-brand" data-testid="fallback-brand-wrapper">
              <BrandLogo
                brand={normalizedBrand}
                className="product-image-fallback-brand-icon"
                data-testid="product-fallback-brand-logo"
              />
            </div>
          )}
          <i
            className={`bi ${categoryIcon} product-image-fallback-icon`}
            aria-hidden="true"
            data-testid="product-fallback-category-icon"
          />
          <span className="product-image-fallback-text">
            {normalizedBrand || "GIO TECH"}
          </span>
        </div>
      </div>
    );
  }

  return (
    <img
      src={displaySrc}
      alt={alt}
      className={`${className} ${isLoaded ? "product-image-loaded" : "product-image-loading"}`}
      loading={loading}
      decoding={decoding}
      onLoad={handleLoad}
      onError={() => setHasError(true)}
      style={style}
      {...restProps}
    />
  );
};

export default ProductImage;
