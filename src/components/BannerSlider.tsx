import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import type { Banner } from '../types';

const AUTOPLAY_DURATION = 5000;

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

/* ── Component ──────────────────────────────────────────── */

const BannerSlider = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'carrusel'),
      (snapshot) => {
        const data = snapshot.docs
          .map((doc) => {
            const d = doc.data();
            return {
              id: doc.id,
              imageUrl: d.url_imagen || '',
              image: d.url_imagen || '',
              title: d.titulo || '',
              description: d.descripcion || '',
              link: d.enlace || '',
              order: d.orden || 0,
              isActive: d.activo === true,
            } as Banner;
          })
          .filter((b) => b.isActive)
          .sort((a, b) => a.order - b.order);

        setBanners(data);
        setCurrentIndex(0);
      },
      (error) => {
        console.error('Error al cargar banners:', error);
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (banners.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, AUTOPLAY_DURATION);
    return () => clearInterval(interval);
  }, [banners.length]);

  if (banners.length === 0) return null;

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  const currentBanner = banners[currentIndex];

  return (
    <div className="banner-slider">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.55, ease: [0.25, 0.1, 0.25, 1] }}
          className="banner-slide"
        >
          <img
            src={currentBanner.image || currentBanner.imageUrl}
            alt={currentBanner.title || 'Banner'}
            className="banner-slide-img"
          />

          {/* Overlay + animated text */}
          {(currentBanner.title || currentBanner.description) && (
            <div className="banner-overlay">
              <div className="banner-content">
                {currentBanner.title && (
                  <motion.h2
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
                  </motion.h2>
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
          >
            <i className="bi bi-chevron-left" />
          </button>
          <button
            onClick={goToNext}
            className="banner-nav-btn banner-nav-btn--right"
            aria-label="Siguiente"
          >
            <i className="bi bi-chevron-right" />
          </button>

          <div className="banner-dots">
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
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default BannerSlider;
