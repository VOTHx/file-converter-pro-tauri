import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage.js';

const FAVORITES_KEY = 'fcp-favorite-tools';

export function useFavorites() {
  const [favorites, setFavorites] = useLocalStorage(FAVORITES_KEY, []);

  const isFavorite = useCallback((toolId) => favorites.includes(toolId), [favorites]);

  const toggleFavorite = useCallback(
    (toolId) => {
      setFavorites((prev) =>
        prev.includes(toolId) ? prev.filter((id) => id !== toolId) : [...prev, toolId]
      );
    },
    [setFavorites]
  );

  return { favorites, isFavorite, toggleFavorite };
}
