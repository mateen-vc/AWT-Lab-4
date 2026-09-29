import React from 'react';
import { useSocket } from '../context/SocketContext';
import { useSSE } from '../context/SSEContext';
import { Activity, Wifi, Radio } from 'lucide-react';

export const LiveIndicator = () => {
  const { isConnected: socketConnected } = useSocket();
  const { isConnected: sseConnected } = useSSE();

  return (
    <div className="flex items-center gap-3 text-xs font-mono">
      {/* Socket.io Indicator */}
      <div
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all ${
          socketConnected
            ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400'
            : 'bg-rose-950/40 border-rose-500/30 text-rose-400'
        }`}
        title={`WebSocket status: ${socketConnected ? 'Connected' : 'Disconnected'}`}
      >
        <span
          className={`h-2 w-2 rounded-full ${
            socketConnected ? 'bg-emerald-400 animate-live-pulse' : 'bg-rose-400'
          }`}
        />
        <Wifi className="w-3 h-3" />
        <span>Socket.io</span>
      </div>

      {/* SSE Indicator */}
      <div
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all ${
          sseConnected
            ? 'bg-cyan-950/40 border-cyan-500/30 text-cyan-400'
            : 'bg-amber-950/40 border-amber-500/30 text-amber-400'
        }`}
        title={`Server-Sent Events status: ${sseConnected ? 'Connected' : 'Connecting'}`}
      >
        <span
          className={`h-2 w-2 rounded-full ${
            sseConnected ? 'bg-cyan-400 animate-live-pulse' : 'bg-amber-400'
          }`}
        />
        <Radio className="w-3 h-3" />
        <span>SSE</span>
      </div>
    </div>
  );
};
