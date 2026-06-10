import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

console.log("Attempting to connect to Atlas...");
console.log("URI String Check:", process.env.MONGO_URL ? "URL string loaded from .env" : "❌ URI IS EMPTY");

mongoose.connect(process.env.MONGO_URL)
  .then(() => {
    console.log("🎉 SUCCESS: Handshake complete. Connected to MongoDB Atlas!");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ CONNECTION FAILED:", err.message);
    process.exit(1);
  });