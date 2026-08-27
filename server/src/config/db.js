const mongoose = require("mongoose");

// Disable buffering so queries fail quickly if DB is offline/unreachable instead of timing out after 10s
mongoose.set("bufferCommands", false);

const connectDB = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            console.warn("⚠️ MONGODB_URI environment variable is not set. Database persistence disabled.");
            return;
        }

        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000
        });
        console.log("✅ MongoDB Connected");

    } catch (error) {
        console.error("⚠️ MongoDB Connection Failed:", error.message);
        console.warn("⚠️ Continuing server startup without database persistence.");
    }
};

module.exports = connectDB;