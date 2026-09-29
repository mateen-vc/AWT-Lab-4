/**
 * Automated Multi-Protocol Integration Verification Script
 * Tests REST, JSON-RPC 2.0, Socket.io, and SSE endpoints.
 */

import { io } from 'socket.io-client';

const BASE_URL = 'http://localhost:5000';

async function runTests() {
  console.log('====================================================');
  console.log('🧪 Starting Automated Multi-Protocol Integration Test');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  const assert = (condition, message) => {
    if (condition) {
      console.log(`✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${message}`);
      failed++;
    }
  };

  try {
    // Test 1: Health Check
    console.log('--- Step 1: Health Check ---');
    const healthRes = await fetch(`${BASE_URL}/health`).then((r) => r.json());
    assert(healthRes.status === 'ok' && healthRes.service === 'order-tracker-api', 'Health check returns status ok');

    // Test 2: REST GET Products
    console.log('\n--- Step 2: REST Catalog ---');
    const prodRes = await fetch(`${BASE_URL}/api/v1/products`).then((r) => r.json());
    assert(prodRes.success === true && Array.isArray(prodRes.data) && prodRes.data.length > 0, `REST GET /api/v1/products returned ${prodRes.data?.length} products`);
    const sampleProduct = prodRes.data[0];

    // Test 3: REST POST Create Order
    console.log('\n--- Step 3: REST Create Order ---');
    const createRes = await fetch(`${BASE_URL}/api/v1/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerId: 'cust_01',
        customerName: 'Alex Johnson',
        items: [
          {
            productId: sampleProduct._id,
            name: sampleProduct.name,
            price: sampleProduct.price,
            quantity: 1,
          },
        ],
        totalAmount: sampleProduct.price,
      }),
    }).then((r) => r.json());

    assert(createRes.success === true && createRes.data?.status === 'pending', 'REST POST /api/v1/orders created order in pending status');
    const newOrderId = createRes.data?._id;

    // Test 4: Socket.io Client Connection & Live Update
    console.log('\n--- Step 4: Socket.io Real-Time Updates ---');
    const socket = io(BASE_URL, { transports: ['websocket'] });
    let socketReceivedUpdate = false;

    await new Promise((resolve) => {
      socket.on('connect', () => {
        assert(socket.connected, `Socket.io connected with id: ${socket.id}`);
        socket.emit('registerUser', { userId: 'agent_01', role: 'agent', name: 'Agent Marcus' });

        socket.on('orderStatusUpdated', (data) => {
          if (data.orderId === newOrderId) {
            socketReceivedUpdate = true;
            console.log(`📡 [Socket.io Event Received] orderStatusUpdated: Order ${data.orderId} -> ${data.status}`);
          }
        });
        resolve();
      });
    });

    // Test 5: REST PATCH Update Order Status
    console.log('\n--- Step 5: REST PATCH Order Status ---');
    const patchRes = await fetch(`${BASE_URL}/api/v1/orders/${newOrderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'shipped',
        note: 'Order shipped via Express Courier',
        updatedBy: 'Agent Marcus Ray',
      }),
    }).then((r) => r.json());

    assert(patchRes.success === true && patchRes.data?.status === 'shipped', 'REST PATCH updated order status to "shipped"');

    // Wait 500ms for socket propagation
    await new Promise((r) => setTimeout(r, 600));
    assert(socketReceivedUpdate === true, 'Socket.io received orderStatusUpdated in real-time without polling');

    // Test 6: JSON-RPC 2.0 cancelOrder
    console.log('\n--- Step 6: JSON-RPC 2.0 cancelOrder ---');
    const rpcRes = await fetch(`${BASE_URL}/rpc`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'cancelOrder',
        params: {
          orderId: newOrderId,
          reason: 'Automated test suite cancellation',
        },
        id: 101,
      }),
    }).then((r) => r.json());

    assert(
      rpcRes.jsonrpc === '2.0' &&
      rpcRes.result?.success === true &&
      rpcRes.result?.status === 'cancelled' &&
      rpcRes.id === 101,
      'JSON-RPC 2.0 cancelOrder returned valid 2.0 result with status "cancelled"'
    );

    // Test 7: JSON-RPC 2.0 Error Handling
    console.log('\n--- Step 7: JSON-RPC 2.0 Error Handling ---');
    const rpcErrRes = await fetch(`${BASE_URL}/rpc`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'nonExistentMethod',
        params: {},
        id: 102,
      }),
    }).then((r) => r.json());

    assert(
      rpcErrRes.jsonrpc === '2.0' &&
      rpcErrRes.error?.code === -32601 &&
      rpcErrRes.id === 102,
      'JSON-RPC 2.0 returned standard Method Not Found error (-32601)'
    );

    // Test 8: Socket.io 1-on-1 Chat
    console.log('\n--- Step 8: Socket.io 1-on-1 Support Chat ---');
    let chatMessageReceived = false;
    const testRoom = `support:cust_01:agent_01`;

    await new Promise((resolve) => {
      socket.emit('joinSupportRoom', {
        roomId: testRoom,
        userId: 'agent_01',
        userName: 'Agent Marcus',
        userRole: 'agent',
      });

      socket.on('messageReceived', (msg) => {
        if (msg.roomId === testRoom && msg.message === 'Hello from test suite!') {
          chatMessageReceived = true;
          resolve();
        }
      });

      // Send chat message
      setTimeout(() => {
        socket.emit('sendMessage', {
          roomId: testRoom,
          senderId: 'agent_01',
          senderName: 'Agent Marcus',
          senderRole: 'agent',
          message: 'Hello from test suite!',
        });
      }, 200);

      setTimeout(resolve, 2000);
    });

    assert(chatMessageReceived === true, 'Socket.io private room chat message sent and received successfully');

    socket.disconnect();

    console.log('\n====================================================');
    console.log(`🎉 Automated Protocol Test Finished!`);
    console.log(`Passed: ${passed} | Failed: ${failed}`);
    console.log('====================================================');

    process.exit(failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('Test execution failed with unhandled error:', error);
    process.exit(1);
  }
}

runTests();
