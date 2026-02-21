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
    // Suscripción en tiempo real manteniéndose fiel a tu estructura original
    const unsubscribe = onSnapshot(
      collection(db, 'carrusel'),
      (snapshot) => {
        const slidesData = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .filter((slide) => slide.activo === true)
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

  // Si no hay slides, no ocupamos espacio innecesario
  if (isLoading || slides.length === 0) {
    return <div style={{ height: '80vh', backgroundColor: '#f8f9fa' }} />; // Placeholder mientras carga para evitar saltos
  }

  return (
    <div className="hero-carousel-wrapper full-width-carousel mb-5">
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
        {slides.map((slide, index) => (
          <SwiperSlide key={slide.id}>
            <div className="hero-slide">
              {/* MEJORA: Usamos tag img para mejor rendimiento (LCP) y SEO */}
              <img
                src={slide.url_imagen}
                alt={slide.titulo || "GIO TECH Promoción"}
                className="hero-slide-image-element"
                // El primer slide debe cargar rápido (eager), los demás después (lazy)
                loading={index === 0 ? "eager" : "lazy"}
              />

              {/* Overlay con gradiente para legibilidad */}
              <div className="hero-overlay-gradient" />

              {/* Contenido del slide */}
              {slide.titulo && (
                <div className="hero-content">
                  <div className="container">
                    {/* Solo el primer slide lleva el H1 principal para el SEO de la web */}
                    {index === 0 ? (
                      <h1 className="hero-title">{slide.titulo}</h1>
                    ) : (
                      <h2 className="hero-title">{slide.titulo}</h2>
                    )}
                  </div>
                </div>
              )}
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Estilos encapsulados */}
      <style>{`
        .hero-carousel-wrapper {
          width: 100%;
          position: relative;
          margin: 0;
          padding: 0;
          overflow: hidden;
          background-color: #000; /* Fondo negro mientras carga la imagen */
        }

        .hero-swiper {
          width: 100%;
          height: 80vh;
          min-height: 500px;
          padding-top: 80px;
        }

        @media (max-width: 991px) {
          .hero-swiper { padding-top: 70px; }
        }

        @media (max-width: 768px) {
          .hero-swiper {
            height: 60vh;
            min-height: 400px;
          }
        }

        .hero-slide {
          position: relative;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }

        /* Ajuste de la imagen para que sea fluida y no se rompa */
        .hero-slide-image-element {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          transition: transform 10s ease-out;
          z-index: 0;
        }

        .swiper-slide-active .hero-slide-image-element {
          transform: scale(1.15);
        }

        .hero-overlay-gradient {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(0deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 100%);
          z-index: 1;
        }

        .hero-content {
          position: absolute;
          bottom: 25%;
          left: 0;
          right: 0;
          z-index: 2;
          text-align: center;
          padding: 0 1.5rem;
        }

        .hero-title {
          color: white;
          font-size: clamp(2.2rem, 8vw, 5.5rem);
          font-weight: 800;
          text-shadow: 0 4px 20px rgba(0,0,0,0.5);
          margin: 0;
          opacity: 0;
          transform: translateY(40px);
          transition: all 1s cubic-bezier(0.2, 0.8, 0.2, 1);
          line-height: 1;
          letter-spacing: -0.05em;
        }

        .swiper-slide-active .hero-title {
          opacity: 1;
          transform: translateY(0);
          transition-delay: 0.4s;
        }

        /* Controles de Swiper personalizados */
        .hero-swiper .swiper-button-next,
        .hero-swiper .swiper-button-prev {
          color: white;
          background: rgba(0,0,0,0.3);
          backdrop-filter: blur(8px);
          width: 48px;
          height: 48px;
          border-radius: 50%;
          transition: all 0.3s ease;
        }

        .hero-swiper .swiper-button-next:after,
        .hero-swiper .swiper-button-prev:after {
          font-size: 1.2rem;
        }

        .hero-swiper .swiper-pagination-bullet-active {
          background: white !important;
          width: 30px;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
}

export default HeroCarousel;