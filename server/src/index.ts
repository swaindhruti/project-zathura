import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import morgan from "morgan";
import { createServer } from "http";
import { Server as SocketServer } from "socket.io";
import { errorHandler } from "./middlewares/errorMiddleware";
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import gameRoutes from "./routes/gameRoutes";
import gameSocketHandler from "./socket/gameSocket";

const app = express();
const PORT = process.env.PORT || 4000;
const httpServer = createServer(app);

// Set up Socket.io
const io = new SocketServer(httpServer, {
  cors: {
    origin:
      process.env.NODE_ENV === "production"
        ? "https://your-production-domain.com"
        : "http://localhost:3000",
    credentials: true,
  },
});

// Initialize socket handlers
gameSocketHandler(io);

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan("dev"));
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? "https://your-production-domain.com"
        : "http://localhost:3000",
    credentials: true,
  })
);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/games", gameRoutes);

// Health check route
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "success", message: "Server is running" });
});

// Error handler
app.use(errorHandler);

// Start server
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
