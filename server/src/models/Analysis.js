const mongoose = require("mongoose");

const analysisSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    sessionId: { type: String, required: true },
    report: { type: mongoose.Schema.Types.Mixed, required: true },
    title: { type: String, default: "Market analysis" },
    messages: { type: Array, default: [] }
}, { timestamps: true });

analysisSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("Analysis", analysisSchema);