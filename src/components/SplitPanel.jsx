import { useRef, useState, useCallback, useEffect } from 'react';
import { useIsDesktop } from '../hooks/useIsDesktop.js';

export default function SplitPanel({ left, right, minPercent = 25, maxPercent = 75, initialPercent = 50 }) {
  const containerRef = useRef(null);
  const draggingRef = useRef(false);
  const [leftPercent, setLeftPercent] = useState(initialPercent);
  const isDesktop = useIsDesktop();

  const handlePointerMove = useCallback(
    (e) => {
      if (!draggingRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const percent = Math.min(maxPercent, Math.max(minPercent, ((e.clientX - rect.left) / rect.width) * 100));
      setLeftPercent(percent);
    },
    [minPercent, maxPercent]
  );

  const stopDragging = useCallback(() => {
    draggingRef.current = false;
    document.body.style.cursor = '';
  }, []);

  useEffect(() => {
    // No point attaching window-level listeners at all when the handle
    // isn't even rendered (mobile) — real, if minor, cleanup win.
    if (!isDesktop) return;
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', stopDragging);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', stopDragging);
    };
  }, [isDesktop, handlePointerMove, stopDragging]);

  const startDragging = () => {
    draggingRef.current = true;
    document.body.style.cursor = 'col-resize';
  };

  return (
    <div ref={containerRef} className="flex flex-col md:flex-row w-full gap-4 md:gap-0">
      <div style={isDesktop ? { width: `${leftPercent}%` } : undefined} className="min-w-0 w-full">
        {left}
      </div>

      {isDesktop && (
        <div
          onPointerDown={startDragging}
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize panels"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft') setLeftPercent((p) => Math.max(minPercent, p - 2));
            if (e.key === 'ArrowRight') setLeftPercent((p) => Math.min(maxPercent, p + 2));
          }}
          className="w-1.5 cursor-col-resize bg-neutral-200 dark:bg-neutral-800 hover:bg-accent/60 transition-colors shrink-0 mx-2 rounded-full focus:outline-none focus:ring-2 focus:ring-accent"
        />
      )}

      <div style={isDesktop ? { width: `${100 - leftPercent}%` } : undefined} className="min-w-0 w-full">
        {right}
      </div>
    </div>
  );
}
