import React, { useState, useEffect } from 'react';
import { getOrders } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { OrderTimeline } from '../components/OrderTimeline';
import { ProtocolBadge } from '../components/ProtocolBadge';
import {
  Package,
  RefreshCw,
  Search,
  Filter,
  CheckCircle,
  Clock,
  Sparkles,
  Radio,
} from 'lucide-react';

export const OrderTracking = ({ onOpenChat }) => {
  const { currentUser } = useAuth();
  const { lastOrderUpdate, subscribeToOrderUpdates, isConnected: socketConnected } = useSocket();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [recentLiveUpdateId, setRecentLiveUpdateId] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, [currentUser?.id]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await getOrders({ customerId: currentUser?.id || 'cust_01' });
      if (res?.data) {
        setOrders(res.data);
      }
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
    }
  };

  // Socket.io Real-time status update listener (Deliverable 2A & Step 6)
  useEffect(() => {
    const unsubscribe = subscribeToOrderUpdates((updateData) => {
      console.log('[OrderTracking Component] Real-Time Socket Update received:', updateData);

      setRecentLiveUpdateId(updateData.orderId);
      setTimeout(() => setRecentLiveUpdateId(null), 5000);

      setOrders((prev) => {
        // If order already exists in state, update its status without page refresh
        const exists = prev.some((o) => (o._id || o.id) === updateData.orderId);
        if (exists) {
          return prev.map((o) => {
            if ((o._id || o.id) === updateData.orderId) {
              return {
                ...o,
                status: updateData.status,
                updatedAt: updateData.updatedAt || new Date().toISOString(),
                ...(updateData.order || {}),
              };
            }
            return o;
          });
        } else if (updateData.order) {
          // If new order was created and belongs to this customer
          return [updateData.order, ...prev];
        }
        return prev;
      });
    });

    return () => unsubscribe();
  }, [subscribeToOrderUpdates]);

  const handleOrderCancelled = (orderId, rpcResult) => {
    setOrders((prev) =>
      prev.map((o) =>
        (o._id || o.id) === orderId
          ? { ...o, status: 'cancelled', cancelReason: rpcResult.cancelReason }
          : o
      )
    );
  };

  const filteredOrders = orders.filter((o) => {
    if (filterStatus === 'all') return true;
    return o.status === filterStatus;
  });

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-6 rounded-2xl backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-white tracking-tight">My Orders & Live Tracker</h1>
            <ProtocolBadge type="SOCKET" size="md" />
            <ProtocolBadge type="RPC" size="md" />
          </div>
          <p className="text-xs text-slate-400">
            Real-time status synced via <strong className="text-indigo-400">Socket.io</strong> • Instant cancellation powered by <strong className="text-amber-400">JSON-RPC 2.0</strong>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchOrders}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-all"
            title="Refresh order list via REST"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>REST Sync</span>
          </button>
        </div>
      </div>

      {/* Live Socket Flash Alert */}
      {recentLiveUpdateId && (
        <div className="p-3.5 rounded-xl bg-indigo-950/70 border border-indigo-500/40 text-xs flex items-center justify-between text-indigo-200 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-indigo-400 animate-live-pulse" />
            <span>
              ⚡ Real-time status update received via <strong>Socket.io</strong> for Order #{recentLiveUpdateId.slice(-6)} (No page refresh needed!)
            </span>
          </div>
          <ProtocolBadge type="SOCKET" size="sm" />
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {['all', 'pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'].map((st) => (
          <button
            key={st}
            onClick={() => setFilterStatus(st)}
            className={`px-3 py-1.5 rounded-xl font-medium capitalize transition-all ${
              filterStatus === st
                ? 'bg-indigo-600 text-white shadow'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {st.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-64 rounded-2xl bg-slate-900/40 border border-slate-800 animate-pulse" />
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800">
          <Package className="w-10 h-10 text-slate-500 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-white">No orders found</h3>
          <p className="text-xs text-slate-400 mt-1">
            {filterStatus === 'all'
              ? 'You have not placed any orders yet. Visit the catalog to create an order!'
              : `No orders currently in "${filterStatus}" status.`}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredOrders.map((order) => (
            <OrderTimeline
              key={order._id || order.id}
              order={order}
              onOrderCancelled={handleOrderCancelled}
              onOpenChat={onOpenChat}
            />
          ))}
        </div>
      )}
    </div>
  );
};
