import React, { useState } from 'react';
import { ProtocolBadge } from '../components/ProtocolBadge';
import { callRpc } from '../services/rpc';
import { getOrders, getProducts, getHealth } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { useSSE } from '../context/SSEContext';
import {
  Radio,
  Send,
  Play,
  Terminal,
  Wifi,
  Server,
  Code2,
  Bell,
  RefreshCw,
} from 'lucide-react';

export const ProtocolDebugger = () => {
  const { isConnected: socketConnected, lastOrderUpdate } = useSocket();
  const { isConnected: sseConnected, alerts, status: sseStatus } = useSSE();

  // JSON-RPC state
  const [rpcMethod, setRpcMethod] = useState('cancelOrder');
  const [rpcParamsInput, setRpcParamsInput] = useState(
    JSON.stringify({ orderId: '', reason: 'Lab Assignment Test Cancellation' }, null, 2)
  );
  const [rpcLoading, setRpcLoading] = useState(false);
  const [rpcResult, setRpcResult] = useState(null);
  const [rpcError, setRpcError] = useState(null);

  // REST state
  const [restEndpoint, setRestEndpoint] = useState('/health');
  const [restLoading, setRestLoading] = useState(false);
  const [restResponse, setRestResponse] = useState(null);

  const executeRpc = async () => {
    try {
      setRpcLoading(true);
      setRpcResult(null);
      setRpcError(null);
      const parsedParams = JSON.parse(rpcParamsInput);
      const res = await callRpc(rpcMethod, parsedParams);
      setRpcResult(res);
    } catch (err) {
      setRpcError({
        code: err.code || -32603,
        message: err.message,
        data: err.data,
      });
    } finally {
      setRpcLoading(false);
    }
  };

  const executeRest = async () => {
    try {
      setRestLoading(true);
      let res;
      if (restEndpoint === '/health') res = await getHealth();
      else if (restEndpoint === '/api/v1/orders') res = await getOrders();
      else if (restEndpoint === '/api/v1/products') res = await getProducts();
      setRestResponse(res);
    } catch (err) {
      setRestResponse({ error: err.message });
    } finally {
      setRestLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl backdrop-blur-md">
        <div className="flex items-center gap-3 mb-2">
          <Terminal className="w-6 h-6 text-purple-400" />
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Multi-Protocol Live Inspector & Sandbox
          </h1>
        </div>
        <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
          This interactive inspection suite allows professors and evaluators to test, inspect, and verify all four communication protocols (REST, WebSockets via Socket.io, JSON-RPC 2.0, and Server-Sent Events) live against the backend in real-time.
        </p>
      </div>

      {/* Grid of 4 Protocols */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Protocol 1: REST API */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">1. REST API (Express /api/v1)</h3>
              </div>
              <ProtocolBadge type="REST" size="sm" />
            </div>

            <div className="flex gap-2 mb-3">
              <select
                value={restEndpoint}
                onChange={(e) => setRestEndpoint(e.target.value)}
                className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
              >
                <option value="/health">GET /health</option>
                <option value="/api/v1/orders">GET /api/v1/orders</option>
                <option value="/api/v1/products">GET /api/v1/products</option>
              </select>
              <button
                onClick={executeRest}
                disabled={restLoading}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Execute</span>
              </button>
            </div>

            <span className="text-[11px] text-slate-400 block mb-1 font-mono">Response Payload:</span>
            <pre className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-[11px] font-mono text-emerald-300 max-h-48 overflow-y-auto">
              {restResponse ? JSON.stringify(restResponse, null, 2) : '// Click "Execute" to trigger request'}
            </pre>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400">
            Used for: Resource CRUD (Products, Orders creation, Status updates)
          </div>
        </div>

        {/* Protocol 2: WebSockets / Socket.io */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <Wifi className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">2. WebSockets (Socket.io)</h3>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                    socketConnected ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'
                  }`}
                >
                  {socketConnected ? 'Connected' : 'Offline'}
                </span>
                <ProtocolBadge type="SOCKET" size="sm" />
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-[11px] text-slate-400 block mb-1 font-mono">
                  Latest "orderStatusUpdated" Event:
                </span>
                <pre className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-[11px] font-mono text-indigo-300 max-h-24 overflow-y-auto">
                  {lastOrderUpdate
                    ? JSON.stringify(lastOrderUpdate, null, 2)
                    : '// No socket status updates received yet in this session.'}
                </pre>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-300 space-y-1">
                <span className="font-semibold text-white block">Active Socket Channels:</span>
                <p>• Room <code className="text-indigo-400">order:[orderId]</code> (Targeted order tracking)</p>
                <p>• Room <code className="text-indigo-400">support:customerId:agentId</code> (Private chat)</p>
                <p>• Events: <code className="text-indigo-400">sendMessage, userTyping, orderStatusUpdated</code></p>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400">
            Used for: Real-time order timeline updates & 1-on-1 private live support chat
          </div>
        </div>

        {/* Protocol 3: JSON-RPC 2.0 */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">3. JSON-RPC 2.0 (POST /rpc)</h3>
              </div>
              <ProtocolBadge type="RPC" size="sm" />
            </div>

            <div className="space-y-3">
              <div className="flex gap-2">
                <select
                  value={rpcMethod}
                  onChange={(e) => {
                    const method = e.target.value;
                    setRpcMethod(method);
                    if (method === 'cancelOrder') {
                      setRpcParamsInput(JSON.stringify({ orderId: '', reason: 'Customer requested' }, null, 2));
                    } else if (method === 'getOrderStatus' || method === 'getOrder') {
                      setRpcParamsInput(JSON.stringify({ orderId: '' }, null, 2));
                    } else if (method === 'invalidMethod') {
                      setRpcParamsInput('{}');
                    }
                  }}
                  className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
                >
                  <option value="cancelOrder">method: cancelOrder (Mandatory)</option>
                  <option value="getOrderStatus">method: getOrderStatus</option>
                  <option value="getOrder">method: getOrder</option>
                  <option value="invalidMethod">method: invalidMethod (Test -32601 Error)</option>
                </select>
                <button
                  onClick={executeRpc}
                  disabled={rpcLoading}
                  className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send RPC</span>
                </button>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 block mb-1 font-mono">
                  RPC Params (JSON):
                </span>
                <textarea
                  rows={3}
                  value={rpcParamsInput}
                  onChange={(e) => setRpcParamsInput(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-[11px] font-mono text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <span className="text-[11px] text-slate-400 block mb-1 font-mono">JSON-RPC 2.0 Response:</span>
              <pre className={`p-3 bg-slate-950 border rounded-xl text-[11px] font-mono max-h-36 overflow-y-auto ${
                rpcError ? 'border-rose-500/40 text-rose-300' : 'border-slate-800 text-amber-300'
              }`}>
                {rpcResult
                  ? JSON.stringify({ jsonrpc: '2.0', result: rpcResult, id: 1 }, null, 2)
                  : rpcError
                  ? JSON.stringify({ jsonrpc: '2.0', error: rpcError, id: 1 }, null, 2)
                  : '// Click "Send RPC" to test endpoint'}
              </pre>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400">
            Used for: Command/Action RPC invocations (e.g., cancelOrder with error handling)
          </div>
        </div>

        {/* Protocol 4: Server-Sent Events (SSE) */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">4. Server-Sent Events (GET /events)</h3>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                    sseConnected ? 'bg-cyan-950 text-cyan-400' : 'bg-amber-950 text-amber-400'
                  }`}
                >
                  {sseStatus}
                </span>
                <ProtocolBadge type="SSE" size="sm" />
              </div>
            </div>

            <div className="space-y-3">
              <span className="text-[11px] text-slate-400 block mb-1 font-mono">
                Live SSE Event Stream Feed ({alerts.length} events logged):
              </span>
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2 max-h-56 overflow-y-auto">
                {alerts.length === 0 ? (
                  <p className="text-[11px] text-slate-500 font-mono">Waiting for SSE broadcast events...</p>
                ) : (
                  alerts.slice(0, 10).map((al, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono"
                    >
                      <div className="flex items-center justify-between text-cyan-400 mb-1">
                        <span>event: {al.event}</span>
                        <span className="text-[10px] text-slate-500">
                          {new Date(al.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <span className="text-slate-300 block">data: {JSON.stringify(al)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400">
            Used for: Global live system alerts, order updates, and support agent notifications
          </div>
        </div>
      </div>
    </div>
  );
};
