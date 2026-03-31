// src/services/ai-assistant.service.js
// Servicio para integrar IA como asistente de ventas (Groq - gratis y rápido)

import { businessInfo } from '../data/business-info';

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

/**
 * Envía una pregunta al asistente IA y obtiene una respuesta
 * @param {string} pregunta - La pregunta del usuario
 * @param {Array} productos - Array de productos del catálogo
 * @returns {Promise<string>} - Respuesta del asistente
 */
export const askGeminiAssistant = async (pregunta, productos) => {
  console.log("🔑 Groq API Key:", GROQ_API_KEY ? "Cargada" : "NO CARGADA");
  
  if (!GROQ_API_KEY) {
    return "Lo siento, el asistente no está configurado correctamente. La API key no se detectó.";
  }

  // Crear contexto con los productos (OPTIMIZADO - solo los 10 primeros y info básica)
  const productosOpt = productos.slice(0, 10).map(p => {
    const precio = p.contado ? `$${parseFloat(p.contado).toLocaleString('es-CO')}` : 'Consultar';
    return `${p.nombre} - ${precio}`;
  }).join(' | ');

  const productosContext = `(${productosOpt})${productos.length > 10 ? ' ...y más' : ''}`;

  const systemPrompt = `
Eres asistente de ventas de ${businessInfo.nombre}. Ayudas a clientes a encontrar celulares.

INFORMACIÓN CLAVE:
- Créditos: ${businessInfo.creditos.substring(0, 200)}
- Garantías: ${businessInfo.garantias.substring(0, 150)}

REGLAS:
1. Amable y profesional en español
2. Para créditos/garantías/etc usa la info del negocio
3. Recomienda productos del catálogo (NO inventes)
4. Precios en COP
5. Máximo 100 palabras
6. Si no sabés, recomienda WhatsApp

CATÁLOGO: ${productosContext}

Responde en español.`;

  const userMessage = `Cliente pregunta: ${pregunta}`;

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant', // Modelo rápido y gratis
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.7,
        max_tokens: 500,
        stream: false
      })
    });

    if (response.status === 429) {
      throw new Error("El asistente está muy ocupado en este momento. Por favor espera un momento e intenta de nuevo, o contáctanos por WhatsApp.");
    }
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error("Groq error:", errorData);
      throw new Error(`Error de API: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    
    if (data.choices && data.choices[0]?.message?.content) {
      return data.choices[0].message.content;
    }
    
    return "Lo siento, no pude generar una respuesta. Por favor contacta por WhatsApp.";
    
  } catch (error) {
    console.error("Error en AI assistant:", error);
    return `Hubo un problema al conectar con el asistente: ${error.message}. Por favor contacta por WhatsApp o intenta más tarde.`;
  }
};

/**
 * Genera un mensaje de WhatsApp con los productos recomendados
 * @param {Array} productos - Array de productos recomendados
 * @returns {string} - Mensaje formateado para WhatsApp
 */
export const generateWhatsAppMessage = (productos) => {
  if (!productos || productos.length === 0) {
    return "Hola, estoy interesado en conocer los productos disponibles en GIO TECH.";
  }

  let mensaje = "Hola, me interesa conocer más sobre los siguientes productos:\n\n";
  
  productos.forEach((p, index) => {
    const precio = p.contado ? `$${parseFloat(p.contado).toLocaleString('es-CO')}` : 'Consultar';
    mensaje += `${index + 1}. ${p.nombre} - ${precio}\n`;
  });
  
  mensaje += "\n¿Podrían darme más información?";
  
  return encodeURIComponent(mensaje);
};
