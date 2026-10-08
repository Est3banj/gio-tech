import type { Financiera } from '../types';
import { POLICY_VERSION } from '../data/legal-copy';

/**
 * Línea de evidencia de la autorización de datos, al final del mensaje enviado.
 * Se agrega en el momento del envío (los mensajes base quedan intactos).
 */
export function buildConsentEvidenceLine(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const fecha = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  return `Autorizacion de datos aceptada (Terminos y Condiciones v.${POLICY_VERSION}, ${fecha})`;
}

export function appendConsentEvidence(message: string): string {
  return `${message}\n${buildConsentEvidenceLine()}`;
}

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

export interface ProductMsgInput {
  nombre: string;
}

/**
 * Mensaje genérico de producto para el CTA "Comprar por WhatsApp" del detalle.
 * Copy aprobado byte-exacto — sin calificativo de medio de pago ("al contado").
 */
export function buildProductWhatsAppMessage(input: ProductMsgInput): string {
  return `Hola, estoy interesado en el ${input.nombre}. ¿Me confirmas disponibilidad y precio? Gracias.`;
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

import type { CartItem } from '../types';
import { formatPrice } from './formatters';

export interface CartMsgCustomerInfo {
  nombre?: string;
  municipio?: string;
}

export function buildCartWhatsAppMessage(
  cartItems: CartItem[],
  customerInfo?: CartMsgCustomerInfo
): string {
  if (!cartItems || cartItems.length === 0) {
    return 'Hola, estoy contactando a GIO TECH. No tengo productos en mi lista de interés.';
  }

  let mensaje = `🛒 *Nueva Cotización - GIO TECH*\n\n`;

  const nombreCliente = customerInfo?.nombre?.trim();
  const municipioCliente = customerInfo?.municipio?.trim();

  if (nombreCliente || municipioCliente) {
    mensaje += `👤 *Datos del Cliente:*\n`;
    if (nombreCliente) {
      mensaje += `▸ Nombre: ${nombreCliente}\n`;
    }
    if (municipioCliente) {
      mensaje += `▸ Municipio: ${municipioCliente}\n`;
    }
    mensaje += `\n`;
  }

  mensaje += `📦 *Productos solicitados:*\n`;

  let totalContado = 0;

  cartItems.forEach((item, index) => {
    const qty = typeof item.cantidad === 'number' && item.cantidad > 0 ? item.cantidad : 1;
    const precioContadoUnit = item.contado || 0;
    const subtotalContado = precioContadoUnit * qty;
    totalContado += subtotalContado;

    mensaje += `${index + 1}. *${item.nombre}* (x${qty})\n`;

    if (item.cotizacionType === 'contado') {
      mensaje += `   • Modalidad: Contado\n`;
      mensaje += `   • Precio unitario: ${formatPrice(precioContadoUnit)}\n`;
      if (qty > 1) {
        mensaje += `   • Subtotal (${qty} uds): ${formatPrice(subtotalContado)}\n`;
      }
    } else {
      mensaje += `   • Modalidad: Crédito\n`;
      if (item.cuotaInicial && item.cuotaInicial > 0) {
        mensaje += `   • Cuota inicial: ${formatPrice(item.cuotaInicial)}\n`;
      }

      if (item.solo12Meses && item.cuotas12) {
        mensaje += `   • Plan especial: 12 cuotas mensuales de ${formatPrice(item.cuotas12)}\n`;
      } else if (item.cuotas6 || item.cuotas8) {
        mensaje += `   • Cuotas estimadas: 16Q de ${formatPrice(item.cuotas6)} / 8M de ${formatPrice(item.cuotas8)}\n`;
      } else {
        mensaje += `   • Cuotas: Sujetas a estudio crediticio\n`;
      }

      mensaje += `   • Valor ref. contado: ${formatPrice(precioContadoUnit)}\n`;
      if (qty > 1) {
        mensaje += `   • Subtotal ref. (${qty} uds): ${formatPrice(subtotalContado)}\n`;
      }
    }
  });

  mensaje += `\n💰 *Total Estimado de Contado:* ${formatPrice(totalContado)}\n\n`;
  mensaje += `¿Podrían confirmar disponibilidad y asesorarme con el pedido?`;

  return mensaje;
}