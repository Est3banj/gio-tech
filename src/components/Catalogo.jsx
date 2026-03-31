import React, { useState, useEffect } from "react";
import { useProducts } from "../hooks/useProducts";
import { useConfig } from "../hooks/useConfig";
import ProductCard from "./ProductCard";
import { Container, Row, Col, Form, Spinner, Card, Button } from 'react-bootstrap';
import HeroCarousel from "./HeroCarousel";
import GeminiChat from "./GeminiChat";

// Lazy loading modals
const WelcomeModal = React.lazy(() => import('./WelcomeModal'));

function Catalogo() {
  const { products: productos, isLoading } = useProducts();
  const { config } = useConfig();
  const [busqueda, setBusqueda] = useState("");
  const [filtroMarca, setFiltroMarca] = useState("");
  const [filtroPrecio, setFiltroPrecio] = useState("");
  const [ordenamiento, setOrdenamiento] = useState("default");
  const [showWelcome, setShowWelcome] = useState(false);
  const [businessName, setBusinessName] = useState("");

  // Rangos de precio predefinidos
  const rangosPrecio = [
    { value: "", label: "Todos los precios" },
    { value: "0-500000", label: "Hasta $500.000" },
    { value: "500000-1000000", label: "$500.000 - $1.000.000" },
    { value: "1000000-2000000", label: "$1.000.000 - $2.000.000" },
    { value: "2000000-4000000", label: "$2.000.000 - $4.000.000" },
    { value: "4000000-999999999", label: "Más de $4.000.000" },
  ];

  // === Asistente IA Gemini ===
  const [showGeminiChat, setShowGeminiChat] = useState(false);

  // businessName del hook
  useEffect(() => {
    if (config?.nombre) {
      setBusinessName(config.nombre);
    }
  }, [config]);

  // Mostrar WelcomeModal solo una vez por sesión
  useEffect(() => {
    try {
      const seen = sessionStorage.getItem('gio_welcome_seen_sess_v1');
      setShowWelcome(!seen);
    } catch {
      setShowWelcome(true);
    }
  }, []);

  const normalizarTexto = (texto) => {
    if (typeof texto !== 'string') return '';
    return texto
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\x20-\x7E]/g, "")
      .trim();
  };

  const productosFiltrados = productos.filter((producto) => {
    const nombreNormalizado = normalizarTexto(producto.nombre);
    const descripcionNormalizada = normalizarTexto(producto.descripcion || "");
    const busquedaNormalizada = normalizarTexto(busqueda);
    const marcaFiltrada = filtroMarca ? normalizarTexto(filtroMarca) : "";

    const coincideBusqueda =
      nombreNormalizado.includes(busquedaNormalizada) ||
      descripcionNormalizada.includes(busquedaNormalizada);

    const coincideMarca =
      marcaFiltrada === "" ||
      nombreNormalizado.includes(marcaFiltrada) ||
      descripcionNormalizada.includes(marcaFiltrada);

    // Filtro por rango de precio
    let coincidePrecio = true;
    if (filtroPrecio) {
      const [min, max] = filtroPrecio.split('-').map(Number);
      const precio = parseFloat(producto.contado) || 0;
      coincidePrecio = precio >= min && precio <= max;
    }

    return coincideBusqueda && coincideMarca && coincidePrecio;
  });

  const productosOrdenados = [...productosFiltrados].sort((a, b) => {
    if (ordenamiento === "price_asc") {
      const priceA = parseFloat(a.contado) || 0;
      const priceB = parseFloat(b.contado) || 0;
      return priceA - priceB;
    }
    if (ordenamiento === "price_desc") {
      const priceA = parseFloat(a.contado) || 0;
      const priceB = parseFloat(b.contado) || 0;
      return priceB - priceA;
    }
    if (ordenamiento === "name_asc") {
      return (a.nombre || '').localeCompare(b.nombre || '');
    }
    if (ordenamiento === "name_desc") {
      return (b.nombre || '').localeCompare(a.nombre || '');
    }
    return 0;
  });

  return (
    <>
      <React.Suspense fallback={null}>
        <WelcomeModal
          show={showWelcome}
          onClose={() => setShowWelcome(false)}
          businessName={businessName}
        />
      </React.Suspense>

      {/* Hero Carousel - Carrusel dinámico gestionado desde el admin */}
      <HeroCarousel />

      <div className="section-inner py-4 header-offset">
        <Row className="mb-5 justify-content-center">
          <Col xs={12} md={10} lg={8} className="text-center">
            <h2 className="display-5 fw-bold mb-3 text-primary">Nuestros Productos</h2>
            <p className="lead text-muted mb-4">
              Explora nuestra selección de los mejores celulares y otros dispositivos tecnológicos.
              ¡Cotiza directamente por WhatsApp y estrena hoy mismo!
            </p>
          </Col>
          <Col xs={12} md={10} lg={8}>
            <Card className="search-card p-3 p-md-4">
              <Row className="g-2 g-md-3 align-items-center">
                <Col xs={12}>
                  <Form.Control
                    type="text"
                    placeholder="Buscar por nombre o descripción..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    size="lg"
                  />
                </Col>
                <Col xs={6} md={4}>
                  <Form.Select
                    value={filtroMarca}
                    onChange={(e) => setFiltroMarca(e.target.value)}
                    size="sm"
                  >
                    <option value="">Todas las marcas</option>
                    <option value="samsung">Samsung</option>
                    <option value="redmi">Redmi</option>
                    <option value="tecno">Tecno</option>
                    <option value="iphone">iPhone</option>
                    <option value="infinix">Infinix</option>
                    <option value="motorola">Motorola</option>
                    <option value="huawei">Huawei</option>
                  </Form.Select>
                </Col>
                <Col xs={6} md={4}>
                  <Form.Select
                    value={filtroPrecio}
                    onChange={(e) => setFiltroPrecio(e.target.value)}
                    size="sm"
                  >
                    {rangosPrecio.map((rango) => (
                      <option key={rango.value} value={rango.value}>{rango.label}</option>
                    ))}
                  </Form.Select>
                </Col>
                <Col xs={12} md={4}>
                  <Form.Select
                    value={ordenamiento}
                    onChange={(e) => setOrdenamiento(e.target.value)}
                    size="sm"
                  >
                    <option value="default">Ordenar por...</option>
                    <option value="price_asc">Precio: Menor a Mayor</option>
                    <option value="price_desc">Precio: Mayor a Menor</option>
                    <option value="name_asc">Nombre: A - Z</option>
                    <option value="name_desc">Nombre: Z - A</option>
                  </Form.Select>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>

        {isLoading ? (
          <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '300px' }}>
            <Spinner animation="border" role="status" className="text-primary">
              <span className="visually-hidden">Cargando productos...</span>
            </Spinner>
            <p className="ms-3 fs-5 text-muted">Cargando productos...</p>
          </div>
        ) : productosOrdenados.length === 0 ? (
          <div className="text-center py-5">
            <p className="lead">Lo sentimos, no se encontraron productos que coincidan con tu búsqueda o filtros.</p>
            <button
              className="btn btn-outline-secondary mt-3"
              onClick={() => { setBusqueda(""); setFiltroMarca(""); setOrdenamiento("default"); }}
            >
              Ver todos los productos
            </button>
          </div>
        ) : (
          <Row className="justify-content-center">
            {productosOrdenados.map((producto) => (
              <Col key={producto.id} xs={12} sm={6} md={4} lg={3} className="mb-4 d-flex">
                <ProductCard producto={producto} />
              </Col>
            ))}
          </Row>
        )}

        {/* Botón flotante del asistente IA - Diseño mejorado */}
        <Button
          variant="primary"
          className="floating-gemini-btn rounded-circle"
          onClick={() => setShowGeminiChat(true)}
          aria-label="Abrir chat con IA"
          title="🤖 Chatea con nuestro asistente IA - Te ayudamos a encontrar el celular perfecto"
          style={{
            position: 'fixed',
            bottom: '100px',
            right: '20px',
            width: '65px',
            height: '65px',
            fontSize: '1.8rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1050,
            background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
            border: '3px solid white',
            borderRadius: '50%',
            boxShadow: '0 8px 25px rgba(102, 126, 234, 0.5), 0 0 0 0 rgba(102, 126, 234, 0.5)',
            animation: 'pulse-glow 2s infinite',
          }}
        >
          <span style={{ animation: 'bounce 2s infinite' }}>🤖</span>
        </Button>

        {/* Mensaje flotante junto al botón IA */}
        <div
          onClick={() => setShowGeminiChat(true)}
          style={{
            position: 'fixed',
            bottom: '115px',
            right: '95px',
            background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
            color: 'white',
            padding: '8px 14px',
            borderRadius: '20px',
            fontSize: '0.85rem',
            fontWeight: '500',
            boxShadow: '0 4px 15px rgba(14, 165, 233, 0.4)',
            cursor: 'pointer',
            animation: 'float-tip 3s ease-in-out infinite',
            zIndex: 1049,
            whiteSpace: 'nowrap'
          }}
        >
          💬 Te ayudo a elegir
        </div>

        <style>{`
          @keyframes pulse-glow {
            0% { box-shadow: 0 8px 25px rgba(14, 165, 233, 0.5), 0 0 0 0 rgba(14, 165, 233, 0.4); }
            50% { box-shadow: 0 8px 25px rgba(14, 165, 233, 0.5), 0 0 0 10px rgba(14, 165, 233, 0); }
            100% { box-shadow: 0 8px 25px rgba(14, 165, 233, 0.5), 0 0 0 0 rgba(14, 165, 233, 0); }
          }
          @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-3px); }
          }
          @keyframes float-tip {
            0%, 100% { transform: translateX(0); }
            50% { transform: translateX(-5px); }
          }
        `}</style>

        {/* Chat de Gemini IA */}
        {showGeminiChat && (
          <GeminiChat 
            productos={productos} 
            onClose={() => setShowGeminiChat(false)} 
          />
        )}
      </div>
    </>
  );
}

export default Catalogo;
