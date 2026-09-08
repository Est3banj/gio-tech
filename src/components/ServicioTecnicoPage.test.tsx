import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ServicioTecnicoPage, {
  REPAIR_BRANDS,
  REPAIR_FAILURES,
  FACEBOOK_REPAIR_VIDEO_URL,
} from './ServicioTecnicoPage';
import { WhatsappNumberContext } from '../contexts/whatsapp-number-context';
import { DEFAULT_MAPS_URL } from './Footer';

describe('ServicioTecnicoPage — Rediseño Ultra-Minimalista Estilo Apple Support & Soporte Híbrido de Video', () => {
  const customWhatsappNumber = '573223652569';

  const renderComponent = (props = {}, whatsappNumber = customWhatsappNumber) => {
    return render(
      <MemoryRouter>
        <WhatsappNumberContext.Provider value={whatsappNumber}>
          <ServicioTecnicoPage {...props} />
        </WhatsappNumberContext.Provider>
      </MemoryRouter>
    );
  };

  beforeEach(() => {
    window.HTMLElement.prototype.scrollIntoView = () => {};
    vi.clearAllMocks();
    vi.spyOn(window, 'open').mockImplementation(() => null);
  });

  it('debe renderizar el Hero Header y la Tarjeta Central Unificada', () => {
    renderComponent();

    // Eyebrow y título Apple Support
    expect(
      screen.getByText(/Laboratorio Técnico Especializado · Puerto Asís, Putumayo/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 1, name: /Servicio Técnico/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/Cotización Inmediata/i)).toBeInTheDocument();

    // Microcopy de confianza (Sin precios numéricos)
    expect(
      screen.getByText(/Cotización exacta en 5 minutos por WhatsApp/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Confirmamos disponibilidad inmediata de repuestos en bodega/i)
    ).toBeInTheDocument();

    // Botón principal CTA
    expect(
      screen.getByRole('link', { name: /Solicitar Cotización con el Técnico en WhatsApp/i })
    ).toBeInTheDocument();
  });

  it('NO debe mostrar cifras de precios numéricos en la web', () => {
    const { container } = renderComponent();

    // Validar que no haya símbolos de precios $ o COP en textos de la UI
    expect(container.textContent).not.toMatch(/\$\s*\d+/);
    expect(container.textContent).not.toMatch(/\d{2,3}\.000\s*COP/);
  });

  it('debe renderizar las 12 marcas de teléfonos requeridas y permitir cambiar la selección', () => {
    renderComponent();

    expect(REPAIR_BRANDS).toHaveLength(12);

    const appleBtn = screen.getByRole('button', { name: /Apple/i });
    const samsungBtn = screen.getByRole('button', { name: /Samsung/i });
    const xiaomiBtn = screen.getByRole('button', { name: /Xiaomi/i });
    const motorolaBtn = screen.getByRole('button', { name: /Motorola/i });
    const tecnoBtn = screen.getByRole('button', { name: /Tecno/i });
    const infinixBtn = screen.getByRole('button', { name: /Infinix/i });
    const huaweiBtn = screen.getByRole('button', { name: /Huawei/i });
    const vivoBtn = screen.getByRole('button', { name: /Vivo/i });
    const oppoBtn = screen.getByRole('button', { name: /Oppo/i });
    const realmeBtn = screen.getByRole('button', { name: /^Realme$/i });
    const zteBtn = screen.getByRole('button', { name: /^ZTE$/i });
    const otraBtn = screen.getByRole('button', { name: /^Otra$/i });

    expect(appleBtn).toBeInTheDocument();
    expect(samsungBtn).toBeInTheDocument();
    expect(xiaomiBtn).toBeInTheDocument();
    expect(motorolaBtn).toBeInTheDocument();
    expect(tecnoBtn).toBeInTheDocument();
    expect(infinixBtn).toBeInTheDocument();
    expect(huaweiBtn).toBeInTheDocument();
    expect(vivoBtn).toBeInTheDocument();
    expect(oppoBtn).toBeInTheDocument();
    expect(realmeBtn).toBeInTheDocument();
    expect(zteBtn).toBeInTheDocument();
    expect(otraBtn).toBeInTheDocument();

    // Apple activa por defecto
    expect(appleBtn).toHaveClass('active');

    // Cambiar a Xiaomi y verificar actualización de modelo sugerido
    fireEvent.click(xiaomiBtn);
    expect(xiaomiBtn).toHaveClass('active');
    expect(appleBtn).not.toHaveClass('active');

    const modelInput = screen.getByLabelText(/2\. Modelo Exacto del Celular/i) as HTMLInputElement;
    expect(modelInput.value).toBe('Redmi Note 13 Pro');
  });

  it('debe renderizar las 8 fallas o síntomas requeridos y permitir la selección', () => {
    renderComponent();

    expect(REPAIR_FAILURES).toHaveLength(8);

    const pantallaBtn = screen.getByRole('button', { name: /Pantalla o Visor roto/i });
    const bateriaBtn = screen.getByRole('button', { name: /Batería o no retiene carga/i });
    const pinBtn = screen.getByRole('button', { name: /Pin de carga o no conecta/i });
    const placaBtn = screen.getByRole('button', { name: /No prende o falla en placa/i });
    const mojadoBtn = screen.getByRole('button', { name: /Equipo mojado o daño por líquido/i });
    const camaraBtn = screen.getByRole('button', { name: /Cámaras o micrófonos/i });
    const mantBtn = screen.getByRole('button', { name: /Mantenimiento preventivo/i });
    const otraFallaBtn = screen.getByRole('button', { name: /Otra falla técnica/i });

    expect(pantallaBtn).toBeInTheDocument();
    expect(bateriaBtn).toBeInTheDocument();
    expect(pinBtn).toBeInTheDocument();
    expect(placaBtn).toBeInTheDocument();
    expect(mojadoBtn).toBeInTheDocument();
    expect(camaraBtn).toBeInTheDocument();
    expect(mantBtn).toBeInTheDocument();
    expect(otraFallaBtn).toBeInTheDocument();

    // Pantalla activa por defecto
    expect(pantallaBtn).toHaveClass('active');

    // Cambiar a mojado
    fireEvent.click(mojadoBtn);
    expect(mojadoBtn).toHaveClass('active');
    expect(pantallaBtn).not.toHaveClass('active');
  });

  it('debe permitir escribir nombre, seleccionar municipio y escribir síntomas adicionales', () => {
    renderComponent();

    const nameInput = screen.getByPlaceholderText(/Carlos Morales/i);
    fireEvent.change(nameInput, { target: { value: 'Laura Restrepo' } });

    const muniSelect = screen.getByRole('combobox');
    fireEvent.change(muniSelect, { target: { value: 'Orito' } });

    const symptomsInput = screen.getByPlaceholderText(/El táctil no responde en la parte superior/i);
    fireEvent.change(symptomsInput, { target: { value: 'Se cayó y parpadea en verde' } });

    const whatsappLink = screen.getByRole('link', { name: /Solicitar Cotización con el Técnico en WhatsApp/i });
    const href = whatsappLink.getAttribute('href') || '';

    expect(href).toContain(encodeURIComponent('Laura Restrepo'));
    expect(href).toContain(encodeURIComponent('Orito'));
    expect(href).toContain(encodeURIComponent('Se cayó y parpadea en verde'));
    expect(href).toContain(customWhatsappNumber);
  });

  it('debe renderizar el Pie de Página de Confianza (Single Micro-Bar)', () => {
    renderComponent();

    expect(
      screen.getByText(/Laboratorio GIO TECH: Cra\. 32 #13 36, Puerto Asís, Putumayo/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Horarios: L-S 8:00 AM - 7:00 PM/i)).toBeInTheDocument();

    const mapsBtn = screen.getByRole('link', { name: /Ver en Google Maps/i });
    expect(mapsBtn).toBeInTheDocument();
    expect(mapsBtn).toHaveAttribute('href', DEFAULT_MAPS_URL);
  });

  it('debe renderizar la Tarjeta de Showcase de Facebook de alta gama por defecto (sin iframes rotos)', () => {
    renderComponent();

    // Badge y textos de encabezado del showcase
    expect(
      screen.getByText(/Grabado en nuestra sede física de Puerto Asís/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: /Laboratorio en Acción: Reparación de iPhone/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Procedimientos de alta precisión y cambio de componentes realizados en nuestra sede de Puerto Asís con repuestos certificados\./i)
    ).toBeInTheDocument();

    // Micro-badge de Laboratorio
    expect(screen.getByText(/Laboratorio GIO TECH · Puerto Asís/i)).toBeInTheDocument();

    // Título y descripción del showcase
    expect(
      screen.getByRole('heading', { level: 3, name: /Proceso en Laboratorio: Cambio de Batería iPhone 13 Pro Max/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Conocé nuestras instalaciones, instrumental de precisión y el proceso técnico garantizado en Puerto Asís\./i)
    ).toBeInTheDocument();

    // Botón destacado de Ver video completo en Facebook
    const fbBtn = screen.getByRole('link', { name: /Ver video completo en Facebook/i });
    expect(fbBtn).toBeInTheDocument();
    expect(fbBtn).toHaveAttribute('href', FACEBOOK_REPAIR_VIDEO_URL);
    expect(fbBtn).toHaveAttribute('target', '_blank');
    expect(fbBtn).toHaveAttribute('rel', 'noopener noreferrer');

    // No debe haber ningún iframe en el DOM (evita bloqueos CSP/X-Frame-Options)
    expect(screen.queryByRole('region', { name: /iframe/i })).not.toBeInTheDocument();
    const iframes = document.querySelectorAll('iframe');
    expect(iframes.length).toBe(0);

    // Al hacer clic en la tarjeta del showcase, debe llamar a window.open con la URL de Facebook
    const showcaseCard = screen.getByRole('button', { name: /Ver video completo de reparación en Facebook/i });
    fireEvent.click(showcaseCard);
    expect(window.open).toHaveBeenCalledWith(FACEBOOK_REPAIR_VIDEO_URL, '_blank', 'noopener,noreferrer');
  });

  it('debe permitir interactuar con la tarjeta de Facebook mediante teclado (Enter y Espacio)', () => {
    renderComponent();

    const showcaseCard = screen.getByRole('button', { name: /Ver video completo de reparación en Facebook/i });

    // Presionar Enter
    fireEvent.keyDown(showcaseCard, { key: 'Enter', code: 'Enter' });
    expect(window.open).toHaveBeenCalledWith(FACEBOOK_REPAIR_VIDEO_URL, '_blank', 'noopener,noreferrer');

    // Presionar Espacio
    fireEvent.keyDown(showcaseCard, { key: ' ', code: 'Space' });
    expect(window.open).toHaveBeenCalledTimes(2);
  });

  it('debe renderizar el reproductor de video nativo HTML5 cuando se pasa videoSrc', () => {
    const videoUrl = '/videos/reparacion-iphone.mp4';
    const posterUrl = '/images/poster-iphone.webp';

    const { container } = renderComponent({
      videoSrc: videoUrl,
      posterSrc: posterUrl,
    });

    // El tag <video> debe estar presente en el DOM
    const videoElem = container.querySelector('video');
    expect(videoElem).toBeInTheDocument();
    expect(videoElem).toHaveAttribute('controls');
    expect(videoElem).toHaveAttribute('playsinline');
    expect(videoElem).toHaveAttribute('poster', posterUrl);

    // El source debe apuntar a la URL provista
    const sourceElem = videoElem?.querySelector('source');
    expect(sourceElem).toBeInTheDocument();
    expect(sourceElem).toHaveAttribute('src', videoUrl);
    expect(sourceElem).toHaveAttribute('type', 'video/mp4');

    // Debe mostrar el enlace complementario a Facebook
    const fbLink = screen.getByRole('link', { name: /Ver video completo en Facebook/i });
    expect(fbLink).toBeInTheDocument();
    expect(fbLink).toHaveAttribute('href', FACEBOOK_REPAIR_VIDEO_URL);
  });
});


