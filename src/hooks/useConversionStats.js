import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage.js';

const STATS_KEY = 'fcp-conversion-stats';

// Local calendar date (not UTC) — "today" should mean the user's actual day,
// not roll over at UTC midnight.
function todayKey() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function emptyStats() {
  return {
    total: 0,
    filesProcessed: 0,
    byTool: {}, // { text: 4, images: 2, ... }
    byDay: {},  // { '2026-11-12': 3, ... }
  };
}

export function useConversionStats() {
  const [stats, setStats] = useLocalStorage(STATS_KEY, emptyStats());

  // fileCount lets a batch operation (e.g. resizing 5 images at once) count
  // as 1 conversion but 5 files processed — call with the real count when known.
  const recordConversion = useCallback(
    (toolId, fileCount = 1) => {
      const day = todayKey();
      setStats((prev) => ({
        total: prev.total + 1,
        filesProcessed: prev.filesProcessed + fileCount,
        byTool: { ...prev.byTool, [toolId]: (prev.byTool[toolId] || 0) + 1 },
        byDay: { ...prev.byDay, [day]: (prev.byDay[day] || 0) + 1 },
      }));
    },
    [setStats]
  );

  const resetStats = useCallback(() => setStats(emptyStats()), [setStats]);

  const todayCount = stats.byDay[todayKey()] || 0;
  const favoriteEntry = Object.entries(stats.byTool).sort((a, b) => b[1] - a[1])[0];

  return {
    stats,
    todayCount,
    favoriteTool: favoriteEntry ? favoriteEntry[0] : null,
    favoriteToolCount: favoriteEntry ? favoriteEntry[1] : 0,
    recordConversion,
    resetStats,
  };
}
