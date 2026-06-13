import { useNavigate } from 'react-router-dom';

export default function TerminosPage() {
  const navigate = useNavigate();

  const handleVolver = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      // Si no hay historial (abierto en nueva pestaña), intenta cerrarla
      // Si el browser no permite, redirige al catálogo
      window.close();
      setTimeout(() => navigate('/catalogo'), 100);
    }
  };

  return (
    <div className="terminos-page">
      <div className="terminos-container">
        <button className="btn-back" onClick={handleVolver}>
          <i className="bi bi-arrow-left me-2"></i> Volver
        </button>

        <h1 className="terminos-title">
          Términos, Condiciones de Uso y Políticas de Privacidad – GIO TECH
        </h1>
        <p className="terminos-date">
          <em>Última actualización: Junio de 2026</em>
        </p>

        <p>
          Bienvenido a GIO TECH. Al acceder y utilizar nuestro sitio web, aceptas cumplir con
          los siguientes términos y condiciones de servicio. Te recomendamos leerlos
          detenidamente.
        </p>

        <h2>1. Información General</h2>
        <p>
          El sitio web es operado por <strong>GIO TECH</strong>, establecimiento comercial
          ubicado en Puerto Asís, Putumayo, Colombia. Para cualquier duda, reclamación o
          soporte, ponemos a disposición nuestros canales de atención:
        </p>
        <ul>
          <li>
            <strong>Líneas de WhatsApp:</strong> +57 320 807 5465 / +57 322 365 2569
          </li>
          <li>
            <strong>Correo Electrónico:</strong> giotech.telefonia@gmail.com
          </li>
        </ul>

        <h2>2. Proceso de Compra y Métodos de Pago</h2>
        <p>
          Actualmente, nuestro sitio web funciona como un catálogo digital interactivo y no
          cuenta con pasarela de pagos automatizada. El proceso de compra se gestiona de la
          siguiente manera:
        </p>
        <ul>
          <li>
            Al seleccionar un producto o servicio, el sistema redirigirá al usuario de forma
            automática a un chat de WhatsApp con uno de nuestros asesores.
          </li>
          <li>
            La confirmación de disponibilidad, la acordación del método de pago
            (transferencias, efectivo u otros medios acordados) y la finalización del pedido
            se realizarán directamente a través del chat personalizado.
          </li>
        </ul>

        <h2>3. Políticas de Envío y Entrega</h2>
        <p>
          Realizamos entregas locales y envíos a diferentes regiones del país. Los costos y
          condiciones de envío se manejan bajo los siguientes criterios:
        </p>
        <ul>
          <li>
            <strong>Costo del envío:</strong> Dependiendo del lugar de residencia del cliente
            y el tipo de producto, el costo del envío podrá ser asumido por GIO TECH o deberá
            ser pagado por el cliente. Este valor se acordará y confirmará con el asesor
            durante el proceso de compra en WhatsApp.
          </li>
          <li>
            GIO TECH no se hace responsable por retrasos causados por las empresas de
            transporte ajenas a nuestra operación.
          </li>
        </ul>

        <h2>4. Políticas de Garantía</h2>
        <p>
          En GIO TECH nos tomamos muy en serio la satisfacción de nuestros clientes. Nuestras
          garantías se aplican bajo las siguientes normativas:
        </p>

        <h3>Equipos Celulares</h3>
        <ul>
          <li>
            <strong>Equipos nuevos:</strong> Ofrecemos una garantía de{' '}
            <strong>seis (6) meses</strong> directamente con nuestra tienda a partir de la
            fecha de entrega.
          </li>
          <li>
            <strong>Equipos usados:</strong> Ofrecemos una garantía de{' '}
            <strong>tres (3) meses</strong> directamente con nuestra tienda a partir de la
            fecha de entrega.
          </li>
        </ul>
        <p>
          <strong>Exclusiones:</strong> La garantía cubre estrictamente defectos de
          fabricación o fallas de software/hardware internas. NO cubre daños ocasionados por
          golpes, caídas, humedad, contacto con líquidos, sobrecargas eléctricas ni mala
          manipulación por parte del usuario o de terceros no autorizados.
        </p>

        <h3>Servicio Técnico y Reparaciones</h3>
        <p>
          Todas nuestras reparaciones y repuestos instalados cuentan con una garantía de{' '}
          <strong>quince (15) días calendario</strong>.
        </p>
        <p>
          <strong>Exclusiones:</strong> Al igual que en los equipos, la garantía del servicio
          técnico perderá total validez si el repuesto o el dispositivo presenta evidencias
          de mala manipulación, humedad, nuevos golpes, roturas o si los sellos de garantía
          internos de la tienda han sido removidos o alterados.
        </p>

        <h2>5. Política de Privacidad y Tratamiento de Datos</h2>
        <p>
          En cumplimiento de las normativas de protección de datos personales en Colombia,
          GIO TECH se compromete a proteger la privacidad de sus usuarios. Los datos
          solicitados en la plataforma (nombre, teléfono, dirección) se manejan bajo las
          siguientes condiciones:
        </p>
        <ul>
          <li>
            <strong>Confidencialidad:</strong> Los datos proporcionados son estrictamente
            confidenciales.
          </li>
          <li>
            <strong>Finalidad:</strong> La información recolectada se utilizará única y
            exclusivamente para gestionar el procesamiento de compras, entregas, seguimiento
            de servicio técnico y contacto directo con el cliente.
          </li>
          <li>
            <strong>Seguridad:</strong> GIO TECH no venderá, alquilará ni compartirá los
            datos personales de los usuarios con ninguna empresa externa o terceros con fines
            publicitarios.
          </li>
        </ul>

        <h2>6. Ley Aplicable</h2>
        <p>
          Estos términos y condiciones se rigen por las leyes de la República de Colombia.
          Cualquier disputa relacionada con el uso de este sitio web o los servicios
          prestados se resolverá ante las autoridades competentes en el territorio nacional.
        </p>

      </div>

      <style>{`
        .terminos-page {
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem 1.5rem;
          min-height: 80vh;
        }
        .terminos-container {
          background: var(--bg-secondary, #fff);
          border-radius: 12px;
          padding: 2rem;
          box-shadow: 0 2px 12px rgba(0,0,0,0.08);
        }
        .terminos-title {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 0.25rem;
          color: var(--text-primary, #111);
        }
        .terminos-date {
          color: var(--text-muted, #666);
          margin-bottom: 1.5rem;
        }
        .terminos-container h2 {
          font-size: 1.2rem;
          font-weight: 700;
          margin-top: 1.5rem;
          margin-bottom: 0.5rem;
          color: var(--text-primary, #111);
        }
        .terminos-container h3 {
          font-size: 1.05rem;
          font-weight: 600;
          margin-top: 1rem;
          margin-bottom: 0.5rem;
          color: var(--text-primary, #111);
        }
        .terminos-container p {
          line-height: 1.7;
          margin-bottom: 0.75rem;
          color: var(--text-secondary, #333);
        }
        .terminos-container ul {
          padding-left: 1.5rem;
          margin-bottom: 1rem;
        }
        .terminos-container li {
          line-height: 1.7;
          margin-bottom: 0.35rem;
          color: var(--text-secondary, #333);
        }
        .btn-back {
          background: none;
          border: none;
          color: var(--gio-red, #dc3545);
          font-weight: 600;
          padding: 0.5rem 0;
          cursor: pointer;
        }
        .btn-back:hover {
          text-decoration: underline;
          opacity: 0.8;
        }
      `}</style>
    </div>
  );
}
