import axios from "axios";

const API = axios.create({
    baseURL: "http://127.0.0.1:5000"
});

function prepareMessagesForRequest(messages) {
    const lastAttachmentIndex = messages
        .map((message, index) => (
            message?.image?.dataUrl || message?.file?.dataUrl ? index : -1
        ))
        .filter((index) => index >= 0)
        .pop();

    return messages.map((message, index) => {
        if (index === lastAttachmentIndex) {
            return message;
        }

        return { ...message, image: undefined, file: undefined };
    });
}

export const sendMessage = (sessionId, messages) => {
    const requestMessages = prepareMessagesForRequest(messages);

    return API.post("/api/chat", {
        sessionId,
        messages: requestMessages
    });
};

export const analyzeMarket = (messages) => {
    return API.post("/api/analyze", {
        messages
    });
};

export const getChatHistory = () => {
    return API.get("/api/chat/history");
};

export const getChatSession = (sessionId) => {
    return API.get(`/api/chat/history/${sessionId}`);
};

export const deleteChatSession = (sessionId) => {
    return API.delete(`/api/chat/history/${sessionId}`);
};

export default API;