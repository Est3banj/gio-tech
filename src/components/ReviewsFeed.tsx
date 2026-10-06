import { useEffect, useRef, useState } from "react";
import Reveal from "./Reveal";

export interface FeedReview {
  id: string;
  name: string;
  rating: number;
  text: string;
  location: string;
  avatar: string;
  url?: string;
}

const ROTATION_MS = 3800;
const SWAP_OUT_MS = 260;
const ENTER_ANIM_MS = 400;

/** G de Google en sus 4 colores — identifica que la reseña viene de ahí. */
function GoogleGIcon() {
  return (
    <svg viewBox="0 0 48 48" width="18" height="18" focusable="false">
      <path
        fill="#4285F4"
        d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"
      />
      <path
        fill="#34A853"
        d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"
      />
      <path
        fill="#FBBC05"
        d="M11.69 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24s.85 6.91 2.34 9.88l7.35-5.7z"
      />
      <path
        fill="#EA4335"
        d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"
      />
    </svg>
  );
}

/** Cuántos slots entran en la grilla según el breakpoint (mismo CSS: 1/2/3/4). */
function slotsForWidth(): number {
  if (typeof window === "undefined") return 4;
  if (window.matchMedia("(min-width: 1200px)").matches) return 4;
  if (window.matchMedia("(min-width: 992px)").matches) return 3;
  if (window.matchMedia("(min-width: 640px)").matches) return 2;
  return 1;
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

interface ReviewsFeedProps {
  reviews: FeedReview[];
}

/**
 * Feed rotativo de opiniones: hasta 4 tarjetas a la vez según breakpoint,
 * con pool de hasta 10. Cada ciclo UNA sale con fade y OTRA entra — nunca
 * todas de totaso. Pausa fuera de pantalla y respeta prefers-reduced-motion
 * (queda estático, sin intervalo).
 */
function ReviewsFeed({ reviews }: ReviewsFeedProps) {
  const n = reviews.length;
  const [visibleCount, setVisibleCount] = useState(slotsForWidth);
  const reduced = usePrefersReducedMotion();
  const [slots, setSlots] = useState<number[]>([]);
  const [leavingSlot, setLeavingSlot] = useState<number | null>(null);
  const [enteringSlot, setEnteringSlot] = useState<number | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const inViewRef = useRef(false);
  const leavingRef = useRef(false);
  const tickRef = useRef(0);
  const swapTimeoutRef = useRef<number | null>(null);
  const enterTimeoutRef = useRef<number | null>(null);

  // Re-evalúa slots al pasar de breakpoint
  useEffect(() => {
    const update = () => setVisibleCount(slotsForWidth());
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Estado base: primeros K índices del pool
  useEffect(() => {
    setSlots(Array.from({ length: Math.min(visibleCount, n) }, (_, i) => i));
    setLeavingSlot(null);
    setEnteringSlot(null);
  }, [n, visibleCount]);

  // Pausa cuando la sección no está en pantalla
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const io = new IntersectionObserver(
      (entries) => {
        inViewRef.current = entries.some((e) => e.isIntersecting);
      },
      { threshold: 0.15 }
    );
    io.observe(root);
    return () => io.disconnect();
  }, []);

  // Limpieza de timers si el componente se desmonta
  useEffect(() => {
    return () => {
      if (swapTimeoutRef.current !== null) window.clearTimeout(swapTimeoutRef.current);
      if (enterTimeoutRef.current !== null) window.clearTimeout(enterTimeoutRef.current);
    };
  }, []);

  // Rotación: de a un slot por ciclo
  useEffect(() => {
    if (reduced || n === 0 || n <= visibleCount) return;

    const timer = window.setInterval(() => {
      if (leavingRef.current) return;
      if (document.hidden || !inViewRef.current) return;

      const slot = tickRef.current % visibleCount;
      tickRef.current += 1;
      leavingRef.current = true;
      setLeavingSlot(slot);

      swapTimeoutRef.current = window.setTimeout(() => {
        setSlots((prev) => {
          if (prev.length === 0) return prev;
          const occupied = new Set(prev);
          let next = (prev[slot] + 1) % n;
          while (occupied.has(next)) next = (next + 1) % n;
          const copy = [...prev];
          copy[slot] = next;
          return copy;
        });
        setLeavingSlot(null);
        setEnteringSlot(slot);
        leavingRef.current = false;
        swapTimeoutRef.current = null;

        // La animación de entrada es solo del slot que entró (sin blink global)
        enterTimeoutRef.current = window.setTimeout(() => {
          setEnteringSlot(null);
          enterTimeoutRef.current = null;
        }, ENTER_ANIM_MS);
      }, SWAP_OUT_MS);
    }, ROTATION_MS);

    return () => {
      window.clearInterval(timer);
      if (swapTimeoutRef.current !== null) {
        window.clearTimeout(swapTimeoutRef.current);
        swapTimeoutRef.current = null;
      }
      if (enterTimeoutRef.current !== null) {
        window.clearTimeout(enterTimeoutRef.current);
        enterTimeoutRef.current = null;
      }
      leavingRef.current = false;
    };
  }, [reduced, n, visibleCount]);

  if (n === 0) return null;

  return (
    <div className="reviews-grid reviews-grid--feed" ref={rootRef} aria-live="off">
      {slots.map((poolIdx, i) => {
        const review = reviews[poolIdx];
        if (!review) return null;
        const stateClass =
          (leavingSlot === i ? " is-leaving" : "") +
          (enteringSlot === i ? " is-entering" : "");
        return (
          <Reveal key={i} delay={i * 70}>
            <div className={`review-slot${stateClass}`}>
              <article className="review-card" key={review.id}>
                <div className="review-topline">
                  <div
                    className="review-stars"
                    aria-label={`${review.rating} de 5 estrellas`}
                  >
                    {Array.from({ length: review.rating }).map((_, s) => (
                      <i key={s} className="bi bi-star-fill" aria-hidden="true" />
                    ))}
                  </div>
                  <span className="review-source" role="img" aria-label="Reseña de Google">
                    <GoogleGIcon />
                  </span>
                </div>
                <p className="review-text">"{review.text}"</p>
                <div className="review-author">
                  {review.url ? (
                    <a
                      className="review-avatar-link"
                      href={review.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Perfil en Google de ${review.name}`}
                    >
                      <span className="review-avatar" aria-hidden="true">
                        {review.avatar}
                      </span>
                    </a>
                  ) : (
                    <span className="review-avatar" aria-hidden="true">
                      {review.avatar}
                    </span>
                  )}
                  <div className="review-info">
                    {review.url ? (
                      <a
                        className="review-name review-name--link"
                        href={review.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {review.name}
                      </a>
                    ) : (
                      <strong className="review-name">{review.name}</strong>
                    )}
                    <span className="review-location">{review.location}</span>
                  </div>
                </div>
              </article>
            </div>
          </Reveal>
        );
      })}
    </div>
  );
}

export default ReviewsFeed;
