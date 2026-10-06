import { useState, type ReactNode } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth, useThemeMode } from "../hooks";

export interface AdminLayoutStats {
  totalProductos?: number;
  productosEnStock?: number;
  promosActivas?: number;
  totalSlides?: number;
  totalAsesores?: number;
}

interface AdminLayoutProps {
  children: ReactNode;
  currentSection: string;
  onSectionChange: (section: string) => void;
  stats?: AdminLayoutStats;
}

const menuItems = [
  {
    key: "productos",
    label: "Catálogo & Productos",
    icon: "bi-grid-fill",
    badgeKey: "totalProductos" as const,
  },
  {
    key: "agregar-producto",
    label: "Nuevo / Editar Producto",
    icon: "bi-plus-circle-fill",
  },
  {
    key: "carrusel",
    label: "Carrusel & Banners",
    icon: "bi-images",
    badgeKey: "totalSlides" as const,
  },
  {
    key: "negocio",
    label: "Configuración del Negocio",
    icon: "bi-sliders",
    adminOnly: true,
  },
  {
    key: "asesores",
    label: "Equipo & Asesores",
    icon: "bi-people-fill",
    badgeKey: "totalAsesores" as const,
    adminOnly: true,
  },
  {
    key: "opiniones",
    label: "Opiniones de Google",
    icon: "bi-star-fill",
    adminOnly: true,
  },
];

const sectionTitles: Record<string, { title: string; subtitle: string }> = {
  productos: {
    title: "Catálogo & Productos",
    subtitle: "Gestión integral de inventario, precios y especificaciones",
  },
  "agregar-producto": {
    title: "Nuevo / Editar Producto",
    subtitle: "Crea o actualiza fichas técnicas, promociones y fotos en tiempo real",
  },
  carrusel: {
    title: "Carrusel & Banners",
    subtitle: "Control de diapositivas promocionales en la página principal",
  },
  negocio: {
    title: "Configuración del Negocio",
    subtitle: "Información comercial, sedes, canales de venta y temas estacionales",
  },
  asesores: {
    title: "Equipo & Asesores",
    subtitle: "Gestión de asesores comerciales y permisos de acceso al sistema",
  },
  opiniones: {
    title: "Opiniones de Google",
    subtitle: "Reseñas reales de tu ficha de Google para la página de inicio",
  },
};

function AdminLayout({
  children,
  currentSection,
  onSectionChange,
  stats = {},
}: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { user, logout } = useAuth();
  const { isDarkMode: darkMode, toggleTheme: toggleDarkMode } = useThemeMode();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (err) {
      console.error("Error al cerrar sesión:", err);
    }
  };

  const handleNavClick = (key: string) => {
    const item = menuItems.find((m) => m.key === key);
    if (item?.adminOnly && user?.rol !== "admin") {
      onSectionChange("productos");
    } else {
      onSectionChange(key);
    }
    setSidebarOpen(false);
  };

  const currentMeta = sectionTitles[currentSection] || {
    title: "Panel de Administración",
    subtitle: "Panel de control general GIO TECH",
  };

  const userInitial = (user?.nombreCompleto || user?.email || "U")
    .charAt(0)
    .toUpperCase();
  const userRole =
    user?.rol === "admin"
      ? "Administrador"
      : user?.rol === "asesor"
      ? "Asesor"
      : "Cliente";

  const visibleMenuItems = menuItems.filter(
    (item) => !item.adminOnly || user?.rol === "admin"
  );

  return (
    <div className="admin-saas-dashboard">
      {/* ─── Sidebar / Drawer ────────────────────────── */}
      <aside
        className={`admin-saas-sidebar ${sidebarOpen ? "open" : ""}`}
        aria-label="Menú de administración"
      >
        {/* Sidebar Brand Header */}
        <div className="admin-sidebar-brand-header">
          <div className="admin-brand-icon-box">
            <i className="bi bi-shield-lock-fill" aria-hidden="true" />
          </div>
          <div className="admin-brand-text">
            <div className="d-flex align-items-center gap-2">
              <span className="admin-brand-title">GIO TECH</span>
              <span className="admin-badge-version">Pro v2</span>
            </div>
            <span className="admin-brand-sub">Panel de Control</span>
          </div>
          {/* Close button inside mobile drawer */}
          <button
            type="button"
            className="admin-sidebar-close-btn d-lg-none"
            onClick={() => setSidebarOpen(false)}
            aria-label="Cerrar menú"
          >
            <i className="bi bi-x-lg" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <nav className="admin-sidebar-nav-container">
          <div className="admin-nav-section-label">Módulos del Sistema</div>
          {visibleMenuItems.map((item) => {
            const isActive = currentSection === item.key;
            const count = item.badgeKey ? stats[item.badgeKey] : undefined;
            return (
              <button
                key={item.key}
                type="button"
                className={`admin-saas-nav-item ${isActive ? "active" : ""}`}
                onClick={() => handleNavClick(item.key)}
                aria-current={isActive ? "page" : undefined}
              >
                <div className="admin-nav-item-icon-wrap">
                  <i className={`bi ${item.icon}`} aria-hidden="true" />
                </div>
                <span className="admin-nav-item-label">{item.label}</span>
                {typeof count === "number" && (
                  <span className="admin-nav-badge-pill">{count}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Bottom: System Status Info */}
        <div className="admin-sidebar-system-footer">
          <div className="admin-sidebar-system-info">
            <div className="d-flex align-items-center gap-2 mb-1">
              <span className="admin-status-dot online" />
              <span className="admin-system-status-text">Sistema Conectado</span>
            </div>
            <div className="admin-system-store-info">
              <span className="admin-system-store-name">GIO TECH Admin</span>
              <span className="admin-system-version-label">v2.0 Pro</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Backdrop for Mobile */}
      {sidebarOpen && (
        <div
          className="admin-saas-backdrop"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ─── Main Content Container ──────────────────── */}
      <div className="admin-saas-content-wrapper">
        {/* Top Workspace Header Bar */}
        <header className="admin-saas-topbar">
          <div className="admin-topbar-left-zone">
            <button
              type="button"
              className="admin-hamburger-toggle-btn d-lg-none"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Abrir barra lateral"
            >
              <i className="bi bi-list" />
            </button>

            <div className="admin-breadcrumbs-zone">
              <div className="admin-breadcrumbs-crumbs">
                <span className="admin-crumb-parent">Dashboard</span>
                <i className="bi bi-chevron-right admin-crumb-sep" aria-hidden="true" />
                <span className="admin-crumb-current">{currentMeta.title}</span>
              </div>
              <div className="admin-topbar-headings">
                <h1 className="admin-page-main-title">{currentMeta.title}</h1>
                <p className="admin-page-subtitle d-none d-md-block">
                  {currentMeta.subtitle}
                </p>
              </div>
            </div>
          </div>

          <div className="admin-topbar-right-zone">
            {/* Quick summary pills */}
            {typeof stats.totalProductos === "number" && (
              <div className="admin-stat-summary-pill d-none d-sm-flex">
                <i className="bi bi-boxes text-danger me-1" aria-hidden="true" />
                <span className="fw-semibold">{stats.totalProductos}</span>
                <span className="text-muted ms-1">productos</span>
              </div>
            )}
            {typeof stats.promosActivas === "number" && stats.promosActivas > 0 && (
              <div className="admin-stat-summary-pill promo d-none d-md-flex">
                <i className="bi bi-lightning-charge-fill text-warning me-1" aria-hidden="true" />
                <span className="fw-semibold">{stats.promosActivas}</span>
                <span className="text-muted ms-1">en promo</span>
              </div>
            )}

            {/* Direct Store Link */}
            <Link
              to="/catalogo"
              target="_blank"
              rel="noreferrer"
              className="admin-action-btn-store"
              title="Ver Catálogo Público en nueva pestaña"
            >
              <i className="bi bi-shop" aria-hidden="true" />
              <span className="d-none d-sm-inline">Ver Tienda</span>
              <i className="bi bi-box-arrow-up-right admin-ext-icon" aria-hidden="true" />
            </Link>

            {/* Unified Theme Toggle */}
            <button
              type="button"
              className="admin-topbar-icon-btn"
              onClick={toggleDarkMode}
              title={darkMode ? "Activar Modo Claro" : "Activar Modo Oscuro"}
              aria-label={darkMode ? "Activar Modo Claro" : "Activar Modo Oscuro"}
            >
              <i className={`bi ${darkMode ? "bi-sun-fill" : "bi-moon-stars-fill"}`} />
            </button>

            {/* Topbar User Profile & Logout */}
            <div className="admin-topbar-user-zone">
              <div
                className="admin-topbar-user-pill"
                title={`${user?.nombreCompleto || user?.email || "Usuario"} (${userRole})`}
              >
                <div
                  className={`admin-user-avatar-circle-sm ${
                    user?.rol === "admin" ? "admin" : "asesor"
                  }`}
                  aria-hidden="true"
                >
                  {userInitial}
                </div>
                <div className="admin-topbar-user-info d-none d-lg-flex">
                  <span className="admin-topbar-user-name">
                    {user?.nombreCompleto || user?.email || "Usuario"}
                  </span>
                  <span className="admin-topbar-user-role">{userRole}</span>
                </div>
              </div>
              <button
                type="button"
                className="admin-topbar-logout-btn"
                onClick={() => setShowLogoutConfirm(true)}
                title="Cerrar Sesión"
                aria-label="Cerrar Sesión"
              >
                <i className="bi bi-box-arrow-right" />
                <span className="d-none d-xl-inline">Salir</span>
              </button>
            </div>
          </div>
        </header>

        {/* Dynamic Workspace Content */}
        <main className="admin-saas-main-area">
          <div className="admin-saas-inner-container">{children}</div>
        </main>
      </div>

      {/* Safe Logout Modal Confirmation */}
      {showLogoutConfirm && (
        <div
          className="admin-custom-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="logout-modal-title"
        >
          <div className="admin-custom-modal-box">
            <div className="admin-modal-icon-header logout">
              <i className="bi bi-box-arrow-right" />
            </div>
            <h4 id="logout-modal-title" className="admin-modal-title">
              ¿Cerrar Sesión?
            </h4>
            <p className="admin-modal-description">
              Se cerrará tu sesión activa en el panel de administración de GIO TECH.
            </p>
            <div className="admin-modal-actions">
              <button
                type="button"
                className="btn btn-outline-secondary px-4 py-2"
                onClick={() => setShowLogoutConfirm(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-danger px-4 py-2"
                onClick={handleLogout}
              >
                Confirmar Salida
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminLayout;