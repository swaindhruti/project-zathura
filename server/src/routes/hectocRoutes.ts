import express from "express";
import {
    getPuzzle,
    getSolution,
    verifyPuzzleSolution,
    saveScores,
    getGameResults,
} from "../controllers/hectocController";
import { protect } from "@/middlewares/errorMiddleware";

const router = express.Router();

router.use(protect);

router.post("/puzzle", getPuzzle);
router.post("/verify", verifyPuzzleSolution);
router.post("/solution", getSolution);
router.post("/save", saveScores);
router.get("/results", getGameResults);

export default router;
