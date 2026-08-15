// src/components/product-card/SistecreditoValidation.tsx
import React, { useState, useEffect } from "react";

export type ValidacionPhase = 'idle' | 'running' | 'done';
export type ValidacionResultType = 'aplica' | 'no-aplica' | 'condiciones' | null;

export interface ValidacionStatus {
  validPhase: ValidacionPhase;
  validResultType: ValidacionResultType;
}

interface SistecreditoValidationProps {
  cupoInput: string;
  contado: number | null | undefined;
  formData: Record<string, string>;
  esFormValido: boolean;
  onValidSubmit: () => void;
  onStatusChange: (status: ValidacionStatus) => void;
}

const SistecreditoValidation: React.FC<SistecreditoValidationProps> = ({
  cupoInput,
  contado,
  formData,
  esFormValido,
  onValidSubmit,
  onStatusChange,
}) => {
  const [validPhase, setValidPhase] = useState<ValidacionPhase>('idle');
  const [validStep, setValidStep] = useState(0); // 0=datos, 1=cupo, 2=historial, 3=resultado
  const [validCupoText, setValidCupoText] = useState('');
  const [validAdvertencia, setValidAdvertencia] = useState('');
  const [validResultType, setValidResultType] = useState<ValidacionResultType>(null);
  const [validResultMsg, setValidResultMsg] = useState('');
  const validTimers = React.useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    onStatusChange({ validPhase, validResultType });
  }, [validPhase, validResultType, onStatusChange]);

  // Al desmontar (cerrar/volver/cambiar de financiera) se cancelan los timers pendientes
  useEffect(() => {
    return () => {
      validTimers.current.forEach(clearTimeout);
      validTimers.current = [];
    };
  }, []);

  /** Validación progresiva para Sistecredito con pasos animados */
  const handleSistecreditoValidar = () => {
    if (validPhase !== 'idle') return;
    if (!esFormValido) return;

    const cupoStr = (cupoInput || '').replace(/[^0-9]/g, '');
    const cupo = cupoStr ? parseInt(cupoStr, 10) : null;

    // Arrancar secuencia
    setValidPhase('running');
    setValidStep(0);

    const t: Array<ReturnType<typeof setTimeout>> = [];

    t.push(setTimeout(() => setValidStep(1), 800));          // paso 1: consultando cupo...

    t.push(setTimeout(() => {                                  // paso 2: cupo resultado
      const cupoText = cupo === null ? 'No recuerda' : `$${cupo.toLocaleString('es-CO')}`;
      let advertencia = '';
      if (cupo !== null && (contado || 0) > cupo) {
        const diff = (contado || 0) - cupo;
        advertencia = `El producto ($${(contado || 0).toLocaleString('es-CO')}) supera tu cupo por $${diff.toLocaleString('es-CO')}. Necesitarías un abono adicional.`;
      }
      setValidCupoText(cupoText);
      setValidAdvertencia(advertencia);
      setValidStep(2);
    }, 2000));

    t.push(setTimeout(() => {                                  // paso 3: resultado final
      const esPrimeraCompra = formData.primeraCompra === 'Sí';
      // Unica regla real: primera compra = no aplica para tecnologia
      // El cupo es solo informativo para el asesor, no lo validamos
      const type = esPrimeraCompra ? 'no-aplica' : 'aplica';
      const msg = esPrimeraCompra ? 'No aplica para tecnología' : 'Aplica';

      setValidResultType(type);
      setValidResultMsg(msg);
      setValidStep(3);
      setValidPhase('done');

      if (type === 'aplica') {
        t.push(setTimeout(() => onValidSubmit(), 2000));
      }
    }, 3500));

    validTimers.current = t;
  };

  return (
    <>
      {/* ─── Sistecredito: validation button ─── */}
      {validPhase === 'idle' && (
        <div className="text-center mt-3">
          <button className="btn-validar" onClick={handleSistecreditoValidar} disabled={!esFormValido}>
            <i className="bi bi-shield-check me-2"></i> Validar
          </button>
        </div>
      )}

      {/* ─── Sistecredito: progressive steps ─── */}
      {validPhase !== 'idle' && (
        <div className="valid-steps mt-3">
          {/* Paso 1: Datos básicos */}
          <div className={`valid-step ${validStep >= 1 ? 'done' : validStep === 0 ? 'active' : 'pending'}`}>
            <span className="valid-step-icon">
              {validStep >= 1
                ? <i className="bi bi-check-circle-fill text-success"></i>
                : validStep === 0 && validPhase === 'running'
                ? <i className="bi bi-hourglass-split text-primary"></i>
                : <i className="bi bi-circle text-secondary" style={{ opacity: 0.3 }}></i>}
            </span>
            <span className="valid-step-text">Datos básicos verificados</span>
          </div>

          {/* Paso 2: Cupo */}
          <div className={`valid-step ${validStep >= 2 ? 'done' : validStep === 1 ? 'active' : 'pending'}`}>
            <span className="valid-step-icon">
              {validStep >= 2
                ? <i className="bi bi-check-circle-fill text-success"></i>
                : validStep === 1
                ? <i className="bi bi-hourglass-split text-primary"></i>
                : <i className="bi bi-circle text-secondary" style={{ opacity: 0.3 }}></i>}
            </span>
            <span className="valid-step-text">
              {validStep < 2 ? 'Consultando cupo...' : `Cupo disponible: ${validCupoText}`}
            </span>
          </div>

          {/* Advertencia producto/cupo */}
          {validStep >= 2 && validAdvertencia && (
            <div className="valid-advertencia">
              <i className="bi bi-exclamation-triangle-fill text-warning me-1"></i>
              {validAdvertencia}
            </div>
          )}

          {/* Paso 3: Historial */}
          <div className={`valid-step ${validStep >= 3 ? 'done' : validStep === 2 ? 'active' : 'pending'}`}>
            <span className="valid-step-icon">
              {validStep >= 3
                ? validResultType === 'aplica'
                  ? <i className="bi bi-check-circle-fill text-success"></i>
                  : <i className="bi bi-x-circle-fill text-danger"></i>
                : validStep === 2
                ? <i className="bi bi-hourglass-split text-primary"></i>
                : <i className="bi bi-circle text-secondary" style={{ opacity: 0.3 }}></i>}
            </span>
            <span className="valid-step-text">
              {validStep >= 3 ? validResultMsg : 'Validando historial...'}
            </span>
          </div>

          {/* Resultado final */}
          {validPhase === 'done' && (
            <div className={`validation-result ${validResultType === 'no-aplica' ? 'no-aplica' : 'aplica'}`}>
              {validResultType === 'no-aplica' ? (
                <>
                  <div className="icon"><i className="bi bi-x-circle-fill"></i></div>
                  <div className="fw-bold fs-6">Cupo denegado</div>
                  <div className="reason">{validResultMsg}</div>
                  <div className="mt-2" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    No te preocupes, puedes probar con otra financiera
                  </div>
                </>
              ) : (
                <>
                  <div className="icon"><i className="bi bi-check-circle-fill"></i></div>
                  <div className="fw-bold fs-6">¡Aplicas para Sistecredito!</div>
                  <div className="reason">Te redirigimos a WhatsApp...</div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default SistecreditoValidation;