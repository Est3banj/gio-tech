import { useState, useEffect } from 'react';
import { getPopularProductsStats } from '../services/productStats.service';

/**
 * Hook para obtener los productos más vistos.
 * @returns {object} - { popularIds: string[], isLoading: boolean }
 */
export function usePopularProducts() {
  const [popularIds, setPopularIds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPopular = async () => {
      try {
        const stats = await getPopularProductsStats(4);
        const ids = stats
          .filter(s => s.vistas > 0)
          .map(s => s.productoId || s.id); //兼容两种ID方式
        setPopularIds(ids);
      } catch (error) {
        console.error('Error fetching popular products:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPopular();
  }, []);

  return { popularIds, isLoading };
}
