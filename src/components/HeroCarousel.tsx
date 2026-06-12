// src/components/HeroCarousel.tsx
import React, { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay, EffectFade } from 'swiper/modules';
import type { CarouselSlide } from '../types';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';

const HeroCarousel: React.FC = () => {
  const [slides, setSlides] = useState<CarouselSlide[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'carrusel'),
      (snapshot) => {
        const slidesData = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          } as CarouselSlide))
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

  if (isLoading || slides.length === 0) {
    return (
      <div 
        className="hero-carousel-placeholder"
        style={{ 
          width: '100%', 
          backgroundColor: '#0f172a',
          position: 'relative',
          margin: 0,
          padding: 0,
          overflow: 'hidden'
        }} 
      >
        <style>{`
          .hero-carousel-placeholder {
            height: 80vh;
            min-height: 500px;
          }
          @media (max-width: 768px) {
            .hero-carousel-placeholder {
              height: 50vh;
              min-height: 300px;
            }
          }
          @media (max-width: 480px) {
            .hero-carousel-placeholder {
              height: 45vh;
              min-height: 250px;
            }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="hero-carousel-wrapper full-width-carousel" style={{ marginBottom: 0 }}>
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
              <img
                src={slide.url_imagen}
                alt={slide.titulo || "GIO TECH Promoción"}
                className="hero-slide-image-element"
                loading={index === 0 ? "eager" : "lazy"}
              />
              <div className="hero-overlay-gradient" />
              {slide.titulo && (
                <div className="hero-content">
                  <div className="container">
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

      <style>{`
        .hero-carousel-wrapper {
          width: 100%;
          position: relative;
          margin: 0;
          padding: 0;
          overflow: hidden;
          background-color: #000;
        }

        .hero-swiper {
          width: 100%;
          height: 80vh;
          min-height: 500px;
          padding-top: 80px;
          background-color: transparent;
        }

        .hero-slide {
          background-color: #000;
          position: relative;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }

        @media (max-width: 991px) {
          .hero-swiper { padding-top: 70px; }
        }

        @media (max-width: 768px) {
          .hero-swiper {
            height: 50vh;
            min-height: 300px;
            padding-top: 60px;
          }
          .hero-slide-image-element {
            object-fit: cover !important;
            object-position: center !important;
          }
          .swiper-slide-active .hero-slide-image-element {
            transform: scale(1) !important;
          }
          .hero-title {
            font-size: clamp(1.8rem, 7vw, 3rem);
          }
          .hero-content {
            bottom: 20%;
          }
          .hero-overlay-gradient {
            background: linear-gradient(0deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 100%);
          }
        }

        @media (max-width: 480px) {
          .hero-swiper {
            height: 45vh;
            min-height: 250px;
            padding-top: 50px;
          }
          .hero-title {
            font-size: clamp(1.4rem, 6vw, 2rem);
          }
          .hero-content {
            bottom: 15%;
            padding: 0 1rem;
          }
          .hero-swiper .swiper-button-next,
          .hero-swiper .swiper-button-prev {
            width: 36px;
            height: 36px;
          }
          .hero-swiper .swiper-button-next:after,
          .hero-swiper .swiper-button-prev:after {
            font-size: 0.9rem;
          }
        }

        .hero-slide-image-element {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center center;
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
};

export default HeroCarousel;
