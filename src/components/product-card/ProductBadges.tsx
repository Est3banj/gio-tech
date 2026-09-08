// src/components/product-card/ProductBadges.tsx
import type React from "react";

interface ProductBadgesProps {
  showNuevoBadge: boolean;
  showPromoBadge: boolean;
  isPopular?: boolean;
  nuevoBadgeText?: string | null;
  nuevoBadgeBg?: string | null;
  promoBadgeText?: string | null;
  promoBadgeBg?: string | null;
  badgeBg: string;
}

const ProductBadges: React.FC<ProductBadgesProps> = ({
  showNuevoBadge,
  showPromoBadge,
  isPopular = false,
  nuevoBadgeText,
  nuevoBadgeBg,
  promoBadgeText,
  promoBadgeBg,
  badgeBg,
}) => (
  <div className="gio-badge-container" aria-hidden={!showPromoBadge && !showNuevoBadge}>
    <div className="gio-badge-wrapper" style={{ visibility: showNuevoBadge ? 'visible' : 'hidden' }}>
      <span
        className="gio-badge gio-badge-nuevo"
        style={{
          backgroundColor: nuevoBadgeBg || '#16a34a',
          color: '#ffffff'
        }}
      >
        <i className="bi bi-sparkles me-1"></i>
        {nuevoBadgeText || 'NUEVO'}
      </span>
    </div>

    <div className="gio-badge-wrapper" style={{ visibility: showPromoBadge ? 'visible' : 'hidden' }}>
      <span
        className="gio-badge gio-badge-promo"
        style={{
          backgroundColor: promoBadgeBg || badgeBg,
          color: '#ffffff',
        }}
      >
        <i className="bi bi-tag-fill me-1"></i>
        {promoBadgeText || 'PROMO'}
      </span>
    </div>

    {isPopular && (
      <div className="gio-badge-wrapper">
        <span
          className="gio-badge gio-badge-hot"
          style={{
            backgroundColor: '#e11d48',
            color: '#ffffff',
          }}
        >
          <i className="bi bi-fire me-1"></i>
          HOT
        </span>
      </div>
    )}
  </div>
);

export default ProductBadges;