import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "change-me-in-prod";

export default function auth(req, res, next) {
    // 1. Grab the token directly from the incoming cookies object
    // Note: 'req.cookies' is populated automatically by the cookie-parser middleware
    const token = req.cookies.token;

    // 2. Clear failure state: If the cookie is missing completely, exit early
    if (!token) {
        return res.status(401).json({ message: "Access Denied: Missing authentication token" });
    }

    try {
        // 3. Cryptographically verify the token integrity against your secret key
        const payload = jwt.verify(token, JWT_SECRET);
        
        // 4. Attach the user's data structure to the request object scope
        // Subsequent controllers can now instantly read req.user.id
        req.user = { id: payload.sub || payload.id, email: payload.email };
        
        // 5. Pass the request along down the middleware pipeline
        return next();
    } catch (err) {
        // Fires if the signature doesn't match or the token's 7-day expiration has passed
        return res.status(401).json({ message: "Access Denied: Invalid or expired token" });
    }
}