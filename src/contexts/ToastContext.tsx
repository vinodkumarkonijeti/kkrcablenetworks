import { createContext, useCallback, useContext, useState, ReactNode } from 'react';

type Toast = { id: string; message: string; type?: 'info' | 'success' | 'error' };

interface ToastContextType {
  toasts: Toast[];
  addToast: (message: string, type?: Toast['type']) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4500);
  }, []);

  const removeToast = useCallback((id: string) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <div className="fixed right-4 bottom-4 z-50 flex flex-col gap-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`max-w-xs w-full px-4 py-3 rounded-md shadow-lg transform transition dark:text-gray-100 ${
              toast.type === 'success' ? 'bg-green-50 dark:bg-green-900 text-green-800' : toast.type === 'error' ? 'bg-red-50 dark:bg-red-900 text-red-800' : 'bg-white dark:bg-gray-800 text-gray-800'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="text-sm">{toast.message}</div>
              <button onClick={() => removeToast(toast.id)} className="text-xs opacity-70 hover:opacity-100">
                Dismiss
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
