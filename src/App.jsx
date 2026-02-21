// src/App.jsx
import { useState, useEffect, lazy, Suspense } from "react";
// Importamos solo lo necesario de react-router-dom; BrowserRouter se importa en main.jsx
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth, db } from "./firebase"; // Asegúrate de que tu archivo firebase.js exporta db y auth
import { doc, onSnapshot } from "firebase/firestore";

// Componentes
import Catalogo from "./components/Catalogo";
import Header from "./components/Header";
import Footer from "./components/Footer";
import CartFloatingButton from "./components/CartFloatingButton"; // Nuevo componente del botón flotante
import SnowfallEffect from "./components/SnowfallEffect"; // ❄️ Efecto de nieve para temporada navideña
import WhatsappFloatingButton from "./components/WhatsappFloatingButton"; // 💬 Botón flotante de WhatsApp

// Contextos
import { CartProvider } from "./contexts/CartContext";
import { WhatsappNumberProvider } from "./contexts/WhatsappNumberContext"; // Importamos el nuevo proveedor de WhatsApp
import { subscribeToConfig } from "./services/config.service";

// Estilos globales
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

// Lazy-loaded (code splitting) for rutas pesadas: Login, AdminPanel y AsesorPanel
const Login = lazy(() => import("./components/Login"));
const AdminPanel = lazy(() => import("./components/AdminPanel"));
const AsesorPanel = lazy(() => import("./components/AsesorPanel"));
const LandingPage = lazy(() => import("./components/LandingPage"));
const ServicioTecnicoPage = lazy(() => import("./components/ServicioTecnicoPage"));

// ========================================
// 🎄 CONFIGURACIÓN DE TEMPORADA NAVIDEÑA
// ========================================
// 👉 Cambia este valor a 'true' para activar el efecto de nieve
// 👉 Cambia a 'false' para desactivar cuando termine la temporada
const ACTIVAR_NIEVE = false;
// ========================================

// Componente App principal
function App() {
  const [usuario, setUsuario] = useState(null); // Estado para el usuario autenticado
  const [configuracion, setConfiguracion] = useState({}); // Estado para la configuración del negocio
  const navigate = useNavigate(); // Hook para la navegación programática
  const location = useLocation(); // Hook para obtener la ubicación actual de la URL

  const [isLoadingAuth, setIsLoadingAuth] = useState(true); // Estado para saber si la autenticación está cargando

  let userUnsub = null;

  useEffect(() => {
    // Listener de autenticación de Firebase: se activa cuando el estado de autenticación cambia
    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        if (userUnsub) { try { userUnsub(); } catch (_) { } userUnsub = null; }
        // Si hay un usuario logueado, obtenemos sus datos adicionales (rol, nombre) de Firestore
        setUsuario({ uid: currentUser.uid, email: currentUser.email, rol: "cargando..." }); // Rol inicial 'cargando'
        const userDocRef = doc(db, "usuarios", currentUser.uid);
        userUnsub = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists() && docSnap.data().rol) {
            setUsuario(prev => ({ ...prev, rol: docSnap.data().rol, nombreCompleto: docSnap.data().nombreCompleto }));
          } else {
            // Si el documento de usuario no existe en Firestore, se le asigna rol por defecto 'cliente'
            setUsuario(prev => ({ ...prev, rol: "cliente" }));
          }
          setIsLoadingAuth(false); // La autenticación ha terminado de verificar
        }, (error) => {
          console.error("Error al obtener datos del usuario desde Firestore:", error);
          setUsuario(null); // En caso de error al obtener datos, se asume no logueado
          setIsLoadingAuth(false); // La autenticación ha terminado de verificar
        });
      } else {
        if (userUnsub) { try { userUnsub(); } catch (_) { } userUnsub = null; }
        setUsuario(null); // No hay usuario logueado
        setIsLoadingAuth(false); // La autenticación ha terminado de verificar
      }
    });



    // ... (existing helper function code not shown here, assuming it's part of component body)

    // Listener para la configuración general del sitio (nombre, logo) desde Firestore
    const unsubConfig = subscribeToConfig(
      (data) => {
        setConfiguracion(data);
      },
      (error) => {
        console.error("Error fetching config:", error);
      }
    );

    // Función de limpieza: se ejecutan al desmontar el componente App para evitar fugas de memoria
    return () => {
      if (userUnsub) { try { userUnsub(); } catch (_) { } userUnsub = null; }
      unsubAuth();
      unsubConfig();
    };
  }, []); // El array vacío asegura que este efecto se ejecute solo una vez al montar el componente

  // Función para manejar el cierre de sesión del usuario
  const handleLogout = async () => {
    try {
      await signOut(auth); // Cierra la sesión en Firebase Authentication
      setUsuario(null); // Limpia el estado del usuario
      navigate("/login"); // Redirige al usuario a la página de login
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      // Aquí podrías añadir una notificación visible al usuario sobre el error
    }
  };

  // Lógica para decidir si mostrar la información de sesión (email y botón de cerrar sesión)
  const routesToHideSessionInfo = ["/", "/login", "/servicio-tecnico"]; // Rutas donde la info de sesión NO debe mostrarse
  const showSessionInfo = usuario && !routesToHideSessionInfo.includes(location.pathname);

  // Lógica para decidir si mostrar el Header y el Footer de la aplicación
  // Se ocultan solo en la página de login para una experiencia minimalista
  const showHeaderAndFooter = location.pathname !== "/login";

  return (
    // Envuelve toda la aplicación con los Context Providers
    // WhatsappNumberProvider debe estar más arriba para que CartProvider y otros accedan al número de WhatsApp
    <WhatsappNumberProvider>
      <CartProvider>
        <div className="d-flex flex-column min-vh-100"> {/* Contenedor principal que usa flexbox para empujar el footer */}

          {/* Encabezado general de la aplicación, renderizado condicionalmente */}
          {showHeaderAndFooter && (
            <Header
              nombre={configuracion.nombre}
              logo={configuracion.logo}
              descripcion="Explora los celulares disponibles y cotiza directo por WhatsApp."
            />
          )}

          {/* Información del usuario logueado y botón de cerrar sesión, renderizado condicionalmente */}
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

          {/* Área principal de contenido que crecerá para ocupar el espacio restante */}
          <main className="flex-grow-1">
            <Routes> {/* Define las rutas de la aplicación */}
              {/* Ruta para la Home premium (landing page) */}
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
              {/* Ruta para el catálogo completo de productos */}
              <Route path="/catalogo" element={<Catalogo />} />
              {/* Ruta para la página de servicio técnico */}
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
              {/* Ruta para el login de usuarios */}
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
              {/* Ruta para el panel de administración/asesor, con control de roles */}
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
              {/* Aquí puedes añadir más rutas si las tienes, por ejemplo, para otras secciones */}
            </Routes>
          </main>

          {/* Pie de página de la aplicación, renderizado condicionalmente */}
          {showHeaderAndFooter && <Footer />}

          {/* Botón flotante del carrito, visible en la Home y en el catálogo */}
          {(location.pathname === "/" || location.pathname === "/catalogo") && <CartFloatingButton />}

          {/* 💬 Botón flotante de WhatsApp - Visible en todas las páginas excepto login */}
          {showHeaderAndFooter && <WhatsappFloatingButton />}
        </div>
      </CartProvider>

      {/* ❄️ Efecto de nieve navideña - Se renderiza sobre todo con pointer-events: none */}
      <SnowfallEffect enabled={ACTIVAR_NIEVE} />
    </WhatsappNumberProvider>
  );
}

export default App; // Exporta el componente App para ser utilizado en main.jsx