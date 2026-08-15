import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
// Optional shared secret: when set, webhooks must send x-webhook-token
const WEBHOOK_TOKEN = process.env.WEBHOOK_TOKEN || null;
const MAX_MESSAGE_LENGTH = 500;

app.use(cors());
app.use(express.json());

// Serve static files from Vite dist in production
app.use(express.static(path.join(__dirname, 'dist')));

let clients = [];

function broadcast(eventData) {
  const frame = `data: ${JSON.stringify(eventData)}\n\n`;
  clients = clients.filter(client => {
    try {
      client.write(frame);
      return true;
    } catch (e) {
      return false; // prune dead sockets the close-handler missed
    }
  });
}

// SSE Endpoint for Live Updates (Webhooks)
app.get('/api/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  res.write(`data: ${JSON.stringify({ type: 'connected', message: 'SSE connection established' })}\n\n`);

  clients.push(res);

  req.on('close', () => {
    clients = clients.filter(client => client !== res);
  });
});

// Keep idle SSE connections alive through proxies
setInterval(() => broadcast({ type: 'ping' }), 30000);

// Webhook Receiver
app.post('/api/webhook', (req, res) => {
  if (WEBHOOK_TOKEN && req.headers['x-webhook-token'] !== WEBHOOK_TOKEN) {
    return res.status(401).json({ success: false, error: 'Invalid or missing x-webhook-token header' });
  }

  const text = req.body?.text;
  if (typeof text !== 'string' || text.length === 0 || text.length > MAX_MESSAGE_LENGTH) {
    return res.status(400).json({
      success: false,
      error: `Payload must be {"text": "..."} with 1-${MAX_MESSAGE_LENGTH} characters`
    });
  }

  console.log(`Received webhook (${text.length} chars)`);
  broadcast({ type: 'webhook', data: { text } });

  res.status(200).json({ success: true, message: 'Webhook broadcasted to displays' });
});

// Also imported by electron/main.js — error handling stays with the caller
export function startServer(port = PORT) {
  return app.listen(port, () => {
    console.log(`\n=== Flippboard Studio Backend Server ===`);
    console.log(`Server running on http://localhost:${port}`);
    console.log(`Webhook URL: http://localhost:${port}/api/webhook\n`);
  });
}

// CLI: `node server.js` behaves exactly as before
import { pathToFileURL } from 'url';
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  startServer().on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use — is another Flippboard server running?`);
    } else {
      console.error('Server failed to start:', err.message);
    }
    process.exit(1);
  });
}
