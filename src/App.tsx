import { useState, useEffect, useLayoutEffect, lazy, Suspense } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation, useNavigationType } from "react-router-dom";

import Catalogo from "./components/Catalogo";
import Header from "./components/Header";
import Footer from "./components/Footer";
import CartFloatingButton from "./components/CartFloatingButton";
import SnowfallEffect from "./components/SnowfallEffect";
import WhatsappFloatingButton from "./components/WhatsappFloatingButton";
import ProtectedRoute from "./components/ProtectedRoute";
import CookieConsentBanner from "./components/CookieConsentBanner";

import { AuthProvider } from "./contexts/AuthContext";
import { CartProvider } from "./contexts/CartContext";
import { WhatsappNumberProvider } from "./contexts/WhatsappNumberContext";
import { subscribeToConfig } from "./services/config.service";
import { useAuth } from "./hooks/useAuth";
import { getProductIdFromSearchParams } from "./utils/deep-link";

import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

import type { StoreConfig } from "./types";

const Login = lazy(() => import("./components/Login"));
const AdminPanel = lazy(() => import("./components/AdminPanel"));
const AsesorPanel = lazy(() => import("./components/AsesorPanel"));
const LandingPage = lazy(() => import("./components/LandingPage"));
const ServicioTecnicoPage = lazy(() => import("./components/ServicioTecnicoPage"));
const TerminosPage = lazy(() => import("./components/TerminosPage"));
const CookiesPage = lazy(() => import("./components/CookiesPage"));
const ProductPage = lazy(() => import("./components/ProductPage"));
const ShopPage = lazy(() => import("./components/ShopPage"));

const RootRoute = () => {
  const location = useLocation();
  // Deep links legacy (/?producto=ID o /?id=ID) → directo al detalle.
  // El helper devuelve null si el param está vacío/ausente (sin redirect, igual que antes).
  const targetProductId = getProductIdFromSearchParams(new URLSearchParams(location.search));

  if (targetProductId) {
    return <Navigate to={`/producto/${targetProductId}`} replace />;
  }

  return (
    <Suspense fallback={
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '300px' }}>
        <p className="lead mb-0">Cargando…</p>
      </div>
    }>
      <LandingPage />
    </Suspense>
  );
};

const PanelDispatcher = () => {
  const { role } = useAuth();
  if (role === "admin") {
    return <AdminPanel />;
  }
  if (role === "asesor") {
    return <AsesorPanel />;
  }
  return <Navigate to="/" replace />;
};

function AppContent() {
  const { user, logout } = useAuth();
  const [, setConfiguracion] = useState<StoreConfig>({});
  const navigate = useNavigate();
  const location = useLocation();
  const navigationType = useNavigationType();

  // Scroll solo en PUSH: el catálogo abre la ficha arriba aunque su
  // scroll en origen sea y=1200 (chunk cálido no clampa el documento).
  // POP queda intacto para que el browser restaure la posición de
  // origen (patrón estándar de scroll restoration en SPAs).
  // REPLACE no toca el scroll (deep links / filtros de tienda).
  useLayoutEffect(() => {
    if (navigationType === "PUSH" && !location.hash) {
      window.scrollTo(0, 0);
    }
  }, [location.key, navigationType, location.hash]);

  useEffect(() => {
    const unsubConfig = subscribeToConfig(
      (data) => {
        setConfiguracion(data);
      },
      (error) => {
        console.error("Error fetching config:", error);
      }
    );

    return () => {
      unsubConfig();
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  const routesToHideSessionInfo = ["/", "/login", "/servicio-tecnico", "/panel", "/admin"];
  const showSessionInfo = user && !routesToHideSessionInfo.includes(location.pathname);
  // Páginas legales en "documento limpio" (sin header/footer/WhatsApp): mismo patrón que /terminos.
  const showHeaderAndFooter =
    location.pathname !== "/login" &&
    !location.pathname.startsWith("/panel") &&
    !location.pathname.startsWith("/admin") &&
    location.pathname !== "/terminos" &&
    location.pathname !== "/cookies";

  return (
    <div className="d-flex flex-column min-vh-100">
      {showHeaderAndFooter && <Header />}

      {showSessionInfo && (
        <div className="section-inner d-flex justify-content-between align-items-center my-3 p-3 bg-light rounded shadow-sm">
          <div>
            <strong>{user.email}</strong> ({user.rol})
          </div>
          <button onClick={handleLogout} className="btn btn-outline-danger">
            Cerrar sesión
          </button>
        </div>
      )}

      <main className="flex-grow-1">
        <Routes>
          <Route path="/" element={<RootRoute />} />
          <Route path="/catalogo" element={<Catalogo />} />
          <Route path="/tienda" element={
            <Suspense fallback={
              <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '300px' }}>
                <p className="lead mb-0">Cargando tienda…</p>
              </div>
            }>
              <ShopPage />
            </Suspense>
          } />
          <Route
            path="/producto/:productId"
            element={
              <Suspense fallback={
                <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '300px' }}>
                  <p className="lead mb-0">Cargando producto…</p>
                </div>
              }>
                <ProductPage />
              </Suspense>
            }
          />
          <Route
            path="/servicio-tecnico"
            element={
              <Suspense fallback={
                <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '300px' }}>
                  <p className="lead mb-0">Cargando…</p>
                </div>
              }>
                <ServicioTecnicoPage />
              </Suspense>
            }
          />
          <Route
            path="/terminos"
            element={
              <Suspense fallback={
                <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '300px' }}>
                  <p className="lead mb-0">Cargando…</p>
                </div>
              }>
                <TerminosPage />
              </Suspense>
            }
          />
          <Route
            path="/cookies"
            element={
              <Suspense fallback={
                <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '300px' }}>
                  <p className="lead mb-0">Cargando…</p>
                </div>
              }>
                <CookiesPage />
              </Suspense>
            }
          />
          <Route
            path="/login"
            element={
              <Suspense fallback={
                <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '300px' }}>
                  <p className="lead mb-0">Cargando módulo…</p>
                </div>
              }>
                <Login />
              </Suspense>
            }
          />
          <Route
            path="/panel"
            element={
              <ProtectedRoute allowedRoles={["admin", "asesor"]}>
                <Suspense fallback={
                  <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '300px' }}>
                    <p className="lead mb-0">Cargando panel…</p>
                  </div>
                }>
                  <PanelDispatcher />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route path="/admin" element={<Navigate to="/panel" replace />} />
        </Routes>
      </main>

      {showHeaderAndFooter && <Footer />}

      {(location.pathname === "/" || location.pathname === "/catalogo" || location.pathname.startsWith("/producto/")) && (
        <CartFloatingButton />
      )}

      {showHeaderAndFooter && <WhatsappFloatingButton />}

      <CookieConsentBanner />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <WhatsappNumberProvider>
        <CartProvider>
          <AppContent />
          <SnowfallEffect enabled={true} />
        </CartProvider>
      </WhatsappNumberProvider>
    </AuthProvider>
  );
}

export default App;
