import express from "express";
import { protect } from "../middlewares/authMiddleware";
import {
  GameType,
  GameDifficulty,
  generateGameQuestions,
} from "../controllers/gameController";

const router = express.Router();

// Protected routes
router.use(protect);

// Get available game types
router.get("/types", (req, res) => {
  res.status(200).json({
    status: "success",
    data: {
      types: Object.values(GameType),
      difficulties: Object.values(GameDifficulty),
    },
  });
});

// Generate a sample set of questions (for practice mode)
router.get("/practice", (req, res) => {
  try {
    const { type, difficulty } = req.query;

    // Validate game type and difficulty
    if (!type || !Object.values(GameType).includes(type as GameType)) {
      return res.status(400).json({
        status: "fail",
        message: "Invalid game type",
      });
    }

    if (
      !difficulty ||
      !Object.values(GameDifficulty).includes(difficulty as GameDifficulty)
    ) {
      return res.status(400).json({
        status: "fail",
        message: "Invalid difficulty level",
      });
    }

    // Generate questions
    const questions = generateGameQuestions(
      type as GameType,
      difficulty as GameDifficulty,
      5 // Fewer questions for practice mode
    );

    // Don't send answers for practice mode
    const practiceQuestions = questions.map((q) => {
      // For Hectoc game, format the question differently
      if (
        type === GameType.HECTOC_GAME &&
        "validDigits" in q &&
        "validTarget" in q
      ) {
        return {
          question: q.question,
          validDigits: q.validDigits,
          validTarget: q.validTarget,
        };
      }
      return { question: q.question };
    });

    res.status(200).json({
      status: "success",
      data: {
        questions: practiceQuestions,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Could not generate practice questions",
    });
  }
});

// Get user game history
router.get("/history", (req, res) => {
  // This would normally query the database for game history
  // For now, just return a placeholder response
  res.status(200).json({
    status: "success",
    data: {
      message: "Game history feature coming soon",
      userId: req.user?.id,
    },
  });
});

export default router;
