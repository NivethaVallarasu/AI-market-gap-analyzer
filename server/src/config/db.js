const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            console.warn("⚠️ MONGODB_URI environment variable is not set. Database persistence disabled.");
            return;
        }

        await mongoose.connect(process.env.MONGODB_URI);
        console.log("✅ MongoDB Connected");

    } catch (error) {
        console.error("⚠️ MongoDB Connection Failed:", error.message);
        console.warn("⚠️ Continuing server startup without database persistence.");
    }
};

module.exports = connectDB;