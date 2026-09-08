import { describe, it, expect } from 'vitest';
import { generateHandoffSummary } from './ai-assistant.service';
import type { ChatMessage, Product } from '../types';

describe('ai-assistant.service - generateHandoffSummary', () => {
  const sampleProduct: Product = {
    id: 's24-ultra',
    nombre: 'Samsung Galaxy S24 Ultra',
    imagen: '',
    contado: 4500000,
    marca: 'Samsung',
  };

  it('generates a general greeting when messages and matched products are empty', () => {
    const result = generateHandoffSummary({ mensajes: [], productosMatcheados: [] });
    expect(result).toContain('¡Hola! Estuve viendo el catálogo en GIO TECH');
  });

  it('detects credit profile when user mentions being reportado', () => {
    const mensajes: ChatMessage[] = [
      { rol: 'asistente', texto: '¡Hola! ¿En qué te puedo ayudar?' },
      { rol: 'usuario', texto: 'Hola, estoy reportado en datacrédito, ¿puedo sacar un celular a cuotas?' },
      { rol: 'asistente', texto: '¡Sí! Puedes validar con PayJoy o Krediya.' },
    ];

    const result = generateHandoffSummary({
      mensajes,
      productosMatcheados: [sampleProduct],
    });

    expect(result).toContain('🤖 *Asistencia Virtual GIO TECH - Lead Precalificado*');
    expect(result).toContain('Reportado en centrales (interés en PayJoy / Krediya / Celya)');
    expect(result).toContain('Samsung Galaxy S24 Ultra');
    expect(result).toContain('Hola, estoy reportado en datacrédito, ¿puedo sacar un celular a cuotas?');
  });

  it('detects Sistecrédito profile and specific brand/needs', () => {
    const mensajes: ChatMessage[] = [
      { rol: 'usuario', texto: 'Quiero un iPhone con buena cámara y pagarlo por sistecredito' },
    ];

    const result = generateHandoffSummary({
      mensajes,
      productosMatcheados: [],
    });

    expect(result).toContain('Interés en Sistecrédito');
    expect(result).toContain('Marca(s): iPhone');
    expect(result).toContain('Buena cámara');
  });

  it('extracts budget when user mentions millions or price range from products', () => {
    const mensajes: ChatMessage[] = [
      { rol: 'usuario', texto: 'Tengo un presupuesto de 2 millones para un Samsung' },
    ];

    const result = generateHandoffSummary({
      mensajes,
      productosMatcheados: [sampleProduct],
    });

    expect(result).toContain('Aprox. $2 millones');
    expect(result).toContain('Marca(s): Samsung');
  });
});
