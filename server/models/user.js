import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
    email: { type: String, unique: true, required: true, lowercase: true },
    passwordHash: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },

    name: {
        type: String,
        required: false,
        trim: true,
        default: "",
    },
    username: {
        type: String,
        required: false,
        unique: true, // Prevents two users from claiming the same handle
        sparse: true, // ⚠️ CRITICAL: Allows multiple users to have an empty string/null username initially without breaking the unique rule!
        trim: true,
    },
    role: {
        type : String,
        required: true,
        default: 'user',
    }
});

userSchema.methods.verifyPassword = function (password) {
    return bcrypt.compare(password, this.passwordHash);
}

const User = mongoose.model("User", userSchema);

export default User;
