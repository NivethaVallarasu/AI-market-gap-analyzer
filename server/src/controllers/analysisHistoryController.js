const Analysis = require("../models/Analysis");

const getAnalyses = async (req, res) => {
    const analyses = await Analysis.find({ userId: req.user.userId }).select("title sessionId report createdAt").sort({ createdAt: -1 }).limit(100);
    res.json({ analyses });
};

const getAnalysis = async (req, res) => {
    const analysis = await Analysis.findOne({ _id: req.params.id, userId: req.user.userId });
    if (!analysis) return res.status(404).json({ error: "Analysis not found." });
    return res.json({ analysis });
};

const deleteAnalysis = async (req, res) => {
    const result = await Analysis.deleteOne({ _id: req.params.id, userId: req.user.userId });
    if (!result.deletedCount) return res.status(404).json({ error: "Analysis not found." });
    return res.json({ success: true });
};

module.exports = { getAnalyses, getAnalysis, deleteAnalysis };