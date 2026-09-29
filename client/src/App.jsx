import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { SSEProvider } from './context/SSEContext';
import { Navbar } from './components/Navbar';
import { NotificationToast } from './components/NotificationToast';
import { ProductCatalog } from './pages/ProductCatalog';
import { OrderTracking } from './pages/OrderTracking';
import { AgentDashboard } from './pages/AgentDashboard';
import { SupportChatPage } from './pages/SupportChatPage';
import { ProtocolDebugger } from './pages/ProtocolDebugger';

const MainApp = () => {
  const { isAgent } = useAuth();
  const [activeTab, setActiveTab] = useState(isAgent ? 'agent_orders' : 'catalog');
  const [selectedChatRoom, setSelectedChatRoom] = useState(null);

  // Handle open chat from order card
  const handleOpenChatForOrder = (order) => {
    const roomId = `support:${order.customerId || 'cust_01'}:agent_01`;
    setSelectedChatRoom(roomId);
    setActiveTab(isAgent ? 'agent_chat' : 'customer_chat');
  };

  const handleOrderCreated = (newOrder) => {
    // Switch to orders view so customer immediately sees their new order in real-time
    setActiveTab('my_orders');
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30">
      {/* Global floating real-time SSE notification toasts */}
      <NotificationToast />

      {/* Main Navigation Bar */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Page Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Customer Views */}
        {!isAgent && activeTab === 'catalog' && (
          <ProductCatalog onOrderCreated={handleOrderCreated} />
        )}

        {!isAgent && activeTab === 'my_orders' && (
          <OrderTracking onOpenChat={handleOpenChatForOrder} />
        )}

        {!isAgent && activeTab === 'customer_chat' && (
          <SupportChatPage selectedRoom={selectedChatRoom} />
        )}

        {/* Support Agent Views */}
        {isAgent && activeTab === 'agent_orders' && (
          <AgentDashboard onOpenChat={handleOpenChatForOrder} />
        )}

        {isAgent && activeTab === 'agent_chat' && (
          <SupportChatPage selectedRoom={selectedChatRoom} />
        )}

        {/* Protocol Inspector & Debugger */}
        {activeTab === 'protocols' && <ProtocolDebugger />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/70 py-6 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="font-semibold text-slate-300">
              Lab Assignment 04: Real-Time Order Tracker & Live Support System
            </span>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Integrated: REST API • Socket.io WebSockets • JSON-RPC 2.0 • Server-Sent Events (SSE)
            </p>
          </div>
          <div className="flex items-center gap-3 font-mono text-[11px] text-slate-400">
            <span>Client: React + Vite + Tailwind CSS</span>
            <span>•</span>
            <span>Server: Node + Express + Mongoose</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <SSEProvider>
          <MainApp />
        </SSEProvider>
      </SocketProvider>
    </AuthProvider>
  );
}
