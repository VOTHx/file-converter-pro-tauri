import { useState, useEffect } from 'react';

// Used instead of rendering both a desktop and mobile version of the same
// content and hiding one with CSS — that pattern doubles the DOM for no
// reason and loses state (cursor position, scroll) when crossing the
// breakpoint. This hook lets components render ONE version, chosen by
// actual viewport width.
export function useIsDesktop(breakpoint = '(min-width: 768px)') {
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(breakpoint).matches
  );

  useEffect(() => {
    const mql = window.matchMedia(breakpoint);
    const handler = (e) => setIsDesktop(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [breakpoint]);

  return isDesktop;
}
