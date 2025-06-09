const express = require("express");
const router = express.Router();
const PolicyController = require("../controllers/policyController");

// Search route
router.post("/search", PolicyController.search);

// Get line of business statistics route
router.get("/line-of-business-stats", PolicyController.getLineOfBusinessStats);

module.exports = router;
