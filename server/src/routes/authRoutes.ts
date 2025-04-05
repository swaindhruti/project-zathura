import express from "express";
import {
  register,
  login,
  logout,
  refreshToken,
  getMe,
} from "../controllers/authController";
import { protect } from "../middlewares/authMiddleware";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/refresh-token", refreshToken);
router.get("/me", protect, getMe);
router.post("/logout", protect, logout);

export default router;
