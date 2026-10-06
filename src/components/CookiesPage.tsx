import { Link, useNavigate } from 'react-router-dom';
import { openCookiePreferences } from '../services/consent.service';

const CATEGORIES = [
  {
    id: 'necesarias',
    name: 'Necesarias',
    always: true,
    what: 'localStorage: gio-tech-cart, gio-tech-recent-searches, theme, currentAsesorId y gio-cookie-consent-v1 · sessionStorage: gio_welcome_seen_sess_v1',
    purpose:
      'Carrito de cotización, búsquedas recientes, modo claro/oscuro, asesor asignado, modal de bienvenida y tu elección de consentimiento.',
    when: 'Siempre activas. Sin ellas el sitio no funciona.',
  },
  {
    id: 'analitica',
    name: 'Analítica',
    always: false,
    what: 'Google Analytics 4 — G-1KGCQBPN75 (Google LLC, EE. UU.): cookies _ga y _ga_*',
    purpose:
      'Medir de forma agregada cuántas personas visitan el sitio, qué páginas ven y qué eventos ejecutan.',
    when: 'Solo si autorizas la categoría «Analítica».',
  },
  {
    id: 'publicidad',
    name: 'Publicidad',
    always: false,
    what: 'Meta Pixel — 939199705550194 (Meta Platforms Inc., EE. UU.): cookies _fbp y fr',
    purpose:
      'Medir campañas y eventos de negocio (vista de producto, agregar al carrito, contacto/lead).',
    when: 'Solo si autorizas la categoría «Publicidad».',
  },
];

export default function CookiesPage() {
  const navigate = useNavigate();

  const handleVolver = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      window.close();
      setTimeout(() => navigate('/'), 100);
    }
  };

  const handleOpenPreferences = () => {
    openCookiePreferences();
  };

  return (
    <div className="cookies-page">
      <div className="cookies-container">
        <button className="cookies-back" onClick={handleVolver}>
          <i className="bi bi-arrow-left me-2"></i> Volver
        </button>

        <h1 className="cookies-title">Política de Cookies – GIO TECH</h1>
        <p className="cookies-date">
          <em>Última actualización: Octubre de 2026</em>
        </p>

        <p>
          Esta página explica qué cookies y tecnologías similares usa{' '}
          <strong>giotechshop.online</strong>, para qué las usamos y cómo puedes decidir sobre
          ellas. Trabajamos bajo un modelo de <strong>consentimiento previo (opt-in)</strong>:
          solo instalamos cookies de medición (Google Analytics) y publicidad (Meta Pixel) si tú
          lo autorizas; sin tu autorización esas herramientas ni siquiera se descargan.
        </p>

        <h2>1. Qué son las cookies y tecnologías similares</h2>
        <p>
          Las cookies son pequeños archivos que el sitio guarda en tu navegador. Junto a ellas
          usamos el <strong>almacenamiento local y de sesión</strong> del navegador (localStorage
          y sessionStorage), que cumple la misma función pero sin enviarse en cada petición.
          En esta política llamamos «cookies» a todas estas tecnologías.
        </p>

        <h2>2. Categorías que usamos</h2>
        <div className="cookies-table-wrap">
          <table className="cookies-table">
            <thead>
              <tr>
                <th scope="col">Categoría</th>
                <th scope="col">Qué incluye</th>
                <th scope="col">Para qué</th>
                <th scope="col">Cuándo se activa</th>
              </tr>
            </thead>
            <tbody>
              {CATEGORIES.map((category) => (
                <tr key={category.id}>
                  <td data-label="Categoría">
                    <span className={`cookies-badge${category.always ? ' cookies-badge--locked' : ''}`}>
                      {category.name}
                    </span>
                    {category.always && <div className="cookies-cell-note">Siempre activas</div>}
                  </td>
                  <td data-label="Qué incluye">
                    <code>{category.what}</code>
                  </td>
                  <td data-label="Para qué">{category.purpose}</td>
                  <td data-label="Cuándo se activa">{category.when}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p>
          Los scripts de <strong>Google Analytics</strong> y <strong>Meta Pixel</strong> no se
          descargan si no autorizas esas categorías: mientras tanto tu navegador no hace ninguna
          petición a <code>googletagmanager.com</code> ni a <code>connect.facebook.net</code>.
        </p>

        <h2>3. Cómo dar, cambiar o revocar tu consentimiento</h2>
        <ul>
          <li>
            Al entrar por primera vez aparece el banner <strong>«Cookies y tecnologías
            similares»</strong> con tres opciones: <em>Aceptar todo</em>, <em>Solo necesarias</em>{' '}
            y <em>Guardar preferencias</em> (elección categoría por categoría).
          </li>
          <li>
            En cualquier momento puedes cambiar tu elección con el botón{' '}
            <strong>«Abrir preferencias de cookies»</strong> de esta página o con «Preferencias de
            cookies» del pie de página.
          </li>
          <li>
            Si activas una categoría nueva, sus scripts se cargan al instante. Si reduces
            permisos, la página se recarga para retirar los scripts que dejaste de autorizar.
          </li>
          <li>
            Rechazar analítica y publicidad no limita el sitio: puedes navegar el catálogo,
            armar tu carrito y pedir cotización por WhatsApp con normalidad.
          </li>
          <li>
            Tu elección se guarda en el almacenamiento local de tu navegador (localStorage,
            clave <code>gio-cookie-consent-v1</code>), queda hasta que la cambies y no tiene
            fecha de expiración. Si borras los datos del sitio, se elimina y volverás a ver el
            banner.
          </li>
        </ul>

        <button type="button" className="cookies-prefs-btn" onClick={handleOpenPreferences}>
          <i className="bi bi-sliders me-2" aria-hidden="true"></i>
          Abrir preferencias de cookies
        </button>

        <h2>4. Más información</h2>
        <p>
          El responsable del tratamiento de datos, los encargados (Google/Firebase, Groq,
          financieras) y la finalidad de cada dato están en nuestros{' '}
          <Link to="/terminos">Términos, Condiciones de Uso y Políticas de Privacidad</Link>,
          en la sección «Tecnologías de rastreo y cookies». Para dudas o PQRS:{' '}
          <a href="mailto:giotech.telefonia@gmail.com">giotech.telefonia@gmail.com</a>.
        </p>
      </div>

      <style>{`
        .cookies-page {
          max-width: 980px;
          margin: 0 auto;
          padding: 2rem 1.5rem calc(2rem + var(--gio-consent-banner-h, 0px));
          min-height: 80vh;
        }
        .cookies-container {
          background: var(--bg-secondary, #fff);
          border-radius: 12px;
          padding: 2rem;
          box-shadow: 0 2px 12px rgba(0,0,0,0.08);
        }
        .cookies-title {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 0.25rem;
          color: var(--text-primary, #111);
        }
        .cookies-container p.cookies-date {
          color: var(--text-tertiary, #6B7280);
          margin-bottom: 1rem;
        }
        .cookies-container h2 {
          font-size: 1.15rem;
          font-weight: 700;
          margin-top: 1.25rem;
          margin-bottom: 0.5rem;
          color: var(--text-primary, #111);
        }
        .cookies-container p {
          line-height: 1.65;
          margin-bottom: 0.7rem;
          color: var(--text-secondary, #333);
        }
        .cookies-container ul {
          padding-left: 1.5rem;
          margin-bottom: 0.75rem;
        }
        .cookies-container li {
          line-height: 1.65;
          margin-bottom: 0.35rem;
          color: var(--text-secondary, #333);
        }
        .cookies-container code {
          font-size: 0.78rem;
          word-break: break-word;
          color: var(--text-primary, #111);
          background: var(--bg-tertiary, #f3f4f6);
          padding: 0.1rem 0.3rem;
          border-radius: 4px;
        }
        .cookies-container a {
          color: var(--text-link, #C8102E);
          font-weight: 600;
        }
        .cookies-container a:hover {
          text-decoration: underline;
        }
        .cookies-back {
          background: none;
          border: none;
          color: var(--text-link, #C8102E);
          font-weight: 600;
          padding: 0.5rem 0;
          cursor: pointer;
          font-size: 0.9rem;
        }
        .cookies-back:hover {
          text-decoration: underline;
          opacity: 0.8;
        }
        .cookies-table-wrap {
          overflow-x: auto;
          margin-bottom: 0.75rem;
          -webkit-overflow-scrolling: touch;
        }
        .cookies-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.85rem;
          min-width: 640px;
        }
        .cookies-table th,
        .cookies-table td {
          padding: 0.6rem 0.7rem;
          border-bottom: 1px solid var(--border-color, #e5e7eb);
          text-align: left;
          vertical-align: top;
          color: var(--text-secondary, #333);
          line-height: 1.5;
        }
        .cookies-table th {
          font-size: 0.72rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-primary, #111);
          background: var(--bg-tertiary, #f3f4f6);
        }
        .cookies-table tbody tr:last-child td {
          border-bottom: none;
        }
        .cookies-badge {
          display: inline-block;
          padding: 0.15rem 0.55rem;
          border-radius: 999px;
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--text-link, #C8102E);
          background: var(--color-brand-primary-soft, rgba(200,16,46,0.07));
          border: 1px solid currentColor;
        }
        .cookies-cell-note {
          font-size: 0.72rem;
          color: var(--text-tertiary, #6B7280);
          margin-top: 0.3rem;
        }
        .cookies-prefs-btn {
          display: inline-flex;
          align-items: center;
          margin: 0.35rem 0 0.25rem;
          min-height: 42px;
          padding: 0 18px;
          border-radius: 8px;
          border: 1px solid var(--gio-red, #C8102E);
          background: var(--gio-red, #C8102E);
          color: #fff;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 160ms ease-out, transform 140ms cubic-bezier(0.23, 1, 0.32, 1);
        }
        .cookies-prefs-btn:hover {
          background: var(--gio-red-dark, #A00C24);
        }
        .cookies-prefs-btn:active {
          transform: scale(0.97);
        }

        /* Table → tarjetas apiladas en tablet/móvil (sin scroll horizontal) */
        @media (max-width: 767.98px) {
          .cookies-table-wrap {
            overflow-x: visible;
          }
          .cookies-table {
            min-width: 0;
            display: block;
          }
          .cookies-table thead {
            display: none;
          }
          .cookies-table tbody {
            display: block;
          }
          .cookies-table tr {
            display: block;
            border: 1px solid var(--border-color, #e5e7eb);
            border-radius: var(--radius-sm, 8px);
            padding: 0.85rem 0.9rem;
            margin-bottom: 0.75rem;
          }
          .cookies-table td {
            display: block;
            width: 100%;
            padding: 0.3rem 0;
            border: none;
          }
          .cookies-table td::before {
            content: attr(data-label);
            display: block;
            font-size: 0.68rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: var(--text-tertiary, #6B7280);
            margin-bottom: 0.15rem;
          }
          .cookies-table td:first-child {
            padding-top: 0;
            padding-bottom: 0.5rem;
          }
          .cookies-table td:first-child::before {
            display: none;
          }
        }

        @media (max-width: 575.98px) {
          .cookies-page {
            padding: 1.25rem 1rem calc(1.25rem + var(--gio-consent-banner-h, 0px));
          }
          .cookies-container {
            padding: 1.25rem;
          }
          .cookies-title {
            font-size: 1.35rem;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .cookies-prefs-btn {
            transition: none !important;
          }
        }
      `}</style>
    </div>
  );
}
