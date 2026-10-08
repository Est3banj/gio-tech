import React, { useState, useMemo } from "react";
import type { Product, ProductSpecs } from "../../types";
import type { DerivadosPricing } from "./useProductPricing";
import ProductBadges from "./ProductBadges";
import PriceDisplay from "./PriceDisplay";
import ProductImage from "../common/ProductImage";
import { extractProductSpecs } from "../../utils/specs-parser";
import { getProductType } from "../../data/financieras";

interface ProductCardViewProps {
  producto: Product;
  isPopular?: boolean;
  der: DerivadosPricing;
  onVerDetalles: () => void;
}

const ProductCardView: React.FC<ProductCardViewProps> = ({ producto, isPopular = false, der, onVerDetalles }) => {
  const { nombre, imagen, marca } = producto;
  const [copied, setCopied] = useState(false);

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const shareUrl = `${origin}/producto/${producto.id}`;
    const shareData = {
      title: `${nombre} | GIO TECH`,
      text: `Mira el ${nombre} en GIO TECH Putumayo:`,
      url: shareUrl,
    };

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
      }
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        window.prompt('Copia este enlace para compartir:', shareUrl);
      }
    }
  };

  const isAccesorio = useMemo(() => {
    const cat = (producto.categoria || '').toLowerCase();
    if (cat.includes('accesorio') || cat.includes('accessory')) return true;
    return getProductType(producto.marca, producto.nombre, producto.categoria) === 'accesorio';
  }, [producto.marca, producto.nombre, producto.categoria]);

  const specs = useMemo(() => {
    if (isAccesorio) {
      return {
        almacenamiento: null,
        ram: null,
        camara: null,
        pantalla: null,
        bateria: null,
      };
    }
    return extractProductSpecs(producto);
  }, [producto, isAccesorio]);

  const hasAnySpec = Boolean(
    !isAccesorio && (specs.almacenamiento || specs.ram || specs.camara || specs.pantalla || specs.bateria)
  );

  return (
    <div
      className="product-card gio-product-card-v2 h-100 position-relative w-100"
      onClick={onVerDetalles}
      role="article"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onVerDetalles();
        }
      }}
      style={{
        ...(der.showPromoBadge
          ? {
            borderColor: der.highlightColor || 'var(--gio-red)',
            boxShadow: `0 0 20px rgba(200, 16, 46, 0.15)`
          }
          : {})
      }}
    >
      <div className="product-card-share-wrap">
        <button
          type="button"
          className="btn-product-share"
          onClick={handleShare}
          title="Compartir producto"
          aria-label={`Compartir ${nombre}`}
        >
          <i className={copied ? "bi bi-check2 text-success" : "bi bi-share"} aria-hidden="true" />
        </button>
        {copied && <span className="share-feedback-toast">¡Enlace copiado!</span>}
      </div>

      <ProductBadges
        showNuevoBadge={der.showNuevoBadge}
        showPromoBadge={der.showPromoBadge}
        isPopular={isPopular}
        nuevoBadgeText={der.nuevoBadgeText}
        nuevoBadgeBg={der.nuevoBadgeBg}
        promoBadgeText={der.promoBadgeText}
        promoBadgeBg={der.promoBadgeBg}
        badgeBg={der.badgeBg}
      />

      {/* ─── Image Stage con Halo Radial y Hover Zoom fluido ─── */}
      <div className="product-image-stage product-image-container">
        <div className="product-image-halo" aria-hidden="true"></div>
        <ProductImage
          src={imagen}
          alt={nombre}
          brand={marca}
          category={producto.categoria}
          className="product-card-img product-image"
          variant="card"
          loading="lazy"
          decoding="async"
        />
      </div>

      <div className="product-card-content product-card-body">
        <div className="product-card-header">
          {marca && <span className="product-brand-tag">{marca}</span>}
          <h3 className="product-card-title product-title">{nombre}</h3>
        </div>

        {/* ─── Chips de Specs Minimalistas con Micro-Iconos Vectoriales ─── */}
        <div className="product-specs-rail">
          {!isAccesorio && specs.almacenamiento && (
            <span className="spec-chip" title="Almacenamiento">
              <i className="bi bi-sd-card" aria-hidden="true"></i>
              <span>{specs.almacenamiento >= 1024 ? `${specs.almacenamiento / 1024}TB` : `${specs.almacenamiento}GB`}</span>
            </span>
          )}
          {!isAccesorio && specs.ram && (
            <span className="spec-chip" title="Memoria RAM">
              <i className="bi bi-memory" aria-hidden="true"></i>
              <span>{specs.ram}GB RAM</span>
            </span>
          )}
          {!isAccesorio && specs.camara && (
            <span className="spec-chip" title="Cámara">
              <i className="bi bi-camera" aria-hidden="true"></i>
              <span>{specs.camara}MP</span>
            </span>
          )}
          {!isAccesorio && specs.bateria && (
            <span className="spec-chip" title="Batería">
              <i className="bi bi-battery-charging" aria-hidden="true"></i>
              <span>{specs.bateria}mAh</span>
            </span>
          )}
          {!isAccesorio && specs.pantalla && (
            <span className="spec-chip" title="Pantalla">
              <i className="bi bi-phone" aria-hidden="true"></i>
              <span>{specs.pantalla}&quot;</span>
            </span>
          )}
          {(!hasAnySpec || isAccesorio) && (
            <span className="spec-chip spec-chip-default">
              <i className="bi bi-shield-check" aria-hidden="true"></i>
              <span>Garantía Oficial</span>
            </span>
          )}
        </div>

        {/* ─── Arquitectura de Precios Dual-Tier ─── */}
        <div className="product-card-pricing-wrapper price-display-container">
          <PriceDisplay variant="card" der={der} />
        </div>

        {/* ─── Pro CTA Button ─── */}
        <button
          className="btn-card-action-pro product-cta-btn"
          onClick={(e) => {
            e.stopPropagation();
            onVerDetalles();
          }}
          type="button"
          aria-label={`Ver detalles de ${nombre}`}
        >
          <span>Ver detalles</span>
          <i className="bi bi-arrow-right-short" aria-hidden="true"></i>
        </button>
      </div>
    </div>
  );
};

export default ProductCardView;