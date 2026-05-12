// src/components/OptimizedImage.tsx
import React, { useState } from 'react';

interface OptimizedImageProps {
  src?: string;
  alt?: string;
  className?: string;
  width?: number | string;
  height?: number | string;
  placeholder?: string;
  style?: React.CSSProperties;
  [key: string]: unknown;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className,
  width,
  height,
  placeholder = 'https://via.placeholder.com/400x400?text=Sin+imagen',
  style,
  ...props
}) => {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const handleError = () => {
    setError(true);
  };

  const handleLoad = () => {
    setLoaded(true);
  };

  const finalSrc = error || !src ? placeholder : src;

  const baseStyle: React.CSSProperties = {
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
};

export default OptimizedImage;
