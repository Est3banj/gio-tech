// src/components/GeminiChat.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Button, Form, Card, Badge } from 'react-bootstrap';
import { askAssistant, generateWhatsAppMessage } from '../services/ai-assistant.service';
import { useWhatsappNumber } from '../contexts/whatsapp-number-context';
import { useCart } from '../contexts/cart-context';
import { formatPrice } from '../utils/formatters';
import { extractMatchedProducts } from '../utils/product-matcher';
import type { Product, ChatMessage } from '../types';
import type { MatchedProduct } from '../utils/product-matcher';

interface GeminiChatProps {
  productos: Product[];
  onClose: () => void;
}

const GIO_COLOR = '#0d6efd';

const GeminiChat: React.FC<GeminiChatProps> = ({ productos, onClose }) => {
  const [mensajes, setMensajes] = useState<ChatMessage[]>([
    {
      rol: 'asistente',
      texto: '¡Hola! 👋 Soy el asistente de GIO TECH. ¿Qué celular estás buscando? Puedo ayudarte a encontrar el indicado según tu presupuesto y necesidades.'
    }
  ]);
  const [inputUsuario, setInputUsuario] = useState('');
  const [cargando, setCargando] = useState(false);
  const [productosMatcheados, setProductosMatcheados] = useState<
    Record<number, MatchedProduct[]>
  >({});
  const chatRef = useRef<HTMLDivElement>(null);
  const phoneNumber = useWhatsappNumber();
  const { addToCart } = useCart();

  // Scroll al fondo
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [mensajes, productosMatcheados]);

  // Matcher de productos en mensajes del asistente (salta el saludo inicial)
  useEffect(() => {
    const lastIdx = mensajes.length - 1;
    const lastMsg = mensajes[lastIdx];

    if (lastMsg?.rol === 'asistente' && lastMsg.texto && lastIdx > 0) {
      if (productosMatcheados[lastIdx] === undefined) {
        const matched = extractMatchedProducts(lastMsg.texto, productos);
        setProductosMatcheados(prev => ({
          ...prev,
          [lastIdx]: matched,
        }));
      }
    }
  }, [mensajes, productos, productosMatcheados]);

  const handleEnviar = async () => {
    if (!inputUsuario.trim() || cargando) return;

    const pregunta = inputUsuario.trim();
    setInputUsuario('');

    setMensajes(prev => [...prev, { rol: 'usuario', texto: pregunta }]);
    setCargando(true);

    const historial = mensajes.slice(-6);

    try {
      const respuesta = await askAssistant(pregunta, productos, historial, phoneNumber);
      setMensajes(prev => [...prev, { rol: 'asistente', texto: respuesta }]);
    } catch (error) {
      console.error("Error en chat:", error);
      setMensajes(prev => [...prev, {
        rol: 'asistente',
        texto: 'Lo siento, tuve un problema al procesar tu solicitud. ¿Podrías intentarlo de nuevo?'
      }]);
    } finally {
      setCargando(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEnviar();
    }
  };

  const handleWhatsApp = () => {
    if (!phoneNumber) return;

    const lastAssistantIdx = [...mensajes].reverse().findIndex(m => m.rol === 'asistente');
    const lastAssistantIndex = lastAssistantIdx >= 0
      ? mensajes.length - 1 - lastAssistantIdx
      : -1;

    const lastProducts = lastAssistantIndex >= 0 && productosMatcheados[lastAssistantIndex]
      ? productosMatcheados[lastAssistantIndex].map(mp => mp.product)
      : [];

    const mensaje = generateWhatsAppMessage(lastProducts);
    window.open(`https://wa.me/${phoneNumber}?text=${mensaje}`, '_blank');
  };

  // ── Render ──────────────────────────────────────────────

  return (
    <>
      {/* Estilos embebidos para el typing dots */}
      <style>{`
        .typing-dots {
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        .typing-dots span {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #6c757d;
          animation: typing-dot 1.4s infinite ease-in-out both;
        }
        .typing-dots span:nth-child(1) { animation-delay: -0.32s; }
        .typing-dots span:nth-child(2) { animation-delay: -0.16s; }
        .typing-dots span:nth-child(3) { animation-delay: 0s; }
        @keyframes typing-dot {
          0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1); }
        }
        .chat-product-card {
          transition: box-shadow 0.2s ease, transform 0.2s ease;
          cursor: default;
        }
        .chat-product-card:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.12) !important;
          transform: translateY(-1px);
        }
        .chat-product-card .btn {
          transition: transform 0.15s ease;
        }
        .chat-product-card .btn:hover {
          transform: scale(1.1);
        }
      `}</style>

      <Card className="gemini-chat-card" style={{
        position: 'fixed',
        bottom: '90px',
        right: '20px',
        width: '380px',
        maxWidth: 'calc(100vw - 40px)',
        maxHeight: '520px',
        zIndex: 1050,
        boxShadow: '0 12px 48px rgba(0,0,0,0.25)',
        borderRadius: '16px',
        overflow: 'hidden',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}>
        {/* ── HEADER ── */}
        <Card.Header style={{
          background: '#fff',
          color: '#212529',
          padding: '14px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #e9ecef',
        }}>
          <div className="d-flex align-items-center gap-2">
            {/* Avatar circular con iniciales */}
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: GIO_COLOR,
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.85rem',
              flexShrink: 0,
            }}>
              GT
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem', lineHeight: 1.2 }}>
                GIO TECH
              </div>
              <div className="d-flex align-items-center gap-1" style={{ fontSize: '0.75rem', color: '#6c757d' }}>
                <span style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  background: '#198754',
                  display: 'inline-block',
                }} />
                En línea
              </div>
            </div>
          </div>
          <Button
            variant="link"
            onClick={onClose}
            style={{ color: '#6c757d', textDecoration: 'none', padding: '4px', lineHeight: 1 }}
            title="Cerrar"
          >
            <i className="bi bi-x-lg" style={{ fontSize: '1.1rem' }} />
          </Button>
        </Card.Header>

        {/* ── CHAT ── */}
        <div
          ref={chatRef}
          style={{
            height: '320px',
            overflowY: 'auto',
            padding: '16px',
            background: '#f8f9fa',
          }}
        >
          {mensajes.map((msg, index) => (
            <div key={index} className="mb-3">
              {/* Burbuja del asistente con avatar */}
              {msg.rol === 'asistente' && (
                <div className="d-flex gap-2 align-items-start">
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: GIO_COLOR,
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.65rem',
                    flexShrink: 0,
                    marginTop: '2px',
                  }}>
                    GT
                  </div>
                  <div style={{ maxWidth: 'calc(100% - 36px)' }}>
                    <div style={{
                      display: 'inline-block',
                      padding: '10px 14px',
                      borderRadius: '14px 14px 14px 4px',
                      background: '#fff',
                      color: '#212529',
                      textAlign: 'left',
                      fontSize: '0.9rem',
                      lineHeight: '1.5',
                      whiteSpace: 'pre-wrap',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                      border: '1px solid #e9ecef',
                    }}>
                      {msg.texto}
                    </div>
                  </div>
                </div>
              )}

              {/* Burbuja del usuario */}
              {msg.rol === 'usuario' && (
                <div className="text-end">
                  <div style={{
                    display: 'inline-block',
                    maxWidth: '85%',
                    padding: '10px 14px',
                    borderRadius: '14px 14px 4px 14px',
                    background: GIO_COLOR,
                    color: '#fff',
                    textAlign: 'left',
                    fontSize: '0.9rem',
                    lineHeight: '1.5',
                    whiteSpace: 'pre-wrap',
                    boxShadow: '0 1px 4px rgba(13,110,253,0.15)',
                  }}>
                    {msg.texto}
                  </div>
                </div>
              )}

              {/* Cards de productos */}
              {msg.rol === 'asistente' && productosMatcheados[index]?.length > 0 && (
                <div className="d-flex flex-column gap-2 mt-2" style={{ marginLeft: '36px' }}>
                  {productosMatcheados[index].map(mp => (
                    <Card
                      key={mp.product.id}
                      className="chat-product-card border-0 shadow-sm"
                      style={{ borderRadius: '10px', overflow: 'hidden' }}
                    >
                      <div className="d-flex align-items-center p-2">
                        {mp.product.imagen && (
                          <img
                            src={mp.product.imagen}
                            alt={mp.product.nombre}
                            style={{
                              width: '70px',
                              height: '70px',
                              objectFit: 'cover',
                              borderRadius: '8px',
                            }}
                          />
                        )}
                        <div className="ms-2 flex-grow-1" style={{ minWidth: 0 }}>
                          <div className="fw-semibold small text-truncate">
                            {mp.product.nombre}
                          </div>
                          <Badge
                            bg="primary"
                            className="mt-1"
                            style={{ fontSize: '0.75rem', fontWeight: 600 }}
                          >
                            {formatPrice(mp.product.contado)}
                          </Badge>
                        </div>
                        <div className="d-flex gap-1 flex-shrink-0 ms-1">
                          <Button
                            size="sm"
                            variant="success"
                            title="Consultar por WhatsApp"
                            style={{ width: '34px', height: '34px', borderRadius: '50%', padding: 0 }}
                            onClick={() => {
                              const msg = encodeURIComponent(
                                `Hola, me interesa el ${mp.product.nombre} (${formatPrice(mp.product.contado)})`
                              );
                              window.open(`https://wa.me/${phoneNumber}?text=${msg}`, '_blank');
                            }}
                          >
                            <i className="bi bi-whatsapp" style={{ fontSize: '0.9rem' }} />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline-primary"
                            title="Agregar al carrito"
                            style={{ width: '34px', height: '34px', borderRadius: '50%', padding: 0 }}
                            onClick={() => addToCart(mp.product, 'contado')}
                          >
                            <i className="bi bi-cart-plus" style={{ fontSize: '0.9rem' }} />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Typing indicator animado */}
          {cargando && (
            <div className="d-flex gap-2 align-items-start mb-3">
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: GIO_COLOR,
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.65rem',
                flexShrink: 0,
                marginTop: '2px',
              }}>
                GT
              </div>
              <div style={{
                display: 'inline-block',
                padding: '12px 16px',
                borderRadius: '14px 14px 14px 4px',
                background: '#fff',
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                border: '1px solid #e9ecef',
              }}>
                <div className="typing-dots">
                  <span /><span /><span />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── FOOTER ── */}
        <Card.Footer style={{
          padding: '12px',
          background: '#fff',
          borderTop: '1px solid #e9ecef',
        }}>
          <Form onSubmit={(e) => { e.preventDefault(); handleEnviar(); }}>
            <div className="d-flex gap-2 align-items-center">
              <Form.Control
                type="text"
                placeholder="Pregunta por tu celular ideal..."
                value={inputUsuario}
                onChange={(e) => setInputUsuario(e.target.value)}
                onKeyDown={handleKeyPress}
                disabled={cargando}
                style={{
                  borderRadius: '20px',
                  border: '1px solid #dee2e6',
                  fontSize: '0.9rem',
                  padding: '8px 14px',
                  boxShadow: 'none',
                }}
              />
              <Button
                type="submit"
                disabled={cargando || !inputUsuario.trim()}
                style={{
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  background: GIO_COLOR,
                  border: 'none',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <i className="bi bi-send-fill" style={{ fontSize: '1rem', color: '#fff' }} />
              </Button>
            </div>
          </Form>
          <div className="text-center mt-2">
            <Button
              variant="link"
              size="sm"
              onClick={handleWhatsApp}
              style={{ color: '#6c757d', fontSize: '0.75rem', textDecoration: 'none' }}
            >
              <i className="bi bi-whatsapp me-1" style={{ color: '#25D366' }} />
              Hablar con un asesor
            </Button>
          </div>
        </Card.Footer>
      </Card>
    </>
  );
};

export default GeminiChat;
