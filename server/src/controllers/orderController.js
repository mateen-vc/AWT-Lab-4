import { Order, ORDER_STATUSES } from '../models/Order.js';
import { emitOrderStatusUpdated } from '../sockets/socketHandler.js';
import { sseManager } from '../sse/sseManager.js';

export const getOrders = async (req, res) => {
  try {
    const { customerId, status } = req.query;
    const filter = {};

    if (customerId) filter.customerId = customerId;
    if (status) filter.status = status;

    const orders = await Order.find(filter).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: {
        code: 'ORDERS_FETCH_ERROR',
        message: err.message,
      },
    });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ORDER_NOT_FOUND',
          message: `Order with ID ${req.params.id} was not found`,
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: order,
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_ORDER_ID',
        message: err.message,
      },
    });
  }
};

export const createOrder = async (req, res) => {
  try {
    const {
      customerId,
      customerName,
      customerEmail,
      items,
      totalAmount,
      shippingAddress,
    } = req.body;

    if (!customerId || !customerName) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'customerId and customerName are required',
        },
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Order must contain at least one item',
        },
      });
    }

    // Compute or verify total amount
    const computedTotal = items.reduce(
      (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1),
      0
    );
    const finalTotal = totalAmount !== undefined ? Number(totalAmount) : computedTotal;

    const order = await Order.create({
      customerId,
      customerName,
      customerEmail: customerEmail || `${customerName.toLowerCase().replace(/\s+/g, '.')}@example.com`,
      items,
      totalAmount: finalTotal,
      status: 'pending',
      shippingAddress: shippingAddress || {
        street: '742 Evergreen Terrace',
        city: 'Springfield',
        state: 'OR',
        zip: '97477',
      },
      statusHistory: [
        {
          status: 'pending',
          timestamp: new Date(),
          note: 'Order placed by customer via REST API',
          updatedBy: customerName,
        },
      ],
    });

    const orderId = order._id.toString();

    // 1. Emit Socket.io update
    emitOrderStatusUpdated(order);

    // 2. Broadcast SSE alerts
    sseManager.broadcast('orderCreated', {
      orderId,
      customerId,
      customerName,
      totalAmount: finalTotal,
      status: 'pending',
      itemsCount: items.length,
      title: 'New Order Received',
      message: `Order #${orderId.slice(-6)} placed by ${customerName} ($${finalTotal.toFixed(2)})`,
    });

    sseManager.broadcast('systemAlert', {
      type: 'order_created',
      orderId,
      message: `Order #${orderId.slice(-6)} created successfully`,
    });

    return res.status(201).json({
      success: true,
      data: order,
    });
  } catch (err) {
    console.error('[Create Order Error]:', err);
    return res.status(400).json({
      success: false,
      error: {
        code: 'ORDER_CREATION_FAILED',
        message: err.message,
      },
    });
  }
};

export const updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note, updatedBy } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Status field is required for PATCH update',
        },
      });
    }

    if (!ORDER_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATUS',
          message: `Status must be one of: ${ORDER_STATUSES.join(', ')}`,
        },
      });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ORDER_NOT_FOUND',
          message: `Order with ID ${id} was not found`,
        },
      });
    }

    const oldStatus = order.status;
    order.status = status;
    order.statusHistory.push({
      status,
      timestamp: new Date(),
      note: note || `Status transitioned from ${oldStatus} to ${status} via Support Agent REST API`,
      updatedBy: updatedBy || 'Support Agent',
    });

    await order.save();

    const orderId = order._id.toString();

    // 1. Emit Socket.io real-time update
    emitOrderStatusUpdated(order);

    // 2. Broadcast SSE event
    sseManager.broadcast('orderStatusChanged', {
      orderId,
      oldStatus,
      newStatus: status,
      customerName: order.customerName,
      title: `Order Status Updated`,
      message: `Order #${orderId.slice(-6)} changed from "${oldStatus}" to "${status}"`,
    });

    sseManager.broadcast('orderUpdate', {
      orderId,
      status,
    });

    return res.status(200).json({
      success: true,
      data: order,
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'ORDER_UPDATE_FAILED',
        message: err.message,
      },
    });
  }
};
