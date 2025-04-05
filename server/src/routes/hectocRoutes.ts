import express from "express";
import {
    getPuzzle,
    getSolution,
    verifyPuzzleSolution,
} from "../controllers/hectocController";

const router = express.Router();

router.post("/puzzle", getPuzzle);
router.post("/verify", verifyPuzzleSolution);
router.post("/solution", getSolution);

export default router;
