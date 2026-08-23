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

<<<<<<< HEAD
=======
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },

>>>>>>> 4b7f4a6 (Signup and)
    sessionId: {
        type: String,
        required: true
    },

    messages: [messageSchema]

}, {

    timestamps: true

});

<<<<<<< HEAD
=======
conversationSchema.index({ userId: 1, sessionId: 1 }, { unique: true });

>>>>>>> 4b7f4a6 (Signup and)
module.exports = mongoose.model(
    "Conversation",
    conversationSchema
);