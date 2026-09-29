import React, { useState, useEffect } from 'react';
import { getOrders, updateOrderStatus, getStats } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { ProtocolBadge } from '../components/ProtocolBadge';
import {
  ShieldCheck,
  Package,
  Clock,
  Truck,
  CheckCircle,
  XCircle,
  MessageSquare,
  RefreshCw,
  Search,
  ExternalLink,
  ChevronRight,
  User,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

const STATUS_TRANSITIONS = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['out_for_delivery'],
  out_for_delivery: ['delivered'],
  delivered: [],
  cancelled: [],
};

export const AgentDashboard = ({ onOpenChat }) => {
  const { currentUser } = useAuth();
  const { subscribeToOrderUpdates } = useSocket();
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [statusNote, setStatusNote] = useState('');
  const [lastActionTrace, setLastActionTrace] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Listen to Socket.io order status updates in real time
  useEffect(() => {
    const unsubscribe = subscribeToOrderUpdates((data) => {
      console.log('[AgentDashboard] Live order status update received:', data);
      setOrders((prev) =>
        prev.map((o) => {
          if ((o._id || o.id) === data.orderId) {
            return {
              ...o,
              status: data.status,
              updatedAt: data.updatedAt,
              ...(data.order || {}),
            };
          }
          return o;
        })
      );

      // If selected order was updated, update it in view too
      setSelectedOrder((curr) => {
        if (curr && (curr._id || curr.id) === data.orderId) {
          return {
            ...curr,
            status: data.status,
            updatedAt: data.updatedAt,
            ...(data.order || {}),
          };
        }
        return curr;
      });
    });

    return () => unsubscribe();
  }, [subscribeToOrderUpdates]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [ordersRes, statsRes] = await Promise.all([
        getOrders(),
        getStats().catch(() => null),
      ]);

      if (ordersRes?.data) {
        setOrders(ordersRes.data);
        if (!selectedOrder && ordersRes.data.length > 0) {
          setSelectedOrder(ordersRes.data[0]);
        }
      }

      if (statsRes?.data) {
        setStats(statsRes.data);
      }
    } catch (err) {
      console.error('Failed to load agent dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Change order status via REST PATCH /api/v1/orders/:id (Step 5)
  const handleStatusTransition = async (orderId, newStatus) => {
    try {
      setUpdatingId(orderId);
      const note = statusNote || `Transitioned to ${newStatus} by ${currentUser?.name || 'Agent Marcus'}`;

      // REST PATCH call
      const res = await updateOrderStatus(orderId, newStatus, note, currentUser?.name);

      setLastActionTrace({
        action: 'PATCH /api/v1/orders/:id',
        orderId,
        newStatus,
        response: res,
        timestamp: new Date().toLocaleTimeString(),
      });

      // Update state
      setOrders((prev) =>
        prev.map((o) => ((o._id || o.id) === orderId ? res.data : o))
      );

      if (selectedOrder && (selectedOrder._id || selectedOrder.id) === orderId) {
        setSelectedOrder(res.data);
      }

      setStatusNote('');
    } catch (err) {
      alert(`Status update failed: ${err.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    const matchesSearch =
      (o._id || o.id).toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customerName?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-6 rounded-2xl backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-white tracking-tight">Support Agent Operations</h1>
            <ProtocolBadge type="REST" size="md" />
            <ProtocolBadge type="SOCKET" size="md" />
          </div>
          <p className="text-xs text-slate-400">
            Dispatch lifecycle status transitions via <strong className="text-emerald-400">REST PATCH</strong> • Instant customer propagation via <strong className="text-indigo-400">Socket.io</strong>
          </p>
        </div>

        <button
          onClick={loadDashboardData}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <span className="text-[10px] font-mono text-slate-400 uppercase block">Total Orders</span>
          <span className="text-xl font-bold text-white mt-1 block">
            {stats?.totalOrders ?? orders.length}
          </span>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/80 border border-amber-500/20">
          <span className="text-[10px] font-mono text-amber-400 uppercase block">Pending</span>
          <span className="text-xl font-bold text-amber-300 mt-1 block">
            {orders.filter((o) => o.status === 'pending').length}
          </span>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/80 border border-indigo-500/20">
          <span className="text-[10px] font-mono text-indigo-400 uppercase block">Processing</span>
          <span className="text-xl font-bold text-indigo-300 mt-1 block">
            {orders.filter((o) => ['confirmed', 'processing'].includes(o.status)).length}
          </span>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/80 border border-purple-500/20">
          <span className="text-[10px] font-mono text-purple-400 uppercase block">Shipped / Transit</span>
          <span className="text-xl font-bold text-purple-300 mt-1 block">
            {orders.filter((o) => ['shipped', 'out_for_delivery'].includes(o.status)).length}
          </span>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/80 border border-emerald-500/20">
          <span className="text-[10px] font-mono text-emerald-400 uppercase block">Delivered</span>
          <span className="text-xl font-bold text-emerald-300 mt-1 block">
            {orders.filter((o) => o.status === 'delivered').length}
          </span>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/80 border border-rose-500/20">
          <span className="text-[10px] font-mono text-rose-400 uppercase block">Cancelled</span>
          <span className="text-xl font-bold text-rose-300 mt-1 block">
            {orders.filter((o) => o.status === 'cancelled').length}
          </span>
        </div>
      </div>

      {/* Main Console Split View: Table on Left, Status Transition Panel on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Orders Table (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 backdrop-blur-md">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h3 className="text-sm font-bold text-white">Active Orders Queue</h3>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search by ID or customer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-2 text-xs">
            {['all', 'pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium capitalize transition-all ${
                  statusFilter === st
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {st.replace(/_/g, ' ')}
              </button>
            ))}
          </div>

          {/* Orders List / Rows */}
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {filteredOrders.length === 0 ? (
              <p className="text-xs text-slate-500 py-8 text-center">No orders match the filter criteria.</p>
            ) : (
              filteredOrders.map((order) => {
                const id = order._id || order.id;
                const isSelected = (selectedOrder?._id || selectedOrder?.id) === id;

                return (
                  <div
                    key={id}
                    onClick={() => setSelectedOrder(order)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-950/40 border-indigo-500/50 shadow-md'
                        : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-white">
                          #{id.slice(-6)}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase ${
                            order.status === 'cancelled'
                              ? 'bg-rose-500/20 text-rose-400'
                              : order.status === 'delivered'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-indigo-500/20 text-indigo-400'
                          }`}
                        >
                          {order.status.replace(/_/g, ' ')}
                        </span>
                      </div>

                      <span className="text-xs font-semibold text-emerald-400 font-mono">
                        ${(order.totalAmount || 0).toFixed(2)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>{order.customerName} ({order.items?.length || 1} items)</span>
                      <span>{new Date(order.updatedAt || order.createdAt).toLocaleTimeString()}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Selected Order Lifecycle Management Panel (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 backdrop-blur-md flex flex-col justify-between">
          {selectedOrder ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Order #{(selectedOrder._id || selectedOrder.id).slice(-6)}
                  </h3>
                  <span className="text-xs text-slate-400">
                    Customer: <strong>{selectedOrder.customerName}</strong>
                  </span>
                </div>

                {onOpenChat && (
                  <button
                    onClick={() => onOpenChat(selectedOrder)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-all shadow"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Open Chat</span>
                  </button>
                )}
              </div>

              {/* Status Transition Control (Step 5) */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">
                    Change Lifecycle Status (REST PATCH)
                  </span>
                  <ProtocolBadge type="REST" size="sm" />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Current Status:</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-indigo-950 border border-indigo-500/40 text-indigo-300 uppercase">
                    {selectedOrder.status.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[11px] text-slate-400 block">Available Transitions:</span>
                  <div className="flex flex-wrap gap-2">
                    {['pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled']
                      .filter((st) => st !== selectedOrder.status)
                      .map((targetStatus) => (
                        <button
                          key={targetStatus}
                          onClick={() =>
                            handleStatusTransition(
                              selectedOrder._id || selectedOrder.id,
                              targetStatus
                            )
                          }
                          disabled={updatingId === (selectedOrder._id || selectedOrder.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                            targetStatus === 'cancelled'
                              ? 'bg-rose-950/60 hover:bg-rose-900 border border-rose-700/50 text-rose-300'
                              : targetStatus === 'delivered'
                              ? 'bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-700/50 text-emerald-300'
                              : 'bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200'
                          }`}
                        >
                          → {targetStatus.replace(/_/g, ' ')}
                        </button>
                      ))}
                  </div>
                </div>

                <input
                  type="text"
                  placeholder="Optional status transition note..."
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Order Status History Timeline */}
              <div>
                <h4 className="text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider font-mono">
                  Audit History
                </h4>
                <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                  {selectedOrder.statusHistory?.map((hist, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-lg bg-slate-950/50 border border-slate-800/80 text-[11px]"
                    >
                      <div className="flex items-center justify-between text-slate-400">
                        <span className="font-semibold text-indigo-300 uppercase">
                          {hist.status}
                        </span>
                        <span className="text-[10px] font-mono">
                          {new Date(hist.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-slate-300 mt-0.5">{hist.note}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 text-xs">
              Select an order from the queue to view details and execute status transitions.
            </div>
          )}

          {/* Last REST Action Trace */}
          {lastActionTrace && (
            <div className="mt-4 p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-500/30 text-[11px] text-emerald-300 font-mono">
              ✓ Successfully executed {lastActionTrace.action} at {lastActionTrace.timestamp}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
