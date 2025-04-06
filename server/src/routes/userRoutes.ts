import express from "express";
import {
    getAllUsers,
    getUser,
    updateUser,
    deleteUser,
} from "../controllers/userController";
import { protect, restrictTo } from "../middlewares/authMiddleware";

const router = express.Router();

// Protect all routes after this middleware
// router.use(protect);

// Admin only route
router.get("/", getAllUsers);

// User-specific routes
router.get("/:id", getUser);
router.patch("/:id", updateUser);
router.delete("/:id", deleteUser);

export default router;
