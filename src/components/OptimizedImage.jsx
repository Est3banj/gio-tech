import React from 'react';

/**
 * Componente de imagen optimizado para cargar de forma diferida.
 * - lazy loading nativo
 * - decoding async
 * - placeholder en caso de error
 * - dimensions opcionales para evitar CLS
 */
export default function OptimizedImage({
  src,
  alt,
  className,
  width,
  height,
  placeholder = 'https://via.placeholder.com/400x400?text=Sin+imagen',
  style,
  ...props
}) {
  const [error, setError] = React.useState(false);
  const [loaded, setLoaded] = React.useState(false);

  const handleError = () => {
    setError(true);
  };

  const handleLoad = () => {
    setLoaded(true);
  };

  const finalSrc = error || !src ? placeholder : src;

  // Estilos base sin overrides que puedan romper el layout
  const baseStyle = {
    ...style,
    opacity: loaded ? 1 : 0,
    transition: 'opacity 0.3s ease-in-out',
  };

  return (
    <img
      src={finalSrc}
      alt={alt || 'Imagen'}
      className={className}
      width={width}
      height={height}
      loading="lazy"
      decoding="async"
      onError={handleError}
      onLoad={handleLoad}
      style={baseStyle}
      {...props}
    />
  );
}
