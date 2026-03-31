// src/components/WelcomeModal.jsx
import React, { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';

/**
 * Modal de bienvenida para el catálogo.
 * - Explica que las cuotas mostradas son una simulación aproximada.
 * - La cotización real se confirma tras validación de crédito.
 * - Se muestra solo una vez por sesión (controlado con sessionStorage).
 *
 * Props:
 *  - show: boolean - controla la visibilidad del modal
 *  - onClose: () => void - callback para cerrar
 *  - businessName?: string - nombre del negocio para el saludo
 */
export default function WelcomeModal({ show, onClose, businessName }) {
  const [dontShowAgain, setDontShowAgain] = useState(true);

  const handleClose = () => {
    try {
      if (dontShowAgain) {
        sessionStorage.setItem('gio_welcome_seen_sess_v1', '1');
      }
    } catch {
      // Si el navegador bloquea localStorage, simplemente ignoramos
    }
    onClose?.();
  };

  return (
    <Modal
      show={show}
      onHide={handleClose}
      centered
      aria-labelledby="welcome-title"
      backdrop="static"
    >
      <Modal.Header closeButton>
        <Modal.Title id="welcome-title">
          {businessName ? `¡Bienvenido a ${businessName}!` : '¡Bienvenido!'}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <p className="mb-2">
          Los valores de cuotas que ves en cada equipo son <strong>una simulación aproximada</strong>.
        </p>
        <p className="mb-3">
          La cotización final se confirma tras la <strong>validación de crédito</strong> con un asesor.
        </p>

        <Form.Check
          type="checkbox"
          id="dont-show-welcome"
          label="No mostrar de nuevo en esta sesión"
          checked={dontShowAgain}
          onChange={(e) => setDontShowAgain(e.target.checked)}
        />
      </Modal.Body>

      <Modal.Footer className="d-flex justify-content-between">
        <Button variant="outline-secondary" onClick={handleClose}>
          Entendido
        </Button>
        {/* Si más adelante quieres un acceso directo a WhatsApp global, puedes
            descomentar el botón inferior y pasar el link desde el padre.
            <Button variant="success" onClick={() => window.open(whatsappUrl, '_blank', 'noopener,noreferrer')}>
              Hablar con un asesor
            </Button>
        */}
      </Modal.Footer>
    </Modal>
  );
}