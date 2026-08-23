import { useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
<<<<<<< HEAD
import { FiSend, FiMessageCircle, FiBarChart2, FiPaperclip, FiX, FiStar, FiUser, FiCpu, FiCopy, FiCheck, FiPlus, FiTrash2, FiClock, FiSidebar } from "react-icons/fi";
import mermaid from "mermaid";
import { sendMessage, analyzeMarket, getChatHistory, getChatSession, deleteChatSession } from "./services/api";
=======
import { FiSend, FiMessageCircle, FiBarChart2, FiPaperclip, FiX, FiStar, FiUser, FiCpu, FiCopy, FiCheck, FiPlus, FiTrash2, FiClock, FiSidebar, FiArrowRight, FiEye, FiEyeOff, FiShield, FiLogOut } from "react-icons/fi";
import mermaid from "mermaid";
import { sendMessage, analyzeMarket, getChatHistory, getChatSession, deleteChatSession, signup, login, logout, getMe, updateProfile, getAnalyses, deleteAnalysis } from "./services/api";
>>>>>>> 4b7f4a6 (Signup and)

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
        <div className="mt-3 flex items-center gap-2">
            <div className="flex items-center gap-1">
                {[...Array(starCount)].map((_, i) => (
                    <FiStar
                        key={i}
                        size={18}
                        className={
                            i < filledStars
                                ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]"
                                : "text-slate-700"
                        }
                    />
                ))}
            </div>
            <span className="text-xs font-semibold tracking-wide text-amber-400">
                {filledStars}/5 Rating
            </span>
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

function MessageContent({ text, isBot }) {
    if (!isBot) return text;
    if (!text) return null;

    const blocks = [];
    const codeBlockRegex = /```(\w*)\s*\n([\s\S]*?)```/g;
    let lastIndex = 0;
    let match;

    const renderTextBlock = (rawText, blockKey) => {
        const lines = rawText.split("\n");
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
            const contentRows = tableRows.slice(1).filter((r) => !r.every((c) => /^[-:\s]+$/.test(c)));

            elements.push(
                <div key={`table-${elements.length}`} className="my-3 overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/90 shadow-sm">
                    <table className="w-full text-left text-xs border-collapse">
                        <thead className="border-b border-slate-800 bg-slate-900/90 text-sky-300">
                            <tr>
                                {headers.map((h, idx) => (
                                    <th key={idx} className="px-3.5 py-2.5 font-semibold">{renderInlineMarkdown(h.trim())}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 text-slate-200">
                            {contentRows.map((row, rIdx) => (
                                <tr key={rIdx} className="hover:bg-slate-900/50 transition">
                                    {row.map((cell, cIdx) => (
                                        <td key={cIdx} className="px-3.5 py-2">{renderInlineMarkdown(cell.trim())}</td>
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
            const trimmed = line.trim();

            const isTableLine = /^\s*\|.+\|\s*$/.test(line);
            if (isTableLine) {
                flushList();
                const cells = line.split("|").slice(1, -1);
                tableRows.push(cells);
                return;
            }
            flushTable();

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
    while ((match = codeBlockRegex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            const rawText = text.slice(lastIndex, match.index);
            blocks.push(renderTextBlock(rawText, `text-${blockKey++}`));
        }

        const lang = (match[1] || "").toLowerCase();
        const codeContent = match[2].trim();

        if (lang === "mermaid") {
            blocks.push(
                <MermaidDiagram
                    key={`mermaid-${blockKey++}`}
                    chart={codeContent}
                    diagramId={`mermaid-${crypto.randomUUID()}`}
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

    if (lastIndex < text.length) {
        blocks.push(renderTextBlock(text.slice(lastIndex), `text-${blockKey++}`));
    }

    return blocks;
}

<<<<<<< HEAD
function App() {
=======
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
                await signup(form.name.trim(), form.email.trim(), form.password);
                setMode("login");
                setForm((current) => ({ ...current, password: "", terms: false }));
                setSuccess("Account created. Sign in to enter your workspace.");
            } else {
                const response = await login(form.email.trim(), form.password);
                const storage = form.remember ? window.localStorage : window.sessionStorage;
                storage.setItem("ai-market-gap-auth-token", response.data.token);
                onAuthenticated();
            }
        } catch (requestError) {
            setError(requestError.response?.data?.error || "Something went wrong. Please try again.");
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

function ProfilePage({ user, analysesCount, onBack, onSave }) {
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
    return <main className="min-h-screen overflow-y-auto bg-slate-950 p-5 text-white sm:p-10"><div className="mx-auto max-w-3xl"><button onClick={onBack} className="mb-8 text-sm text-slate-400 hover:text-white">← Back to workspace</button><div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 sm:p-10"><p className="text-xs font-semibold uppercase tracking-[.18em] text-emerald-400">Account profile</p><div className="mt-5 flex items-center gap-4"><div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-600 text-xl font-bold">{(name || "U").slice(0, 1).toUpperCase()}</div><div><h1 className="text-2xl font-bold">Your profile</h1><p className="text-sm text-slate-400">Manage your workspace identity and activity.</p></div></div><form onSubmit={save} className="mt-10 max-w-xl space-y-5"><label className="block text-sm font-medium text-slate-300">Full name<input value={name} onChange={(event) => { setName(event.target.value); setError(""); }} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-indigo-500" /></label><label className="block text-sm font-medium text-slate-300">Email<input value={user?.email || ""} disabled className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-slate-500" /></label>{error && <p className="text-sm text-rose-400">{error}</p>}{message && <p className="text-sm text-emerald-400">{message}</p>}<button disabled={saving} className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold hover:bg-indigo-500 disabled:opacity-50">{saving ? "Saving..." : "Save changes"}</button></form><div className="mt-10 grid gap-4 border-t border-slate-800 pt-6 sm:grid-cols-2"><div><p className="text-xs uppercase tracking-wider text-slate-500">Analyses created</p><p className="mt-2 text-2xl font-bold">{analysesCount}</p></div><div><p className="text-xs uppercase tracking-wider text-slate-500">Member since</p><p className="mt-2 text-sm text-slate-300">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Recently"}</p></div></div></div></div></main>;
}

function AnalysisHistoryPage({ analyses, error, onBack, onDelete }) {
    return <main className="min-h-screen overflow-y-auto bg-slate-950 p-5 text-white sm:p-10"><div className="mx-auto max-w-5xl"><button onClick={onBack} className="mb-8 text-sm text-slate-400 hover:text-white">← Back to workspace</button><div className="mb-8"><p className="text-xs font-semibold uppercase tracking-[.18em] text-emerald-400">Private workspace</p><h1 className="mt-2 text-3xl font-bold">My analyses</h1><p className="mt-2 text-sm text-slate-400">Your saved market opportunity reports.</p></div>{error && <p className="mb-5 rounded-xl border border-rose-900/70 bg-rose-950/30 p-4 text-sm text-rose-300">{error}</p>}{analyses.length ? <div className="space-y-3">{analyses.map((item) => <div key={item._id} className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-semibold text-slate-100">{item.title}</h2><p className="mt-1 text-xs text-slate-500">{new Date(item.createdAt).toLocaleString()} · Score {item.report?.opportunityScore ?? "--"}/100</p></div><button onClick={() => onDelete(item._id)} className="self-start rounded-lg border border-rose-900/70 px-3 py-2 text-xs text-rose-300 hover:bg-rose-950/50">Delete</button></div>)}</div> : <div className="rounded-2xl border border-dashed border-slate-700 p-10 text-center text-sm text-slate-500">{error ? "History is unavailable right now." : "No saved analyses yet. Run your first analysis from the workspace."}</div>}</div></main>;
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
>>>>>>> 4b7f4a6 (Signup and)
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

    const [isLoading, setIsLoading] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [history, setHistory] = useState([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
<<<<<<< HEAD
        fetchHistory();
    }, []);
=======
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
>>>>>>> 4b7f4a6 (Signup and)

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

<<<<<<< HEAD
=======
    const handleSignOut = async () => {
        try { await logout(); } catch { /* The local token is still cleared below. */ }
        try {
            window.localStorage.removeItem("ai-market-gap-auth-token");
            window.sessionStorage.removeItem("ai-market-gap-auth-token");
        } catch {
            // Continue to the sign-in screen if browser storage is unavailable.
        }
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
        setIsAuthenticated(false);
    };

>>>>>>> 4b7f4a6 (Signup and)
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
<<<<<<< HEAD
                    text: error.response?.data?.error || "Sorry, the message could not be processed."
=======
                    text: error.response?.data?.error || error.message || "Sorry, the message could not be processed."
>>>>>>> 4b7f4a6 (Signup and)
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

<<<<<<< HEAD
        const response = await analyzeMarket(messages);
=======
        const response = await analyzeMarket(messages, sessionId);
>>>>>>> 4b7f4a6 (Signup and)
        const report = response?.data ?? {};

        setAnalysis({
            opportunityScore: report.opportunityScore ?? 0,
            verdict: report.verdict ?? "No verdict available.",
            competitors: Array.isArray(report.competitors) ? report.competitors : [],
            marketGaps: Array.isArray(report.marketGaps) ? report.marketGaps : [],
            swot: report.swot && typeof report.swot === "object" ? report.swot : {},
            roadmap: Array.isArray(report.roadmap) ? report.roadmap : []
        });
<<<<<<< HEAD
=======
        getAnalyses().then((result) => {
            setAnalyses(result.data.analyses || []);
            setDataError("");
        }).catch(() => setDataError("Your analysis was created, but history could not be refreshed."));
>>>>>>> 4b7f4a6 (Signup and)

    } catch (error) {

        console.error("Analyze Error:", error);

        setAnalysis({
            opportunityScore: 0,
            verdict: "Unable to analyze right now. Please try again.",
            competitors: [],
            marketGaps: [],
            swot: {},
            roadmap: []
        });

    } finally {
        setIsAnalyzing(false);
    }

};
<<<<<<< HEAD
=======
    if (!isAuthenticated) return <AuthScreen onAuthenticated={() => setIsAuthenticated(true)} />;
    if (page === "profile") return <ProfilePage user={user} analysesCount={analyses.length} onBack={() => setPage("workspace")} onSave={(updatedUser) => setUser((current) => ({ ...current, ...updatedUser }))} />;
    if (page === "history") return <AnalysisHistoryPage analyses={analyses} error={dataError} onBack={() => setPage("workspace")} onDelete={async (id) => { await deleteAnalysis(id); setAnalyses((current) => current.filter((item) => item._id !== id)); }} />;

>>>>>>> 4b7f4a6 (Signup and)
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
<<<<<<< HEAD
                    <button
                        type="button"
                        onClick={startNewChat}
                        className="flex items-center gap-2 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-indigo-500 sm:text-sm"
                    >
                        <FiPlus size={16} />
                        <span>New Chat</span>
                    </button>
=======
                    <div className="flex items-center gap-2">
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
                            title="Sign out"
                            aria-label="Sign out"
                            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-400 transition hover:border-rose-500/60 hover:text-rose-300"
                        >
                            <FiLogOut size={17} />
                        </button>
                    </div>
>>>>>>> 4b7f4a6 (Signup and)
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
                            {history.length ? (
                                history.map((item) => (
                                    <div
                                        key={item.sessionId}
                                        onClick={() => handleSelectSession(item.sessionId)}
                                        className={`group flex items-center justify-between rounded-xl px-3 py-2.5 text-xs cursor-pointer transition ${
                                            sessionId === item.sessionId
                                                ? "bg-indigo-600/20 text-indigo-300 font-medium border border-indigo-500/40"
                                                : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                                        }`}
                                    >
                                        <div className="flex items-center gap-2 min-w-0 flex-1">
                                            <FiMessageCircle size={14} className="flex-none text-slate-500 group-hover:text-indigo-400" />
                                            <span className="truncate">{item.title}</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={(e) => handleDeleteSession(item.sessionId, e)}
                                            title="Delete conversation"
                                            className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 transition hover:text-rose-400"
                                        >
                                            <FiTrash2 size={13} />
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <p className="py-4 text-center text-xs text-slate-500">No previous chats yet</p>
                            )}
                        </div>
                    </aside>
                )}

                <section className="flex min-h-0 min-w-0 flex-1 flex-col border-b border-slate-800 md:border-b-0 md:border-r">
                    <div className="flex-none border-b border-slate-800 px-4 py-3 sm:px-6">
                        <h2 className="font-semibold text-slate-100">Chat Assistant</h2>
                        <p className="mt-1 text-xs text-slate-500">Explore and refine your startup idea</p>
                    </div>

                    <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-6">
                        {messages.map((msg, index) => (
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
                        ))}

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
                        <div className="flex items-center gap-3">
                            <FiBarChart2 className="text-emerald-400" />
                            <div>
                                <h2 className="font-semibold text-slate-100">Market Insights</h2>
                                <p className="mt-1 text-xs text-slate-500">Your generated opportunity report</p>
                            </div>
                        </div>
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
                        <div className="space-y-5 pb-6">
                            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Opportunity Score</p>
                                <div className="mt-2 flex items-end gap-2">
                                    <h2 className="text-5xl font-bold tracking-tight text-emerald-400">
                                        {analysis?.opportunityScore ?? "--"}
                                    </h2>
                                    <span className="pb-1 text-sm text-slate-500">/ 100</span>
                                </div>
                                <StarRating score={analysis?.opportunityScore} />
                            </div>

                            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
                                <p className="mb-2 text-sm font-semibold text-slate-300">Verdict</p>
                                <p className="leading-7 text-slate-200">{analysis?.verdict || "Waiting for analysis..."}</p>
                            </div>

                            <div className="grid gap-5 xl:grid-cols-2">
                                <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
                                    <p className="mb-3 text-sm font-semibold text-slate-300">Competitors</p>
                                    <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-slate-300">
                                        {analysis?.competitors?.length ? analysis.competitors.map((item, index) => (
                                            <li key={index}>{item}</li>
                                        )) : <li>No competitors yet</li>}
                                    </ul>
                                </div>

                                <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
                                    <p className="mb-3 text-sm font-semibold text-slate-300">Market Gaps</p>
                                    <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-slate-300">
                                        {analysis?.marketGaps?.length ? analysis.marketGaps.map((item, index) => (
                                            <li key={index}>{item}</li>
                                        )) : <li>No market gaps yet</li>}
                                    </ul>
                                </div>
                            </div>

                            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
                                <p className="mb-4 text-sm font-semibold text-slate-300">SWOT</p>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    {Object.entries(analysis?.swot || {}).map(([key, items]) => (
                                        <div key={key} className="rounded-xl bg-slate-950/60 p-3">
                                            <p className="mb-2 capitalize font-medium text-slate-100">{key}</p>
                                            <ul className="list-disc space-y-1 pl-5 text-sm leading-6 text-slate-400">
                                                {Array.isArray(items) && items.length ? items.map((item, index) => (
                                                    <li key={`${key}-${index}`}>{item}</li>
                                                )) : <li>No data</li>}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
                                <p className="mb-3 text-sm font-semibold text-slate-300">Roadmap</p>
                                <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-slate-300">
                                    {analysis?.roadmap?.length ? analysis.roadmap.map((item, index) => (
                                        <li key={index}>{item}</li>
                                    )) : <li>No roadmap yet</li>}
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );

}

export default App;