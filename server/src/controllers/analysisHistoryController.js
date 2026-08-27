const mongoose = require("mongoose");
const Analysis = require("../models/Analysis");

const isDbConnected = () => mongoose.connection && mongoose.connection.readyState === 1;

const getAnalyses = async (req, res) => {
    try {
        if (!isDbConnected()) {
            return res.json({ analyses: [] });
        }
        const analyses = await Analysis.find({ userId: req.user.userId })
            .select("title sessionId report createdAt")
            .sort({ createdAt: -1 })
            .limit(100);
        return res.json({ analyses: analyses || [] });
    } catch (error) {
        console.warn("⚠️ Unable to fetch analyses from database:", error.message);
        return res.json({ analyses: [] });
    }
};

const getAnalysis = async (req, res) => {
    try {
        if (!isDbConnected()) {
            return res.status(404).json({ error: "Analysis not found." });
        }
        const analysis = await Analysis.findOne({ _id: req.params.id, userId: req.user.userId });
        if (!analysis) return res.status(404).json({ error: "Analysis not found." });
        return res.json({ analysis });
    } catch (error) {
        console.warn("⚠️ Unable to fetch analysis from database:", error.message);
        return res.status(404).json({ error: "Analysis not found." });
    }
};

const deleteAnalysis = async (req, res) => {
    try {
        if (!isDbConnected()) {
            return res.status(404).json({ error: "Analysis not found." });
        }
        const result = await Analysis.deleteOne({ _id: req.params.id, userId: req.user.userId });
        if (!result.deletedCount) return res.status(404).json({ error: "Analysis not found." });
        return res.json({ success: true });
    } catch (error) {
        console.warn("⚠️ Unable to delete analysis from database:", error.message);
        return res.status(500).json({ error: "Failed to delete analysis." });
    }
};

module.exports = { getAnalyses, getAnalysis, deleteAnalysis };