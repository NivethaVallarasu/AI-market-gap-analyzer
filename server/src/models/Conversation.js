const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
    sender: {
        type: String,
        required: true
    },

    text: {
        type: String,
        required: true
    },

    hasImage: {
        type: Boolean,
        default: false
    }

}, { _id: false });

const conversationSchema = new mongoose.Schema({

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },

    sessionId: {
        type: String,
        required: true
    },

    messages: [messageSchema]

}, {

    timestamps: true

});

conversationSchema.index({ userId: 1, sessionId: 1 }, { unique: true });
module.exports = mongoose.model(
    "Conversation",
    conversationSchema
);