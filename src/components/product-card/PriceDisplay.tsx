// src/components/product-card/PriceDisplay.tsx
import type React from "react";
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
    const hasFixedCuota = der.mostrarPlanCuotas;
    const cuotaInfo = !hasFixedCuota
      ? null
      : der.solo12Meses && der.cuotas12Str && der.cuotas12Str !== '—'
      ? { num: '12', freq: '/mes', val: der.cuotas12Str }
      : der.cuotas6Str && der.cuotas6Str !== '—'
      ? { num: '16', freq: '/qna', val: der.cuotas6Str }
      : der.cuotas8Str && der.cuotas8Str !== '—'
      ? { num: '8', freq: '/mes', val: der.cuotas8Str }
      : null;

    return (
      <div className={`product-card-pricing-dual${!der.tieneFinanciacion ? ' pricing-single-tier' : ''}`}>
        <div className={`pricing-tier-box${!der.tieneFinanciacion ? ' single-tier' : ''}`}>
          <div className="pricing-tier contado-tier">
            <span className="pricing-tier-tag">
              <i className="bi bi-cash-stack me-1"></i> Contado
            </span>
            <div className="pricing-tier-values">
              {showPromoPrice ? (
                <>
                  <del className="product-card-old-price">{priceRegularStr}</del>
                  <span className="product-card-price product-card-price-promo">
                    {pricePromoStr}
                  </span>
                </>
              ) : (
                <span className="product-card-price">
                  {priceRegularStr}
                </span>
              )}
            </div>
          </div>

          {der.tieneFinanciacion && (
            <div className="pricing-tier credito-tier">
              <span className="pricing-tier-tag">
                <i className="bi bi-credit-card-2-front me-1"></i> Crédito
              </span>
              <div className={`cuota-highlight${!cuotaInfo ? ' cuota-highlight-badge' : ''}`}>
                {cuotaInfo ? (
                  <>
                    <span className="cuota-term">{cuotaInfo.num} cuotas</span>
                    <span className="cuota-amount">
                      {cuotaInfo.val} <small className="cuota-freq">{cuotaInfo.freq}</small>
                    </span>
                  </>
                ) : (
                  <span className="cuota-disponible-badge badge bg-primary-subtle text-primary border border-primary-subtle">
                    <i className="bi bi-check-circle"></i> Crédito disponible
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return showPromoPrice ? (
    <div className="modal-price-display mb-3">
      <p className="mb-2">
        <strong className="text-secondary">Precio regular:</strong> <del className="text-muted ms-1">{priceRegularStr}</del>
      </p>
      <div className="d-flex align-items-center flex-wrap gap-2 mb-2">
        <p className="mb-0">
          <strong>Precio promocional:</strong>{' '}
          <span className="modal-price-highlight">{pricePromoStr}</span>
        </p>
        {promoBadgeText ? (
          <span className="badge px-2 py-1" style={{ backgroundColor: promoBadgeBg || badgeBg, color: '#fff', fontSize: '0.8rem' }}>
            <i className="bi bi-tag-fill me-1"></i>
            {promoBadgeText}
          </span>
        ) : null}
      </div>
    </div>
  ) : (
    <div className="modal-price-display mb-3">
      <p className="mb-2">
        <strong>Precio contado:</strong>{' '}
        <span className="modal-price-highlight">{priceRegularStr}</span>
      </p>
    </div>
  );
};

export default PriceDisplay;