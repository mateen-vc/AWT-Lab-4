/**
 * Server-Sent Events (SSE) Manager
 * Handles persistent client connections, heartbeats, reconnection, and live alert broadcasting.
 */

class SSEManager {
  constructor() {
    this.clients = new Set();
    this.recentAlerts = []; // Keep last 20 alerts for immediate hydration
    this.heartbeatInterval = null;
    this.startHeartbeat();
  }

  startHeartbeat() {
    // Keep-alive ping every 15 seconds to prevent cloud proxy timeouts (Render/Railway/NGINX)
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    this.heartbeatInterval = setInterval(() => {
      this.sendToAllRaw(': ping\n\n');
    }, 15000);
  }

  handleConnection(req, res) {
    const clientId = `sse_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    // Required SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Critical for NGINX/Render
      'Access-Control-Allow-Origin': req.headers.origin || '*',
      'Access-Control-Allow-Credentials': 'true',
    });

    res.flushHeaders?.();

    const client = {
      id: clientId,
      res,
      ip: req.ip || req.connection.remoteAddress,
      connectedAt: new Date(),
    };

    this.clients.add(client);
    console.log(`[SSE] Client connected: ${clientId}. Total active clients: ${this.clients.size}`);

    // Send initial greeting
    const welcomeData = {
      clientId,
      timestamp: new Date().toISOString(),
      message: 'Connected to live system alert stream',
      activeConnections: this.clients.size,
    };
    this.sendToClient(client, 'connected', welcomeData);

    // Send recent alerts history so client doesn't miss prior alerts upon reconnect
    if (this.recentAlerts.length > 0) {
      this.sendToClient(client, 'history', { alerts: this.recentAlerts.slice(-10) });
    }

    // Clean up on disconnect
    req.on('close', () => {
      this.clients.delete(client);
      console.log(`[SSE] Client disconnected: ${clientId}. Total active clients: ${this.clients.size}`);
    });
  }

  sendToClient(client, event, data) {
    try {
      const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
      client.res.write(payload);
    } catch (err) {
      console.error(`[SSE] Error writing to client ${client.id}:`, err.message);
      this.clients.delete(client);
    }
  }

  sendToAllRaw(rawData) {
    for (const client of this.clients) {
      try {
        client.res.write(rawData);
      } catch (err) {
        this.clients.delete(client);
      }
    }
  }

  /**
   * Broadcast an event to all connected SSE clients
   * @param {string} event - Event name (e.g. orderCreated, orderUpdate, orderCancelled, systemAlert)
   * @param {object} data - Payload object
   */
  broadcast(event, data) {
    const enrichedData = {
      ...data,
      eventId: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString(),
    };

    // Store in recent alerts
    this.recentAlerts.push({ event, ...enrichedData });
    if (this.recentAlerts.length > 50) {
      this.recentAlerts.shift();
    }

    console.log(`[SSE Broadcast] Event: "${event}", Payload:`, JSON.stringify(enrichedData));

    for (const client of this.clients) {
      this.sendToClient(client, event, enrichedData);
    }

    return enrichedData;
  }

  getClientCount() {
    return this.clients.size;
  }
}

export const sseManager = new SSEManager();
