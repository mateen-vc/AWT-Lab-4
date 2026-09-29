import { ChatMessage } from '../models/ChatMessage.js';
import { v4 as uuidv4 } from 'uuid';

export let ioInstance = null;

export const initSocketIO = (io) => {
  ioInstance = io;

  io.on('connection', (socket) => {
    console.log(`[Socket.io] Client connected: ${socket.id}`);

    // Join general updates or role rooms
    socket.on('registerUser', ({ userId, role, name }) => {
      socket.data = { userId, role, name };
      if (role === 'agent') {
        socket.join('support_agents');
        console.log(`[Socket.io] Agent joined support_agents room: ${name} (${userId})`);
      } else if (role === 'customer' && userId) {
        socket.join(`customer:${userId}`);
        console.log(`[Socket.io] Customer joined personal room: customer:${userId}`);
      }
    });

    // Join order-specific tracking room
    socket.on('joinOrderRoom', ({ orderId }) => {
      if (orderId) {
        socket.join(`order:${orderId}`);
        console.log(`[Socket.io] Socket ${socket.id} joined order:${orderId}`);
      }
    });

    socket.on('leaveOrderRoom', ({ orderId }) => {
      if (orderId) {
        socket.leave(`order:${orderId}`);
        console.log(`[Socket.io] Socket ${socket.id} left order:${orderId}`);
      }
    });

    // Support Chat: Join 1-on-1 private room
    socket.on('joinSupportRoom', async ({ roomId, userId, userName, userRole }) => {
      if (!roomId) return;

      socket.join(roomId);
      socket.data = { ...socket.data, userId, userName, userRole, currentRoom: roomId };
      console.log(`[Socket.io] ${userRole} ${userName} (${userId}) joined room: ${roomId}`);

      const eventPayload = {
        roomId,
        userId,
        userName,
        userRole,
        timestamp: new Date().toISOString(),
      };

      if (userRole === 'agent') {
        socket.to(roomId).emit('agentJoined', {
          agentId: userId,
          agentName: userName,
          roomId,
          timestamp: new Date().toISOString(),
        });
      } else {
        socket.to(roomId).emit('customerJoined', {
          customerId: userId,
          customerName: userName,
          roomId,
          timestamp: new Date().toISOString(),
        });
      }

      // Fetch prior room messages from DB
      try {
        const history = await ChatMessage.find({ roomId }).sort({ timestamp: 1 }).limit(50);
        socket.emit('chatHistory', { roomId, messages: history });
      } catch (err) {
        console.error('[Socket.io] Error fetching chat history:', err.message);
      }
    });

    // Support Chat: Send message
    socket.on('sendMessage', async (payload) => {
      const {
        roomId,
        senderId,
        senderName,
        senderRole,
        message,
        messageId = uuidv4(),
      } = payload;

      if (!roomId || !message?.trim()) return;

      const messageDoc = {
        messageId,
        roomId,
        senderId,
        senderName: senderName || 'User',
        senderRole: senderRole || 'customer',
        message: message.trim(),
        timestamp: new Date(),
      };

      try {
        await ChatMessage.create(messageDoc);
      } catch (err) {
        console.error('[Socket.io] Failed to persist message to DB:', err.message);
      }

      // Broadcast to EVERYONE in the room including sender
      io.to(roomId).emit('messageReceived', {
        ...messageDoc,
        timestamp: messageDoc.timestamp.toISOString(),
      });

      console.log(`[Socket.io] Message broadcast to room ${roomId} by ${senderName}: ${message}`);
    });

    // Support Chat: Typing Indicators
    socket.on('typingStart', ({ roomId, userId, userName, userRole }) => {
      if (!roomId) return;
      socket.to(roomId).emit('userTyping', {
        roomId,
        userId,
        userName,
        userRole,
      });
    });

    socket.on('typingStop', ({ roomId, userId, userName }) => {
      if (!roomId) return;
      socket.to(roomId).emit('userStoppedTyping', {
        roomId,
        userId,
        userName,
      });
    });

    // Leave support room
    socket.on('leaveSupportRoom', ({ roomId }) => {
      if (roomId) {
        socket.leave(roomId);
        console.log(`[Socket.io] Socket ${socket.id} left room ${roomId}`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.io] Client disconnected: ${socket.id}`);
    });
  });
};

/**
 * Broadcast order status update across multiple targets
 * (order room, customer room, support agents, and global fallback)
 */
export const emitOrderStatusUpdated = (order) => {
  if (!ioInstance) {
    console.warn('[Socket.io] ioInstance not ready yet for emitOrderStatusUpdated');
    return;
  }

  const orderId = order._id?.toString() || order.id?.toString();
  const payload = {
    orderId,
    status: order.status,
    updatedAt: order.updatedAt ? new Date(order.updatedAt).toISOString() : new Date().toISOString(),
    customerId: order.customerId,
    order,
  };

  console.log(`[Socket.io] Emitting orderStatusUpdated for order ${orderId} -> ${order.status}`);

  // Emit to specific order room
  ioInstance.to(`order:${orderId}`).emit('orderStatusUpdated', payload);

  // Emit to the customer's personal channel
  if (order.customerId) {
    ioInstance.to(`customer:${order.customerId}`).emit('orderStatusUpdated', payload);
  }

  // Emit to all support agents
  ioInstance.to('support_agents').emit('orderStatusUpdated', payload);

  // Also broadcast to root so any open tracking view receives it
  ioInstance.emit('orderStatusUpdated', payload);
};
