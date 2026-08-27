const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../models/User");

const isDbConnected = () => mongoose.connection && mongoose.connection.readyState === 1;

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
    if (!isDbConnected()) {
        res.status(503).json({ error: "Database connection unavailable. Please whitelist your current IP address in MongoDB Atlas." });
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
        console.error("Signup error:", error.message);
        return res.status(500).json({ error: "Unable to create your account right now." });
    }
};

const login = async (req, res) => {
    try {
        if (!requireAuthConfig(res)) return;
        const email = String(req.body.email || "").trim().toLowerCase();
        const password = String(req.body.password || "");

        if (!email || !password) {
            return res.status(400).json({ error: "Please enter both your email and password." });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: "Invalid email or password. Please check your credentials." });
        }

        const passwordMatches = await bcrypt.compare(password, user.passwordHash);
        if (!passwordMatches) {
            return res.status(401).json({ error: "Invalid email or password. Please check your credentials." });
        }

        return res.json({ token: getToken(user), user: publicUser(user) });
    } catch (error) {
        console.error("Login error:", error.message);
        return res.status(500).json({ error: "Unable to sign in right now. Please try again." });
    }
};

const getMe = async (req, res) => {
    try {
        if (!isDbConnected()) return res.status(503).json({ error: "Database unavailable." });
        const user = await User.findById(req.user.userId).select("name email createdAt");
        if (!user) return res.status(404).json({ error: "User account not found." });
        return res.json({ user: publicUser(user), createdAt: user.createdAt });
    } catch (error) {
        return res.status(500).json({ error: "Unable to fetch profile." });
    }
};

const updateProfile = async (req, res) => {
    try {
        if (!isDbConnected()) return res.status(503).json({ error: "Database unavailable." });
        const name = String(req.body.name || "").trim();
        if (!name || name.length > 80) return res.status(400).json({ error: "Name must be between 1 and 80 characters." });
        const user = await User.findByIdAndUpdate(req.user.userId, { name }, { new: true, runValidators: true }).select("name email createdAt");
        if (!user) return res.status(404).json({ error: "User account not found." });
        return res.json({ user: publicUser(user), createdAt: user.createdAt, message: "Profile updated successfully." });
    } catch (error) {
        return res.status(500).json({ error: "Unable to update profile." });
    }
};

module.exports = { signup, login, getMe, updateProfile };