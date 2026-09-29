import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

const SOCKET_URL = (import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000').replace(/\/$/, '');

export const SocketProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastOrderUpdate, setLastOrderUpdate] = useState(null);
  const [activeSupportRoom, setActiveSupportRoom] = useState(null);
  const [roomMessages, setRoomMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});
  const listenersRef = useRef(new Set());

  useEffect(() => {
    const socketInstance = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketInstance.on('connect', () => {
      console.log(`[Socket.io] Connected with ID: ${socketInstance.id}`);
      setIsConnected(true);

      // Register role and profile
      if (currentUser) {
        socketInstance.emit('registerUser', {
          userId: currentUser.id,
          role: currentUser.role,
          name: currentUser.name,
        });
      }
    });

    socketInstance.on('disconnect', (reason) => {
      console.log(`[Socket.io] Disconnected: ${reason}`);
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      console.warn(`[Socket.io] Connection error:`, error.message);
      setIsConnected(false);
    });

    // Real-Time Order Status Update (Deliverable 2A & Step 6)
    socketInstance.on('orderStatusUpdated', (data) => {
      console.log('[Socket.io Client] Received orderStatusUpdated:', data);
      setLastOrderUpdate(data);
      // Trigger all custom subscribers
      listenersRef.current.forEach((cb) => {
        try {
          cb(data);
        } catch (e) {
          console.error('Error in order update callback:', e);
        }
      });
    });

    // Chat events (Deliverable 2B & Step 9)
    socketInstance.on('messageReceived', (message) => {
      console.log('[Socket.io Client] Message received:', message);
      setRoomMessages((prev) => {
        // Prevent duplicates
        if (prev.some((m) => m.messageId === message.messageId)) return prev;
        return [...prev, message];
      });
    });

    socketInstance.on('chatHistory', ({ roomId, messages }) => {
      console.log(`[Socket.io Client] Loaded ${messages.length} messages for room:`, roomId);
      setRoomMessages(messages);
    });

    socketInstance.on('userTyping', ({ userId, userName, userRole }) => {
      if (userId === currentUser?.id) return;
      setTypingUsers((prev) => ({
        ...prev,
        [userId]: { userName, userRole, timestamp: Date.now() },
      }));
    });

    socketInstance.on('userStoppedTyping', ({ userId }) => {
      setTypingUsers((prev) => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [currentUser?.id, currentUser?.role]);

  // Clean up stale typing indicators
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      setTypingUsers((prev) => {
        let changed = false;
        const next = { ...prev };
        for (const [id, val] of Object.entries(next)) {
          if (now - val.timestamp > 4000) {
            delete next[id];
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  const subscribeToOrderUpdates = (callback) => {
    listenersRef.current.add(callback);
    return () => {
      listenersRef.current.delete(callback);
    };
  };

  const joinOrderRoom = (orderId) => {
    if (socket && orderId) {
      socket.emit('joinOrderRoom', { orderId });
    }
  };

  const leaveOrderRoom = (orderId) => {
    if (socket && orderId) {
      socket.emit('leaveOrderRoom', { orderId });
    }
  };

  const joinSupportRoom = (roomId) => {
    if (!socket || !roomId) return;
    setActiveSupportRoom(roomId);
    setRoomMessages([]);
    socket.emit('joinSupportRoom', {
      roomId,
      userId: currentUser?.id,
      userName: currentUser?.name,
      userRole: currentUser?.role,
    });
  };

  const leaveSupportRoom = (roomId) => {
    if (socket && roomId) {
      socket.emit('leaveSupportRoom', { roomId });
      if (activeSupportRoom === roomId) {
        setActiveSupportRoom(null);
      }
    }
  };

  const sendMessage = (text, targetRoomId) => {
    const roomId = targetRoomId || activeSupportRoom;
    if (!socket || !roomId || !text?.trim()) return;

    socket.emit('sendMessage', {
      roomId,
      senderId: currentUser?.id,
      senderName: currentUser?.name,
      senderRole: currentUser?.role,
      message: text.trim(),
    });
  };

  const sendTypingStart = (targetRoomId) => {
    const roomId = targetRoomId || activeSupportRoom;
    if (socket && roomId) {
      socket.emit('typingStart', {
        roomId,
        userId: currentUser?.id,
        userName: currentUser?.name,
        userRole: currentUser?.role,
      });
    }
  };

  const sendTypingStop = (targetRoomId) => {
    const roomId = targetRoomId || activeSupportRoom;
    if (socket && roomId) {
      socket.emit('typingStop', {
        roomId,
        userId: currentUser?.id,
        userName: currentUser?.name,
      });
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        lastOrderUpdate,
        subscribeToOrderUpdates,
        joinOrderRoom,
        leaveOrderRoom,
        activeSupportRoom,
        roomMessages,
        typingUsers,
        joinSupportRoom,
        leaveSupportRoom,
        sendMessage,
        sendTypingStart,
        sendTypingStop,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket must be used within a SocketProvider');
  return context;
};
