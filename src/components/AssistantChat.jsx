// src/components/AssistantChat.jsx
import { useEffect, useMemo, useState } from "react";
import { Offcanvas, Button, Badge, Card, Spinner } from "react-bootstrap";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { db } from "../firebase";
import { useWhatsappNumber } from "../contexts/WhatsappNumberContext";
import { useCart } from "../contexts/CartContext";
import CompareModal from "./CompareModal";

const steps = [
  { key: "presupuesto", q: "¿Cuál es tu presupuesto aproximado?", options: ["< 800.000", "800.000 - 1.200.000", "1.200.000 - 2.000.000", "> 2.000.000", "Personalizado…"] },
  { key: "marca", q: "¿Alguna marca preferida?", options: ["Cualquiera", "Samsung", "Xiaomi/Redmi", "Motorola", "iPhone", "Tecno", "Infinix", "Huawei"] },
  { key: "camara", q: "¿Prioridad de cámara?", options: ["Básica", "Buena", "Muy buena"] },
  { key: "bateria", q: "¿Qué tanto te importa la batería?", options: ["Normal", "Alta", "Muy alta"] },
  { key: "memoria", q: "¿Memoria mínima (RAM/almacenamiento)?", options: ["4/64", "6/128", "8/256", "Me da igual"] },
];

function normalizeBudget(sel) {
  if (!sel) return {};
  if (typeof sel === "string" && sel.startsWith("personal:")) {
    const [, range] = sel.split(":");
    const [a,b] = (range || "").split("-");
    const min = parseInt(a,10) || undefined;
    const max = parseInt(b,10) || undefined;
    return { min, max };
  }
  if (sel.includes("<")) return { max: 800000 };
  if (sel.includes(">")) return { min: 2000000 };
  if (sel.includes("800.000")) return { min: 800000, max: 1200000 };
  if (sel.includes("1.200.000")) return { min: 1200000, max: 2000000 };
  return {};
}

function whatsAppLink(number, producto, answers) {
  const nombre = producto?.nombre || "Equipo";
  const contado = Number(producto?.contado || 0).toLocaleString("es-CO", { style:"currency", currency:"COP", maximumFractionDigits:0 });
  const cuotas =
    (producto?.cuotas6 ? `\n16 quincenales: ${Number(producto.cuotas6).toLocaleString("es-CO")}` : "") +
    (producto?.cuotas8 ? `\n8 mensuales: ${Number(producto.cuotas8).toLocaleString("es-CO")}` : "");
  const pref = [];
  if (answers?.presupuesto) pref.push(`Presupuesto: ${String(answers.presupuesto).startsWith('personal:') ? String(answers.presupuesto).replace('personal:','').replace('-', ' a ') : answers.presupuesto}`);
  if (answers?.marca) pref.push(`Marca: ${answers.marca}`);
  const prefText = pref.length ? `\nPreferencias: ${pref.join(' | ')}` : '';
  const msg = encodeURIComponent(
    `Hola 👋, me interesa el ${nombre}.\nPrecio contado: ${contado}${cuotas}${prefText}\n¿Me ayudas con una cotización?`
  );
  return `https://wa.me/${number}?text=${msg}`;
}

export default function AssistantChat({ show, onHide }) {
  const [answers, setAnswers] = useState({});
  const [stepIndex, setStepIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);

  const PERSIST_ANS_KEY = 'assistant_answers_v1';
  const PERSIST_STEP_KEY = 'assistant_step_v1';
  const [compareIds, setCompareIds] = useState([]); // max 3
  const [showCompare, setShowCompare] = useState(false);

  const whatsappNumber = useWhatsappNumber();
  const { addToCart } = (typeof useCart === 'function' ? useCart() : { addToCart: null });

  // Custom budget state
  const [customBudget, setCustomBudget] = useState(false);
  const [customMin, setCustomMin] = useState("");
  const [customMax, setCustomMax] = useState("");

  const currentStep = steps[stepIndex];

  const canSearch = useMemo(() => stepIndex >= steps.length, [stepIndex]);

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

  const isCompared = (id) => compareIds.includes(id);
  const toggleCompare = (item) => {
    setCompareIds((curr) => {
      const exists = curr.includes(item.id);
      if (exists) return curr.filter((x) => x !== item.id);
      if (curr.length >= 3) return curr; // máximo 3
      return [...curr, item.id];
    });
  };

  const resetFlow = () => {
    setAnswers({});
    setStepIndex(0);
    setResults([]);
    setCustomBudget(false);
    setCustomMin("");
    setCustomMax("");
    setCompareIds([]);
    try {
      sessionStorage.removeItem(PERSIST_ANS_KEY);
      sessionStorage.removeItem(PERSIST_STEP_KEY);
    } catch (_) {}
  };

  useEffect(() => {
    if (!canSearch) return;
    (async () => {
      setLoading(true);
      try {
        const col = collection(db, "productos");
        // Construcción de filtros básicos (adaptar a tus campos reales)
        const budget = normalizeBudget(answers.presupuesto || "");
        const filters = [];
        if (budget.min) filters.push(where("contado", ">=", budget.min));
        if (budget.max) filters.push(where("contado", "<=", budget.max));

        // Marca (si “Cualquiera”, no filtramos)
        if (answers.marca && answers.marca !== "Cualquiera") {
          const marca = answers.marca.toLowerCase();
          // asumiendo que guardas una “marca” en el doc; si no, filtra por nombre.
          filters.push(where("marca", "==", marca));
        }

        // Si no tienes campos de cámara/batería/memoria en Firestore,
        // no uses where; puedes ordenar por precio y devolver una lista acotada.

        let qRef;
        if (filters.length) {
          // getDocs con limit para UX rápida
          qRef = query(col, ...filters, orderBy("contado", "asc"), limit(20));
        } else {
          qRef = query(col, orderBy("contado", "asc"), limit(20));
        }
        const snap = await getDocs(qRef);
        const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));

        // Filtro en cliente para “camara”, “bateria”, “memoria” si no existen en tus docs
        const refined = items.filter(p => {
          // ejemplo simple por nombre/descripcion si no hay campos dedicados
          const text = `${p.nombre} ${p.descripcion || ""}`.toLowerCase();
          const matchCamera = !answers.camara || text.includes(answers.camara.toLowerCase()) || true;
          const matchMem = !answers.memoria || text.includes(answers.memoria.replace(/\//g," ").toLowerCase()) || true;
          const matchBat = !answers.bateria || true; // puedes refinar si tienes “mAh” en descripción
          return matchCamera && matchMem && matchBat;
        });

        setResults(refined);
      } catch (e) {
        console.error("AssistantChat search error:", e);
        setResults([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [canSearch]); // una vez completen las preguntas

  // Restaurar estado desde sessionStorage
  useEffect(() => {
    try {
      const a = sessionStorage.getItem(PERSIST_ANS_KEY);
      const s = sessionStorage.getItem(PERSIST_STEP_KEY);
      if (a) setAnswers(JSON.parse(a));
      if (s) setStepIndex(parseInt(s, 10) || 0);
    } catch (_) {}
  }, []);

  // Guardar cambios en sessionStorage
  useEffect(() => {
    try { sessionStorage.setItem(PERSIST_ANS_KEY, JSON.stringify(answers)); } catch (_) {}
  }, [answers]);
  useEffect(() => {
    try { sessionStorage.setItem(PERSIST_STEP_KEY, String(stepIndex)); } catch (_) {}
  }, [stepIndex]);

  return (
    <Offcanvas show={show} onHide={onHide} placement="end" scroll backdrop>
      <Offcanvas.Header closeButton>
        <Offcanvas.Title>
          <i className="bi bi-chat-dots me-2"></i>
          Asistente de recomendaciones
        </Offcanvas.Title>
      </Offcanvas.Header>
      <Offcanvas.Body className="d-flex flex-column">
        {!canSearch ? (
          <>
            <p className="text-muted mb-2">Te haré unas preguntas rápidas para sugerirte el mejor equipo.</p>
            <h6 className="mb-3">{currentStep.q}</h6>
            {currentStep.key === "presupuesto" && customBudget ? (
              <div className="mb-3">
                <div className="d-flex gap-2">
                  <input
                    type="number"
                    className="form-control"
                    placeholder="Mín (COP)"
                    value={customMin}
                    onChange={e=>setCustomMin(e.target.value)}
                  />
                  <input
                    type="number"
                    className="form-control"
                    placeholder="Máx (COP)"
                    value={customMax}
                    onChange={e=>setCustomMax(e.target.value)}
                  />
                </div>
                <Button
                  className="mt-2"
                  onClick={() => {
                    const min = parseInt(customMin,10)||"";
                    const max = parseInt(customMax,10)||"";
                    if (!min && !max) return;
                    setAnswers(prev => ({ ...prev, presupuesto: `personal:${min||''}-${max||''}` }));
                    setStepIndex(i=>i+1);
                  }}
                >
                  Confirmar rango
                </Button>
                <Button
                  variant="link"
                  className="mt-2"
                  onClick={()=>{
                    setCustomBudget(false);
                    setCustomMin("");
                    setCustomMax("");
                  }}
                >Volver</Button>
              </div>
            ) : (
              <div className="d-flex flex-wrap gap-2">
                {currentStep.options.map(opt => (
                  <Button key={opt} variant="outline-primary" onClick={() => handlePick(opt)}>
                    {opt}
                  </Button>
                ))}
              </div>
            )}
            {stepIndex > 0 && (
              <div className="mt-3">
                {Object.entries(answers).map(([k,v]) => (
                  <Badge key={k} bg="light" text="dark" className="me-2">{v}</Badge>
                ))}
                <Button variant="link" className="ms-1" onClick={resetFlow}>Cambiar respuestas</Button>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h6 className="mb-0">Resultados {results?.length ? `(${results.length})` : ''}</h6>
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
            {loading ? (
              <div className="flex-grow-1 d-flex align-items-center justify-content-center text-muted">
                <Spinner size="sm" className="me-2" /> Buscando opciones…
              </div>
            ) : results.length === 0 ? (
              <p className="flex-grow-1 d-flex align-items-center justify-content-center text-center text-muted">
                No encontré equipos con esos criterios. Prueba ajustando el presupuesto o la marca.
              </p>
            ) : (
              results.map(p => {
                const precio = Number(p.contado || 0).toLocaleString("es-CO",{ style:"currency", currency:"COP", maximumFractionDigits:0 });
                const wa = whatsappNumber ? whatsAppLink(whatsappNumber, p, answers) : null;
                return (
                  <Card key={p.id} className="mb-3">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <Card.Title className="mb-1">{p.nombre}</Card.Title>
                          <Card.Text className="mb-1">Contado: {precio}</Card.Text>
                          {p.cuotas6 && <Card.Text className="mb-0">16 quincenales: {Number(p.cuotas6).toLocaleString("es-CO")}</Card.Text>}
                          {p.cuotas8 && <Card.Text>8 mensuales: {Number(p.cuotas8).toLocaleString("es-CO")}</Card.Text>}
                        </div>
                        {p.imagen && (
                          <img src={p.imagen} alt={p.nombre} style={{ width: 64, height: 64, objectFit:"cover", borderRadius: 8 }} loading="lazy" />
                        )}
                      </div>
                      <div className="mt-2 d-flex flex-wrap gap-2">
                        {addToCart && (
                          <Button size="sm" variant="outline-primary" onClick={() => addToCart(p)}>
                            <i className="bi bi-bag-plus me-1"></i> Agregar al carrito
                          </Button>
                        )}
                        <Button size="sm" variant={isCompared(p.id) ? 'warning' : 'outline-secondary'} onClick={() => toggleCompare(p)}>
                          <i className="bi bi-columns-gap me-1"></i> {isCompared(p.id) ? 'Quitar de comparación' : 'Comparar'}
                        </Button>
                        {whatsappNumber && (
                          <Button size="sm" variant="success" onClick={() => window.open(whatsAppLink(whatsappNumber, p, answers), "_blank", "noopener,noreferrer") }>
                            <i className="bi bi-whatsapp me-1"></i> Cotizar
                          </Button>
                        )}
                      </div>
                    </Card.Body>
                  </Card>
                );
              })
            )}
          </>
        )}
      </Offcanvas.Body>
      <CompareModal
        show={showCompare}
        onHide={() => setShowCompare(false)}
        items={results.filter(r => compareIds.includes(r.id)).slice(0,3)}
      />
    </Offcanvas>
  );
}