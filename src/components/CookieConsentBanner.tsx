import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getConsent,
  hasAnyConsent,
  saveConsent,
  subscribeConsent,
  subscribeCookiePreferences,
} from '../services/consent.service';

/**
 * Banner propio de cookies (bottom bar, no modal).
 * Opt-in: sólo aparece si el usuario nunca eligió, y puede reabrirse desde el footer.
 */
const CookieConsentBanner = () => {
  const [open, setOpen] = useState(() => !hasAnyConsent());
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const shouldFocusRef = useRef(false);

  useEffect(() => {
    const unsubscribeConsent = subscribeConsent((consent) => {
      setAnalytics(consent?.analytics ?? false);
      setMarketing(consent?.marketing ?? false);
    });

    const unsubscribePreferences = subscribeCookiePreferences(() => {
      const consent = getConsent();
      setAnalytics(consent?.analytics ?? false);
      setMarketing(consent?.marketing ?? false);
      shouldFocusRef.current = true;
      setOpen(true);
    });

    return () => {
      unsubscribeConsent();
      unsubscribePreferences();
    };
  }, []);

  useEffect(() => {
    if (open && shouldFocusRef.current) {
      shouldFocusRef.current = false;
      containerRef.current?.focus();
      return;
    }

    if (!open) {
      const active = document.activeElement;
      if (active instanceof HTMLElement && containerRef.current?.contains(active)) {
        active.blur();
      }
    }
  }, [open]);

  // Publica la altura real del banner como CSS var para que las páginas sin footer
  // (p. ej. /cookies) puedan reservar espacio y no queden tapadas al final del scroll.
  useEffect(() => {
    const root = document.documentElement;
    const el = containerRef.current;

    if (!open || !el) {
      root.style.removeProperty('--gio-consent-banner-h');
      return;
    }

    const publish = () => {
      root.style.setProperty('--gio-consent-banner-h', `${Math.round(el.offsetHeight)}px`);
    };

    publish();
    const observer = new ResizeObserver(publish);
    observer.observe(el);

    return () => {
      observer.disconnect();
      root.style.removeProperty('--gio-consent-banner-h');
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Escape sólo cierra si ya hubo una elección previa (no se puede desestimar la primera vez).
      if (event.key === 'Escape' && hasAnyConsent()) {
        setOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  const handleAcceptAll = useCallback(() => {
    saveConsent({ analytics: true, marketing: true });
    setOpen(false);
  }, []);

  const handleNecessaryOnly = useCallback(() => {
    saveConsent({ analytics: false, marketing: false });
    setOpen(false);
  }, []);

  const handleSavePreferences = useCallback(() => {
    saveConsent({ analytics, marketing });
    setOpen(false);
  }, [analytics, marketing]);

  const handleDetailsClick = useCallback(() => {
    // Si todavía no hay elección, el banner se queda abierto para que se pueda decidir.
    if (hasAnyConsent()) setOpen(false);
  }, []);

  return (
    <>
      <style>{`
        .gio-cookie-banner {
          position: fixed;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 1100;
          padding: 14px 16px calc(14px + env(safe-area-inset-bottom));
          background: var(--bg-card);
          border-top: 1px solid var(--border-color);
          box-shadow: var(--shadow-xl);
          transform: translateY(calc(100% + 24px));
          opacity: 0;
          visibility: hidden;
          pointer-events: none;
          transition:
            transform 240ms cubic-bezier(0.23, 1, 0.32, 1),
            opacity 180ms ease-out,
            visibility 0s linear 240ms;
        }

        .gio-cookie-banner.is-open {
          transform: translateY(0);
          opacity: 1;
          visibility: visible;
          pointer-events: auto;
          transition:
            transform 240ms cubic-bezier(0.23, 1, 0.32, 1),
            opacity 180ms ease-out,
            visibility 0s linear 0s;

          @starting-style {
            transform: translateY(calc(100% + 24px));
            opacity: 0;
          }
        }

        .gio-cookie-banner:focus {
          outline: none;
        }

        .gio-cookie-banner__inner {
          max-width: 1180px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 14px 24px;
          align-items: center;
        }

        .gio-cookie-banner__title {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0 0 4px;
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .gio-cookie-banner__title i {
          color: var(--text-link);
          font-size: 1.05rem;
        }

        .gio-cookie-banner__text {
          margin: 0;
          font-size: 0.85rem;
          line-height: 1.5;
          color: var(--text-secondary);
        }

        .gio-cookie-banner__link {
          color: var(--text-link);
          font-weight: 600;
          text-decoration: underline;
          text-underline-offset: 2px;
          white-space: nowrap;
        }

        .gio-cookie-banner__link:hover {
          text-decoration-thickness: 2px;
        }

        .gio-cookie-banner__categories {
          display: flex;
          flex-wrap: wrap;
          gap: 8px 16px;
          margin-top: 10px;
        }

        .gio-consent-category {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          margin: 0;
          font-size: 0.82rem;
          font-weight: 600;
          color: var(--text-primary);
          cursor: pointer;
          user-select: none;
        }

        .gio-consent-category--locked {
          cursor: default;
          color: var(--text-secondary);
        }

        .gio-consent-category small {
          font-weight: 500;
          color: var(--text-tertiary);
        }

        .gio-consent-check {
          width: 16px;
          height: 16px;
          margin: 0;
          accent-color: var(--gio-red);
          flex-shrink: 0;
        }

        .gio-consent-check:disabled {
          opacity: 0.75;
        }

        .gio-cookie-banner__actions {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, auto));
          gap: 8px;
        }

        .gio-consent-btn {
          min-height: 40px;
          padding: 0 16px;
          border-radius: var(--radius-sm, 8px);
          border: 1px solid var(--border-color);
          background: transparent;
          color: var(--text-primary);
          font-size: 0.85rem;
          font-weight: 600;
          line-height: 1.2;
          cursor: pointer;
          transition:
            transform 140ms cubic-bezier(0.23, 1, 0.32, 1),
            background-color 160ms ease-out,
            border-color 160ms ease-out,
            color 160ms ease-out;
        }

        .gio-consent-btn:hover {
          background: var(--bg-hover);
        }

        .gio-consent-btn:active {
          transform: scale(0.97);
        }

        .gio-consent-btn--primary {
          background: var(--gio-red);
          border-color: var(--gio-red);
          color: #ffffff;
        }

        .gio-consent-btn--primary:hover {
          background: var(--gio-red-dark);
          border-color: var(--gio-red-dark);
        }

        .gio-consent-btn--brand {
          border-color: var(--text-link);
          color: var(--text-link);
        }

        .gio-consent-btn--brand:hover {
          background: var(--gio-red-soft);
        }

        @media (max-width: 767.98px) {
          .gio-cookie-banner__inner {
            grid-template-columns: minmax(0, 1fr);
            gap: 12px;
          }

          .gio-cookie-banner__actions {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .gio-consent-btn--primary {
            grid-column: 1 / -1;
          }

          .gio-consent-btn {
            padding: 0 10px;
          }
        }

        @media (max-width: 375px) {
          .gio-cookie-banner {
            padding-left: 12px;
            padding-right: 12px;
          }

          .gio-cookie-banner__categories {
            gap: 6px 12px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .gio-cookie-banner,
          .gio-consent-btn {
            transition: none !important;
          }
        }
      `}</style>

      <div
        ref={containerRef}
        tabIndex={-1}
        className={`gio-cookie-banner${open ? ' is-open' : ''}`}
        role="dialog"
        aria-modal="false"
        aria-label="Preferencias de cookies"
        inert={!open}
      >
        <div className="gio-cookie-banner__inner">
          <div className="gio-cookie-banner__content">
            <p className="gio-cookie-banner__title">
              <i className="bi bi-cookie" aria-hidden="true"></i>
              Cookies y tecnologías similares
            </p>
            <p className="gio-cookie-banner__text">
              Usamos cookies necesarias (carrito, tema y búsquedas) y, con tu autorización, de
              analítica y publicidad (Google Analytics y Meta Pixel). Nunca vendemos tus datos.{' '}
              <Link to="/cookies" className="gio-cookie-banner__link" onClick={handleDetailsClick}>
                Ver detalles
              </Link>
            </p>

            <div className="gio-cookie-banner__categories">
              <label className="gio-consent-category gio-consent-category--locked">
                <input type="checkbox" className="gio-consent-check" checked disabled readOnly />
                <span>
                  Necesarias <small>siempre activas</small>
                </span>
              </label>

              <label className="gio-consent-category">
                <input
                  type="checkbox"
                  className="gio-consent-check"
                  checked={analytics}
                  onChange={(event) => setAnalytics(event.target.checked)}
                />
                <span>
                  Analítica <small>Google Analytics</small>
                </span>
              </label>

              <label className="gio-consent-category">
                <input
                  type="checkbox"
                  className="gio-consent-check"
                  checked={marketing}
                  onChange={(event) => setMarketing(event.target.checked)}
                />
                <span>
                  Publicidad <small>Meta Pixel</small>
                </span>
              </label>
            </div>
          </div>

          <div className="gio-cookie-banner__actions">
            <button
              type="button"
              className="gio-consent-btn gio-consent-btn--primary"
              onClick={handleAcceptAll}
            >
              Aceptar todo
            </button>
            <button type="button" className="gio-consent-btn" onClick={handleNecessaryOnly}>
              Solo necesarias
            </button>
            <button
              type="button"
              className="gio-consent-btn gio-consent-btn--brand"
              onClick={handleSavePreferences}
            >
              Guardar preferencias
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default CookieConsentBanner;
