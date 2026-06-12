import { useState, useEffect, ReactNode } from "react";
import { auth } from "../firebase";
import { User, onAuthStateChanged } from "firebase/auth";

interface AdminLayoutProps {
  children: ReactNode;
  currentSection: string;
  onSectionChange: (section: string) => void;
}

const menuItems = [
  { key: "productos", label: "Productos", icon: "bi-box-seam" },
  { key: "agregar-producto", label: "Agregar Producto", icon: "bi-plus-circle" },
  { key: "negocio", label: "Negocio", icon: "bi-gear" },
  { key: "asesores", label: "Asesores", icon: "bi-people" },
  { key: "carrusel", label: "Carrusel", icon: "bi-images" },
];

const sectionTitles: Record<string, string> = {
  "agregar-producto": "Agregar Nuevo Producto",
  productos: "Lista de Productos",
  negocio: "Configuración del Negocio",
  asesores: "Gestión de Asesores",
  carrusel: "Carrusel Hero",
};

function AdminLayout({ children, currentSection, onSectionChange }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Get current user
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = () => {
    if (window.confirm("¿Cerrar sesión?")) {
      import("firebase/auth").then(({ signOut }) => {
        signOut(auth).then(() => {
          window.location.href = "/login";
        });
      });
    }
  };

  const handleNavClick = (key: string) => {
    onSectionChange(key);
    setSidebarOpen(false);
  };

  return (
    <div className="admin-dashboard">
      {/* Top Navigation Bar */}
      <header className="admin-topbar">
        <div className="admin-topbar-left">
          <button
            className="hamburger-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Abrir menú"
          >
            <i className={`bi ${sidebarOpen ? "bi-x-lg" : "bi-list"}`}></i>
          </button>
          <div className="admin-topbar-brand">
            <h4>GIO-TECH</h4>
            <span>{sectionTitles[currentSection] || "Panel de Administración"}</span>
          </div>
        </div>
        <div className="admin-topbar-right">
          <div className="admin-user-info">
            <i className="bi bi-person-circle"></i>
            <span className="admin-user-email">{currentUser?.email || "Usuario"}</span>
          </div>
          <button className="admin-logout-btn" onClick={handleLogout}>
            <i className="bi bi-box-arrow-right"></i>
            <span className="logout-text">Cerrar Sesión</span>
          </button>
        </div>
      </header>

      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? "open" : ""}`}>
        <nav className="admin-sidebar-nav">
          {menuItems.map((item) => (
            <button
              key={item.key}
              type="button"
              className={currentSection === item.key ? "active" : ""}
              onClick={() => handleNavClick(item.key)}
            >
              <i className={`bi ${item.icon}`}></i>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div className="admin-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main Content */}
      <main className="admin-main">
        {children}
      </main>
    </div>
  );
}

export default AdminLayout;