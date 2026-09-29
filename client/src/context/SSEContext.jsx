import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';

const SSEContext = createContext();

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');

export const SSEProvider = ({ children }) => {
  const [status, setStatus] = useState('connecting'); // 'connecting' | 'connected' | 'error'
  const [alerts, setAlerts] = useState([]);
  const [activeToasts, setActiveToasts] = useState([]);
  const eventSourceRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  const addAlert = useCallback((alertData) => {
    const id = alertData.eventId || `alert_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const newAlert = {
      id,
      timestamp: alertData.timestamp || new Date().toISOString(),
      ...alertData,
    };

    setAlerts((prev) => [newAlert, ...prev.slice(0, 49)]); // Keep last 50
    setActiveToasts((prev) => [newAlert, ...prev.slice(0, 4)]); // Show up to 5 toast bubbles simultaneously

    // Auto-dismiss toast after 6 seconds
    setTimeout(() => {
      setActiveToasts((prev) => prev.filter((t) => t.id !== id));
    }, 6000);
  }, []);

  const connectSSE = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const sseUrl = `${API_BASE}/events`;
    console.log(`[SSE Client] Connecting to: ${sseUrl}`);
    setStatus('connecting');

    const es = new EventSource(sseUrl, { withCredentials: false });
    eventSourceRef.current = es;

    es.onopen = () => {
      console.log('[SSE Client] Connection established');
      setStatus('connected');
    };

    es.onerror = (err) => {
      console.warn('[SSE Client] Connection error or disconnected. Retrying in 4s...', err);
      setStatus('error');
      es.close();

      // Clear any pending reconnect
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = setTimeout(() => {
        connectSSE();
      }, 4000);
    };

    // Standard listener for default 'message' if any
    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        addAlert({ event: 'message', message: data.message || 'System notification', ...data });
      } catch (e) {
        console.error('Failed to parse SSE message:', e);
      }
    };

    // Specific event listeners
    const eventTypes = [
      'connected',
      'history',
      'orderCreated',
      'orderStatusChanged',
      'orderCancelled',
      'orderUpdate',
      'systemAlert',
      'supportAgentAssigned',
    ];

    eventTypes.forEach((eventType) => {
      es.addEventListener(eventType, (e) => {
        try {
          const data = JSON.parse(e.data);
          console.log(`[SSE Client] Received Event "${eventType}":`, data);

          if (eventType === 'history' && Array.isArray(data.alerts)) {
            // Bulk insert prior alerts
            setAlerts((prev) => {
              const combined = [...data.alerts, ...prev];
              // De-duplicate by eventId
              const seen = new Set();
              return combined.filter((item) => {
                const key = item.eventId || item.id || JSON.stringify(item);
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
              });
            });
            return;
          }

          if (eventType === 'connected') {
            console.log('[SSE Client] Initial handshake confirmed:', data.message);
            return;
          }

          // Format nice titles based on event
          let title = data.title;
          let message = data.message;

          if (!title) {
            switch (eventType) {
              case 'orderCreated':
                title = '📦 New Order Placed';
                message = message || `Order #${data.orderId?.slice(-6)} placed for $${data.totalAmount}`;
                break;
              case 'orderStatusChanged':
                title = '🚚 Order Status Updated';
                message = message || `Order #${data.orderId?.slice(-6)} is now ${data.newStatus}`;
                break;
              case 'orderCancelled':
                title = '❌ Order Cancelled (JSON-RPC)';
                message = message || `Order #${data.orderId?.slice(-6)} was cancelled. Reason: ${data.reason}`;
                break;
              case 'supportAgentAssigned':
                title = '💬 Agent Assigned';
                message = message || `${data.agentName} joined support for Order #${data.orderId?.slice(-6)}`;
                break;
              default:
                title = '🔔 System Alert';
                message = message || 'Live alert notification';
            }
          }

          addAlert({
            event: eventType,
            title,
            message,
            ...data,
          });
        } catch (err) {
          console.error(`[SSE Client] Error parsing event "${eventType}":`, err);
        }
      });
    });
  }, [addAlert]);

  useEffect(() => {
    connectSSE();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connectSSE]);

  const dismissToast = (id) => {
    setActiveToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const clearAlerts = () => {
    setAlerts([]);
    setActiveToasts([]);
  };

  return (
    <SSEContext.Provider
      value={{
        status,
        isConnected: status === 'connected',
        alerts,
        activeToasts,
        dismissToast,
        clearAlerts,
        reconnect: connectSSE,
      }}
    >
      {children}
    </SSEContext.Provider>
  );
};

export const useSSE = () => {
  const context = useContext(SSEContext);
  if (!context) throw new Error('useSSE must be used within an SSEProvider');
  return context;
};
