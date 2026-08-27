const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    const secret = process.env.JWT_SECRET;

    if (!secret) return res.status(503).json({ error: "Authentication is not configured." });
    if (!token) return res.status(401).json({ error: "Authentication is required." });

    try {
        req.user = jwt.verify(token, secret);
        next();
    } catch {
        return res.status(401).json({ error: "Your session is invalid or expired." });
    }
};

module.exports = authMiddleware;