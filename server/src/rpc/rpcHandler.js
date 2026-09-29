import { Order } from '../models/Order.js';
import { emitOrderStatusUpdated } from '../sockets/socketHandler.js';
import { sseManager } from '../sse/sseManager.js';

// JSON-RPC 2.0 Standard Error Codes
const RPC_ERRORS = {
  PARSE_ERROR: { code: -32700, message: 'Parse error' },
  INVALID_REQUEST: { code: -32600, message: 'Invalid Request' },
  METHOD_NOT_FOUND: { code: -32601, message: 'Method not found' },
  INVALID_PARAMS: { code: -32602, message: 'Invalid params' },
  INTERNAL_ERROR: { code: -32603, message: 'Internal error' },
  ORDER_NOT_FOUND: { code: -32004, message: 'Order not found' },
  CANNOT_CANCEL: { code: -32001, message: 'Order cannot be cancelled in its current state' },
};

/**
 * Handle JSON-RPC 2.0 POST /rpc
 */
export const handleRpc = async (req, res) => {
  const body = req.body;

  // Validate JSON-RPC 2.0 Request envelope
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return res.status(400).json({
      jsonrpc: '2.0',
      error: RPC_ERRORS.INVALID_REQUEST,
      id: null,
    });
  }

  const { jsonrpc, method, params, id } = body;

  if (jsonrpc !== '2.0') {
    return res.status(400).json({
      jsonrpc: '2.0',
      error: {
        code: -32600,
        message: 'Invalid Request: jsonrpc version must be "2.0"',
      },
      id: id ?? null,
    });
  }

  if (!method || typeof method !== 'string') {
    return res.status(400).json({
      jsonrpc: '2.0',
      error: RPC_ERRORS.METHOD_NOT_FOUND,
      id: id ?? null,
    });
  }

  try {
    let result;

    switch (method) {
      // 1. Mandatory cancelOrder
      case 'cancelOrder': {
        const orderId = params?.orderId;
        const reason = params?.reason || 'Customer requested cancellation via JSON-RPC';

        if (!orderId) {
          return res.json({
            jsonrpc: '2.0',
            error: {
              code: -32602,
              message: 'Invalid params: "orderId" is required',
            },
            id,
          });
        }

        const order = await Order.findById(orderId);
        if (!order) {
          return res.json({
            jsonrpc: '2.0',
            error: {
              ...RPC_ERRORS.ORDER_NOT_FOUND,
              data: { orderId },
            },
            id,
          });
        }

        if (order.status === 'delivered') {
          return res.json({
            jsonrpc: '2.0',
            error: {
              ...RPC_ERRORS.CANNOT_CANCEL,
              message: 'Cannot cancel an order that has already been delivered',
            },
            id,
          });
        }

        if (order.status === 'cancelled') {
          return res.json({
            jsonrpc: '2.0',
            result: {
              success: true,
              orderId,
              status: 'cancelled',
              message: 'Order was already cancelled',
            },
            id,
          });
        }

        // Apply cancellation
        order.status = 'cancelled';
        order.cancelReason = reason;
        order.statusHistory.push({
          status: 'cancelled',
          timestamp: new Date(),
          note: `Cancelled via JSON-RPC 2.0: ${reason}`,
          updatedBy: 'customer',
        });

        await order.save();

        // 1. Emit Socket.io real-time update
        emitOrderStatusUpdated(order);

        // 2. Broadcast SSE alerts to all connected listeners
        sseManager.broadcast('orderCancelled', {
          orderId: order._id.toString(),
          status: 'cancelled',
          reason,
          customerName: order.customerName,
          title: `Order #${order._id.toString().slice(-6)} Cancelled`,
          message: `Order #${order._id.toString().slice(-6)} was cancelled (${reason})`,
        });

        sseManager.broadcast('orderUpdate', {
          orderId: order._id.toString(),
          status: 'cancelled',
        });

        result = {
          success: true,
          orderId: order._id.toString(),
          status: 'cancelled',
          cancelReason: reason,
          updatedAt: order.updatedAt,
        };
        break;
      }

      // 2. getOrder
      case 'getOrder': {
        const orderId = params?.orderId;
        if (!orderId) {
          return res.json({
            jsonrpc: '2.0',
            error: { code: -32602, message: 'Invalid params: "orderId" is required' },
            id,
          });
        }

        const order = await Order.findById(orderId);
        if (!order) {
          return res.json({
            jsonrpc: '2.0',
            error: { ...RPC_ERRORS.ORDER_NOT_FOUND, data: { orderId } },
            id,
          });
        }

        result = {
          success: true,
          order,
        };
        break;
      }

      // 3. getOrderStatus
      case 'getOrderStatus': {
        const orderId = params?.orderId;
        if (!orderId) {
          return res.json({
            jsonrpc: '2.0',
            error: { code: -32602, message: 'Invalid params: "orderId" is required' },
            id,
          });
        }

        const order = await Order.findById(orderId, 'status updatedAt');
        if (!order) {
          return res.json({
            jsonrpc: '2.0',
            error: { ...RPC_ERRORS.ORDER_NOT_FOUND, data: { orderId } },
            id,
          });
        }

        result = {
          success: true,
          orderId: order._id.toString(),
          status: order.status,
          updatedAt: order.updatedAt,
        };
        break;
      }

      // 4. assignSupportAgent
      case 'assignSupportAgent': {
        const { orderId, agentId, agentName } = params || {};
        if (!orderId || !agentId) {
          return res.json({
            jsonrpc: '2.0',
            error: {
              code: -32602,
              message: 'Invalid params: "orderId" and "agentId" are required',
            },
            id,
          });
        }

        sseManager.broadcast('supportAgentAssigned', {
          orderId,
          agentId,
          agentName: agentName || 'Support Agent',
          message: `Agent ${agentName || agentId} assigned to order #${orderId.slice(-6)}`,
        });

        result = {
          success: true,
          orderId,
          agentId,
          agentName: agentName || 'Support Agent',
        };
        break;
      }

      default: {
        return res.json({
          jsonrpc: '2.0',
          error: {
            ...RPC_ERRORS.METHOD_NOT_FOUND,
            message: `Method "${method}" is not supported. Supported methods: cancelOrder, getOrder, getOrderStatus, assignSupportAgent`,
          },
          id,
        });
      }
    }

    return res.json({
      jsonrpc: '2.0',
      result,
      id,
    });
  } catch (err) {
    console.error(`[JSON-RPC Error] Method ${method}:`, err);
    return res.status(500).json({
      jsonrpc: '2.0',
      error: {
        ...RPC_ERRORS.INTERNAL_ERROR,
        data: err.message,
      },
      id,
    });
  }
};
