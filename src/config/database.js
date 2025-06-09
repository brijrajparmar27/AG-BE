const { MongoClient } = require("mongodb");
const config = require("./config");
const logger = require("../utils/logger");

const client = new MongoClient(config.mongoUri);
let db = null;

async function connectToDatabase() {
  if (db) {
    return db;
  }

  try {
    await client.connect();
    // Extract database name from URI
    const dbName = config.mongoUri.split("/").pop().split("?")[0];
    db = client.db(dbName);
    logger.info(`Connected to MongoDB database: ${dbName}`);
    return db;
  } catch (error) {
    logger.error("Error connecting to MongoDB:", error);
    throw error;
  }
}

async function closeDatabaseConnection() {
  if (client) {
    try {
      await client.close();
      db = null;
      logger.info("MongoDB connection closed");
    } catch (error) {
      logger.error("Error closing MongoDB connection:", error);
      throw error;
    }
  }
}

// Handle application shutdown
process.on("SIGINT", async () => {
  await closeDatabaseConnection();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await closeDatabaseConnection();
  process.exit(0);
});

module.exports = {
  connectToDatabase,
  closeDatabaseConnection,
  getCollection: (collectionName) => {
    if (!db) {
      throw new Error("Database not connected");
    }
    return db.collection(collectionName);
  },
};
