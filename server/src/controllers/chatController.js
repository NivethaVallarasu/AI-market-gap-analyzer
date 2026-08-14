const { generateResponse } = require("../services/aiService");
const Conversation = require("../models/Conversation");
const { validateImageDataUrl } = require("../services/imageService");
const { validateFileDataUrl } = require("../services/fileService");

const chat = async (req, res) => {
    try {
        const { sessionId, messages } = req.body;

        // Validate request
        if (!sessionId) {
            return res.status(400).json({
                error: "Session ID is required"
            });
        }

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({
                error: "Messages are required"
            });
        }

        try {
            for (const message of messages) {
                if (message?.image?.dataUrl) {
                    validateImageDataUrl(message.image.dataUrl);
                }
                if (message?.file?.dataUrl) {
                    validateFileDataUrl(message.file.dataUrl);
                }
            }
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }

        // Generate AI response
        const reply = await generateResponse(messages);

        // Add AI response to conversation
        const updatedMessages = [
            ...messages.map(({ sender, text, image }) => ({
                sender,
                text: text || (image ? "[Image attachment]" : ""),
                ...(image ? { hasImage: true } : {})
            })),
            {
                sender: "bot",
                text: reply
            }
        ];

        // Save conversation in MongoDB (non-blocking failure)
        try {
            await Conversation.findOneAndUpdate(
                { sessionId },
                {
                    sessionId,
                    messages: updatedMessages
                },
                {
                    upsert: true,
                    returnDocument: "after"
                }
            );
        } catch (dbError) {
            console.warn("⚠️ Could not persist conversation to MongoDB:", dbError.message);
        }

        // Send response to frontend
        res.json({
            reply
        });

    } catch (error) {
        console.error("Chat Controller Error:", error);

        res.status(500).json({
            error: error.message || "Internal Server Error"
        });
    }
};

const getHistory = async (req, res) => {
    try {
        const conversations = await Conversation.find({}, "sessionId messages updatedAt")
            .sort({ updatedAt: -1 })
            .limit(30);

        const history = conversations.map((c) => {
            const firstUserMsg = c.messages?.find((m) => m.sender === "user")?.text || "New Conversation";
            return {
                sessionId: c.sessionId,
                title: firstUserMsg.length > 40 ? `${firstUserMsg.slice(0, 40)}...` : firstUserMsg,
                updatedAt: c.updatedAt
            };
        });

        res.json({ history });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getSession = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const conversation = await Conversation.findOne({ sessionId });
        if (!conversation) {
            return res.status(404).json({ error: "Session not found" });
        }
        res.json({ messages: conversation.messages });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const deleteSession = async (req, res) => {
    try {
        const { sessionId } = req.params;
        await Conversation.deleteOne({ sessionId });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    chat,
    getHistory,
    getSession,
    deleteSession
};