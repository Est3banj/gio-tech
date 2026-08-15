import type { Financiera } from '../types';

export interface ContadoMsgInput {
  nombre: string;
  showPromoPrice: boolean;
  pricePromoStr: string;
  priceRegularStr: string;
}

export function buildContadoWhatsAppMessage(input: ContadoMsgInput): string {
  return input.showPromoPrice
    ? `Hola, estoy interesado en comprar el ${input.nombre}.\nPrecio promocional: ${input.pricePromoStr} (antes ${input.priceRegularStr}).\n¿Está disponible para entrega inmediata?`
    : `Hola, estoy interesado en comprar al contado el ${input.nombre}.\nPrecio: ${input.priceRegularStr}.\n¿Está disponible para entrega inmediata?`;
}

export interface CreditoMsgInput {
  financiera: Pick<Financiera, 'id' | 'nombre'>;
  nombre: string;
  precioStr: string;
  cuotaInicialStr: string;
  solo12Meses: boolean;
  cuotas12Str: string;
  cuotas6Str: string;
  cuotas8Str: string;
  formData: Record<string, string>;
}

export function buildCreditoWhatsAppMessage(input: CreditoMsgInput): string {
  let mensaje = `🧾 *Solicitud de crédito - ${input.financiera.nombre}*\n\n`;
  mensaje += `📱 *Producto:* ${input.nombre}\n`;
  mensaje += `💰 *Precio:* ${input.precioStr}\n`;
  // Solo Krediya incluye cuotas en el mensaje (las demas las define el asesor)
  if (input.financiera.id === 'krediya') {
    if (input.cuotaInicialStr) mensaje += `💵 *Cuota inicial:* ${input.cuotaInicialStr}\n`;
    if (input.solo12Meses && input.cuotas12Str) {
      mensaje += `📆 *12 cuotas mensuales:* ${input.cuotas12Str}\n`;
    } else {
      mensaje += `📆 *16 cuotas quincenales:* ${input.cuotas6Str}\n`;
      mensaje += `📆 *8 cuotas mensuales:* ${input.cuotas8Str}\n`;
    }
  }
  mensaje += `\n👤 *Datos del cliente:*\n`;
  for (const [key, value] of Object.entries(input.formData)) {
    mensaje += `▸ ${labelDeCampo(key)}: ${value}\n`;
  }
  return mensaje;
}

export function buildWhatsAppUrl(phoneNumber: string, mensaje: string): string {
  return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(mensaje)}`;
}

export const CAMPO_LABELS: Record<string, string> = {
  nombres: 'Nombres y apellidos',
  cedula: 'Cédula',
  fechaNacimiento: 'Fecha y lugar de nacimiento',
  fechaExpedicion: 'Fecha y lugar de expedición',
  celular: 'Celular',
  email: 'Correo electrónico',
  compradoAntes: '¿Ha comprado antes?',
  reportesNegativos: '¿Reportes negativos?',
  cupo: 'Cupo disponible',
  primeraCompra: 'Primera compra',
};

export function labelDeCampo(key: string): string {
  return CAMPO_LABELS[key] || key;
}