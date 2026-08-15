// src/components/product-card/FinancieraGrid.tsx
import type React from "react";
import { Row, Col } from "react-bootstrap";
import { FINANCIERAS } from "../../data/financieras";
import type { Financiera } from "../../types";

interface FinancieraGridProps {
  financierasDisponibles: Financiera[];
  onSelect: (f: Financiera) => void;
}

const FinancieraGrid: React.FC<FinancieraGridProps> = ({ financierasDisponibles, onSelect }) => (
  <>
    <h6 className="modal-section-title">Elige una financiera</h6>
    <Row className="g-3">
      {FINANCIERAS.map((f) => {
        const isAvailable = financierasDisponibles.some((df) => df.id === f.id);
        return (
          <Col xs={6} key={f.id}>
            <div
              className={`financiera-card${!isAvailable ? ' financiera-card-disabled' : ''}`}
              onClick={() => isAvailable && onSelect(f)}
            >
              <img src={f.logo} alt={f.nombre} loading="lazy" />
              <div className="financiera-name">{f.nombre}</div>
              <span className={`financiera-badge ${f.tipo === 'autovalidacion' ? 'badge-autovalidacion' : 'badge-asesor'}`}>
                {f.tipo === 'autovalidacion' ? 'Autovalidación' : 'Asesor'}
              </span>
              {!isAvailable && (
                <div className="text-muted small mt-1" style={{ fontSize: '0.7rem', lineHeight: 1.2 }}>
                  No disponible<br />para este producto
                </div>
              )}
            </div>
          </Col>
        );
      })}
    </Row>
  </>
);

export default FinancieraGrid;