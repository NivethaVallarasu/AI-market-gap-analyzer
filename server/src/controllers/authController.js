const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const getToken = (user) => jwt.sign(
    { userId: user._id.toString(), email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
);

const publicUser = (user) => ({ id: user._id, name: user.name, email: user.email });

const requireAuthConfig = (res) => {
    if (!process.env.JWT_SECRET) {
        res.status(503).json({ error: "Authentication is not configured." });
        return false;
    }
    return true;
};

const signup = async (req, res) => {
    try {
    if (!requireAuthConfig(res)) return;
        const name = String(req.body.name || "").trim();
        const email = String(req.body.email || "").trim().toLowerCase();
        const password = String(req.body.password || "");

        if (!name || !/^\S+@\S+\.\S+$/.test(email) || password.length < 8) {
            return res.status(400).json({ error: "Enter a name, valid email, and password of at least 8 characters." });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(409).json({ error: "An account with this email already exists. Please sign in." });

        const passwordHash = await bcrypt.hash(password, 12);
        const user = await User.create({ name, email, passwordHash });
        return res.status(201).json({ token: getToken(user), user: publicUser(user) });
    } catch (error) {
        return res.status(500).json({ error: "Unable to create your account right now." });
    }
};

const login = async (req, res) => {
    try {
    if (!requireAuthConfig(res)) return;
        const email = String(req.body.email || "").trim().toLowerCase();
        const password = String(req.body.password || "");
        const user = await User.findOne({ email });
        const passwordMatches = user && await bcrypt.compare(password, user.passwordHash);

        if (!passwordMatches) return res.status(401).json({ error: "Email or password is incorrect." });
        return res.json({ token: getToken(user), user: publicUser(user) });
    } catch (error) {
        return res.status(500).json({ error: "Unable to sign in right now." });
    }
};

const getMe = async (req, res) => {
    const user = await User.findById(req.user.userId).select("name email createdAt");
    if (!user) return res.status(404).json({ error: "User account not found." });
    return res.json({ user: publicUser(user), createdAt: user.createdAt });
};

const updateProfile = async (req, res) => {
    const name = String(req.body.name || "").trim();
    if (!name || name.length > 80) return res.status(400).json({ error: "Name must be between 1 and 80 characters." });
    const user = await User.findByIdAndUpdate(req.user.userId, { name }, { new: true, runValidators: true }).select("name email createdAt");
    if (!user) return res.status(404).json({ error: "User account not found." });
    return res.json({ user: publicUser(user), createdAt: user.createdAt, message: "Profile updated successfully." });
};

module.exports = { signup, login, getMe, updateProfile };