export function formatPrice(valor: number | string | null | undefined): string {
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

export function normalizeText(texto: string): string {
  if (typeof texto !== 'string') return '';
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E]/g, '')
    .trim();
}

export function formatNumber(valor: number | string | null | undefined): string {
  const numero = typeof valor === 'string' 
    ? parseFloat(valor.replace(/\s+/g, '').replace(/,/, '.')) 
    : Number(valor);
  if (!isNaN(numero) && Number.isFinite(numero)) {
    return numero.toLocaleString('es-CO');
  }
  return '—';
}
