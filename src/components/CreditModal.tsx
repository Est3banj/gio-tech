// src/components/CreditModal.tsx
// Modal que muestra las financieras disponibles como cards con logos

import { Modal, Row, Col } from 'react-bootstrap';
import type { Financiera } from '../types';

interface CreditModalProps {
  show: boolean;
  onHide: () => void;
  financieras: Financiera[];
  productoNombre: string;
  onSelect: (financiera: Financiera) => void;
}

const CreditModal = ({
  show,
  onHide,
  financieras,
  productoNombre,
  onSelect,
}: CreditModalProps) => {
  return (
    <Modal show={show} onHide={onHide} centered className="credit-modal">
      <Modal.Header closeButton>
        <div>
          <Modal.Title>💳 Opciones de crédito</Modal.Title>
          <p className="credit-subtitle mb-0 mt-1">
            {productoNombre} — Selecciona la financiera de tu preferencia
          </p>
        </div>
      </Modal.Header>
      <Modal.Body className="px-4 pb-4">
        {financieras.length === 0 ? (
          <p className="text-muted text-center mb-0 py-3">
            No hay financieras disponibles para este producto.
          </p>
        ) : (
          <Row className="g-3">
            {financieras.map((f) => (
              <Col xs={6} key={f.id}>
                <div
                  className="credit-card"
                  onClick={() => onSelect(f)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') onSelect(f);
                  }}
                >
                  <img
                    src={f.logo}
                    alt={f.nombre}
                    className="credit-card-logo"
                    loading="lazy"
                  />
                  <span className="credit-card-name">{f.nombre}</span>
                  <span
                    className={`credit-card-badge ${
                      f.tipo === 'autovalidacion'
                        ? 'credit-card-badge--autovalidacion'
                        : 'credit-card-badge--asesor'
                    }`}
                  >
                    {f.tipo === 'autovalidacion' ? 'Autovalidación' : 'Asesor'}
                  </span>
                </div>
              </Col>
            ))}
          </Row>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default CreditModal;
