import React from "react";
import { Link } from "react-router-dom";

function HomePage({ anuncio }) {
  return (
    <div className="text-center py-5 bg-light" style={{ minHeight: "90vh" }}>
      <img
        src="https://res.cloudinary.com/YOUR_CLOUD_NAME/image/upload/v1234567890/tu_logo.png"
        alt="Logo"
        style={{ width: "150px", borderRadius: "50px", marginBottom: "1rem" }}
      />
      <h1 className="fw-bold">Bienvenido a GIO TECH 📱</h1>
      <p className="lead text-muted">Tu tienda confiable de celulares con cotización directa por WhatsApp</p>

      {anuncio && (
        <div className="alert alert-warning mt-4 mx-auto" style={{ maxWidth: 600 }}>
          <strong>📢 Anuncio:</strong> {anuncio}
        </div>
      )}

      <Link to="/catalogo" className="btn btn-primary mt-4">
        Ver catálogo de celulares
      </Link>

      <footer className="mt-5 text-muted small">
        <p className="mb-1">Síguenos en:</p>
        <div>
          <a href="https://www.instagram.com/tu_empresa" target="_blank" rel="noreferrer">Instagram</a> |{" "}
          <a href="https://www.facebook.com/tu_empresa" target="_blank" rel="noreferrer">Facebook</a> |{" "}
          <a href="https://wa.me/573248022632" target="_blank" rel="noreferrer">WhatsApp</a>
        </div>
        <p className="mt-3">&copy; {new Date().getFullYear()} GIO TECH</p>
      </footer>
    </div>
  );
}

export default HomePage;