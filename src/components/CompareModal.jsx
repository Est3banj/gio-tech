// src/components/CompareModal.jsx
import React from 'react';
import { Modal, Table, Button } from 'react-bootstrap';

// === Helpers ===
const fmtCOP = (n) =>
  (Number(n) || 0).toLocaleString('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  });

const fmtInt = (n) => (Number.isFinite(n) ? Math.round(n) : '—');

const fmtOneDecimal = (n) => {
  if (!Number.isFinite(n)) return '—';
  return `${Math.round(n * 10) / 10}\u2033`; // pulgadas con double prime
};

// Lee y normaliza valores desde specs o desde claves sueltas
const readSpec = (item, fallbacks = [], { as = 'number' } = {}) => {
  // Permite que algunas tiendas ya tengan los valores al nivel raíz
  for (const key of fallbacks) {
    const parts = key.split('.');
    let v = item;
    for (const part of parts) {
      if (v && typeof v === 'object' && part in v) v = v[part];
      else {
        v = undefined;
        break;
      }
    }
    if (v == null || v === '') continue;

    if (typeof v === 'number') return v;

    if (typeof v === 'string') {
      // "8 GB", "5000mAh", "6.5\"", "50MP" => num
      const raw = v.replace(/,/g, '.').replace(/[^\d.]/g, '');
      if (raw === '') return undefined;
      const n = parseFloat(raw);
      if (!Number.isFinite(n)) return undefined;
      return n;
    }
  }
  return undefined;
};

// --- Whitelists & sanitizers to prevent bad values (e.g., "56 GB RAM") ---
const RAM_SET = new Set([2, 3, 4, 6, 8, 12, 16, 24]);                 // GB
const STORAGE_SET = new Set([32, 64, 128, 256, 512, 1024, 2048]);     // GB
const inRange = (n, min, max) => Number.isFinite(n) && n >= min && n <= max;

function sanitizeSpecs(specs = {}) {
  let { ram, almacenamiento, bateria, camara, pantalla } = specs;

  // Coerce to numbers
  const toNum = (v) => (v === 0 || v ? Number(v) : null);

  ram = toNum(ram);
  almacenamiento = toNum(almacenamiento);
  bateria = toNum(bateria);
  camara = toNum(camara);
  pantalla = toNum(pantalla);

  // Enforce whitelist/ranges
  if (!RAM_SET.has(ram)) ram = null;
  if (!STORAGE_SET.has(almacenamiento)) almacenamiento = null;
  if (!inRange(bateria, 800, 10000)) bateria = null;
  if (!inRange(camara, 2, 300)) camara = null;
  if (!inRange(pantalla, 3, 8)) pantalla = null;

  return { ram, almacenamiento, bateria, camara, pantalla };
}

// --- Parser fallback: extrae specs desde la descripción libre ---
function parseDescriptionToSpecs(description = "") {
  if (!description || typeof description !== 'string') return {};
  const text = description.toLowerCase();
  const toNum = (v) => {
    if (v === 0 || v) {
      const s = String(v).replace(/[^0-9.,]/g, "").replace(",", ".");
      const n = Number(s);
      return Number.isFinite(n) ? n : null;
    }
    return null;
  };

  const almacenamientoMatch = text.match(/\b(\d{2,4})\s?gb\b/);
  const almacenamiento = almacenamientoMatch ? toNum(almacenamientoMatch[1]) : null;

  const ramMatch = text.match(/\b(\d{1,2})\s?gb\s?de\s?ram\b/) || text.match(/\b(\d{1,2})\s?gb\s?ram\b/) || text.match(/\b(\d{1,2})\s?gb\b/);
  const ram = ramMatch ? toNum(ramMatch[1]) : null;

  const camMatch = text.match(/(\d{2,4})\s?mp\b/) || text.match(/cámara\s?de\s?(\d{2,4})\s?mp/);
  const camara = camMatch ? toNum(camMatch[1] || camMatch[2]) : null;

  const screenMatch = text.match(/(\d{1,2}(?:[.,]\d)?)\s?(?:pulgadas|")/) || text.match(/pantalla.*?(\d{1,2}(?:[.,]\d)?)/);
  const pantalla = screenMatch ? toNum((screenMatch[1] || screenMatch[2] || "").replace(",", ".")) : null;

  const batMatch = text.match(/(\d{3,5})\s?m(?:ah)?\b/);
  const bateria = batMatch ? toNum(batMatch[1]) : null;

  return {
    almacenamiento: almacenamiento || null,
    ram: ram || null,
    camara: camara || null,
    pantalla: pantalla || null,
    bateria: bateria || null
  };
}

export default function CompareModal({ show, onHide, items = [] }) {
  const hasImage = Array.isArray(items) && items.some((it) => it?.imagen);

  // Prepara filas normalizando valores desde specs
  const rows = items.map((p) => {
    const parsed = parseDescriptionToSpecs(p.descripcion || p.description || '');
    const source = { ...p, specs: { ...(p.specs || {}), ...parsed } };

    const ram = readSpec(source, ['specs.ram', 'specs.ramGB', 'ram', 'ramGB']) ?? undefined;
    const storage = readSpec(source, ['specs.almacenamiento', 'specs.almacenamientoGB', 'almacenamiento', 'almacenamientoGB']) ?? undefined;
    const battery = readSpec(source, ['specs.bateria', 'specs.bateriaMAh', 'bateria', 'bateria_mAh', 'specs.bateria.mAh']) ?? undefined;
    const camera = readSpec(source, ['specs.camara', 'specs.camaraMP', 'camara', 'camara_MP', 'specs.camaras.principalMP']) ?? undefined;
    const screen = readSpec(source, ['specs.pantalla', 'specs.pantallaIn', 'pantalla_pulgadas', 'specs.pantalla.pulgadas']) ?? undefined;

    const safe = sanitizeSpecs({
      ram,
      almacenamiento: storage,
      bateria: battery,
      camara: camera,
      pantalla: screen,
    });

    return {
      id: p.id,
      imagen: p.imagen,
      nombre: p.nombre,
      contado: p.contado,
      cuotas6: p.cuotas6,
      cuotas8: p.cuotas8,
      ramGB: safe.ram,
      almacenamientoGB: safe.almacenamiento,
      bateria_mAh: safe.bateria,
      camara_MP: safe.camara,
      pantallaIn: safe.pantalla,
    };
  });

  const baseHeaders = [
    { key: 'nombre', label: 'Equipo' },
    { key: 'contado', label: 'Precio contado' },
    { key: 'cuotas6', label: '16 quincenales' },
    { key: 'cuotas8', label: '8 mensuales' },
    { key: 'ramGB', label: 'RAM (GB)' },
    { key: 'almacenamientoGB', label: 'Almacenamiento (GB)' },
    { key: 'bateria_mAh', label: 'Batería (mAh)' },
    { key: 'camara_MP', label: 'Cámara (MP)' },
    { key: 'pantallaIn', label: 'Pantalla (\")' },
  ];

  const headers = hasImage ? [{ key: '__image', label: '' }, ...baseHeaders] : baseHeaders;

  const renderCell = (row, key) => {
    if (key === '__image') {
      return row.imagen ? (
        <img
          src={row.imagen}
          alt={row.nombre || 'Producto'}
          style={{ width: 48, height: 48, objectFit: 'contain', borderRadius: 8 }}
          loading="lazy"
        />
      ) : (
        '—'
      );
    }

    const v = row[key];

    if (key === 'contado') return fmtCOP(v);
    if (key === 'cuotas6' || key === 'cuotas8')
      return v ? Number(v).toLocaleString('es-CO') : '—';

    if (key === 'ramGB' || key === 'almacenamientoGB' || key === 'bateria_mAh' || key === 'camara_MP') {
      return fmtInt(typeof v === 'string' ? parseFloat(v) : v);
    }

    if (key === 'pantallaIn') {
      const n = typeof v === 'string' ? parseFloat(v) : v;
      return fmtOneDecimal(n);
    }

    if (key === 'nombre') return v || '—';

    return v ?? '—';
  };

  return (
    <Modal show={show} onHide={onHide} size="xl" centered scrollable>
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="bi bi-columns-gap me-2"></i>
          Comparar equipos ({items.length})
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {rows.length === 0 ? (
          <div className="text-center text-muted py-5">
            Selecciona hasta 3 equipos para comparar.
          </div>
        ) : (
          <div className="table-responsive">
            <Table bordered hover className="align-middle">
              <thead>
                <tr>
                  {headers.map((h) => (
                    <th key={h.key} className={h.key === '__image' ? 'text-center' : ''}>
                      {h.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    {headers.map((h) => (
                      <td key={h.key} className={h.key === '__image' ? 'text-center align-middle' : 'align-middle'}>
                        {renderCell(r, h.key)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cerrar
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
