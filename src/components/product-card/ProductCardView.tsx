// src/components/product-card/ProductCardView.tsx
import type React from "react";
import { Card } from "react-bootstrap";
import type { Product } from "../../types";
import type { DerivadosPricing } from "./useProductPricing";
import ProductBadges from "./ProductBadges";
import PriceDisplay from "./PriceDisplay";

interface ProductCardViewProps {
  producto: Product;
  isPopular?: boolean;
  der: DerivadosPricing;
  onVerDetalles: () => void;
}

const ProductCardView: React.FC<ProductCardViewProps> = ({ producto, isPopular = false, der, onVerDetalles }) => {
  const { nombre, imagen } = producto;

  return (
    <Card
      className="product-card h-100 shadow-sm position-relative"
      onClick={onVerDetalles}
      style={{
        cursor: "pointer",
        backgroundColor: 'var(--bg-secondary)',
        color: 'var(--text-primary)',
        border: `1px solid var(--border-color)`,
        ...(der.showPromoBadge
          ? {
            border: `2px solid ${der.highlightColor}`,
            boxShadow: `0 0 15px ${der.highlightColor}`
          }
          : {})
      }}
    >
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
      <Card.Img
        variant="top"
        src={imagen || "https://via.placeholder.com/300x300?text=Sin+imagen"}
        alt={nombre}
        className="product-card-img"
        loading="lazy"
      />
      <Card.Body className="text-center d-flex flex-column">
        <div>
          <div className="d-flex justify-content-between align-items-start mb-1">
            <Card.Title className="product-card-title mb-0" style={{ color: 'var(--text-primary)' }}>
              {nombre}
            </Card.Title>
          </div>

          <PriceDisplay variant="card" der={der} />
        </div>

        <button
          className="btn-ver-detalles"
          onClick={(e) => {
            e.stopPropagation();
            onVerDetalles();
          }}
          style={{
            marginTop: 'auto',
            background: 'var(--bg-hover)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            padding: '11px 20px',
            fontSize: '0.9rem',
            fontWeight: '600',
            cursor: 'pointer',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          <i className="bi bi-cart-plus"></i> Ver detalles
        </button>
      </Card.Body>
    </Card>
  );
};

export default ProductCardView;