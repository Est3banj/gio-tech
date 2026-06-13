// src/components/CreditFormModal.tsx
// Formulario dinámico que se adapta a los campos de cada financiera

import { useState } from 'react';
import { Modal, Form, Button, Alert } from 'react-bootstrap';
import type { Financiera } from '../types';

interface CreditFormModalProps {
  show: boolean;
  onHide: () => void;
  onBack?: () => void;
  financiera: Financiera;
  productoNombre: string;
  productoPrecio: string;
  onSubmit: (data: Record<string, string>) => void;
}

const CreditFormModal = ({
  show,
  onHide,
  onBack,
  financiera,
  productoNombre,
  productoPrecio,
  onSubmit,
}: CreditFormModalProps) => {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [linkOpened, setLinkOpened] = useState(false);

  const handleChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleOpenLink = () => {
    if (financiera.urlAutovalidacion) {
      window.open(financiera.urlAutovalidacion, '_blank', 'noopener,noreferrer');
      setLinkOpened(true);
    }
  };

  const isFormValid = () => {
    for (const campo of financiera.campos) {
      if (campo.required && !formData[campo.name]?.trim()) {
        return false;
      }
    }
    return true;
  };

  const handleSubmit = () => {
    if (!isFormValid()) return;
    onSubmit(formData);
    setFormData({});
    setLinkOpened(false);
  };

  const handleClose = () => {
    setFormData({});
    setLinkOpened(false);
    onHide();
  };

  const renderField = (campo: typeof financiera.campos[0]) => {
    if (campo.type === 'radio') {
      return (
        <div key={campo.name} className="mb-3">
          <Form.Label className="credit-form-label">{campo.label}</Form.Label>
          <div className="credit-form-radio-group">
            {campo.options?.map((opt) => (
              <Form.Check
                key={opt}
                type="radio"
                id={`${campo.name}-${opt}`}
                label={opt}
                name={campo.name}
                value={opt}
                checked={formData[campo.name] === opt}
                onChange={(e) => handleChange(campo.name, e.target.value)}
                required={campo.required}
              />
            ))}
          </div>
        </div>
      );
    }

    return (
      <Form.Group key={campo.name} className="mb-3">
        <Form.Label className="credit-form-label">{campo.label}</Form.Label>
        <Form.Control
          type={campo.type}
          value={formData[campo.name] || ''}
          onChange={(e) => handleChange(campo.name, e.target.value)}
          required={campo.required}
          className="bg-input"
        />
      </Form.Group>
    );
  };

  return (
    <Modal show={show} onHide={handleClose} centered className="credit-modal">
      <Modal.Header closeButton>
        <div className="d-flex align-items-center gap-3">
          <img
            src={financiera.logo}
            alt={financiera.nombre}
            style={{ height: 32, width: 'auto' }}
          />
          <div>
            <Modal.Title style={{ fontSize: '1.1rem' }}>
              {financiera.nombre}
            </Modal.Title>
          </div>
        </div>
      </Modal.Header>
      <Modal.Body className="px-4 pb-4">
        <p className="credit-subtitle mb-3">
          {productoNombre} — {productoPrecio}
        </p>

        {/* Paso de autovalidación */}
        {financiera.tipo === 'autovalidacion' && !linkOpened && (
          <div className="credit-form-redirect-box mb-4">
            <p className="mb-2">
              Serás redirigido a <strong>{financiera.nombre}</strong> para validar
              tu crédito.
            </p>
            <Button
              variant="outline-danger"
              size="sm"
              onClick={handleOpenLink}
              className="fw-semibold"
            >
              <i className="bi bi-box-arrow-up-right me-1"></i>
              Abrir {financiera.nombre}
            </Button>
          </div>
        )}

        {financiera.tipo === 'autovalidacion' && linkOpened && (
          <Alert variant="success" className="py-2 small mb-3">
            <i className="bi bi-check-circle-fill me-1"></i>
            Validación abierta en otra pestaña. Completa tus datos para continuar.
          </Alert>
        )}

        {/* Campos del formulario */}
        {financiera.tipo === 'asesor' || linkOpened ? (
          <>
            {financiera.id === 'celya' && (
              <Alert variant="info" className="py-2 small mb-3">
                <i className="bi bi-info-circle-fill me-1"></i>
                Verifica que la información sea precisa y coincida con la de tu
                cédula.
              </Alert>
            )}

            {financiera.campos.map(renderField)}

            <Button
              className="credit-btn-submit mt-2"
              onClick={handleSubmit}
              disabled={!isFormValid()}
            >
              <i className="bi bi-whatsapp me-2"></i>
              {financiera.tipo === 'autovalidacion'
                ? 'Continuar a WhatsApp'
                : 'Enviar a WhatsApp'}
            </Button>
          </>
        ) : null}

        {onBack && (
          <Button
            variant="link"
            onClick={onBack}
            className="mt-2 w-100 text-decoration-none"
            style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}
          >
            ← Volver a financieras
          </Button>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default CreditFormModal;
