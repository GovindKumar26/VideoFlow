import express from "express";
import uploadRouter from "./routes/uploadRoutes.js";
import fileRouter from "./routes/fileRoutes.js";
import adminRouter from "./routes/adminRoutes.js";
import streamRouter from "./routes/streamRoutes.js";
import developerRoutes from "./routes/developerRoutes.js";
import authRouter from "./routes/authRoutes.js";
import webhookRouter from "./routes/webhookRoutes.js";
import notificationRouter from "./routes/notificationRoutes.js";
import dotenv from "dotenv";
import cors from "cors";
import dbConnect from "./config/database.js";
import errorHandler from "./middlewares/errorHandler.js";
import { startTranscodeConsumer, startFailedConsumer, startProcessingConsumer } from "./consumers/transcodeConsumer.js";
import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";
import { Server } from "socket.io";
import cookieParser from "cookie-parser"; // 1. Import the parser
import jwt from "jsonwebtoken";
import { setSocketServer } from "./config/socket.js";
import logger from "morgan";

dotenv.config();

const app = express();
const server = createServer(app);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const io = new Server(server, {
  cors: {
    origin: true,
    credentials: true
  }
});

io.use((socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(" ")?.[1];
  if (!token) {
    return next(new Error("Authentication required"));
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || "change-me-in-prod");
    socket.data.user = { id: payload.sub || payload.id, email: payload.email };
    return next();
  } catch (error) {
    return next(new Error("Invalid or expired token"));
  }
});

io.on("connection", (socket) => {
  const userId = socket.data.user?.id;
  if (userId) {
    socket.join(`user:${userId}`);
    socket.emit("notification:connected", { userId, message: "Notifications connected" });
  }
});

setSocketServer(io);

// Simple request logger middleware
// app.use((req, res, next) => {
//   console.log(`\n--- New Request ---`);
//   console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
//   console.log('Headers:', req.headers);
//   next();
// });

app.use(logger('dev'))
app.use(cors({
  // Match the exact URL and port your frontend server is running on
  origin: 'http://localhost:5173', 
  credentials: true
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(cookieParser());

const PORT = process.env.PORT || 3000;

app.get('/hello', (req, res)=>{
    res.send("Hello");
})

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.use("/upload", uploadRouter);
app.use("/files", fileRouter);
app.use("/admin", adminRouter);
app.use("/stream", streamRouter);
app.use("/auth", authRouter);
app.use("/webhooks", webhookRouter);
app.use("/notifications", notificationRouter);
app.use("/developer", developerRoutes);

// 404 handler for undefined routes
app.use((req, res, next) => {
    res.status(404).json({
      error: 'Not Found',
      message: `The requested URL ${req.originalUrl} was not found on this server.`
    });
  });

app.use(errorHandler);

const startServer = async () => {
  try {
    await dbConnect();
    await startTranscodeConsumer();
    await startFailedConsumer();
    await startProcessingConsumer();

    server.listen(PORT, () => {
      console.log(`server running on port : ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();

