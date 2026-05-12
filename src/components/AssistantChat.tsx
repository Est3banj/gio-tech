// src/components/AssistantChat.tsx
import { useEffect, useState } from "react";
import { Offcanvas, Button, Badge, Card, Spinner, ProgressBar, Form } from "react-bootstrap";
import { searchProducts } from "../services/product.service";
import { useWhatsappNumber } from "../contexts/WhatsappNumberContext";
import { useCart } from "../contexts/CartContext";
import { formatPrice } from "../utils/formatters";
import CompareModal from "./CompareModal";
import type { Product } from "../types";

interface Step {
  key: string;
  q: string;
  options: string[];
}

interface Answers {
  presupuesto?: string;
  marca?: string;
  camara?: string;
  memoria?: string;
}

const steps: Step[] = [
  { key: "presupuesto", q: "¿Cuál es tu presupuesto aproximado?", options: ["< 800.000", "800.000 - 1.200.000", "1.200.000 - 2.000.000", "> 2.000.000", "Personalizado…"] },
  { key: "marca", q: "¿Alguna marca preferida?", options: ["Cualquiera", "Samsung", "Xiaomi/Redmi", "Motorola", "iPhone", "Tecno", "Infinix"] },
  { key: "camara", q: "¿Prioridad de cámara?", options: ["Básica", "Buena (50MP+)", "Muy buena (Gama Alta)"] },
  { key: "memoria", q: "¿Memoria mínima?", options: ["4/64 GB", "6/128 GB", "8/256 GB", "Me da igual"] },
];

interface BudgetRange {
  min?: number;
  max?: number;
}

const normalizeBudget = (sel: string | undefined): BudgetRange => {
  if (!sel) return {};
  if (typeof sel === "string" && sel.startsWith("personal:")) {
    const range = sel.split(":")[1];
    const [a, b] = range.split("-");
    return { min: parseInt(a) || 0, max: parseInt(b) || 99999999 };
  }
  if (sel.includes("<")) return { max: 800000 };
  if (sel.includes(">")) return { min: 2000000 };
  if (sel.includes("800.000")) return { min: 800000, max: 1200000 };
  if (sel.includes("1.200.000")) return { min: 1200000, max: 2000000 };
  return {};
};

const whatsAppLink = (number: string, producto: Product, answers: Answers): string => {
  const precio = formatPrice(producto?.contado);
  const text = `Hola GIO TECH 👋, el asistente me recomendó el *${producto.nombre}*.
  
*Detalles del equipo:*
💰 Precio: ${precio}
📌 Ref: ${producto.id}

*Mis preferencias:*
💵 Presupuesto: ${answers.presupuesto}
📸 Cámara: ${answers.camara}
💾 Memoria: ${answers.memoria}

¿Tienen disponibilidad inmediata?`;

  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
};

interface AssistantChatProps {
  show: boolean;
  onHide: () => void;
}

const AssistantChat: React.FC<AssistantChatProps> = ({ show, onHide }) => {
  const [answers, setAnswers] = useState<Answers>({});
  const [stepIndex, setStepIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Product[]>([]);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [showCompare, setShowCompare] = useState(false);
  const [customBudget, setCustomBudget] = useState(false);
  const [customMin, setCustomMin] = useState("");
  const [customMax, setCustomMax] = useState("");

  const whatsappNumber = useWhatsappNumber();
  const { addToCart } = useCart();

  const progress = (stepIndex / steps.length) * 100;
  const canSearch = stepIndex >= steps.length;
  const currentStep = steps[stepIndex];

  const handlePick = (opt: string) => {
    if (currentStep.key === "presupuesto" && opt.startsWith("Personalizado")) {
      setCustomBudget(true);
      return;
    }
    setAnswers(prev => ({ ...prev, [currentStep.key]: opt }));
    setStepIndex(i => i + 1);
  };

  const resetFlow = () => {
    setAnswers({});
    setStepIndex(0);
    setResults([]);
    setCustomBudget(false);
    setCompareIds([]);
  };

  useEffect(() => {
    if (!canSearch) return;
    (async () => {
      setLoading(true);
      try {
        const budget = normalizeBudget(answers.presupuesto);
        const filters = [];
        if (budget.min) filters.push({ field: "contado", op: ">=" as const, value: budget.min });
        if (budget.max) filters.push({ field: "contado", op: "<=" as const, value: budget.max });

        const items = await searchProducts(filters);

        const refined = items.filter(p => {
          const nombreLower = (p.nombre || "").toLowerCase();
          const descLower = (p.descripcion || "").toLowerCase();
          const marcaLower = (p.marca || "").toLowerCase();

          const matchMarca = !answers.marca ||
            answers.marca === "Cualquiera" ||
            marcaLower === answers.marca.toLowerCase() ||
            nombreLower.includes(answers.marca.toLowerCase());

          const memNumber = answers.memoria?.match(/\d+/);
          const matchMem = !memNumber ||
            descLower.includes(memNumber[0]) ||
            nombreLower.includes(memNumber[0]);

          let matchCam = true;
          if (answers.camara?.includes("Muy buena")) {
            matchCam = descLower.includes("50mp") || descLower.includes("108mp") || descLower.includes("gama alta") || descLower.includes("pro");
          }

          return matchMarca && matchMem && matchCam;
        });

        setResults(refined);
      } catch (e) {
        console.error("Search error:", e);
        setResults([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [canSearch, answers]);

  return (
    <Offcanvas show={show} onHide={onHide} placement="end" className="bg-light">
      <Offcanvas.Header closeButton className="border-bottom bg-white">
        <Offcanvas.Title className="fw-bold text-primary">
          <i className="bi bi-robot me-2"></i> Asistente GIO TECH
        </Offcanvas.Title>
      </Offcanvas.Header>

      <div className="px-3 pt-2 bg-white">
        <ProgressBar now={progress} variant="success" style={{ height: '6px' }} />
        <small className="text-muted d-block mt-1">
          {canSearch ? 'Búsqueda finalizada' : `Paso ${stepIndex + 1} de ${steps.length}`}
        </small>
      </div>

      <Offcanvas.Body className="d-flex flex-column">
        {!canSearch ? (
          <div className="py-2">
            <h5 className="mb-4 fw-semibold">{currentStep.q}</h5>

            {customBudget ? (
              <Card className="border-0 shadow-sm p-3">
                <Form.Group className="mb-2">
                  <Form.Control type="number" placeholder="Mínimo $" className="mb-2" value={customMin} onChange={e => setCustomMin(e.target.value)} />
                  <Form.Control type="number" placeholder="Máximo $" value={customMax} onChange={e => setCustomMax(e.target.value)} />
                </Form.Group>
                <div className="d-grid gap-2">
                  <Button variant="primary" onClick={() => {
                    if (!customMax) return;
                    setAnswers(prev => ({ ...prev, presupuesto: `personal:${customMin || 0}-${customMax}` }));
                    setStepIndex(i => i + 1);
                  }}>Confirmar Rango</Button>
                  <Button variant="link" size="sm" onClick={() => setCustomBudget(false)}>Volver</Button>
                </div>
              </Card>
            ) : (
              <div className="d-grid gap-2">
                {currentStep.options.map(opt => (
                  <Button key={opt} variant="outline-dark" className="text-start py-2 px-3 shadow-sm bg-white" onClick={() => handlePick(opt)}>
                    {opt}
                  </Button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex-grow-1">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="fw-bold m-0">Recomendaciones:</h6>
              <Button size="sm" variant="outline-secondary" onClick={resetFlow}>Reiniciar</Button>
            </div>

            {loading ? (
              <div className="text-center py-5">
                <Spinner animation="border" variant="primary" />
                <p className="mt-2 text-muted small">Analizando stock...</p>
              </div>
            ) : results.length === 0 ? (
              <Card className="text-center p-4 border-0 shadow-sm mt-3">
                <i className="bi bi-emoji-frown text-muted mb-3" style={{ fontSize: '2rem' }}></i>
                <p className="small">No encontramos un equipo exacto para esos filtros.</p>
                <Button variant="success" size="sm" onClick={() => window.open(`https://wa.me/${whatsappNumber}?text=Hola, no encontré lo que buscaba en el asistente. Me interesan estas características: ${answers.marca}, presupuesto ${answers.presupuesto}.`, "_blank")}>
                  <i className="bi bi-whatsapp me-1"></i> Hablar con un asesor
                </Button>
              </Card>
            ) : (
              results.map(p => (
                <Card key={p.id} className="mb-3 border-0 shadow-sm overflow-hidden">
                  <div className="d-flex">
                    {p.imagen && (
                      <img src={p.imagen} alt={p.nombre} style={{ width: '90px', height: '90px', objectFit: 'cover' }} />
                    )}
                    <Card.Body className="p-2 d-flex flex-column justify-content-center">
                      <h6 className="fw-bold mb-1 small">{p.nombre}</h6>
                      <div className="text-primary fw-bold mb-2 small">
                        {formatPrice(p.contado)}
                      </div>
                      <div className="d-flex gap-2">
                        <Button size="sm" variant="success" onClick={() => window.open(whatsAppLink(whatsappNumber, p, answers), "_blank")}>
                          <i className="bi bi-whatsapp"></i>
                        </Button>
                        <Button size="sm" variant="outline-primary" onClick={() => addToCart && addToCart(p, 'contado')}>
                          <i className="bi bi-cart-plus"></i>
                        </Button>
                        <Button
                          size="sm"
                          variant={compareIds.includes(p.id) ? "warning" : "outline-secondary"}
                          onClick={() => setCompareIds(prev => prev.includes(p.id) ? prev.filter(id => id !== p.id) : [...prev, p.id].slice(0, 3))}
                        >
                          <i className="bi bi-shuffle"></i>
                        </Button>
                      </div>
                    </Card.Body>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}
      </Offcanvas.Body>

      {compareIds.length > 0 && (
        <div className="p-3 border-top bg-white d-flex justify-content-between align-items-center">
          <Badge bg="warning" text="dark">{compareIds.length} seleccionados</Badge>
          <Button size="sm" variant="dark" onClick={() => setShowCompare(true)}>Comparar ahora</Button>
        </div>
      )}

      <CompareModal
        show={showCompare}
        onHide={() => setShowCompare(false)}
        items={results.filter(r => compareIds.includes(r.id))}
      />
    </Offcanvas>
  );
};

export default AssistantChat;
