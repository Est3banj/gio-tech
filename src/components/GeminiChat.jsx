// src/components/GeminiChat.jsx
// Componente de chat con IA para el asistente de ventas

import React, { useState, useRef, useEffect } from 'react';
import { Button, Form, Card, Badge } from 'react-bootstrap';
import { askGeminiAssistant, generateWhatsAppMessage } from '../services/gemini.service';
import { useWhatsappNumber } from '../contexts/WhatsappNumberContext';

function GeminiChat({ productos, onClose }) {
  const [mensajes, setMensajes] = useState([
    {
      rol: 'asistente',
      texto: '¡Hola! 👋 Soy el asistente de GIO TECH. ¿Qué celular estás buscando? puedo ayudarte a encontrar el perfecto según tu presupuesto o necesidades.'
    }
  ]);
  const [inputUsuario, setInputUsuario] = useState('');
  const [cargando, setCargando] = useState(false);
  const chatRef = useRef(null);
  const phoneNumber = useWhatsappNumber();

  // Auto-scroll al final cuando hay nuevos mensajes
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [mensajes]);

  const handleEnviar = async () => {
    if (!inputUsuario.trim() || cargando) return;

    const pregunta = inputUsuario.trim();
    setInputUsuario('');
    
    // Agregar mensaje del usuario
    setMensajes(prev => [...prev, { rol: 'usuario', texto: pregunta }]);
    setCargando(true);

    // Construir historial (últimos 6 mensajes para mantener contexto)
    const historial = mensajes.slice(-6);

    try {
      // Obtener respuesta de Gemini con historial
      const respuesta = await askGeminiAssistant(pregunta, productos, historial);
      
      // Agregar respuesta del asistente
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

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEnviar();
    }
  };

  const handleWhatsApp = () => {
    if (!phoneNumber) return;
    const mensaje = generateWhatsAppMessage([]);
    window.open(`https://wa.me/${phoneNumber}?text=${mensaje}`, '_blank');
  };

  return (
    <Card className="gemini-chat-card" style={{
      position: 'fixed',
      bottom: '90px',
      right: '20px',
      width: '380px',
      maxWidth: 'calc(100vw - 40px)',
      maxHeight: '500px',
      zIndex: 1050,
      boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
      borderRadius: '16px',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <Card.Header style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '12px 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        border: 'none'
      }}>
        <div className="d-flex align-items-center gap-2">
          <span style={{ fontSize: '1.5rem'}}>🤖</span>
          <div>
            <strong>Asistente IA</strong>
            <Badge bg="light" text="dark" className="ms-2" style={{ fontSize: '0.7rem' }}>Beta</Badge>
          </div>
        </div>
        <Button 
          variant="link" 
          onClick={onClose}
          style={{ color: 'white', textDecoration: 'none', padding: '0' }}
        >
          ✕
        </Button>
      </Card.Header>

      {/* Mensajes */}
      <div 
        ref={chatRef}
        style={{ 
          height: '320px', 
          overflowY: 'auto', 
          padding: '16px',
          background: 'var(--bg-secondary)'
        }}
      >
        {mensajes.map((msg, index) => (
          <div 
            key={index}
            className={`mb-3 ${msg.rol === 'usuario' ? 'text-end' : 'text-start'}`}
          >
            <div
              style={{
                display: 'inline-block',
                maxWidth: '85%',
                padding: '10px 14px',
                borderRadius: msg.rol === 'usuario' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                background: msg.rol === 'usuario' 
                  ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                  : 'var(--bg-card)',
                color: msg.rol === 'usuario' ? 'white' : 'var(--text-primary)',
                textAlign: 'left',
                fontSize: '0.9rem',
                lineHeight: '1.4',
                whiteSpace: 'pre-wrap'
              }}
            >
              {msg.texto}
            </div>
          </div>
        ))}
        
        {cargando && (
          <div className="text-start mb-3">
            <div style={{
              display: 'inline-block',
              padding: '10px 14px',
              borderRadius: '18px 18px 18px 4px',
              background: 'var(--bg-card)',
              color: 'var(--text-muted)'
            }}>
              <span className="typing-indicator">✏️ Escribiendo...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <Card.Footer style={{ padding: '12px', background: 'var(--bg-card)', borderTop: '1px solid var(--border-color)' }}>
        <Form onSubmit={(e) => { e.preventDefault(); handleEnviar(); }}>
          <div className="d-flex gap-2">
            <Form.Control
              type="text"
              placeholder="Escribe tu pregunta..."
              value={inputUsuario}
              onChange={(e) => setInputUsuario(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={cargando}
              style={{ borderRadius: '20px' }}
            />
            <Button 
              type="submit"
              disabled={cargando || !inputUsuario.trim()}
              style={{ 
                borderRadius: '50%',
                width: '42px',
                height: '42px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                padding: '0'
              }}
            >
              ➤
            </Button>
          </div>
        </Form>
        <div className="text-center mt-2">
          <Button 
            variant="link" 
            size="sm" 
            onClick={handleWhatsApp}
            style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}
          >
            <i className="bi bi-whatsapp me-1"></i>
            Hablar con un asesor
          </Button>
        </div>
      </Card.Footer>
    </Card>
  );
}

export default GeminiChat;
