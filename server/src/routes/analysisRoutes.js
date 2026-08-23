const express = require("express");
const router = express.Router();

const { analyzeMarket } = require("../controllers/analysisController");
<<<<<<< HEAD

=======
const authMiddleware = require("../middleware/authMiddleware");

router.use(authMiddleware);
>>>>>>> 4b7f4a6 (Signup and)
router.post("/", analyzeMarket);

module.exports = router;