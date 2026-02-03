// src/components/SnowfallEffect.jsx
import React, { useEffect, useRef } from 'react';

/**
 * Componente de efecto de nieve para temporada navideña
 * 
 * CONFIGURACIÓN PRINCIPAL:
 * Para activar/desactivar, usa la prop 'enabled' en el componente padre
 * Ejemplo: <SnowfallEffect enabled={true} />
 */
const SnowfallEffect = ({ enabled = false }) => {
    const canvasRef = useRef(null);

    useEffect(() => {
        if (!enabled) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        let animationFrameId;
        let snowflakes = [];

        // Configuración del canvas
        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        // Configuración de los copos de nieve
        const config = {
            count: 100, // Número de copos (ajusta según necesites)
            minSize: 2,
            maxSize: 5,
            minSpeed: 0.5,
            maxSpeed: 2,
            minOpacity: 0.3,
            maxOpacity: 0.8,
        };

        // Clase Copo de Nieve
        class Snowflake {
            constructor() {
                this.reset();
                this.y = Math.random() * canvas.height; // Posición inicial aleatoria
            }

            reset() {
                this.x = Math.random() * canvas.width;
                this.y = -10;
                this.size = Math.random() * (config.maxSize - config.minSize) + config.minSize;
                this.speed = Math.random() * (config.maxSpeed - config.minSpeed) + config.minSpeed;
                this.opacity = Math.random() * (config.maxOpacity - config.minOpacity) + config.minOpacity;
                this.drift = Math.random() * 0.5 - 0.25; // Movimiento horizontal sutil
            }

            update() {
                this.y += this.speed;
                this.x += this.drift;

                // Si el copo sale de la pantalla, reiniciarlo arriba
                if (this.y > canvas.height) {
                    this.reset();
                }

                // Mantener dentro del ancho de la pantalla
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
                pointerEvents: 'none', // ¡CRÍTICO! Permite clics a través del canvas
                zIndex: 9999, // Por encima de todo
            }}
            aria-hidden="true" // Accesibilidad: ocultar para lectores de pantalla
        />
    );
};

export default SnowfallEffect;
