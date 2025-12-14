'use client';

import { useEffect, useCallback } from 'react';

interface ShortcutHandlers {
  onEnhance?: () => void;
  onDownload?: () => void;
  onNextPhoto?: () => void;
  onPrevPhoto?: () => void;
  onAccept?: () => void;
  onDiscard?: () => void;
  onUndo?: () => void;
  onToggleFineTune?: () => void;
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers, enabled = true) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
    
    const key = e.key.toLowerCase();
    const ctrl = e.ctrlKey || e.metaKey;
    
    switch (true) {
      case key === 'e' && !ctrl:
        e.preventDefault();
        handlers.onEnhance?.();
        break;
      case key === 'd' && !ctrl:
        e.preventDefault();
        handlers.onDownload?.();
        break;
      case key === 'arrowright':
        e.preventDefault();
        handlers.onNextPhoto?.();
        break;
      case key === 'arrowleft':
        e.preventDefault();
        handlers.onPrevPhoto?.();
        break;
      case key === 'enter':
        e.preventDefault();
        handlers.onAccept?.();
        break;
      case key === 'escape':
        e.preventDefault();
        handlers.onDiscard?.();
        break;
      case key === 'z' && ctrl:
        e.preventDefault();
        handlers.onUndo?.();
        break;
      case key === 'f' && !ctrl:
        e.preventDefault();
        handlers.onToggleFineTune?.();
        break;
    }
  }, [handlers]);

  useEffect(() => {
    if (!enabled) return;
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown, enabled]);
}
