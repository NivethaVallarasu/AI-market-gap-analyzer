
const productRoutes = require("./routes/productRoutes");
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const analysisRoutes = require("./routes/analysisRoutes");
const connectDB = require("./config/db");
const chatRoutes = require("./routes/chatRoutes");
<<<<<<< HEAD
=======
const authRoutes = require("./routes/authRoutes");
const analysisHistoryRoutes = require("./routes/analysisHistoryRoutes");
>>>>>>> 4b7f4a6 (Signup and)

const app = express();

connectDB();

app.use(cors());
app.use(express.json({ limit: "12mb" }));
app.use("/api/products", productRoutes);
<<<<<<< HEAD
=======
app.use("/api/auth", authRoutes);
app.use("/api/analyses", analysisHistoryRoutes);
>>>>>>> 4b7f4a6 (Signup and)
app.use("/api/analyze", analysisRoutes);
app.get("/", (req, res) => {
    res.json({
        message: "AI Market Gap Analyzer API is running"
    });
});

app.use("/api/chat", chatRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});