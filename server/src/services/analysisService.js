const { GoogleGenAI } = require("@google/genai");
const { searchProducts } = require("./productHuntService");
const { getAnalysisModelCandidates } = require("./aiService");

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

function normalizeOpportunityScore(value, fallbackScore = 0) {
    if (value == null || value === "") {
        return fallbackScore;
    }

    let numeric = Number(value);

    if (Number.isNaN(numeric)) {
        const ratioMatch = String(value).match(/(-?[0-9]+(?:\.[0-9]+)?)\s*(?:\/|of)\s*([0-9]+(?:\.[0-9]+)?)/i);
        if (ratioMatch) {
            const numerator = Number(ratioMatch[1]);
            const denominator = Number(ratioMatch[2]);
            if (!Number.isNaN(numerator) && !Number.isNaN(denominator) && denominator > 0) {
                numeric = (numerator / denominator) * 100;
            }
        }
    }

    if (Number.isNaN(numeric)) {
        const percentMatch = String(value).match(/(-?[0-9]+(?:\.[0-9]+)?)\s*%/);
        if (percentMatch) {
            numeric = Number(percentMatch[1]);
        }
    }

    if (Number.isNaN(numeric)) {
        return fallbackScore;
    }

    if (numeric >= 0 && numeric <= 10) {
        numeric = numeric * 10;
    }

    numeric = Math.round(numeric);
    numeric = Math.min(100, Math.max(0, numeric));

    return numeric;
}

function buildFallbackReport(messages = []) {
    const userMessages = (messages || [])
        .filter((msg) => msg.sender === "user")
        .map((msg) => msg.text || "");
    const productConversation = [...userMessages]
        .reverse()
        .find((message) => /\b(build|create|develop|launch|product|app|idea|tool|platform)\b/i.test(message))
        || userMessages[userMessages.length - 1]
        || "";
    const text = productConversation.toLowerCase();
    const productIdea = productConversation.match(/(?:build|create|develop|launch|product|app|idea)\D{0,20}([A-Za-z0-9][A-Za-z0-9 -]{2,60})/i)?.[1]?.trim()
        || productConversation.split(/[.!?]/)[0]?.trim()
        || "the proposed product";

    const hasAi = text.includes("ai") || text.includes("artificial intelligence");
    const hasSaaS = text.includes("saas") || text.includes("software");
    const hasLocal = text.includes("local") || text.includes("small business");
    const hasAutomation = text.includes("automate") || text.includes("automation");

    let opportunityScore = 62;

    if (hasAi) opportunityScore += 8;
    if (hasSaaS) opportunityScore += 5;
    if (hasLocal) opportunityScore += 4;
    if (hasAutomation) opportunityScore += 6;

    opportunityScore = Math.min(95, Math.max(45, opportunityScore));

    const category = text.includes("note") || text.includes("lecture") || text.includes("study")
        ? "notes and productivity"
        : text.includes("fitness") || text.includes("workout") || text.includes("health")
            ? "health and fitness"
            : text.includes("shop") || text.includes("store") || text.includes("ecommerce")
                ? "commerce"
                : text.includes("finance") || text.includes("budget") || text.includes("payment")
                    ? "financial tools"
                    : text.includes("restaurant") || text.includes("food")
                        ? "restaurant technology"
                        : "the target market";

    const categoryInsights = {
        "notes and productivity": {
            competitors: ["Notion", "OneNote", "Otter.ai", "Google Keep", "Evernote", "Quizlet", "Manual review of recordings and PDFs"],
            gaps: ["Reliable synthesis instead of raw transcripts", "Fast conversion of notes into exam-ready summaries", "Shared workspaces with version-aware collaboration"]
        },
        "health and fitness": {
            competitors: ["MyFitnessPal", "Fitbit", "Apple Health", "Strava", "Peloton", "Personal trainers and coaching programs", "Spreadsheet-based progress tracking"],
            gaps: ["Personalized guidance that adapts to progress", "Low-friction daily engagement", "Trustworthy outcomes for the target user"]
        },
        commerce: {
            competitors: ["Shopify", "WooCommerce", "Amazon Marketplace", "Etsy", "BigCommerce", "Marketplace storefronts", "Manual catalog and customer workflows"],
            gaps: ["A focused experience for the target customer", "Better discovery and conversion signals", "Simple operations for smaller sellers"]
        },
        "financial tools": {
            competitors: ["Mint alternatives", "YNAB", "Monarch Money", "Rocket Money", "Traditional banking apps", "Budgeting platforms", "Manual spreadsheets and calculators"],
            gaps: ["Clear guidance for the target financial decision", "Trustworthy, understandable recommendations", "A simpler workflow than existing finance tools"]
        },
        "restaurant technology": {
            competitors: ["OpenTable", "Toast", "Square", "Resy", "SevenRooms", "Point-of-sale software", "Manual booking and customer workflows"],
            gaps: ["Better support for independent operators", "Fewer steps in daily restaurant workflows", "Actionable insights from customer and booking data"]
        }
    }[category] || {
        competitors: [`Existing ${category} platforms`, `Leading ${category} startups`, "General-purpose productivity tools", "Specialist workflow platforms", "Marketplace alternatives", "Manual workflows and spreadsheets"],
        gaps: [`Sharper positioning for ${productIdea}`, "A simpler first-use experience", `A measurable advantage over current ${category} solutions`]
    };

    const competitors = categoryInsights.competitors;
    const marketGaps = categoryInsights.gaps;

    const verdict = opportunityScore >= 75
        ? "Strong opportunity with a clear niche and room for differentiation."
        : "Promising idea, but the market needs sharper positioning and a stronger value story.";

    return {
        opportunityScore,
        verdict,
        competitors,
        marketGaps,
        swot: {
            strengths: [`Addresses a specific ${category} problem`, hasAi ? "Clear AI-enabled value" : "A focused product concept", "Potential to remove friction from the current workflow"],
            weaknesses: ["Needs stronger differentiation", `Requires validation with ${category} users`],
            opportunities: [`Growing demand in ${category}`, `Room to improve the experience of ${productIdea}`],
            threats: ["Fast-moving competitors", "Low switching costs for existing alternatives"]
        },
        roadmap: [
            `Validate the problem with 5-10 ${category} users`,
            `Build a simple MVP around ${productIdea}`,
            "Measure retention and willingness to pay before scaling"
        ]
    };
}

function mergeProductInsights(report, productData) {
    const edges = productData?.data?.posts?.edges || [];
    const products = edges
        .map((edge) => edge?.node?.name)
        .filter(Boolean);

    const mergedCompetitors = Array.from(new Set([...(report.competitors || []), ...products]));
    const mergedGaps = Array.from(new Set([
        ...(report.marketGaps || []),
        "Opportunity to differentiate with a workflow designed for the target user"
    ]));

    return {
        ...report,
        competitors: mergedCompetitors,
        marketGaps: mergedGaps
    };
}

const analysisCache = new Map();

function getConversationKey(messages = []) {
    return messages.map((m) => `${m.sender}:${m.text}`).join("|");
}

async function analyzeIdea(messages) {
    const cacheKey = getConversationKey(messages);
    if (analysisCache.has(cacheKey)) {
        return analysisCache.get(cacheKey);
    }

    const fallbackReport = buildFallbackReport(messages);
    const productInsightsPromise = process.env.PRODUCT_HUNT_API_TOKEN
        ? searchProducts("AI").catch(() => null)
        : Promise.resolve(null);

    if (!process.env.GEMINI_API_KEY) {
        try {
            const productData = await productInsightsPromise;
            const res = mergeProductInsights(fallbackReport, productData);
            analysisCache.set(cacheKey, res);
            return res;
        } catch (error) {
            analysisCache.set(cacheKey, fallbackReport);
            return fallbackReport;
        }
    }

    try {
        const activeClient = getClient();

        if (!activeClient) {
            analysisCache.set(cacheKey, fallbackReport);
            return fallbackReport;
        }

        let response;
        let lastError;

        for (const model of getAnalysisModelCandidates()) {
            try {
                response = await activeClient.models.generateContent({
                    model,
                    contents: [
                        {
                            role: "user",
                            parts: [{
                                text: `Analyze this startup conversation and return only valid JSON.\n${(messages || []).map((msg) => `${msg.sender}: ${msg.text}`).join("\n")}`
                            }]
                        }
                    ],
                    config: {
                        systemInstruction: "You are a startup market analyst. Analyze the latest product explicitly discussed by the user; if the user changed products, ignore earlier product ideas. Return a compact JSON object with opportunityScore (number), verdict (string), competitors (array of at least 7 specific relevant companies or alternatives), marketGaps (array of strings), swot (object with strengths, weaknesses, opportunities, threats arrays), and roadmap (array of strings).",
                        responseMimeType: "application/json",
                        temperature: 0
                    }
                });
                if (response?.text) break;
            } catch (error) {
                lastError = error;
                console.warn(`AI analysis model failed: ${model}`, error.message);
            }
        }

        if (!response || !response.text) {
            throw lastError || new Error("No AI model response was available");
        }

        const content = response.text;
        const cleaned = content.replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(cleaned);

        const productData = await Promise.race([
            productInsightsPromise,
            new Promise((resolve) => setTimeout(() => resolve(null), 2000))
        ]);
        const enriched = mergeProductInsights({
            ...fallbackReport,
            ...parsed,
            opportunityScore: normalizeOpportunityScore(parsed.opportunityScore, fallbackReport.opportunityScore),
            competitors: Array.isArray(parsed.competitors) ? parsed.competitors : fallbackReport.competitors,
            marketGaps: Array.isArray(parsed.marketGaps) ? parsed.marketGaps : fallbackReport.marketGaps,
            swot: parsed.swot && typeof parsed.swot === "object" ? parsed.swot : fallbackReport.swot,
            roadmap: Array.isArray(parsed.roadmap) ? parsed.roadmap : fallbackReport.roadmap
        }, productData);

        analysisCache.set(cacheKey, enriched);
        return enriched;
    } catch (error) {
        console.warn("AI analysis fallback triggered:", error.message);
        return fallbackReport;
    }
}

module.exports = {
    analyzeIdea,
    mergeProductInsights,
    buildFallbackReport,
    normalizeOpportunityScore
};