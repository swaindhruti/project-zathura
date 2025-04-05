import { config } from "dotenv";
config();

export const env = {
    port: process.env.PORT || 4000,
    jwtSecret: process.env.JWT_SECRET,
    geminiKey: process.env.GEMINI_KEY,
};
