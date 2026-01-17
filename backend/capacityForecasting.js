/**
 * capacityForecasting.js
 * ----------------------
 * Automated capacity forecasting using historical metrics.
 * Predicts future resource exhaustion and raises alerts.
 *
 * Tech: Node.js + Express
 */

const express = require("express");
const os = require("os");

const app = express();

/* -----------------------------
   CONFIGURATION
--------------------------------*/

const COLLECTION_INTERVAL_MS = 10000; // 10 seconds
const FORECAST_INTERVAL_MS = 30000; // 30 seconds
const MAX_HISTORY = 500;

const THRESHOLDS = {
  cpu: 80,      // %
  memory: 75,   // %
  traffic: 1000 // requests
};

/* -----------------------------
   METRICS STORAGE
--------------------------------*/

let metricsHistory = [];

/* -----------------------------
   METRIC COLLECTION
--------------------------------*/

function collectMetrics() {
  const cpuLoad = os.loadavg()[0] * 10; // approx %
  const totalMem = os.totalmem();
  const freeMem = os.freemem();

  const memoryUsage =
    ((totalMem - freeMem) / totalMem) * 100;

  const traffic = Math.floor(Math.random() * 1200); // mock traffic

  const dataPoint = {
    timestamp: Date.now(),
    cpu: Number(cpuLoad.toFixed(2)),
    memory: Number(memoryUsage.toFixed(2)),
    traffic
  };

  metricsHistory.push(dataPoint);

  if (metricsHistory.length > MAX_HISTORY) {
    metricsHistory.shift();
  }

  console.log("📊 Collected Metrics:", dataPoint);
}

/* -----------------------------
   FORECASTING LOGIC
--------------------------------*/

function calculateTrend(values) {
  if (values.length < 2) return 0;

  let totalChange = 0;

  for (let i = 1; i < values.length; i++) {
    totalChange += values[i] - values[i - 1];
  }

  return totalChange / (values.length - 1);
}

function forecastNextValue(values) {
  const trend = calculateTrend(values);
  const lastValue = values[values.length - 1];
  return lastValue + trend;
}

/* -----------------------------
   ALERTING
--------------------------------*/

function raiseAlert(type, current, predicted) {
  console.error("🚨 CAPACITY ALERT 🚨");
  console.error(`Metric: ${type}`);
  console.error(`Current: ${current}`);
  console.error(`Predicted: ${predicted}`);
  console.error(`Host: ${os.hostname()}`);
  console.error(`Time: ${new Date().toISOString()}`);
}

/* -----------------------------
   FORECAST EVALUATION
--------------------------------*/

function evaluateForecast() {
  if (metricsHistory.length < 10) return;

  const cpuValues = metricsHistory.map(m => m.cpu);
  const memValues = metricsHistory.map(m => m.memory);
  const trafficValues = metricsHistory.map(m => m.traffic);

  const cpuForecast = forecastNextValue(cpuValues);
  const memForecast = forecastNextValue(memValues);
  const trafficForecast = forecastNextValue(trafficValues);

  console.log("🔮 Forecast:");
  console.log(
    `CPU=${cpuForecast.toFixed(2)}% | MEM=${memForecast.toFixed(
      2
    )}% | TRAFFIC=${trafficForecast}`
  );

  if (cpuForecast > THRESHOLDS.cpu) {
    raiseAlert("CPU", cpuValues.at(-1), cpuForecast);
  }

  if (memForecast > THRESHOLDS.memory) {
    raiseAlert("Memory", memValues.at(-1), memForecast);
  }

  if (trafficForecast > THRESHOLDS.traffic) {
    raiseAlert("Traffic", trafficValues.at(-1), trafficForecast);
  }
}

/* -----------------------------
   SCHEDULERS
--------------------------------*/

setInterval(collectMetrics, COLLECTION_INTERVAL_MS);
setInterval(evaluateForecast, FORECAST_INTERVAL_MS);

/* -----------------------------
   API ENDPOINTS
--------------------------------*/

app.get("/metrics/history", (req, res) => {
  res.json(metricsHistory);
});

app.get("/metrics/forecast", (req, res) => {
  if (metricsHistory.length < 10) {
    return res.json({
      message: "Not enough data for forecasting"
    });
  }

  const cpu = forecastNextValue(metricsHistory.map(m => m.cpu));
  const memory = forecastNextValue(
    metricsHistory.map(m => m.memory)
  );
  const traffic = forecastNextValue(
    metricsHistory.map(m => m.traffic)
  );

  res.json({
    forecast: {
      cpu: cpu.toFixed(2),
      memory: memory.toFixed(2),
      traffic: Math.round(traffic)
    }
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    collectedSamples: metricsHistory.length
  });
});

/* -----------------------------
   SERVER START
--------------------------------*/

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(
    `🚀 Capacity Forecasting Service running on port ${PORT}`
  );
});

/* -----------------------------
   END OF FILE
--------------------------------*/
