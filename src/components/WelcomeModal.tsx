// src/components/WelcomeModal.tsx
import React, { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';

interface WelcomeModalProps {
  show: boolean;
  onClose?: () => void;
  businessName?: string;
}

/**
 * Modal de bienvenida para el catálogo.
 * - Explica que las cuotas mostradas son una simulación aproximada.
 * - La cotización real se confirma tras validación de crédito.
 * - Se muestra solo una vez por sesión (controlado con sessionStorage).
 */
const WelcomeModal: React.FC<WelcomeModalProps> = ({ show, onClose, businessName }) => {
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
      </Modal.Footer>
    </Modal>
  );
};

export default WelcomeModal;
