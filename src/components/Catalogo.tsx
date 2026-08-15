// src/components/Catalogo.tsx
import React, { useState, useEffect } from "react";
import { useProducts } from "../hooks/useProducts";
import { useConfig } from "../hooks/useConfig";
import { normalizeText } from "../utils/formatters";
import ProductCard from "./ProductCard";
import { Row, Col, Form, Spinner, Card } from 'react-bootstrap';
import BannerSlider from "./BannerSlider";
import GeminiChat from "./GeminiChat";

const WelcomeModal = React.lazy(() => import('./WelcomeModal'));

interface RangoPrecio {
  value: string;
  label: string;
}

const rangosPrecio: RangoPrecio[] = [
  { value: "", label: "Todos los precios" },
  { value: "0-500000", label: "Hasta $500.000" },
  { value: "500000-1000000", label: "$500.000 - $1.000.000" },
  { value: "1000000-2000000", label: "$1.000.000 - $2.000.000" },
  { value: "2000000-4000000", label: "$2.000.000 - $4.000.000" },
  { value: "4000000-999999999", label: "Más de $4.000.000" },
];

const Catalogo: React.FC = () => {
  const { products: productos, isLoading } = useProducts();
  const { config } = useConfig();
  const [busqueda, setBusqueda] = useState("");
  const [filtroMarca, setFiltroMarca] = useState("");
  const [filtroPrecio, setFiltroPrecio] = useState("");
  const [ordenamiento, setOrdenamiento] = useState("default");
  const [showWelcome, setShowWelcome] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [showGeminiChat, setShowGeminiChat] = useState(false);

  useEffect(() => {
    if (config?.nombre) {
      setBusinessName(config.nombre);
    }
  }, [config]);

  useEffect(() => {
    try {
      const seen = sessionStorage.getItem('gio_welcome_seen_sess_v1');
      setShowWelcome(!seen);
    } catch {
      setShowWelcome(true);
    }
  }, []);

  const productosFiltrados = productos.filter((producto) => {
    const nombreNormalizado = normalizeText(producto.nombre);
    const descripcionNormalizada = normalizeText(producto.descripcion || "");
    const busquedaNormalizada = normalizeText(busqueda);
    const marcaFiltrada = filtroMarca ? normalizeText(filtroMarca) : "";

    const coincideBusqueda =
      nombreNormalizado.includes(busquedaNormalizada) ||
      descripcionNormalizada.includes(busquedaNormalizada);

    const coincideMarca =
      marcaFiltrada === "" ||
      nombreNormalizado.includes(marcaFiltrada) ||
      descripcionNormalizada.includes(marcaFiltrada);

    let coincidePrecio = true;
    if (filtroPrecio) {
      const [min, max] = filtroPrecio.split('-').map(Number);
      const precio = parseFloat(String(producto.contado)) || 0;
      coincidePrecio = precio >= min && precio <= max;
    }

    return coincideBusqueda && coincideMarca && coincidePrecio;
  });

  const productosOrdenados = [...productosFiltrados].sort((a, b) => {
    if (ordenamiento === "price_asc") {
      const priceA = parseFloat(String(a.contado)) || 0;
      const priceB = parseFloat(String(b.contado)) || 0;
      return priceA - priceB;
    }
    if (ordenamiento === "price_desc") {
      const priceA = parseFloat(String(a.contado)) || 0;
      const priceB = parseFloat(String(b.contado)) || 0;
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

      <div className="banner-section">
        <BannerSlider />
      </div>

      <section className="catalogo-section section-inner py-4">
        <Row className="mb-5 justify-content-center">
          <Col xs={12} md={10} lg={8} className="text-center">
            <h1 className="display-5 fw-bold mb-3 text-primary">Nuestros Productos</h1>
            <p className="lead text-muted mb-4">
              Explora nuestra selección de los mejores celulares y otros dispositivos tecnológicos.
              ¡Cotiza directamente por WhatsApp y estreia hoy mismo!
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

        <button
          type="button"
          onClick={() => setShowGeminiChat(true)}
          aria-label="Abrir chat con IA"
          title="Chatea con nuestro asistente IA"
          className="gio-chat-fab"
          style={{
            position: 'fixed',
            bottom: '100px',
            right: '20px',
            width: '56px',
            height: '56px',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1050,
            background: '#0d6efd',
            borderRadius: '50%',
            border: 'none',
            boxShadow: '0 4px 20px rgba(13,110,253,0.4)',
            cursor: 'pointer',
            color: 'white',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'scale(1.08)';
            e.currentTarget.style.boxShadow = '0 6px 28px rgba(13,110,253,0.5)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(13,110,253,0.4)';
          }}
        >
          <i className="bi bi-chat-dots-fill" style={{ fontSize: '1.5rem', lineHeight: 1 }} />
        </button>

        <div
          onClick={() => setShowGeminiChat(true)}
          className="gio-chat-tooltip"
          style={{
            position: 'fixed',
            bottom: '117px',
            right: '90px',
            background: '#fff',
            color: '#212529',
            padding: '8px 16px 8px 14px',
            borderRadius: '20px',
            fontSize: '0.85rem',
            fontWeight: 500,
            boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
            cursor: 'pointer',
            zIndex: 1049,
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            border: '1px solid #e9ecef',
            transition: 'opacity 0.3s ease',
          }}
        >
          <i className="bi bi-chat-dots" style={{ color: '#0d6efd', fontSize: '1rem' }} />
          Te ayudamos a elegir
        </div>

        <style>{`
          .gio-chat-fab {
            animation: gio-fab-pulse 2.5s ease-in-out infinite;
          }
          @keyframes gio-fab-pulse {
            0% { box-shadow: 0 4px 20px rgba(13,110,253,0.4); }
            50% { box-shadow: 0 4px 28px rgba(13,110,253,0.55); }
            100% { box-shadow: 0 4px 20px rgba(13,110,253,0.4); }
          }
        `}</style>

        {showGeminiChat && (
          <GeminiChat 
            productos={productos} 
            onClose={() => setShowGeminiChat(false)} 
          />
        )}
      </section>
    </>
  );
};

export default Catalogo;
