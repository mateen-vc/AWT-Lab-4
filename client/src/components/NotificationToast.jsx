import React from 'react';
import { useSSE } from '../context/SSEContext';
import { ProtocolBadge } from './ProtocolBadge';
import { X, Bell, CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react';

export const NotificationToast = () => {
  const { activeToasts, dismissToast } = useSSE();

  if (activeToasts.length === 0) return null;

  const getIcon = (event) => {
    switch (event) {
      case 'orderCreated':
        return <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />;
      case 'orderStatusChanged':
        return <Info className="w-5 h-5 text-indigo-400 shrink-0" />;
      case 'orderCancelled':
        return <XCircle className="w-5 h-5 text-rose-400 shrink-0" />;
      default:
        return <Bell className="w-5 h-5 text-amber-400 shrink-0" />;
    }
  };

  return (
    <div className="fixed top-20 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {activeToasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-start gap-3 p-4 rounded-xl border border-slate-700/80 bg-slate-900/95 backdrop-blur-md shadow-2xl shadow-black/60 transition-all duration-300 animate-in fade-in slide-in-from-top-4"
        >
          {getIcon(toast.event)}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <h4 className="text-sm font-semibold text-white truncate">
                {toast.title || 'System Notification'}
              </h4>
              <ProtocolBadge type="SSE" size="sm" />
            </div>
            <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
              {toast.message}
            </p>
            <span className="text-[10px] text-slate-500 font-mono mt-1 block">
              {new Date(toast.timestamp).toLocaleTimeString()}
            </span>
          </div>
          <button
            onClick={() => dismissToast(toast.id)}
            className="text-slate-400 hover:text-white transition-colors p-1 -mr-1 -mt-1 rounded-md"
            title="Dismiss alert"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
