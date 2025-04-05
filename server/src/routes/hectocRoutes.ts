import express from "express";
import {
    getPuzzle,
    getSolution,
    verifyPuzzleSolution,
} from "../controllers/hectocController";
import { protect } from "@/middlewares/errorMiddleware";

const router = express.Router();

router.use(protect);

router.post("/puzzle", getPuzzle);
router.post("/verify", verifyPuzzleSolution);
router.post("/solution", getSolution);

export default router;
