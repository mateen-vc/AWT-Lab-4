import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ChatBox } from '../components/ChatBox';
import { ProtocolBadge } from '../components/ProtocolBadge';
import { getSupportRooms } from '../services/api';
import {
  MessageSquare,
  Users,
  ShieldAlert,
  Clock,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';

export const SupportChatPage = ({ selectedRoom = null }) => {
  const { currentUser, isAgent } = useAuth();
  const [activeRoomId, setActiveRoomId] = useState(
    selectedRoom || (isAgent ? 'support:cust_01:agent_01' : `support:${currentUser?.id || 'cust_01'}:agent_01`)
  );
  const [availableRooms, setAvailableRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);

  useEffect(() => {
    if (isAgent) {
      loadSupportRooms();
    }
  }, [isAgent]);

  const loadSupportRooms = async () => {
    try {
      setLoadingRooms(true);
      const res = await getSupportRooms();
      if (res?.data) {
        setAvailableRooms(res.data);
      }
    } catch (err) {
      console.error('Failed to load support rooms:', err);
    } finally {
      setLoadingRooms(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-6 rounded-2xl backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {isAgent ? 'Agent Live Support Hub' : 'Customer 1-on-1 Live Support'}
            </h1>
            <ProtocolBadge type="SOCKET" size="md" />
          </div>
          <p className="text-xs text-slate-400">
            Powered by private <strong className="text-indigo-400">Socket.io</strong> rooms (<code className="text-indigo-400 font-mono">support:customerId:agentId</code>) with typing feedback
          </p>
        </div>

        {isAgent && (
          <button
            onClick={loadSupportRooms}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingRooms ? 'animate-spin' : ''}`} />
            <span>Refresh Rooms</span>
          </button>
        )}
      </div>

      {/* Main chat layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Room Selector for Agent (or Support FAQ for Customer) */}
        <div className="lg:col-span-4 space-y-4">
          {isAgent ? (
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 backdrop-blur-md">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-sm font-bold text-white">Active Support Channels</h3>
                </div>
                <span className="text-[10px] font-mono text-slate-500">
                  {availableRooms.length} Active
                </span>
              </div>

              <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                {availableRooms.length === 0 ? (
                  <div
                    onClick={() => setActiveRoomId('support:cust_01:agent_01')}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      activeRoomId === 'support:cust_01:agent_01'
                        ? 'bg-indigo-950/40 border-indigo-500/50'
                        : 'bg-slate-950/60 border-slate-800'
                    }`}
                  >
                    <span className="font-semibold text-xs text-white block">Alex Johnson</span>
                    <span className="text-[11px] text-slate-400 block truncate">
                      Default demo customer channel
                    </span>
                    <span className="text-[9px] text-indigo-400 font-mono mt-1 block">
                      support:cust_01:agent_01
                    </span>
                  </div>
                ) : (
                  availableRooms.map((room) => {
                    const isSelected = activeRoomId === room.roomId;
                    return (
                      <div
                        key={room.roomId}
                        onClick={() => setActiveRoomId(room.roomId)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-950/40 border-indigo-500/50'
                            : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-xs text-white">
                            {room.senderName || 'Customer Channel'}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {new Date(room.updatedAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate leading-relaxed">
                          {room.lastMessage || 'Open support channel'}
                        </p>
                        <span className="text-[9px] text-indigo-400 font-mono mt-1 block">
                          {room.roomId}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 backdrop-blur-md space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
                <ShieldAlert className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">Customer Support Tips</h3>
              </div>

              <div className="space-y-3 text-xs text-slate-300">
                <p>
                  Need help with an ongoing shipment or address modification? Your dedicated agent is ready to assist you.
                </p>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] space-y-1.5 text-slate-400">
                  <span className="font-semibold text-indigo-300 block">Common Topics:</span>
                  <p>• Estimated Delivery Dates</p>
                  <p>• Cancelling or modifying an order</p>
                  <p>• Real-time carrier status</p>
                </div>

                <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/30 text-[11px] text-indigo-300">
                  💡 <strong>Tip for Lab Demonstration:</strong> Open a second browser tab or window, select <strong>Support Agent</strong> mode in one window and <strong>Customer</strong> in the other, and send messages across both!
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Active Live Chat Box */}
        <div className="lg:col-span-8">
          <ChatBox roomId={activeRoomId} />
        </div>
      </div>
    </div>
  );
};
