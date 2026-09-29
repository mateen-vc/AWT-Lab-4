import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSSE } from '../context/SSEContext';
import { LiveIndicator } from './LiveIndicator';
import { ProtocolBadge } from './ProtocolBadge';
import {
  Package,
  ShoppingBag,
  Clock,
  MessageSquare,
  ShieldAlert,
  Bell,
  Radio,
  Sliders,
  UserCheck,
  ChevronDown,
  Trash2,
} from 'lucide-react';

export const Navbar = ({ activeTab, setActiveTab }) => {
  const { currentUser, isAgent, switchRole } = useAuth();
  const { alerts, clearAlerts, isConnected: sseConnected } = useSSE();
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Assignment title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white tracking-tight text-base sm:text-lg">
                  OrderTracker<span className="text-indigo-400">.io</span>
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-indigo-950 border border-indigo-500/30 text-indigo-300">
                  Lab 04
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Multi-Protocol: REST • WebSockets • JSON-RPC • SSE
              </p>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800 text-xs">
            {isAgent ? (
              <>
                <button
                  onClick={() => setActiveTab('agent_orders')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                    activeTab === 'agent_orders'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  Orders Console
                </button>
                <button
                  onClick={() => setActiveTab('agent_chat')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                    activeTab === 'agent_chat'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Support Chats
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setActiveTab('catalog')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                    activeTab === 'catalog'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  Catalog
                </button>
                <button
                  onClick={() => setActiveTab('my_orders')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                    activeTab === 'my_orders'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  My Orders
                </button>
                <button
                  onClick={() => setActiveTab('customer_chat')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                    activeTab === 'customer_chat'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Live Support
                </button>
              </>
            )}

            <button
              onClick={() => setActiveTab('protocols')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'protocols'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-purple-300/80 hover:text-white'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              Protocol Inspector
            </button>
          </nav>

          {/* Right controls: Live Indicators, SSE Alerts Dropdown, Role Switcher */}
          <div className="flex items-center gap-3">
            {/* Live socket & sse pills */}
            <div className="hidden lg:block">
              <LiveIndicator />
            </div>

            {/* SSE Notifications Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotificationPanel(!showNotificationPanel)}
                className="relative p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-all hover:border-slate-700"
                title="Live SSE Alerts"
              >
                <Bell className="w-4 h-4" />
                {alerts.length > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-cyan-500 text-[10px] font-bold text-slate-950">
                    {alerts.length > 9 ? '9+' : alerts.length}
                  </span>
                )}
              </button>

              {/* SSE Alerts Dropdown Panel */}
              {showNotificationPanel && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-4 z-50 animate-in fade-in">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <ProtocolBadge type="SSE" size="sm" />
                      <h4 className="text-xs font-bold text-white">Live System Alerts</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={clearAlerts}
                        className="text-[11px] text-slate-400 hover:text-rose-400 flex items-center gap-1"
                        title="Clear alert list"
                      >
                        <Trash2 className="w-3 h-3" />
                        Clear
                      </button>
                    </div>
                  </div>

                  <div className="max-h-72 overflow-y-auto mt-2 space-y-2">
                    {alerts.length === 0 ? (
                      <p className="text-xs text-slate-500 py-6 text-center">
                        No SSE events received yet. Create or update an order to trigger live broadcasts!
                      </p>
                    ) : (
                      alerts.map((al) => (
                        <div
                          key={al.id}
                          className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-slate-200">
                              {al.title || al.event}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {new Date(al.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-slate-400 text-[11px] leading-relaxed">
                            {al.message}
                          </p>
                          <span className="text-[9px] text-cyan-400 font-mono mt-1 block">
                            event: {al.event}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Role Switcher Pill */}
            <div className="relative">
              <button
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-indigo-500/40 hover:border-indigo-400 text-xs transition-all"
              >
                <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-white text-[11px] font-bold">
                  {isAgent ? 'AG' : 'CU'}
                </div>
                <div className="text-left hidden sm:block">
                  <span className="block text-[11px] font-semibold text-white leading-tight">
                    {currentUser?.name}
                  </span>
                  <span className="block text-[9px] text-indigo-400 uppercase tracking-wider font-mono">
                    {currentUser?.role} Mode
                  </span>
                </div>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {/* Role Dropdown */}
              {showRoleMenu && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl p-2 z-50 animate-in fade-in">
                  <div className="px-2 py-1.5 text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                    Switch Demo Persona
                  </div>
                  <button
                    onClick={() => {
                      switchRole('customer');
                      setShowRoleMenu(false);
                      setActiveTab('catalog');
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs transition-all ${
                      !isAgent ? 'bg-indigo-600/20 text-indigo-300 font-semibold' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <UserCheck className="w-4 h-4 text-indigo-400" />
                    <div>
                      <span>Alex Johnson</span>
                      <span className="block text-[10px] text-slate-400 font-normal">Customer Persona</span>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      switchRole('agent');
                      setShowRoleMenu(false);
                      setActiveTab('agent_orders');
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs transition-all mt-1 ${
                      isAgent ? 'bg-indigo-600/20 text-indigo-300 font-semibold' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <ShieldAlert className="w-4 h-4 text-purple-400" />
                    <div>
                      <span>Agent Marcus Ray</span>
                      <span className="block text-[10px] text-slate-400 font-normal">Support Agent Persona</span>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Nav Links */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-800/80 text-xs">
          {isAgent ? (
            <>
              <button
                onClick={() => setActiveTab('agent_orders')}
                className={`py-1 px-3 rounded-lg ${
                  activeTab === 'agent_orders' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                }`}
              >
                Orders Console
              </button>
              <button
                onClick={() => setActiveTab('agent_chat')}
                className={`py-1 px-3 rounded-lg ${
                  activeTab === 'agent_chat' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                }`}
              >
                Support Chat
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setActiveTab('catalog')}
                className={`py-1 px-2.5 rounded-lg ${
                  activeTab === 'catalog' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                }`}
              >
                Catalog
              </button>
              <button
                onClick={() => setActiveTab('my_orders')}
                className={`py-1 px-2.5 rounded-lg ${
                  activeTab === 'my_orders' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                }`}
              >
                Orders
              </button>
              <button
                onClick={() => setActiveTab('customer_chat')}
                className={`py-1 px-2.5 rounded-lg ${
                  activeTab === 'customer_chat' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                }`}
              >
                Support
              </button>
            </>
          )}
          <button
            onClick={() => setActiveTab('protocols')}
            className={`py-1 px-2.5 rounded-lg ${
              activeTab === 'protocols' ? 'bg-purple-600 text-white' : 'text-purple-400'
            }`}
          >
            Inspector
          </button>
        </div>
      </div>
    </header>
  );
};
