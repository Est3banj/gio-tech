// src/data/repair-prices.ts
import { formatPrice } from '../utils/formatters';

export type RepairBrandId =
  | 'apple'
  | 'samsung'
  | 'xiaomi'
  | 'motorola'
  | 'tecno'
  | 'infinix'
  | 'huawei'
  | 'vivo'
  | 'oppo'
  | 'realme'
  | 'nokia'
  | 'zte'
  | 'lg';

export type ScreenVariantType =
  | 'Incell'
  | 'OLED'
  | 'Original con marco'
  | 'GX'
  | 'JK'
  | 'C/M'
  | 'Calidad AAA'
  | 'Service Pack';

export interface ScreenVariantInfo {
  variant: ScreenVariantType;
  priceCOP: number;
  qualityDescription?: string;
  warrantyDays: number;
  estimatedMinutes: number;
  recommended?: boolean;
}

export interface ModelRepairData {
  model: string;
  aliases?: string[];
  popular?: boolean;
  screenPrices: ScreenVariantInfo[];
  batteryPriceCOP?: number;
}

export interface BrandRepairData {
  id: RepairBrandId;
  name: string;
  iconClass: string;
  popular?: boolean;
  models: ModelRepairData[];
}

export type ChargingPortType = 'tipo_c' | 'v8_micro_usb';

export interface ChargingPortOption {
  id: ChargingPortType;
  label: string;
  priceCOP: number;
  description: string;
  estimatedMinutes: number;
  warrantyDays: number;
}

export type MaintenanceTierId = 'basico' | 'completo' | 'pro_ultrasonico';

export interface MaintenanceOption {
  id: MaintenanceTierId;
  name: string;
  priceCOP: number;
  description: string;
  durationMinutes: number;
  includes: string[];
}

export type RepairCategoryId =
  | 'pantalla'
  | 'bateria'
  | 'pin_carga'
  | 'placa_no_prende'
  | 'mojado'
  | 'mantenimiento'
  | 'otro'
  | 'microelectronica'
  | 'camara_audio';

export interface RepairCategoryOption {
  id: RepairCategoryId;
  title: string;
  shortDesc: string;
  icon: string; // Bootstrap Icons class
  badge?: string;
  pricingType: 'screens_db' | 'fixed' | 'tiers' | 'range' | 'custom_quote';
  basePriceRange?: { min: number; max: number };
  estimatedTime: string;
}

export type PutumayoMunicipality =
  | 'Puerto Asís'
  | 'Mocoa'
  | 'Orito'
  | 'La Hormiga (Valle del Guamuez)'
  | 'Villagarzón'
  | 'Puerto Caicedo'
  | 'San Miguel (La Dorada)'
  | 'Puerto Guzmán'
  | 'Sibundoy'
  | 'Colón'
  | 'Santiago'
  | 'San Francisco'
  | 'Puerto Leguízamo'
  | 'Otro Municipio / Encomienda';

export const PUTUMAYO_MUNICIPALITIES: PutumayoMunicipality[] = [
  'Puerto Asís',
  'Mocoa',
  'Orito',
  'La Hormiga (Valle del Guamuez)',
  'Villagarzón',
  'Puerto Caicedo',
  'San Miguel (La Dorada)',
  'Puerto Guzmán',
  'Sibundoy',
  'Colón',
  'Santiago',
  'San Francisco',
  'Puerto Leguízamo',
  'Otro Municipio / Encomienda',
];

export const CHARGING_PORT_OPTIONS: ChargingPortOption[] = [
  {
    id: 'tipo_c',
    label: 'Pin de Carga Tipo C (USB-C)',
    priceCOP: 50000,
    description: 'Reemplazo con conector reforzado de alta velocidad y carga rápida garantizada.',
    estimatedMinutes: 45,
    warrantyDays: 30,
  },
  {
    id: 'v8_micro_usb',
    label: 'Pin de Carga V8 (Micro-USB)',
    priceCOP: 30000,
    description: 'Instalación de pin micro-USB de precisión con soldadura estaño-plata reforzada.',
    estimatedMinutes: 40,
    warrantyDays: 30,
  },
];

export const MAINTENANCE_OPTIONS: MaintenanceOption[] = [
  {
    id: 'basico',
    name: 'Mantenimiento Básico & Desinfección',
    priceCOP: 30000,
    description: 'Limpieza externa, cepillado de puertos, micrófono y auricular con alcohol isopropílico 99%.',
    durationMinutes: 30,
    includes: [
      'Limpieza de puerto de carga y jack de audio',
      'Desobstrucción de malla de auricular y altavoz',
      'Desinfección superficial de pantalla y chasis',
    ],
  },
  {
    id: 'completo',
    name: 'Mantenimiento Completo & Térmico',
    priceCOP: 60000,
    description: 'Desarme preventivo, renovación de pasta/pads térmicos en procesador y limpieza interna.',
    durationMinutes: 60,
    includes: [
      'Desensamble completo y aspirado antiestático',
      'Renovación de pasta o lámina térmica disipadora',
      'Limpieza profunda de conectores FPC y cámaras',
      'Calibración de botones y sensores',
    ],
  },
  {
    id: 'pro_ultrasonico',
    name: 'Limpieza Ultrasónica de Placa & Desoxidación',
    priceCOP: 100000,
    description: 'Inmersión de placa lógica en tina ultrasónica con químico desoxidante grado técnico.',
    durationMinutes: 120,
    includes: [
      'Baño en tina de ultrasonido para eliminación de sulfato',
      'Secado y curado en horno térmico deshumidificador',
      'Inspección microscópica de pistas y micro-componentes',
      'Prueba de consumo de corriente con fuente de poder',
    ],
  },
];

export const REPAIR_CATEGORIES: RepairCategoryOption[] = [
  {
    id: 'pantalla',
    title: 'Pantalla / Glass',
    shortDesc: 'Displays Incell, OLED, AMOLED o visor.',
    icon: 'bi-phone',
    badge: 'Express 45m',
    pricingType: 'screens_db',
    estimatedTime: '30 - 60 min',
  },
  {
    id: 'bateria',
    title: 'Batería',
    shortDesc: 'Celdas de alta densidad con 100% de salud.',
    icon: 'bi-battery-charging',
    badge: 'Garantía 60d',
    pricingType: 'range',
    basePriceRange: { min: 70000, max: 180000 },
    estimatedTime: '30 - 45 min',
  },
  {
    id: 'pin_carga',
    title: 'Pin de Carga',
    shortDesc: 'Conector Tipo C o V8 con soldadura reforzada.',
    icon: 'bi-lightning-charge',
    badge: 'Tarifa Fija',
    pricingType: 'fixed',
    estimatedTime: '30 - 45 min',
  },
  {
    id: 'placa_no_prende',
    title: 'Placa / No prende',
    shortDesc: 'Diagnóstico de cortos y microelectrónica.',
    icon: 'bi-cpu',
    badge: 'Laboratorio',
    pricingType: 'custom_quote',
    estimatedTime: '24 - 48 h',
  },
  {
    id: 'mojado',
    title: 'Mojado',
    shortDesc: 'Desoxidación profunda en tina ultrasónica.',
    icon: 'bi-droplet-half',
    badge: 'Ultrasonido',
    pricingType: 'custom_quote',
    estimatedTime: '24 - 48 h',
  },
  {
    id: 'mantenimiento',
    title: 'Mantenimiento',
    shortDesc: 'Limpieza preventiva, puertos y pasta térmica.',
    icon: 'bi-tools',
    badge: 'Preventivo',
    pricingType: 'tiers',
    basePriceRange: { min: 30000, max: 100000 },
    estimatedTime: '30 - 60 min',
  },
  {
    id: 'otro',
    title: 'Otra falla',
    shortDesc: 'Cámaras, audio, botones o revisión general.',
    icon: 'bi-wrench-adjustable-circle',
    badge: 'Diagnóstico',
    pricingType: 'custom_quote',
    estimatedTime: 'Revisión en taller',
  },
];

// Base de datos de modelos y pantallas organizada por marca
export const REPAIR_BRANDS_DATABASE: BrandRepairData[] = [
  {
    id: 'apple',
    name: 'Apple iPhone',
    iconClass: 'bi-apple',
    popular: true,
    models: [
      {
        model: 'iPhone 15 Pro Max',
        popular: true,
        screenPrices: [
          { variant: 'GX', priceCOP: 650000, warrantyDays: 60, estimatedMinutes: 60, qualityDescription: 'OLED Hard GX Premium' },
          { variant: 'JK', priceCOP: 700000, warrantyDays: 60, estimatedMinutes: 60, qualityDescription: 'OLED Soft JK Alta Fidelidad' },
          { variant: 'OLED', priceCOP: 940000, warrantyDays: 90, estimatedMinutes: 60, qualityDescription: 'OLED Super Retina XDR Pro' },
          { variant: 'Original con marco', priceCOP: 1390000, warrantyDays: 90, estimatedMinutes: 60, qualityDescription: 'Original Certificada Apple', recommended: true },
        ],
        batteryPriceCOP: 220000,
      },
      {
        model: 'iPhone 15 Pro',
        popular: true,
        screenPrices: [
          { variant: 'GX', priceCOP: 620000, warrantyDays: 60, estimatedMinutes: 60 },
          { variant: 'JK', priceCOP: 670000, warrantyDays: 60, estimatedMinutes: 60 },
          { variant: 'OLED', priceCOP: 890000, warrantyDays: 90, estimatedMinutes: 60 },
          { variant: 'Original con marco', priceCOP: 1290000, warrantyDays: 90, estimatedMinutes: 60, recommended: true },
        ],
        batteryPriceCOP: 200000,
      },
      {
        model: 'iPhone 15 / 15 Plus',
        popular: true,
        screenPrices: [
          { variant: 'Incell', priceCOP: 360000, warrantyDays: 30, estimatedMinutes: 45 },
          { variant: 'GX', priceCOP: 490000, warrantyDays: 60, estimatedMinutes: 50 },
          { variant: 'JK', priceCOP: 530000, warrantyDays: 60, estimatedMinutes: 50 },
          { variant: 'OLED', priceCOP: 660000, warrantyDays: 90, estimatedMinutes: 50, recommended: true },
          { variant: 'Original con marco', priceCOP: 890000, warrantyDays: 90, estimatedMinutes: 50 },
        ],
        batteryPriceCOP: 190000,
      },
      {
        model: 'iPhone 14 Pro Max',
        popular: true,
        screenPrices: [
          { variant: 'GX', priceCOP: 520000, warrantyDays: 60, estimatedMinutes: 60 },
          { variant: 'JK', priceCOP: 560000, warrantyDays: 60, estimatedMinutes: 60 },
          { variant: 'OLED', priceCOP: 760000, warrantyDays: 90, estimatedMinutes: 60 },
          { variant: 'Original con marco', priceCOP: 1150000, warrantyDays: 90, estimatedMinutes: 60, recommended: true },
        ],
        batteryPriceCOP: 190000,
      },
      {
        model: 'iPhone 14 Pro',
        screenPrices: [
          { variant: 'GX', priceCOP: 490000, warrantyDays: 60, estimatedMinutes: 60 },
          { variant: 'JK', priceCOP: 530000, warrantyDays: 60, estimatedMinutes: 60 },
          { variant: 'OLED', priceCOP: 720000, warrantyDays: 90, estimatedMinutes: 60 },
          { variant: 'Original con marco', priceCOP: 1080000, warrantyDays: 90, estimatedMinutes: 60, recommended: true },
        ],
        batteryPriceCOP: 180000,
      },
      {
        model: 'iPhone 14 / 14 Plus',
        popular: true,
        screenPrices: [
          { variant: 'Incell', priceCOP: 270000, warrantyDays: 30, estimatedMinutes: 45 },
          { variant: 'GX', priceCOP: 380000, warrantyDays: 60, estimatedMinutes: 50 },
          { variant: 'JK', priceCOP: 410000, warrantyDays: 60, estimatedMinutes: 50 },
          { variant: 'OLED', priceCOP: 490000, warrantyDays: 90, estimatedMinutes: 50, recommended: true },
          { variant: 'Original con marco', priceCOP: 690000, warrantyDays: 90, estimatedMinutes: 50 },
        ],
        batteryPriceCOP: 170000,
      },
      {
        model: 'iPhone 13 Pro Max',
        popular: true,
        screenPrices: [
          { variant: 'GX', priceCOP: 420000, warrantyDays: 60, estimatedMinutes: 60 },
          { variant: 'JK', priceCOP: 450000, warrantyDays: 60, estimatedMinutes: 60 },
          { variant: 'OLED', priceCOP: 590000, warrantyDays: 90, estimatedMinutes: 60 },
          { variant: 'Original con marco', priceCOP: 890000, warrantyDays: 90, estimatedMinutes: 60, recommended: true },
        ],
        batteryPriceCOP: 170000,
      },
      {
        model: 'iPhone 13 Pro',
        screenPrices: [
          { variant: 'GX', priceCOP: 390000, warrantyDays: 60, estimatedMinutes: 60 },
          { variant: 'JK', priceCOP: 420000, warrantyDays: 60, estimatedMinutes: 60 },
          { variant: 'OLED', priceCOP: 550000, warrantyDays: 90, estimatedMinutes: 60 },
          { variant: 'Original con marco', priceCOP: 820000, warrantyDays: 90, estimatedMinutes: 60, recommended: true },
        ],
        batteryPriceCOP: 160000,
      },
      {
        model: 'iPhone 13 / 13 mini',
        popular: true,
        screenPrices: [
          { variant: 'Incell', priceCOP: 240000, warrantyDays: 30, estimatedMinutes: 45 },
          { variant: 'GX', priceCOP: 330000, warrantyDays: 60, estimatedMinutes: 50 },
          { variant: 'JK', priceCOP: 350000, warrantyDays: 60, estimatedMinutes: 50 },
          { variant: 'OLED', priceCOP: 420000, warrantyDays: 90, estimatedMinutes: 50, recommended: true },
          { variant: 'Original con marco', priceCOP: 580000, warrantyDays: 90, estimatedMinutes: 50 },
        ],
        batteryPriceCOP: 150000,
      },
      {
        model: 'iPhone 12 / 12 Pro',
        popular: true,
        screenPrices: [
          { variant: 'Incell', priceCOP: 210000, warrantyDays: 30, estimatedMinutes: 45 },
          { variant: 'GX', priceCOP: 290000, warrantyDays: 60, estimatedMinutes: 50 },
          { variant: 'JK', priceCOP: 310000, warrantyDays: 60, estimatedMinutes: 50 },
          { variant: 'OLED', priceCOP: 380000, warrantyDays: 90, estimatedMinutes: 50, recommended: true },
          { variant: 'Original con marco', priceCOP: 530000, warrantyDays: 90, estimatedMinutes: 50 },
        ],
        batteryPriceCOP: 140000,
      },
      {
        model: 'iPhone 12 Pro Max',
        popular: true,
        screenPrices: [
          { variant: 'Incell', priceCOP: 250000, warrantyDays: 30, estimatedMinutes: 50 },
          { variant: 'GX', priceCOP: 350000, warrantyDays: 60, estimatedMinutes: 50 },
          { variant: 'JK', priceCOP: 370000, warrantyDays: 60, estimatedMinutes: 50 },
          { variant: 'OLED', priceCOP: 440000, warrantyDays: 90, estimatedMinutes: 50, recommended: true },
          { variant: 'Original con marco', priceCOP: 610000, warrantyDays: 90, estimatedMinutes: 50 },
        ],
        batteryPriceCOP: 150000,
      },
      {
        model: 'iPhone 11',
        popular: true,
        screenPrices: [
          { variant: 'Incell', priceCOP: 140000, warrantyDays: 30, estimatedMinutes: 40 },
          { variant: 'Calidad AAA', priceCOP: 180000, warrantyDays: 60, estimatedMinutes: 40, recommended: true },
          { variant: 'Original con marco', priceCOP: 250000, warrantyDays: 90, estimatedMinutes: 45 },
        ],
        batteryPriceCOP: 120000,
      },
      {
        model: 'iPhone 11 Pro / 11 Pro Max',
        screenPrices: [
          { variant: 'Incell', priceCOP: 190000, warrantyDays: 30, estimatedMinutes: 45 },
          { variant: 'GX', priceCOP: 260000, warrantyDays: 60, estimatedMinutes: 50 },
          { variant: 'JK', priceCOP: 270000, warrantyDays: 60, estimatedMinutes: 50 },
          { variant: 'OLED', priceCOP: 320000, warrantyDays: 90, estimatedMinutes: 50, recommended: true },
          { variant: 'Original con marco', priceCOP: 440000, warrantyDays: 90, estimatedMinutes: 50 },
        ],
        batteryPriceCOP: 130000,
      },
      {
        model: 'iPhone X / XR / XS / XS Max',
        screenPrices: [
          { variant: 'Incell', priceCOP: 150000, warrantyDays: 30, estimatedMinutes: 40 },
          { variant: 'GX', priceCOP: 210000, warrantyDays: 60, estimatedMinutes: 45 },
          { variant: 'JK', priceCOP: 220000, warrantyDays: 60, estimatedMinutes: 45 },
          { variant: 'OLED', priceCOP: 250000, warrantyDays: 90, estimatedMinutes: 45, recommended: true },
          { variant: 'Original con marco', priceCOP: 340000, warrantyDays: 90, estimatedMinutes: 45 },
        ],
        batteryPriceCOP: 110000,
      },
      {
        model: 'iPhone 7 / 8 / Plus / SE 2020',
        screenPrices: [
          { variant: 'Incell', priceCOP: 90000, warrantyDays: 30, estimatedMinutes: 35 },
          { variant: 'Calidad AAA', priceCOP: 120000, warrantyDays: 60, estimatedMinutes: 35, recommended: true },
          { variant: 'Original con marco', priceCOP: 160000, warrantyDays: 90, estimatedMinutes: 40 },
        ],
        batteryPriceCOP: 85000,
      },
    ],
  },
  {
    id: 'samsung',
    name: 'Samsung Galaxy',
    iconClass: 'bi-phone',
    popular: true,
    models: [
      {
        model: 'Galaxy A03 / A03s / A03 Core',
        screenPrices: [
          { variant: 'Incell', priceCOP: 110000, warrantyDays: 30, estimatedMinutes: 40, recommended: true },
          { variant: 'Original con marco', priceCOP: 160000, warrantyDays: 60, estimatedMinutes: 45 },
        ],
        batteryPriceCOP: 75000,
      },
      {
        model: 'Galaxy A04 / A04e / A04s',
        screenPrices: [
          { variant: 'Incell', priceCOP: 115000, warrantyDays: 30, estimatedMinutes: 40, recommended: true },
          { variant: 'Original con marco', priceCOP: 165000, warrantyDays: 60, estimatedMinutes: 45 },
        ],
        batteryPriceCOP: 75000,
      },
      {
        model: 'Galaxy A05 / A05s',
        popular: true,
        screenPrices: [
          { variant: 'Incell', priceCOP: 125000, warrantyDays: 30, estimatedMinutes: 40, recommended: true },
          { variant: 'Original con marco', priceCOP: 175000, warrantyDays: 60, estimatedMinutes: 45 },
        ],
        batteryPriceCOP: 80000,
      },
      {
        model: 'Galaxy A06',
        screenPrices: [
          { variant: 'Incell', priceCOP: 130000, warrantyDays: 30, estimatedMinutes: 40, recommended: true },
          { variant: 'Original con marco', priceCOP: 180000, warrantyDays: 60, estimatedMinutes: 45 },
        ],
        batteryPriceCOP: 80000,
      },
      {
        model: 'Galaxy A12 / A13 (4G / 5G)',
        popular: true,
        screenPrices: [
          { variant: 'Incell', priceCOP: 120000, warrantyDays: 30, estimatedMinutes: 40, recommended: true },
          { variant: 'Original con marco', priceCOP: 175000, warrantyDays: 60, estimatedMinutes: 45 },
        ],
        batteryPriceCOP: 80000,
      },
      {
        model: 'Galaxy A14 (4G / 5G)',
        popular: true,
        screenPrices: [
          { variant: 'Incell', priceCOP: 130000, warrantyDays: 30, estimatedMinutes: 40, recommended: true },
          { variant: 'Original con marco', priceCOP: 190000, warrantyDays: 60, estimatedMinutes: 45 },
        ],
        batteryPriceCOP: 85000,
      },
      {
        model: 'Galaxy A15 (4G / 5G)',
        popular: true,
        screenPrices: [
          { variant: 'Incell', priceCOP: 150000, warrantyDays: 30, estimatedMinutes: 40 },
          { variant: 'OLED', priceCOP: 240000, warrantyDays: 60, estimatedMinutes: 45, recommended: true },
          { variant: 'Original con marco', priceCOP: 310000, warrantyDays: 90, estimatedMinutes: 50 },
        ],
        batteryPriceCOP: 85000,
      },
      {
        model: 'Galaxy A21s / A22 / A23',
        screenPrices: [
          { variant: 'Incell', priceCOP: 130000, warrantyDays: 30, estimatedMinutes: 40, recommended: true },
          { variant: 'OLED', priceCOP: 220000, warrantyDays: 60, estimatedMinutes: 45 },
          { variant: 'Original con marco', priceCOP: 280000, warrantyDays: 90, estimatedMinutes: 50 },
        ],
        batteryPriceCOP: 85000,
      },
      {
        model: 'Galaxy A24 / A25',
        popular: true,
        screenPrices: [
          { variant: 'Incell', priceCOP: 160000, warrantyDays: 30, estimatedMinutes: 40 },
          { variant: 'OLED', priceCOP: 250000, warrantyDays: 60, estimatedMinutes: 45, recommended: true },
          { variant: 'Original con marco', priceCOP: 330000, warrantyDays: 90, estimatedMinutes: 50 },
        ],
        batteryPriceCOP: 90000,
      },
      {
        model: 'Galaxy A30 / A31 / A32',
        screenPrices: [
          { variant: 'Incell', priceCOP: 135000, warrantyDays: 30, estimatedMinutes: 40 },
          { variant: 'OLED', priceCOP: 220000, warrantyDays: 60, estimatedMinutes: 45, recommended: true },
          { variant: 'Original con marco', priceCOP: 290000, warrantyDays: 90, estimatedMinutes: 50 },
        ],
        batteryPriceCOP: 85000,
      },
      {
        model: 'Galaxy A33 5G / A34 5G',
        popular: true,
        screenPrices: [
          { variant: 'Incell', priceCOP: 170000, warrantyDays: 30, estimatedMinutes: 40 },
          { variant: 'OLED', priceCOP: 280000, warrantyDays: 60, estimatedMinutes: 50, recommended: true },
          { variant: 'Original con marco', priceCOP: 370000, warrantyDays: 90, estimatedMinutes: 50 },
        ],
        batteryPriceCOP: 95000,
      },
      {
        model: 'Galaxy A35 5G',
        screenPrices: [
          { variant: 'OLED', priceCOP: 320000, warrantyDays: 60, estimatedMinutes: 50, recommended: true },
          { variant: 'Original con marco', priceCOP: 420000, warrantyDays: 90, estimatedMinutes: 50 },
        ],
        batteryPriceCOP: 100000,
      },
      {
        model: 'Galaxy A50 / A51 / A52 / A52s',
        popular: true,
        screenPrices: [
          { variant: 'Incell', priceCOP: 150000, warrantyDays: 30, estimatedMinutes: 40 },
          { variant: 'OLED', priceCOP: 260000, warrantyDays: 60, estimatedMinutes: 45, recommended: true },
          { variant: 'Original con marco', priceCOP: 340000, warrantyDays: 90, estimatedMinutes: 50 },
        ],
        batteryPriceCOP: 90000,
      },
      {
        model: 'Galaxy A53 5G / A54 5G',
        popular: true,
        screenPrices: [
          { variant: 'Incell', priceCOP: 180000, warrantyDays: 30, estimatedMinutes: 45 },
          { variant: 'OLED', priceCOP: 310000, warrantyDays: 60, estimatedMinutes: 50, recommended: true },
          { variant: 'Original con marco', priceCOP: 420000, warrantyDays: 90, estimatedMinutes: 50 },
        ],
        batteryPriceCOP: 105000,
      },
      {
        model: 'Galaxy A55 5G',
        screenPrices: [
          { variant: 'OLED', priceCOP: 360000, warrantyDays: 60, estimatedMinutes: 50, recommended: true },
          { variant: 'Original con marco', priceCOP: 480000, warrantyDays: 90, estimatedMinutes: 50 },
        ],
        batteryPriceCOP: 110000,
      },
      {
        model: 'Galaxy S20 FE / S21 FE',
        popular: true,
        screenPrices: [
          { variant: 'Incell', priceCOP: 190000, warrantyDays: 30, estimatedMinutes: 45 },
          { variant: 'OLED', priceCOP: 330000, warrantyDays: 60, estimatedMinutes: 50, recommended: true },
          { variant: 'Original con marco', priceCOP: 450000, warrantyDays: 90, estimatedMinutes: 55 },
        ],
        batteryPriceCOP: 120000,
      },
      {
        model: 'Galaxy S21 / S22 / S23 / S24',
        screenPrices: [
          { variant: 'OLED', priceCOP: 560000, warrantyDays: 60, estimatedMinutes: 60 },
          { variant: 'Original con marco', priceCOP: 790000, warrantyDays: 90, estimatedMinutes: 60, recommended: true },
        ],
        batteryPriceCOP: 160000,
      },
      {
        model: 'Galaxy S23 Ultra / S24 Ultra',
        screenPrices: [
          { variant: 'OLED', priceCOP: 790000, warrantyDays: 60, estimatedMinutes: 70 },
          { variant: 'Original con marco', priceCOP: 1150000, warrantyDays: 90, estimatedMinutes: 70, recommended: true },
        ],
        batteryPriceCOP: 190000,
      },
    ],
  },
  {
    id: 'xiaomi',
    name: 'Xiaomi / Redmi / Poco',
    iconClass: 'bi-phone',
    popular: true,
    models: [
      {
        model: 'Redmi 9 / 9A / 9C / 9T',
        screenPrices: [
          { variant: 'Incell', priceCOP: 105000, warrantyDays: 30, estimatedMinutes: 40, recommended: true },
          { variant: 'Original con marco', priceCOP: 155000, warrantyDays: 60, estimatedMinutes: 45 },
        ],
        batteryPriceCOP: 75000,
      },
      {
        model: 'Redmi 10 / 10A / 10C',
        screenPrices: [
          { variant: 'Incell', priceCOP: 115000, warrantyDays: 30, estimatedMinutes: 40, recommended: true },
          { variant: 'Original con marco', priceCOP: 165000, warrantyDays: 60, estimatedMinutes: 45 },
        ],
        batteryPriceCOP: 75000,
      },
      {
        model: 'Redmi 12 / 12C / 13 / 13C / 14C',
        popular: true,
        screenPrices: [
          { variant: 'Incell', priceCOP: 125000, warrantyDays: 30, estimatedMinutes: 40, recommended: true },
          { variant: 'Original con marco', priceCOP: 175000, warrantyDays: 60, estimatedMinutes: 45 },
        ],
        batteryPriceCOP: 80000,
      },
      {
        model: 'Redmi Note 8 / Note 8 Pro / Note 9 / Note 9S',
        screenPrices: [
          { variant: 'Incell', priceCOP: 120000, warrantyDays: 30, estimatedMinutes: 40, recommended: true },
          { variant: 'Original con marco', priceCOP: 170000, warrantyDays: 60, estimatedMinutes: 45 },
        ],
        batteryPriceCOP: 80000,
      },
      {
        model: 'Redmi Note 10 / Note 10 Pro',
        popular: true,
        screenPrices: [
          { variant: 'Incell', priceCOP: 140000, warrantyDays: 30, estimatedMinutes: 40 },
          { variant: 'OLED', priceCOP: 240000, warrantyDays: 60, estimatedMinutes: 45, recommended: true },
          { variant: 'Original con marco', priceCOP: 310000, warrantyDays: 90, estimatedMinutes: 50 },
        ],
        batteryPriceCOP: 85000,
      },
      {
        model: 'Redmi Note 11 / Note 11S / Note 11 Pro',
        popular: true,
        screenPrices: [
          { variant: 'Incell', priceCOP: 145000, warrantyDays: 30, estimatedMinutes: 40 },
          { variant: 'OLED', priceCOP: 250000, warrantyDays: 60, estimatedMinutes: 45, recommended: true },
          { variant: 'Original con marco', priceCOP: 330000, warrantyDays: 90, estimatedMinutes: 50 },
        ],
        batteryPriceCOP: 90000,
      },
      {
        model: 'Redmi Note 12 / Note 12S / Note 12 Pro',
        popular: true,
        screenPrices: [
          { variant: 'Incell', priceCOP: 155000, warrantyDays: 30, estimatedMinutes: 40 },
          { variant: 'OLED', priceCOP: 270000, warrantyDays: 60, estimatedMinutes: 45, recommended: true },
          { variant: 'Original con marco', priceCOP: 350000, warrantyDays: 90, estimatedMinutes: 50 },
        ],
        batteryPriceCOP: 95000,
      },
      {
        model: 'Redmi Note 13 / Note 13 Pro (4G / 5G)',
        popular: true,
        screenPrices: [
          { variant: 'Incell', priceCOP: 165000, warrantyDays: 30, estimatedMinutes: 40 },
          { variant: 'OLED', priceCOP: 290000, warrantyDays: 60, estimatedMinutes: 45, recommended: true },
          { variant: 'Original con marco', priceCOP: 380000, warrantyDays: 90, estimatedMinutes: 50 },
        ],
        batteryPriceCOP: 100000,
      },
      {
        model: 'Redmi Note 13 Pro+ 5G (Curva)',
        screenPrices: [
          { variant: 'OLED', priceCOP: 380000, warrantyDays: 60, estimatedMinutes: 55, recommended: true },
          { variant: 'Original con marco', priceCOP: 490000, warrantyDays: 90, estimatedMinutes: 55 },
        ],
        batteryPriceCOP: 110000,
      },
      {
        model: 'Poco X3 / X3 Pro / X3 NFC',
        popular: true,
        screenPrices: [
          { variant: 'Incell', priceCOP: 130000, warrantyDays: 30, estimatedMinutes: 40, recommended: true },
          { variant: 'Original con marco', priceCOP: 190000, warrantyDays: 60, estimatedMinutes: 45 },
        ],
        batteryPriceCOP: 85000,
      },
      {
        model: 'Poco X4 Pro / X5 Pro / X6 Pro',
        popular: true,
        screenPrices: [
          { variant: 'Incell', priceCOP: 165000, warrantyDays: 30, estimatedMinutes: 40 },
          { variant: 'OLED', priceCOP: 280000, warrantyDays: 60, estimatedMinutes: 45, recommended: true },
          { variant: 'Original con marco', priceCOP: 370000, warrantyDays: 90, estimatedMinutes: 50 },
        ],
        batteryPriceCOP: 100000,
      },
      {
        model: 'Poco M3 / M4 Pro / M5 / M6 Pro',
        screenPrices: [
          { variant: 'Incell', priceCOP: 125000, warrantyDays: 30, estimatedMinutes: 40, recommended: true },
          { variant: 'OLED', priceCOP: 250000, warrantyDays: 60, estimatedMinutes: 45 },
          { variant: 'Original con marco', priceCOP: 185000, warrantyDays: 60, estimatedMinutes: 45 },
        ],
        batteryPriceCOP: 85000,
      },
      {
        model: 'Poco F3 / F4 / F5 / F6',
        screenPrices: [
          { variant: 'OLED', priceCOP: 320000, warrantyDays: 60, estimatedMinutes: 50, recommended: true },
          { variant: 'Original con marco', priceCOP: 430000, warrantyDays: 90, estimatedMinutes: 55 },
        ],
        batteryPriceCOP: 110000,
      },
      {
        model: 'Xiaomi 11T / 12T / 13T',
        screenPrices: [
          { variant: 'OLED', priceCOP: 360000, warrantyDays: 60, estimatedMinutes: 50, recommended: true },
          { variant: 'Original con marco', priceCOP: 490000, warrantyDays: 90, estimatedMinutes: 55 },
        ],
        batteryPriceCOP: 120000,
      },
    ],
  },
  {
    id: 'motorola',
    name: 'Motorola Moto',
    iconClass: 'bi-phone',
    popular: true,
    models: [
      {
        model: 'Moto E13 / E20 / E22 / E22i / E32 / E40',
        screenPrices: [
          { variant: 'Incell', priceCOP: 110000, warrantyDays: 30, estimatedMinutes: 40, recommended: true },
          { variant: 'Original con marco', priceCOP: 160000, warrantyDays: 60, estimatedMinutes: 45 },
        ],
        batteryPriceCOP: 75000,
      },
      {
        model: 'Moto G8 / G8 Power / G9 Play / G9 Power / G9 Plus',
        screenPrices: [
          { variant: 'Incell', priceCOP: 115000, warrantyDays: 30, estimatedMinutes: 40, recommended: true },
          { variant: 'Original con marco', priceCOP: 165000, warrantyDays: 60, estimatedMinutes: 45 },
        ],
        batteryPriceCOP: 75000,
      },
      {
        model: 'Moto G20 / G22 / G23 / G24 / G24 Power',
        popular: true,
        screenPrices: [
          { variant: 'Incell', priceCOP: 125000, warrantyDays: 30, estimatedMinutes: 40, recommended: true },
          { variant: 'Original con marco', priceCOP: 175000, warrantyDays: 60, estimatedMinutes: 45 },
        ],
        batteryPriceCOP: 80000,
      },
      {
        model: 'Moto G30 / G31 / G32 / G34',
        popular: true,
        screenPrices: [
          { variant: 'Incell', priceCOP: 130000, warrantyDays: 30, estimatedMinutes: 40, recommended: true },
          { variant: 'OLED', priceCOP: 230000, warrantyDays: 60, estimatedMinutes: 45 },
          { variant: 'Original con marco', priceCOP: 185000, warrantyDays: 60, estimatedMinutes: 45 },
        ],
        batteryPriceCOP: 85000,
      },
      {
        model: 'Moto G51 / G52 / G53 / G54 5G',
        popular: true,
        screenPrices: [
          { variant: 'Incell', priceCOP: 135000, warrantyDays: 30, estimatedMinutes: 40 },
          { variant: 'OLED', priceCOP: 250000, warrantyDays: 60, estimatedMinutes: 45, recommended: true },
          { variant: 'Original con marco', priceCOP: 200000, warrantyDays: 60, estimatedMinutes: 45 },
        ],
        batteryPriceCOP: 90000,
      },
      {
        model: 'Moto G60 / G60s',
        popular: true,
        screenPrices: [
          { variant: 'Incell', priceCOP: 140000, warrantyDays: 30, estimatedMinutes: 40, recommended: true },
          { variant: 'Original con marco', priceCOP: 200000, warrantyDays: 60, estimatedMinutes: 45 },
        ],
        batteryPriceCOP: 90000,
      },
      {
        model: 'Moto G71 / G72 / G73 / G84',
        popular: true,
        screenPrices: [
          { variant: 'Incell', priceCOP: 155000, warrantyDays: 30, estimatedMinutes: 40 },
          { variant: 'OLED', priceCOP: 270000, warrantyDays: 60, estimatedMinutes: 45, recommended: true },
          { variant: 'Original con marco', priceCOP: 350000, warrantyDays: 90, estimatedMinutes: 50 },
        ],
        batteryPriceCOP: 95000,
      },
      {
        model: 'Moto Edge 20 / 30 / 40 / 50 Neo',
        screenPrices: [
          { variant: 'OLED', priceCOP: 380000, warrantyDays: 60, estimatedMinutes: 50, recommended: true },
          { variant: 'Original con marco', priceCOP: 490000, warrantyDays: 90, estimatedMinutes: 55 },
        ],
        batteryPriceCOP: 110000,
      },
    ],
  },
  {
    id: 'tecno',
    name: 'Tecno Mobile',
    iconClass: 'bi-phone',
    popular: true,
    models: [
      {
        model: 'Tecno Spark 20 Pro+ (Curva)',
        popular: true,
        screenPrices: [
          { variant: 'OLED', priceCOP: 280000, warrantyDays: 60, estimatedMinutes: 50, recommended: true },
          { variant: 'Original con marco', priceCOP: 360000, warrantyDays: 90, estimatedMinutes: 55 },
        ],
        batteryPriceCOP: 85000,
      },
      {
        model: 'Tecno Spark 20 Pro',
        popular: true,
        screenPrices: [
          { variant: 'Incell', priceCOP: 150000, warrantyDays: 30, estimatedMinutes: 40, recommended: true },
          { variant: 'Original con marco', priceCOP: 210000, warrantyDays: 60, estimatedMinutes: 45 },
        ],
        batteryPriceCOP: 80000,
      },
      {
        model: 'Tecno Spark 20 / 20C',
        popular: true,
        screenPrices: [
          { variant: 'Incell', priceCOP: 130000, warrantyDays: 30, estimatedMinutes: 40, recommended: true },
          { variant: 'Original con marco', priceCOP: 190000, warrantyDays: 60, estimatedMinutes: 45 },
        ],
        batteryPriceCOP: 75000,
      },
      {
        model: 'Tecno Spark 10 / 10 Pro / 10C',
        popular: true,
        screenPrices: [
          { variant: 'Incell', priceCOP: 130000, warrantyDays: 30, estimatedMinutes: 40, recommended: true },
          { variant: 'Original con marco', priceCOP: 185000, warrantyDays: 60, estimatedMinutes: 45 },
        ],
        batteryPriceCOP: 75000,
      },
      {
        model: 'Tecno Spark 8 / 8C / 8P / 9 / 9 Pro',
        screenPrices: [
          { variant: 'Incell', priceCOP: 120000, warrantyDays: 30, estimatedMinutes: 40, recommended: true },
          { variant: 'Original con marco', priceCOP: 170000, warrantyDays: 60, estimatedMinutes: 45 },
        ],
        batteryPriceCOP: 70000,
      },
      {
        model: 'Tecno Spark 6 / 7 / 7 Pro / Go 2023 / 2024',
        screenPrices: [
          { variant: 'Incell', priceCOP: 110000, warrantyDays: 30, estimatedMinutes: 40, recommended: true },
          { variant: 'Original con marco', priceCOP: 160000, warrantyDays: 60, estimatedMinutes: 45 },
        ],
        batteryPriceCOP: 70000,
      },
      {
        model: 'Tecno Pop 7 / Pop 8',
        screenPrices: [
          { variant: 'Incell', priceCOP: 105000, warrantyDays: 30, estimatedMinutes: 40, recommended: true },
          { variant: 'Original con marco', priceCOP: 155000, warrantyDays: 60, estimatedMinutes: 45 },
        ],
        batteryPriceCOP: 65000,
      },
      {
        model: 'Tecno Pova 5 / Pova 5 Pro / Pova 6 Pro',
        popular: true,
        screenPrices: [
          { variant: 'Incell', priceCOP: 160000, warrantyDays: 30, estimatedMinutes: 45 },
          { variant: 'OLED', priceCOP: 320000, warrantyDays: 60, estimatedMinutes: 50, recommended: true },
          { variant: 'Original con marco', priceCOP: 230000, warrantyDays: 60, estimatedMinutes: 50 },
        ],
        batteryPriceCOP: 90000,
      },
      {
        model: 'Tecno Pova 4 / Pova 4 Pro',
        screenPrices: [
          { variant: 'Incell', priceCOP: 160000, warrantyDays: 30, estimatedMinutes: 40, recommended: true },
          { variant: 'OLED', priceCOP: 280000, warrantyDays: 60, estimatedMinutes: 45 },
          { variant: 'Original con marco', priceCOP: 240000, warrantyDays: 60, estimatedMinutes: 45 },
        ],
        batteryPriceCOP: 85000,
      },
      {
        model: 'Tecno Camon 20 / 20 Pro / 30 / 30 Pro',
        popular: true,
        screenPrices: [
          { variant: 'Incell', priceCOP: 160000, warrantyDays: 30, estimatedMinutes: 40 },
          { variant: 'OLED', priceCOP: 280000, warrantyDays: 60, estimatedMinutes: 45, recommended: true },
          { variant: 'Original con marco', priceCOP: 340000, warrantyDays: 90, estimatedMinutes: 50 },
        ],
        batteryPriceCOP: 90000,
      },
      {
        model: 'Tecno Camon 18 / 19 / 19 Pro',
        screenPrices: [
          { variant: 'Incell', priceCOP: 140000, warrantyDays: 30, estimatedMinutes: 40, recommended: true },
          { variant: 'Original con marco', priceCOP: 200000, warrantyDays: 60, estimatedMinutes: 45 },
        ],
        batteryPriceCOP: 80000,
      },
    ],
  },
  {
    id: 'infinix',
    name: 'Infinix',
    iconClass: 'bi-phone',
    popular: true,
    models: [
      {
        model: 'Infinix Hot 40 / Hot 40 Pro / Hot 40i',
        popular: true,
        screenPrices: [
          { variant: 'Incell', priceCOP: 140000, warrantyDays: 30, estimatedMinutes: 40, recommended: true },
          { variant: 'Original con marco', priceCOP: 200000, warrantyDays: 60, estimatedMinutes: 45 },
        ],
        batteryPriceCOP: 80000,
      },
      {
        model: 'Infinix Hot 30 / Hot 30 Play / Hot 30i',
        popular: true,
        screenPrices: [
          { variant: 'Incell', priceCOP: 125000, warrantyDays: 30, estimatedMinutes: 40, recommended: true },
          { variant: 'Original con marco', priceCOP: 180000, warrantyDays: 60, estimatedMinutes: 45 },
        ],
        batteryPriceCOP: 75000,
      },
      {
        model: 'Infinix Hot 20 / 20i / 20s / 12 / 12 Play',
        screenPrices: [
          { variant: 'Incell', priceCOP: 120000, warrantyDays: 30, estimatedMinutes: 40, recommended: true },
          { variant: 'Original con marco', priceCOP: 175000, warrantyDays: 60, estimatedMinutes: 45 },
        ],
        batteryPriceCOP: 75000,
      },
      {
        model: 'Infinix Hot 10 / 10 Play / 11 / 11s',
        screenPrices: [
          { variant: 'Incell', priceCOP: 110000, warrantyDays: 30, estimatedMinutes: 40, recommended: true },
          { variant: 'Original con marco', priceCOP: 160000, warrantyDays: 60, estimatedMinutes: 45 },
        ],
        batteryPriceCOP: 70000,
      },
      {
        model: 'Infinix Smart 7 / Smart 8',
        screenPrices: [
          { variant: 'Incell', priceCOP: 105000, warrantyDays: 30, estimatedMinutes: 40, recommended: true },
          { variant: 'Original con marco', priceCOP: 155000, warrantyDays: 60, estimatedMinutes: 45 },
        ],
        batteryPriceCOP: 65000,
      },
      {
        model: 'Infinix Note 30 / Note 30 Pro',
        popular: true,
        screenPrices: [
          { variant: 'Incell', priceCOP: 160000, warrantyDays: 30, estimatedMinutes: 40 },
          { variant: 'OLED', priceCOP: 270000, warrantyDays: 60, estimatedMinutes: 45, recommended: true },
          { variant: 'Original con marco', priceCOP: 330000, warrantyDays: 90, estimatedMinutes: 50 },
        ],
        batteryPriceCOP: 90000,
      },
      {
        model: 'Infinix Note 40 / Note 40 Pro',
        popular: true,
        screenPrices: [
          { variant: 'OLED', priceCOP: 320000, warrantyDays: 60, estimatedMinutes: 50, recommended: true },
          { variant: 'Original con marco', priceCOP: 390000, warrantyDays: 90, estimatedMinutes: 55 },
        ],
        batteryPriceCOP: 95000,
      },
      {
        model: 'Infinix Zero 30 / GT 10 Pro',
        screenPrices: [
          { variant: 'OLED', priceCOP: 310000, warrantyDays: 60, estimatedMinutes: 50, recommended: true },
          { variant: 'Original con marco', priceCOP: 390000, warrantyDays: 90, estimatedMinutes: 55 },
        ],
        batteryPriceCOP: 95000,
      },
    ],
  },
  {
    id: 'huawei',
    name: 'Huawei',
    iconClass: 'bi-phone',
    models: [
      {
        model: 'Huawei Y6 / Y6p / Y7 / Y7a / Y7p / Y8p / Y9 / Y9 Prime',
        screenPrices: [
          { variant: 'Incell', priceCOP: 115000, warrantyDays: 30, estimatedMinutes: 40, recommended: true },
          { variant: 'Original con marco', priceCOP: 165000, warrantyDays: 60, estimatedMinutes: 45 },
        ],
        batteryPriceCOP: 75000,
      },
      {
        model: 'Huawei Nova Y60 / Y70 / Y90',
        screenPrices: [
          { variant: 'Incell', priceCOP: 125000, warrantyDays: 30, estimatedMinutes: 40, recommended: true },
          { variant: 'Original con marco', priceCOP: 175000, warrantyDays: 60, estimatedMinutes: 45 },
        ],
        batteryPriceCOP: 80000,
      },
      {
        model: 'Huawei Nova 8i / 9 / 9 SE / 10 / 11 / 12',
        screenPrices: [
          { variant: 'Incell', priceCOP: 150000, warrantyDays: 30, estimatedMinutes: 40 },
          { variant: 'OLED', priceCOP: 280000, warrantyDays: 60, estimatedMinutes: 45, recommended: true },
          { variant: 'Original con marco', priceCOP: 360000, warrantyDays: 90, estimatedMinutes: 50 },
        ],
        batteryPriceCOP: 95000,
      },
      {
        model: 'Huawei P30 / P30 Lite / P40 / P40 Lite',
        screenPrices: [
          { variant: 'Incell', priceCOP: 125000, warrantyDays: 30, estimatedMinutes: 40 },
          { variant: 'OLED', priceCOP: 290000, warrantyDays: 60, estimatedMinutes: 45, recommended: true },
          { variant: 'Original con marco', priceCOP: 390000, warrantyDays: 90, estimatedMinutes: 50 },
        ],
        batteryPriceCOP: 85000,
      },
    ],
  },
  {
    id: 'vivo',
    name: 'Vivo',
    iconClass: 'bi-phone',
    models: [
      {
        model: 'Vivo Y02 / Y02s / Y03 / Y11 / Y11s / Y15s / Y17',
        screenPrices: [
          { variant: 'Incell', priceCOP: 110000, warrantyDays: 30, estimatedMinutes: 40, recommended: true },
          { variant: 'Original con marco', priceCOP: 160000, warrantyDays: 60, estimatedMinutes: 45 },
        ],
        batteryPriceCOP: 75000,
      },
      {
        model: 'Vivo Y20 / Y20s / Y21s / Y22s / Y27 / Y28',
        popular: true,
        screenPrices: [
          { variant: 'Incell', priceCOP: 125000, warrantyDays: 30, estimatedMinutes: 40, recommended: true },
          { variant: 'Original con marco', priceCOP: 175000, warrantyDays: 60, estimatedMinutes: 45 },
        ],
        batteryPriceCOP: 80000,
      },
      {
        model: 'Vivo Y33s / Y35 / Y36',
        screenPrices: [
          { variant: 'Incell', priceCOP: 130000, warrantyDays: 30, estimatedMinutes: 40, recommended: true },
          { variant: 'Original con marco', priceCOP: 185000, warrantyDays: 60, estimatedMinutes: 45 },
        ],
        batteryPriceCOP: 85000,
      },
      {
        model: 'Vivo V21 / V25 / V25e / V27 / V29 / V30 / V30 Lite',
        popular: true,
        screenPrices: [
          { variant: 'Incell', priceCOP: 165000, warrantyDays: 30, estimatedMinutes: 40 },
          { variant: 'OLED', priceCOP: 290000, warrantyDays: 60, estimatedMinutes: 45, recommended: true },
          { variant: 'Original con marco', priceCOP: 380000, warrantyDays: 90, estimatedMinutes: 50 },
        ],
        batteryPriceCOP: 95000,
      },
    ],
  },
  {
    id: 'oppo',
    name: 'Oppo',
    iconClass: 'bi-phone',
    models: [
      {
        model: 'Oppo A15 / A16 / A17 / A17k / A38 / A53 / A54 / A57 / A58',
        popular: true,
        screenPrices: [
          { variant: 'Incell', priceCOP: 120000, warrantyDays: 30, estimatedMinutes: 40, recommended: true },
          { variant: 'Original con marco', priceCOP: 170000, warrantyDays: 60, estimatedMinutes: 45 },
        ],
        batteryPriceCOP: 75000,
      },
      {
        model: 'Oppo A74 / A77 / A78 / A79',
        screenPrices: [
          { variant: 'Incell', priceCOP: 135000, warrantyDays: 30, estimatedMinutes: 40 },
          { variant: 'OLED', priceCOP: 250000, warrantyDays: 60, estimatedMinutes: 45, recommended: true },
          { variant: 'Original con marco', priceCOP: 195000, warrantyDays: 60, estimatedMinutes: 45 },
        ],
        batteryPriceCOP: 85000,
      },
      {
        model: 'Oppo Reno 5 / 6 / 7 / 7 5G / 8 / 8T / 10 / 11 / 12',
        popular: true,
        screenPrices: [
          { variant: 'Incell', priceCOP: 165000, warrantyDays: 30, estimatedMinutes: 40 },
          { variant: 'OLED', priceCOP: 290000, warrantyDays: 60, estimatedMinutes: 45, recommended: true },
          { variant: 'Original con marco', priceCOP: 390000, warrantyDays: 90, estimatedMinutes: 50 },
        ],
        batteryPriceCOP: 95000,
      },
    ],
  },
  {
    id: 'realme',
    name: 'Realme',
    iconClass: 'bi-phone',
    models: [
      {
        model: 'Realme C11 / C15 / C21 / C21Y / C25 / C30 / C33 / C35 / C51 / C53 / C55 / C67',
        popular: true,
        screenPrices: [
          { variant: 'Incell', priceCOP: 120000, warrantyDays: 30, estimatedMinutes: 40, recommended: true },
          { variant: 'Original con marco', priceCOP: 170000, warrantyDays: 60, estimatedMinutes: 45 },
        ],
        batteryPriceCOP: 75000,
      },
      {
        model: 'Realme 6 / 7 / 8 / 9 / 10 / 11 / 12',
        screenPrices: [
          { variant: 'Incell', priceCOP: 130000, warrantyDays: 30, estimatedMinutes: 40, recommended: true },
          { variant: 'OLED', priceCOP: 260000, warrantyDays: 60, estimatedMinutes: 45 },
          { variant: 'Original con marco', priceCOP: 190000, warrantyDays: 60, estimatedMinutes: 45 },
        ],
        batteryPriceCOP: 85000,
      },
      {
        model: 'Realme 7 Pro / 8 Pro / 9 Pro+ / 11 Pro+ / 12 Pro+',
        popular: true,
        screenPrices: [
          { variant: 'OLED', priceCOP: 310000, warrantyDays: 60, estimatedMinutes: 50, recommended: true },
          { variant: 'Original con marco', priceCOP: 420000, warrantyDays: 90, estimatedMinutes: 55 },
        ],
        batteryPriceCOP: 95000,
      },
    ],
  },
  {
    id: 'nokia',
    name: 'Nokia',
    iconClass: 'bi-phone',
    models: [
      {
        model: 'Nokia 1.4 / 2.4 / 3.4 / 5.4',
        screenPrices: [
          { variant: 'Incell', priceCOP: 110000, warrantyDays: 30, estimatedMinutes: 40, recommended: true },
          { variant: 'Original con marco', priceCOP: 160000, warrantyDays: 60, estimatedMinutes: 45 },
        ],
        batteryPriceCOP: 70000,
      },
      {
        model: 'Nokia C01 Plus / C20 / C30 / G10 / G20 / G21 / G50 / G60',
        screenPrices: [
          { variant: 'Incell', priceCOP: 120000, warrantyDays: 30, estimatedMinutes: 40, recommended: true },
          { variant: 'Original con marco', priceCOP: 170000, warrantyDays: 60, estimatedMinutes: 45 },
        ],
        batteryPriceCOP: 75000,
      },
    ],
  },
  {
    id: 'zte',
    name: 'ZTE',
    iconClass: 'bi-phone',
    models: [
      {
        model: 'ZTE Blade A31 / A33 Plus / A51 / A52 / A53 / A54 / A71 / A72 / A73',
        screenPrices: [
          { variant: 'Incell', priceCOP: 110000, warrantyDays: 30, estimatedMinutes: 40, recommended: true },
          { variant: 'Original con marco', priceCOP: 160000, warrantyDays: 60, estimatedMinutes: 45 },
        ],
        batteryPriceCOP: 70000,
      },
      {
        model: 'ZTE Blade V30 / V30 Vita / V40 / V40 Smart / V40 Design / V50 Design',
        screenPrices: [
          { variant: 'Incell', priceCOP: 125000, warrantyDays: 30, estimatedMinutes: 40, recommended: true },
          { variant: 'Original con marco', priceCOP: 175000, warrantyDays: 60, estimatedMinutes: 45 },
        ],
        batteryPriceCOP: 75000,
      },
    ],
  },
  {
    id: 'lg',
    name: 'LG',
    iconClass: 'bi-phone',
    models: [
      {
        model: 'LG K22 / K41s / K42 / K51s / K52 / K61 / K62',
        screenPrices: [
          { variant: 'Incell', priceCOP: 115000, warrantyDays: 30, estimatedMinutes: 40, recommended: true },
          { variant: 'Original con marco', priceCOP: 165000, warrantyDays: 60, estimatedMinutes: 45 },
        ],
        batteryPriceCOP: 70000,
      },
      {
        model: 'LG Velvet / Stylo 6',
        screenPrices: [
          { variant: 'Incell', priceCOP: 150000, warrantyDays: 30, estimatedMinutes: 45 },
          { variant: 'OLED', priceCOP: 290000, warrantyDays: 60, estimatedMinutes: 50, recommended: true },
          { variant: 'Original con marco', priceCOP: 380000, warrantyDays: 90, estimatedMinutes: 55 },
        ],
        batteryPriceCOP: 85000,
      },
    ],
  },
];

// Helper functions para consulta rápida y cálculo
export function getAllBrands(): BrandRepairData[] {
  return REPAIR_BRANDS_DATABASE;
}

export function getBrandById(brandId: string): BrandRepairData | undefined {
  return REPAIR_BRANDS_DATABASE.find((b) => b.id.toLowerCase() === brandId.toLowerCase());
}

export function getModelsForBrand(brandId: string): ModelRepairData[] {
  const brand = getBrandById(brandId);
  return brand ? brand.models : [];
}

export function findModelInBrand(brandId: string, modelNameOrQuery: string): ModelRepairData | undefined {
  const models = getModelsForBrand(brandId);
  if (!models || models.length === 0) return undefined;

  const normalizedQuery = modelNameOrQuery.trim().toLowerCase();
  if (!normalizedQuery) return undefined;

  // 1. Exact match
  const exact = models.find((m) => m.model.toLowerCase() === normalizedQuery);
  if (exact) return exact;

  // 2. Segment exact match (e.g. "iPhone 13" matches "iPhone 13 / 13 mini")
  const segmentMatch = models.find((m) => {
    const segments = m.model.split('/').map((s) => s.trim().toLowerCase());
    return segments.some((s) => {
      if (s === normalizedQuery) return true;
      // Prepend brand prefix if segment is just a number/suffix
      const firstWord = m.model.split(' ')[0].toLowerCase();
      return `${firstWord} ${s}` === normalizedQuery;
    });
  });
  if (segmentMatch) return segmentMatch;

  // 3. Match without "pro", "plus", "max", "ultra" if query didn't include them
  const hasPro = normalizedQuery.includes('pro');
  const hasMax = normalizedQuery.includes('max');
  const hasPlus = normalizedQuery.includes('plus') || normalizedQuery.includes('+');
  const hasUltra = normalizedQuery.includes('ultra');

  const candidates = models.filter((m) => {
    const lowerModel = m.model.toLowerCase();
    const tokens = normalizedQuery.split(/\s+/).filter(Boolean);
    return tokens.every((t) => lowerModel.includes(t));
  });

  if (candidates.length > 0) {
    // Sort candidate models to prefer those whose pro/max/plus/ultra flags match the query
    candidates.sort((a, b) => {
      const aLower = a.model.toLowerCase();
      const bLower = b.model.toLowerCase();
      
      const aPro = aLower.includes('pro');
      const bPro = bLower.includes('pro');
      if (hasPro !== aPro && hasPro === bPro) return 1;
      if (hasPro === aPro && hasPro !== bPro) return -1;

      const aMax = aLower.includes('max');
      const bMax = bLower.includes('max');
      if (hasMax !== aMax && hasMax === bMax) return 1;
      if (hasMax === aMax && hasMax !== bMax) return -1;

      const aPlus = aLower.includes('plus') || aLower.includes('+');
      const bPlus = bLower.includes('plus') || bLower.includes('+');
      if (hasPlus !== aPlus && hasPlus === bPlus) return 1;
      if (hasPlus === aPlus && hasPlus !== bPlus) return -1;

      const aUltra = aLower.includes('ultra');
      const bUltra = bLower.includes('ultra');
      if (hasUltra !== aUltra && hasUltra === bUltra) return 1;
      if (hasUltra === aUltra && hasUltra !== bUltra) return -1;

      return a.model.length - b.model.length;
    });

    return candidates[0];
  }

  // 4. Substring fallback
  return models.find((m) => {
    const lowerModel = m.model.toLowerCase();
    return lowerModel.includes(normalizedQuery) || normalizedQuery.includes(lowerModel);
  });
}

export interface QuoteCalculationParams {
  brandId: string;
  brandName?: string;
  modelName: string;
  fallaId: RepairCategoryId;
  screenVariant?: ScreenVariantType;
  chargingPortType?: ChargingPortType;
  maintenanceTierId?: MaintenanceTierId;
  clienteNombre?: string;
  municipio?: PutumayoMunicipality | string;
  notasAdicionales?: string;
}

export interface QuoteEstimateResult {
  category: RepairCategoryOption;
  brandName: string;
  modelName: string;
  precioEstimadoTexto: string;
  precioNumero?: number;
  precioRangoMin?: number;
  precioRangoMax?: number;
  esAproximado: boolean;
  tiempoEstimado: string;
  garantiaDias: number;
  garantiaTexto: string;
  detalleRepuesto: string;
  variantesDisponibles?: ScreenVariantInfo[];
  varianteSeleccionada?: ScreenVariantInfo;
}

export function calculateRepairQuote(params: QuoteCalculationParams): QuoteEstimateResult {
  const brand = getBrandById(params.brandId);
  const brandDisplay = brand?.name || params.brandName || params.brandId || 'Equipo';
  const category =
    REPAIR_CATEGORIES.find((c) => c.id === params.fallaId) ||
    REPAIR_CATEGORIES.find((c) => c.id === 'otro') ||
    REPAIR_CATEGORIES[0];
  const modelData = params.brandId ? findModelInBrand(params.brandId, params.modelName) : undefined;
  const effectiveModel = modelData ? modelData.model : params.modelName?.trim() || 'Modelo no listado';

  switch (params.fallaId) {
    case 'pantalla': {
      if (modelData && modelData.screenPrices.length > 0) {
        const variants = modelData.screenPrices;
        const selected = params.screenVariant
          ? variants.find((v) => v.variant === params.screenVariant) || variants[0]
          : variants.find((v) => v.recommended) || variants[0];

        const minPrice = Math.min(...variants.map((v) => v.priceCOP));
        const priceToDisplay = params.screenVariant ? selected.priceCOP : minPrice;

        return {
          category,
          brandName: brandDisplay,
          modelName: effectiveModel,
          precioEstimadoTexto: `Desde ${formatPrice(priceToDisplay)} COP (Referencial)`,
          precioNumero: priceToDisplay,
          esAproximado: true,
          tiempoEstimado: `${selected.estimatedMinutes || 45} min`,
          garantiaDias: selected.warrantyDays || 60,
          garantiaTexto: `${selected.warrantyDays || 60} días de garantía escrita`,
          detalleRepuesto: `Pantalla / Display según disponibilidad en bodega (Incell / OLED / Original)`,
          variantesDisponibles: variants,
          varianteSeleccionada: selected,
        };
      }

      // Modelo genérico / no encontrado
      return {
        category,
        brandName: brandDisplay,
        modelName: effectiveModel,
        precioEstimadoTexto: 'Desde $120.000 COP aprox. (Referencial)',
        precioRangoMin: 120000,
        precioRangoMax: 280000,
        esAproximado: true,
        tiempoEstimado: '30 - 60 min',
        garantiaDias: 30,
        garantiaTexto: '30 a 90 días de garantía escrita',
        detalleRepuesto: 'Pantalla y digitalizador (sujeto a disponibilidad en bodega)',
      };
    }

    case 'bateria': {
      const batteryPrice = modelData?.batteryPriceCOP || 80000;
      return {
        category,
        brandName: brandDisplay,
        modelName: effectiveModel,
        precioEstimadoTexto: `Desde ${formatPrice(batteryPrice)} COP (Referencial)`,
        precioNumero: batteryPrice,
        esAproximado: true,
        tiempoEstimado: '30 - 45 min',
        garantiaDias: 60,
        garantiaTexto: '60 días de garantía directa por escrito',
        detalleRepuesto: 'Batería certificada de alta densidad (0 ciclos)',
      };
    }

    case 'pin_carga': {
      const portType: ChargingPortType = params.chargingPortType || 'tipo_c';
      const portOption = CHARGING_PORT_OPTIONS.find((p) => p.id === portType) || CHARGING_PORT_OPTIONS[0];

      return {
        category,
        brandName: brandDisplay,
        modelName: effectiveModel,
        precioEstimadoTexto: `Desde ${formatPrice(portOption.priceCOP)} COP (Referencial)`,
        precioNumero: portOption.priceCOP,
        esAproximado: true,
        tiempoEstimado: `${portOption.estimatedMinutes} min`,
        garantiaDias: portOption.warrantyDays,
        garantiaTexto: `${portOption.warrantyDays} días de garantía directa por escrito`,
        detalleRepuesto: `${portOption.label} con soldadura reforzada`,
      };
    }

    case 'placa_no_prende':
    case 'microelectronica': {
      return {
        category: {
          id: 'placa_no_prende',
          title: 'Placa / No prende',
          shortDesc: 'Diagnóstico de cortos y microelectrónica.',
          icon: 'bi-cpu',
          pricingType: 'custom_quote',
          estimatedTime: '24 - 48 h',
        },
        brandName: brandDisplay,
        modelName: effectiveModel,
        precioEstimadoTexto: 'Diagnóstico en laboratorio (Confirmación en WhatsApp)',
        esAproximado: true,
        tiempoEstimado: '24 a 48 h (Laboratorio especializado)',
        garantiaDias: 30,
        garantiaTexto: '30 días de garantía escrita en microelectrónica',
        detalleRepuesto: 'Revisión microscópica de placa lógica, líneas principales e integrados',
      };
    }

    case 'mojado': {
      return {
        category: {
          id: 'mojado',
          title: 'Mojado',
          shortDesc: 'Desoxidación profunda en tina ultrasónica.',
          icon: 'bi-droplet-half',
          pricingType: 'custom_quote',
          estimatedTime: '24 - 48 h',
        },
        brandName: brandDisplay,
        modelName: effectiveModel,
        precioEstimadoTexto: 'Desoxidación y diagnóstico en laboratorio',
        esAproximado: true,
        tiempoEstimado: '24 a 48 h',
        garantiaDias: 30,
        garantiaTexto: 'Garantía escrita en componentes rescatados',
        detalleRepuesto: 'Tratamiento en tina ultrasónica, secado térmico y prueba de consumo',
      };
    }

    case 'mantenimiento': {
      const tierId = params.maintenanceTierId || 'completo';
      const tier = MAINTENANCE_OPTIONS.find((t) => t.id === tierId) || MAINTENANCE_OPTIONS[0];

      return {
        category,
        brandName: brandDisplay,
        modelName: effectiveModel,
        precioEstimadoTexto: `Desde ${formatPrice(tier.priceCOP || 30000)} COP (Referencial)`,
        precioNumero: tier.priceCOP || 30000,
        esAproximado: true,
        tiempoEstimado: `${tier.durationMinutes} min`,
        garantiaDias: 15,
        garantiaTexto: 'Respaldo técnico en servicio preventivo',
        detalleRepuesto: tier.name,
      };
    }

    case 'camara_audio':
    case 'otro':
    default: {
      return {
        category: {
          id: 'otro',
          title: 'Otra falla',
          shortDesc: 'Cámaras, audio, botones o revisión general.',
          icon: 'bi-wrench-adjustable-circle',
          pricingType: 'custom_quote',
          estimatedTime: 'Revisión en taller',
        },
        brandName: brandDisplay,
        modelName: effectiveModel,
        precioEstimadoTexto: 'Cotización personalizada en WhatsApp',
        esAproximado: true,
        tiempoEstimado: 'Evaluación express en taller',
        garantiaDias: 30,
        garantiaTexto: 'Garantía por escrito según reparación',
        detalleRepuesto: 'Evaluación y diagnóstico general en banco de prueba',
      };
    }
  }
}

export function buildRepairWhatsAppMessage(params: {
  quote: QuoteEstimateResult;
  clienteNombre?: string;
  municipio?: string;
  fallaDescripcionUsuario?: string;
}): string {
  const { quote, clienteNombre, municipio, fallaDescripcionUsuario } = params;

  let msg = `🛠️ *SOLICITUD DE COTIZACIÓN Y SERVICIO TÉCNICO - GIO TECH*\n\n`;

  if (clienteNombre?.trim() || municipio?.trim()) {
    msg += `👤 *Datos del Cliente:*\n`;
    if (clienteNombre?.trim()) msg += `▸ Nombre: ${clienteNombre.trim()}\n`;
    if (municipio?.trim()) msg += `▸ Municipio: ${municipio.trim()}\n`;
    msg += `\n`;
  }

  msg += `📱 *Equipo:*\n`;
  msg += `▸ Marca: ${quote.brandName}\n`;
  msg += `▸ Modelo: ${quote.modelName}\n\n`;

  msg += `🔧 *Falla / Servicio Solicitado:*\n`;
  msg += `▸ Falla Principal: ${quote.category.title}\n`;
  msg += `▸ Detalle Técnico: ${quote.detalleRepuesto}\n`;
  if (fallaDescripcionUsuario?.trim()) {
    msg += `▸ Síntoma reportado: ${fallaDescripcionUsuario.trim()}\n`;
  }
  msg += `\n`;

  msg += `💰 *Presupuesto Referencial:* ${quote.precioEstimadoTexto}\n`;
  msg += `⏱️ *Tiempo Estimado:* ${quote.tiempoEstimado}\n`;
  msg += `🛡️ *Garantía:* ${quote.garantiaTexto}\n\n`;

  msg += `📍 *Sede Física:* Cra. 32 #13 36, Puerto Asís, Putumayo\n`;
  msg += `¿Podrían confirmarme disponibilidad en bodega del repuesto y agendar mi recepción?`;

  return msg;
}
