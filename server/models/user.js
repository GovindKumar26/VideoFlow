import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
    email: { type: String, unique: true, required: true, lowercase: true },
    passwordHash: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
});

userSchema.methods.verifyPassword = function(password) {
    return bcrypt.compare(password, this.passwordHash);
}

const User = mongoose.model("User", userSchema);

export default User;
