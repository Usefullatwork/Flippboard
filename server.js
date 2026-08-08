import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Serve static files from Vite dist in production
app.use(express.static(path.join(__dirname, 'dist')));

let clients = [];

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

// Webhook Receiver
app.post('/api/webhook', (req, res) => {
  const payload = req.body;
  console.log('Received Webhook:', payload);

  const eventData = {
    type: 'webhook',
    data: payload
  };

  clients.forEach(client => {
    client.write(`data: ${JSON.stringify(eventData)}\n\n`);
  });

  res.status(200).json({ success: true, message: 'Webhook broadcasted to displays' });
});

app.listen(PORT, () => {
  console.log(`\n=== Flippboard Studio Backend Server ===`);
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Webhook URL: http://localhost:${PORT}/api/webhook\n`);
});
