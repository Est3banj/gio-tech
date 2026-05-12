// src/components/SnowfallEffect.tsx
import React, { useEffect, useRef } from 'react';

interface SnowfallEffectProps {
  enabled?: boolean;
}

/**
 * Componente de efecto de nieve para temporada navideña
 * 
 * CONFIGURACIÓN PRINCIPAL:
 * Para activar/desactivar, usa la prop 'enabled' en el componente padre
 * Ejemplo: <SnowfallEffect enabled={true} />
 */
const SnowfallEffect: React.FC<SnowfallEffectProps> = ({ enabled = false }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!enabled) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        let animationFrameId: number;
        let snowflakes: Snowflake[] = [];

        // Configuración del canvas
        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        // Configuración de los copos de nieve
        const config = {
            count: 100,
            minSize: 2,
            maxSize: 5,
            minSpeed: 0.5,
            maxSpeed: 2,
            minOpacity: 0.3,
            maxOpacity: 0.8,
        };

        // Clase Copo de Nieve
        class Snowflake {
            x: number;
            y: number;
            size: number;
            speed: number;
            opacity: number;
            drift: number;

            constructor() {
                this.reset();
                this.y = Math.random() * canvas.height;
            }

            reset() {
                this.x = Math.random() * canvas.width;
                this.y = -10;
                this.size = Math.random() * (config.maxSize - config.minSize) + config.minSize;
                this.speed = Math.random() * (config.maxSpeed - config.minSpeed) + config.minSpeed;
                this.opacity = Math.random() * (config.maxOpacity - config.minOpacity) + config.minOpacity;
                this.drift = Math.random() * 0.5 - 0.25;
            }

            update() {
                this.y += this.speed;
                this.x += this.drift;

                if (this.y > canvas.height) {
                    this.reset();
                }

                if (this.x > canvas.width) {
                    this.x = 0;
                } else if (this.x < 0) {
                    this.x = canvas.width;
                }
            }

            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
                ctx.fill();
            }
        }

        // Inicializar copos
        const initSnowflakes = () => {
            snowflakes = [];
            for (let i = 0; i < config.count; i++) {
                snowflakes.push(new Snowflake());
            }
        };

        // Animación
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            snowflakes.forEach((snowflake) => {
                snowflake.update();
                snowflake.draw();
            });

            animationFrameId = requestAnimationFrame(animate);
        };

        // Inicializar
        resizeCanvas();
        initSnowflakes();
        animate();

        // Manejar redimensionamiento de ventana
        const handleResize = () => {
            resizeCanvas();
            initSnowflakes();
        };

        window.addEventListener('resize', handleResize);

        // Limpieza
        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationFrameId);
        };
    }, [enabled]);

    // No renderizar nada si no está habilitado
    if (!enabled) return null;

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                pointerEvents: 'none',
                zIndex: 9999,
            }}
            aria-hidden="true"
        />
    );
};

export default SnowfallEffect;
