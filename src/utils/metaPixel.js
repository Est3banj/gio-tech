// src/utils/metaPixel.js
// Utilidades para tracking de Meta Pixel

/**
 * Dispara un evento de Meta Pixel
 * @param {string} eventName - Nombre del evento (PageView, AddToCart, Purchase, Lead, etc.)
 * @param {Object} params - Parámetros del evento (opcional)
 */
export const trackMetaEvent = (eventName, params = {}) => {
  if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
    window.fbq('track', eventName, params);
  } else {
    console.warn('[Meta Pixel] Pixel no disponible - asegúrate de que el código está instalado en index.html');
  }
};

/**
 * Track de AddToCart - cuando un usuario agrega un producto al carrito
 * @param {Object} product - Producto agregado
 * @param {string} type - Tipo de cotización ('contado' o 'credito')
 */
export const trackAddToCart = (product, type) => {
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
 * Track de Purchase - cuando el usuario envía la cotización por WhatsApp
 * Se considera como "compra/leads" porque el flujo de ventas es por WhatsApp
 * @param {Array} cartItems - Items del carrito
 */
export const trackPurchase = (cartItems) => {
  const totalValue = cartItems.reduce((sum, item) => {
    const price = item.cotizacionType === 'contado' ? (item.contado || 0) : (item.cuotas6 || item.cuotas8 || 0);
    return sum + price;
  }, 0);

  const contentIds = cartItems.map(item => item.productId);

  trackMetaEvent('Purchase', {
    content_type: 'product',
    content_ids: contentIds,
    value: totalValue,
    currency: 'COP'
  });
};

/**
 * Track de Lead - cuando el usuario inicia contacto por WhatsApp
 */
export const trackLead = () => {
  trackMetaEvent('Lead', {
    source: 'whatsapp_cart'
  });
};