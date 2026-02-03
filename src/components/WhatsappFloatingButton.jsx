// src/components/WhatsappFloatingButton.jsx
import React from 'react';
import { useWhatsappNumber } from '../contexts/WhatsappNumberContext';

/**
 * Botón flotante de WhatsApp que aparece en la esquina inferior derecha
 * Usa el número de WhatsApp del contexto (puede ser del asesor o el número general)
 */
const WhatsappFloatingButton = () => {
  const phoneNumber = useWhatsappNumber();

  // Mensaje predeterminado para asesoría general
  const mensajeDefault = "Hola GIO TECH, me interesa recibir asesoría sobre un equipo";

  const handleClick = () => {
    if (phoneNumber) {
      const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(mensajeDefault)}`;
      window.open(url, '_blank');
    }
  };

  return (
    <>
      <style>{`
        .whatsapp-float-button {
          position: fixed;
          bottom: 20px;
          left: 20px; /* Cambiado a la izquierda para no chocar con el carrito */
          width: 60px;
          height: 60px;
          background: linear-gradient(135deg, #25D366 0%, #1ebe57 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 16px rgba(37, 211, 102, 0.4);
          cursor: pointer;
          z-index: 1000;
          transition: all 0.3s ease;
          border: none;
        }

        .whatsapp-float-button:hover {
          transform: scale(1.1) translateY(-3px);
          box-shadow: 0 6px 20px rgba(37, 211, 102, 0.6);
          background: linear-gradient(135deg, #1ebe57 0%, #128c4a 100%);
        }

        .whatsapp-float-button:active {
          transform: scale(1.05);
        }

        .whatsapp-float-button i {
          font-size: 32px;
          color: white;
        }

        /* Ajustes para móviles */
        @media (max-width: 768px) {
          .whatsapp-float-button {
            bottom: 20px; /* Mantener en la misma altura */
            left: 15px;
            width: 56px;
            height: 56px;
          }

          .whatsapp-float-button i {
            font-size: 28px;
          }
        }

        @media (max-width: 480px) {
          .whatsapp-float-button {
            bottom: 20px;
            left: 12px;
            width: 52px;
            height: 52px;
          }

          .whatsapp-float-button i {
            font-size: 26px;
          }
        }

        /* Animación de entrada suave */
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .whatsapp-float-button {
          animation: fadeInUp 0.5s ease-out;
        }

        /* Pulse animation para llamar la atención (opcional) */
        @keyframes pulse {
          0% {
            box-shadow: 0 4px 16px rgba(37, 211, 102, 0.4);
          }
          50% {
            box-shadow: 0 4px 20px rgba(37, 211, 102, 0.7);
          }
          100% {
            box-shadow: 0 4px 16px rgba(37, 211, 102, 0.4);
          }
        }

        /* Activar pulse cada 3 segundos para llamar atención */
        .whatsapp-float-button {
          animation: fadeInUp 0.5s ease-out, pulse 2s ease-in-out 2s infinite;
        }
      `}</style>

      <button
        className="whatsapp-float-button"
        onClick={handleClick}
        aria-label="Contactar por WhatsApp"
        title="Chatea con nosotros por WhatsApp"
      >
        <i className="bi bi-whatsapp"></i>
      </button>
    </>
  );
};

export default WhatsappFloatingButton;
