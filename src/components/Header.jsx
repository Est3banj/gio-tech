// src/components/Header.jsx
import React, { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase"; // Asegúrate que 'db' está exportado desde firebase.js

function Header() {
  const [config, setConfig] = useState({});

  useEffect(() => {
    // Listener para la configuración del negocio desde Firestore
    const unsub = onSnapshot(doc(db, "configuracion", "general"), (docSnap) => {
      if (docSnap.exists()) {
        setConfig(docSnap.data());
      }
    });
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