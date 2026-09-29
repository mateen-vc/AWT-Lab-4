import React from 'react';

const PROTOCOL_CONFIG = {
  REST: {
    label: 'REST API',
    bg: 'bg-emerald-950/70 border-emerald-500/40 text-emerald-400',
    dot: 'bg-emerald-400',
  },
  SOCKET: {
    label: 'Socket.io',
    bg: 'bg-indigo-950/70 border-indigo-500/40 text-indigo-400',
    dot: 'bg-indigo-400',
  },
  RPC: {
    label: 'JSON-RPC 2.0',
    bg: 'bg-amber-950/70 border-amber-500/40 text-amber-400',
    dot: 'bg-amber-400',
  },
  SSE: {
    label: 'Server-Sent Events',
    bg: 'bg-cyan-950/70 border-cyan-500/40 text-cyan-400',
    dot: 'bg-cyan-400',
  },
};

export const ProtocolBadge = ({ type, size = 'sm', className = '' }) => {
  const config = PROTOCOL_CONFIG[type] || PROTOCOL_CONFIG.REST;
  const isSm = size === 'sm';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-mono font-medium tracking-wide ${config.bg} ${
        isSm ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
      } ${className}`}
    >
      <span className={`inline-block rounded-full ${config.dot} ${isSm ? 'h-1.5 w-1.5' : 'h-2 w-2'}`} />
      {config.label}
    </span>
  );
};
