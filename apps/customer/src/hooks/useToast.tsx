'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (type: ToastType, message: string) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((type: ToastType, message: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const toast: Toast = { id, type, message };
    
    setToasts((prev) => [...prev, toast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, showToast, dismissToast }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-full max-w-md px-4">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            flex items-start gap-3 p-4 rounded-lg shadow-lg border
            animate-in slide-in-from-top-2 fade-in duration-200
            ${toast.type === 'success' ? 'bg-green-50 border-green-200' : ''}
            ${toast.type === 'error' ? 'bg-red-50 border-red-200' : ''}
            ${toast.type === 'warning' ? 'bg-yellow-50 border-yellow-200' : ''}
            ${toast.type === 'info' ? 'bg-blue-50 border-blue-200' : ''}
          `}
          role="alert"
          aria-live="polite"
        >
          {toast.type === 'success' && <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />}
          {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />}
          {toast.type === 'warning' && <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0" />}
          {toast.type === 'info' && <Info className="w-5 h-5 text-blue-500 flex-shrink-0" />}
          <p className={`flex-1 text-sm font-medium ${
            toast.type === 'success' ? 'text-green-800' :
            toast.type === 'error' ? 'text-red-800' :
            toast.type === 'warning' ? 'text-yellow-800' :
            'text-blue-800'
          }`}>
            {toast.message}
          </p>
          <button
            onClick={() => onDismiss(toast.id)}
            className={`p-1 rounded hover:bg-black/5 ${
              toast.type === 'success' ? 'text-green-600' :
              toast.type === 'error' ? 'text-red-600' :
              toast.type === 'warning' ? 'text-yellow-600' :
              'text-blue-600'
            }`}
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
