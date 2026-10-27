import { createContext, useContext, useState, useCallback } from "react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "info", duration = 3500) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      {/* Toast container floating at top-right */}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-2xl border shadow-2xl backdrop-blur-xl flex items-center justify-between gap-3 text-xs font-mono transition-all animate-in slide-in-from-top-2 ${
              toast.type === "success"
                ? "bg-[#091C16]/95 border-emerald-500/40 text-emerald-300 shadow-emerald-950/20"
                : toast.type === "error"
                ? "bg-[#1C090D]/95 border-red-500/40 text-red-300 shadow-red-950/20"
                : "bg-[#0D1829]/95 border-cyan-500/40 text-cyan-300 shadow-cyan-950/20"
            }`}
          >
            <span>{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Fallback if rendered outside provider
    return { addToast: (msg) => console.log("[Toast]", msg) };
  }
  return ctx;
}
