import React, { useEffect, useRef, useState } from "react";

interface RevealProps {
  children: React.ReactNode;
  /** Delay in ms for staggered entrances */
  delay?: number;
  className?: string;
  /** HTML tag to render */
  as?: "div" | "section" | "article" | "li" | "span";
}

/**
 * Scroll-reveal wrapper. Fades + slides content in the first time it enters
 * the viewport. Respects prefers-reduced-motion (renders visible, no motion).
 *
 * Design-only: it has no business logic — pure presentation.
 */
const Reveal: React.FC<RevealProps> = ({ children, delay = 0, className = "", as = "div" }) => {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Reduced motion: show immediately, no animation.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true);
      return;
    }

    if (!("IntersectionObserver" in window)) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -48px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const Tag = as as React.ElementType;

  return (
    <Tag
      ref={ref as React.Ref<any>}
      className={`reveal ${visible ? "reveal--visible" : ""} ${className}`.trim()}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
};

export default Reveal;
