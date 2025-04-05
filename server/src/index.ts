import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import morgan from "morgan";
import { errorHandler } from "./middlewares/errorMiddleware";
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import hectocRoutes from "./routes/hectocRoutes";
import friendRoutes from "./routes/friendRoutes";

const app = express();
const PORT = process.env.PORT || 4000;

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

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
