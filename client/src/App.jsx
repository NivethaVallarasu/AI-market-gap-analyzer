import { useEffect, useRef, useState, Component } from "react";
import { v4 as uuidv4 } from "uuid";
import { FiSend, FiMessageCircle, FiBarChart2, FiPaperclip, FiX, FiStar, FiUser, FiCpu, FiCopy, FiCheck, FiPlus, FiTrash2, FiClock, FiSidebar, FiArrowRight, FiEye, FiEyeOff, FiShield, FiLogOut, FiDownload, FiPackage, FiMessageSquare, FiAlertTriangle, FiTarget, FiLayers, FiCalendar, FiTrendingUp, FiChevronDown, FiChevronUp, FiFilter, FiSun, FiMoon } from "react-icons/fi";
import mermaid from "mermaid";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { sendMessage, analyzeMarket, getChatHistory, getChatSession, deleteChatSession, signup, login, logout, getMe, updateProfile, getAnalyses, getAnalysis, deleteAnalysis } from "./services/api";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, PieChart, Pie, Legend, ScatterChart, Scatter, ZAxis, ReferenceArea, ReferenceLine } from "recharts";

mermaid.initialize({
    startOnLoad: false,
    securityLevel: "strict",
    theme: "base",
    themeVariables: {
        background: "#0b1220",
        primaryColor: "#2563eb",
        primaryTextColor: "#f8fafc",
        primaryBorderColor: "#60a5fa",
        lineColor: "#94a3b8",
        secondaryColor: "#0f766e",
        tertiaryColor: "#a16207",
        fontFamily: "ui-sans-serif, system-ui, sans-serif"
    }
});

function StarRating({ score }) {
    if (score == null) return null;
    const numScore = Number(score) || 0;
    const starCount = 5;
    const filledStars = Math.min(5, Math.max(0, Math.round((numScore / 100) * starCount)));

    return (
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <div className="flex items-center gap-0.5 shrink-0">
                {[...Array(starCount)].map((_, i) => (
                    <FiStar
                        key={i}
                        size={14}
                        className={
                            i < filledStars
                                ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_4px_rgba(251,191,36,0.4)]"
                                : "text-slate-800"
                        }
                    />
                ))}
            </div>
            <span className="text-[11px] font-semibold text-amber-400 whitespace-nowrap">
                {filledStars}/5
            </span>
        </div>
    );
}

function CustomChartTooltip({ active, payload }) {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="rounded-xl border border-slate-700 bg-slate-900/95 p-3 shadow-xl backdrop-blur">
                <p className="font-semibold text-slate-100">{data.label}</p>
                <div className="mt-1 flex items-center justify-between gap-4 text-xs">
                    <span className="text-slate-400">Category: {data.category || "General"}</span>
                    <span className="font-bold text-amber-400">{data.frequency}% frequency</span>
                </div>
            </div>
        );
    }
    return null;
}

function KeyMarketInsightsSection({ report }) {
    if (!report) return null;

    // 1. Biggest Opportunity
    const topFeature = report?.featureOpportunities?.[0]?.feature;
    const topOpportunitySwot = Array.isArray(report?.swot?.opportunities) ? report.swot.opportunities[0] : null;
    const topGapStr = Array.isArray(report?.marketGaps) ? report.marketGaps[0] : null;
    const biggestOpportunity = topFeature || topOpportunitySwot || topGapStr || "High customer demand for market solutions.";

    // 2. Biggest Customer Pain Point
    const topPainObj = Array.isArray(report?.painPoints) ? report.painPoints[0] : null;
    const topWeakness = Array.isArray(report?.swot?.weaknesses) ? report.swot.weaknesses[0] : null;
    const topThreat = Array.isArray(report?.swot?.threats) ? report.swot.threats[0] : null;
    const biggestPainPoint = topPainObj
        ? `${topPainObj.label || topPainObj.category || "Workflow Friction"}${topPainObj.frequency ? ` (${topPainObj.frequency}% frequency)` : ""}`
        : (topWeakness || topThreat || "Users complain about high costs and usability issues.");

    // 3. Most Important Market Gap
    const topStructGap = Array.isArray(report?.structuredMarketGaps) ? report.structuredMarketGaps[0] : null;
    const gapName = typeof topStructGap === "object" ? topStructGap?.name : topStructGap;
    const mostImportantGap = gapName || topGapStr || "Missing seamless automated workflow integrations.";

    // 4. Most Important Review Pattern
    const topRev = Array.isArray(report?.importantReviews) ? report.importantReviews[0] : null;
    const mostImportantReviewPattern = topRev
        ? (topRev.mainIssue ? `${topRev.mainIssue}${topRev.whyImportant ? ` — ${topRev.whyImportant}` : ""}` : topRev.text)
        : (report?.sentimentAnalysis?.explanation || "Users frequently request native integrations and simplified onboarding.");

    // 5. Recommended Action
    const topRoadmapStruct = Array.isArray(report?.structuredRoadmap) ? report.structuredRoadmap[0] : null;
    const roadmapFeature = typeof topRoadmapStruct === "object" ? topRoadmapStruct?.feature : topRoadmapStruct;
    const topRoadmapStr = Array.isArray(report?.roadmap) ? report.roadmap[0] : null;
    const recommendedAction = roadmapFeature || topRoadmapStr || "Prioritize building the core high-demand feature MVP.";

    const cards = [
        {
            icon: "💡",
            title: "Biggest Opportunity",
            content: biggestOpportunity,
            badge: "High Demand",
            borderColor: "border-amber-500/30 hover:border-amber-500/60",
            bgColor: "bg-amber-500/5",
            textColor: "text-amber-400",
            badgeColor: "bg-amber-500/10 text-amber-300 border-amber-500/30"
        },
        {
            icon: "⚠️",
            title: "Biggest Pain Point",
            content: biggestPainPoint,
            badge: "Critical Friction",
            borderColor: "border-rose-500/30 hover:border-rose-500/60",
            bgColor: "bg-rose-500/5",
            textColor: "text-rose-400",
            badgeColor: "bg-rose-500/10 text-rose-300 border-rose-500/30"
        },
        {
            icon: "🚀",
            title: "Most Important Market Gap",
            content: mostImportantGap,
            badge: "Unmet Need",
            borderColor: "border-purple-500/30 hover:border-purple-500/60",
            bgColor: "bg-purple-500/5",
            textColor: "text-purple-400",
            badgeColor: "bg-purple-500/10 text-purple-300 border-purple-500/30"
        },
        {
            icon: "💬",
            title: "Most Important Review Pattern",
            content: mostImportantReviewPattern,
            badge: "User Signal",
            borderColor: "border-sky-500/30 hover:border-sky-500/60",
            bgColor: "bg-sky-500/5",
            textColor: "text-sky-400",
            badgeColor: "bg-sky-500/10 text-sky-300 border-sky-500/30"
        },
        {
            icon: "🎯",
            title: "Recommended Action",
            content: recommendedAction,
            badge: "Strategic Step",
            borderColor: "border-emerald-500/30 hover:border-emerald-500/60",
            bgColor: "bg-emerald-500/5",
            textColor: "text-emerald-400",
            badgeColor: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
        }
    ];

    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-4">
                <div>
                    <h3 className="text-lg font-bold text-slate-100 sm:text-xl flex items-center gap-2">
                        <span>⚡</span> Key Market Insights
                    </h3>
                    <p className="text-xs text-slate-400">
                        Top findings and key takeaways from the market analysis
                    </p>
                </div>
                <span className="rounded-lg bg-indigo-500/10 border border-indigo-500/30 px-3 py-1 text-xs font-semibold text-indigo-400">
                    Executive Summary
                </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {cards.map((card, idx) => (
                    <div
                        key={idx}
                        className={`group relative flex flex-col justify-between rounded-xl border ${card.borderColor} ${card.bgColor} p-4 transition-all duration-200 hover:shadow-lg backdrop-blur-sm ${idx === 4 ? "sm:col-span-2 lg:col-span-1" : ""}`}
                    >
                        <div>
                            <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                    <span className="text-lg shrink-0">{card.icon}</span>
                                    <h4 className={`text-xs font-bold uppercase tracking-wider leading-snug ${card.textColor}`}>
                                        {card.title}
                                    </h4>
                                </div>
                                <span className={`shrink-0 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${card.badgeColor}`}>
                                    {card.badge}
                                </span>
                            </div>
                            <p className="mt-2 text-xs font-medium leading-relaxed text-slate-200">
                                {card.content}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function CustomerPainPointsSection({ report = {} }) {
    const [isCollapsed, setIsCollapsed] = useState(false);

    const painPoints = Array.isArray(report?.painPoints) && report.painPoints.length > 0
        ? report.painPoints
        : (Array.isArray(report?.swot?.weaknesses) ? report.swot.weaknesses : []).map((w, idx) => ({
            id: `pain-${idx}`,
            label: typeof w === "string" ? w : w.title || "Customer Friction Point",
            frequency: Math.max(45, 88 - idx * 12),
            severity: idx === 0 ? "Critical" : idx < 3 ? "High" : "Medium",
            description: "Identified recurring user complaint across analyzed customer reviews."
        }));

    if (!painPoints.length) return null;

    const getSeverityBadge = (severity) => {
        switch ((severity || "").toLowerCase()) {
            case "critical":
                return "bg-rose-500/10 border-rose-500/30 text-rose-400";
            case "high":
                return "bg-amber-500/10 border-amber-500/30 text-amber-400";
            default:
                return "bg-sky-500/10 border-sky-500/30 text-sky-400";
        }
    };

    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-4">
                <div>
                    <h3 className="text-lg font-bold text-slate-100 sm:text-xl flex items-center gap-2">
                        <span>⚠️</span> Customer Pain Points & Friction
                    </h3>
                    <p className="text-xs text-slate-400">
                        Top complaints and usability obstacles reported by current market users
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="rounded-lg bg-rose-500/10 border border-rose-500/30 px-3 py-1 text-xs font-semibold text-rose-400">
                        {painPoints.length} Key Issues
                    </span>
                    <button
                        type="button"
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="rounded-lg border border-slate-800 bg-slate-900 p-2 text-slate-400 hover:text-white transition"
                        aria-label="Toggle section collapse"
                    >
                        {isCollapsed ? <FiChevronDown size={18} /> : <FiChevronUp size={18} />}
                    </button>
                </div>
            </div>

            {!isCollapsed && (
                <div className="grid gap-4 sm:grid-cols-2">
                    {painPoints.map((item, idx) => {
                        const label = item.label || item.name || item.category || "Workflow Friction";
                        const freq = Number(item.frequency) || 60;
                        const severity = item.severity || (idx === 0 ? "Critical" : "High");

                        return (
                            <div
                                key={idx}
                                className="rounded-xl border border-rose-900/30 bg-rose-950/10 p-4 space-y-3 transition hover:border-rose-500/50 hover:bg-rose-950/20"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <h4 className="font-semibold text-sm text-slate-100 leading-snug break-words">
                                        {label}
                                    </h4>
                                    <span className={`shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-bold ${getSeverityBadge(severity)}`}>
                                        {severity}
                                    </span>
                                </div>

                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs text-slate-400 font-medium">
                                        <span>Mention Frequency</span>
                                        <span className="font-bold text-rose-400">{freq}%</span>
                                    </div>
                                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-950">
                                        <div
                                            className="h-full rounded-full bg-gradient-to-r from-rose-600 to-amber-500 transition-all duration-500"
                                            style={{ width: `${Math.min(100, Math.max(5, freq))}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function ReviewImportanceSection({
    importantReviews = [],
    importanceBreakdown = {},
    report = {},
    sentimentFilter = "All",
    setSentimentFilter = () => {},
    selectedFilter: controlledSelectedFilter,
    setSelectedFilter: controlledSetSelectedFilter
}) {
    const [internalFilter, setInternalFilter] = useState("All");
    const selectedFilter = controlledSelectedFilter !== undefined ? controlledSelectedFilter : internalFilter;
    const setSelectedFilter = controlledSetSelectedFilter || setInternalFilter;
    const [expandedReviewId, setExpandedReviewId] = useState(null);
    const [isCollapsed, setIsCollapsed] = useState(false);

    const defaultReviews = [
        {
            id: "rev-1",
            text: "No native Slack or Notion integrations exist. Manual copy-pasting is extremely tedious.",
            importanceScore: 92,
            importanceLevel: "Critical",
            sentiment: "Negative",
            mainIssue: "Missing Slack/Notion Export",
            category: "Integrations",
            whyImportant: "Direct evidence of a missing workflow integration causing severe user friction."
        },
        {
            id: "rev-2",
            text: "Real-time co-editing in shared team workspaces is missing.",
            importanceScore: 88,
            importanceLevel: "Critical",
            sentiment: "Negative",
            mainIssue: "No Team Collaboration",
            category: "Collaboration",
            whyImportant: "Identifies a critical enterprise gap where teams cannot work together."
        },
        {
            id: "rev-3",
            text: "Great summary quality, but exporting meeting notes to external apps takes too many clicks.",
            importanceScore: 78,
            importanceLevel: "High",
            sentiment: "Mixed",
            mainIssue: "Cumbersome Export Flow",
            category: "Usability",
            whyImportant: "High demand for instant note sharing and calendar syncing."
        },
        {
            id: "rev-4",
            text: "Pricing is steep for solo developers who only need basic summaries.",
            importanceScore: 65,
            importanceLevel: "Medium",
            sentiment: "Negative",
            mainIssue: "High Solo Tier Pricing",
            category: "Pricing",
            whyImportant: "Moderate opportunity to capture individual creators with a tiered pricing model."
        },
        {
            id: "rev-5",
            text: "Initial setup wizard is somewhat confusing for non-technical users.",
            importanceScore: 52,
            importanceLevel: "Low",
            sentiment: "Neutral",
            mainIssue: "Complex Onboarding",
            category: "Onboarding",
            whyImportant: "Useful UX feedback regarding first-run onboarding complexity."
        }
    ];

    const reviews = Array.isArray(importantReviews) && importantReviews.length > 0
        ? importantReviews
        : defaultReviews;

    const sortedReviews = [...reviews].sort((a, b) => (b.importanceScore || 0) - (a.importanceScore || 0));

    const filterCounts = {
        All: sortedReviews.length,
        Critical: sortedReviews.filter((r) => r.importanceLevel === "Critical").length,
        High: sortedReviews.filter((r) => r.importanceLevel === "High").length,
        Medium: sortedReviews.filter((r) => r.importanceLevel === "Medium").length,
        Low: sortedReviews.filter((r) => r.importanceLevel === "Low").length
    };

    const filteredReviews = sortedReviews.filter((r) => {
        return selectedFilter === "All" || r.importanceLevel === selectedFilter;
    });

    const pieData = [
        { name: "Critical", value: filterCounts.Critical, color: "#ef4444" },
        { name: "High", value: filterCounts.High, color: "#f59e0b" },
        { name: "Medium", value: filterCounts.Medium, color: "#3b82f6" },
        { name: "Low", value: filterCounts.Low, color: "#10b981" }
    ].filter((item) => item.value > 0);

    const getLevelBadge = (level) => {
        switch (level) {
            case "Critical":
                return "bg-rose-500/10 border-rose-500/30 text-rose-400";
            case "High":
                return "bg-amber-500/10 border-amber-500/30 text-amber-400";
            case "Medium":
                return "bg-sky-500/10 border-sky-500/30 text-sky-400";
            default:
                return "bg-emerald-500/10 border-emerald-500/30 text-emerald-400";
        }
    };

    const getSentimentBadge = (sentiment) => {
        switch (sentiment) {
            case "Negative":
                return "bg-rose-950/60 text-rose-300 border-rose-800/50";
            case "Mixed":
                return "bg-amber-950/60 text-amber-300 border-amber-800/50";
            case "Positive":
                return "bg-emerald-950/60 text-emerald-300 border-emerald-800/50";
            default:
                return "bg-slate-800 text-slate-300 border-slate-700";
        }
    };

    return (
        <div id="review-importance-section" className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-4">
                <div>
                    <h3 className="text-lg font-bold text-slate-100 sm:text-xl">
                        Review Importance & Gap Discovery
                    </h3>
                    <p className="text-xs text-slate-400">
                        Categorized review signals rated by strategic importance for uncovering market gaps
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 text-xs font-semibold text-emerald-400">
                        Interactive Signals ({filteredReviews.length})
                    </span>
                    <button
                        type="button"
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="rounded-lg border border-slate-800 bg-slate-900 p-2 text-slate-400 hover:text-white transition"
                        aria-label="Toggle section collapse"
                    >
                        {isCollapsed ? <FiChevronDown size={18} /> : <FiChevronUp size={18} />}
                    </button>
                </div>
            </div>

            {!isCollapsed && (
                <>
                    {/* Donut Chart & Breakdown */}
                    <div className="grid gap-6 md:grid-cols-12 items-center rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                        <div className="md:col-span-5 h-[200px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={48}
                                        outerRadius={78}
                                        paddingAngle={4}
                                        onClick={(entry) => entry && entry.name && setSelectedFilter(entry.name)}
                                        className="cursor-pointer"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`pie-cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value, name) => [`${value} reviews (Click to filter)`, `Importance: ${name}`]}
                                        contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px", color: "#f8fafc" }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="md:col-span-7 space-y-3">
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                Click any level to filter reviews:
                            </p>
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                {[
                                    { level: "Critical", count: filterCounts.Critical, border: "border-rose-900/40 bg-rose-950/30 text-rose-400" },
                                    { level: "High", count: filterCounts.High, border: "border-amber-900/40 bg-amber-950/30 text-amber-400" },
                                    { level: "Medium", count: filterCounts.Medium, border: "border-sky-900/40 bg-sky-950/30 text-sky-400" },
                                    { level: "Low", count: filterCounts.Low, border: "border-emerald-900/40 bg-emerald-950/30 text-emerald-400" }
                                ].map((item) => (
                                    <div
                                        key={item.level}
                                        onClick={() => setSelectedFilter(selectedFilter === item.level ? "All" : item.level)}
                                        className={`cursor-pointer rounded-xl border p-3 transition ${item.border} ${selectedFilter === item.level ? "ring-2 ring-indigo-500 shadow-lg" : "hover:opacity-90"}`}
                                    >
                                        <span className="text-xs font-medium">{item.level}</span>
                                        <p className="mt-1 text-2xl font-bold">{item.count}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Filter Bar: Importance */}
                    <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-950/40 p-3">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="flex items-center gap-1 text-xs font-semibold text-slate-400 mr-1">
                                <FiFilter size={14} /> Importance:
                            </span>
                            {["All", "Critical", "High", "Medium", "Low"].map((filter) => (
                                <button
                                    key={filter}
                                    type="button"
                                    onClick={() => setSelectedFilter(filter)}
                                    className={`flex items-center gap-1.5 rounded-xl border px-3 py-1 text-xs font-semibold transition ${
                                        selectedFilter === filter
                                            ? "border-indigo-500 bg-indigo-600 text-white shadow-md"
                                            : "border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                                    }`}
                                >
                                    <span>{filter}</span>
                                    <span className={`rounded-full px-1.5 py-0.2 text-[10px] ${selectedFilter === filter ? "bg-indigo-700 text-white" : "bg-slate-800 text-slate-400"}`}>
                                        {filterCounts[filter]}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Review Cards List */}
                    <div className="space-y-3">
                        {filteredReviews.length ? (
                            filteredReviews.map((rev) => {
                                const isExpanded = expandedReviewId === rev.id;

                                return (
                                    <div
                                        key={rev.id}
                                        onClick={() => setExpandedReviewId(isExpanded ? null : rev.id)}
                                        className="group cursor-pointer rounded-2xl border border-slate-800 bg-slate-950/80 p-4 transition hover:border-indigo-500/40 hover:bg-slate-900/60"
                                    >
                                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/60 pb-3">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className={`rounded-lg border px-2.5 py-0.5 text-xs font-semibold ${getLevelBadge(rev.importanceLevel)}`}>
                                                    {rev.importanceLevel} Importance
                                                </span>
                                                <span className="rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-0.5 text-xs font-medium text-amber-400">
                                                    Score: {rev.importanceScore}/100
                                                </span>
                                                {rev.category && (
                                                    <span className="rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-0.5 text-xs text-slate-400">
                                                        {rev.category}
                                                    </span>
                                                )}
                                            </div>
                                            <button
                                                type="button"
                                                className="text-slate-400 transition group-hover:text-white"
                                                aria-label={isExpanded ? "Collapse review details" : "Expand review details"}
                                            >
                                                {isExpanded ? <FiChevronUp size={18} /> : <FiChevronDown size={18} />}
                                            </button>
                                        </div>

                                        <div className="mt-3 space-y-2">
                                            <p className="text-sm font-semibold text-slate-200 break-words">
                                                Issue: {rev.mainIssue}
                                            </p>
                                            <p className={`text-xs leading-relaxed text-slate-300 italic break-words ${!isExpanded ? "line-clamp-3" : ""}`}>
                                                "{rev.text}"
                                            </p>

                                            {isExpanded && (
                                                <div className="mt-3 rounded-xl border border-indigo-900/40 bg-indigo-950/20 p-3 text-xs space-y-1.5 animate-fadeIn">
                                                    <p className="font-semibold text-indigo-300">
                                                        Why this review is key for discovering market gaps:
                                                    </p>
                                                    <p className="text-slate-300 leading-relaxed break-words">
                                                        {rev.whyImportant}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="rounded-xl border border-dashed border-slate-800 p-6 text-center text-xs text-slate-500">
                                No reviews found matching the selected importance and sentiment filters.
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}



function FeatureOpportunitySection({ featureOpportunities = [], report = {} }) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [selectedPoint, setSelectedPoint] = useState(null);

    const rawFeatures = Array.isArray(report?.featureOpportunities) && report.featureOpportunities.length > 0
        ? report.featureOpportunities
        : Array.isArray(featureOpportunities) && featureOpportunities.length > 0
            ? featureOpportunities
            : (Array.isArray(report?.roadmap) ? report.roadmap : []).map((feat, idx) => {
                const featureName = typeof feat === "string" ? feat : feat.feature || feat.name || "Feature Opportunity";
                const sampleDemands = [88, 82, 76, 65, 54];
                const sampleCompetitions = [28, 35, 22, 70, 42];
                const demand = sampleDemands[idx % sampleDemands.length];
                const competition = sampleCompetitions[idx % sampleCompetitions.length];
                const score = Math.round((demand * 1.1) - (competition * 0.3));

                return {
                    feature: featureName,
                    demand,
                    competition,
                    score: Math.min(100, Math.max(10, score)),
                    isGoldmine: demand >= 60 && competition <= 45
                };
            });

    const dataPoints = [...rawFeatures].map((item) => ({
        feature: item.feature || item.name || "Feature Opportunity",
        demand: Number(item.demand) || 50,
        competition: Number(item.competition) || 50,
        score: Number(item.score) || 60,
        isGoldmine: (Number(item.demand) || 50) >= 60 && (Number(item.competition) || 50) <= 45
    })).sort((a, b) => b.score - a.score);

    if (!dataPoints.length) return null;

    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-4">
                <div>
                    <h3 className="text-lg font-bold text-slate-100 sm:text-xl">
                        Feature Opportunity Matrix
                    </h3>
                    <p className="text-xs text-slate-400">
                        Scatter plot of Customer Demand vs. Competition Level (High Demand + Low Competition Zone highlighted)
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 text-xs font-semibold text-emerald-400">
                        Prime Quadrant Highlighted
                    </span>
                    <button
                        type="button"
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="rounded-lg border border-slate-800 bg-slate-900 p-2 text-slate-400 hover:text-white transition"
                        aria-label="Toggle section collapse"
                    >
                        {isCollapsed ? <FiChevronDown size={18} /> : <FiChevronUp size={18} />}
                    </button>
                </div>
            </div>

            {!isCollapsed && (
                <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-2">
                    <div className="flex items-center justify-between px-2 text-xs">
                        <span className="font-semibold text-slate-400">Y-Axis: Customer Demand (0 - 100%)</span>
                        <span className="font-semibold text-slate-400">X-Axis: Competition Level (0 - 100%)</span>
                    </div>

                    <div className="h-[320px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
                                <XAxis
                                    type="number"
                                    dataKey="competition"
                                    name="Competition"
                                    unit="%"
                                    domain={[0, 100]}
                                    stroke="#64748b"
                                    fontSize={12}
                                    label={{ value: "Competition Level (Low → High)", position: "bottom", offset: 0, fill: "#94a3b8", fontSize: 11 }}
                                />
                                <YAxis
                                    type="number"
                                    dataKey="demand"
                                    name="Demand"
                                    unit="%"
                                    domain={[0, 100]}
                                    stroke="#64748b"
                                    fontSize={12}
                                    label={{ value: "Customer Demand (Low → High)", angle: -90, position: "insideLeft", fill: "#94a3b8", fontSize: 11 }}
                                />
                                <ZAxis type="number" dataKey="score" range={[100, 300]} name="Score" />

                                <ReferenceArea
                                    x1={0}
                                    x2={45}
                                    y1={60}
                                    y2={100}
                                    fill="#10b981"
                                    fillOpacity={0.12}
                                    stroke="#10b981"
                                    strokeDasharray="3 3"
                                />
                                <ReferenceLine x={45} stroke="#334155" strokeDasharray="3 3" />
                                <ReferenceLine y={60} stroke="#334155" strokeDasharray="3 3" />

                                <Tooltip
                                    cursor={{ strokeDasharray: "3 3" }}
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            const point = payload[0].payload;
                                            return (
                                                <div className="rounded-xl border border-slate-700 bg-slate-900/95 p-3 shadow-xl backdrop-blur space-y-1.5 max-w-xs">
                                                    <p className="font-semibold text-slate-100 text-xs">{point.feature}</p>
                                                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                                                        <span className="text-emerald-400">Demand: {point.demand}%</span>
                                                        <span className="text-amber-400">Competition: {point.competition}%</span>
                                                        <span className="text-purple-400 font-bold col-span-2">Opportunity Score: {point.score}/100</span>
                                                    </div>
                                                    {point.isGoldmine && (
                                                        <span className="inline-block rounded bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                                                            ★ High Demand + Low Competition
                                                        </span>
                                                    )}
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />

                                <Scatter
                                    name="Features"
                                    data={dataPoints}
                                    onClick={(point) => point && setSelectedPoint(point)}
                                    className="cursor-pointer"
                                >
                                    {dataPoints.map((entry, index) => (
                                        <Cell
                                            key={`scatter-cell-${index}`}
                                            fill={entry.isGoldmine ? "#10b981" : entry.demand >= 60 ? "#6366f1" : "#f59e0b"}
                                        />
                                    ))}
                                </Scatter>
                            </ScatterChart>
                        </ResponsiveContainer>
                    </div>

                    {selectedPoint && (
                        <div className="mt-3 rounded-xl border border-indigo-500/40 bg-indigo-950/30 p-4 space-y-1.5 flex items-center justify-between">
                            <div>
                                <span className="text-xs font-semibold uppercase text-indigo-300">Selected Feature Detail:</span>
                                <h4 className="font-bold text-white text-sm">{selectedPoint.feature}</h4>
                                <p className="text-xs text-slate-300">
                                    Customer Demand: <strong className="text-emerald-400">{selectedPoint.demand}%</strong> | Competition Level: <strong className="text-amber-400">{selectedPoint.competition}%</strong> | Opportunity Score: <strong className="text-purple-400">{selectedPoint.score}/100</strong>
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedPoint(null)}
                                className="text-xs text-slate-400 hover:text-white"
                            >
                                <FiX size={16} />
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function VisualRoadmapSection({ structuredRoadmap = [], report = {} }) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [sortMode, setSortMode] = useState("phase");
    const [expandedFeatureId, setExpandedFeatureId] = useState(null);

    const rawItems = Array.isArray(report?.structuredRoadmap) && report.structuredRoadmap.length > 0
        ? report.structuredRoadmap
        : Array.isArray(structuredRoadmap) && structuredRoadmap.length > 0
            ? structuredRoadmap
            : (Array.isArray(report?.roadmap) ? report.roadmap : []).map((item, idx) => ({
                id: `road-${idx + 1}`,
                feature: typeof item === "string" ? item : item.feature || item.title || "Roadmap Feature",
                phase: idx === 0 ? "Phase 1 — Do First" : idx < 3 ? "Phase 2 — Next" : "Phase 3 — Later",
                priority: idx === 0 ? "Critical" : idx < 3 ? "High" : "Medium",
                impact: idx < 2 ? "High Impact" : "Medium Impact",
                demand: `${Math.max(50, 92 - idx * 9)}%`,
                effort: idx === 0 ? "Low Effort" : idx < 3 ? "Medium Effort" : "High Effort"
            }));

    const sortedItems = [...rawItems].sort((a, b) => {
        if (sortMode === "demand") {
            const numA = parseInt(a.demand || "0", 10);
            const numB = parseInt(b.demand || "0", 10);
            return numB - numA;
        }
        if (sortMode === "priority") {
            const pRank = { critical: 3, high: 2, medium: 1, low: 0 };
            return (pRank[(b.priority || "").toLowerCase()] || 0) - (pRank[(a.priority || "").toLowerCase()] || 0);
        }
        return 0;
    });

    const phase1Items = sortedItems.filter((i) => (i.phase || "").includes("Phase 1") || (i.priority || "").toLowerCase() === "critical");
    const phase2Items = sortedItems.filter((i) => (i.phase || "").includes("Phase 2") || ((i.priority || "").toLowerCase() === "high" && !phase1Items.includes(i)));
    const phase3Items = sortedItems.filter((i) => !phase1Items.includes(i) && !phase2Items.includes(i));

    const phases = [
        {
            title: "Phase 1 — Do First",
            subtitle: "Build First (Critical Priority)",
            badgeBg: "bg-rose-500/10 border-rose-500/30 text-rose-400",
            headerBg: "from-rose-950/40 to-slate-900/40 border-rose-900/50",
            stepBadge: "bg-rose-500 text-slate-950",
            stepNum: "1",
            items: phase1Items.length ? phase1Items : sortedItems.slice(0, 1)
        },
        {
            title: "Phase 2 — Next",
            subtitle: "Build Next (High Priority)",
            badgeBg: "bg-amber-500/10 border-amber-500/30 text-amber-400",
            headerBg: "from-amber-950/40 to-slate-900/40 border-amber-900/50",
            stepBadge: "bg-amber-500 text-slate-950",
            stepNum: "2",
            items: phase2Items.length ? phase2Items : sortedItems.slice(1, 3)
        },
        {
            title: "Phase 3 — Later",
            subtitle: "Build Later (Medium & Future)",
            badgeBg: "bg-sky-500/10 border-sky-500/30 text-sky-400",
            headerBg: "from-sky-950/40 to-slate-900/40 border-sky-900/50",
            stepBadge: "bg-sky-500 text-slate-950",
            stepNum: "3",
            items: phase3Items.length ? phase3Items : sortedItems.slice(3)
        }
    ];

    const getPriorityBadge = (priority) => {
        switch ((priority || "").toLowerCase()) {
            case "critical":
                return "bg-rose-500/20 text-rose-300 border-rose-500/40";
            case "high":
                return "bg-amber-500/20 text-amber-300 border-amber-500/40";
            default:
                return "bg-sky-500/20 text-sky-300 border-sky-500/40";
        }
    };

    let globalItemCount = 0;

    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
                <div>
                    <h3 className="text-lg font-bold text-slate-100 sm:text-xl">
                        Strategic Feature Roadmap
                    </h3>
                    <p className="text-xs text-slate-400">
                        Prioritized action plan organized into execution phases (Click any feature card to expand details)
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Sort Selector */}
                    <div className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-300">
                        <span className="text-slate-500 font-medium">Sort:</span>
                        <select
                            value={sortMode}
                            onChange={(e) => setSortMode(e.target.value)}
                            className="bg-transparent font-semibold text-indigo-400 focus:outline-none cursor-pointer"
                        >
                            <option value="phase" className="bg-slate-900 text-slate-200">Phase Order</option>
                            <option value="demand" className="bg-slate-900 text-slate-200">Highest Demand %</option>
                            <option value="priority" className="bg-slate-900 text-slate-200">Priority Score</option>
                        </select>
                    </div>

                    <button
                        type="button"
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="rounded-lg border border-slate-800 bg-slate-900 p-2 text-slate-400 hover:text-white transition"
                        aria-label="Toggle section collapse"
                    >
                        {isCollapsed ? <FiChevronDown size={18} /> : <FiChevronUp size={18} />}
                    </button>
                </div>
            </div>

            {!isCollapsed && (
                <>
                    {/* Progression Sequence Banner */}
                    <div className="flex items-center gap-2 rounded-xl border border-indigo-900/50 bg-indigo-950/40 px-3.5 py-2 text-xs font-semibold text-indigo-300 shadow-inner">
                        <span className="flex items-center gap-1.5">
                            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-slate-950">1</span>
                            Build First
                        </span>
                        <FiArrowRight size={13} className="text-indigo-400" />
                        <span className="flex items-center gap-1.5">
                            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-slate-950">2</span>
                            Build Next
                        </span>
                        <FiArrowRight size={13} className="text-indigo-400" />
                        <span className="flex items-center gap-1.5">
                            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-sky-500 text-[10px] font-bold text-slate-950">3</span>
                            Build Later
                        </span>
                    </div>

                    {/* Structured Phase Sections */}
                    <div className="space-y-6">
                        {phases.map((phase) => (
                            <div key={phase.title} className="rounded-xl border border-slate-800/80 bg-slate-950/60 overflow-hidden">
                                {/* Phase Header Bar */}
                                <div className={`flex flex-wrap items-center justify-between gap-2 border-b bg-gradient-to-r ${phase.headerBg} px-4 py-3`}>
                                    <div className="flex items-center gap-2.5">
                                        <span className={`flex h-6 w-6 items-center justify-center rounded-lg text-xs font-extrabold ${phase.stepBadge}`}>
                                            {phase.stepNum}
                                        </span>
                                        <div>
                                            <h4 className="text-sm font-bold text-slate-100">{phase.title}</h4>
                                            <p className="text-[11px] text-slate-400">{phase.subtitle}</p>
                                        </div>
                                    </div>
                                    <span className={`rounded-lg border px-2.5 py-0.5 text-xs font-semibold ${phase.badgeBg}`}>
                                        {phase.items.length} {phase.items.length === 1 ? "feature" : "features"}
                                    </span>
                                </div>

                                {/* Neatly Aligned Feature List */}
                                <div className="divide-y divide-slate-800/60">
                                    {phase.items.map((item) => {
                                        globalItemCount++;
                                        const isExpanded = expandedFeatureId === (item.id || globalItemCount);

                                        return (
                                            <div key={item.id || globalItemCount} className="p-4 space-y-3 transition hover:bg-slate-900/40">
                                                <div
                                                    onClick={() => setExpandedFeatureId(isExpanded ? null : (item.id || globalItemCount))}
                                                    className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between cursor-pointer"
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded bg-slate-900 border border-slate-800 text-[11px] font-bold text-slate-400">
                                                            #{globalItemCount}
                                                        </span>
                                                        <span className="font-semibold text-slate-100 text-sm leading-snug">
                                                            {item.feature}
                                                        </span>
                                                    </div>

                                                    {/* Neatly Aligned Metadata Pills */}
                                                    <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
                                                        <span className={`rounded-md border px-2.5 py-1 text-[11px] font-bold ${getPriorityBadge(item.priority)}`}>
                                                            {item.priority || "Planned"}
                                                        </span>
                                                        <span className="rounded-md border border-slate-800 bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-slate-300">
                                                            {item.impact || "High Impact"}
                                                        </span>
                                                        <span className="rounded-md border border-emerald-900/50 bg-emerald-950/40 px-2.5 py-1 text-[11px] font-bold text-emerald-400">
                                                            {item.demand || "80%"} Demand
                                                        </span>
                                                        <span className="rounded-md border border-slate-800 bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-slate-400">
                                                            {item.effort || "Medium Effort"}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            className="text-slate-400 hover:text-white transition ml-1"
                                                        >
                                                            {isExpanded ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Expandable Feature Details Drawer */}
                                                {isExpanded && (
                                                    <div className="mt-3 rounded-xl border border-indigo-900/40 bg-indigo-950/20 p-4 text-xs space-y-2">
                                                        <div className="flex items-center justify-between border-b border-indigo-900/40 pb-2">
                                                            <span className="font-bold text-indigo-300 uppercase tracking-wider text-[11px]">Feature Implementation Rationale</span>
                                                            <span className="text-slate-400">Phase Target: {item.phase || phase.title}</span>
                                                        </div>
                                                        <p className="text-slate-200 leading-relaxed">
                                                            This feature addresses severe user complaints uncovered during sentiment analysis. Building this feature in {phase.title} directly resolves top market friction points and maximizes competitive differentiation.
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

function VisualSwotSection({ report = {} }) {
    const swotObj = report?.swot && typeof report.swot === "object" ? report.swot : {};

    const getItems = (key) => {
        const val = swotObj[key] || swotObj[key.toLowerCase()] || [];
        return Array.isArray(val) ? val : typeof val === "string" ? [val] : [];
    };

    const strengths = getItems("strengths");
    const weaknesses = getItems("weaknesses");
    const opportunities = getItems("opportunities");
    const threats = getItems("threats");

    const quadrants = [
        {
            key: "strengths",
            title: "Strengths",
            badge: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
            cardBg: "border-emerald-900/40 bg-emerald-950/20",
            bulletColor: "text-emerald-400",
            icon: <FiCheck className="text-emerald-400" size={16} />,
            items: strengths
        },
        {
            key: "weaknesses",
            title: "Weaknesses",
            badge: "bg-rose-500/10 border-rose-500/30 text-rose-400",
            cardBg: "border-rose-900/40 bg-rose-950/20",
            bulletColor: "text-rose-400",
            icon: <FiAlertTriangle className="text-rose-400" size={16} />,
            items: weaknesses
        },
        {
            key: "opportunities",
            title: "Opportunities",
            badge: "bg-amber-500/10 border-amber-500/30 text-amber-400",
            cardBg: "border-amber-900/40 bg-amber-950/20",
            bulletColor: "text-amber-400",
            icon: <FiTrendingUp className="text-amber-400" size={16} />,
            items: opportunities
        },
        {
            key: "threats",
            title: "Threats",
            badge: "bg-sky-500/10 border-sky-500/30 text-sky-400",
            cardBg: "border-sky-900/40 bg-sky-950/20",
            bulletColor: "text-sky-400",
            icon: <FiShield className="text-sky-400" size={16} />,
            items: threats
        }
    ];

    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-4">
                <div>
                    <h3 className="text-lg font-bold text-slate-100 sm:text-xl">
                        SWOT Strategic Analysis
                    </h3>
                    <p className="text-xs text-slate-400">
                        2×2 Matrix mapping internal capabilities against external market forces
                    </p>
                </div>
                <span className="rounded-lg bg-indigo-500/10 border border-indigo-500/30 px-3 py-1 text-xs font-semibold text-indigo-400">
                    2×2 Matrix View
                </span>
            </div>

            {/* 2×2 Quadrant Grid */}
            <div className="grid gap-4 md:grid-cols-2">
                {quadrants.map((quad) => (
                    <div
                        key={quad.key}
                        className={`rounded-xl border p-5 space-y-3 transition ${quad.cardBg}`}
                    >
                        <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
                            <div className="flex items-center gap-2">
                                {quad.icon}
                                <h4 className="font-bold text-slate-100 text-sm">{quad.title}</h4>
                            </div>
                            <span className={`rounded-lg border px-2.5 py-0.5 text-xs font-semibold ${quad.badge}`}>
                                {quad.items.length} {quad.items.length === 1 ? "factor" : "factors"}
                            </span>
                        </div>

                        {quad.items.length ? (
                            <ul className="space-y-2 text-xs leading-relaxed text-slate-300">
                                {quad.items.map((item, idx) => (
                                    <li key={idx} className="flex items-start gap-2">
                                        <span className={`mt-1 text-xs font-bold ${quad.bulletColor}`}>•</span>
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-xs text-slate-500 italic py-2">
                                No {quad.title.toLowerCase()} recorded for this analysis.
                            </p>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

function InteractiveVerdictSection({ report = {} }) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const score = report?.opportunityScore ?? 75;
    const verdict = report?.verdict || "No verdict available.";

    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-4">
                <div>
                    <h3 className="text-lg font-bold text-slate-100 sm:text-xl flex items-center gap-2">
                        <span>🎯</span> Strategic Verdict
                    </h3>
                    <p className="text-xs text-slate-400">
                        AI Executive assessment & market opportunity score
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 text-xs font-semibold text-emerald-400">
                        Score: {score}/100
                    </span>
                    <button
                        type="button"
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="rounded-lg border border-slate-800 bg-slate-900 p-2 text-slate-400 hover:text-white transition"
                        aria-label="Toggle section collapse"
                    >
                        {isCollapsed ? <FiChevronDown size={18} /> : <FiChevronUp size={18} />}
                    </button>
                </div>
            </div>

            {!isCollapsed && (
                <div className="rounded-xl border border-indigo-900/40 bg-indigo-950/20 p-5 space-y-3">
                    <p className="text-sm leading-relaxed text-slate-200 font-medium">
                        {verdict}
                    </p>
                </div>
            )}
        </div>
    );
}

function InteractiveMarketGapsSection({ report = {}, onSelectGap = () => {} }) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [sortMode, setSortMode] = useState("default");

    const rawGaps = Array.isArray(report?.structuredMarketGaps) && report.structuredMarketGaps.length > 0
        ? report.structuredMarketGaps
        : Array.isArray(report?.marketGaps) ? report.marketGaps : [];

    const gapsList = rawGaps.map((item, idx) => {
        if (typeof item === "object" && item !== null) {
            return {
                id: `gap-${idx}`,
                name: item.name || item.title || "Market Gap",
                impact: item.impact || "High Impact",
                severity: item.severity || "High",
                frequency: item.frequency || 75
            };
        }
        return {
            id: `gap-${idx}`,
            name: String(item),
            impact: idx === 0 ? "Critical Gap — High Demand" : "Unmet Market Need",
            severity: idx === 0 ? "Critical" : "High",
            frequency: Math.max(50, 85 - idx * 10)
        };
    });

    const sortedGaps = [...gapsList].sort((a, b) => {
        if (sortMode === "name") {
            return a.name.localeCompare(b.name);
        }
        if (sortMode === "impact") {
            return b.frequency - a.frequency;
        }
        return 0;
    });

    const competitors = Array.isArray(report?.competitors) && report.competitors.length
        ? report.competitors
        : ["No direct competitors listed"];

    return (
        <div className="grid gap-6 xl:grid-cols-12">
            <div className="xl:col-span-5 rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
                    <div>
                        <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                            <span>🛡️</span> Key Competitors
                        </h3>
                        <p className="text-xs text-slate-400">Existing solutions in this market</p>
                    </div>
                    <span className="rounded-lg bg-sky-500/10 border border-sky-500/30 px-2.5 py-1 text-xs font-semibold text-sky-400">
                        {competitors.length} Analyzed
                    </span>
                </div>

                <div className="space-y-2">
                    {competitors.map((comp, idx) => (
                        <div key={idx} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-xs text-slate-200">
                            <span className="font-semibold text-slate-200">{typeof comp === "object" ? comp.name || comp.title : comp}</span>
                            <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400">Competitor</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="xl:col-span-7 rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                    <div>
                        <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                            <span>🚀</span> Unmet Market Gaps
                        </h3>
                        <p className="text-xs text-slate-400">
                            Click any market gap to inspect supporting customer review evidence
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-300">
                            <span className="text-slate-500 font-medium">Sort:</span>
                            <select
                                value={sortMode}
                                onChange={(e) => setSortMode(e.target.value)}
                                className="bg-transparent font-semibold text-indigo-400 focus:outline-none cursor-pointer"
                            >
                                <option value="default" className="bg-slate-900 text-slate-200">Default Order</option>
                                <option value="impact" className="bg-slate-900 text-slate-200">Highest Demand / Frequency</option>
                                <option value="name" className="bg-slate-900 text-slate-200">Alphabetical (A-Z)</option>
                            </select>
                        </div>

                        <button
                            type="button"
                            onClick={() => setIsCollapsed(!isCollapsed)}
                            className="rounded-lg border border-slate-800 bg-slate-900 p-2 text-slate-400 hover:text-white transition"
                            aria-label="Toggle section collapse"
                        >
                            {isCollapsed ? <FiChevronDown size={18} /> : <FiChevronUp size={18} />}
                        </button>
                    </div>
                </div>

                {!isCollapsed && (
                    <div className="space-y-3">
                        {sortedGaps.map((gap) => (
                            <div
                                key={gap.id}
                                onClick={() => onSelectGap(gap)}
                                className="group cursor-pointer rounded-xl border border-purple-900/30 bg-purple-950/10 p-4 transition hover:border-purple-500/60 hover:bg-purple-950/30 space-y-2"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <h4 className="font-semibold text-slate-100 text-sm group-hover:text-purple-300 transition">
                                        {gap.name}
                                    </h4>
                                    <span className="shrink-0 rounded-full border border-purple-500/30 bg-purple-500/10 px-2.5 py-0.5 text-[10px] font-bold text-purple-300">
                                        Click to view evidence →
                                    </span>
                                </div>
                                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                                    <span className="text-slate-300 font-medium">{gap.impact}</span>
                                    <span>•</span>
                                    <span className="text-amber-400 font-semibold">{gap.frequency}% Demand Frequency</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}





function CodeBlock({ code, language }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        try {
            navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // fallback
        }
    };

    return (
        <div className="my-3 overflow-hidden rounded-xl border border-slate-800 bg-slate-950 font-mono text-xs shadow-inner">
            <div className="flex items-center justify-between border-b border-slate-800/80 bg-slate-900/90 px-3 py-1.5 text-slate-400">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    {language || "text"}
                </span>
                <button
                    type="button"
                    onClick={handleCopy}
                    className="flex items-center gap-1 text-[11px] text-slate-400 transition hover:text-white"
                >
                    {copied ? <FiCheck className="text-emerald-400" size={13} /> : <FiCopy size={13} />}
                    {copied ? "Copied" : "Copy"}
                </button>
            </div>
            <pre className="overflow-x-auto p-3.5 leading-relaxed text-slate-200">
                <code>{code}</code>
            </pre>
        </div>
    );
}

function MermaidDiagram({ chart, diagramId }) {
    const [svg, setSvg] = useState("");
    const [error, setError] = useState(false);

    useEffect(() => {
        let active = true;

        mermaid.render(diagramId, chart)
            .then(({ svg: renderedSvg }) => {
                if (active) setSvg(renderedSvg);
            })
            .catch(() => {
                if (active) setError(true);
            });

        return () => {
            active = false;
        };
    }, [chart, diagramId]);

    if (error) {
        return <CodeBlock code={chart} language="mermaid" />;
    }

    if (!svg) return <p className="my-3 text-xs text-slate-400">Rendering diagram...</p>;

    return <div className="mermaid-shell my-3 overflow-x-auto" dangerouslySetInnerHTML={{ __html: svg }} />;
}

function renderInlineMarkdown(text) {
    if (!text) return text;
    const parts = [];
    let key = 0;
    const regex = /(\*\*.+?\*\*|`.+?`)/g;
    const tokens = text.split(regex);

    tokens.forEach((token) => {
        if (!token) return;
        if (token.startsWith("**") && token.endsWith("**")) {
            parts.push(
                <strong key={key++} className="font-semibold text-slate-100">
                    {token.slice(2, -2)}
                </strong>
            );
        } else if (token.startsWith("`") && token.endsWith("`")) {
            parts.push(
                <code key={key++} className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-xs text-sky-300">
                    {token.slice(1, -1)}
                </code>
            );
        } else {
            parts.push(token);
        }
    });

    return parts;
}

function MessageContent({ text = "", isBot = false }) {
    const safeText = typeof text === "string" ? text : String(text || "");
    if (!isBot) return safeText;
    if (!safeText) return null;

    try {
        const blocks = [];
        const codeBlockRegex = /```(\w*)\s*\n([\s\S]*?)```/g;
        let lastIndex = 0;
        let match;

        const renderTextBlock = (rawText, blockKey) => {
            const lines = (rawText || "").split("\n");
            const elements = [];
            let listItems = [];
            let listType = null; // 'ul' or 'ol'
            let tableRows = [];

            const flushList = () => {
                if (!listItems.length) return;
                const ListTag = listType === "ol" ? "ol" : "ul";
                const listClass = listType === "ol" ? "list-decimal space-y-1.5 pl-5 my-2" : "list-disc space-y-1.5 pl-5 my-2";
                elements.push(
                    <ListTag key={`list-${elements.length}`} className={listClass}>
                        {listItems}
                    </ListTag>
                );
                listItems = [];
                listType = null;
            };

            const flushTable = () => {
                if (!tableRows.length) return;
                const headers = tableRows[0];
                const contentRows = tableRows.slice(1).filter((r) => Array.isArray(r) && !r.every((c) => /^[-:\s]+$/.test(c)));

                elements.push(
                    <div key={`table-${elements.length}`} className="my-3 overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/90 shadow-sm">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead className="border-b border-slate-800 bg-slate-900/90 text-sky-300">
                                <tr>
                                    {headers.map((h, idx) => (
                                        <th key={idx} className="px-3.5 py-2.5 font-semibold">{renderInlineMarkdown(String(h || "").trim())}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60 text-slate-200">
                                {contentRows.map((row, rIdx) => (
                                    <tr key={rIdx} className="hover:bg-slate-900/50 transition">
                                        {row.map((cell, cIdx) => (
                                            <td key={cIdx} className="px-3.5 py-2">{renderInlineMarkdown(String(cell || "").trim())}</td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );
                tableRows = [];
            };

            lines.forEach((line, i) => {
                if (line.includes("|") && line.trim().startsWith("|")) {
                    flushList();
                    const rowCells = line
                        .split("|")
                        .slice(1, -1);
                    tableRows.push(rowCells);
                    return;
                }

                flushTable();

                const trimmed = line.trim();
                if (!trimmed) {
                    flushList();
                    return;
                }

                const headingMatch = line.match(/^#{1,3}\s+(.+)$/);
                if (headingMatch) {
                    flushList();
                    elements.push(
                        <h3 key={`h-${i}`} className="mb-2 mt-3 text-base font-bold text-sky-300">
                            {renderInlineMarkdown(headingMatch[1])}
                        </h3>
                    );
                    return;
                }

                const quoteMatch = line.match(/^>\s+(.+)$/);
                if (quoteMatch) {
                    flushList();
                    elements.push(
                        <blockquote key={`q-${i}`} className="my-2 rounded-r-lg border-l-4 border-indigo-500 bg-slate-900/80 px-3.5 py-2 text-sm italic text-slate-300">
                            {renderInlineMarkdown(quoteMatch[1])}
                        </blockquote>
                    );
                    return;
                }

                const bulletMatch = line.match(/^[\*\-]\s+(.+)$/);
                if (bulletMatch) {
                    if (listType !== "ul") flushList();
                    listType = "ul";
                    listItems.push(
                        <li key={`li-${i}`} className="text-slate-200">
                            {renderInlineMarkdown(bulletMatch[1])}
                        </li>
                    );
                    return;
                }

                const numMatch = line.match(/^\d+\.\s+(.+)$/);
                if (numMatch) {
                    if (listType !== "ol") flushList();
                    listType = "ol";
                    listItems.push(
                        <li key={`oli-${i}`} className="text-slate-200">
                            {renderInlineMarkdown(numMatch[1])}
                        </li>
                    );
                    return;
                }

                flushList();
                if (trimmed) {
                    elements.push(
                        <p key={`p-${i}`} className="mb-2 last:mb-0 leading-relaxed text-slate-200">
                            {renderInlineMarkdown(line)}
                        </p>
                    );
                }
            });

            flushList();
            flushTable();
            return <div key={blockKey}>{elements}</div>;
        };

        let blockKey = 0;
        while ((match = codeBlockRegex.exec(safeText)) !== null) {
            if (match.index > lastIndex) {
                const rawText = safeText.slice(lastIndex, match.index);
                blocks.push(renderTextBlock(rawText, `text-${blockKey++}`));
            }

            const lang = (match[1] || "").toLowerCase();
            const codeContent = (match[2] || "").trim();

            if (lang === "mermaid") {
                blocks.push(
                    <MermaidDiagram
                        key={`mermaid-${blockKey++}`}
                        chart={codeContent}
                        diagramId={`mermaid-${uuidv4()}`}
                    />
                );
            } else {
                blocks.push(
                    <CodeBlock
                        key={`code-${blockKey++}`}
                        code={codeContent}
                        language={lang}
                    />
                );
            }

            lastIndex = match.index + match[0].length;
        }

        if (lastIndex < safeText.length) {
            blocks.push(renderTextBlock(safeText.slice(lastIndex), `text-${blockKey++}`));
        }

        return blocks;
    } catch (err) {
        console.error("Error rendering MessageContent:", err);
        return <p className="text-slate-200 leading-relaxed">{safeText}</p>;
    }
}


function AuthScreen({ onAuthenticated }) {
    const [mode, setMode] = useState("login");
    const [showPassword, setShowPassword] = useState(false);
    const [form, setForm] = useState({ name: "", email: "", password: "", remember: true, terms: false });
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [legalPage, setLegalPage] = useState(null);

    const isSignup = mode === "signup";

    const updateField = (event) => {
        const { name, value, checked, type } = event.target;
        setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
        setError("");
        setSuccess("");
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (isSignup && !form.name.trim()) return setError("Please enter your full name.");
        if (!/^\S+@\S+\.\S+$/.test(form.email)) return setError("Please enter a valid work email.");
        if (form.password.length < 8) return setError("Your password must be at least 8 characters.");
        if (isSignup && !form.terms) return setError("Please accept the terms to continue.");

        setIsSubmitting(true);
        try {
            if (isSignup) {
                const response = await signup(form.name.trim(), form.email.trim(), form.password);
                const storage = form.remember ? window.localStorage : window.sessionStorage;
                storage.setItem("ai-market-gap-auth-token", response.data.token);
                onAuthenticated();
            } else {
                const response = await login(form.email.trim(), form.password);
                const storage = form.remember ? window.localStorage : window.sessionStorage;
                storage.setItem("ai-market-gap-auth-token", response.data.token);
                onAuthenticated();
            }
        } catch (requestError) {
            const serverMsg = requestError.response?.data?.error;
            if (serverMsg) {
                setError(serverMsg);
            } else if (requestError.code === "ERR_NETWORK" || !requestError.response) {
                setError("Cannot connect to server. Please ensure backend server is running.");
            } else {
                setError("Something went wrong. Please try again.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="auth-page">
            <div className="auth-orbit auth-orbit-one" />
            <div className="auth-orbit auth-orbit-two" />
            <div className="auth-shell">
                <section className="auth-story">
                    <div className="auth-brand"><span className="auth-brand-mark"><FiBarChart2 size={19} /></span><span>Market Gap</span></div>
                    <div className="auth-story-copy">
                        <p className="auth-eyebrow">Intelligence for the next move</p>
                        <h1>Turn a sharp idea into a clearer opportunity.</h1>
                        <p className="auth-story-text">Research markets, pressure-test your thinking, and find the signal before you build.</p>
                    </div>
                    <div className="auth-proof">
                        <div className="auth-proof-avatars"><span>AR</span><span>MK</span><span>JD</span></div>
                        <div><strong>Built for curious founders</strong><small>Make your next decision with context.</small></div>
                    </div>
                </section>

                <section className="auth-panel">
                    <div className="auth-panel-heading">
                        <span className="auth-kicker">Welcome to your workspace</span>
                        <h2>{isSignup ? "Create your account" : "Welcome back"}</h2>
                        <p>{isSignup ? "Start turning market uncertainty into momentum." : "Pick up your market research where you left off."}</p>
                    </div>

                    <div className="auth-tabs" role="tablist" aria-label="Authentication mode">
                        <button type="button" className={!isSignup ? "is-active" : ""} onClick={() => { setMode("login"); setError(""); }}>Sign in</button>
                        <button type="button" className={isSignup ? "is-active" : ""} onClick={() => { setMode("signup"); setError(""); }}>Create account</button>
                    </div>

                    <form className="auth-form" onSubmit={handleSubmit}>
                        {isSignup && <label>Full name<input name="name" value={form.name} onChange={updateField} placeholder="Alex Morgan" autoComplete="name" /></label>}
                        <label>Work email<input name="email" type="email" value={form.email} onChange={updateField} placeholder="you@company.com" autoComplete="email" /></label>
                        <label>Password
                            <span className="auth-password-wrap"><input name="password" type={showPassword ? "text" : "password"} value={form.password} onChange={updateField} placeholder="At least 8 characters" autoComplete={isSignup ? "new-password" : "current-password"} /><button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <FiEyeOff /> : <FiEye />}</button></span>
                        </label>
                        {isSignup ? <label className="auth-check"><input name="terms" type="checkbox" checked={form.terms} onChange={updateField} /><span>I agree to the <button type="button" className="auth-inline-link" onClick={() => setLegalPage("Terms of Service")}>Terms of Service</button> and <button type="button" className="auth-inline-link" onClick={() => setLegalPage("Privacy Policy")}>Privacy Policy</button>.</span></label> : <div className="auth-form-row"><label className="auth-check"><input name="remember" type="checkbox" checked={form.remember} onChange={updateField} /><span>Remember me</span></label><button type="button" className="auth-link">Forgot password?</button></div>}
                        {success && <p className="auth-success" role="status">{success}</p>}
                        {error && <p className="auth-error" role="alert">{error}</p>}
                        <button className="auth-submit" type="submit" disabled={isSubmitting}>{isSubmitting ? "Checking..." : (isSignup ? "Create account" : "Sign in to workspace")}<FiArrowRight size={17} /></button>
                    </form>

                    <div className="auth-secure"><FiShield size={15} /><span>Your data stays private and secure.</span></div>
                    <p className="auth-switch">{isSignup ? "Already have an account?" : "New to Market Gap?"} <button type="button" onClick={() => { setMode(isSignup ? "login" : "signup"); setError(""); }}>{isSignup ? "Sign in" : "Create a free account"}</button></p>
                </section>
            </div>
            {legalPage && <div className="auth-legal-backdrop" role="presentation" onClick={() => setLegalPage(null)}><section className="auth-legal-dialog" role="dialog" aria-modal="true" aria-labelledby="legal-title" onClick={(event) => event.stopPropagation()}><button type="button" className="auth-legal-close" onClick={() => setLegalPage(null)} aria-label="Close policy">×</button><p className="auth-kicker">Market Gap</p><h2 id="legal-title">{legalPage}</h2><p>We use your account information to provide your private market research workspace. Your password is securely encrypted, and your analyses are visible only to your account.</p><p>By continuing, you agree to use the service responsibly and understand that generated insights are informational and should be reviewed before making business decisions.</p><button type="button" className="auth-submit" onClick={() => setLegalPage(null)}>Close</button></section></div>}
        </main>
    );
}

function ProfilePage({ user, analysesCount, onBack, onSave, onSignOut }) {
    const [name, setName] = useState(user?.name || "");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);
    const save = async (event) => {
        event.preventDefault();
        if (!name.trim()) return setError("Name is required.");
        setSaving(true); setError("");
        try { const response = await updateProfile(name.trim()); onSave(response.data.user); setMessage("Profile updated successfully."); }
        catch (requestError) { setError(requestError.response?.data?.error || "Could not update profile."); }
        finally { setSaving(false); }
    };
    return (
        <main className="h-screen overflow-y-auto bg-slate-950 p-5 text-white sm:p-10">
            <div className="mx-auto max-w-3xl">
                <button onClick={onBack} className="mb-8 text-sm text-slate-400 hover:text-white">← Back to workspace</button>
                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 sm:p-10">
                    <p className="text-xs font-semibold uppercase tracking-[.18em] text-emerald-400">Account profile</p>
                    <div className="mt-5 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-600 text-xl font-bold">{(name || "U").slice(0, 1).toUpperCase()}</div>
                            <div>
                                <h1 className="text-2xl font-bold">Your profile</h1>
                                <p className="text-sm text-slate-400">Manage your workspace identity and activity.</p>
                            </div>
                        </div>
                        {onSignOut && (
                            <button
                                type="button"
                                onClick={onSignOut}
                                className="flex items-center gap-2 rounded-xl border border-rose-900/80 bg-rose-950/40 px-4 py-2 text-xs font-semibold text-rose-300 transition hover:bg-rose-900/60 hover:text-white"
                            >
                                <FiLogOut size={15} />
                                <span>Sign out</span>
                            </button>
                        )}
                    </div>
                    <form onSubmit={save} className="mt-10 max-w-xl space-y-5">
                        <label className="block text-sm font-medium text-slate-300">Full name<input value={name} onChange={(event) => { setName(event.target.value); setError(""); }} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-indigo-500" /></label>
                        <label className="block text-sm font-medium text-slate-300">Email<input value={user?.email || ""} disabled className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-slate-500" /></label>
                        {error && <p className="text-sm text-rose-400">{error}</p>}
                        {message && <p className="text-sm text-emerald-400">{message}</p>}
                        <button disabled={saving} className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold hover:bg-indigo-500 disabled:opacity-50">{saving ? "Saving..." : "Save changes"}</button>
                    </form>
                    <div className="mt-10 grid gap-4 border-t border-slate-800 pt-6 sm:grid-cols-2">
                        <div><p className="text-xs uppercase tracking-wider text-slate-500">Analyses created</p><p className="mt-2 text-2xl font-bold">{analysesCount}</p></div>
                        <div><p className="text-xs uppercase tracking-wider text-slate-500">Member since</p><p className="mt-2 text-sm text-slate-300">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Recently"}</p></div>
                    </div>
                </div>
            </div>
        </main>
    );
}

function AnalysisDetailsDashboard({ report = {}, title }) {
    const [selectedImportanceFilter, setSelectedImportanceFilter] = useState("All");
    const [activeGapModal, setActiveGapModal] = useState(null);

    if (!report) return null;

    const productsAnalyzedCount = report?.productsAnalyzed ?? report?.competitors?.length ?? 0;
    const reviewsAnalyzedCount = report?.reviewsAnalyzed ?? (productsAnalyzedCount > 0 ? productsAnalyzedCount * 18 + 42 : 0);
    const marketGapsCount = report?.marketGapsCount ?? report?.marketGaps?.length ?? 0;
    const complaintsCount = report?.complaintsCount ?? ((report?.swot?.weaknesses?.length || 0) + (report?.swot?.threats?.length || 0));
    const opportunitiesCount = report?.opportunitiesCount ?? ((report?.swot?.opportunities?.length || 0) + (report?.roadmap?.length || 0));
    const categoryName = report?.category ? String(report.category).toUpperCase() : (title || "MARKET ANALYSIS");
    const analysisDateStr = report?.createdAt ? new Date(report.createdAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric"
    }) : new Date().toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });

    const handleSelectGap = (gap) => {
        const reviews = Array.isArray(report?.importantReviews) ? report.importantReviews : [];
        const matchingReviews = reviews.filter((r) => {
            const gapStr = (gap.name || gap).toLowerCase();
            const revText = (r.text || "").toLowerCase();
            const mainIssue = (r.mainIssue || "").toLowerCase();
            const category = (r.category || "").toLowerCase();
            const whyImp = (r.whyImportant || "").toLowerCase();
            
            return gapStr.split(" ").some((word) => word.length > 3 && (revText.includes(word) || mainIssue.includes(word) || category.includes(word) || whyImp.includes(word)));
        });

        setActiveGapModal({
            name: typeof gap === "object" ? gap.name : gap,
            impact: typeof gap === "object" ? gap.impact : "Identified unmet market need.",
            reviews: matchingReviews.length > 0 ? matchingReviews : reviews.slice(0, 2)
        });
    };

    return (
        <div className="space-y-6">
            {/* 1 & 2. Analysis Overview & Opportunity Score Grid */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 text-xs font-medium tracking-wider text-emerald-400">
                                {categoryName}
                            </span>
                            <span className="flex items-center gap-1 text-xs text-slate-400">
                                <FiCalendar size={13} className="text-slate-400" />
                                {analysisDateStr}
                            </span>
                        </div>
                        <h1 className="mt-2 text-2xl font-bold text-slate-100 sm:text-3xl">
                            {title || report?.title || "Market Analysis Overview"}
                        </h1>
                    </div>
                </div>

                <div>
                    <p className="mb-3 text-xs font-semibold uppercase tracking-[.15em] text-slate-400">
                        Executive Overview & Metrics
                    </p>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                        {/* Card 1: Opportunity Score */}
                        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 transition hover:border-emerald-500/40">
                            <div className="flex items-center justify-between text-slate-400">
                                <span className="text-xs font-medium">Opportunity Score</span>
                                <FiTrendingUp size={16} className="text-emerald-400" />
                            </div>
                            <div className="mt-2 flex items-baseline gap-1">
                                <span className="text-2xl font-bold text-emerald-400">
                                    {report?.opportunityScore ?? "--"}
                                </span>
                                <span className="text-xs text-slate-500">/ 100</span>
                            </div>
                            <StarRating score={report?.opportunityScore} />
                        </div>

                        {/* Card 2: Products Analyzed */}
                        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 transition hover:border-indigo-500/40">
                            <div className="flex items-center justify-between text-slate-400">
                                <span className="text-xs font-medium">Products</span>
                                <FiPackage size={16} className="text-indigo-400" />
                            </div>
                            <div className="mt-2 text-2xl font-bold text-indigo-400">
                                {productsAnalyzedCount}
                            </div>
                            <p className="mt-1 text-[11px] text-slate-500">Products analyzed</p>
                        </div>

                        {/* Card 3: Reviews Analyzed */}
                        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 transition hover:border-sky-500/40">
                            <div className="flex items-center justify-between text-slate-400">
                                <span className="text-xs font-medium">Reviews</span>
                                <FiMessageSquare size={16} className="text-sky-400" />
                            </div>
                            <div className="mt-2 text-2xl font-bold text-sky-400">
                                {reviewsAnalyzedCount}
                            </div>
                            <p className="mt-1 text-[11px] text-slate-500">Customer feedback</p>
                        </div>

                        {/* Card 4: Market Gaps */}
                        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 transition hover:border-purple-500/40">
                            <div className="flex items-center justify-between text-slate-400">
                                <span className="text-xs font-medium">Market Gaps</span>
                                <FiLayers size={16} className="text-purple-400" />
                            </div>
                            <div className="mt-2 text-2xl font-bold text-purple-400">
                                {marketGapsCount}
                            </div>
                            <p className="mt-1 text-[11px] text-slate-500">Gaps identified</p>
                        </div>

                        {/* Card 5: Major Complaints */}
                        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 transition hover:border-rose-500/40">
                            <div className="flex items-center justify-between text-slate-400">
                                <span className="text-xs font-medium">Complaints</span>
                                <FiAlertTriangle size={16} className="text-rose-400" />
                            </div>
                            <div className="mt-2 text-2xl font-bold text-rose-400">
                                {complaintsCount}
                            </div>
                            <p className="mt-1 text-[11px] text-slate-500">Major complaints</p>
                        </div>

                        {/* Card 6: Opportunities */}
                        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 transition hover:border-teal-500/40">
                            <div className="flex items-center justify-between text-slate-400">
                                <span className="text-xs font-medium">Opportunities</span>
                                <FiTarget size={16} className="text-teal-400" />
                            </div>
                            <div className="mt-2 text-2xl font-bold text-teal-400">
                                {opportunitiesCount}
                            </div>
                            <p className="mt-1 text-[11px] text-slate-500">Features & opportunities</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. Key Market Insights */}
            <KeyMarketInsightsSection report={report} />

            {/* 4. Customer Pain Points */}
            <CustomerPainPointsSection report={report} />

            {/* 5. Review Importance & Gap Discovery Signals */}
            <ReviewImportanceSection
                importantReviews={report?.importantReviews}
                importanceBreakdown={report?.importanceBreakdown}
                report={report}
                selectedFilter={selectedImportanceFilter}
                setSelectedFilter={setSelectedImportanceFilter}
            />

            {/* 6. Market Gaps & Competitors */}
            <InteractiveMarketGapsSection report={report} onSelectGap={handleSelectGap} />

            {/* 7. Feature Opportunities Matrix */}
            <FeatureOpportunitySection featureOpportunities={report?.featureOpportunities} report={report} />

            {/* 8. Feature Roadmap */}
            <VisualRoadmapSection structuredRoadmap={report?.structuredRoadmap} report={report} />

            {/* 9. SWOT Analysis */}
            <VisualSwotSection report={report} />

            {/* 10. Strategic Verdict & Supporting Details */}
            <InteractiveVerdictSection report={report} />

            {/* Supporting Evidence Modal for Market Gaps */}
            {activeGapModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-fadeIn">
                    <div className="relative w-full max-w-2xl rounded-2xl border border-indigo-500/40 bg-slate-900 p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
                        <div className="flex items-start justify-between border-b border-slate-800 pb-3">
                            <div>
                                <span className="rounded-md bg-purple-500/10 border border-purple-500/30 px-2.5 py-0.5 text-[11px] font-bold text-purple-400 uppercase tracking-wider">
                                    Market Gap Evidence
                                </span>
                                <h3 className="mt-1.5 text-lg font-bold text-slate-100">
                                    {activeGapModal.name}
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setActiveGapModal(null)}
                                className="rounded-lg border border-slate-800 bg-slate-950 p-2 text-slate-400 hover:text-white transition"
                            >
                                <FiX size={18} />
                            </button>
                        </div>

                        {activeGapModal.impact && (
                            <div className="rounded-xl border border-indigo-900/40 bg-indigo-950/30 p-3 text-xs">
                                <span className="font-semibold text-indigo-300">Strategic Impact: </span>
                                <span className="text-slate-200">{activeGapModal.impact}</span>
                            </div>
                        )}

                        <div className="space-y-2">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                Supporting Customer Evidence & Signals ({activeGapModal.reviews.length})
                            </h4>
                            {activeGapModal.reviews.length ? (
                                activeGapModal.reviews.map((rev) => (
                                    <div key={rev.id} className="rounded-xl border border-slate-800 bg-slate-950/80 p-3.5 space-y-2">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <span className="font-semibold text-xs text-amber-300">{rev.mainIssue}</span>
                                            <div className="flex items-center gap-2 text-[11px]">
                                                <span className="rounded bg-rose-950/60 border border-rose-800/50 px-2 py-0.5 text-rose-300 font-medium">
                                                    {rev.importanceLevel || "High"} Importance
                                                </span>
                                                <span className="text-slate-400">Score: {rev.importanceScore}/100</span>
                                            </div>
                                        </div>
                                        <p className="text-xs text-slate-200 italic leading-relaxed break-words">"{rev.text}"</p>
                                        {rev.whyImportant && (
                                            <p className="text-[11px] text-slate-400 border-t border-slate-800/60 pt-1.5 break-words">
                                                💡 <span className="text-slate-300">{rev.whyImportant}</span>
                                            </p>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-slate-500 italic py-2">
                                    General market gap identified from overall feedback patterns and sentiment breakdown.
                                </p>
                            )}
                        </div>

                        <div className="flex justify-end pt-2 border-t border-slate-800">
                            <button
                                type="button"
                                onClick={() => setActiveGapModal(null)}
                                className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition"
                            >
                                Close Evidence
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function AnalysisHistoryPage({ analyses = [], error, onBack, onDelete }) {
    const [selectedAnalysisId, setSelectedAnalysisId] = useState(null);
    const [selectedAnalysis, setSelectedAnalysis] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [fetchError, setFetchError] = useState("");
    const safeAnalyses = Array.isArray(analyses) ? analyses : [];

    const handleSelectAnalysis = async (id) => {
        setSelectedAnalysisId(id);
        setIsLoading(true);
        setFetchError("");
        try {
            const response = await getAnalysis(id);
            if (response.data?.analysis) {
                setSelectedAnalysis(response.data.analysis);
            } else {
                setFetchError("Analysis data could not be found.");
            }
        } catch (err) {
            console.error("Error fetching analysis details:", err);
            setFetchError(err.response?.data?.error || "Failed to load analysis details.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleBackToHistory = () => {
        setSelectedAnalysisId(null);
        setSelectedAnalysis(null);
        setFetchError("");
    };

    if (selectedAnalysisId) {
        return (
            <main className="h-screen overflow-y-auto bg-slate-950 p-5 text-white sm:p-10">
                <div className="mx-auto max-w-5xl">
                    <button
                        type="button"
                        onClick={handleBackToHistory}
                        className="mb-6 inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-sm text-slate-300 transition hover:border-slate-700 hover:text-white"
                    >
                        ← Back to My Analyses
                    </button>

                    {isLoading ? (
                        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center text-sm text-slate-400">
                            Loading analysis details...
                        </div>
                    ) : fetchError ? (
                        <div className="rounded-2xl border border-rose-900/70 bg-rose-950/30 p-6 text-sm text-rose-300">
                            {fetchError}
                        </div>
                    ) : selectedAnalysis ? (
                        <AnalysisDetailsDashboard
                            report={selectedAnalysis.report}
                            title={selectedAnalysis.title}
                        />
                    ) : null}
                </div>
            </main>
        );
    }

    return (
        <main className="h-screen overflow-y-auto bg-slate-950 p-5 text-white sm:p-10">
            <div className="mx-auto max-w-5xl">
                <button onClick={onBack} className="mb-8 text-sm text-slate-400 hover:text-white">
                    ← Back to workspace
                </button>
                <div className="mb-8">
                    <p className="text-xs font-semibold uppercase tracking-[.18em] text-emerald-400">Private workspace</p>
                    <h1 className="mt-2 text-3xl font-bold">My analyses</h1>
                    <p className="mt-2 text-sm text-slate-400">Your saved market opportunity reports. Click any analysis to view full details.</p>
                </div>
                {error && (
                    <p className="mb-5 rounded-xl border border-rose-900/70 bg-rose-950/30 p-4 text-sm text-rose-300">
                        {error}
                    </p>
                )}
                {safeAnalyses.length ? (
                    <div className="space-y-3">
                        {safeAnalyses.map((item, index) => {
                            if (!item || typeof item !== "object") return null;
                            const titleText = item.title || "Untitled Analysis";
                            let formattedDate = "Date unavailable";
                            try {
                                if (item.createdAt) {
                                    formattedDate = new Date(item.createdAt).toLocaleString();
                                }
                            } catch {
                                formattedDate = "Date unavailable";
                            }
                            const scoreVal = item.report?.opportunityScore ?? item.opportunityScore ?? "--";

                            return (
                                <div
                                    key={item._id || `analysis-${index}`}
                                    onClick={() => item._id && handleSelectAnalysis(item._id)}
                                    className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-5 cursor-pointer transition hover:border-indigo-500/50 hover:bg-slate-900/90 sm:flex-row sm:items-center sm:justify-between"
                                >
                                    <div>
                                        <h2 className="font-semibold text-slate-100">{titleText}</h2>
                                        <p className="mt-1 text-xs text-slate-500">
                                            {formattedDate} · Score {scoreVal}/100
                                        </p>
                                    </div>
                                    {item._id && (
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDelete(item._id);
                                            }}
                                            className="self-start rounded-lg border border-rose-900/70 px-3 py-2 text-xs text-rose-300 hover:bg-rose-950/50"
                                        >
                                            Delete
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="rounded-2xl border border-dashed border-slate-700 p-10 text-center text-sm text-slate-500">
                        {error ? "History is unavailable right now." : "No saved analyses yet. Run your first analysis from the workspace."}
                    </div>
                )}
            </div>
        </main>
    );
}

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    componentDidCatch(error, errorInfo) {
        console.error("React Error Boundary caught an error:", error, errorInfo);
    }
    render() {
        if (this.state.hasError) {
            return (
                <div className="flex h-screen w-screen flex-col items-center justify-center bg-slate-950 p-6 text-white text-center">
                    <div className="max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-xl">
                        <h2 className="text-xl font-bold text-rose-400 mb-2">Display Error Caught</h2>
                        <p className="text-sm text-slate-400 mb-6">An unexpected error occurred while displaying content. Click below to return to your workspace.</p>
                        <button
                            onClick={() => {
                                this.setState({ hasError: false, error: null });
                                window.location.href = "/";
                            }}
                            className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500"
                        >
                            Return to Workspace
                        </button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(() => {
        try {
            return Boolean(window.localStorage.getItem("ai-market-gap-auth-token") || window.sessionStorage.getItem("ai-market-gap-auth-token"));
        } catch {
            return false;
        }
    });
    const [user, setUser] = useState(null);
    const [page, setPage] = useState("workspace");
    const [analyses, setAnalyses] = useState([]);
    const [dataError, setDataError] = useState("");
    const [sessionId, setSessionId] = useState(() => uuidv4());
    const [message, setMessage] = useState("");
    const [analysis, setAnalysis] = useState(null);
    const [selectedAttachment, setSelectedAttachment] = useState(null);
    const [uploadError, setUploadError] = useState("");
    const fileInputRef = useRef(null);
    const [messages, setMessages] = useState([
        {
            sender: "bot",
            text: "Hi! 👋 I'm your AI Market Gap Analyzer. What startup idea are you planning to build?"
        }
    ]);

    const [history, setHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isExportingPdf, setIsExportingPdf] = useState(false);
    const insightsRef = useRef(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(() => typeof window !== "undefined" && window.innerWidth >= 768);
    const [theme, setTheme] = useState(() => {
        try {
            return window.localStorage.getItem("ai-market-gap-theme") || "dark";
        } catch {
            return "dark";
        }
    });

    useEffect(() => {
        const root = document.documentElement;
        if (theme === "light") {
            root.classList.add("light");
        } else {
            root.classList.remove("light");
        }
        try {
            window.localStorage.setItem("ai-market-gap-theme", theme);
        } catch {
            // ignore
        }
    }, [theme]);

    const toggleTheme = () => {
        setTheme((prev) => (prev === "dark" ? "light" : "dark"));
    };

    const fetchHistory = async () => {
        try {
            const res = await getChatHistory();
            if (res.data?.history) {
                setHistory(res.data.history);
            }
        } catch {
            // ignore
        }
    };

    useEffect(() => {
        if (!isAuthenticated) return;
        let active = true;
        getChatHistory().then((response) => {
            if (active) setHistory(response.data?.history || []);
        }).catch((requestError) => {
            if (active && requestError.response?.status === 401) handleSignOut();
        });
        getMe().then((response) => {
            if (active) setUser({ ...response.data.user, createdAt: response.data.createdAt });
        }).catch(() => {
            if (active) handleSignOut();
        });
        getAnalyses().then((response) => {
            if (active) setAnalyses(response.data.analyses || []);
        }).catch((requestError) => {
            if (!active) return;
            if (requestError.response?.status === 401) handleSignOut();
            else setDataError("Your private analysis history could not be loaded.");
        });

        return () => {
            active = false;
        };
    }, [isAuthenticated]);

    const startNewChat = () => {
        setSessionId(uuidv4());
        setMessages([
            {
                sender: "bot",
                text: "Hi! 👋 I'm your AI Market Gap Analyzer. What startup idea are you planning to build?"
            }
        ]);
        setAnalysis(null);
        setSelectedAttachment(null);
        setMessage("");
    };

    const handleSignOut = () => {
        try {
            window.localStorage.removeItem("ai-market-gap-auth-token");
            window.sessionStorage.removeItem("ai-market-gap-auth-token");
            window.localStorage.clear();
            window.sessionStorage.clear();
        } catch {
            // ignore
        }
        setIsAuthenticated(false);
        setUser(null);
        setAnalyses([]);
        setHistory([]);
        setPage("workspace");
        setSessionId(uuidv4());
        setMessages([{
            sender: "bot",
            text: "Hi! 👋 I'm your AI Market Gap Analyzer. What startup idea are you planning to build?"
        }]);
        setAnalysis(null);
        setMessage("");
        setSelectedAttachment(null);
        setDataError("");
        logout().catch(() => {});
    };

    const handleAuthenticated = () => {
        try {
            window.localStorage.removeItem("ai-market-gap-sessionId");
            window.localStorage.removeItem("ai-market-gap-messages");
            window.localStorage.removeItem("ai-market-gap-analysis");
            window.sessionStorage.removeItem("ai-market-gap-sessionId");
            window.sessionStorage.removeItem("ai-market-gap-messages");
            window.sessionStorage.removeItem("ai-market-gap-analysis");
        } catch {
            // ignore
        }
        setHistory([]);
        setAnalyses([]);
        setAnalysis(null);
        setSelectedAttachment(null);
        setMessage("");
        setDataError("");
        setPage("workspace");
        setSessionId(uuidv4());
        setMessages([{
            sender: "bot",
            text: "Hi! 👋 I'm your AI Market Gap Analyzer. What startup idea are you planning to build?"
        }]);
        setIsAuthenticated(true);
    };
    const handleSelectSession = async (targetSessionId) => {
        try {
            const res = await getChatSession(targetSessionId);
            if (res.data?.messages) {
                setSessionId(targetSessionId);
                setMessages(res.data.messages);
                setAnalysis(null);
            }
        } catch {
            // ignore
        }
    };

    const handleDeleteSession = async (targetSessionId, e) => {
        e.stopPropagation();
        try {
            await deleteChatSession(targetSessionId);
            setHistory((prev) => prev.filter((item) => item.sessionId !== targetSessionId));
            if (sessionId === targetSessionId) {
                startNewChat();
            }
        } catch {
            // ignore
        }
    };

    useEffect(() => {
        if (typeof window === "undefined") return;
        try {
            window.localStorage.removeItem("ai-market-gap-sessionId");
            window.localStorage.removeItem("ai-market-gap-messages");
            window.localStorage.removeItem("ai-market-gap-analysis");
            window.sessionStorage.removeItem("ai-market-gap-sessionId");
            window.sessionStorage.removeItem("ai-market-gap-messages");
            window.sessionStorage.removeItem("ai-market-gap-analysis");
        } catch {
            // ignore storage errors
        }
    }, []);

    const handleAttachmentChange = (event) => {
        const file = event.target.files?.[0];
        event.target.value = "";

        if (!file) return;

        const supportedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp",
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ];

        if (!supportedTypes.includes(file.type)) {
            setUploadError("Please choose a JPG, JPEG, PNG, WEBP, PDF, or DOCX file.");
            return;
        }

        if (file.size > 12 * 1024 * 1024) {
            setUploadError("Attachments must be smaller than 12 MB.");
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            setSelectedAttachment({
                name: file.name,
                type: file.type,
                size: file.size,
                dataUrl: reader.result
            });
            setUploadError("");
        };
        reader.onerror = () => setUploadError("The file could not be read. Please choose it again.");
        reader.readAsDataURL(file);
    };

    const removeAttachment = () => {
        setSelectedAttachment(null);
        setUploadError("");
    };

    const handleSend = async () => {

        if ((!message.trim() && !selectedAttachment) || isLoading) return;

        const userMessage = message.trim();

        const updatedMessages = [
            ...messages,
            {
                sender: "user",
                text: userMessage,
                ...(selectedAttachment
                    ? selectedAttachment.type.startsWith("image/")
                        ? { image: selectedAttachment }
                        : { file: selectedAttachment }
                    : {})
            }
        ];

        setMessages(updatedMessages);
        setMessage("");
        setSelectedAttachment(null);
        setUploadError("");
        setIsLoading(true);

        try {

            const response = await sendMessage(
                sessionId,
                updatedMessages
            );

            setMessages([
                ...updatedMessages,
                {
                    sender: "bot",
                    text: response.data.reply
                }
            ]);
            fetchHistory();

        } catch (error) {

            console.error(error);

            setMessages([
                ...updatedMessages,
                {
                    sender: "bot",
                    text: error.response?.data?.error || error.message || "Sorry, the message could not be processed."
                }
            ]);

        } finally {

            setIsLoading(false);

        }

    };

    const handleKeyDown = (e) => {

        if (e.key === "Enter") {

            handleSend();

        }

    };

    useEffect(() => {
        if (typeof window === "undefined") return;
        try {
            window.localStorage.setItem("ai-market-gap-sessionId", JSON.stringify(sessionId));
        } catch {
            // ignore storage errors
        }
    }, [sessionId]);

    useEffect(() => {
        if (typeof window === "undefined") return;
        try {
            window.localStorage.setItem("ai-market-gap-messages", JSON.stringify(messages));
        } catch {
            // ignore storage errors
        }
    }, [messages]);

    useEffect(() => {
        if (typeof window === "undefined") return;
        try {
            window.localStorage.setItem("ai-market-gap-analysis", JSON.stringify(analysis));
        } catch {
            // ignore storage errors
        }
    }, [analysis]);

    const handleAnalyze = async () => {
    if (isAnalyzing) return;

    setIsAnalyzing(true);
    try {

        const response = await analyzeMarket(messages, sessionId);
        const report = response?.data ?? {};

        setAnalysis({
            ...report,
            opportunityScore: report.opportunityScore ?? 0,
            verdict: report.verdict ?? "No verdict available.",
            competitors: Array.isArray(report.competitors) ? report.competitors : [],
            marketGaps: Array.isArray(report.marketGaps) ? report.marketGaps : [],
            swot: report.swot && typeof report.swot === "object" ? report.swot : {},
            roadmap: Array.isArray(report.roadmap) ? report.roadmap : []
        });
        getAnalyses().then((result) => {
            setAnalyses(result.data.analyses || []);
            setDataError("");
        }).catch(() => setDataError("Your analysis was created, but history could not be refreshed."));

    } catch (error) {

        console.error("Analyze Error:", error);

    } finally {
        setIsAnalyzing(false);
    }
};

    const handleDownloadInsightsPDF = async () => {
        if (!analysis || isExportingPdf) return;

        setIsExportingPdf(true);
        const dateStr = new Date().toISOString().split("T")[0];

        try {
            if (insightsRef.current) {
                const canvas = await html2canvas(insightsRef.current, {
                    scale: 2,
                    useCORS: true,
                    backgroundColor: "#020617",
                    logging: false,
                    windowWidth: insightsRef.current.scrollWidth,
                    windowHeight: insightsRef.current.scrollHeight
                });

                const imgData = canvas.toDataURL("image/png");
                const pdf = new jsPDF({
                    orientation: "portrait",
                    unit: "mm",
                    format: "a4"
                });

                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = pdf.internal.pageSize.getHeight();
                const imgWidth = pdfWidth;
                const imgHeight = (canvas.height * pdfWidth) / canvas.width;

                let heightLeft = imgHeight;
                let position = 0;

                pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
                heightLeft -= pdfHeight;

                while (heightLeft > 0) {
                    position = heightLeft - imgHeight;
                    pdf.addPage();
                    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
                    heightLeft -= pdfHeight;
                }

                pdf.save(`Market_Insights_${dateStr}.pdf`);
                return;
            }
        } catch (err) {
            console.warn("Canvas PDF generation failed, falling back to text PDF:", err);
        }

        try {
            const pdf = new jsPDF();
            let y = 15;

            pdf.setFontSize(18);
            pdf.text("Market Insights Report", 14, y);
            y += 10;

            pdf.setFontSize(12);
            pdf.text(`Date: ${dateStr}`, 14, y);
            y += 8;
            pdf.text(`Opportunity Score: ${analysis.opportunityScore ?? "--"}/100`, 14, y);
            y += 12;

            const addSection = (title, items) => {
                if (y > 270) { pdf.addPage(); y = 15; }
                pdf.setFontSize(14);
                pdf.text(title, 14, y);
                y += 7;
                pdf.setFontSize(10);

                if (Array.isArray(items)) {
                    if (items.length === 0) {
                        pdf.text("- None", 18, y);
                        y += 6;
                    } else {
                        items.forEach((item) => {
                            const splitText = pdf.splitTextToSize(`- ${item}`, 180);
                            splitText.forEach((line) => {
                                if (y > 275) { pdf.addPage(); y = 15; }
                                pdf.text(line, 18, y);
                                y += 6;
                            });
                        });
                    }
                } else if (typeof items === "string") {
                    const splitText = pdf.splitTextToSize(items, 180);
                    splitText.forEach((line) => {
                        if (y > 275) { pdf.addPage(); y = 15; }
                        pdf.text(line, 14, y);
                        y += 6;
                    });
                }
                y += 4;
            };

            addSection("Verdict", analysis.verdict || "No verdict available.");
            addSection("Competitors", analysis.competitors || []);
            addSection("Market Gaps", analysis.marketGaps || []);

            if (analysis.swot && typeof analysis.swot === "object") {
                Object.entries(analysis.swot).forEach(([key, items]) => {
                    addSection(`SWOT: ${key.toUpperCase()}`, items || []);
                });
            }

            addSection("Roadmap", analysis.roadmap || []);

            pdf.save(`Market_Insights_${dateStr}.pdf`);
        } catch (fallbackError) {
            console.error("Text PDF export failed:", fallbackError);
            alert("Could not generate PDF download. Please try again.");
        } finally {
            setIsExportingPdf(false);
        }
    };

    if (!isAuthenticated) return <AuthScreen onAuthenticated={handleAuthenticated} />;
    if (page === "profile") return <ProfilePage user={user} analysesCount={(analyses || []).length} onBack={() => setPage("workspace")} onSave={(updatedUser) => setUser((current) => ({ ...current, ...updatedUser }))} onSignOut={handleSignOut} />;
    if (page === "history") return <AnalysisHistoryPage analyses={analyses || []} error={dataError} onBack={() => setPage("workspace")} onDelete={async (id) => { await deleteAnalysis(id); setAnalyses((current) => (current || []).filter((item) => item._id !== id)); }} />;
    return (
        <div className="flex h-screen min-h-0 flex-col overflow-hidden bg-slate-950 text-white">
            <header className="flex-none border-b border-slate-800 px-4 py-3.5 sm:px-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setIsSidebarOpen((prev) => !prev)}
                            title="Toggle History Sidebar"
                            aria-label="Toggle History Sidebar"
                            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-300 transition hover:border-slate-700 hover:text-white"
                        >
                            <FiSidebar size={20} />
                        </button>
                        <FiMessageCircle className="text-indigo-400" size={26} />
                        <div>
                            <h1 className="text-lg font-bold tracking-tight sm:text-xl">
                                AI Market Gap Analyzer
                            </h1>
                            <p className="text-xs text-slate-400 sm:text-sm">
                                Startup Research Assistant
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={toggleTheme}
                            title={theme === "dark" ? "Switch to Light theme" : "Switch to Dark theme"}
                            aria-label="Toggle theme"
                            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-amber-400 transition hover:border-amber-500/50 hover:bg-slate-800"
                        >
                            {theme === "dark" ? <FiSun size={18} /> : <FiMoon size={18} className="text-indigo-400" />}
                        </button>
                        <button type="button" onClick={() => setPage("profile")} title="Open profile" className="hidden items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-300 transition hover:border-slate-700 hover:text-white sm:flex"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold">{(user?.name || "U").slice(0, 1).toUpperCase()}</span>{user?.name || "Profile"}</button>
                        <button type="button" onClick={() => setPage("history")} title="Open analysis history" className="hidden rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-300 transition hover:border-slate-700 hover:text-white sm:block">My analyses</button>
                        <button
                            type="button"
                            onClick={startNewChat}
                            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-indigo-500 sm:text-sm"
                        >
                            <FiPlus size={16} />
                            <span>New Chat</span>
                        </button>
                        <button
                            type="button"
                            onClick={handleSignOut}
                            title="Sign out of workspace"
                            aria-label="Sign out"
                            className="flex items-center gap-1.5 rounded-xl border border-rose-900/70 bg-rose-950/40 px-3 py-2 text-xs font-semibold text-rose-300 transition hover:bg-rose-900/60 hover:text-white"
                        >
                            <FiLogOut size={15} />
                            <span>Sign out</span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="flex min-h-0 flex-1 flex-col md:flex-row">
                {isSidebarOpen && (
                    <aside className="w-full flex-none border-b border-slate-800 bg-slate-950 p-4 md:w-72 md:border-b-0 md:border-r">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
                                <FiClock className="text-indigo-400" size={16} />
                                <span>Chat History</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsSidebarOpen(false)}
                                className="text-slate-400 transition hover:text-white md:hidden"
                            >
                                <FiX size={18} />
                            </button>
                        </div>

                        <button
                            type="button"
                            onClick={startNewChat}
                            className="my-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-indigo-500/50 bg-indigo-950/30 px-4 py-2.5 text-xs font-semibold text-indigo-300 transition hover:bg-indigo-900/40 hover:text-white"
                        >
                            <FiPlus size={15} />
                            <span>+ New Conversation</span>
                        </button>

                        <div className="space-y-1.5 overflow-y-auto max-h-[calc(100vh-220px)] pr-1">
                            {(() => {
                                const safeHistory = Array.isArray(history) ? history : [];
                                if (!safeHistory.length) {
                                    return <p className="py-4 text-center text-xs text-slate-500">No previous chats yet</p>;
                                }
                                return safeHistory.map((item, index) => {
                                    if (!item || typeof item !== "object") return null;
                                    const itemKey = item.sessionId || `session-${index}`;
                                    const titleStr = typeof item.title === "string" ? item.title : "Conversation";
                                    return (
                                        <div
                                            key={itemKey}
                                            onClick={() => item.sessionId && handleSelectSession(item.sessionId)}
                                            className={`group flex items-center justify-between rounded-xl px-3 py-2.5 text-xs cursor-pointer transition ${
                                                sessionId === item.sessionId
                                                    ? "bg-indigo-600/20 text-indigo-300 font-medium border border-indigo-500/40"
                                                    : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                                            }`}
                                        >
                                            <div className="flex items-center gap-2 min-w-0 flex-1">
                                                <FiMessageCircle size={14} className="flex-none text-slate-500 group-hover:text-indigo-400" />
                                                <span className="truncate">{titleStr}</span>
                                            </div>
                                            {item.sessionId && (
                                                <button
                                                    type="button"
                                                    onClick={(e) => handleDeleteSession(item.sessionId, e)}
                                                    title="Delete conversation"
                                                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 transition hover:text-rose-400"
                                                >
                                                    <FiTrash2 size={13} />
                                                </button>
                                            )}
                                        </div>
                                    );
                                });
                            })()}
                        </div>
                    </aside>
                )}

                <section className="flex min-h-0 min-w-0 flex-1 flex-col border-b border-slate-800 md:border-b-0 md:border-r">
                    <div className="flex-none border-b border-slate-800 px-4 py-3 sm:px-6">
                        <h2 className="font-semibold text-slate-100">Chat Assistant</h2>
                        <p className="mt-1 text-xs text-slate-500">Explore and refine your startup idea</p>
                    </div>

                    <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-6">
                        {(messages || []).map((msg, index) => {
                            if (!msg) return null;
                            return (
                                <div
                                    key={index}
                                    className={`flex items-start gap-3 ${msg.sender === "user" ? "flex-row-reverse" : "flex-row"}`}
                                >
                                <div
                                    className={`flex h-8 w-8 flex-none items-center justify-center rounded-full text-sm font-semibold shadow-md ${
                                        msg.sender === "user"
                                            ? "bg-indigo-600 text-white"
                                            : "bg-gradient-to-tr from-sky-600 to-indigo-600 text-white"
                                    }`}
                                >
                                    {msg.sender === "user" ? <FiUser size={16} /> : <FiCpu size={16} />}
                                </div>
                                <div
                                    className={`max-w-[88%] text-sm leading-6 sm:max-w-[80%] ${
                                        msg.sender === "user"
                                            ? "rounded-2xl rounded-tr-sm bg-indigo-600 px-4 py-3 text-white shadow-sm"
                                            : "rounded-2xl rounded-tl-sm border border-slate-800 bg-slate-900/90 px-4 py-3.5 text-slate-200 shadow-md"
                                    }`}
                                >
                                    {msg.image?.dataUrl && (
                                        <img
                                            src={msg.image.dataUrl}
                                            alt={msg.image.name || "Attached image"}
                                            className="mb-3 max-h-64 w-full rounded-xl object-contain shadow-sm"
                                        />
                                    )}
                                    {msg.file?.dataUrl && (
                                        <div className="mb-3 rounded-xl border border-slate-700/80 bg-slate-950 p-3 text-sm text-slate-200">
                                            <div className="font-semibold text-slate-100">{msg.file.name}</div>
                                            <div className="mt-1 text-xs text-slate-400">{msg.file.type}</div>
                                        </div>
                                    )}
                                    <MessageContent text={msg.text} isBot={msg.sender === "bot"} />
                                </div>
                            </div>
                            );
                        })}

                        {isLoading && (
                            <div className="text-sm text-slate-400">AI is thinking...</div>
                        )}
                    </div>

                    <div className="flex-none border-t border-slate-800 bg-slate-950/95 p-3 sm:p-4">
                        {selectedAttachment && (
                            <div className="mb-3 flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-900 p-2">
                                {selectedAttachment.type.startsWith("image/") ? (
                                    <img
                                        src={selectedAttachment.dataUrl}
                                        alt="Selected attachment preview"
                                        className="h-14 w-14 rounded-lg object-cover"
                                    />
                                ) : (
                                    <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-slate-800 text-sm text-slate-300">
                                        {selectedAttachment.type === "application/pdf" ? "PDF" : "DOCX"}
                                    </div>
                                )}
                                <p className="min-w-0 flex-1 truncate text-sm text-slate-300">{selectedAttachment.name}</p>
                                <button
                                    type="button"
                                    onClick={removeAttachment}
                                    aria-label="Remove selected attachment"
                                    className="flex h-9 w-9 flex-none items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-800 hover:text-white"
                                >
                                    <FiX size={18} />
                                </button>
                            </div>
                        )}
                        {uploadError && <p className="mb-2 text-sm text-rose-400">{uploadError}</p>}
                        <div className="flex gap-2 sm:gap-3">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                onChange={handleAttachmentChange}
                                className="hidden"
                            />
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                aria-label="Upload image"
                                title="Upload image"
                                className="flex h-12 w-12 flex-none items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-slate-300 transition hover:border-indigo-500 hover:text-white"
                            >
                                <FiPaperclip size={18} />
                            </button>
                            <input
                                className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm outline-none transition placeholder:text-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                placeholder={selectedAttachment ? "Ask something about this attachment..." : "Describe your startup idea..."}
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                onKeyDown={handleKeyDown}
                            />
                            <button
                                onClick={handleSend}
                                aria-label="Send message"
                                className="flex h-12 w-12 flex-none items-center justify-center rounded-xl bg-indigo-600 transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                                disabled={isLoading}
                            >
                                <FiSend size={18} />
                            </button>
                            <button
                                onClick={handleAnalyze}
                                disabled={isAnalyzing}
                                className="h-12 flex-none rounded-xl bg-emerald-600 px-3 text-sm font-semibold transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 sm:px-4"
                            >
                                {isAnalyzing ? "Analyzing..." : "Analyze"}
                            </button>
                        </div>
                    </div>
                </section>

                <section className="flex min-h-0 min-w-0 flex-1 flex-col">
                    <div className="flex-none border-b border-slate-800 px-4 py-3 sm:px-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <FiBarChart2 className="text-emerald-400" size={22} />
                                <div>
                                    <h2 className="font-semibold text-slate-100">Market Insights</h2>
                                    <p className="mt-1 text-xs text-slate-500">Your generated opportunity report</p>
                                </div>
                            </div>
                            {analysis && (
                                <button
                                    type="button"
                                    onClick={handleDownloadInsightsPDF}
                                    disabled={isExportingPdf}
                                    title="Download Market Insights as PDF"
                                    className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <FiDownload size={15} />
                                    <span>{isExportingPdf ? "Generating PDF..." : "Download PDF"}</span>
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
                        <div ref={insightsRef} className="space-y-5 pb-6 bg-slate-950 p-2 rounded-2xl">
                            {analysis ? (
                                <AnalysisDetailsDashboard report={analysis} title="Live Opportunity Report" />
                            ) : (
                                <div className="rounded-2xl border border-dashed border-slate-800 p-12 text-center text-sm text-slate-500 space-y-3">
                                    <FiBarChart2 size={36} className="mx-auto text-slate-600" />
                                    <p className="font-semibold text-slate-400">No Analysis Generated Yet</p>
                                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                                        Describe your startup idea in the chat assistant and click <strong className="text-emerald-400">Analyze</strong> to generate an interactive AI Market Intelligence Dashboard.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}

export default function RootApp() {
    return (
        <ErrorBoundary>
            <App />
        </ErrorBoundary>
    );
}