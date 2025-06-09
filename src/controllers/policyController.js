const Policy = require("../models/Policy");
const logger = require("../utils/logger");

class PolicyController {
  static async search(req, res) {
    try {
      const { sortEntries, filterEntries, from, size } = req.body;

      // Log the incoming request body
      logger.debug("Incoming search request body:", {
        body: JSON.stringify(req.body, null, 2),
      });

      // Build the query
      let query = {};

      // Apply filters if they exist
      if (filterEntries && filterEntries.length > 0) {
        filterEntries.forEach((filter) => {
          let fieldName = filter.field;

          logger.debug("Processing filter:", {
            field: fieldName,
            action: filter.filterAction,
            value: filter.filterValue,
          });

          // Handle searchFields filter
          if (
            fieldName === "searchFields" &&
            filter.filterAction === "contains"
          ) {
            const searchValue = filter.filterValue;
            logger.debug(
              "Building searchFields query with value:",
              searchValue
            );

            // Create an array of conditions for each field
            const searchConditions = [
              { named_insured: { $regex: searchValue, $options: "i" } },
              { MNPID: { $regex: searchValue, $options: "i" } },
              { MBU_handler: { $regex: searchValue, $options: "i" } },
              { producing_UW: { $regex: searchValue, $options: "i" } },
            ];

            // Special handling for line_of_business since it's an array
            searchConditions.push({
              line_of_business: {
                $elemMatch: { $regex: searchValue, $options: "i" },
              },
            });

            query.$or = searchConditions;

            logger.debug(
              "Generated $or query:",
              JSON.stringify(query.$or, null, 2)
            );
            return;
          }

          // Map the field names to match the database schema
          if (fieldName === "programLineOfBusinesses") {
            fieldName = "line_of_business";
          } else if (fieldName === "masterNameInsuredAccountName") {
            fieldName = "named_insured";
          }

          if (filter.filterAction === "in") {
            query[fieldName] = { $in: filter.filterValue };
          } else if (filter.filterAction === "equals") {
            // For status field, we want to match any of the values in the array
            if (fieldName === "status") {
              // Ensure the status values are in the correct case
              const statusValues = filter.filterValue.map((value) =>
                value.toUpperCase()
              );
              query[fieldName] = { $in: statusValues };
            } else {
              // For other fields, use direct equality
              query[fieldName] = filter.filterValue[0];
            }
          } else if (filter.filterAction === "contains") {
            // Handle contains filter action for MBU_handler and producing_UW
            if (fieldName === "MBU_handler" || fieldName === "producing_UW") {
              query[fieldName] = { $regex: filter.filterValue, $options: "i" };
            }
          }
        });
      }

      // Build the sort object
      let sort = {};
      if (sortEntries && sortEntries.length > 0) {
        sortEntries.forEach((sortEntry) => {
          let fieldName = sortEntry.colId;
          if (fieldName === "masterNameInsuredAccountName") {
            fieldName = "named_insured";
          }
          sort[fieldName] = sortEntry.sort === "asc" ? 1 : -1;
        });
      }

      // Log the final query for debugging
      logger.debug("Final search query:", {
        query: JSON.stringify(query, null, 2),
        filterEntries: JSON.stringify(filterEntries, null, 2),
        sort: JSON.stringify(sort, null, 2),
        from,
        size,
      });

      const result = await Policy.search(query, sort, from, size);

      // Log the results for debugging
      logger.debug("Search results:", {
        totalResults: result.total,
        returnedResults: result.data.length,
        firstResult:
          result.data.length > 0
            ? JSON.stringify(result.data[0], null, 2)
            : null,
      });

      res.json(result);
    } catch (error) {
      logger.error("Search error:", {
        error: error.message,
        stack: error.stack,
      });
      res.status(500).json({
        error: "Internal server error",
        message: error.message,
      });
    }
  }

  static async getLineOfBusinessStats(req, res) {
    try {
      const stats = await Policy.getLineOfBusinessStats();
      logger.debug("Line of business stats:", stats);
      res.json(stats);
    } catch (error) {
      logger.error("Error getting line of business stats:", {
        error: error.message,
        stack: error.stack,
      });
      res.status(500).json({
        error: "Internal server error",
        message: error.message,
      });
    }
  }
}

module.exports = PolicyController;
