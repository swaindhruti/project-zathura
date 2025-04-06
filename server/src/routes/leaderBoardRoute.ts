import express from "express";
import { getLeaderboard } from "@/controllers/leaderBoardController";

const router = express.Router();

router.get("/", getLeaderboard);

export default router;
