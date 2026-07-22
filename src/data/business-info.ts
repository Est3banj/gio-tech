export interface BusinessInfo {
  nombre: string;
  eslogan: string;
  ubicacion: string;
  creditos: string;
  garantias: string;
  envios: string;
  metodosPago: string;
  servicioTecnico: string;
  faq: string;
}

export const businessInfo: BusinessInfo = {
  nombre: "GIO TECH",
  eslogan: "Tu tienda de tecnología de confianza",
  ubicacion: "Colombia",

  creditos: `
POLÍTICA DE CRÉDITO:
- SÍ aceptamos personas reportadas (con historial crediticio negativo) a través de financieras como Krediya, Pajoy, Celya, entre otras
- Personas que apenas van a iniciar su vida crediticia también aplican
- Requisitos generales: cédula original colombiana y una pequeña cuota inicial

FINANCIERAS DISPONIBLES:
- Krediya: acepta reportados
- Pajoy: acepta reportados
- Celya: acepta reportados
- Sistecredito: requiere buena conducta de pago, haber realizado mínimo 3 compras de cualquier producto
- Es mi opción: requiere NO tener reportes negativos

iPhone A CRÉDITO:
- Solo por Sistecredito o Es mi opción
- Por Sistecredito: requiere buen cupo (recomendable mayor a $1.000.000) y no tener reportes negativos
- Por Es mi opción: requiere no tener reportes

FORMAS DE PAGO A CRÉDITO:
- 16 cuotas quincenales
- 12 cuotas mensuales
- 8 cuotas mensuales
- 6 meses mensuales
- Plan especial de 12 meses (solo en productos seleccionados)
- Sistecredito de 1 a 6 meses

REQUISITOS GENERALES:
- Ser mayor de edad
- Tener cédula original colombiana vigente o PPT
- Referencias personales
- Capacidad de pago

NOTA: Los intereses y aprobaciones dependen del financiero asignado. En la web hay enlaces de autovalidación para cada financiera.
  `,

  garantias: `
GARANTÍAS:
- Todos los celulares nuevos vienen con garantía del fabricante (generalmente 12 meses)
- Los equipos seminuevos tienen garantía de 3 meses, por defecto de fabrica
- La garantía cubre defectos de fábrica, no daños por agua ni golpes
- Para hacer efectiva la garantía, debe presentarse el equipo con sus accesorios originales y la factura de compra
  `,

  envios: `
ENVIOS:
- Envíos a algunos lugares del departamento del putumayo, si estas fuera del departamento podriamos gestionar envio sin problema.
- Tiempo de entrega: 2-5 días hábiles según ubicación
- Costo de envío varía según la ciudad
- Envío gratis en compras mayores a $500.000 (consultar condiciones)
  `,

  metodosPago: `
MÉTODOS DE PAGO:
- Efectivo
- Transferencia bancaria
- PSE
- Tarjetas de crédito/débito
- Pago contra entrega (solo en algunas ciudades)
- Financiación con proveedores externos
  `,

  servicioTecnico: `
SERVICIO TÉCNICO:
- Cambio de pantallas
- Cambio de baterías
- Reparación de puertos de carga
- Limpieza de equipos
- Desbloqueo de equipos
- Servicio con garantía de 15 días en reparaciones
  `,

  faq: `
PREGUNTAS FRECUENTES:
- ¿Los equipos son nuevos o seminuevos? Nuevos sellados, también tenemos seminuevos con descuento
- ¿Vienen con cargador? Sí, todos los equipos incluyen cargador original en excepto la marca samsung y iphone solo incluyen cable
- ¿Tienen seguro contra robo? No, eso es responsabilidad del cliente
- ¿Puedo devolver un equipo? no, 
  `,
};

export default businessInfo;
