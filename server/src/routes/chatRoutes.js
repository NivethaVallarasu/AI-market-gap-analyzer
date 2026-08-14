const express = require("express");

const router = express.Router();

const { chat, getHistory, getSession, deleteSession } = require("../controllers/chatController");

router.post("/", chat);
router.get("/history", getHistory);
router.get("/history/:sessionId", getSession);
router.delete("/history/:sessionId", deleteSession);

module.exports = router;