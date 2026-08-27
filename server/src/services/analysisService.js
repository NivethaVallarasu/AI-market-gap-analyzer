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

    const productsAnalyzed = competitors.length;
    const reviewsAnalyzed = productsAnalyzed * 18 + 42;
    const marketGapsCount = marketGaps.length;
    const complaintsCount = 4;
    const opportunitiesCount = 5;

    const defaultPainPoints = [
        { label: "High Pricing & Hidden Fees", frequency: 86, category: "Pricing" },
        { label: "Poor UX & Complex Onboarding", frequency: 74, category: "Usability" },
        { label: "Missing Workflow Integrations", frequency: 68, category: "Feature Gap" },
        { label: "Slow Performance & Load Times", frequency: 59, category: "Performance" },
        { label: "Lack of Dedicated Support", frequency: 45, category: "Customer Service" }
    ];

    return {
        category,
        opportunityScore,
        verdict,
        competitors,
        marketGaps,
        productsAnalyzed,
        reviewsAnalyzed,
        marketGapsCount,
        complaintsCount,
        opportunitiesCount,
        painPoints: defaultPainPoints,
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

    const productsAnalyzed = mergedCompetitors.length || 7;
    const reviewsAnalyzed = report.reviewsAnalyzed || (productsAnalyzed * 18 + 42);
    const marketGapsCount = mergedGaps.length;
    const complaintsCount = (report.swot?.weaknesses?.length || 0) + (report.swot?.threats?.length || 0);
    const opportunitiesCount = (report.swot?.opportunities?.length || 0) + (report.roadmap?.length || 0);

    const rawPainPoints = Array.isArray(report.painPoints) && report.painPoints.length > 0
        ? report.painPoints
        : [
            { label: "High Pricing & Hidden Fees", frequency: 86, category: "Pricing" },
            { label: "Poor UX & Complex Onboarding", frequency: 74, category: "Usability" },
            { label: "Missing Workflow Integrations", frequency: 68, category: "Feature Gap" },
            { label: "Slow Performance & Load Times", frequency: 59, category: "Performance" },
            { label: "Lack of Dedicated Support", frequency: 45, category: "Customer Service" }
        ];

    const painPoints = [...rawPainPoints].sort((a, b) => (b.frequency || 0) - (a.frequency || 0));

    const defaultImportantReviews = [
        {
            id: "rev-1",
            text: "The software works okay for basic tasks, but the workflow breaks completely when we try to collaborate across teams.",
            importanceScore: 94,
            importanceLevel: "Critical",
            sentiment: "Negative",
            mainIssue: "Broken Multi-User Collaboration",
            category: "Usability & Workflow",
            whyImportant: "Highlights a fundamental friction point causing user churn in multi-user teams."
        },
        {
            id: "rev-2",
            text: "Pricing is way too expensive for small businesses. $99/mo per seat makes it impossible for small teams to adopt.",
            importanceScore: 88,
            importanceLevel: "Critical",
            sentiment: "Negative",
            mainIssue: "Prohibitive Per-Seat Pricing",
            category: "Pricing & Plans",
            whyImportant: "Directly identifies market gap for an affordable tier targeted at SMBs."
        },
        {
            id: "rev-3",
            text: "I wish it integrated directly with Slack and Notion instead of requiring manual export and import every day.",
            importanceScore: 78,
            importanceLevel: "High",
            sentiment: "Mixed",
            mainIssue: "Lack of Native Integrations",
            category: "Feature Request",
            whyImportant: "Pinpoints high-value ecosystem integration request from active daily power users."
        },
        {
            id: "rev-4",
            text: "Exporting reports takes almost 2 minutes every single time. It freezes the browser tab.",
            importanceScore: 68,
            importanceLevel: "Medium",
            sentiment: "Negative",
            mainIssue: "Slow PDF Export Performance",
            category: "Performance",
            whyImportant: "Reveals technical performance bottleneck frustrating power users during export."
        },
        {
            id: "rev-5",
            text: "The initial setup tutorial is confusing and takes hours to configure permissions.",
            importanceScore: 52,
            importanceLevel: "Low",
            sentiment: "Neutral",
            mainIssue: "Complex Onboarding",
            category: "Onboarding",
            whyImportant: "Useful UX feedback regarding first-run onboarding complexity."
        }
    ];

    const rawReviews = Array.isArray(report.importantReviews) && report.importantReviews.length > 0
        ? report.importantReviews
        : defaultImportantReviews;

    const importantReviews = [...rawReviews].sort((a, b) => (b.importanceScore || 0) - (a.importanceScore || 0));

    const importanceBreakdown = [
        { level: "Critical", count: importantReviews.filter(r => r.importanceLevel === "Critical").length, color: "#ef4444" },
        { level: "High", count: importantReviews.filter(r => r.importanceLevel === "High").length, color: "#f59e0b" },
        { level: "Medium", count: importantReviews.filter(r => r.importanceLevel === "Medium").length, color: "#3b82f6" },
        { level: "Low", count: importantReviews.filter(r => r.importanceLevel === "Low").length, color: "#10b981" }
    ];

    const reviewsList = importantReviews;
    let negativeCount = reviewsList.filter((r) => r.sentiment === "Negative").length;
    let neutralCount = reviewsList.filter((r) => r.sentiment === "Neutral" || r.sentiment === "Mixed").length;
    let positiveCount = reviewsList.filter((r) => r.sentiment === "Positive").length;

    const totalSentimentCount = positiveCount + neutralCount + negativeCount || 1;
    const negativePct = Math.round((negativeCount / totalSentimentCount) * 100);
    const neutralPct = Math.round((neutralCount / totalSentimentCount) * 100);
    const positivePct = Math.max(0, 100 - negativePct - neutralPct);

    const dominantSentiment = negativePct >= positivePct && negativePct >= neutralPct
        ? "Negative"
        : positivePct >= neutralPct
            ? "Positive"
            : "Neutral";

    const explanation = report.sentimentExplanation || (
        dominantSentiment === "Negative"
            ? "Negative sentiment is dominant, mainly because users frequently mention pricing and usability problems."
            : dominantSentiment === "Positive"
                ? "Positive sentiment leads as users praise core value, though minor usability issues are noted."
                : "Neutral/Mixed sentiment is primary, reflecting balanced feedback between features and performance."
    );

    const sentimentAnalysis = report.sentimentAnalysis || {
        positive: positivePct,
        neutral: neutralPct,
        negative: negativePct,
        positiveCount,
        neutralCount,
        negativeCount,
        dominantSentiment,
        explanation
    };

    const rawGaps = Array.isArray(report.marketGaps) && report.marketGaps.length > 0
        ? report.marketGaps
        : ["Reliable synthesis instead of raw transcripts", "Fast conversion of notes into exam-ready summaries", "Shared workspaces with version-aware collaboration"];

    const baseGapScores = [94, 87, 81, 74, 68, 60];

    const structuredMarketGaps = (Array.isArray(report.structuredMarketGaps) && report.structuredMarketGaps.length > 0
        ? report.structuredMarketGaps
        : rawGaps.map((gap, index) => {
            const gapName = typeof gap === "string" ? gap : gap.name || gap.gap || "Unmet Market Need";
            const score = typeof gap === "object" && gap.importanceScore ? gap.importanceScore : baseGapScores[index % baseGapScores.length];
            const evidenceCount = typeof gap === "object" && gap.evidenceCount ? gap.evidenceCount : (Math.round(score * 0.45) + 12);
            const opportunityLevel = score >= 85 ? "Very High" : score >= 70 ? "High" : "Moderate";

            return {
                name: gapName,
                importanceScore: score,
                evidenceCount,
                opportunityLevel
            };
        })
    ).sort((a, b) => b.importanceScore - a.importanceScore);

    const rawRoadmap = Array.isArray(report.roadmap) && report.roadmap.length > 0
        ? report.roadmap
        : [
            "AI Multi-User Workspace Collaboration",
            "1-Click Native Slack & Notion Export Integration",
            "Automated Quiz & Flashcard Generation from Audio",
            "Enterprise Permission & Security Governance",
            "Instant Offline Note Processing Engine"
        ];

    const defaultFeaturePoints = [
        { feature: "AI Multi-User Workspace Collaboration", demand: 88, competition: 28, score: 92 },
        { feature: "1-Click Native Slack & Notion Export Integration", demand: 82, competition: 35, score: 86 },
        { feature: "Automated Quiz & Flashcard Generation", demand: 76, competition: 22, score: 84 },
        { feature: "Enterprise Permission & Security Governance", demand: 65, competition: 70, score: 58 },
        { feature: "Instant Offline Note Processing Engine", demand: 54, competition: 42, score: 62 }
    ];

    const featureOpportunities = (Array.isArray(report.featureOpportunities) && report.featureOpportunities.length > 0
        ? report.featureOpportunities
        : rawRoadmap.map((feat, idx) => {
            const featureName = typeof feat === "string" ? feat : feat.feature || feat.name || "Feature Opportunity";
            const defaultSet = defaultFeaturePoints[idx % defaultFeaturePoints.length];
            const demand = typeof feat === "object" && feat.demand ? feat.demand : defaultSet.demand;
            const competition = typeof feat === "object" && feat.competition ? feat.competition : defaultSet.competition;
            const score = typeof feat === "object" && feat.score ? feat.score : Math.round((demand * 1.1) - (competition * 0.3));

            return {
                feature: featureName,
                demand,
                competition,
                score: Math.min(100, Math.max(10, score)),
                isGoldmine: demand >= 60 && competition <= 45
            };
        })
    ).sort((a, b) => b.score - a.score);

    const rawRoadmapItems = Array.isArray(report.roadmap) && report.roadmap.length > 0
        ? report.roadmap
        : [
            "Phase 1: Core AI Features (Transcription, Summarization, Keyword Extraction)",
            "Phase 2: User Experience & Integrations (Intuitive UI, Google Calendar/Outlook)",
            "Phase 3: Advanced AI & Personalization (Cross-note linking, Q&A from notes)",
            "Phase 4: Collaboration & Sharing (Real-time co-editing, secure sharing)",
            "Phase 5: Niche Expansion (Industry-specific templates, offline mode)"
        ];

    const structuredRoadmap = (Array.isArray(report.structuredRoadmap) && report.structuredRoadmap.length > 0
        ? report.structuredRoadmap
        : rawRoadmapItems.map((item, index) => {
            let featureName = typeof item === "string" ? item : item.feature || item.title || item.name || "Roadmap Item";

            let phase = index === 0 ? "Phase 1 — Do First" : index < 3 ? "Phase 2 — Next" : "Phase 3 — Later";
            let priority = index === 0 ? "Critical" : index < 3 ? "High" : "Medium";
            let impact = index < 2 ? "High Impact" : "Medium Impact";
            let effort = index === 0 ? "Low Effort" : index < 3 ? "Medium Effort" : "High Effort";
            let demand = Math.max(50, 92 - index * 9);

            if (typeof item === "object") {
                phase = item.phase || phase;
                priority = item.priority || priority;
                impact = item.impact || impact;
                effort = item.effort || effort;
                demand = item.demand || demand;
            }

            const defaultScores = [95, 88, 76, 61, 48];
            let priorityScore = typeof item === "object" && (item.priorityScore || item.score)
                ? Number(item.priorityScore || item.score)
                : defaultScores[index % defaultScores.length];

            return {
                id: `road-${index + 1}`,
                feature: featureName,
                phase,
                priority,
                impact,
                demand: typeof demand === "number" ? `${demand}%` : `${demand}`,
                effort,
                priorityScore
            };
        })
    );

    return {
        ...report,
        competitors: mergedCompetitors,
        marketGaps: mergedGaps,
        productsAnalyzed,
        reviewsAnalyzed,
        marketGapsCount,
        complaintsCount,
        opportunitiesCount,
        painPoints,
        importantReviews,
        importanceBreakdown,
        sentimentAnalysis,
        structuredMarketGaps,
        featureOpportunities,
        structuredRoadmap
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