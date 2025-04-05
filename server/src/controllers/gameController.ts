import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

// Game types
export enum GameType {
  MATH_CHALLENGE = "MATH_CHALLENGE",
  WORD_SCRAMBLE = "WORD_SCRAMBLE",
  HECTOC_GAME = "HECTOC_GAME",
}

// Game difficulty
export enum GameDifficulty {
  EASY = "EASY",
  MEDIUM = "MEDIUM",
  HARD = "HARD",
}

// Validation schema for creating a game
const createGameSchema = z.object({
  type: z.nativeEnum(GameType),
  difficulty: z.nativeEnum(GameDifficulty),
});

// Math challenge question generator
export const generateMathQuestion = (difficulty: GameDifficulty) => {
  let num1, num2, operator, answer;

  switch (difficulty) {
    case GameDifficulty.EASY:
      num1 = Math.floor(Math.random() * 10) + 1;
      num2 = Math.floor(Math.random() * 10) + 1;
      operator = ["+", "-"][Math.floor(Math.random() * 2)];
      break;
    case GameDifficulty.MEDIUM:
      num1 = Math.floor(Math.random() * 20) + 10;
      num2 = Math.floor(Math.random() * 20) + 1;
      operator = ["+", "-", "*"][Math.floor(Math.random() * 3)];
      break;
    case GameDifficulty.HARD:
      num1 = Math.floor(Math.random() * 50) + 20;
      num2 = Math.floor(Math.random() * 30) + 5;
      operator = ["+", "-", "*", "/"][Math.floor(Math.random() * 4)];
      // Ensure division results in whole numbers
      if (operator === "/") {
        num1 = num2 * Math.floor(Math.random() * 10 + 1);
      }
      break;
    default:
      num1 = Math.floor(Math.random() * 10) + 1;
      num2 = Math.floor(Math.random() * 10) + 1;
      operator = "+";
  }

  // Calculate answer
  switch (operator) {
    case "+":
      answer = num1 + num2;
      break;
    case "-":
      answer = num1 - num2;
      break;
    case "*":
      answer = num1 * num2;
      break;
    case "/":
      answer = num1 / num2;
      break;
    default:
      answer = num1 + num2;
  }

  return {
    question: `${num1} ${operator} ${num2}`,
    answer: answer.toString(),
  };
};

// Hectoc game question generator
export const generateHectocQuestion = (difficulty: GameDifficulty) => {
  // Generate 6 random digits (1-9)
  const digits = Array.from(
    { length: 6 },
    () => Math.floor(Math.random() * 9) + 1
  );

  // Target number varies by difficulty
  let target;
  switch (difficulty) {
    case GameDifficulty.EASY:
      target = 10 + Math.floor(Math.random() * 20); // 10-30
      break;
    case GameDifficulty.MEDIUM:
      target = 30 + Math.floor(Math.random() * 40); // 30-70
      break;
    case GameDifficulty.HARD:
      target = 70 + Math.floor(Math.random() * 30); // 70-100
      break;
    default:
      target = 50;
  }

  // We'll provide a potential solution for verification (not shown to players)
  // This is a simplified version - the real game would check if the submitted equation is valid
  // For our purposes, we'll generate a valid equation using 2-3 of the digits
  const sampleSolution = generateSampleSolution(digits, target, difficulty);

  return {
    question: {
      digits: digits.join(" "),
      target: target,
    },
    answer: sampleSolution,
    // Store these for validation (we'll check if the user's answer uses valid digits)
    validDigits: digits,
    validTarget: target,
  };
};

// Helper function to generate a sample solution for hectoc game
function generateSampleSolution(
  digits: number[],
  target: number,
  difficulty: GameDifficulty
) {
  // For simplicity, we'll just create a basic equation
  // In a real game, this would be more sophisticated

  // Shuffle the digits to randomly select which ones to use
  const shuffledDigits = [...digits].sort(() => Math.random() - 0.5);

  let equation = "";
  let operators = ["+", "-", "*", "/"];

  // Use different equation patterns based on difficulty
  if (difficulty === GameDifficulty.EASY) {
    // Simple two-digit addition or multiplication to get close to target
    const d1 = shuffledDigits[0];
    const d2 = shuffledDigits[1];

    if (Math.abs(d1 + d2 - target) < Math.abs(d1 * d2 - target)) {
      equation = `${d1} + ${d2}`;
    } else {
      equation = `${d1} * ${d2}`;
    }
  } else if (difficulty === GameDifficulty.MEDIUM) {
    // Three digits with two operations
    const d1 = shuffledDigits[0];
    const d2 = shuffledDigits[1];
    const d3 = shuffledDigits[2];
    const op1 = operators[Math.floor(Math.random() * 3)]; // Avoid division for simplicity
    const op2 = operators[Math.floor(Math.random() * 3)];

    equation = `${d1} ${op1} ${d2} ${op2} ${d3}`;
  } else {
    // Four digits with three operations
    const d1 = shuffledDigits[0];
    const d2 = shuffledDigits[1];
    const d3 = shuffledDigits[2];
    const d4 = shuffledDigits[3];
    const op1 = operators[Math.floor(Math.random() * operators.length)];
    const op2 = operators[Math.floor(Math.random() * operators.length)];
    const op3 = operators[Math.floor(Math.random() * operators.length)];

    equation = `${d1} ${op1} ${d2} ${op2} ${d3} ${op3} ${d4}`;
  }

  return equation;
}

// Word scramble generator
export const generateWordScramble = (difficulty: GameDifficulty) => {
  const easyWords = [
    "cat",
    "dog",
    "run",
    "jump",
    "play",
    "book",
    "tree",
    "fish",
    "bird",
    "cake",
  ];
  const mediumWords = [
    "player",
    "garden",
    "window",
    "jungle",
    "pencil",
    "orange",
    "puzzle",
    "market",
    "guitar",
    "planet",
  ];
  const hardWords = [
    "astronaut",
    "chemistry",
    "developer",
    "fantastic",
    "knowledge",
    "symphony",
    "technology",
    "adventure",
    "brilliance",
    "innovation",
  ];

  let words;
  switch (difficulty) {
    case GameDifficulty.EASY:
      words = easyWords;
      break;
    case GameDifficulty.MEDIUM:
      words = mediumWords;
      break;
    case GameDifficulty.HARD:
      words = hardWords;
      break;
    default:
      words = easyWords;
  }

  const word = words[Math.floor(Math.random() * words.length)];

  // Scramble the word
  const scrambled = word
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");

  return {
    question: scrambled,
    answer: word,
  };
};

// Generate game questions
export const generateGameQuestions = (
  gameType: GameType,
  difficulty: GameDifficulty,
  count: number = 10
) => {
  const questions = [];

  for (let i = 0; i < count; i++) {
    if (gameType === GameType.MATH_CHALLENGE) {
      questions.push(generateMathQuestion(difficulty));
    } else if (gameType === GameType.WORD_SCRAMBLE) {
      questions.push(generateWordScramble(difficulty));
    } else if (gameType === GameType.HECTOC_GAME) {
      questions.push(generateHectocQuestion(difficulty));
    }
  }

  return questions;
};

// Create a new game session
export const createGameSession = (
  type: GameType,
  difficulty: GameDifficulty
) => {
  const gameId = `game_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  return {
    id: gameId,
    type,
    difficulty,
    players: [],
    status: "waiting",
    questions: generateGameQuestions(type, difficulty),
    startTime: null,
    endTime: null,
    maxPlayers: 2,
  };
};

// Validate hectoc answer
export const validateHectocAnswer = (answer: string, question: any) => {
  // This is a simplified validation for demo purposes
  // In a real implementation, you'd need to parse the equation and check:
  // 1. If it only uses the provided digits
  // 2. If the result equals the target
  // 3. If the equation is mathematically valid

  try {
    // Remove all spaces from the answer
    const cleanAnswer = answer.replace(/\s+/g, "");

    // Extract all digits from the answer
    const usedDigits = cleanAnswer.match(/\d/g) || [];

    // Extract the target number and available digits from the question
    const availableDigits = question.validDigits;
    const target = question.validTarget;

    // Simple check: count occurrences of each digit
    const digitCounts: { [key: string]: number } = {};

    // Count available digits
    availableDigits.forEach((digit: number) => {
      digitCounts[digit] = (digitCounts[digit] || 0) + 1;
    });

    // Subtract used digits
    for (const digit of usedDigits) {
      if (!digitCounts[digit] || digitCounts[digit] <= 0) {
        return false; // Used a digit that wasn't available or used too many times
      }
      digitCounts[digit]--;
    }

    // For the demo, we'll simplify by accepting any syntactically valid answer
    // with the correct digits
    // In a real implementation, you'd evaluate the expression here

    return true;
  } catch (error) {
    return false;
  }
};
