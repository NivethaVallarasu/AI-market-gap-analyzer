const express = require("express");
const { signup, login, getMe, updateProfile } = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();
router.post("/signup", signup);
router.post("/login", login);
router.get("/me", authMiddleware, getMe);
router.put("/profile", authMiddleware, updateProfile);
router.post("/logout", authMiddleware, (req, res) => res.json({ success: true, message: "Logged out successfully." }));

module.exports = router;