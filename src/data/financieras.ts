// src/data/financieras.ts
// Configuración de financieras disponibles para crédito

import type { Financiera } from '../types';

export const FINANCIERAS: Financiera[] = [
  {
    id: 'sistecredito',
    nombre: 'Sistecredito',
    logo: '/logoscredito/sistecredito.webp',
    tipo: 'asesor',
    aplicaEn: { iphone: true, android: true, electrodomestico: true, accesorio: true },
    campos: [
      { name: 'nombres', label: 'Nombres y apellidos', type: 'text', required: true },
      { name: 'cedula', label: 'Número de cédula', type: 'text', required: true },
      { name: 'cupo', label: 'Cupo disponible ($)', type: 'text', required: false },
      { name: 'primeraCompra', label: '¿Es tu primera compra?', type: 'radio', required: true, options: ['Sí', 'No'] },
    ],
  },
  {
    id: 'esmiopcion',
    nombre: 'Esmiopcion',
    logo: '/logoscredito/esmiopcion.webp',
    tipo: 'autovalidacion',
    urlAutovalidacion: 'https://esmio.appmikro.com/customer/customer-signup',
    aplicaEn: { iphone: true, android: true, electrodomestico: true, accesorio: true },
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
    aplicaEn: { iphone: false, android: true, electrodomestico: true, accesorio: false },
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
    aplicaEn: { iphone: false, android: true, electrodomestico: true, accesorio: false },
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
    aplicaEn: { iphone: false, android: true, electrodomestico: false, accesorio: false },
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

export type ProductType = 'iphone' | 'android' | 'electrodomestico' | 'accesorio';

export const UMBRAL_PRECIO_ACCESORIOS_CREDITO = 100000;

const APPLE_KEYWORDS = ['iphone', 'ipad', 'macbook', 'airtag'];
const ACCESORIO_KEYWORDS = [
  'cargador',
  'cable',
  'funda',
  'case',
  'estuche',
  'audifono',
  'audifonos',
  'auricular',
  'auriculares',
  'headphone',
  'headphones',
  'earbuds',
  'airpods',
  'smartwatch',
  'reloj',
  'watch',
  'band',
  'parlante',
  'altavoz',
  'speaker',
  'powerbank',
  'bateria portatil',
  'soporte',
  'tripode',
  'vidrio templado',
  'protector de pantalla',
  'vidrio',
  'hidrogel',
  'correa',
  'strap',
  'adaptador',
  'teclado',
  'mouse',
];

function cleanStr(str?: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/** Determina el tipo de producto según marca, nombre y categoría */
export function getProductType(marca?: string, nombre?: string, categoria?: string): ProductType {
  const cat = cleanStr(categoria);
  const nom = cleanStr(nombre);
  const mar = cleanStr(marca);

  // 1) Categoría accesorio o detección por nombre si no es explícitamente categoría de celular
  if (['accesorio', 'accesorios', 'accessory', 'accessories'].includes(cat) || cat.includes('accesorio')) {
    return 'accesorio';
  }
  if (nom && ACCESORIO_KEYWORDS.some((kw) => nom.includes(kw)) && !['celular', 'celulares', 'telefono', 'telefonos', 'smartphone', 'smartphones'].includes(cat)) {
    return 'accesorio';
  }

  // 2) Apple products: marca "Apple" o nombre contiene keyword Apple (iPhone, iPad, MacBook, AirTag...)
  if (mar === 'apple') return 'iphone';
  if (nom && APPLE_KEYWORDS.some((kw) => nom.includes(kw))) return 'iphone';

  // 3) Categoría de electrodoméstico
  if (['electrodomestico', 'electrodomesticos', 'tv', 'lavadora', 'nevera', 'hogar'].includes(cat) || cat.includes('electrodomestico')) {
    return 'electrodomestico';
  }

  // 4) Por defecto: Android / celulares genéricos
  return 'android';
}

/** Filtra las financieras que aplican para un producto */
export function getFinancierasForProduct(
  marcaOrProduct?: string | Partial<import('../types').Product>,
  categoria?: string,
  nombre?: string,
  precio?: number | null
): Financiera[] {
  let marca: string | undefined;
  let cat: string | undefined = categoria;
  let nom: string | undefined = nombre;
  let pr: number | null | undefined = precio;

  if (typeof marcaOrProduct === 'object' && marcaOrProduct !== null) {
    marca = marcaOrProduct.marca;
    cat = marcaOrProduct.categoria ?? categoria;
    nom = marcaOrProduct.nombre ?? nombre;
    pr = (marcaOrProduct.contado ?? marcaOrProduct.precio) as number | null | undefined;
  } else {
    marca = marcaOrProduct;
  }

  const type = getProductType(marca, nom, cat);

  // Regla para accesorios: precio <= $100.000 COP NO tiene crédito disponible
  if (type === 'accesorio' && pr !== undefined && pr !== null && pr <= UMBRAL_PRECIO_ACCESORIOS_CREDITO) {
    return [];
  }

  const keyMap: Record<ProductType, keyof Financiera['aplicaEn']> = {
    iphone: 'iphone',
    android: 'android',
    electrodomestico: 'electrodomestico',
    accesorio: 'accesorio',
  };
  return FINANCIERAS.filter((f) => f.aplicaEn[keyMap[type]]);
}

export const getFinancierasDisponibles = getFinancierasForProduct;
