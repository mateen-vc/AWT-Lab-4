import React, { useState } from 'react';
import { ProtocolBadge } from './ProtocolBadge';
import { rpcCancelOrder } from '../services/rpc';
import {
  Clock,
  CheckCircle,
  Package,
  Truck,
  MapPin,
  CheckCheck,
  XCircle,
  AlertCircle,
  Radio,
  MessageSquare,
} from 'lucide-react';

const TIMELINE_STEPS = [
  { key: 'pending', label: 'Order Placed', icon: Clock },
  { key: 'confirmed', label: 'Confirmed', icon: CheckCircle },
  { key: 'processing', label: 'Processing', icon: Package },
  { key: 'shipped', label: 'Shipped', icon: Truck },
  { key: 'out_for_delivery', label: 'Out for Delivery', icon: MapPin },
  { key: 'delivered', label: 'Delivered', icon: CheckCheck },
];

export const OrderTimeline = ({ order, onOrderCancelled, onOpenChat }) => {
  const [cancelling, setCancelling] = useState(false);
  const [rpcResponseModal, setRpcResponseModal] = useState(null);
  const [cancelReasonInput, setCancelReasonInput] = useState('');
  const [showCancelPrompt, setShowCancelPrompt] = useState(false);

  if (!order) return null;

  const isCancelled = order.status === 'cancelled';
  const isDelivered = order.status === 'delivered';
  const canCancel = !isCancelled && !isDelivered;

  // Determine active step index
  const currentStepIndex = TIMELINE_STEPS.findIndex((s) => s.key === order.status);

  // Trigger JSON-RPC 2.0 cancelOrder
  const handleCancelClick = async () => {
    try {
      setCancelling(true);
      const reason = cancelReasonInput.trim() || 'Customer requested order cancellation';
      const orderId = order._id || order.id;

      // Real JSON-RPC 2.0 request to POST /rpc
      const rpcResult = await rpcCancelOrder(orderId, reason);

      setRpcResponseModal({
        success: true,
        method: 'cancelOrder',
        request: {
          jsonrpc: '2.0',
          method: 'cancelOrder',
          params: { orderId, reason },
        },
        response: {
          jsonrpc: '2.0',
          result: rpcResult,
        },
      });

      setShowCancelPrompt(false);
      setCancelReasonInput('');

      if (onOrderCancelled) {
        onOrderCancelled(orderId, rpcResult);
      }
    } catch (err) {
      setRpcResponseModal({
        success: false,
        method: 'cancelOrder',
        request: {
          jsonrpc: '2.0',
          method: 'cancelOrder',
          params: { orderId: order._id || order.id },
        },
        response: {
          jsonrpc: '2.0',
          error: {
            code: err.code || -32603,
            message: err.message,
          },
        },
      });
    } finally {
      setCancelling(false);
    }
  };

  const orderId = order._id || order.id || 'Unknown';
  const displayId = orderId.length > 8 ? orderId.slice(-8) : orderId;

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-md shadow-xl">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-bold text-white">Order #{displayId}</h3>
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                isCancelled
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  : order.status === 'delivered'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
              }`}
            >
              {order.status.replace(/_/g, ' ')}
            </span>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-live-pulse" />
              Socket.io Live
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Placed on {new Date(order.createdAt || Date.now()).toLocaleDateString()} at{' '}
            {new Date(order.createdAt || Date.now()).toLocaleTimeString()}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3">
          {onOpenChat && (
            <button
              onClick={() => onOpenChat(order)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-all hover:border-slate-600"
            >
              <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
              Support Chat
            </button>
          )}

          {canCancel && (
            <button
              onClick={() => setShowCancelPrompt(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-950/50 hover:bg-rose-900/60 text-rose-300 text-xs font-semibold border border-rose-700/50 transition-all"
            >
              <XCircle className="w-3.5 h-3.5" />
              Cancel Order (JSON-RPC)
            </button>
          )}
        </div>
      </div>

      {/* Cancel Prompt Modal */}
      {showCancelPrompt && (
        <div className="my-4 p-4 rounded-xl bg-rose-950/30 border border-rose-800/50">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-rose-400" />
            <h4 className="text-sm font-semibold text-rose-200">
              Confirm Cancellation via JSON-RPC 2.0
            </h4>
            <ProtocolBadge type="RPC" size="sm" />
          </div>
          <p className="text-xs text-slate-300 mb-3">
            This will send a JSON-RPC 2.0 request payload to <code className="bg-slate-800 px-1 py-0.5 rounded text-amber-300">POST /rpc</code> with method <code className="text-amber-300">cancelOrder</code>.
          </p>
          <input
            type="text"
            placeholder="Reason for cancellation (optional)..."
            value={cancelReasonInput}
            onChange={(e) => setCancelReasonInput(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 mb-3 focus:outline-none focus:border-rose-500"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowCancelPrompt(false)}
              className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
            >
              Close
            </button>
            <button
              onClick={handleCancelClick}
              disabled={cancelling}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white disabled:opacity-50"
            >
              {cancelling ? 'Sending RPC...' : 'Execute JSON-RPC Cancel'}
            </button>
          </div>
        </div>
      )}

      {/* JSON-RPC Response Inspection Modal */}
      {rpcResponseModal && (
        <div className="my-4 p-4 rounded-xl bg-slate-950 border border-amber-500/40 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <ProtocolBadge type="RPC" size="sm" />
              <h4 className="text-xs font-mono font-bold text-amber-300">
                JSON-RPC 2.0 Execution Trace
              </h4>
            </div>
            <button
              onClick={() => setRpcResponseModal(null)}
              className="text-xs text-slate-400 hover:text-white"
            >
              ✕ Dismiss
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] font-mono">
            <div>
              <span className="text-slate-400 block mb-1">Payload Sent: POST /rpc</span>
              <pre className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 overflow-x-auto">
                {JSON.stringify(rpcResponseModal.request, null, 2)}
              </pre>
            </div>
            <div>
              <span className="text-slate-400 block mb-1">Response Received:</span>
              <pre className={`p-2.5 rounded-lg bg-slate-900 border overflow-x-auto ${
                rpcResponseModal.success ? 'border-emerald-500/40 text-emerald-300' : 'border-rose-500/40 text-rose-300'
              }`}>
                {JSON.stringify(rpcResponseModal.response, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Visual Timeline Section */}
      <div className="my-8">
        {isCancelled ? (
          <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/30 flex items-center gap-3">
            <XCircle className="w-8 h-8 text-rose-400 shrink-0" />
            <div>
              <h4 className="text-sm font-semibold text-rose-300">Order Cancelled</h4>
              <p className="text-xs text-slate-400">
                {order.cancelReason || 'This order was cancelled via JSON-RPC request.'}
              </p>
              <span className="text-[11px] text-slate-500 font-mono block mt-1">
                Updated: {new Date(order.updatedAt || Date.now()).toLocaleTimeString()}
              </span>
            </div>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline progress line */}
            <div className="absolute top-5 left-6 right-6 h-0.5 bg-slate-800 -z-0 hidden md:block">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 transition-all duration-500"
                style={{
                  width: `${(Math.max(0, currentStepIndex) / (TIMELINE_STEPS.length - 1)) * 100}%`,
                }}
              />
            </div>

            {/* Steps grid */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 relative z-10">
              {TIMELINE_STEPS.map((step, index) => {
                const IconComponent = step.icon;
                const isPassed = currentStepIndex >= index;
                const isCurrent = currentStepIndex === index;

                return (
                  <div key={step.key} className="flex flex-col items-center text-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                        isCurrent
                          ? 'bg-indigo-600 text-white ring-4 ring-indigo-500/30 shadow-lg shadow-indigo-500/30 scale-110'
                          : isPassed
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-800 text-slate-500 border border-slate-700'
                      }`}
                    >
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <span
                      className={`text-xs font-medium mt-2 ${
                        isCurrent
                          ? 'text-indigo-400 font-semibold'
                          : isPassed
                          ? 'text-slate-200'
                          : 'text-slate-500'
                      }`}
                    >
                      {step.label}
                    </span>
                    {isCurrent && (
                      <span className="text-[10px] text-indigo-400 font-mono mt-0.5">
                        Current Status
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Details Grid: Items and Shipping */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-slate-800 text-xs">
        {/* Items list */}
        <div className="md:col-span-2">
          <h4 className="font-semibold text-slate-300 uppercase tracking-wider mb-3">
            Ordered Items ({order.items?.length || 0})
          </h4>
          <div className="space-y-2.5">
            {order.items?.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800"
              >
                <div className="flex items-center gap-3">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-10 h-10 object-cover rounded-lg border border-slate-700"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-slate-500">
                      <Package className="w-4 h-4" />
                    </div>
                  )}
                  <div>
                    <h5 className="font-medium text-white">{item.name}</h5>
                    <span className="text-slate-400 text-[11px]">Qty: {item.quantity}</span>
                  </div>
                </div>
                <span className="font-semibold text-white">
                  ${((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-800 font-semibold text-sm">
            <span className="text-slate-300">Total Order Amount</span>
            <span className="text-lg text-emerald-400">
              ${(order.totalAmount || 0).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Shipping details */}
        <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl space-y-3">
          <h4 className="font-semibold text-slate-300 uppercase tracking-wider">
            Shipping Information
          </h4>
          <div>
            <span className="text-slate-500 block text-[11px]">Recipient</span>
            <span className="text-white font-medium">{order.customerName}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">Destination</span>
            <span className="text-slate-300">
              {order.shippingAddress?.street}, {order.shippingAddress?.city},{' '}
              {order.shippingAddress?.state} {order.shippingAddress?.zip}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">Estimated Arrival</span>
            <span className="text-indigo-400 font-medium">
              {new Date(order.estimatedDelivery || Date.now() + 3 * 86400000).toDateString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
