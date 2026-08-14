const { GoogleGenAI } = require("@google/genai");
const { validateImageDataUrl } = require("./imageService");
const { validateFileDataUrl, extractFileTextFromDataUrl } = require("./fileService");

let client = null;

function getClient() {
    if (!process.env.GEMINI_API_KEY) {
        client = null;
        return null;
    }

    if (!client || client._apiKey !== process.env.GEMINI_API_KEY) {
        client = new GoogleGenAI({
            apiKey: process.env.GEMINI_API_KEY
        });
        client._apiKey = process.env.GEMINI_API_KEY;
    }

    return client;
}

function buildSystemPrompt() {
    return `
You are a helpful assistant and general-purpose multimodal AI assistant. Provide responses in a neat, well-aligned, structured, and visually satisfying format (similar to ChatGPT).

Formatting Guidelines:
1. Direct Answer: Answer the user's question directly and clearly without long intro fillers.
2. Neat Alignment: Use clean section headers (##), bold key terms (**term**), and bulleted/numbered lists with proper spacing.
3. Spacing: Maintain clear spacing between sections to keep reading comfortable and easy to scan.
4. Comparisons: Whenever comparing options, products, or technologies (e.g., using "compare", "vs", "difference"), ALWAYS present them in a Markdown table (| Feature | A | B |).
5. Diagrams & Code: Use pre-formatted code blocks (\`\`\`mermaid or \`\`\`text) for diagrams, steps, or code syntax.
6. Key Takeaways: Highlight key conclusions with short blockquotes (> **Key Takeaway:** ...).
7. Multimodal: When analyzing uploaded images or documents, describe the image and highlight important visual details.
`;
}

function getModelCandidates() {
    const configuredModel = process.env.GEMINI_MODEL
        ?.trim()
        .replace(/^['"]|['"]$/g, "");
    const defaultModels = [
        "gemini-3.5-flash",
        "gemini-3.5-flash-lite"
    ];

    return [...new Set([configuredModel, ...defaultModels].filter(Boolean))];
}

function getVisionModelCandidates() {
    const configuredModel = process.env.GEMINI_VISION_MODEL
        ?.trim()
        .replace(/^['"]|['"]$/g, "");

    return [...new Set([
        configuredModel,
        "gemini-3.5-flash",
        "gemini-3.5-flash-lite"
    ].filter(Boolean))];
}

function getAnalysisModelCandidates() {
    const configuredModel = process.env.GEMINI_ANALYSIS_MODEL
        ?.trim()
        .replace(/^['"]|['"]$/g, "");

    return [...new Set([
        configuredModel,
        "gemini-3.5-flash",
        ...getModelCandidates()
    ].filter(Boolean))];
}

function parseDataUrl(dataUrl) {
    if (!dataUrl) return null;
    const match = dataUrl.match(/^data:(.*?);base64,(.*)$/);
    if (match) {
        return { mimeType: match[1], data: match[2] };
    }
    return null;
}

async function buildMessageContent(message) {
    if (message?.file?.dataUrl) {
        validateFileDataUrl(message.file.dataUrl);
        const fileText = await extractFileTextFromDataUrl(message.file.dataUrl);
        const trimmedFileText = fileText.length > 28000 ? `${fileText.slice(0, 28000)}\n\n[Content trimmed]` : fileText;

        return `${message.text || "Please analyze the attached file and answer the user's question based on its content."}\n\nAttached file content:\n${trimmedFileText}`;
    }

    if (!message?.image) {
        return message.text ?? "";
    }

    validateImageDataUrl(message.image.dataUrl);

    const parsed = parseDataUrl(message.image.dataUrl);
    const textPart = {
        text: message.text || "Please describe and explain the important content in this image."
    };

    if (parsed) {
        return [
            textPart,
            {
                inlineData: {
                    mimeType: parsed.mimeType,
                    data: parsed.data
                }
            }
        ];
    }

    return [textPart];
}

function buildVisualFallbackResponse(messages = []) {
    const latestText = messages[messages.length - 1]?.text || "";
    const asksForMermaid = /\bmermaid\b/i.test(latestText);
    const asksForArchitecture = /\barchitecture\b|\bfood[- ]delivery\b/i.test(latestText);

    if (!asksForMermaid || !asksForArchitecture) return null;

    return `### Architecture Overview

\`\`\`mermaid
graph TD
    Customer[Customer App]:::customer --> API[API Gateway]:::gateway
    Vendor[Vendor App]:::partner --> API
    Courier[Courier App]:::partner --> API
    Admin[Admin Dashboard]:::admin --> API
    API --> Auth[Authentication]:::service
    API --> Orders[Order Service]:::service
    API --> Payments[Payment Service]:::service
    API --> Notifications[Notifications]:::service
    Orders --> Database[(PostgreSQL)]:::data
    Payments --> Database
    Notifications --> Push[Push Notifications]:::notify
    classDef customer fill:#2563eb,stroke:#93c5fd,color:#ffffff,stroke-width:2px;
    classDef partner fill:#0f766e,stroke:#5eead4,color:#ffffff,stroke-width:2px;
    classDef gateway fill:#7c3aed,stroke:#c4b5fd,color:#ffffff,stroke-width:3px;
    classDef admin fill:#a16207,stroke:#facc15,color:#ffffff,stroke-width:2px;
    classDef service fill:#334155,stroke:#94a3b8,color:#f8fafc,stroke-width:2px;
    classDef data fill:#be123c,stroke:#fda4af,color:#ffffff,stroke-width:2px;
    classDef notify fill:#c2410c,stroke:#fdba74,color:#ffffff,stroke-width:2px;
\`\`\`

**Key Takeaway:** The API gateway coordinates customers, vendors, couriers, admins, orders, payments, and notifications.`;
}

async function generateResponse(messages) {
    const visualFallback = buildVisualFallbackResponse(messages);
    if (visualFallback) return visualFallback;

    const hasImage = messages.some((message) => message?.image?.dataUrl);
    const models = hasImage ? getVisionModelCandidates() : getModelCandidates();

    let lastError;

    for (const model of models) {
        try {
            console.log("Trying model:", model);

            const activeClient = getClient();

            if (!activeClient) {
                throw new Error("Gemini API key is not configured");
            }

            const contents = await Promise.all(messages.map(async (msg) => {
                const role = msg.sender === "user" ? "user" : "model";
                const rawContent = await buildMessageContent(msg);
                const parts = Array.isArray(rawContent)
                    ? rawContent
                    : [{ text: String(rawContent || "") }];

                return { role, parts };
            }));

            if (contents.length === 0) {
                throw new Error("No valid chat message content available for the AI request.");
            }

            const response = await activeClient.models.generateContent({
                model,
                contents,
                config: {
                    systemInstruction: buildSystemPrompt()
                }
            });

            if (response?.text) {
                return response.text;
            }

        } catch (error) {
            console.log(`❌ Model failed: ${model}`);
            console.log(error.error?.message || error.message);

            lastError = error;
        }
    }

    throw lastError;
}

module.exports = {
    generateResponse,
    buildSystemPrompt,
    getModelCandidates,
    getAnalysisModelCandidates,
    getVisionModelCandidates,
    buildMessageContent,
    buildVisualFallbackResponse
};