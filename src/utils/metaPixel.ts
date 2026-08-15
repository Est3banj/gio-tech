// src/utils/metaPixel.ts
// Utilidades para tracking de Meta Pixel

import type { Product } from '../types';
import type { CartItem, CotizacionType } from '../types';

type MetaEventName = 'PageView' | 'AddToCart' | 'Purchase' | 'Lead' | string;

interface MetaParams {
  content_type?: string;
  content_ids?: string[];
  content_name?: string;
  value?: number;
  currency?: string;
  num_items?: number;
}

/**
 * Dispara un evento de Meta Pixel
 * @param eventName - Nombre del evento
 * @param params - Parámetros del evento (opcional)
 */
export const trackMetaEvent = (eventName: MetaEventName, params: MetaParams = {}): void => {
  if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
    window.fbq('track', eventName, params);
  } else {
    console.warn('[Meta Pixel] Pixel no disponible - asegúrate de que el código está instalado en index.html');
  }
};

/**
 * Track de AddToCart - cuando un usuario agrega un producto al carrito
 * @param product - Producto agregado
 * @param type - Tipo de cotización ('contado' o 'credito')
 */
export const trackAddToCart = (product: Product, type: CotizacionType): void => {
  const value = type === 'contado' ? product.contado : product.cuotas6 || product.cuotas8;
  
  trackMetaEvent('AddToCart', {
    content_type: 'product',
    content_ids: [product.id],
    content_name: product.nombre,
    value: value || 0,
    currency: 'COP'
  });
};

/**
 * Track de Purchase - RESERVADO para ventas CONFIRMADAS.
 * El flujo actual vende por WhatsApp sin pago confirmado en el sitio: NO disparar
 * este evento al abrir un link de WhatsApp (esas intenciones se reportan con trackLead).
 */
export const trackPurchase = (cartItems: CartItem[]): void => {
  const totalValue = cartItems.reduce((sum, item) => {
    return sum + (item.cotizacionType === 'contado' ? item.contado : item.cuotas6 || item.cuotas8);
  }, 0);

  trackMetaEvent('Purchase', {
    content_type: 'product',
    content_ids: cartItems.map(item => item.productId),
    value: totalValue,
    num_items: cartItems.length,
    currency: 'COP'
  });
};

/**
 * Track de Lead - el usuario inicia una conversación o envía una cotización por WhatsApp
 * (intención de compra, no pago confirmado). También dispara GA4 'generate_lead' si gtag existe.
 * @param params - Parámetros del evento (opcional)
 */
export const trackLead = (params?: MetaParams): void => {
  trackMetaEvent('Lead', params ?? {});

  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', 'generate_lead', params ?? {});
  }
};

// Extender window para incluir fbq y gtag
declare global {
  interface Window {
    fbq: (action: string, eventName: string, params?: MetaParams) => void;
    gtag: (command: string, eventName: string, params?: MetaParams) => void;
  }
}
