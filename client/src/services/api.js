import axios from "axios";

const rawApiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
const baseURL = rawApiUrl.endsWith("/") ? rawApiUrl.slice(0, -1) : rawApiUrl;

const API = axios.create({
    baseURL
});

API.interceptors.request.use((config) => {
    const token = window.localStorage.getItem("ai-market-gap-auth-token") || window.sessionStorage.getItem("ai-market-gap-auth-token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
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

export const analyzeMarket = (messages, sessionId) => {
    return API.post("/api/analyze", {
        messages,
        sessionId
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

export const getMe = () => API.get("/api/auth/me");
export const updateProfile = (name) => API.put("/api/auth/profile", { name });
export const getAnalyses = () => API.get("/api/analyses");
export const getAnalysis = (id) => API.get(`/api/analyses/${id}`);
export const deleteAnalysis = (id) => API.delete(`/api/analyses/${id}`);

export const signup = (name, email, password) => API.post("/api/auth/signup", { name, email, password });
export const login = (email, password) => API.post("/api/auth/login", { email, password });
export const logout = () => API.post("/api/auth/logout");
export default API;