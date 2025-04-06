import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import morgan from "morgan";
import { createServer } from "http";
import { Server } from "socket.io";
import { errorHandler } from "./middlewares/errorMiddleware";
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import hectocRoutes from "./routes/hectocRoutes";
import friendRoutes from "./routes/friendRoutes";
import { initializeGameController } from "./sockets/gameController";

const app = express();
const PORT = process.env.PORT || 4000;
const httpServer = createServer(app);

// Socket.io setup
const io = new Server(httpServer, {
    cors: {
        origin:
            process.env.NODE_ENV === "production"
                ? "https://your-production-domain.com"
                : "http://localhost:3000",
        credentials: true,
    },
});

// Initialize socket controllers
initializeGameController(io);

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

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/hectoc", hectocRoutes);
app.use("/api/friends", friendRoutes);

app.get("/api/health", (req, res) => {
    res.status(200).json({ status: "success", message: "Server is running" });
});

app.use(errorHandler);

// Socket event handlers
io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);
    socket.on("joinRoom", (roomId) => {
        socket.join(roomId);
        console.log(`User ${socket.id} joined room: ${roomId}`);
    });

    socket.on("sendMessage", (data) => {
        io.to(data.roomId).emit("receiveMessage", {
            sender: data.sender,
            message: data.message,
            timestamp: new Date(),
        });
    });

    socket.on("disconnect", () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});

export { io };

httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
