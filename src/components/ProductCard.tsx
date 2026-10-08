// src/components/ProductCard.tsx
// Card PRESENTACIONAL: navega siempre a /producto/:id (el wizard vive en ProductPage).
import type { FC } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useProductPricing } from "./product-card/useProductPricing";
import ProductCardView from "./product-card/ProductCardView";
import "./product-card/product-card.css";
import type { Product } from "../types";

interface ProductCardProps {
  producto: Product;
  isPopular?: boolean;
}

const ProductCard: FC<ProductCardProps> = ({ producto, isPopular = false }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // La card solo navega al detalle (sin recordProductView: la vista la registra
  // el mount de ProductPage — 1 write por vista, D7).
  // state.from deja el origen real (p.ej. /catalogo?marca=samsung) para que
  // "Volver al catálogo" del detalle use navigate(-1) y el browser restaure
  // scroll + filtros en vez de empujar /catalogo limpio.
  const abrir = () => {
    navigate(`/producto/${producto.id}`, {
      state: { from: `${location.pathname}${location.search}` },
    });
  };

  const der = useProductPricing(producto);

  return <ProductCardView producto={producto} isPopular={isPopular} der={der} onVerDetalles={abrir} />;
};

export default ProductCard;
