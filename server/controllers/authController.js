import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.js";

const JWT_SECRET = process.env.JWT_SECRET || "change-me-in-prod";

// Cookie Configuration Options Token Matrix
const cookieOptions = {
    httpOnly: true,                 // 🔒 Blocks JavaScript from reading the token (XSS Protection)
    secure: process.env.NODE_ENV === "production", // Forces HTTPS usage in production environments
    sameSite: "lax",                // Mitigates Cross-Site Request Forgery (CSRF) exploits
    maxAge: 7 * 24 * 60 * 60 * 1000 // Expiration time matching JWT lifespan (7 days in milliseconds)
};

export const register = async (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ message: "Email and password required" });

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: "User already exists" });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = new User({ email, passwordHash });
    await user.save();

    const token = jwt.sign({ sub: user._id.toString(), email: user.email }, JWT_SECRET, { expiresIn: "7d" });

    // Attach the token directly into the client's cookie jar jar instead of the JSON payload
    res.cookie("token", token, cookieOptions);

    return res.status(201).json({ 
        message: "Registered successfully", 
        user: { id: user._id, email: user.email } 
    });
};

export const login = async (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ message: "Email and password required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const ok = await user.verifyPassword(password);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign({ sub: user._id.toString(), email: user.email }, JWT_SECRET, { expiresIn: "7d" });

    // Flush the cookie validation down the pipeline
    res.cookie("token", token, cookieOptions);

    return res.status(200).json({ 
        message: "Logged in successfully", 
        user: { id: user._id, email: user.email } 
    });
};


export const logout = async (req, res) => {
    // Simply clear out the token and set the expiration date to the past
    res.clearCookie("token", { ...cookieOptions, maxAge: 0 });
    return res.status(200).json({ message: "Logged out successfully" });
};

export const getCurrentUser = async(req, res) => {
     try {
    res.json({ user: req.user });
  } catch (err) {
    console.error('Get user profile error:', err);
    res.status(500).json({ error: 'Failed to retrieve user profile. Please try again.' });
  }
}