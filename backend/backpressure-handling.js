/**
 * ============================================================
 * BACKPRESSURE HANDLING FOR HIGH TRAFFIC – NODE.JS
 * Issue: Missing Backpressure Handling for High Traffic (#742)
 * ============================================================
 */

'use strict';

const express = require('express');
const crypto = require('crypto');

const app = express();
app.use(express.json());

/* ============================================================
   CONFIG
============================================================ */
const CONFIG = {
  PORT: process.env.PORT || 3000,

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: 60 * 1000,
  RATE_LIMIT_MAX_REQUESTS: 100,

  // Queue / concurrency control
  MAX_CONCURRENT_JOBS: 10,
  MAX_QUEUE_SIZE: 50,

  // Simulated downstream latency
  DOWNSTREAM_LATENCY_MS: 200,
};

/* ============================================================
   SIMPLE RATE LIMITER (IN-MEMORY)
============================================================ */
const rateLimitStore = new Map();

function rateLimiter(req, res, next) {
  const key = req.ip;
  const now = Date.now();

  const entry = rateLimitStore.get(key) || {
    count: 0,
    windowStart: now,
  };

  if (now - entry.windowStart > CONFIG.RATE_LIMIT_WINDOW_MS) {
    entry.count = 0;
    entry.windowStart = now;
  }

  entry.count++;
  rateLimitStore.set(key, entry);

  if (entry.count > CONFIG.RATE_LIMIT_MAX_REQUESTS) {
    return res.status(429).json({
      error: 'Too many requests, please try again later',
    });
  }

  next();
}

/* ============================================================
   BOUNDED QUEUE WITH CONCURRENCY LIMIT
============================================================ */
class JobQueue {
  constructor(maxConcurrent, maxQueue) {
    this.maxConcurrent = maxConcurrent;
    this.maxQueue = maxQueue;
    this.running = 0;
    this.queue = [];
  }

  enqueue(job) {
    if (this.queue.length >= this.maxQueue) {
      return false;
    }

    this.queue.push(job);
    this.process();
    return true;
  }

  async process() {
    if (this.running >= this.maxConcurrent) return;
    const job = this.queue.shift();
    if (!job) return;

    this.running++;
    try {
      await job();
    } finally {
      this.running--;
      this.process();
    }
  }

  stats() {
    return {
      running: this.running,
      queued: this.queue.length,
      maxConcurrent: this.maxConcurrent,
      maxQueue: this.maxQueue,
    };
  }
}

const jobQueue = new JobQueue(
  CONFIG.MAX_CONCURRENT_JOBS,
  CONFIG.MAX_QUEUE_SIZE
);

/* ============================================================
   SIMULATED DOWNSTREAM SERVICE
============================================================ */
function simulateDownstreamWork() {
  return new Promise((resolve) =>
    setTimeout(resolve, CONFIG.DOWNSTREAM_LATENCY_MS)
  );
}

/* ============================================================
   REQUEST HANDLER WITH BACKPRESSURE
============================================================ */
app.post('/api/process', rateLimiter, (req, res) => {
  const requestId = crypto.randomUUID();

  const accepted = jobQueue.enqueue(async () => {
    await simulateDownstreamWork();
    console.log(`✅ Processed request ${requestId}`);
  });

  if (!accepted) {
    return res.status(503).json({
      error: 'Server overloaded, request rejected',
    });
  }

  res.status(202).json({
    message: 'Request accepted for processing',
    requestId,
  });
});

/* ============================================================
   FAST ENDPOINT (NO QUEUE)
============================================================ */
app.get('/api/ping', rateLimiter, (req, res) => {
  res.json({ pong: true });
});

/* ============================================================
   QUEUE / LOAD METRICS
============================================================ */
app.get('/metrics/backpressure', (req, res) => {
  res.json({
    rateLimit: {
      windowMs: CONFIG.RATE_LIMIT_WINDOW_MS,
      maxRequests: CONFIG.RATE_LIMIT_MAX_REQUESTS,
    },
    queue: jobQueue.stats(),
  });
});

/* ============================================================
   HEALTH
============================================================ */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    queue: jobQueue.stats(),
  });
});

/* ============================================================
   GRACEFUL SHUTDOWN
============================================================ */
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

/* ============================================================
   SERVER
============================================================ */
app.listen(CONFIG.PORT, () => {
  console.log(
    `🚀 Backpressure-enabled server running on port ${CONFIG.PORT}`
  );
});
