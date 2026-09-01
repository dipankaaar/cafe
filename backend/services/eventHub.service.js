/**
 * Real-Time Server-Sent Events (SSE) EventHub Service
 */
class EventHubService {
  constructor() {
    this.clients = new Set();
  }

  registerClient(req, res) {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no'
    });

    res.write('data: {"type":"CONNECTED","message":"Live SSE stream connected"}\n\n');

    this.clients.add(res);

    req.on('close', () => {
      this.clients.delete(res);
    });
  }

  broadcast(eventType, payload) {
    const data = JSON.stringify({
      type: eventType,
      data: payload,
      timestamp: new Date().toISOString()
    });

    this.clients.forEach((client) => {
      try {
        client.write(`data: ${data}\n\n`);
      } catch (e) {
        this.clients.delete(client);
      }
    });
  }

  getActiveConnections() {
    return this.clients.size;
  }
}

export const eventHub = new EventHubService();
