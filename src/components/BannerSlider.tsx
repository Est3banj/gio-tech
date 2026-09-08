import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import type { Banner } from '../types';

export const AUTOPLAY_DURATION = 5000;
const MIN_SWIPE_DISTANCE = 50;

/* ── Framer Motion Variants ─────────────────────────────── */

const slideVariants = {
  enter: { opacity: 0 },
  center: { opacity: 1 },
  exit: { opacity: 0 },
};

const titleVariants = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0 },
};

const descVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const isExternalLink = (url: string): boolean => {
  return /^(https?:|\/\/|mailto:|tel:)/i.test(url);
};

/* ── Component ──────────────────────────────────────────── */

const BannerSlider: React.FC = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'carrusel'),
      (snapshot) => {
        const data = (snapshot?.docs || [])
          .map((doc) => {
            const d = doc.data();
            return {
              id: doc.id,
              imageUrl: d.url_imagen || '',
              image: d.url_imagen || '',
              title: d.titulo || '',
              description: d.descripcion || '',
              link: d.enlace || d.link || '',
              order: d.orden || 0,
              isActive: d.activo === true,
            } as Banner;
          })
          .filter((b) => b.isActive)
          .sort((a, b) => a.order - b.order);

        setBanners(data);
        setCurrentIndex(0);
        setIsLoading(false);
      },
      (error) => {
        console.error('Error al cargar banners:', error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const goToPrevious = () => {
    if (banners.length <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const goToNext = () => {
    if (banners.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  // Autoplay con soporte para pausa inteligente
  useEffect(() => {
    if (banners.length <= 1 || isPaused) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, AUTOPLAY_DURATION);
    return () => clearInterval(interval);
  }, [banners.length, isPaused]);

  // Manejo de gestos táctiles (Swipe)
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    setTouchEndX(null);
    if (e.targetTouches.length > 0) {
      setTouchStartX(e.targetTouches[0].clientX);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.targetTouches.length > 0) {
      setTouchEndX(e.targetTouches[0].clientX);
    }
  };

  const handleTouchEnd = () => {
    if (touchStartX === null || touchEndX === null) return;
    const distance = touchStartX - touchEndX;
    const isLeftSwipe = distance > MIN_SWIPE_DISTANCE;
    const isRightSwipe = distance < -MIN_SWIPE_DISTANCE;

    if (isLeftSwipe) {
      goToNext();
    } else if (isRightSwipe) {
      goToPrevious();
    }

    setTouchStartX(null);
    setTouchEndX(null);
  };

  // Navegación por teclado
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowLeft') {
      goToPrevious();
    } else if (e.key === 'ArrowRight') {
      goToNext();
    }
  };

  // Skeleton shimmer para evitar CLS mientras carga Firestore
  if (isLoading) {
    return (
      <div
        className="banner-slider banner-slider--skeleton"
        aria-busy="true"
        aria-label="Cargando carrusel de promociones"
        data-testid="banner-skeleton"
      >
        <div className="banner-skeleton-shimmer" />
        <div className="banner-skeleton-content">
          <div className="banner-skeleton-title" />
          <div className="banner-skeleton-text" />
          <div className="banner-skeleton-btn" />
        </div>
      </div>
    );
  }

  if (banners.length === 0) return null;

  const currentBanner = banners[currentIndex];
  const hasLink = Boolean(currentBanner?.link && currentBanner.link.trim() !== '');

  return (
    <div
      className="banner-slider"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="region"
      aria-label="Carrusel de promociones"
      aria-roledescription="carousel"
      data-testid="banner-slider-container"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.55, ease: [0.25, 0.1, 0.25, 1] }}
          className="banner-slide"
          data-testid={`banner-slide-${currentIndex}`}
        >
          <img
            src={currentBanner.image || currentBanner.imageUrl}
            alt={currentBanner.title || 'Banner promocional'}
            className="banner-slide-img"
            loading={currentIndex === 0 ? 'eager' : 'lazy'}
          />

          {/* Overlay + animated text and interactive CTA */}
          {(currentBanner.title || currentBanner.description || hasLink) && (
            <div className="banner-overlay">
              <div className="banner-content">
                {currentBanner.title && (
                  <motion.div
                    className="banner-title"
                    variants={titleVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{
                      duration: 0.6,
                      delay: 0.35,
                      ease: [0.25, 0.1, 0.25, 1],
                    }}
                  >
                    {currentBanner.title}
                  </motion.div>
                )}
                {currentBanner.description && (
                  <motion.p
                    className="banner-description"
                    variants={descVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{
                      duration: 0.6,
                      delay: 0.55,
                      ease: [0.25, 0.1, 0.25, 1],
                    }}
                  >
                    {currentBanner.description}
                  </motion.p>
                )}

                {hasLink && currentBanner.link && (
                  <motion.div
                    className="banner-cta-container"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.5,
                      delay: 0.7,
                      ease: [0.25, 0.1, 0.25, 1],
                    }}
                  >
                    {isExternalLink(currentBanner.link) ? (
                      <a
                        href={currentBanner.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="banner-cta-btn"
                        aria-label={`Conocer más sobre ${currentBanner.title || 'promoción'}`}
                      >
                        <span>Conocer más</span>
                        <i className="bi bi-box-arrow-up-right ms-1" aria-hidden="true" />
                      </a>
                    ) : (
                      <Link
                        to={currentBanner.link}
                        className="banner-cta-btn"
                        aria-label={`Ver promoción de ${currentBanner.title || 'productos'}`}
                      >
                        <span>Ver promoción</span>
                        <i className="bi bi-arrow-right ms-1" aria-hidden="true" />
                      </Link>
                    )}
                  </motion.div>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {banners.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="banner-nav-btn banner-nav-btn--left"
            aria-label="Anterior"
            type="button"
          >
            <i className="bi bi-chevron-left" aria-hidden="true" />
          </button>
          <button
            onClick={goToNext}
            className="banner-nav-btn banner-nav-btn--right"
            aria-label="Siguiente"
            type="button"
          >
            <i className="bi bi-chevron-right" aria-hidden="true" />
          </button>

          <div className="banner-dots" role="tablist" aria-label="Selector de banners">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`banner-dot ${
                  index === currentIndex
                    ? 'banner-dot--active'
                    : 'banner-dot--inactive'
                }`}
                aria-label={`Ir al slide ${index + 1}`}
                role="tab"
                aria-selected={index === currentIndex}
                type="button"
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default BannerSlider;
