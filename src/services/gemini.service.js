// src/services/ai-assistant.service.js
// Servicio para integrar IA como asistente de ventas (Groq - gratis y rápido)

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

  // Crear contexto con los productos
  const productosContext = productos.map(p => {
    const precio = p.contado ? `$${parseFloat(p.contado).toLocaleString('es-CO')}` : 'Consultar';
    const cuotas6 = p.cuotas6 ? `16 cuotas de $${parseFloat(p.cuotas6).toLocaleString('es-CO')}` : '';
    const cuotas8 = p.cuotas8 ? `8 cuotas de $${parseFloat(p.cuotas8).toLocaleString('es-CO')}` : '';
    const info = `
- ${p.nombre}
- Precio contado: ${precio}
- ${cuotas6 ? `16 cuotas quincenales: ${cuotas6}` : ''}
- ${cuotas8 ? `8 cuotas mensuales: ${cuotas8}` : ''}
${p.descripcion ? `- Detalles: ${p.descripcion.substring(0, 80)}` : ''}
`.trim();
    return info;
  }).join('\n\n');

  const systemPrompt = `
Eres un asistente de ventas experto en celulares de una tienda llamada GIO TECH.
Tu objetivo es ayudar a los clientes a encontrar el celular perfecto según sus necesidades.

REGLAS IMPORTANTES:
1. Responde SIEMPRE de manera amable y profesional en español
2. Basate ÚNICAMENTE en los productos del catálogo que te proporciono
3. Si no tienes información clara del producto, sugiere que consulten por WhatsApp
4. Da recomendaciones concretas con nombres de productos específicos
5. Los precios mostrados son en pesos colombianos (COP)
6. NO inventes productos que no estén en el catálogo
7. Sé conciso y directo, máximo 150 palabras
8. Usa emojis sparingly para hacer la conversación más amigable

CATÁLOGO DE PRODUCTOS DISPONIBLES:
${productosContext}

Responde siempre en español y de manera útil para el cliente.`;

  const userMessage = `PREGUNTA DEL CLIENTE: ${pregunta}`;

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
