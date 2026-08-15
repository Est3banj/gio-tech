// src/components/product-card/CreditForm.tsx
import React, { useState, useEffect, useCallback } from "react";
import { Button, Row, Col } from "react-bootstrap";
import SistecreditoValidation from "./SistecreditoValidation";
import type { ValidacionStatus } from "./SistecreditoValidation";
import type { Financiera } from "../../types";

export type AutovalidacionStatus = 'pendiente' | 'aprobado' | 'denegado';

export interface CreditFormStatus {
  formData: Record<string, string>;
  autovalidacionStatus: AutovalidacionStatus;
  isValid: boolean;
}

interface CreditFormProps {
  financiera: Financiera;
  contado: number | null | undefined;
  onValidSubmit: () => void;
  onStatusChange: (status: CreditFormStatus) => void;
  onValidacionStatusChange: (status: ValidacionStatus) => void;
}

const CreditForm: React.FC<CreditFormProps> = ({
  financiera,
  contado,
  onValidSubmit,
  onStatusChange,
  onValidacionStatusChange,
}) => {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [linkOpened, setLinkOpened] = useState(false);
  const [autovalidacionStatus, setAutovalidacionStatus] = useState<AutovalidacionStatus>('pendiente');
  const [aceptaTerminos, setAceptaTerminos] = useState(false);

  const handleFieldChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const isFormValid = useCallback((): boolean => {
    for (const campo of financiera.campos) {
      if (campo.required && !formData[campo.name]?.trim()) return false;
    }
    // Nombre completo: al menos 2 palabras (solo Sistecredito)
    if (financiera.id === 'sistecredito') {
      const words = (formData.nombres || '').trim().split(/\s+/).filter(Boolean);
      if (words.length < 2) return false;
    }
    // Todas las financieras: debe aceptar términos
    if (!aceptaTerminos) return false;
    return true;
  }, [formData, aceptaTerminos, financiera]);

  const nombreCompletoWords = (formData.nombres || '').trim().split(/\s+/).filter(Boolean).length;
  const nombreCompletoInvalido = financiera.id === 'sistecredito' && (formData.nombres?.trim() || '') && nombreCompletoWords < 2;

  useEffect(() => {
    onStatusChange({ formData, autovalidacionStatus, isValid: isFormValid() });
  }, [formData, autovalidacionStatus, isFormValid, onStatusChange]);

  return (
    <>
      <div className="text-center mb-3">
        <img src={financiera.logo} alt={financiera.nombre} style={{ maxHeight: 40, objectFit: 'contain' }} />
        <h6 className="mt-2 fw-bold">{financiera.nombre}</h6>
      </div>

      {/* ─── Autovalidación: paso 1 — ir al sitio externo ─── */}
      {financiera.tipo === 'autovalidacion' && !linkOpened && (
        <div className="autovalidacion-note text-center">
          <p className="mb-2">Primero valida tu crédito:</p>
          <Button
            variant=""
            size="sm"
            onClick={() => {
              window.open(financiera.urlAutovalidacion, '_blank');
              setLinkOpened(true);
            }}
            style={{ background: '#ffc107', borderColor: '#ffc107', color: '#000', fontWeight: 600 }}
          >
            <i className="bi bi-box-arrow-up-right me-1"></i> Ir a {financiera.nombre}
          </Button>
        </div>
      )}

      {/* ─── Autovalidación: paso 2 — elegir resultado ─── */}
      {financiera.tipo === 'autovalidacion' && linkOpened && autovalidacionStatus === 'pendiente' && (
        <div className="autovalidacion-note text-center">
          <div className="d-flex align-items-center justify-content-center gap-2 mb-2">
            <i className="bi bi-check-circle-fill text-success"></i>
            <span className="fw-semibold" style={{ color: 'var(--text-primary)' }}>Enlace abierto en {financiera.nombre}</span>
          </div>
          <p className="mb-2" style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            ¿Cómo te fue en la validación?
          </p>
          <Row className="g-2">
            <Col xs={6}>
              <Button
                variant=""
                size="sm"
                onClick={() => setAutovalidacionStatus('aprobado')}
                className="w-100"
                style={{ background: '#28a745', borderColor: '#28a745', color: '#fff', fontWeight: 600, padding: '10px 8px' }}
              >
                <i className="bi bi-check-circle me-1"></i> Aprobado
              </Button>
            </Col>
            <Col xs={6}>
              <Button
                variant=""
                size="sm"
                onClick={() => setAutovalidacionStatus('denegado')}
                className="w-100"
                style={{ background: '#dc3545', borderColor: '#dc3545', color: '#fff', fontWeight: 600, padding: '10px 8px' }}
              >
                <i className="bi bi-x-circle me-1"></i> Denegado
              </Button>
            </Col>
          </Row>
          <div className="mt-2">
            <Button
              variant="link"
              size="sm"
              onClick={() => { window.open(financiera.urlAutovalidacion, '_blank'); }}
              style={{ color: 'var(--brand-blue)', textDecoration: 'none', fontSize: '0.85rem' }}
            >
              <i className="bi bi-box-arrow-up-right me-1"></i> Volver a abrir {financiera.nombre}
            </Button>
          </div>
        </div>
      )}

      {/* ─── Autovalidación: resultado denegado ─── */}
      {financiera.tipo === 'autovalidacion' && autovalidacionStatus === 'denegado' && (
        <div className="validation-result no-aplica mt-2">
          <div className="icon"><i className="bi bi-x-circle-fill"></i></div>
          <div className="fw-bold fs-6">Cupo denegado</div>
          <div className="reason">No te preocupes, puedes probar con otra financiera</div>
        </div>
      )}

      {/* ─── Formulario: se muestra si no es autovalidación, o si aprobó ─── */}
      {(financiera.tipo !== 'autovalidacion' || autovalidacionStatus === 'aprobado') && (
        <div className="mt-2">
          {financiera.campos.map((campo) => (
            <div className="form-field-group" key={campo.name}>
              <label>
                {campo.label}
                {campo.required && <span style={{ color: 'var(--gio-red)' }}> *</span>}
              </label>
              {campo.type === 'radio' && campo.options ? (
                <div className="radio-group">
                  {campo.options.map((opt) => (
                    <label key={opt}>
                      <input
                        type="radio"
                        name={campo.name}
                        value={opt}
                        checked={formData[campo.name] === opt}
                        onChange={(e) => handleFieldChange(campo.name, e.target.value)}
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              ) : (
                <input
                  type={campo.type || 'text'}
                  placeholder={campo.label}
                  value={formData[campo.name] || ''}
                  onChange={(e) => handleFieldChange(campo.name, e.target.value)}
                  className={nombreCompletoInvalido ? 'is-invalid' : ''}
                />
              )}
              {/* Sistecredito: hint de nombre completo */}
              {financiera.id === 'sistecredito' && campo.name === 'nombres' && (
                <small
                  className={`d-block mt-1 ${
                    nombreCompletoInvalido ? 'text-danger' : 'text-muted'
                  }`}
                  style={{ fontSize: '0.75rem' }}
                >
                  {nombreCompletoInvalido
                    ? 'Ingresá tu nombre y apellido completo'
                    : 'Ej: Juan Pérez'}
                </small>
              )}
            </div>
          ))}

          {/* Términos y condiciones (para todas las financieras) */}
          <div className="form-field-group terminos-checkbox">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={aceptaTerminos}
                onChange={(e) => setAceptaTerminos(e.target.checked)}
              />
              <span>
                Autorizo el tratamiento de mis datos personales de acuerdo con los{' '}
                <a href="/terminos" target="_blank" rel="noopener noreferrer">
                  Términos y Condiciones
                </a>{' '}
                de GIO TECH
              </span>
            </label>
          </div>
        </div>
      )}

      {/* ─── Sistecredito: wizard de validación ─── */}
      {financiera.id === 'sistecredito' && (
        <SistecreditoValidation
          cupoInput={formData.cupo || ''}
          contado={contado}
          formData={formData}
          esFormValido={isFormValid()}
          onValidSubmit={onValidSubmit}
          onStatusChange={onValidacionStatusChange}
        />
      )}
    </>
  );
};

export default CreditForm;