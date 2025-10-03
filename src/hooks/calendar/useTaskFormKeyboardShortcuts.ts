import { useEffect } from 'react';

export interface UseTaskFormKeyboardShortcutsOptions {
  enabled: boolean;
  onSubmit: () => void;
  onClose: () => void;
}

/**
 * Hook to handle keyboard shortcuts for task forms
 * - Cmd/Ctrl + Enter: Submit form
 * - Cmd/Ctrl + Backspace: Close form
 */
export function useTaskFormKeyboardShortcuts({
  enabled,
  onSubmit,
  onClose
}: UseTaskFormKeyboardShortcutsOptions) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + Enter to submit
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        onSubmit();
      }

      // Cmd/Ctrl + Backspace to close
      if ((e.metaKey || e.ctrlKey) && e.key === 'Backspace') {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'TEXTAREA') {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, onSubmit, onClose]);
}
