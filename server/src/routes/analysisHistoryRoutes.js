const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const { getAnalyses, getAnalysis, deleteAnalysis } = require("../controllers/analysisHistoryController");

const router = express.Router();
router.use(authMiddleware);
router.get("/", getAnalyses);
router.get("/:id", getAnalysis);
router.delete("/:id", deleteAnalysis);

module.exports = router;