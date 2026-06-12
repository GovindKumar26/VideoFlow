import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.js";
import asyncHandler from "../utils/asyncHandler.js";

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



export const updateProfileSettings = asyncHandler(async (req, res) => {
    const userId = req.user.id; // Extracted safely from your 'auth' token middleware
    const { name, username } = req.body;

    // 1. Validation: If a username is provided, sanitize and check for duplicates
    let normalizedUsername = undefined;
    
    if (username && username.trim() !== "") {
        // Strip out spaces and force lower-case to maintain system uniformity
        normalizedUsername = username.replace(/\s+/g, "").toLowerCase().trim();

        // Regex check to ensure usernames only contain alphanumeric characters, underscores, or periods
        const usernameRegex = /^[a-zA-Z0-9._]+$/;
        if (!usernameRegex.test(normalizedUsername)) {
            return res.status(400).json({ 
                message: "Usernames can only contain letters, numbers, periods, and underscores." 
            });
        }

        // Check if another user account has already registered this exact handle
        const duplicateCheck = await User.findOne({
            username: normalizedUsername,
            _id: { $ne: userId } // Exclude the current user from the look-up query
        });

        if (duplicateCheck) {
            return res.status(400).json({ message: "This username is already taken." });
        }
    }

    // 2. Build the update payload dynamically
    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (normalizedUsername !== undefined) updateData.username = normalizedUsername;

    // 3. Commit mutations directly to MongoDB
    const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $set: updateData },
        { 
            new: true,           // Returns the newly updated document rather than the old one
            runValidators: true  // Instructs Mongoose to check schema criteria parameters again
        }
    ).select("-password"); // Explicitly drop the hashed password parameter from the network payload

    if (!updatedUser) {
        return res.status(404).json({ message: "User account record not found." });
    }

    // 4. Return the new document structure directly back to the React client slice
    res.status(200).json({
        message: "Profile options synchronized successfully.",
        user: updatedUser
    });
});




export const changePassword = asyncHandler(async (req, res) => {
    const userId = req.user.id; // Extracted safely from your auth middleware
    const { currentPassword, newPassword } = req.body;

    // 1. Basic Validation
    if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Both current and new passwords are required." });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ message: "New password must be at least 6 characters long." });
    }

    // 2. Fetch user from database including the password field
    const user = await User.findById(userId);
    if (!user) {
        return res.status(404).json({ message: "User not found." });
    }

    // 3. Verify current password matches what's in the DB
    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
        return res.status(400).json({ message: "The current password you entered is incorrect." });
    }

    // 4. Hash the new password and save
    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.status(200).json({ message: "Password updated successfully." });
});