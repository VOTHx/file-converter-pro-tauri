import { useState, useCallback } from 'react';

// Generic, reusable local-persisted state. Not specific to stats — any
// feature that needs a value to survive app restarts can use this.
export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored !== null ? JSON.parse(stored) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setAndStore = useCallback(
    (next) => {
      setValue((prev) => {
        const resolved = typeof next === 'function' ? next(prev) : next;
        try {
          localStorage.setItem(key, JSON.stringify(resolved));
        } catch {
          // Storage can fail (quota, private/locked-down profile) — state
          // still updates in memory for this session even if it won't persist.
        }
        return resolved;
      });
    },
    [key]
  );

  return [value, setAndStore];
}
