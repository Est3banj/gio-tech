import React, { useState, useEffect } from "react";
import { subscribeToProducts } from "../services/product.service";
import { subscribeToConfig } from "../services/config.service";
import ProductCard from "./ProductCard";
import { Container, Row, Col, Form, Spinner, Card, Button, Offcanvas, Badge } from 'react-bootstrap';
import { useWhatsappNumber } from "../contexts/WhatsappNumberContext";
import { useCart } from "../contexts/CartContext";
// import CompareModal from "./CompareModal"; // Removed for lazy loading
import HeroCarousel from "./HeroCarousel";
import GeminiChat from "./GeminiChat";

// Lazy loading modals
const WelcomeModal = React.lazy(() => import('./WelcomeModal'));
const CompareModal = React.lazy(() => import('./CompareModal'));

function Catalogo() {
  const [productos, setProductos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtroMarca, setFiltroMarca] = useState("");
  const [filtroPrecio, setFiltroPrecio] = useState("");
  const [isLoading, setIsLoading] = useState(true);
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

  // === Asistente de recomendaciones (estado y helpers) ===
  const [showAgent, setShowAgent] = useState(false);
  const [answers, setAnswers] = useState({});
  const [stepIndex, setStepIndex] = useState(0);       // ✅ corregido
  const [customBudget, setCustomBudget] = useState(false);
  const [customMin, setCustomMin] = useState("");
  const [customMax, setCustomMax] = useState("");

  // === Asistente IA Gemini ===
  const [showGeminiChat, setShowGeminiChat] = useState(false);

  // Persistencia + Comparación
  const PERSIST_ANS_KEY = 'assistant_answers_v1';
  const PERSIST_STEP_KEY = 'assistant_step_v1';
  const [compareIds, setCompareIds] = useState([]); // max 3
  const [showCompare, setShowCompare] = useState(false);

  const steps = [
    { key: "presupuesto", q: "¿Cuál es tu presupuesto aproximado?", options: ["< 800.000", "800.000 - 1.200.000", "1.200.000 - 2.000.000", "> 2.000.000", "Personalizado…"] },
    { key: "marca", q: "¿Alguna marca preferida?", options: ["Cualquiera", "Samsung", "Xiaomi/Redmi", "Motorola", "iPhone", "Tecno", "Infinix", "Huawei"] },
  ];

  const currentStep = steps[stepIndex];

  const normalizeBudget = (sel) => {
    if (!sel) return {};
    if (typeof sel === "string" && sel.startsWith("personal:")) {
      const [, range] = sel.split(":");
      const [a, b] = (range || "").split("-");
      const min = parseInt(a, 10) || undefined;
      const max = parseInt(b, 10) || undefined;
      return { min, max };
    }
    if (sel.includes("<")) return { max: 800000 };
    if (sel.includes(">")) return { min: 2000000 };
    if (sel.includes("800.000")) return { min: 800000, max: 1200000 };
    if (sel.includes("1.200.000")) return { min: 1200000, max: 2000000 };
    return {};
  };

  const handlePick = (opt) => {
    const key = currentStep.key;
    if (key === "presupuesto" && opt.startsWith("Personalizado")) {
      setCustomBudget(true);
      return;
    }
    const next = { ...answers, [key]: opt };
    setAnswers(next);
    setStepIndex((i) => i + 1);
  };

  const resetFlow = () => {
    setAnswers({});
    setStepIndex(0);
    setCustomBudget(false);
    setCustomMin("");
    setCustomMax("");
    setCompareIds([]);
    try {
      sessionStorage.removeItem(PERSIST_ANS_KEY);
      sessionStorage.removeItem(PERSIST_STEP_KEY);
    } catch (_) { }
  };

  // Comparación helpers
  const isCompared = (id) => compareIds.includes(id);
  const toggleCompare = (item) => {
    setCompareIds((curr) => {
      const exists = curr.includes(item.id);
      if (exists) return curr.filter((x) => x !== item.id);
      if (curr.length >= 3) return curr; // máximo 3
      return [...curr, item.id];
    });
  };

  const currentWhatsappNumber = useWhatsappNumber();
  const { addToCart } = (typeof useCart === 'function' ? useCart() : { addToCart: null });

  const toCOP = (n) => (Number(n || 0)).toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
  const waLink = (number, p) => {
    if (!number) return null;
    const cuotas = p?.solo12Meses && p?.cuotas12
      ? `\n12 cuotas mensuales: ${Number(p.cuotas12).toLocaleString("es-CO")}`
      : (p?.cuotas6 ? `\n16 quincenales: ${Number(p.cuotas6).toLocaleString("es-CO")}` : "") +
      (p?.cuotas8 ? `\n8 mensuales: ${Number(p.cuotas8).toLocaleString("es-CO")}` : "");
    const pref = [];
    if (answers?.presupuesto) pref.push(`Presupuesto: ${answers.presupuesto.startsWith('personal:') ? answers.presupuesto.replace('personal:', '').replace('-', ' a ') : answers.presupuesto}`);
    if (answers?.marca) pref.push(`Marca: ${answers.marca}`);
    const prefText = pref.length ? `\nPreferencias: ${pref.join(' | ')}` : '';
    const msg = encodeURIComponent(`Hola 👋, me interesa el ${p?.nombre} (Contado: ${toCOP(p?.contado)}).${cuotas}${prefText}\n¿Me ayudas con una cotización?`);
    return `https://wa.me/${number}?text=${msg}`;
  };

  const normalizarTexto = (texto) => {
    if (typeof texto !== 'string') return '';
    return texto
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\x20-\x7E]/g, "")
      .trim();
  };

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = subscribeToProducts(
      (lista) => {
        setProductos(lista);
        setIsLoading(false);
      },
      (error) => {
        // Error handling is already logged in service, but we can stop loading
        setIsLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    try {
      const seen = sessionStorage.getItem('gio_welcome_seen_sess_v1');
      setShowWelcome(!seen);
    } catch (e) {
      setShowWelcome(true);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToConfig(
      (data) => {
        setBusinessName((data && data.nombre) ? data.nombre : "");
      },
      (err) => {
        setBusinessName("");
      }
    );
    return () => unsubscribe();
  }, []);


  // Persistencia del asistente
  useEffect(() => {
    try {
      const a = sessionStorage.getItem(PERSIST_ANS_KEY);
      const s = sessionStorage.getItem(PERSIST_STEP_KEY);
      if (a) setAnswers(JSON.parse(a));
      if (s) setStepIndex(parseInt(s, 10) || 0);
    } catch (_) { }
  }, []);

  useEffect(() => {
    try { sessionStorage.setItem(PERSIST_ANS_KEY, JSON.stringify(answers)); } catch (_) { }
  }, [answers]);

  useEffect(() => {
    try { sessionStorage.setItem(PERSIST_STEP_KEY, String(stepIndex)); } catch (_) { }
  }, [stepIndex]);

  const productosFiltrados = productos.filter((producto) => {
    const nombreNormalizado = normalizarTexto(producto.nombre);
    const descripcionNormalizada = normalizarTexto(producto.descripcion || "");
    const busquedaNormalizada = normalizarTexto(busqueda); // ✅ corregido
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

  // Resultados del asistente
  const agentResults = (() => {
    if (stepIndex < steps.length) return [];
    const budget = normalizeBudget(answers.presupuesto);
    return productosOrdenados.filter((p) => {
      const price = parseFloat(p.contado) || 0;
      const okMin = budget.min ? price >= budget.min : true;
      const okMax = budget.max ? price <= budget.max : true;
      let okBrand = true;
      if (answers.marca && answers.marca !== "Cualquiera") {
        const text = `${p.nombre} ${p.descripcion || ""}`.toLowerCase();
        okBrand = text.includes(answers.marca.toLowerCase().split("/")[0]);
      }
      return okMin && okMax && okBrand;
    }).slice(0, 20);
  })();

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