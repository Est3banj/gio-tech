// src/data/financieras.ts
// Configuración de financieras disponibles para crédito

import type { Financiera } from '../types';

export const FINANCIERAS: Financiera[] = [
  {
    id: 'sistecredito',
    nombre: 'Sistecredito',
    logo: '/logoscredito/sistecredito.webp',
    tipo: 'asesor',
    aplicaEn: { iphone: true, android: true, electrodomestico: true },
    campos: [
      { name: 'nombres', label: 'Nombres y apellidos', type: 'text', required: true },
      { name: 'cedula', label: 'Número de cédula', type: 'text', required: true },
    ],
  },
  {
    id: 'esmiopcion',
    nombre: 'Esmiopcion',
    logo: '/logoscredito/esmiopcion.webp',
    tipo: 'autovalidacion',
    urlAutovalidacion: 'https://esmio.appmikro.com/customer/customer-signup',
    aplicaEn: { iphone: true, android: true, electrodomestico: true },
    campos: [
      { name: 'nombres', label: 'Nombres y apellidos', type: 'text', required: true },
      { name: 'cedula', label: 'Número de cédula', type: 'text', required: true },
    ],
  },
  {
    id: 'pajoy',
    nombre: 'PayJoy',
    logo: '/logoscredito/pajoy.webp',
    tipo: 'autovalidacion',
    urlAutovalidacion: 'https://www.payjoy.com/co/celulares-a-cuotas',
    aplicaEn: { iphone: false, android: true, electrodomestico: true },
    campos: [
      { name: 'nombres', label: 'Nombres y apellidos', type: 'text', required: true },
      { name: 'cedula', label: 'Número de cédula', type: 'text', required: true },
    ],
  },
  {
    id: 'krediya',
    nombre: 'Krediya',
    logo: '/logoscredito/krediya.webp',
    tipo: 'asesor',
    aplicaEn: { iphone: false, android: true, electrodomestico: true },
    campos: [
      { name: 'nombres', label: 'Nombres y apellidos', type: 'text', required: true },
      { name: 'cedula', label: 'Número de cédula', type: 'text', required: true },
      {
        name: 'compradoAntes',
        label: '¿Has comprado anteriormente?',
        type: 'radio',
        required: true,
        options: ['Sí', 'No'],
      },
      {
        name: 'reportesNegativos',
        label: '¿Tienes algún reporte negativo?',
        type: 'radio',
        required: true,
        options: ['Sí', 'No'],
      },
    ],
  },
  {
    id: 'celya',
    nombre: 'Celya',
    logo: '/logoscredito/celya.webp',
    tipo: 'asesor',
    aplicaEn: { iphone: false, android: true, electrodomestico: false },
    campos: [
      {
        name: 'nombres',
        label: 'Nombres y apellidos como están en la cédula',
        type: 'text',
        required: true,
      },
      { name: 'cedula', label: 'Número de cédula', type: 'text', required: true },
      {
        name: 'fechaNacimiento',
        label: 'Fecha y lugar de nacimiento como está en la cédula',
        type: 'text',
        required: true,
      },
      {
        name: 'fechaExpedicion',
        label: 'Fecha y lugar de expedición como está en la cédula',
        type: 'text',
        required: true,
      },
      { name: 'celular', label: 'Número de celular', type: 'text', required: true },
      { name: 'email', label: 'Correo electrónico', type: 'email', required: true },
    ],
  },
];

// ── Helpers ───────────────────────────────────────────────

export type ProductType = 'iphone' | 'android' | 'electrodomestico';

/** Determina el tipo de producto según marca, nombre y categoría */
export function getProductType(marca?: string, nombre?: string, categoria?: string): ProductType {
  // 1) Marca explícita "iPhone"
  if (marca?.toLowerCase() === 'iphone') return 'iphone';
  // 2) Nombre del producto contiene "iphone" (cubre casos como marca="Apple")
  if (nombre?.toLowerCase().includes('iphone')) return 'iphone';
  // 3) Categoría de electrodoméstico
  if (categoria) {
    const cat = categoria.toLowerCase();
    if (['electrodomestico', 'tv', 'lavadora', 'nevera', 'hogar'].includes(cat)) {
      return 'electrodomestico';
    }
  }
  // 4) Por defecto: Android / celulares genéricos
  return 'android';
}

/** Filtra las financieras que aplican para un producto */
export function getFinancierasForProduct(marca?: string, categoria?: string, nombre?: string): Financiera[] {
  const type = getProductType(marca, nombre, categoria);
  const keyMap: Record<ProductType, keyof Financiera['aplicaEn']> = {
    iphone: 'iphone',
    android: 'android',
    electrodomestico: 'electrodomestico',
  };
  return FINANCIERAS.filter((f) => f.aplicaEn[keyMap[type]]);
}
