import { PrismaClient } from "@prisma/client";
import { HectocService } from "../services/hectocService";

const prisma = new PrismaClient();
const hectocService = new HectocService();

export enum GameType {
  MATH_CHALLENGE = "MATH_CHALLENGE",
  WORD_SCRAMBLE = "WORD_SCRAMBLE",
  HECTOC_GAME = "HECTOC_GAME",
}

export enum GameDifficulty {
  EASY = "EASY",
  MEDIUM = "MEDIUM",
  HARD = "HARD",
}

// Create a new game session
export const createGameSession = (
  type: GameType,
  difficulty: GameDifficulty
) => {
  // Generate a unique ID for the game session
  const gameId =
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);

  // Create game session with appropriate questions based on game type
  const questions = generateGameQuestions(type, difficulty);

  return {
    id: gameId,
    type,
    difficulty,
    questions,
    startTime: null,
    endTime: null,
    status: "waiting",
    players: [],
  };
};

// Generate questions based on game type and difficulty
export const generateGameQuestions = (
  type: GameType,
  difficulty: GameDifficulty
) => {
  let questions: Array<{ question: string; answer: string | number }> = [];

  switch (type) {
    case GameType.MATH_CHALLENGE:
      questions = generateMathQuestions(difficulty);
      break;
    case GameType.WORD_SCRAMBLE:
      questions = generateWordScrambleQuestions(difficulty);
      break;
    case GameType.HECTOC_GAME:
      questions = generateHectocQuestions(difficulty);
      break;
    default:
      questions = [];
  }

  return questions;
};

// Generate math challenge questions
const generateMathQuestions = (difficulty: GameDifficulty) => {
  const questions = [];
  const count =
    difficulty === GameDifficulty.EASY
      ? 5
      : difficulty === GameDifficulty.MEDIUM
      ? 8
      : 10;

  for (let i = 0; i < count; i++) {
    let question, answer;

    switch (difficulty) {
      case GameDifficulty.EASY:
        // Simple addition and subtraction
        const num1 = Math.floor(Math.random() * 20) + 1;
        const num2 = Math.floor(Math.random() * 20) + 1;
        const op = Math.random() > 0.5 ? "+" : "-";
        question = `${num1} ${op} ${num2}`;
        answer = op === "+" ? num1 + num2 : num1 - num2;
        break;

      case GameDifficulty.MEDIUM:
        // Multiplication and division
        const a = Math.floor(Math.random() * 12) + 1;
        const b = Math.floor(Math.random() * 12) + 1;
        const opMed = Math.random() > 0.5 ? "*" : "/";

        if (opMed === "*") {
          question = `${a} × ${b}`;
          answer = a * b;
        } else {
          // Ensure clean division
          const product = a * b;
          question = `${product} ÷ ${a}`;
          answer = b;
        }
        break;

      case GameDifficulty.HARD:
        // Mixed operations
        const x = Math.floor(Math.random() * 20) + 5;
        const y = Math.floor(Math.random() * 10) + 2;
        const z = Math.floor(Math.random() * 5) + 1;

        const operations = [
          `${x} + ${y} × ${z}`,
          `(${x} + ${y}) × ${z}`,
          `${x} × ${y} - ${z}`,
          `${x} + ${y} - ${z}`,
        ];

        const selectedOp =
          operations[Math.floor(Math.random() * operations.length)];
        question = selectedOp;
        answer = eval(selectedOp.replace("×", "*").replace("÷", "/"));
        break;
    }

    questions.push({ question, answer });
  }

  return questions;
};

// Generate word scramble questions
const generateWordScrambleQuestions = (difficulty: GameDifficulty) => {
  const easyWords = [
    "cat",
    "dog",
    "sun",
    "run",
    "hat",
    "bat",
    "red",
    "cup",
    "box",
    "fox",
  ];
  const mediumWords = [
    "apple",
    "house",
    "table",
    "chair",
    "phone",
    "light",
    "water",
    "music",
    "paper",
    "dance",
  ];
  const hardWords = [
    "computer",
    "elephant",
    "geography",
    "beautiful",
    "knowledge",
    "adventure",
    "character",
    "education",
    "community",
    "important",
  ];

  let wordList;
  const count =
    difficulty === GameDifficulty.EASY
      ? 5
      : difficulty === GameDifficulty.MEDIUM
      ? 8
      : 10;

  switch (difficulty) {
    case GameDifficulty.EASY:
      wordList = easyWords;
      break;
    case GameDifficulty.MEDIUM:
      wordList = mediumWords;
      break;
    case GameDifficulty.HARD:
      wordList = hardWords;
      break;
    default:
      wordList = mediumWords;
  }

  const questions = [];
  const usedIndices = new Set();

  for (let i = 0; i < count; i++) {
    let randomIndex;
    do {
      randomIndex = Math.floor(Math.random() * wordList.length);
    } while (usedIndices.has(randomIndex));

    usedIndices.add(randomIndex);
    const word = wordList[randomIndex];

    // Scramble the word
    const scrambled = word
      .split("")
      .sort(() => Math.random() - 0.5)
      .join("");

    questions.push({
      question: scrambled,
      answer: word,
    });
  }

  return questions;
};

// Generate Hectoc game questions
const generateHectocQuestions = (difficulty: GameDifficulty) => {
  const difficultyMapping = {
    [GameDifficulty.EASY]: "easy",
    [GameDifficulty.MEDIUM]: "moderate",
    [GameDifficulty.HARD]: "difficult",
  };

  const count = 3; // Number of Hectoc puzzles to generate

  // Use the HectocService to generate puzzles
  const puzzles = hectocService.generateHectocPuzzles(
    count,
    difficultyMapping[difficulty] as "easy" | "moderate" | "difficult",
    100, // Target number
    6 // Number of digits
  );

  // Transform the puzzles into the format expected by the game system
  return puzzles.map((puzzle) => ({
    question: `Make 100 using these digits: ${puzzle.digits.join(", ")}`,
    validDigits: puzzle.digits,
    validTarget: 100,
    answer: puzzle.solution, // This is the example solution, players can find different valid solutions
  }));
};

// Validate a Hectoc game answer
export const validateHectocAnswer = (answer: string, question: any) => {
  if (!question.validDigits || !question.validTarget) {
    return false;
  }

  const validation = hectocService.verifyHectocSolution(
    answer,
    question.validDigits,
    question.validTarget
  );

  return validation.isValid;
};
