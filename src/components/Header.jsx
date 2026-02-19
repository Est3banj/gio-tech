// src/components/Header.jsx
import { useEffect, useState } from "react";
import { subscribeToConfig } from "../services/config.service";

function Header() {
  const [config, setConfig] = useState({});

  useEffect(() => {
    // Listener para la configuración del negocio desde Firestore
    const unsub = subscribeToConfig(
      (data) => setConfig(data),
      (error) => console.error("Header config error:", error)
    );
    return () => unsub(); // Limpiar el listener al desmontar el componente
  }, []);

  return (
    <header className="text-center mb-4">
      {config.logo && (
        <img
          src={config.logo}
          alt={config.nombre || "Logo"}
          style={{ height: 80 }}
          className="mb-3"
        />
      )}
      {config.nombre && (
        // El nombre del negocio ahora usa la clase text-primary (definida en App.css como tu rojo)
        <h2 className="fw-bold text-primary">
          {config.nombre} <span role="img" aria-label="emoji">📱</span>
        </h2>
      )}
      {/* Línea divisoria debajo del nombre del negocio */}
      <hr style={{ width: "200px", margin: "10px auto", opacity: 0.3 }} />
    </header>
  );
}

export default Header;