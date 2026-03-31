/**
 * Utilidades de formateo para la aplicación.
 */

/**
 * Formatea un número como precio en pesos colombianos.
 * @param {number|string} valor - Valor a formatear.
 * @returns {string} - Precio formateado (ej: "$1.234.567").
 */
export function formatPrice(valor) {
  if (valor === null || typeof valor === 'undefined' || valor === '') return '—';
  const numero = typeof valor === 'string' 
    ? parseFloat(valor.replace(/\s+/g, '').replace(/,/, '.')) 
    : Number(valor);
  if (!isNaN(numero) && Number.isFinite(numero)) {
    return numero.toLocaleString('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    });
  }
  return '—';
}

/**
 * Normaliza texto para búsquedas (minúsculas, sin acentos, solo ASCII).
 * @param {string} texto - Texto a normalizar.
 * @returns {string} - Texto normalizado.
 */
export function normalizeText(texto) {
  if (typeof texto !== 'string') return '';
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E]/g, '')
    .trim();
}

/**
 * Formatea un número con separador de miles.
 * @param {number|string} valor - Valor a formatear.
 * @returns {string} - Número formateado (ej: "1.234.567").
 */
export function formatNumber(valor) {
  const numero = typeof valor === 'string' 
    ? parseFloat(valor.replace(/\s+/g, '').replace(/,/, '.')) 
    : Number(valor);
  if (!isNaN(numero) && Number.isFinite(numero)) {
    return numero.toLocaleString('es-CO');
  }
  return '—';
}
