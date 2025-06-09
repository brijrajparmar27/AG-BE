const { connectToDatabase, getCollection } = require("../config/database");
const logger = require("../utils/logger");

const COLLECTION_NAME = "policies";

class Policy {
  static async search(query, sort, from, size) {
    const db = await connectToDatabase();
    const collection = getCollection(COLLECTION_NAME);

    try {
      // Log the query before execution
      logger.debug("Executing MongoDB query:", {
        query: JSON.stringify(query, null, 2),
        sort: JSON.stringify(sort, null, 2),
        from,
        size,
      });

      // First check if we can find any documents
      const totalDocs = await collection.countDocuments({});
      logger.debug(`Total documents in collection: ${totalDocs}`);

      // Get a sample document to verify field names
      const sampleDoc = await collection.findOne({});
      if (sampleDoc) {
        logger.debug(
          "Sample document from collection (to verify field names):",
          JSON.stringify(sampleDoc, null, 2)
        );
      }

      // Check if any documents match our query
      const matchingDocs = await collection.find(query).toArray();
      logger.debug(`Documents matching query: ${matchingDocs.length}`);

      if (matchingDocs.length > 0) {
        logger.debug(
          "Sample matching document:",
          JSON.stringify(matchingDocs[0], null, 2)
        );
      } else {
        logger.debug("No documents matched the query");
      }

      // Execute the final query with pagination
      const results = await collection
        .find(query)
        .sort(sort)
        .skip(from)
        .limit(size)
        .toArray();

      const total = await collection.countDocuments(query);

      logger.debug(
        `Returning ${results.length} results out of ${total} total matches`
      );

      // Log the first result if any
      if (results.length > 0) {
        logger.debug(
          "First result in paginated results:",
          JSON.stringify(results[0], null, 2)
        );
      }

      return {
        data: results,
        total,
        from,
        size,
      };
    } catch (error) {
      logger.error("Error in Policy.search:", {
        error: error.message,
        stack: error.stack,
        query: JSON.stringify(query, null, 2),
      });
      throw error;
    }
  }

  static async getLineOfBusinessStats() {
    const db = await connectToDatabase();
    const collection = getCollection(COLLECTION_NAME);

    try {
      // Get unique lines of business
      const uniqueLinesOfBusiness = await collection.distinct(
        "line_of_business"
      );
      logger.debug(
        `Found ${uniqueLinesOfBusiness.length} unique lines of business`
      );

      // Define status mapping
      const statusMapping = {
        ALL: "All",
        PENDING_RENEWAL: "Pending Renewal",
        APPROVAL_PENDING: "Approval Pending",
        IN_DESIGN: "In Design",
        PENDING_QUOTE: "Pending Quote",
        QUOTED: "Quoted",
        BOUND: "Bound",
        ISSUED: "Issued",
        CLOSED: "Closed",
      };

      // Get status counts
      const statusCounts = await collection
        .aggregate([
          {
            $group: {
              _id: "$status",
              count: { $sum: 1 },
            },
          },
          {
            $project: {
              _id: 0,
              id: "$_id",
              count: 1,
            },
          },
          { $sort: { id: 1 } },
        ])
        .toArray();

      // Add name property to each status
      const statusesWithNames = statusCounts.map((status) => ({
        ...status,
        name: statusMapping[status.id] || "Unknown",
      }));

      logger.debug(
        "Status counts:",
        JSON.stringify(statusesWithNames, null, 2)
      );

      return {
        statuses: statusesWithNames,
        linesOfBusiness: uniqueLinesOfBusiness,
      };
    } catch (error) {
      logger.error("Error in Policy.getLineOfBusinessStats:", error);
      throw error;
    }
  }
}

module.exports = Policy;
