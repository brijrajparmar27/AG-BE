require("dotenv").config();

module.exports = {
  port: process.env.PORT || 3000,
  mongoUri: process.env.MONGODB_URI || "mongodb://localhost:27017/insurance_db",
  nodeEnv: process.env.NODE_ENV || "development",
  corsOrigin: process.env.CORS_ORIGIN || "*",
  rateLimitWindow: process.env.RATE_LIMIT_WINDOW || 60 * 1000, // 1 minute
  rateLimitMax: process.env.RATE_LIMIT_MAX || 1000, // 1000 requests per minute
};
