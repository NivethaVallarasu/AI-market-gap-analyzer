
const productRoutes = require("./routes/productRoutes");
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const analysisRoutes = require("./routes/analysisRoutes");
const connectDB = require("./config/db");
const chatRoutes = require("./routes/chatRoutes");
const authRoutes = require("./routes/authRoutes");
const analysisHistoryRoutes = require("./routes/analysisHistoryRoutes");

const app = express();

connectDB();

app.use(cors({
    origin: (origin, callback) => {
        // Allow all origins (including vercel.app preview URLs & localhost)
        callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
}));

// Handle preflight OPTIONS requests for all endpoints
app.options(/(.*)/, cors());

app.use(express.json({ limit: "12mb" }));
app.use("/api/products", productRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/analyses", analysisHistoryRoutes);
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