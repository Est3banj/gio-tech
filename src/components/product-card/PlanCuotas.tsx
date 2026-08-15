// src/components/product-card/PlanCuotas.tsx
import type React from "react";
import { Badge } from "react-bootstrap";

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
}) => (
  <>
    {cuotaInicial > 0 && (
      <p className="mb-2"><strong>Cuota inicial:</strong> {cuotaInicialStr}</p>
    )}

    {solo12Meses && cuotas12 ? (
      <div className="plan-special-box">
        <div className="text-center mb-2">
          <Badge bg="info" style={{ fontSize: '0.85rem', padding: '7px 16px', borderRadius: '8px', letterSpacing: '0.03em' }}>
            PLAN ESPECIAL
          </Badge>
        </div>
        <p className="mb-0 text-center" style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--brand-blue)' }}>
          12 cuotas mensuales de {cuotas12Str}
        </p>
      </div>
    ) : (
      <div className="plan-standard-box">
        <p className="mb-2"><strong>16 cuotas quincenales:</strong> <span style={{ fontSize: '1.1em', color: 'var(--text-primary)' }}>{cuotas6Str}</span></p>
        <p className="mb-0"><strong>8 cuotas mensuales:</strong> <span style={{ fontSize: '1.1em', color: 'var(--text-primary)' }}>{cuotas8Str}</span></p>
      </div>
    )}
  </>
);

export default PlanCuotas;