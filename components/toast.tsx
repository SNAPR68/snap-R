'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Check, X, AlertTriangle, Info, Loader2 } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toast: (type: ToastType, message: string, duration?: number) => string;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((type: ToastType, message: string, duration = 3000) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, type, message, duration }]);
    
    if (type !== 'loading' && duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }
    
    return id;
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const icons = {
    success: <Check className="w-4 h-4 text-green-400" />,
    error: <X className="w-4 h-4 text-red-400" />,
    warning: <AlertTriangle className="w-4 h-4 text-yellow-400" />,
    info: <Info className="w-4 h-4 text-blue-400" />,
    loading: <Loader2 className="w-4 h-4 text-[#D4A017] animate-spin" />,
  };

  const bgColors = {
    success: 'bg-green-500/10 border-green-500/30',
    error: 'bg-red-500/10 border-red-500/30',
    warning: 'bg-yellow-500/10 border-yellow-500/30',
    info: 'bg-blue-500/10 border-blue-500/30',
    loading: 'bg-[#D4A017]/10 border-[#D4A017]/30',
  };

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-sm shadow-lg animate-slide-up ${bgColors[t.type]}`}
          >
            {icons[t.type]}
            <span className="text-sm text-white">{t.message}</span>
            {t.type !== 'loading' && (
              <button onClick={() => dismiss(t.id)} className="ml-2 text-white/40 hover:text-white/60">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
      </div>
      <style jsx global>{`
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up { animation: slide-up 0.2s ease-out; }
      `}</style>
    </ToastContext.Provider>
  );
}
