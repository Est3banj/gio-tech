// src/components/WhatsappFloatingButton.tsx
import React from 'react';
import { useWhatsappNumber } from '../contexts/WhatsappNumberContext';

const WhatsAppFloatingButton: React.FC = () => {
  const phoneNumber = useWhatsappNumber();
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
        .whatsapp-container {
          position: fixed;
          bottom: 25px;
          left: 20px;
          display: flex;
          align-items: center;
          z-index: 1000;
          cursor: pointer;
          animation: fadeInUp 0.5s ease-out;
        }

        .whatsapp-badge {
          background: #ffffff;
          color: #444;
          padding: 6px 12px;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 500;
          margin-left: 8px;
          box-shadow: 0 4px 10px rgba(0,0,0,0.1);
          white-space: nowrap;
          border: 1px solid #efefef;
          position: relative;
          transition: all 0.3s ease;
          letter-spacing: -0.2px;
        }

        .whatsapp-badge::before {
          content: "";
          position: absolute;
          left: -6px;
          top: 50%;
          transform: translateY(-50%);
          border-top: 6px solid transparent;
          border-bottom: 6px solid transparent;
          border-right: 6px solid #ffffff;
        }

        .whatsapp-float-button {
          width: 50px;
          height: 50px;
          background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(37, 211, 102, 0.3);
          border: none;
          color: white;
          transition: all 0.3s ease;
        }

        .whatsapp-container:hover .whatsapp-float-button {
          transform: scale(1.05);
        }
        
        .whatsapp-container:hover .whatsapp-badge {
          background: #fff;
          box-shadow: 0 6px 15px rgba(0,0,0,0.15);
        }

        .whatsapp-float-button i {
          font-size: 26px;
        }

        @media (max-width: 768px) {
          .whatsapp-container {
            bottom: 20px;
            left: 15px;
          }
          .whatsapp-badge {
            font-size: 12px;
            padding: 5px 10px;
          }
          .whatsapp-float-button {
            width: 45px;
            height: 45px;
          }
          .whatsapp-float-button i {
            font-size: 22px;
          }
        }

        @media (max-width: 360px) {
          .whatsapp-badge {
            display: none;
          }
        }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="whatsapp-container" onClick={handleClick}>
        <button
          className="whatsapp-float-button"
          aria-label="Contactar por WhatsApp"
        >
          <i className="bi bi-whatsapp"></i>
        </button>

        <div className="whatsapp-badge">
          ¿Dudas? Escríbenos
        </div>
      </div>
    </>
  );
};

export default WhatsAppFloatingButton;
