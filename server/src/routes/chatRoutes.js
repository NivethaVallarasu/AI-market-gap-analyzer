const express = require("express");

const router = express.Router();

const { chat, getHistory, getSession, deleteSession } = require("../controllers/chatController");
<<<<<<< HEAD

=======
const authMiddleware = require("../middleware/authMiddleware");

router.use(authMiddleware);
>>>>>>> 4b7f4a6 (Signup and)
router.post("/", chat);
router.get("/history", getHistory);
router.get("/history/:sessionId", getSession);
router.delete("/history/:sessionId", deleteSession);

module.exports = router;