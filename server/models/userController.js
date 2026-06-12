// Inside server/controllers/userController.js

import asyncHandler from "../utils/asyncHandler.js";
import User from "..//models/user.js";

export const updateProfileSettings = asyncHandler(async (req, res) => {
    const userId = req.user.id; // From your auth middleware
    const { name, username } = req.body;

    // 1. If they are trying to set a username, make sure it isn't already taken
    if (username) {
        const existingUser = await User.findOne({ 
            username: username.toLowerCase(), 
            _id: { $ne: userId } // Ignore the current user's own record
        });
        
        if (existingUser) {
            return res.status(400).json({ message: "This username is already claimed." });
        }
    }

    // 2. Update the user document in MongoDB cleanly
    const updatedUser = await User.findByIdAndUpdate(
        userId,
        { 
            name, 
            username: username ? username.toLowerCase().trim() : undefined 
        },
        { new: true, runValidators: true } // Returns the modified document back
    ).select("-password"); // Hide the hashed password from the response

    res.status(200).json({
        message: "Profile settings updated successfully",
        user: updatedUser
    });
});