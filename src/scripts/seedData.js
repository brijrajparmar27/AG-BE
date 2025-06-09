const { MongoClient } = require("mongodb");
const config = require("../config/config");
const logger = require("../utils/logger");

const samplePolicies = [
  {
    policy_number: "POL001",
    named_insured: "Acme Corporation",
    line_of_business: "Commercial Auto",
    status: "ACTIVE",
    effective_date: new Date("2024-01-01"),
    expiration_date: new Date("2025-01-01"),
    premium: 5000.0,
  },
  {
    policy_number: "POL002",
    named_insured: "XYZ Industries",
    line_of_business: "General Liability",
    status: "PENDING",
    effective_date: new Date("2024-02-01"),
    expiration_date: new Date("2025-02-01"),
    premium: 7500.0,
  },
  {
    policy_number: "POL003",
    named_insured: "ABC Company",
    line_of_business: "Workers Compensation",
    status: "ACTIVE",
    effective_date: new Date("2024-03-01"),
    expiration_date: new Date("2025-03-01"),
    premium: 3000.0,
  },
];

async function seedDatabase() {
  const client = new MongoClient(config.mongoUri);

  try {
    await client.connect();
    const dbName = config.mongoUri.split("/").pop().split("?")[0];
    const db = client.db(dbName);
    const collection = db.collection("policies");

    // Clear existing data
    await collection.deleteMany({});
    logger.info("Cleared existing data");

    // Insert sample data
    const result = await collection.insertMany(samplePolicies);
    logger.info(`Inserted ${result.insertedCount} sample policies`);

    // Verify the data
    const count = await collection.countDocuments();
    logger.info(`Total documents in collection: ${count}`);
  } catch (error) {
    logger.error("Error seeding database:", error);
  } finally {
    await client.close();
  }
}

// Run the seed function
seedDatabase();
