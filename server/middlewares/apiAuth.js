// server/middleware/apiAuth.js
import crypto from "crypto";
import ApiKey from "../models/ApiKey.js";

export const validateApiKey = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Access Denied: Missing API Token authorization headers." });
    }

    const providedKey = authHeader.split(" ")[1]; // Isolate the raw 'VF_API_KEY_...' string

    try {
        // 1. Re-hash the incoming header key parameter string to see if it matches our storage records
        const hashedSearchTarget = crypto
            .createHash("sha256")
            .update(providedKey)
            .digest("hex");

        // 2. Query the storage collection tracking active configurations blocks
        const apiKeyDoc = await ApiKey.findOne({ hashedKey: hashedSearchTarget, isActive: true }).populate("user");

        if (!apiKeyDoc) {
            return res.status(401).json({ message: "Access Denied: Invalid or revoked API credentials token." });
        }

        // 3. Hydrate req.user using the populated relationship model context!
        // This ensures subsequent controllers seamlessly read req.user.id just like your web app does!
        req.user = {
            id: apiKeyDoc.user._id,
            email: apiKeyDoc.user.email,
        };

        // 4. Update access logs asynchronously without stalling the network stream transaction
        apiKeyDoc.lastUsedAt = new Date();
        await apiKeyDoc.save();

        return next();
    } catch (err) {
        return res.status(500).json({ message: "Internal server anomaly during credentials evaluation loop." });
    }
};