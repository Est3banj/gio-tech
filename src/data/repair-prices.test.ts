import { describe, it, expect } from 'vitest';
import {
  getAllBrands,
  getBrandById,
  getModelsForBrand,
  findModelInBrand,
  calculateRepairQuote,
  buildRepairWhatsAppMessage,
  CHARGING_PORT_OPTIONS,
  MAINTENANCE_OPTIONS,
  PUTUMAYO_MUNICIPALITIES,
  REPAIR_CATEGORIES,
} from './repair-prices';

describe('Repair Prices Database (repair-prices.ts)', () => {
  it('debe contener las 13 marcas requeridas', () => {
    const brands = getAllBrands();
    const brandIds = brands.map((b) => b.id);
    const requiredBrands = [
      'apple',
      'samsung',
      'xiaomi',
      'motorola',
      'tecno',
      'infinix',
      'huawei',
      'vivo',
      'oppo',
      'realme',
      'nokia',
      'zte',
      'lg',
    ];

    expect(brands.length).toBeGreaterThanOrEqual(13);
    for (const req of requiredBrands) {
      expect(brandIds).toContain(req);
    }

    const apple = getBrandById('apple');
    expect(apple).toBeDefined();
    expect(apple?.name).toContain('Apple');

    const appleModels = getModelsForBrand('apple');
    expect(appleModels.length).toBeGreaterThan(0);
  });

  it('debe tener las categorías de fallas principales requeridas', () => {
    const categoryIds = REPAIR_CATEGORIES.map((c) => c.id);
    expect(categoryIds).toContain('pantalla');
    expect(categoryIds).toContain('bateria');
    expect(categoryIds).toContain('pin_carga');
    expect(categoryIds).toContain('placa_no_prende');
    expect(categoryIds).toContain('mojado');
    expect(categoryIds).toContain('mantenimiento');
    expect(categoryIds).toContain('otro');
  });

  it('debe tener opciones de puertos de carga con sus tarifas base', () => {
    const tipoC = CHARGING_PORT_OPTIONS.find((p) => p.id === 'tipo_c');
    const v8 = CHARGING_PORT_OPTIONS.find((p) => p.id === 'v8_micro_usb');

    expect(tipoC).toBeDefined();
    expect(tipoC?.priceCOP).toBe(50000);

    expect(v8).toBeDefined();
    expect(v8?.priceCOP).toBe(30000);
  });

  it('debe contener opciones de mantenimiento preventivo', () => {
    expect(MAINTENANCE_OPTIONS.length).toBeGreaterThanOrEqual(3);
    const basico = MAINTENANCE_OPTIONS.find((m) => m.id === 'basico');
    const completo = MAINTENANCE_OPTIONS.find((m) => m.id === 'completo');
    const pro = MAINTENANCE_OPTIONS.find((m) => m.id === 'pro_ultrasonico');

    expect(basico?.priceCOP).toBe(30000);
    expect(completo?.priceCOP).toBe(60000);
    expect(pro?.priceCOP).toBe(100000);
  });

  it('debe contener los municipios de Putumayo', () => {
    expect(PUTUMAYO_MUNICIPALITIES).toContain('Puerto Asís');
    expect(PUTUMAYO_MUNICIPALITIES).toContain('Mocoa');
    expect(PUTUMAYO_MUNICIPALITIES).toContain('Orito');
    expect(PUTUMAYO_MUNICIPALITIES).toContain('La Hormiga (Valle del Guamuez)');
    expect(PUTUMAYO_MUNICIPALITIES).toContain('Villagarzón');
  });

  it('debe permitir buscar modelos por marca con match exacto o parcial', () => {
    const samsungModel = findModelInBrand('samsung', 'a14');
    expect(samsungModel).toBeDefined();
    expect(samsungModel?.model).toContain('A14');

    const iphoneModel = findModelInBrand('apple', '15 Pro Max');
    expect(iphoneModel).toBeDefined();
    expect(iphoneModel?.model).toBe('iPhone 15 Pro Max');

    const tecnoModel = findModelInBrand('tecno', 'Spark 20');
    expect(tecnoModel).toBeDefined();
  });

  it('debe calcular cotización referencial de pantalla indicando carácter aproximado', () => {
    const quoteiPhone = calculateRepairQuote({
      brandId: 'apple',
      modelName: 'iPhone 15 Pro Max',
      fallaId: 'pantalla',
      screenVariant: 'Original con marco',
    });

    expect(quoteiPhone.precioNumero).toBe(1390000);
    expect(quoteiPhone.precioEstimadoTexto).toContain('Referencial');
    expect(quoteiPhone.detalleRepuesto).toContain('Pantalla');
    expect(quoteiPhone.esAproximado).toBe(true);

    const quoteSamsung = calculateRepairQuote({
      brandId: 'samsung',
      modelName: 'Galaxy A14 (4G / 5G)',
      fallaId: 'pantalla',
    });

    expect(quoteSamsung.precioNumero).toBe(130000);
    expect(quoteSamsung.precioEstimadoTexto).toContain('Desde');
  });

  it('debe calcular cotización referencial de pin de carga y batería', () => {
    const quoteTipoC = calculateRepairQuote({
      brandId: 'samsung',
      modelName: 'Galaxy A14',
      fallaId: 'pin_carga',
    });
    expect(quoteTipoC.precioNumero).toBe(50000);
    expect(quoteTipoC.precioEstimadoTexto).toContain('Referencial');

    const quoteBateria = calculateRepairQuote({
      brandId: 'apple',
      modelName: 'iPhone 13',
      fallaId: 'bateria',
    });
    expect(quoteBateria.precioEstimadoTexto).toContain('Referencial');
    expect(quoteBateria.garantiaDias).toBe(60);
  });

  it('debe estructurar el mensaje técnico de WhatsApp con todos los datos requeridos', () => {
    const quote = calculateRepairQuote({
      brandId: 'apple',
      modelName: 'iPhone 13',
      fallaId: 'pantalla',
    });

    const msg = buildRepairWhatsAppMessage({
      quote,
      clienteNombre: 'Carlos Morales',
      municipio: 'Puerto Asís',
      fallaDescripcionUsuario: 'Cristal roto y mancha negra en display',
    });

    expect(msg).toContain('SOLICITUD DE COTIZACIÓN Y SERVICIO TÉCNICO');
    expect(msg).toContain('Carlos Morales');
    expect(msg).toContain('Puerto Asís');
    expect(msg).toContain('Apple iPhone');
    expect(msg).toContain('iPhone 13');
    expect(msg).toContain('Cristal roto y mancha negra en display');
    expect(msg).toContain('Cra. 32 #13 36, Puerto Asís, Putumayo');
    expect(msg).toContain('Presupuesto Referencial:');
  });
});
