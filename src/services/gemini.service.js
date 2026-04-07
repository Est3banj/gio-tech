// src/services/gemini.service.js
// Servicio para integrar IA como asistente de ventas (Groq - gratis y rápido)

import { businessInfo } from '../data/business-info';

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const CATALOGO_URL = 'https://gio-tech.vercel.app/catalogo';

/**
 * Normaliza el nombre del producto para búsqueda
 */
const normalizarTexto = (texto) => {
  if (!texto) return '';
  return texto.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Extrae los productos mencionados en el historial reciente
 */
const extraerProductosMencionados = (historial) => {
  const productosMencionados = new Set();
  
  // Buscar menciones de marcas/modelos en mensajes recientes del asistente
  historial.slice(-4).forEach(msg => {
    if (msg.rol === 'asistente' && msg.texto) {
      const texto = msg.texto.toLowerCase();
      // Buscar marcas conocidas
      const marcas = ['redmi', 'samsung', 'iphone', 'xiaomi', 'tecno', 'infinix', 'motorola', 'oppo', 'huawei', 'apple'];
      marcas.forEach(marca => {
        if (texto.includes(marca)) {
          productosMencionados.add(marca);
        }
      });
    }
  });
  
  return Array.from(productosMencionados);
};

/**
 * Busca productos relevantes según la pregunta del usuario
 * @param {string} pregunta - La pregunta del usuario
 * @param {Array} productos - Array de productos del catálogo
 * @param {Array} historial - Historial de mensajes para contexto
 * @returns {Array} - Productos relevantes encontrados
 */
const buscarProductosRelevantes = ( pregunta, productos, historial = []) => {
  const preguntaNorm = normalizarTexto(pregunta);
  const preguntaLower = pregunta.toLowerCase();
  
  // Detectar si es una pregunta de seguimiento (entre esos, cual de esos, y ese, etc.)
  const esSeguimiento = preguntaLower.includes('entre esos') || 
                       preguntaLower.includes('cual de') || 
                       preguntaLower.includes('y ese') || 
                       preguntaLower.includes('ese cual') ||
                       preguntaLower.includes('de esos') ||
                       preguntaLower.includes('de las opciones') ||
                       preguntaLower.includes('cual es el mejor') ||
                       preguntaLower.includes('cual me recomiendas') ||
                       preguntaLower.includes('que me recomiendas');
  
  // Extraer presupuesto si lo hay
  let presupuestoMax = null;
  const matchPresupuesto = preguntaLower.match(/(\d{1,3})\s*(mil|milés|m)?/);
  if (matchPresupuesto) {
    presupuestoMax = parseInt(matchPresupuesto[1]) * 1000;
  }
  
  // Si pregunta por marca específica, buscar TODOS los productos de esa marca
  const marcasEnPregunta = ['redmi', 'samsung', 'iphone', 'xiaomi', 'tecno', 'infinix', 'motorola', 'oppo', 'huawei', 'apple'];
  const marcaBuscada = marcasEnPregunta.find(m => preguntaLower.includes(m));
  
  if (marcaBuscada) {
    // Buscar todos los productos de esa marca
    const resultados = productos.filter(p => {
      const nombreNorm = normalizarTexto(p.nombre || '');
      const marcaNorm = normalizarTexto(p.marca || '');
      return nombreNorm.includes(marcaBuscada) || marcaNorm.includes(marcaBuscada);
    });
    
    if (resultados.length > 0) {
      console.log("🔍 Productos encontrados para marca", marcaBuscada, ":", resultados.length);
      return resultados.slice(0, 15); // Más productos para mejor contexto
    }
  }
  
  // Si es seguimiento, devolver más opciones de las marcas ya mencionadas
  if (esSeguimiento && historial.length > 0) {
    const marcasMencionadas = extraerProductosMencionados(historial);
    if (marcasMencionadas.length > 0) {
      const resultados = productos.filter(p => {
        const nombreNorm = normalizarTexto(p.nombre || '');
        const marcaNorm = normalizarTexto(p.marca || '');
        return marcasMencionadas.some(m => 
          nombreNorm.includes(m) || marcaNorm.includes(m)
        );
      });
      
      if (resultados.length > 0) {
        console.log("🔄 Seguimiento, marcas previas:", marcasMencionadas, "-> productos:", resultados.length);
        return resultados.slice(0, 15);
      }
    }
  }
  
  // Búsqueda normal por palabras clave
  const palabras = preguntaNorm.split(' ').filter(p => p.length > 2);
  const stopWords = ['quiero', 'necesito', 'busco', 'tengo', 'para', 'con', 'tiene', 'como', 'cual', 'cuál', 'donde', 'dónde', 'cuanto', 'cuánto', 'precio', 'celular', 'celulares', 'teléfono', 'telefono', 'cual es', 'que tiene'];
  const palabrasBusqueda = palabras.filter(p => !stopWords.includes(p));
  
  if (palabrasBusqueda.length === 0) {
    // Devolver productos diversos si no hay búsqueda específica
    return productos.slice(0, 10);
  }
  
  const resultados = productos.filter(p => {
    const nombreNorm = normalizarTexto(p.nombre || '');
    const marcaNorm = normalizarTexto(p.marca || '');
    const modeloNorm = normalizarTexto(p.modelo || '');
    const descripcionNorm = normalizarTexto(p.descripcion || '');
    
    return palabrasBusqueda.some(palabra => 
      nombreNorm.includes(palabra) ||
      marcaNorm.includes(palabra) ||
      modeloNorm.includes(palabra) ||
      descripcionNorm.includes(palabra)
    );
  });
  
  if (resultados.length === 0) {
    const marcaBuscada2 = palabrasBusqueda[0];
    return productos.filter(p => {
      const marcaNorm = normalizarTexto(p.marca || '');
      return marcaNorm.includes(marcaBuscada2.substring(0, 4));
    }).slice(0, 10);
  }
  
  return resultados.slice(0, 15);
};

/**
 * Formatea la información completa de un producto para el contexto
 */
const formatearProducto = (p) => {
  const nombre = p.nombre || 'Sin nombre';
  const marca = p.marca || '';
  const modelo = p.modelo || '';
  const precioContado = p.contado ? `$${parseFloat(p.contado).toLocaleString('es-CO')}` : 'Consultar';
  const precioCredito = p.credito ? `$${parseFloat(p.credito).toLocaleString('es-CO')}` : 'Consultar';
  const estado = p.estado || 'nuevo';
  const ram = p.ram || '';
  const storage = p.storage || p.almacenamiento || '';
  
  let info = `${nombre}`;
  if (marca) info += ` [${marca}]`;
  if (modelo) info += ` ${modelo}`;
  if (ram) info += ` | RAM: ${ram}`;
  if (storage) info += ` | Storage: ${storage}`;
  info += ` | Contado: ${precioContado}`;
  if (precioCredito !== 'Consultar') info += ` | Crédito: ${precioCredito}`;
  info += ` | Estado: ${estado}`;
  
  return info;
};

/**
 * Envía una pregunta al asistente IA y obtiene una respuesta
 * @param {string} pregunta - La pregunta del usuario
 * @param {Array} productos - Array de productos del catálogo
 * @param {Array} historial - Array de mensajes anteriores [{rol: 'usuario'|'asistente', texto: string}]
 * @returns {Promise<string>} - Respuesta del asistente
 */
export const askGeminiAssistant = async (pregunta, productos, historial = []) => {
  console.log("🔑 Groq API Key:", GROQ_API_KEY ? "Cargada" : "NO CARGADA");
  console.log("📦 Productos disponibles:", productos.length);
  console.log("💬 Mensajes en historial:", historial.length);
  
  if (!GROQ_API_KEY) {
    return "Lo siento, el asistente no está configurado correctamente. Por favor contáctanos por WhatsApp.";
  }
  
  if (!productos || productos.length === 0) {
    return "No tengo acceso al catálogo en este momento. Por favor contáctanos por WhatsApp para ayudarte.";
  }
  
  // Buscar productos relevantes según la pregunta y el historial
  const productosRelevantes = buscarProductosRelevantes(pregunta, productos, historial);
  console.log("🔍 Productos relevantes encontrados:", productosRelevantes.map(p => p.nombre));
  
  // Crear contexto con TODOS los productos relevantes
  const productosContext = productosRelevantes.map(p => formatearProducto(p)).join('\n');
  
  const totalProductos = productos.length;
  
  // Construir historial de conversación para el modelo
  const historialConversacion = historial.slice(-6).map(msg => {
    const rol = msg.rol === 'usuario' ? 'user' : 'assistant';
    return { role: rol, content: msg.texto };
  }).join('\n');

  const systemPrompt = `
Eres ${businessInfo.nombre}, asistente de ventas experto en celulares y tecnología en Putumayo, Colombia.

INFORMACIÓN DEL NEGOCIO:
- Nombre: ${businessInfo.nombre}
- Ubicación: ${businessInfo.ubicacion}
- Eslogan: ${businessInfo.eslogan}

POLÍTICAS DE CRÉDITO:
${businessInfo.creditos}

GARANTÍAS:
${businessInfo.garantias}

ENVIOS:
${businessInfo.envios}

MÉTODOS DE PAGO:
${businessInfo.metodosPago}

REGLAS CRÍTICAS - DEBES SEGUIR ESTAS A TODA COSTA:
1. SOLO puedes recomendar productos que esten EXACTAMENTE en la lista de CATÁLOGO DISPONIBLE más abajo
2. NUNCA, BAJO NINGUNA CIRCUNSTANCIA inventes productos que no estén en el catálogo
3. Si un producto que el cliente pregunta NO está en el catálogo, dile claramente: "No tengo ese producto disponible actualmente, pero tengo estas alternativas del catálogo: [productos reales del catálogo]"
4. NUNCA digas "tenemos el modelo X" si ese modelo X no está en la lista de abajo
5. Cuando menciones un precio, debe coincidir con el precio del catálogo
6. Usa un lenguaje intermedio, ni muy técnico ni muy coloquial
7. Máximo 150 palabras
8. Para precios, usa formato COP: $1.500.000
9. IMPORTANTE - MANTENER CONTEXTO:
   - Cuando el cliente pregunta "cual es el mejor", "cual me recomiendas", "entre esos cual" o similar, te refieres a LOS PRODUCTOS QUE YA MOSTRÁSTE en la conversación reciente
   - NO cambies de marca si el cliente está viendo opciones de una marca específica
   - Si el cliente dice "pero quiero es en marca samsung", te refieres SOLO a productos Samsung del catálogo
   - Si preguntaste por Samsung A13 y no está, das alternativas Samsung, NO de otras marcas

EJEMPLO DE CÓMO DEBES RESPONDER:
- Cliente: "¿Tienen el Samsung A13?"
- Tú: "No tengo el Samsung A13 disponible, pero tengo estos modelos similares de Samsung: [solo Samsung del catálogo]"

CONVERSACIÓN RECIENTE (para mantener contexto de marca/productos que el cliente está viendo):
${historialConversacion || 'No hay conversación previa'}

CATÁLOGO REAL Y VERÍDICO (solo estos productos existen, no inventes más):
${productosContext}

TOTAL DE PRODUCTOS EN CATÁLOGO: ${totalProductos}

Responde solo con productos que existan en el catálogo de arriba. Si no hay productos que coincidan, sé honesto y recomienda WhatsApp para más opciones.`;

  const userMessage = `Cliente pregunta: ${pregunta}`;

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.7,
        max_tokens: 600,
        stream: false
      })
    });

    if (response.status === 429) {
      throw new Error("El asistente está muy ocupado en este momento. Por favor espera un momento e intenta de nuevo, o contáctanos por WhatsApp.");
    }
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error("Groq error:", errorData);
      throw new Error(`Error de API: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.choices && data.choices[0]?.message?.content) {
      return data.choices[0].message.content;
    }
    
    return "Lo siento, no pude generar una respuesta. Por favor contáctanos por WhatsApp.";
    
  } catch (error) {
    console.error("Error en AI assistant:", error);
    return `Hubo un problema al conectar con el asistente: ${error.message}. Por favor contáctanos por WhatsApp o intenta más tarde.`;
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
