import { useState, useEffect } from 'react';
import { getPopularProductsStats } from '../services/productStats.service';
import { useProducts } from '../hooks/useProducts';
import type { Product } from '../types';

interface UsePopularProductsReturn {
  popularIds: string[];
  isLoading: boolean;
}

/**
 * Hook para obtener los productos más vistos.
 */
export function usePopularProducts(): UsePopularProductsReturn {
  const [popularIds, setPopularIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { products } = useProducts() as { products: Product[] | null };

  useEffect(() => {
    const fetchPopular = async () => {
      try {
        const stats = await getPopularProductsStats(4);
        
        // Los IDs pueden venir como id (document ID) o productoId
        const ids = stats
          .filter(s => s.vistas > 0)
          .map(s => s.productoId || s.id);
        
        // Verificar qué IDs hacen match con los productos disponibles
        const matchingIds = ids.filter(id => products?.some(p => p.id === id));
        
        setPopularIds(matchingIds.length > 0 ? matchingIds : ids);
      } catch (error) {
        console.error('Error fetching popular products:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Solo ejecutar cuando products esté listo
    if (products && products.length > 0) {
      fetchPopular();
    } else {
      setIsLoading(false);
    }
  }, [products]);

  return { popularIds, isLoading };
}
