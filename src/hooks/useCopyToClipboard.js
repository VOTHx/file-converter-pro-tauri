import { useCallback } from 'react';
import { useToast } from './useToast.jsx';

export function useCopyToClipboard() {
  const { showToast } = useToast();

  return useCallback(
    async (text, successMessage = 'Copied to clipboard') => {
      if (!text) return;
      try {
        await navigator.clipboard.writeText(text);
        showToast(successMessage);
      } catch (err) {
        showToast('Copy failed: ' + err, 'error');
      }
    },
    [showToast]
  );
}
