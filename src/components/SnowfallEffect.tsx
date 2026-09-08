// src/components/SnowfallEffect.tsx
import React from 'react';
import SeasonalAtmosphere from './SeasonalAtmosphere';

interface SnowfallEffectProps {
  enabled?: boolean;
}

/**
 * Componente de efecto visual atmosférico para temporadas (Amor y Amistad, Navidad, Halloween).
 * Se integra automáticamente con la configuración activa del ThemeProvider.
 */
const SnowfallEffect: React.FC<SnowfallEffectProps> = ({ enabled = true }) => {
  return <SeasonalAtmosphere enabled={enabled} />;
};

export default SnowfallEffect;

