/**
 * Real-Time Server-Sent Events (SSE) EventHub Service
 * - Per-client heartbeat (25s) keeps proxies/Nginx from idling out the stream
 * - Robust client cleanup on req/res close, error, or failed write
 */

const HEARTBEAT_INTERVAL_MS = 25000;

class EventHubService {
  constructor() {
    // Map<response, { heartbeat: NodeJS.Timeout }>
    this.clients = new Map();
  }

  registerClient(req, res) {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no'
    });
    if (typeof res.flushHeaders === 'function') res.flushHeaders();

    res.write('data: {"type":"CONNECTED","message":"Live SSE stream connected"}\n\n');

    const heartbeat = setInterval(() => {
      try {
        // SSE comment ping + typed PING so strict clients can filter either
        res.write(': ping\n\n');
        res.write(`data: {"type":"PING","timestamp":"${new Date().toISOString()}"}\n\n`);
      } catch (e) {
        this.removeClient(res);
      }
    }, HEARTBEAT_INTERVAL_MS);
    // Don't let the heartbeat alone keep the process alive
    if (typeof heartbeat.unref === 'function') heartbeat.unref();

    this.clients.set(res, { heartbeat });

    const cleanup = () => this.removeClient(res);
    req.on('close', cleanup);
    res.on('close', cleanup);
    res.on('error', cleanup);
  }

  removeClient(res) {
    const entry = this.clients.get(res);
    if (!entry) return;
    try {
      clearInterval(entry.heartbeat);
    } catch (e) {}
    this.clients.delete(res);
    try {
      if (!res.writableEnded) res.end();
    } catch (e) {}
  }

  broadcast(eventType, payload) {
    const data = JSON.stringify({
      type: eventType,
      data: payload,
      timestamp: new Date().toISOString()
    });

    for (const [client] of this.clients) {
      try {
        const ok = client.write(`data: ${data}\n\n`);
        // Backpressure: if kernel buffer is full, drop dead/slow client
        if (ok === false) {
          client.once('drain', () => {});
        }
      } catch (e) {
        this.removeClient(client);
      }
    }
  }

  getActiveConnections() {
    return this.clients.size;
  }
}

export const eventHub = new EventHubService();
