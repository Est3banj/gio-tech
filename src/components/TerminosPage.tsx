import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function TerminosPage() {
  const navigate = useNavigate();

  // Carga fría con hash (#privacidad): React.lazy renderiza DESPUÉS de que el
  // navegador procesa el hash, así que el scroll nativo nunca llega a ejecutarse.
  // Hashchange en SPA sí lo resuelve el navegador, por eso solo necesitamos el montaje.
  useEffect(() => {
    const id = window.location.hash.replace(/^#/, '');
    if (!id) return;

    let observer: MutationObserver | null = null;
    let timeoutId = 0;

    const scrollToTarget = () => {
      const target = document.getElementById(id);
      if (!target) return false;
      target.scrollIntoView();
      return true;
    };

    if (scrollToTarget()) return;

    const rafId = requestAnimationFrame(() => {
      if (scrollToTarget()) return;
      // El nodo puede llegar un render tarde: lo esperamos sin timeouts largos.
      observer = new MutationObserver(() => {
        if (scrollToTarget() && observer) observer.disconnect();
      });
      observer.observe(document.body, { childList: true, subtree: true });
      timeoutId = window.setTimeout(() => observer?.disconnect(), 1500);
    });

    return () => {
      cancelAnimationFrame(rafId);
      observer?.disconnect();
      window.clearTimeout(timeoutId);
    };
  }, []);

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
          <em>Última actualización: Octubre de 2026</em>
        </p>

        <p>
          Bienvenido a GIO TECH. Al acceder y utilizar nuestro sitio web, aceptas cumplir con
          los siguientes términos y condiciones de servicio. Te recomendamos leerlos
          detenidamente.
        </p>

        <h2 id="informacion-general">1. Información General</h2>
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

        <h2 id="compra">2. Proceso de Compra y Métodos de Pago</h2>
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

        <h2 id="envios">3. Políticas de Envío y Entrega</h2>
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

        <h2 id="garantias">4. Políticas de Garantía</h2>
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

        <h2 id="privacidad">5. Política de Privacidad y Tratamiento de Datos</h2>
        <p>
          En cumplimiento de las normativas de protección de datos personales en Colombia,
          GIO TECH se compromete a proteger la privacidad de sus usuarios. Los datos que
          recolectamos según el formulario utilizado son: nombre, municipio de ubicación y
          datos de contacto; en el servicio técnico, además marca, modelo y descripción de la
          falla; en la solicitud de crédito, información financiera necesaria para la
          evaluación de la entidad elegida. Estos datos se manejan bajo las siguientes
          condiciones:
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
            <strong>Encargados y transferencias:</strong> GIO TECH no vende ni alquila datos
            personales. Sí los tratamos con proveedores que actúan como encargados y bajo
            nuestras instrucciones (lista en «Responsable del tratamiento» más abajo). Las
            herramientas de medición y publicitarias (Google Analytics y Meta Pixel) se cargan
            únicamente si diste tu consentimiento previo, y los datos de interacción que ellas
            recopilan pueden tratarse fuera de Colombia por empresas de Estados Unidos.
          </li>
        </ul>

        <h3>Derechos ARCO (derechos del titular)</h3>
        <p>
          Como titular de tus datos personales tienes derecho a: (i) conocer, actualizar y
          rectificar la información que tenemos sobre ti; (ii) solicitar prueba de la
          autorización que nos otorgaste; (iii) revocar esa autorización cuando proceda; (iv)
          presentar reclamos ante la Superintendencia de Industria y Comercio por el
          tratamiento indebido de tus datos. Para ejercer estos derechos, escríbenos a
          giotech.telefonia@gmail.com.
        </p>

        <p>
          Otorgas tu autorización mediante el casillero que aparece en los formularios de
          pedido, crédito y servicio técnico, justo antes de enviar tu solicitud. Cada
          autorización queda registrada con su fecha y con la versión de estas políticas
          vigente al momento de aceptar. Puedes revocarla en cualquier momento escribiendo a
          nuestro correo de contacto.
        </p>

        <h3>Responsable del tratamiento</h3>
        <ul>
          <li>
            <strong>Responsable:</strong> GIO TECH — [RAZÓN SOCIAL — pendiente] (NIT
            [PENDIENTE]).
          </li>
          <li>
            <strong>Dirección:</strong> Cra. 32 #13 36, Puerto Asís, Putumayo, Colombia.
          </li>
          <li>
            <strong>Correo de contacto:</strong> giotech.telefonia@gmail.com
          </li>
        </ul>
        <p>
          <strong>Encargados relevantes del tratamiento:</strong>
        </p>
        <ul>
          <li>
            <strong>Google LLC (EE. UU.):</strong> alojamiento del sitio (Firebase) y, sólo si
            lo autorizas, medición estadística con Google Analytics 4.
          </li>
          <li>
            <strong>Groq (EE. UU.):</strong> proveedor del asistente de chat con inteligencia
            artificial del sitio.
          </li>
          <li>
            <strong>Meta Platforms Inc. (EE. UU.):</strong> sólo si lo autorizas, Meta Pixel
            para medir campañas y eventos de negocio.
          </li>
          <li>
            <strong>WhatsApp (Meta Platforms Ireland Limited)</strong> — canal de envío de las
            solicitudes que haces en nuestros formularios; los datos se transmiten por
            WhatsApp conforme a su propia política de privacidad.
          </li>
          <li>
            <strong>Entidades financieras (Sistecrédito, Esmiopción, PayJoy, Krediya, Celya)</strong>{' '}
            — cuando solicitas un crédito, los datos del formulario se envían por WhatsApp a GIO
            TECH y se comparten con la entidad que elegiste para evaluar tu solicitud; en
            algunos casos serás redirigido al sitio de la entidad para completar el proceso por
            cuenta propia.
          </li>
        </ul>

        <h2 id="tecnologias">6. Tecnologías de rastreo y cookies</h2>
        <p>
          Este sitio utiliza dos tecnologías de rastreo de terceros. Ninguna se descarga en tu
          navegador hasta que tú lo autorizas mediante el banner de cookies o el botón
          «Preferencias de cookies» del pie de página:
        </p>
        <ul>
          <li>
            <strong>Google Analytics 4 (GA4)</strong> — proveedor: Google LLC, Estados Unidos.
            Identificador <code>G-1KGCQBPN75</code>. Registra interacción con el sitio (páginas
            vistas, eventos) con fines estadísticos. Categoría: analítica.
          </li>
          <li>
            <strong>Meta Pixel</strong> — proveedor: Meta Platforms Inc., Estados Unidos.
            Identificador <code>939199705550194</code>. Registra interacción con el sitio y
            eventos de compra/lead (agregar al carrito, contacto por WhatsApp) con fines de
            medición de campañas publicitarias. Categoría: publicidad.
          </li>
        </ul>
        <p>
          Puedes aceptarlo todo, quedarte sólo con las cookies necesarias o elegir categoría por
          categoría. En cualquier momento puedes <strong>revocar tu consentimiento</strong> con
          el botón «Preferencias de cookies» del pie de página; si reduces permisos, la página
          se recarga para descargar únicamente lo que sigues autorizando. El detalle de cada
          categoría y de las cookies técnicas está en la{' '}
          <Link to="/cookies">Política de cookies</Link>.
        </p>

        <h2 id="ley-aplicable">7. Ley Aplicable</h2>
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
          scroll-margin-top: 5rem;
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
