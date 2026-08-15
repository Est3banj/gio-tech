// src/components/product-card/useProductPricing.ts
import { formatPrice } from "../../utils/formatters";
import {
  calcularCuotaInicial,
  debeMostrarNuevoBadge,
  debeMostrarPrecioPromo,
  debeMostrarPromoBadge,
  esVentanaPromo,
  hasValidPromoPrice,
  resolveBadgeBg,
  resolveHighlightColor,
} from "../../utils/promo";
import { getFinancierasForProduct } from "../../data/financieras";
import type { Financiera, Product } from "../../types";

export interface DerivadosPricing {
  nombre: string;
  descripcion: string;
  imagen: string;
  contado: number | null | undefined;
  showPromoPrice: boolean;
  showPromoBadge: boolean;
  showNuevoBadge: boolean;
  priceRegularStr: string;
  pricePromoStr: string;
  badgeBg: string;
  highlightColor: string;
  promoBadgeText?: string | null;
  promoBadgeBg?: string | null;
  nuevoBadgeText?: string | null;
  nuevoBadgeBg?: string | null;
  cuotaInicialStr: string;
  cuotaInicial: number;
  solo12Meses: boolean;
  cuotas12: number | null | undefined;
  cuotas12Str: string;
  cuotas6Str: string;
  cuotas8Str: string;
  financierasDisponibles: Financiera[];
}

export function useProductPricing(producto: Product): DerivadosPricing {
  const {
    nombre = "Producto sin nombre",
    descripcion = "",
    contado,
    cuotas6,
    cuotas8,
    imagen,
    promoPrice,
    promoBadgeBg,
    promoBadgeText,
    promoHighlight,
    nuevo,
    nuevoBadgeText,
    nuevoBadgeBg,
    badgeMode,
    solo12Meses,
    cuotas12,
  } = producto || {};

  const productAny = producto as unknown as Record<string, unknown>;
  const promoStart = productAny.promoStart;
  const promoEnd = productAny.promoEnd;

  const effectivePromoActive = producto?.promo;

  const inWindow = esVentanaPromo(promoStart, promoEnd, Date.now());
  const promoPriceValido = hasValidPromoPrice(promoPrice, contado);

  const showPromoPrice = debeMostrarPrecioPromo(promoPriceValido, inWindow, effectivePromoActive);
  const showPromoBadge = debeMostrarPromoBadge(badgeMode, effectivePromoActive, inWindow);
  const showNuevoBadge = debeMostrarNuevoBadge(badgeMode, nuevo);

  const priceRegularStr = formatPrice(contado);
  const pricePromoStr = formatPrice(promoPrice);

  const badgeBg = resolveBadgeBg(promoBadgeBg);
  const highlightColor = resolveHighlightColor(promoHighlight);

  const cuotaInicial = calcularCuotaInicial(producto?.cuotaInicial);
  const cuotaInicialStr = cuotaInicial > 0 ? formatPrice(cuotaInicial) : '';

  const solo12 = !!solo12Meses;
  const cuotas12Str = solo12 && cuotas12 ? formatPrice(cuotas12) : '';
  const cuotas6Str = formatPrice(cuotas6);
  const cuotas8Str = formatPrice(cuotas8);

  const financierasDisponibles = getFinancierasForProduct(producto.marca, producto.categoria, producto.nombre);

  return {
    nombre,
    descripcion,
    imagen,
    contado,
    showPromoPrice,
    showPromoBadge,
    showNuevoBadge,
    priceRegularStr,
    pricePromoStr,
    badgeBg,
    highlightColor,
    promoBadgeText,
    promoBadgeBg,
    nuevoBadgeText,
    nuevoBadgeBg,
    cuotaInicialStr,
    cuotaInicial,
    solo12Meses: solo12,
    cuotas12,
    cuotas12Str,
    cuotas6Str,
    cuotas8Str,
    financierasDisponibles,
  };
}