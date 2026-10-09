// src/components/HalloweenDecor.test.tsx
// Decor Halloween v2: anclada a secciones (header/hero/footer) + CSS puro
// para cards/ficha. Sin capa fixed del viewport.
import { describe, it, expect, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  HalloweenHeaderDecor,
  HalloweenHeroDecor,
  HalloweenFooterDecor,
} from './HalloweenDecor';

const readSrc = (rel: string) => readFileSync(resolve(__dirname, rel), 'utf8');

afterEach(() => {
  document.documentElement.removeAttribute('data-theme-name');
});

describe('componentes de decor por seccion', () => {
  it('HeaderDecor: wrapper aria-hidden + pointer-events none, con telaraña y 2 murciélagos', () => {
    const { container } = render(<HalloweenHeaderDecor />);
    const wrap = container.querySelector('.hd-decor.hd-header-decor');
    expect(wrap).not.toBeNull();
    expect(wrap!.getAttribute('aria-hidden')).toBe('true');
    expect(wrap!.getAttribute('style')).toContain('pointer-events: none');
    expect(wrap!.querySelectorAll('.hd-h-web svg').length).toBe(1);
    expect(wrap!.querySelectorAll('.hd-h-bat svg').length).toBe(2);
  });

  it('HeroDecor: 3 murciélagos + 2 calabazas con cara ámbar, dentro del wrapper', () => {
    const { container } = render(<HalloweenHeroDecor />);
    const wrap = container.querySelector('.hd-decor.hd-hero-decor');
    expect(wrap).not.toBeNull();
    expect(wrap!.getAttribute('aria-hidden')).toBe('true');
    expect(wrap!.querySelectorAll('.hd-hero-bat').length).toBe(3);
    expect(wrap!.querySelectorAll('.hd-hero-pumpkin').length).toBe(2);
    expect(wrap!.querySelectorAll('.hd-face').length).toBe(2);
    const pieces = wrap!.querySelectorAll('.hd-piece');
    expect(pieces.length).toBe(5);
    pieces.forEach((p) => expect(p.parentElement).toBe(wrap));
  });

  it('FooterDecor: 1 araña en hilo, aria-hidden + pointer-events none', () => {
    const { container } = render(<HalloweenFooterDecor />);
    const wrap = container.querySelector('.hd-decor.hd-footer-decor');
    expect(wrap).not.toBeNull();
    expect(wrap!.getAttribute('aria-hidden')).toBe('true');
    expect(wrap!.querySelectorAll('.hd-footer-spider svg').length).toBe(1);
  });

  it('sin assets raster/externos: solo SVG inline propio', () => {
    const { container } = render(
      <>
        <HalloweenHeaderDecor />
        <HalloweenHeroDecor />
        <HalloweenFooterDecor />
      </>
    );
    expect(container.querySelectorAll('img, image, script, link').length).toBe(0);
    expect(container.innerHTML).not.toMatch(/xlink:href|src\s*=/);
  });

  it('NO existe la capa fixed vieja: sin .hd-layer, .hd-vignette ni componente default', () => {
    const comp = readSrc('./HalloweenDecor.tsx');
    expect(comp).not.toContain('hd-layer');
    expect(comp).not.toContain('hd-vignette');
    expect(comp).not.toContain('DeadBranch');
    expect(comp).not.toContain('export default');
  });
});

describe('montaje en las secciones', () => {
  it('Header monta HalloweenHeaderDecor', () => {
    expect(readSrc('./Header.tsx')).toContain('<HalloweenHeaderDecor />');
  });

  it('LandingPage monta HalloweenHeroDecor dentro del .editorial-hero', () => {
    const src = readSrc('./LandingPage.tsx');
    expect(src).toContain('<HalloweenHeroDecor />');
    const heroIdx = src.indexOf('className="editorial-hero"');
    expect(src.indexOf('<HalloweenHeroDecor />')).toBeGreaterThan(heroIdx);
    expect(src.indexOf('<HalloweenHeroDecor />')).toBeLessThan(
      src.indexOf('className="landing-container"')
    );
  });

  it('Footer monta HalloweenFooterDecor', () => {
    expect(readSrc('./Footer.tsx')).toContain('<HalloweenFooterDecor />');
  });

  it('SeasonalAtmosphere YA NO monta la capa vieja', () => {
    const src = readSrc('./SeasonalAtmosphere.tsx');
    expect(src).not.toContain('HalloweenDecor');
    expect(src).not.toContain('hd-layer');
  });
});

describe('gateo CSS (100% por data-theme-name, sin JS gate)', () => {
  const css = readSrc('../styles/seasonal-decorations.css');

  it('regla defensiva: sin data-theme-name="halloween" → display:none en todos los .hd-decor', () => {
    expect(css).toMatch(
      /html:not\(\[data-theme-name="halloween"\]\)\s+\.hd-decor\s*\{[^}]*display:\s*none/
    );
  });

  it('todos los selectores .hd- van scopeados bajo halloween (o html:not)', () => {
    const lines = css.split('\n');
    let inBlock = false;
    const unscoped: string[] = [];
    lines.forEach((line, i) => {
      if (/^[^@}\s][^{]*\{/.test(line) && line.includes('.hd-')) {
        inBlock = true;
        if (!line.includes('data-theme-name="halloween"') && !line.includes('html:not(')) {
          unscoped.push(`${i + 1}: ${line.trim()}`);
        }
      }
      if (inBlock && line.includes('}')) inBlock = false;
    });
    expect(unscoped).toEqual([]);
  });

  it('sin residuos de la capa vieja: ni hd-layer ni hd-vignette en el CSS', () => {
    expect(css).not.toContain('hd-layer');
    expect(css).not.toContain('hd-vignette');
  });

  it('hero decor clippeado al hero y DETRÁS del texto (wrapper z0, content z1)', () => {
    expect(css).toMatch(/\.hd-hero-decor\s*\{[^}]*inset:\s*0/);
    expect(css).toMatch(/\.hd-hero-decor\s*\{[^}]*z-index:\s*0/);
    expect(css).toMatch(
      /html\[data-theme-name="halloween"\]\s+\.editorial-hero\s+\.landing-container\s*\{[^}]*z-index:\s*1/
    );
    expect(css).toMatch(/\.hd-decor\s*\{[^}]*overflow:\s*hidden/);
  });

  it('cards: micro-detalle SOLO en hover SOLO punta fina (opacity 0 por defecto)', () => {
    expect(css).toMatch(
      /@media \(hover: hover\) and \(pointer: fine\)/
    );
    const hoverMedia = css.slice(css.indexOf('@media (hover: hover) and (pointer: fine)'));
    const mediaBlock = hoverMedia.slice(0, hoverMedia.indexOf('/* ─── FICHA'));
    expect(mediaBlock).toContain('html[data-theme-name="halloween"]');
    expect(mediaBlock).toContain('.product-image-stage::after');
    expect(mediaBlock).toMatch(/opacity:\s*0;/);
    expect(mediaBlock).toMatch(
      /\.product-card:hover \.product-image-stage::after[^{]*\{[^}]*opacity:\s*0\.5/
    );
    expect(mediaBlock).toContain('pointer-events: none');
  });

  it('ficha: telarañita en el stage, máx 60×60, opacidad baja, scopeada a la ficha', () => {
    const fichaRule = css.slice(
      css.indexOf('html[data-theme-name="halloween"] .product-main .product-gallery-viewport::after')
    );
    const block = fichaRule.slice(0, fichaRule.indexOf('/* ─── Keyframes'));
    expect(block).toContain('width: 60px');
    expect(block).toContain('height: 60px');
    expect(block).toMatch(/opacity:\s*0\.38/);
    expect(block).toContain('pointer-events: none');
  });

  it('header decor NO usa overflow en el header completo (solo en el wrapper)', () => {
    expect(css).not.toMatch(
      /html\[data-theme-name="halloween"\]\s+\.gio-header\s*\{[^}]*overflow/
    );
  });

  it('desactiva animaciones bajo prefers-reduced-motion', () => {
    const rmIdx = css.indexOf('@media (prefers-reduced-motion: reduce)', css.indexOf('hdGlow'));
    const rmBlock = css.slice(rmIdx, css.indexOf('@media (max-width: 768px)', rmIdx));
    expect(rmBlock).toContain('.hd-decor .hd-piece');
    expect(rmBlock).toContain('animation: none');
  });
});
