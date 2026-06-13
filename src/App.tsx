import { useState, useEffect, lazy, Suspense } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth, db } from "./firebase";
import { doc, onSnapshot } from "firebase/firestore";

import Catalogo from "./components/Catalogo";
import Header from "./components/Header";
import Footer from "./components/Footer";
import CartFloatingButton from "./components/CartFloatingButton";
import SnowfallEffect from "./components/SnowfallEffect";
import WhatsappFloatingButton from "./components/WhatsappFloatingButton";

import { CartProvider } from "./contexts/CartContext";
import { WhatsappNumberProvider } from "./contexts/WhatsappNumberContext";
import { subscribeToConfig } from "./services/config.service";

import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

import type { User, StoreConfig } from "./types";

const Login = lazy(() => import("./components/Login"));
const AdminPanel = lazy(() => import("./components/AdminPanel"));
const AsesorPanel = lazy(() => import("./components/AsesorPanel"));
const LandingPage = lazy(() => import("./components/LandingPage"));
const ServicioTecnicoPage = lazy(() => import("./components/ServicioTecnicoPage"));
const TerminosPage = lazy(() => import("./components/TerminosPage"));

const ACTIVAR_NIEVE = false;

function App() {
  const [usuario, setUsuario] = useState<User | null>(null);
  const [, setConfiguracion] = useState<StoreConfig>({});
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  let userUnsub: (() => void) | null = null;

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
        if (currentUser) {
        if (userUnsub) { try { userUnsub(); } catch { userUnsub = null; } }
        setUsuario({ uid: currentUser.uid, email: currentUser.email || '', rol: "cargando..." } as unknown as User);
        const userDocRef = doc(db, "usuarios", currentUser.uid);
        userUnsub = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists() && docSnap.data().rol) {
            setUsuario(prev => ({ ...prev!, rol: docSnap.data().rol, nombreCompleto: docSnap.data().nombreCompleto }));
          } else {
            setUsuario(prev => ({ ...prev!, rol: "cliente" }));
          }
          setIsLoadingAuth(false);
        }, (error) => {
          console.error("Error al obtener datos del usuario desde Firestore:", error);
          setUsuario(null);
          setIsLoadingAuth(false);
        });
      } else {
        if (userUnsub) { try { userUnsub(); } catch { userUnsub = null; } }
        setUsuario(null);
        setIsLoadingAuth(false);
      }
    });

    const unsubConfig = subscribeToConfig(
      (data) => {
        setConfiguracion(data);
      },
      (error) => {
        console.error("Error fetching config:", error);
      }
    );

    return () => {
      if (userUnsub) { try { userUnsub(); } catch { userUnsub = null; } }
      unsubAuth();
      unsubConfig();
    };
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUsuario(null);
      navigate("/login");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  const routesToHideSessionInfo = ["/", "/login", "/servicio-tecnico", "/panel"];
  const showSessionInfo = usuario && !routesToHideSessionInfo.includes(location.pathname);
  const showHeaderAndFooter = location.pathname !== "/login" && !location.pathname.startsWith("/panel") && location.pathname !== "/terminos";

  return (
    <WhatsappNumberProvider>
      <CartProvider>
        <div className="d-flex flex-column min-vh-100">
          {showHeaderAndFooter && <Header />}

          {showSessionInfo && (
            <div className="section-inner d-flex justify-content-between align-items-center my-3 p-3 bg-light rounded shadow-sm">
              <div>
                <strong>{usuario.email}</strong> ({usuario.rol})
              </div>
              <button onClick={handleLogout} className="btn btn-outline-danger">
                Cerrar sesión
              </button>
            </div>
          )}

          <main className="flex-grow-1">
            <Routes>
              <Route
                path="/"
                element={
                  <Suspense fallback={
                    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '300px' }}>
                      <p className="lead mb-0">Cargando…</p>
                    </div>
                  }>
                    <LandingPage />
                  </Suspense>
                }
              />
              <Route path="/catalogo" element={<Catalogo />} />
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
                path="/login"
                element={
                  <Suspense fallback={
                    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '300px' }}>
                      <p className="lead mb-0">Cargando módulo…</p>
                    </div>
                  }>
                    <Login onLogin={setUsuario} />
                  </Suspense>
                }
              />
              <Route
                path="/panel"
                element={
                  <Suspense fallback={
                    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '300px' }}>
                      <p className="lead mb-0">Cargando panel…</p>
                    </div>
                  }>
                    {
                      isLoadingAuth ? (
                        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '300px' }}>
                          <p className="lead">Verificando sesión...</p>
                        </div>
                      ) : usuario ? (
                        usuario.rol === "admin" ? (
                          <AdminPanel />
                        ) : usuario.rol === "asesor" ? (
                          <AsesorPanel />
                        ) : (
                          <Navigate to="/" replace />
                        )
                      ) : (
                        <Navigate to="/login" replace />
                      )
                    }
                  </Suspense>
                }
              />
            </Routes>
          </main>

          {showHeaderAndFooter && <Footer />}

          {(location.pathname === "/" || location.pathname === "/catalogo") && <CartFloatingButton />}

          {showHeaderAndFooter && <WhatsappFloatingButton />}
        </div>
      </CartProvider>

      <SnowfallEffect enabled={ACTIVAR_NIEVE} />
    </WhatsappNumberProvider>
  );
}

export default App;
