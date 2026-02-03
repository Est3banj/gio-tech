// src/components/HeroCarousel.jsx
import React, { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay, EffectFade } from 'swiper/modules';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';

function HeroCarousel() {
  const [slides, setSlides] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Suscripción en tiempo real a la colección carrusel
    // Carga todos los slides y filtra/ordena en el cliente para evitar índice compuesto
    const unsubscribe = onSnapshot(
      collection(db, 'carrusel'),
      (snapshot) => {
        const slidesData = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          // Filtrar solo slides activos
          .filter((slide) => slide.activo === true)
          // Ordenar por campo 'orden'
          .sort((a, b) => (a.orden || 0) - (b.orden || 0));

        setSlides(slidesData);
        setIsLoading(false);
      },
      (error) => {
        console.error('Error al cargar slides del carrusel:', error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // No renderizar nada si no hay slides activos
  if (isLoading || slides.length === 0) {
    return null;
  }

  return (
    <div className="hero-carousel-wrapper mb-5">
      <Swiper
        modules={[Navigation, Pagination, Autoplay, EffectFade]}
        spaceBetween={0}
        slidesPerView={1}
        navigation
        pagination={{ clickable: true }}
        autoplay={{
          delay: 5000,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        }}
        effect="fade"
        fadeEffect={{ crossFade: true }}
        loop={slides.length > 1}
        className="hero-swiper"
      >
        {slides.map((slide) => (
          <SwiperSlide key={slide.id}>
            <div className="hero-slide">
              {/* Imagen de fondo */}
              <div
                className="hero-slide-image"
                style={{
                  backgroundImage: `url(${slide.url_imagen})`,
                }}
              />

              {/* Overlay oscuro para legibilidad */}
              <div className="hero-overlay" />

              {/* Contenido del slide */}
              {slide.titulo && (
                <div className="hero-content">
                  <div className="container">
                    <h1 className="hero-title">{slide.titulo}</h1>
                  </div>
                </div>
              )}
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Estilos inline para el carrusel */}
      <style>{`
        .hero-carousel-wrapper {
          width: 100%;
          position: relative;
          margin: 0;
          padding: 0;
        }

        .hero-swiper {
          width: 100%;
          aspect-ratio: 16 / 10;
          max-height: 90vh;
        }

        /* Fallback para navegadores que no soportan aspect-ratio */
        @supports not (aspect-ratio: 16 / 10) {
          .hero-swiper {
            height: 0;
            padding-bottom: 62.5%; /* 10/16 = 0.625 = 62.5% */
            position: relative;
          }
          
          .hero-swiper > * {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
          }
        }

        .hero-slide {
          position: relative;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }

        .hero-slide-image {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          transition: transform 0.3s ease;
        }

        .hero-slide:hover .hero-slide-image {
          transform: scale(1.05);
        }

        .hero-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.4);
          z-index: 1;
        }

        .hero-content {
          position: absolute;
          top: 50%;
          left: 0;
          right: 0;
          transform: translateY(-50%);
          z-index: 2;
          text-align: center;
          padding: 0 20px;
        }

        .hero-title {
          color: #ffffff;
          font-size: 1.8rem;
          font-weight: 700;
          text-shadow: 2px 2px 8px rgba(0, 0, 0, 0.7);
          margin: 0;
          animation: fadeInUp 0.8s ease;
          line-height: 1.2;
        }

        @media (min-width: 576px) {
          .hero-title {
            font-size: 2.2rem;
          }
        }

        @media (min-width: 768px) {
          .hero-title {
            font-size: 3rem;
          }
        }

        @media (min-width: 992px) {
          .hero-title {
            font-size: 3.5rem;
          }
        }

        @media (min-width: 1200px) {
          .hero-title {
            font-size: 4.5rem;
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Estilos para los controles de navegación */
        .hero-swiper .swiper-button-next,
        .hero-swiper .swiper-button-prev {
          color: #ffffff;
          background: rgba(0, 0, 0, 0.5);
          width: 40px;
          height: 40px;
          border-radius: 50%;
          transition: all 0.3s ease;
        }

        @media (min-width: 768px) {
          .hero-swiper .swiper-button-next,
          .hero-swiper .swiper-button-prev {
            width: 50px;
            height: 50px;
          }
        }

        .hero-swiper .swiper-button-next:after,
        .hero-swiper .swiper-button-prev:after {
          font-size: 18px;
        }

        @media (min-width: 768px) {
          .hero-swiper .swiper-button-next:after,
          .hero-swiper .swiper-button-prev:after {
            font-size: 20px;
          }
        }

        .hero-swiper .swiper-button-next:hover,
        .hero-swiper .swiper-button-prev:hover {
          background: rgba(0, 0, 0, 0.8);
          transform: scale(1.1);
        }

        /* Estilos para la paginación */
        .hero-swiper .swiper-pagination-bullet {
          width: 10px;
          height: 10px;
          background: #ffffff;
          opacity: 0.6;
          transition: all 0.3s ease;
        }

        @media (min-width: 768px) {
          .hero-swiper .swiper-pagination-bullet {
            width: 12px;
            height: 12px;
          }
        }

        .hero-swiper .swiper-pagination-bullet-active {
          opacity: 1;
          background: #ffffff;
          width: 24px;
          border-radius: 6px;
        }

        @media (min-width: 768px) {
          .hero-swiper .swiper-pagination-bullet-active {
            width: 30px;
          }
        }

        /* Mostrar flechas en todos los dispositivos */
        .hero-swiper .swiper-button-next,
        .hero-swiper .swiper-button-prev {
          display: flex;
          align-items: center;
          justify-content: center;
        }
      `}</style>
    </div>
  );
}

export default HeroCarousel;
