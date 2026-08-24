const { analyzeIdea } = require("../services/analysisService");
const Analysis = require("../models/Analysis");

const analyzeMarket = async (req, res) => {
console.log("===== Analyze API HIT =====");
    try {

        const { messages } = req.body;
        if (!Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({ error: "Messages are required" });
        }

        const report = await analyzeIdea(messages);
        await Analysis.create({
            userId: req.user.userId,
            sessionId: String(req.body.sessionId || ""),
            title: messages.find((message) => message.sender === "user")?.text?.slice(0, 80) || "Market analysis",
            messages: messages.map(({ sender, text }) => ({ sender, text })),
            report
        });

        res.json(report);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: error.message
        });

    }

};

module.exports = {
    analyzeMarket
};