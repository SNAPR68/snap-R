'use client';

import { useState } from 'react';
import { Keyboard, X } from 'lucide-react';

const shortcuts = [
  { key: 'E', description: 'Enhance selected photo' },
  { key: 'D', description: 'Download selected photo' },
  { key: '←', description: 'Previous photo' },
  { key: '→', description: 'Next photo' },
  { key: 'Enter', description: 'Accept enhancement' },
  { key: 'Esc', description: 'Discard enhancement' },
  { key: '⌘Z', description: 'Undo last action' },
  { key: 'F', description: 'Toggle fine-tune panel' },
];

export function ShortcutsHelp() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 left-4 z-40 flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs text-white/40 hover:text-white/60 transition-colors"
      >
        <Keyboard className="w-4 h-4" />
        <span className="hidden sm:inline">Shortcuts</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setIsOpen(false)}>
          <div className="bg-[#1A1A1A] rounded-2xl p-6 w-full max-w-sm border border-white/10" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Keyboard className="w-5 h-5 text-[#D4A017]" />
                Keyboard Shortcuts
              </h2>
              <button onClick={() => setIsOpen(false)} className="text-white/40 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2">
              {shortcuts.map(({ key, description }) => (
                <div key={key} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <span className="text-sm text-white/60">{description}</span>
                  <kbd className="px-2 py-1 bg-white/10 rounded text-xs font-mono text-white">{key}</kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
