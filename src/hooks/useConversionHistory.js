import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage.js';

const HISTORY_KEY = 'fcp-conversion-history';
const MAX_ENTRIES = 100;

export function useConversionHistory() {
  const [history, setHistory] = useLocalStorage(HISTORY_KEY, []);

  // detail is optional extra context (e.g. "Text → JSON") shown alongside the tool name.
  const addEntry = useCallback(
    (toolId, detail) => {
      setHistory((prev) => {
        const entry = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          toolId,
          detail: detail || null,
          timestamp: Date.now(),
        };
        return [entry, ...prev].slice(0, MAX_ENTRIES);
      });
    },
    [setHistory]
  );

  const deleteEntry = useCallback(
    (id) => {
      setHistory((prev) => prev.filter((e) => e.id !== id));
    },
    [setHistory]
  );

  const clearHistory = useCallback(() => setHistory([]), [setHistory]);

  return { history, addEntry, deleteEntry, clearHistory, maxEntries: MAX_ENTRIES };
}
