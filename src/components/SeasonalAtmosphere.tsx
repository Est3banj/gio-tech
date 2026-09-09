import React, { useEffect, useRef } from 'react';
import { useConfig } from '../hooks/useConfig';

interface SeasonalAtmosphereProps {
  enabled?: boolean;
}

export const SeasonalAtmosphere: React.FC<SeasonalAtmosphereProps> = ({ enabled = true }) => {
  const { config } = useConfig();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const isThemeActive = Boolean(config?.theme?.enabled);
  const themeVars = config?.theme?.vars || {};
  const currentThemeName = (
    themeVars['--theme-name'] ||
    (config?.theme as { name?: string })?.name ||
    'standard'
  ).toLowerCase();

  const isStandard = currentThemeName === 'standard';
  const isValentine = isThemeActive && !isStandard && currentThemeName === 'valentine';
  const isChristmas = isThemeActive && !isStandard && currentThemeName === 'christmas';
  const isHalloween = isThemeActive && !isStandard && currentThemeName === 'halloween';
  const isBlackFriday = isThemeActive && !isStandard && currentThemeName === 'blackfriday';

  const shouldRender = enabled && isThemeActive && !isStandard && (isValentine || isChristmas || isHalloween || isBlackFriday);

  useEffect(() => {
    if (!shouldRender) return;

    const canvas = canvasRef.current;
    if (!canvas || typeof canvas.getContext !== 'function') return;

    let ctx: CanvasRenderingContext2D | null = null;
    try {
      ctx = canvas.getContext('2d');
    } catch {
      return;
    }
    if (!ctx) return;

    let animId: number;
    let isVisible = typeof document !== 'undefined' ? !document.hidden : true;

    const handleVisibilityChange = () => {
      isVisible = !document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const isReducedMotion = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (isReducedMotion) {
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }

    const resize = () => {
      if (typeof window === 'undefined') return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const count = isMobile ? 14 : 28;

    interface Particle {
      x: number;
      y: number;
      size: number;
      speedY: number;
      speedX: number;
      opacity: number;
      opacitySpeed: number;
      color: string;
      type: 'heart' | 'sparkle' | 'circle';
      rotation: number;
      rotationSpeed: number;
      swayOffset: number;
      swaySpeed: number;
    }

    const valentineColors = [
      '#f43f5e',
      '#ec4899',
      '#fb7185',
      '#f472b6',
      '#fda4af',
      '#ffffff',
    ];

    const christmasColors = [
      '#22c55e',
      '#ef4444',
      '#fbbf24',
      '#ffffff',
    ];

    const halloweenColors = [
      '#f97316',
      '#a855f7',
      '#fbbf24',
      '#cbd5e1',
    ];

    const blackFridayColors = [
      '#ffd700',
      '#f59e0b',
      '#fbbf24',
      '#ffffff',
    ];

    const colors = isValentine
      ? valentineColors
      : isChristmas
      ? christmasColors
      : isHalloween
      ? halloweenColors
      : blackFridayColors;

    const particles: Particle[] = [];

    const createParticle = (initialRandomY = false): Particle => {
      const typeChoice: 'heart' | 'sparkle' | 'circle' = isValentine
        ? (Math.random() < 0.65 ? 'heart' : 'sparkle')
        : isChristmas
        ? (Math.random() < 0.7 ? 'circle' : 'sparkle')
        : isHalloween
        ? (Math.random() < 0.6 ? 'sparkle' : 'circle')
        : (Math.random() < 0.7 ? 'sparkle' : 'circle');

      const size = typeChoice === 'heart'
        ? Math.random() * 8 + 8
        : typeChoice === 'sparkle'
        ? Math.random() * 6 + 6
        : Math.random() * 4 + 2;

      return {
        x: Math.random() * (canvas.width || 800),
        y: initialRandomY ? Math.random() * (canvas.height || 600) : (isValentine ? (canvas.height || 600) + 20 : -20),
        size,
        speedY: isValentine ? -(Math.random() * 0.45 + 0.35) : (Math.random() * 0.5 + 0.4),
        speedX: (Math.random() - 0.5) * 0.3,
        opacity: Math.random() * 0.35 + 0.2,
        opacitySpeed: (Math.random() * 0.006 + 0.003) * (Math.random() < 0.5 ? 1 : -1),
        color: colors[Math.floor(Math.random() * colors.length)],
        type: typeChoice,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.02,
        swayOffset: Math.random() * Math.PI * 2,
        swaySpeed: Math.random() * 0.015 + 0.008,
      };
    };

    for (let i = 0; i < count; i++) {
      particles.push(createParticle(true));
    }

    const drawHeart = (x: number, y: number, size: number, color: string, alpha: number, rot: number) => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
      ctx.fillStyle = color;
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.beginPath();
      const w = size;
      const h = size;
      ctx.moveTo(0, -h * 0.2);
      ctx.bezierCurveTo(-w * 0.5, -h * 0.7, -w * 0.8, 0, 0, h * 0.6);
      ctx.bezierCurveTo(w * 0.8, 0, w * 0.5, -h * 0.7, 0, -h * 0.2);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    const drawSparkle = (x: number, y: number, size: number, color: string, alpha: number, rot: number) => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
      ctx.fillStyle = color;
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.beginPath();
      const s = size;
      ctx.moveTo(0, -s);
      ctx.quadraticCurveTo(0, 0, s, 0);
      ctx.quadraticCurveTo(0, 0, 0, s);
      ctx.quadraticCurveTo(0, 0, -s, 0);
      ctx.quadraticCurveTo(0, 0, 0, -s);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    const drawCircle = (x: number, y: number, size: number, color: string, alpha: number) => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    const renderLoop = () => {
      if (!isVisible) {
        animId = requestAnimationFrame(renderLoop);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p, idx) => {
        p.y += p.speedY;
        p.swayOffset += p.swaySpeed;
        p.x += Math.sin(p.swayOffset) * 0.6 + p.speedX;
        p.rotation += p.rotationSpeed;
        p.opacity += p.opacitySpeed;

        if (p.opacity > 0.65 || p.opacity < 0.15) {
          p.opacitySpeed = -p.opacitySpeed;
        }

        if (isValentine && p.y < -30) {
          particles[idx] = createParticle(false);
        } else if (!isValentine && p.y > canvas.height + 30) {
          particles[idx] = createParticle(false);
          particles[idx].y = -20;
        }

        if (p.x < -30) p.x = canvas.width + 20;
        if (p.x > canvas.width + 30) p.x = -20;

        if (p.type === 'heart') {
          drawHeart(p.x, p.y, p.size, p.color, p.opacity, p.rotation);
        } else if (p.type === 'sparkle') {
          drawSparkle(p.x, p.y, p.size, p.color, p.opacity, p.rotation);
        } else {
          drawCircle(p.x, p.y, p.size, p.color, p.opacity);
        }
      });

      animId = requestAnimationFrame(renderLoop);
    };

    renderLoop();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [shouldRender, isValentine, isChristmas, isHalloween, isBlackFriday]);

  if (!shouldRender) return null;

  return (
    <>
      <div className="season-particles" aria-hidden="true" />
      <canvas
        ref={canvasRef}
        className="seasonal-atmosphere-canvas"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          pointerEvents: 'none',
          zIndex: 8,
        }}
        aria-hidden="true"
      />
    </>
  );
};

export default SeasonalAtmosphere;
