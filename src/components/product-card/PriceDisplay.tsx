// src/components/product-card/PriceDisplay.tsx
import type React from "react";
import { Card } from "react-bootstrap";
import type { DerivadosPricing } from "./useProductPricing";

interface PriceDisplayProps {
  variant: 'card' | 'modal';
  der: DerivadosPricing;
}

const PriceDisplay: React.FC<PriceDisplayProps> = ({ variant, der }) => {
  const {
    showPromoPrice,
    priceRegularStr,
    pricePromoStr,
    promoBadgeText,
    promoBadgeBg,
    badgeBg,
  } = der;

  if (variant === 'card') {
    return showPromoPrice ? (
      <>
        <Card.Text className="text-muted mb-0"><del>{priceRegularStr}</del></Card.Text>
        <Card.Text className="product-card-price fw-bold fs-5 mb-0" style={{ color: 'var(--gio-red)' }}>
          {pricePromoStr}
        </Card.Text>
      </>
    ) : (
      <Card.Text className="product-card-price fw-bold fs-5 mb-0" style={{ color: 'var(--brand-blue)' }}>
        {priceRegularStr}
      </Card.Text>
    );
  }

  return showPromoPrice ? (
    <>
      <p className="mb-2"><strong>Precio regular:</strong> <del>{priceRegularStr}</del></p>
      <p className="mb-3"><strong>Precio promocional:</strong> <span style={{ color: 'var(--gio-red)', fontSize: '1.15em' }}>{pricePromoStr}</span> {promoBadgeText ? <span className="badge ms-2" style={{ backgroundColor: promoBadgeBg || badgeBg, color: '#fff' }}>{promoBadgeText}</span> : null}</p>
    </>
  ) : (
    <p className="mb-3"><strong>Precio contado:</strong> <span style={{ color: 'var(--gio-red)', fontSize: '1.15em' }}>{priceRegularStr}</span></p>
  );
};

export default PriceDisplay;