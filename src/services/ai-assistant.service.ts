// src/services/ai-assistant.service.ts
// Servicio para integrar IA como asistente de ventas (Groq - gratis y rápido)

import type { Product, ChatMessage } from '../types';
import { businessInfo } from '../data/business-info';
import { FINANCIERAS } from '../data/financieras';

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1s, luego 2s, luego 4s

// ── Helpers de búsqueda de productos ────────────────────────

/**
 * Normaliza el texto para búsqueda
 */
const normalizarTexto = (texto: string): string => {
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
const extraerProductosMencionados = (historial: ChatMessage[]): string[] => {
  const productosMencionados = new Set<string>();

  historial.slice(-4).forEach(msg => {
    if (msg.rol === 'asistente' && msg.texto) {
      const texto = msg.texto.toLowerCase();
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
 */
const buscarProductosRelevantes = (
  pregunta: string,
  productos: Product[],
  historial: ChatMessage[] = []
): Product[] => {
  const preguntaNorm = normalizarTexto(pregunta);
  const preguntaLower = pregunta.toLowerCase();

  // Detectar preguntas de seguimiento
  const esSeguimiento = preguntaLower.includes('entre esos') ||
    preguntaLower.includes('cual de') ||
    preguntaLower.includes('y ese') ||
    preguntaLower.includes('ese cual') ||
    preguntaLower.includes('de esos') ||
    preguntaLower.includes('de las opciones') ||
    preguntaLower.includes('cual es el mejor') ||
    preguntaLower.includes('cual me recomiendas') ||
    preguntaLower.includes('que me recomiendas');

  // Buscar por marca específica
  const marcasEnPregunta = ['redmi', 'samsung', 'iphone', 'xiaomi', 'tecno', 'infinix', 'motorola', 'oppo', 'huawei', 'apple'];
  const marcaBuscada = marcasEnPregunta.find(m => preguntaLower.includes(m));

  if (marcaBuscada) {
    const resultados = productos.filter(p => {
      const nombreNorm = normalizarTexto(p.nombre || '');
      const marcaNorm = normalizarTexto(p.marca || '');
      return nombreNorm.includes(marcaBuscada) || marcaNorm.includes(marcaBuscada);
    });

    if (resultados.length > 0) {
      return resultados.slice(0, 15);
    }
  }

  // Seguimiento: mantener marcas del historial
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
        return resultados.slice(0, 15);
      }
    }
  }

  // Búsqueda normal por palabras clave
  const palabras = preguntaNorm.split(' ').filter(p => p.length > 2);
  const stopWords = ['quiero', 'necesito', 'busco', 'tengo', 'para', 'con', 'tiene', 'como', 'cual', 'cuál', 'donde', 'dónde', 'cuanto', 'cuánto', 'precio', 'celular', 'celulares', 'teléfono', 'telefono', 'cual es', 'que tiene'];
  const palabrasBusqueda = palabras.filter(p => !stopWords.includes(p));

  if (palabrasBusqueda.length === 0) {
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
    const palabrasEconomicas = ['econo', 'barat', 'bajo', 'accesi'];
    const esBusquedaEconomica = palabrasBusqueda.some(p =>
      palabrasEconomicas.some(eco => p.includes(eco))
    );

    if (esBusquedaEconomica) {
      return [...productos]
        .sort((a, b) => (a.contado ?? Infinity) - (b.contado ?? Infinity))
        .slice(0, 10);
    }

    return productos.slice(0, 10);
  }

  return resultados.slice(0, 15);
};

/**
 * Formatea la información de un producto para el contexto
 */
const formatearProducto = (p: Product): string => {
  const nombre = p.nombre || 'Sin nombre';
  const marca = p.marca || '';
  const modelo = p.modelo || '';
  const precioContado = p.contado ? `$${(p.contado).toLocaleString('es-CO')}` : 'Consultar';
  const extra = p as unknown as Record<string, unknown>;
  const precioCredito = extra.credito ? `$${parseFloat(String(extra.credito)).toLocaleString('es-CO')}` : 'Consultar';
  const estado = (extra.estado as string) || 'nuevo';
  const ram = (extra.ram as string) || '';
  const storage = (extra.storage as string) || '';

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
 * Construye el contexto de financieras con sus URLs de validación
 */
const construirContextoFinancieras = (): string => {
  return FINANCIERAS.map(f => {
    let info = `- ${f.nombre}`;
    if (f.tipo === 'autovalidacion' && f.urlAutovalidacion) {
      info += ` | AUTOVALIDACIÓN: ${f.urlAutovalidacion}`;
      info += ` | El cliente puede validar solo en este link`;
    } else {
      info += ` | TIPO: asesor (requiere contacto por WhatsApp o formulario web)`;
    }
    if (f.id === 'sistecredito') {
      info += ` | Requiere buena conducta de pago, 3 compras previas y NO tener reportes | Aplica para iPhone y Android`;
    } else if (f.id === 'esmiopcion') {
      info += ` | NO acepta reportados (ni para iPhone ni Android) | Aplica para iPhone y Android`;
    } else if (f.id === 'pajoy') {
      info += ` | Acepta reportados | Solo Android`;
    } else if (f.id === 'krediya') {
      info += ` | Acepta reportados | Solo Android`;
    } else if (f.id === 'celya') {
      info += ` | Acepta reportados | Solo Android`;
    }
    return info;
  }).join('\n');
};

// ── Función principal ───────────────────────────────────────

/**
 * Envía una pregunta al asistente IA y obtiene una respuesta
 * @param pregunta - La pregunta del usuario
 * @param productos - Array de productos del catálogo
 * @param historial - Array de mensajes anteriores
 * @param whatsappNumber - Número de WhatsApp del asesor
 * @returns Respuesta del asistente
 */
export const askAssistant = async (
  pregunta: string,
  productos: Product[],
  historial: ChatMessage[] = [],
  whatsappNumber?: string
): Promise<string> => {
  if (!GROQ_API_KEY) {
    return "Lo siento, el asistente no está configurado correctamente. Por favor contáctanos por WhatsApp.";
  }

  if (!productos || productos.length === 0) {
    return "No tengo acceso al catálogo en este momento. Por favor contáctanos por WhatsApp para ayudarte.";
  }

  const productosRelevantes = buscarProductosRelevantes(pregunta, productos, historial);
  const productosContext = productosRelevantes.map(p => formatearProducto(p)).join('\n');
  const totalProductos = productos.length;

  const historialConversacion = historial
    .slice(-6)
    .map(msg => `${msg.rol === 'usuario' ? 'Cliente' : 'Asistente'}: ${msg.texto}`)
    .join('\n');

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

FINANCIERAS DISPONIBLES (con enlaces de validación - úsalos cuando el cliente quiera aplicar a crédito):
${construirContextoFinancieras()}

CONTACTO ASESOR WHATSAPP:
${whatsappNumber ? `WhatsApp del asesor: ${whatsappNumber} (incluye este número cuando el cliente necesite contacto humano post-validación)` : 'El cliente puede contactar por WhatsApp desde la web'}

INSTRUCCIONES PARA RECOMENDAR FINANCIERAS:
1. Cuando el cliente pregunte por CRÉDITO o FINANCIACIÓN, recomiéndale la financiera que mejor se ajuste a su perfil:
   - Si está REPORTADO o tiene mal historial: recomienda Krediya, Pajoy o Celya (aceptan reportados, solo Android)
   - Si NO tiene reportes y ha comprado antes: recomienda Sistecredito (aplica iPhone y Android, requiere 3 compras previas)
   - Si quiere iPhone: solo aplica Sistecredito o Es mi opción, y AMBAS requieren NO tener reportes negativos
   - Si quiere iPhone y ESTÁ reportado: indicar que para iPhone no aplican financieras para reportados, pero puede aplicar para Android con Krediya, Pajoy o Celya
2. SIEMPRE que la financiera tenga AUTOVALIDACIÓN, incluye el enlace exacto para que el cliente valide
3. Después de dar el link de validación, ofrece el WhatsApp del asesor para cuando salga aprobado
4. Si la financiera es tipo asesor (no tiene autovalidación), indica que debe contactar por WhatsApp o usar el formulario en la web

EJEMPLO DE RESPUESTA CON FINANCIERA:
- Cliente: "estoy reportado puedo adquirir celular"
- Tú: "¡Sí! Trabajamos con financieras que aceptan reportados como Krediya o PayJoy. Te recomiendo validar con PayJoy aquí: [URL de PayJoy]. Si sales aprobado, escríbenos al WhatsApp [número] y te ayudamos con el proceso."

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
   - Cuando el cliente pregunta "cual es el mejor", "cual me recomiendas", "entre esos cual" o similar, te refieres a LOS PRODUCTOS QUE YA MOSTRASTE en la conversación reciente
   - NO cambies de marca si el cliente está viendo opciones de una marca específica
   - Si el cliente dice "pero quiero es en marca samsung", te refieres SOLO a productos Samsung del catálogo
   - Si preguntaste por Samsung A13 y no está, das alternativas Samsung, NO de otras marcas

EJEMPLO DE CÓMO DEBES RESPONDER:
- Cliente: "¿Tienen el Samsung A13?"
- Tú: "No tengo el Samsung A13 disponible, pero tengo estos modelos similares de Samsung: [solo Samsung del catálogo]"

EJEMPLOS DE CIERRE (cuando el usuario agradece o se despide, NO intentes vender más):
- Cliente: "gracias"
- Tú: "¡De nada! Si necesitas algo más, aquí estoy para ayudarte. ¡Que tengas un excelente día!"

- Cliente: "muchas gracias"
- Tú: "¡Con gusto! Recuerda que puedes contactarnos por WhatsApp si tienes más dudas. ¡Saludos!"

CONVERSACIÓN RECIENTE (para mantener contexto de marca/productos que el cliente está viendo):
${historialConversacion || 'No hay conversación previa'}

CATÁLOGO REAL Y VERÍDICO (solo estos productos existen, no inventes más):
${productosContext}

TOTAL DE PRODUCTOS EN CATÁLOGO: ${totalProductos}

Responde solo con productos que existan en el catálogo de arriba. Si no hay productos que coincidan, sé honesto y recomienda WhatsApp para más opciones.`;

  const userMessage = `Cliente pregunta: ${pregunta}`;

  // ── Llamada a Groq con retry en 429 ────────────────────
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
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
        if (attempt < MAX_RETRIES - 1) {
          const delay = INITIAL_RETRY_DELAY * Math.pow(2, attempt);
          console.warn(`Rate limit (429), reintento en ${delay}ms (intento ${attempt + 1}/${MAX_RETRIES})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        throw new Error("El asistente está muy ocupado en este momento. Por favor intenta de nuevo o contáctanos por WhatsApp.");
      }

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Groq error:", errorData);
        throw new Error(`Error de API: ${response.status}`);
      }

      const data = await response.json();

      if (data.choices && data.choices[0]?.message?.content) {
        const respuesta = data.choices[0].message.content;

        return respuesta;
      }

      return "Lo siento, no pude generar una respuesta. Por favor contáctanos por WhatsApp.";

    } catch (error) {
      lastError = error as Error;
      // Si no es 429, no reintentar
      if (!(error instanceof Error) || !error.message.includes('429')) {
        break;
      }
    }
  }

  // Si todos los reintentos fallaron
  const errorMessage = lastError?.message || "Error desconocido";
  console.error("Error en AI assistant tras reintentos:", lastError);

  return `${errorMessage}. Por favor contáctanos por WhatsApp o intenta más tarde.`;
};

/**
 * Genera un mensaje de WhatsApp con los productos recomendados
 */
export const generateWhatsAppMessage = (productos: Product[]): string => {
  if (!productos || productos.length === 0) {
    return encodeURIComponent("Hola, estoy interesado en conocer los productos disponibles en GIO TECH.");
  }

  let mensaje = "Hola, me interesa conocer más sobre los siguientes productos:\n\n";

  productos.forEach((p, index) => {
    const precio = p.contado ? `$${(p.contado).toLocaleString('es-CO')}` : 'Consultar';
    mensaje += `${index + 1}. ${p.nombre} - ${precio}\n`;
  });

  mensaje += "\n¿Podrían darme más información?";

  return encodeURIComponent(mensaje);
};
