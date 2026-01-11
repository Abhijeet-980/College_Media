const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

const { initDB } = require("./config/db");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
const resumeRoutes = require("./routes/resume");
const uploadRoutes = require("./routes/upload");
const { globalLimiter, authLimiter } = require("./middleware/rateLimiter");

// ✅ FIXED: CommonJS import
const { slidingWindowLimiter } = require("./middleware/slidingWindowLimiter");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ------------------
// 🔐 GLOBAL MIDDLEWARES
// ------------------
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ------------------
// 🔁 API VERSION HANDLING (Backward Compatibility)
// ------------------
app.use((req, res, next) => {
  // Default version = v1 (old clients safe)
  req.apiVersion = req.headers["x-api-version"] || "v1";
  res.setHeader("X-API-Version", req.apiVersion);
  next();
});

// ------------------
// ⏱️ RATE LIMITING
// ------------------

// 🔥 Sliding Window Rate Limiter (smooth traffic control)
app.use("/api", slidingWindowLimiter);

// ✅ Global fixed limiter (legacy + extra protection)
app.use("/api", globalLimiter);

// ------------------
// 📁 STATIC FILES
// ------------------
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ------------------
// ❤️ HEALTH CHECK
// ------------------
app.get("/", (req, res) => {
  res.json({
    success: true,
    apiVersion: req.apiVersion,
    message: "College Media API is running!",
  });
});

// ------------------
// 🚀 START SERVER
// ------------------
const startServer = async () => {
  let dbConnection;

  try {
    dbConnection = await initDB();
    app.set("dbConnection", dbConnection);
    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Database initialization error:", error);
    dbConnection = { useMongoDB: false, mongoose: null };
    app.set("dbConnection", dbConnection);
    console.log("Using file-based database as fallback");
  }

  // ------------------
  // 🔐 ROUTES (VERSION-SAFE)
  // ------------------

  // 🔥 Strict auth rate limit (login / otp)
  app.use("/api/auth", authLimiter, require("./routes/auth"));

  // Other APIs (backward compatible)
  app.use("/api/users", require("./routes/users"));
  app.use("/api/resume", resumeRoutes);
  app.use("/api/upload", uploadRoutes);
  app.use("/api/messages", require("./routes/messages"));
  app.use("/api/account", require("./routes/account"));

  // ------------------
  // ❌ ERROR HANDLERS
  // ------------------
  app.use(notFound);
  app.use(errorHandler);

  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
};

startServer();
