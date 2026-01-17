/**
 * ============================================================
 * GRACEFUL SHUTDOWN WITH GRACE PERIOD – NODE.JS
 * Issue: No Grace Period for Rolling Restarts (#746)
 * ============================================================
 */

'use strict';

const express = require('express');
const http = require('http');

const app = express();
app.use(express.json());

/* ============================================================
   CONFIG
============================================================ */
const CONFIG = {
  PORT: process.env.PORT || 3000,
  GRACE_PERIOD_MS: 30 * 1000, // 30 seconds
};

/* ============================================================
   STATE
============================================================ */
let server;
let isShuttingDown = false;
let activeRequests = 0;

/* ============================================================
   REQUEST TRACKING MIDDLEWARE
============================================================ */
app.use((req, res, next) => {
  if (isShuttingDown) {
    return res.status(503).json({
      error: 'Server is restarting, please retry later',
    });
  }

  activeRequests++;

  res.on('finish', () => {
    activeRequests--;
  });

  next();
});

/* ============================================================
   SAMPLE ROUTES
============================================================ */
app.get('/api/data', async (req, res) => {
  await new Promise((r) => setTimeout(r, 500));
  res.json({ data: 'response' });
});

app.post('/api/process', async (req, res) => {
  await new Promise((r) => setTimeout(r, 2000));
  res.json({ status: 'processed' });
});

/* ============================================================
   HEALTH CHECK
============================================================ */
app.get('/health', (req, res) => {
  if (isShuttingDown) {
    return res.status(503).json({ status: 'draining' });
  }

  res.json({
    status: 'ok',
    activeRequests,
  });
});

/* ============================================================
   GRACEFUL SHUTDOWN LOGIC
============================================================ */
function shutdown(signal) {
  console.log(`🛑 Received ${signal}. Starting graceful shutdown...`);
  isShuttingDown = true;

  // Stop accepting new connections
  server.close(() => {
    console.log('✅ HTTP server closed');
  });

  const shutdownStart = Date.now();

  const interval = setInterval(() => {
    console.log(
      `⏳ Waiting for ${activeRequests} active request(s) to finish`
    );

    if (activeRequests === 0) {
      console.log('🎯 All requests completed. Exiting.');
      clearInterval(interval);
      process.exit(0);
    }

    if (Date.now() - shutdownStart > CONFIG.GRACE_PERIOD_MS) {
      console.log('⚠️ Grace period exceeded. Forcing shutdown.');
      clearInterval(interval);
      process.exit(1);
    }
  }, 1000);
}

/* ============================================================
   SIGNAL HANDLERS
============================================================ */
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

/* ============================================================
   SERVER START
============================================================ */
server = http.createServer(app);

server.listen(CONFIG.PORT, () => {
  console.log(
    `🚀 Server running on port ${CONFIG.PORT} (grace period: ${CONFIG.GRACE_PERIOD_MS}ms)`
  );
});
