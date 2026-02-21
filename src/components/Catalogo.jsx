import React, { useState, useEffect } from "react";
import { subscribeToProducts } from "../services/product.service";
import { subscribeToConfig } from "../services/config.service";
import ProductCard from "./ProductCard";
import { Container, Row, Col, Form, Spinner, Card, Button, Offcanvas, Badge } from 'react-bootstrap';
import { useWhatsappNumber } from "../contexts/WhatsappNumberContext";
import { useCart } from "../contexts/CartContext";
// import CompareModal from "./CompareModal"; // Removed for lazy loading
import HeroCarousel from "./HeroCarousel";

// Lazy loading modals
const WelcomeModal = React.lazy(() => import('./WelcomeModal'));
const CompareModal = React.lazy(() => import('./CompareModal'));

function Catalogo() {
  const [productos, setProductos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtroMarca, setFiltroMarca] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [ordenamiento, setOrdenamiento] = useState("default");
  const [showWelcome, setShowWelcome] = useState(false);
  const [businessName, setBusinessName] = useState("");

  // === Asistente de recomendaciones (estado y helpers) ===
  const [showAgent, setShowAgent] = useState(false);
  const [answers, setAnswers] = useState({});
  const [stepIndex, setStepIndex] = useState(0);       // ✅ corregido
  const [customBudget, setCustomBudget] = useState(false);
  const [customMin, setCustomMin] = useState("");
  const [customMax, setCustomMax] = useState("");

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

    return coincideBusqueda && coincideMarca;
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
            <Card className="search-card p-4">
              <Row className="g-3 align-items-center">
                <Col md={6} lg={5}>
                  <Form.Control
                    type="text"
                    placeholder="Buscar por nombre o descripción..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    size="lg"
                  />
                </Col>
                <Col md={3} lg={3}>
                  <Form.Select
                    value={filtroMarca}
                    onChange={(e) => setFiltroMarca(e.target.value)}
                    size="lg"
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
                <Col md={3} lg={4}>
                  <Form.Select
                    value={ordenamiento}
                    onChange={(e) => setOrdenamiento(e.target.value)}
                    size="lg"
                  >
                    <option value="default">Ordenar por...</option>
                    <option value="price_asc">Precio: Menor a Mayor</option>
                    <option value="price_desc">Precio: Mayor a Menor</option>
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

        {/* Asistente de recomendaciones */}
        <Offcanvas show={showAgent} onHide={() => setShowAgent(false)} placement="end" scroll backdrop>
          <Offcanvas.Header closeButton>
            <Offcanvas.Title>
              <i className="bi bi-chat-dots me-2"></i>
              Asistente de recomendaciones
            </Offcanvas.Title>
          </Offcanvas.Header>
          <Offcanvas.Body className="d-flex flex-column">
            {stepIndex < steps.length ? (
              <>
                <p className="text-muted mb-2">Te haré unas preguntas rápidas para sugerirte el mejor equipo.</p>
                <h6 className="mb-3">{currentStep.q}</h6>

                {currentStep.key === "presupuesto" && customBudget ? (
                  <div className="mb-3">
                    <div className="d-flex gap-2">
                      <Form.Control type="number" placeholder="Mín (COP)" value={customMin} onChange={(e) => setCustomMin(e.target.value)} />
                      <Form.Control type="number" placeholder="Máx (COP)" value={customMax} onChange={(e) => setCustomMax(e.target.value)} />
                    </div>
                    <Button className="mt-2" onClick={() => {
                      const min = parseInt(customMin, 10) || "";
                      const max = parseInt(customMax, 10) || "";
                      if (!min && !max) return;
                      setAnswers((prev) => ({ ...prev, presupuesto: `personal:${min || ''}-${max || ''}` }));
                      setStepIndex((i) => i + 1);
                    }}>Confirmar rango</Button>
                    <Button variant="link" className="mt-2" onClick={() => { setCustomBudget(false); setCustomMin(""); setCustomMax(""); }}>Volver</Button>
                  </div>
                ) : (
                  <div className="d-flex flex-wrap gap-2">
                    {currentStep.options.map((opt) => (
                      <Button key={opt} variant="outline-primary" onClick={() => handlePick(opt)}>
                        {opt}
                      </Button>
                    ))}
                    {currentStep.key === "presupuesto" && (
                      <Button variant="outline-secondary" onClick={() => setCustomBudget(true)}>
                        Personalizado…
                      </Button>
                    )}
                  </div>
                )}

                {stepIndex > 0 && (
                  <div className="mt-3">
                    {Object.entries(answers).map(([k, v]) => (
                      <Badge key={k} bg="light" text="dark" className="me-2">{v}</Badge>
                    ))}
                    <Button variant="link" className="ms-1" onClick={resetFlow}>Cambiar respuestas</Button>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h6 className="mb-0">Resultados {agentResults?.length ? `(${agentResults.length})` : ''}</h6>
                  <Button size="sm" variant="link" onClick={resetFlow}>Volver a preguntas</Button>
                </div>

                {compareIds.length > 0 && (
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <small className="text-muted">Seleccionados para comparar: {compareIds.length}/3</small>
                    <Button size="sm" variant="warning" onClick={() => setShowCompare(true)}>
                      <i className="bi bi-columns-gap me-1"></i> Ver comparación
                    </Button>
                    <Button size="sm" variant="link" onClick={() => setCompareIds([])}>Limpiar</Button>
                  </div>
                )}

                {agentResults.length === 0 ? (
                  <p className="text-muted">No encontré equipos con esos criterios. Prueba ajustando el presupuesto o la marca.</p>
                ) : (
                  agentResults.map((p) => (
                    <Card key={p.id} className="mb-3">
                      <Card.Body>
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <Card.Title className="mb-1">{p.nombre}</Card.Title>
                            <Card.Text className="mb-1">Contado: {(Number(p.contado) || 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}</Card.Text>
                            {p.solo12Meses && p.cuotas12 ? (
                              <Card.Text className="mb-0">
                                <Badge bg="info">12 meses</Badge> {Number(p.cuotas12).toLocaleString('es-CO')}/mes
                              </Card.Text>
                            ) : (
                              <>
                                {p.cuotas6 && <Card.Text className="mb-0">16 quincenales: {Number(p.cuotas6).toLocaleString('es-CO')}</Card.Text>}
                                {p.cuotas8 && <Card.Text>8 mensuales: {Number(p.cuotas8).toLocaleString('es-CO')}</Card.Text>}
                              </>
                            )}
                          </div>
                          {p.imagen && (
                            <img src={p.imagen} alt={p.nombre} style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} loading="lazy" />
                          )}
                        </div>

                        {/* Acciones rápidas */}
                        <div className="mt-2 d-flex flex-wrap gap-2">
                          {addToCart && (
                            <Button size="sm" variant="outline-primary" onClick={() => addToCart(p)}>
                              <i className="bi bi-bag-plus me-1"></i> Agregar al carrito
                            </Button>
                          )}
                          <Button size="sm" variant={isCompared(p.id) ? 'warning' : 'outline-secondary'} onClick={() => toggleCompare(p)}>
                            <i className="bi bi-columns-gap me-1"></i> {isCompared(p.id) ? 'Quitar de comparación' : 'Comparar'}
                          </Button>
                          {currentWhatsappNumber && (
                            <Button size="sm" variant="success" onClick={() => window.open(waLink(currentWhatsappNumber, p), "_blank", "noopener,noreferrer")}>
                              <i className="bi bi-whatsapp me-1"></i> Cotizar
                            </Button>
                          )}
                        </div>
                      </Card.Body>
                    </Card>
                  ))
                )}
              </>
            )}
          </Offcanvas.Body>

          {/* Modal de comparación */}
          <React.Suspense fallback={null}>
            <CompareModal
              show={showCompare}
              onHide={() => setShowCompare(false)}
              items={agentResults.filter(r => compareIds.includes(r.id)).slice(0, 3)}
            />
          </React.Suspense>
        </Offcanvas>

        {/* Botón flotante del asistente (estilo/posición igual al carrito) */}
        <Button
          variant="primary"
          className="floating-chat-btn rounded-circle"
          onClick={() => setShowAgent(true)}
          aria-label="Abrir asistente de recomendaciones"
        >
          <i className="bi bi-chat-dots"></i>
        </Button>
      </div>
    </>
  );
}

export default Catalogo;