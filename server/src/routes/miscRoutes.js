import express from 'express';
import { User } from '../models/User.js';
import { Order } from '../models/Order.js';
import { ChatMessage } from '../models/ChatMessage.js';

const router = express.Router();

// GET /api/v1/users/demo
router.get('/users/demo', async (req, res) => {
  try {
    const users = await User.find({});
    return res.json({ success: true, data: users });
  } catch (err) {
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// GET /api/v1/support/rooms
router.get('/support/rooms', async (req, res) => {
  try {
    // Get unique roomIds from chat messages
    const roomIds = await ChatMessage.distinct('roomId');
    const rooms = await Promise.all(
      roomIds.map(async (roomId) => {
        const lastMsg = await ChatMessage.findOne({ roomId }).sort({ timestamp: -1 });
        const totalMsgs = await ChatMessage.countDocuments({ roomId });
        return {
          roomId,
          lastMessage: lastMsg?.message || '',
          senderName: lastMsg?.senderName || 'Anonymous',
          senderRole: lastMsg?.senderRole || 'customer',
          updatedAt: lastMsg?.timestamp || new Date(),
          totalMessages: totalMsgs,
        };
      })
    );

    rooms.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    return res.json({ success: true, data: rooms });
  } catch (err) {
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// GET /api/v1/stats
router.get('/stats', async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ status: 'pending' });
    const processingOrders = await Order.countDocuments({ status: { $in: ['confirmed', 'processing'] } });
    const shippedOrders = await Order.countDocuments({ status: { $in: ['shipped', 'out_for_delivery'] } });
    const deliveredOrders = await Order.countDocuments({ status: 'delivered' });
    const cancelledOrders = await Order.countDocuments({ status: 'cancelled' });

    return res.json({
      success: true,
      data: {
        totalOrders,
        pendingOrders,
        processingOrders,
        shippedOrders,
        deliveredOrders,
        cancelledOrders,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

export default router;
