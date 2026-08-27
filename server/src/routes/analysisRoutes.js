const express = require("express");
const router = express.Router();

const { analyzeMarket } = require("../controllers/analysisController");
const authMiddleware = require("../middleware/authMiddleware");

router.use(authMiddleware);
router.post("/", analyzeMarket);

module.exports = router;