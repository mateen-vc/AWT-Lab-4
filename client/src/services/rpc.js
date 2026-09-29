const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');

let requestIdCounter = 1;

/**
 * Perform a standard JSON-RPC 2.0 call to POST /rpc
 * @param {string} method - JSON-RPC method name
 * @param {object} params - Method parameters
 * @returns {Promise<any>} - Returns result property if successful
 */
export async function callRpc(method, params = {}) {
  const id = ++requestIdCounter;
  const url = `${API_BASE}/rpc`;

  const payload = {
    jsonrpc: '2.0',
    method,
    params,
    id,
  };

  console.log(`[JSON-RPC Request] ID: ${id}, Method: "${method}", Params:`, params);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => null);

    if (!data) {
      throw new Error(`Empty response from JSON-RPC endpoint: HTTP ${response.status}`);
    }

    if (data.error) {
      console.error(`[JSON-RPC Error Response] ID: ${id}:`, data.error);
      const err = new Error(data.error.message || 'JSON-RPC Error');
      err.code = data.error.code;
      err.data = data.error.data;
      err.rpcPayload = payload;
      throw err;
    }

    console.log(`[JSON-RPC Success Response] ID: ${id}:`, data.result);
    return data.result;
  } catch (err) {
    console.error(`[JSON-RPC Exception] Method: "${method}":`, err);
    throw err;
  }
}

/**
 * Cancel an order using JSON-RPC 2.0 cancelOrder method (Deliverable 3 & Step 12)
 */
export const rpcCancelOrder = (orderId, reason = 'Customer cancelled via web interface') =>
  callRpc('cancelOrder', { orderId, reason });

/**
 * Fetch order details via JSON-RPC 2.0 getOrder method
 */
export const rpcGetOrder = (orderId) => callRpc('getOrder', { orderId });

/**
 * Fetch order status via JSON-RPC 2.0 getOrderStatus method
 */
export const rpcGetOrderStatus = (orderId) => callRpc('getOrderStatus', { orderId });

/**
 * Assign a support agent via JSON-RPC 2.0 assignSupportAgent method
 */
export const rpcAssignSupportAgent = (orderId, agentId, agentName) =>
  callRpc('assignSupportAgent', { orderId, agentId, agentName });
