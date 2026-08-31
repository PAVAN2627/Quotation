import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 sm:bottom-6 sm:right-6">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-start gap-3 rounded-lg border px-4 py-3 shadow-lg backdrop-blur-sm max-w-sm animate-in slide-in-from-right-5 fade-in duration-300 ${
              toast.type === 'success'
                ? 'border-emerald-200 bg-emerald-50/95 text-emerald-800'
                : toast.type === 'error'
                ? 'border-red-200 bg-red-50/95 text-red-800'
                : 'border-slate-200 bg-white/95 text-slate-700'
            }`}
            role="alert"
          >
            {toast.type === 'success' && <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />}
            {toast.type === 'error' && <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />}
            {toast.type === 'info' && <Info className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" />}
            <p className="flex-1 text-sm font-medium leading-snug">{toast.message}</p>
            <button
              onClick={() => removeToast(toast.id)}
              className="shrink-0 rounded p-0.5 hover:bg-black/5 transition-colors"
              aria-label="Dismiss notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
