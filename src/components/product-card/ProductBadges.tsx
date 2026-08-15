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
        className="gio-badge"
        style={{
          backgroundColor: nuevoBadgeBg || '#28a745',
          color: '#ffffff'
        }}
      >
        {nuevoBadgeText || 'NUEVO'}
      </span>
    </div>

    <div className="gio-badge-wrapper" style={{ visibility: showPromoBadge ? 'visible' : 'hidden' }}>
      <span
        className="gio-badge"
        style={{
          backgroundColor: promoBadgeBg || badgeBg,
          color: '#ffffff',
        }}
      >
        {promoBadgeText || 'PROMO'}
      </span>
    </div>

    {isPopular && (
      <div className="gio-badge-wrapper">
        <span
          className="gio-badge"
          style={{
            backgroundColor: '#ff6b35',
            color: '#ffffff',
          }}
        >
          🔥 HOT
        </span>
      </div>
    )}
  </div>
);

export default ProductBadges;