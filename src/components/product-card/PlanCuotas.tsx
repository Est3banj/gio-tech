// src/components/product-card/PlanCuotas.tsx
import React, { useState } from "react";

interface PlanCuotasProps {
  cuotaInicial: number;
  cuotaInicialStr: string;
  solo12Meses: boolean;
  cuotas12: number | null | undefined;
  cuotas12Str: string;
  cuotas6Str: string;
  cuotas8Str: string;
}

const PlanCuotas: React.FC<PlanCuotasProps> = ({
  cuotaInicial,
  cuotaInicialStr,
  solo12Meses,
  cuotas12,
  cuotas12Str,
  cuotas6Str,
  cuotas8Str,
}) => {
  const [selectedTerm, setSelectedTerm] = useState<'16q' | '8m'>('16q');

  // Si no hay cuotas válidas para mostrar, no renderizamos nada (evita guiones o simulador vacío)
  if (solo12Meses) {
    if (!cuotas12 || !cuotas12Str) return null;
  } else {
    if (!cuotas6Str && !cuotas8Str) return null;
  }

  return (
    <div className="simulator-container mt-3">
      <div className="simulator-header d-flex justify-content-between align-items-center mb-2">
        <span className="simulator-title">
          <i className="bi bi-calculator me-1 text-primary"></i> Simulador de Financiación
        </span>
        {cuotaInicial > 0 && (
          <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1" style={{ fontSize: '0.78rem' }}>
            <i className="bi bi-check-circle me-1"></i> Cuota inicial: {cuotaInicialStr}
          </span>
        )}
      </div>

      {solo12Meses && cuotas12 ? (
        <div className="plan-special-card p-3 rounded-3 text-center">
          <div className="d-inline-flex align-items-center gap-1 badge bg-primary px-3 py-1 mb-2" style={{ fontSize: '0.8rem', letterSpacing: '0.04em' }}>
            <i className="bi bi-star-fill"></i> PLAN ESPECIAL EXCLUSIVO
          </div>
          <p className="mb-1 text-center fs-5 fw-bold" style={{ color: 'var(--brand-blue)' }}>
            12 cuotas mensuales de {cuotas12Str}
          </p>
          <small className="text-muted d-block">
            Financiación a 1 año con tasa preferencial
          </small>
        </div>
      ) : (
        <div className="cuotas-simulator-interactive">
          {/* ─── Selector de Plazos Interactivo ─── */}
          <div className="cuotas-term-pills mb-3">
            <button
              type="button"
              className={`cuota-term-pill ${selectedTerm === '16q' ? 'active' : ''}`}
              onClick={() => setSelectedTerm('16q')}
            >
              <span>16 Quincenas</span>
              <small>Recomendado</small>
            </button>
            <button
              type="button"
              className={`cuota-term-pill ${selectedTerm === '8m' ? 'active' : ''}`}
              onClick={() => setSelectedTerm('8m')}
            >
              <span>8 Meses</span>
              <small>Mensual</small>
            </button>
          </div>

          {/* ─── Tarjeta de Resumen Reactivo ─── */}
          <div className="cuota-summary-card p-3 rounded-3">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="text-muted small">
                {selectedTerm === '16q' && '16 cuotas quincenales:'}
                {selectedTerm === '8m' && '8 cuotas mensuales:'}
              </span>
              <span className="badge bg-secondary-subtle text-secondary border px-2">
                <i className="bi bi-calendar-check me-1"></i> Flexible
              </span>
            </div>

            <div className="d-flex align-items-baseline gap-2">
              <span className="fs-4 fw-bold" style={{ color: 'var(--gio-red)' }}>
                {selectedTerm === '16q' && (cuotas6Str || '—')}
                {selectedTerm === '8m' && (cuotas8Str || '—')}
              </span>
              <small className="text-muted">
                {selectedTerm === '8m' ? '/ mes' : '/ quincena'}
              </small>
            </div>

            {/* Texto de compatibilidad para tests e información completa */}
            <div className="plan-standard-box-hidden-text mt-2 pt-2 border-top" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <p className="mb-1"><strong>16 cuotas quincenales:</strong> <span style={{ color: 'var(--text-primary)' }}>{cuotas6Str}</span></p>
              <p className="mb-0"><strong>8 cuotas mensuales:</strong> <span style={{ color: 'var(--text-primary)' }}>{cuotas8Str}</span></p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanCuotas;