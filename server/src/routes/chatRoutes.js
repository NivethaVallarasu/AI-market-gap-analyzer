const express = require("express");

const router = express.Router();

const { chat, getHistory, getSession, deleteSession } = require("../controllers/chatController");
const authMiddleware = require("../middleware/authMiddleware");

router.use(authMiddleware);
router.post("/", chat);
router.get("/history", getHistory);
router.get("/history/:sessionId", getSession);
router.delete("/history/:sessionId", deleteSession);

module.exports = router;