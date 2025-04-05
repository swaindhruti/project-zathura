import { v4 as uuidv4 } from "uuid";
import RedisClient from "@/lib/redisClient";
import prisma from "@/lib/prisma";
export class HectocService {
    private redisClient: RedisClient;

    constructor() {
        this.redisClient = RedisClient.getInstance();
    }

    async generatePuzzle(difficulty: string) {
        const allowedDifficulties = ["easy", "moderate", "difficult"] as const;
        const validatedDifficulty = allowedDifficulties.includes(
            difficulty as any
        )
            ? (difficulty as "easy" | "moderate" | "difficult")
            : "moderate";

        const puzzles = this.generateHectocPuzzles(
            5,
            validatedDifficulty,
            100,
            6
        );

        if (puzzles && puzzles.length > 0) {
            await this.redisClient.storePuzzles(puzzles);
        }

        return puzzles;
    }

    verifyHectocSolution(
        inputExpression: string,
        digits: number[],
        target = 100
    ) {
        let cleanExpression = inputExpression
            .replace(/×/g, "*")
            .replace(/÷/g, "/")
            .replace(/\s+/g, "")
            .replace(/\^/g, "**");

        const expressionDigits = cleanExpression.match(/\d/g);

        if (!expressionDigits) {
            return {
                isValid: false,
                reason: "No digits found in expression",
            };
        }

        const numericExpressionDigits = expressionDigits.map((d) =>
            parseInt(d)
        );
        const expectedDigits = Array.isArray(digits)
            ? digits
            : String(digits)
                  .split("")
                  .map((d) => parseInt(d));

        if (numericExpressionDigits.length !== expectedDigits.length) {
            return {
                isValid: false,
                reason: `Expression contains ${numericExpressionDigits.length} digits, but should contain ${expectedDigits.length}`,
            };
        }

        for (let i = 0; i < expectedDigits.length; i++) {
            if (numericExpressionDigits[i] !== expectedDigits[i]) {
                return {
                    isValid: false,
                    reason: `Digit at position ${i + 1} should be ${expectedDigits[i]}, but found ${numericExpressionDigits[i]}`,
                };
            }
        }

        let result;
        try {
            result = new Function(`return ${cleanExpression}`)();

            const isTargetMatch = Math.abs(result - target) < 0.000001;

            if (!isTargetMatch) {
                return {
                    isValid: false,
                    reason: `Expression evaluates to ${result}, not the target value of ${target}`,
                };
            }
        } catch (error) {
            return {
                isValid: false,
                reason: `Invalid expression: ${error}`,
            };
        }

        return {
            isValid: true,
            result: result,
        };
    }

    async getSolution(questionId?: string) {
        if (!questionId) return { error: "Question ID is required" };
        try {
            const cachedSolution =
                await this.redisClient.getSolution(questionId);
            if (cachedSolution) {
                return cachedSolution;
            } else {
                return { error: "Solution not found" };
            }
        } catch (error) {
            console.error("Error retrieving solution from Redis:", error);
        }
    }

    async getSolutionByQuestionId(questionId: string) {
        try {
            const solution = await this.redisClient.getSolution(questionId);
            if (solution) {
                return solution;
            }

            return { error: "Solution not found" };
        } catch (error) {
            console.error("Error retrieving solution by questionId:", error);
            return { error: "Failed to retrieve solution" };
        }
    }

    async createHectocGame(
        userId: string,
        options: {
            difficulty: string;
            target?: number;
            isDuel?: boolean;
        }
    ) {
        try {
            const { difficulty, target = 100, isDuel = false } = options;

            // Validate difficulty
            const allowedDifficulties = [
                "easy",
                "moderate",
                "difficult",
            ] as const;
            const validatedDifficulty = allowedDifficulties.includes(
                difficulty as any
            )
                ? (difficulty as "easy" | "moderate" | "difficult")
                : "moderate";

            // Generate puzzles for the game
            const puzzles = this.generateHectocPuzzles(
                5,
                validatedDifficulty,
                target,
                6
            );

            if (!puzzles || puzzles.length === 0) {
                throw new Error("Failed to generate puzzles for the game");
            }

            // Store the puzzles in Redis
            await this.redisClient.storePuzzles(puzzles);

            // Use Prisma client to create the game in the database

            // Create transaction to ensure game and participant are created together
            const game = await prisma.$transaction(async (tx) => {
                // Create the game
                const newGame = await tx.hectocGame.create({
                    data: {
                        difficulty: validatedDifficulty,
                        target,
                        isDuel,
                        status: isDuel ? "WAITING" : "IN_PROGRESS",
                        startedAt: isDuel ? null : new Date(),
                        questions: puzzles.map((p) => ({
                            qId: p.questionId,
                            expression: p.digits.join(""),
                            possibleSolution: p.solution,
                        })),
                    },
                });

                // Add the creator as a participant
                await tx.gameParticipant.create({
                    data: {
                        gameId: newGame.id,
                        userId: userId,
                        isCreator: true,
                        role: "PLAYER",
                    },
                });

                return newGame;
            });

            return {
                success: true,
                game: {
                    ...game,
                    questions: puzzles.map((p) => ({
                        questionId: p.questionId,
                        digits: p.digits,
                    })),
                },
            };
        } catch (error) {
            console.error("Error creating Hectoc game:", error);
            return {
                success: false,
                error: "Failed to create game",
            };
        }
    }

    async saveGameResults(data: {
        userId: string;
        gameId: string;
        results: Array<{
            qId: string;
            user_ans: string;
            isCorrect: boolean;
            timeToSolve: number;
        }>;
        totalScore: number;
        totalTime: number;
    }) {
        try {
            const { userId, gameId, results, totalScore, totalTime } = data;

            // First, get the participant entry to obtain the participantId
            const participant = await prisma.gameParticipant.findUnique({
                where: {
                    gameId_userId: {
                        gameId,
                        userId,
                    },
                },
            });

            if (!participant) {
                throw new Error("User is not a participant in this game");
            }

            // Check if result already exists for this participant and game
            const existingResult = await prisma.result.findUnique({
                where: {
                    participantId_gameId: {
                        participantId: participant.id,
                        gameId,
                    },
                },
            });

            if (existingResult) {
                // Update existing result
                const updatedResult = await prisma.result.update({
                    where: {
                        id: existingResult.id,
                    },
                    data: {
                        results,
                        totalScore,
                        totalTime,
                    },
                });
                return updatedResult;
            } else {
                // Create new result
                const newResult = await prisma.result.create({
                    data: {
                        participantId: participant.id,
                        gameId,
                        userId,
                        results,
                        totalScore,
                        totalTime,
                    },
                });

                const allParticipants = await prisma.gameParticipant.count({
                    where: { gameId },
                });

                const resultsSubmitted = await prisma.result.count({
                    where: { gameId },
                });

                if (allParticipants === resultsSubmitted) {
                    // Get highest score to determine winner
                    const allResults = await prisma.result.findMany({
                        where: { gameId },
                    });

                    let highestScore = -1;
                    let fastestTime = Number.MAX_SAFE_INTEGER;
                    let winnerId: string | null = null;

                    allResults.forEach((result) => {
                        if (
                            result.totalScore > highestScore ||
                            (result.totalScore === highestScore &&
                                result.totalTime < fastestTime)
                        ) {
                            highestScore = result.totalScore;
                            fastestTime = result.totalTime;
                            winnerId = result.id;
                        }
                    });

                    // Update winner status
                    if (winnerId) {
                        await prisma.result.update({
                            where: { id: winnerId },
                            data: { isWinner: true },
                        });

                        // Update user stats
                        const winnerResult = allResults.find(
                            (r) => r.id === winnerId
                        );
                        if (winnerResult) {
                            await prisma.user.update({
                                where: { id: winnerResult.userId },
                                data: {
                                    gamesWon: { increment: 1 },
                                },
                            });
                        }
                    }

                    // Update all participants' gamesPlayed count
                    for (const result of allResults) {
                        await prisma.user.update({
                            where: { id: result.userId },
                            data: {
                                gamesPlayed: { increment: 1 },
                            },
                        });
                    }

                    // Mark game as finished
                    await prisma.hectocGame.update({
                        where: { id: gameId },
                        data: {
                            status: "FINISHED",
                            endedAt: new Date(),
                        },
                    });
                }

                return newResult;
            }
        } catch (error) {
            console.error("Error saving game results:", error);
            throw new Error("Failed to save game results");
        }
    }

    generateHectocPuzzles(
        numPuzzles: number = 6,
        difficulty: "easy" | "moderate" | "difficult" = "moderate",
        target: number = 100,
        numDigits: number = 6
    ) {
        const puzzles = [];
        const allDigits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
        const usedDigitCombinations = new Set();

        let operations: string[];
        let patterns: ((digitSet: number[]) => string)[];

        switch (difficulty.toLowerCase()) {
            case "easy":
                operations = ["+", "-", "*"];
                patterns = [
                    (digitSet) =>
                        `${digitSet[0]}+${digitSet[1]}+${digitSet[2]}+${digitSet[3]}+${digitSet[4]}+${digitSet[5]}`,
                    (digitSet) =>
                        `${digitSet[0]}+${digitSet[1]}+${digitSet[2]}+${digitSet[3]}*${digitSet[4]}+${digitSet[5]}`,
                    (digitSet) =>
                        `${digitSet[0]}*${digitSet[1]}+${digitSet[2]}+${digitSet[3]}+${digitSet[4]}+${digitSet[5]}`,
                    (digitSet) =>
                        `(${digitSet[0]}+${digitSet[1]})*(${digitSet[2]}+${digitSet[3]})+${digitSet[4]}+${digitSet[5]}`,
                ];
                break;

            case "difficult":
                operations = ["+", "-", "*", "/"];
                patterns = [
                    (digitSet) =>
                        `(${digitSet[0]}+${digitSet[1]})*(${digitSet[2]}+${digitSet[3]})*(${digitSet[4]}+${digitSet[5]})`,
                    (digitSet) =>
                        `${digitSet[0]}*(${digitSet[1]}+${digitSet[2]})*(${digitSet[3]}-${digitSet[4]}/${digitSet[5]})`,
                    (digitSet) =>
                        `(${digitSet[0]}*${digitSet[1]})/(${digitSet[2]}+${digitSet[3]})*(${digitSet[4]}+${digitSet[5]})`,
                    (digitSet) =>
                        `${digitSet[0]}*((${digitSet[1]}+${digitSet[2]})*(${digitSet[3]}-${digitSet[4]}))+${digitSet[5]}`,
                    (digitSet) =>
                        `${digitSet[0]}*(${digitSet[1]}+(${digitSet[2]}*${digitSet[3]}/${digitSet[4]}))+${digitSet[5]}`,
                    (digitSet) =>
                        `(${digitSet[0]}*${digitSet[1]}+${digitSet[2]})*(${digitSet[3]}/${digitSet[4]}+${digitSet[5]})`,
                ];
                break;

            case "moderate":
            default:
                operations = ["+", "-", "*", "/"];
                patterns = [
                    (digitSet) =>
                        `${digitSet[0]}+${digitSet[1]}+${digitSet[2]}+${digitSet[3]}+${digitSet[4]}+${digitSet[5]}`,
                    (digitSet) =>
                        `(${digitSet[0]}+${digitSet[1]})*(${digitSet[2]}+${digitSet[3]})+${digitSet[4]}+${digitSet[5]}`,
                    (digitSet) =>
                        `(${digitSet[0]}+${digitSet[1]})*(${digitSet[2]}+${digitSet[3]}+${digitSet[4]}+${digitSet[5]})`,
                    (digitSet) =>
                        `(${digitSet[0]}+${digitSet[1]})*(${digitSet[2]}+${digitSet[3]})+(${digitSet[4]}+${digitSet[5]})`,
                    (digitSet) =>
                        `(${digitSet[0]}+${digitSet[1]}+${digitSet[2]})*(${digitSet[3]}+${digitSet[4]}+${digitSet[5]})`,
                    (digitSet) =>
                        `${digitSet[0]}*(${digitSet[1]}+${digitSet[2]}+${digitSet[3]}+${digitSet[4]})+${digitSet[5]}`,
                ];
                break;
        }

        function safeEval(expr: string): number | null {
            try {
                const result = Function("return " + expr)();
                return !isNaN(result) &&
                    isFinite(result) &&
                    result === Math.round(result * 1000000) / 1000000
                    ? result
                    : null;
            } catch (e) {
                return null;
            }
        }

        function getComplexityScore(expr: string): number {
            const weights: { [key: string]: number } = {
                "+": 1,
                "-": 1.5,
                "*": 2,
                "/": 2.5,
            };

            let score = 0;
            for (const op of ["+", "-", "*", "/"]) {
                const count = (expr.match(new RegExp("\\" + op, "g")) || [])
                    .length;
                score += count * weights[op];
            }

            const parenCount = (expr.match(/\(/g) || []).length;
            score += parenCount * 1.5;

            let maxDepth = 0;
            let currentDepth = 0;
            for (let i = 0; i < expr.length; i++) {
                if (expr[i] === "(") {
                    currentDepth++;
                    maxDepth = Math.max(maxDepth, currentDepth);
                } else if (expr[i] === ")") {
                    currentDepth--;
                }
            }
            score += maxDepth * 3;

            return score;
        }

        function getCombinations(arr: number[], size: number): number[][] {
            if (size === 1) return arr.map((d) => [d]);

            const result = [];
            for (let i = 0; i < arr.length; i++) {
                const current = arr[i];
                const remaining = arr.slice(i + 1);
                const combinationsOfRemaining = getCombinations(
                    remaining,
                    size - 1
                );

                for (const combo of combinationsOfRemaining) {
                    result.push([current, ...combo]);
                }
            }
            return result;
        }

        function getPermutations(arr: number[]): number[][] {
            if (arr.length === 1) return [arr];

            const result = [];
            for (let i = 0; i < arr.length; i++) {
                const current = arr[i];
                const remaining = [...arr.slice(0, i), ...arr.slice(i + 1)];
                const permutationsOfRemaining = getPermutations(remaining);

                for (const perm of permutationsOfRemaining) {
                    result.push([current, ...perm]);
                }
            }
            return result;
        }

        const digitCombinations = getCombinations(allDigits, numDigits);

        for (const combination of digitCombinations) {
            if (puzzles.length >= numPuzzles) break;

            const combinationKey = combination.sort().join(",");
            if (usedDigitCombinations.has(combinationKey)) continue;

            const permutations = getPermutations(combination);

            for (const digitSet of permutations) {
                if (puzzles.length >= numPuzzles) break;
                if (usedDigitCombinations.has(combinationKey)) break;

                for (const patternFn of patterns) {
                    const basePattern = patternFn(digitSet);

                    const opPositions: number[] = [];
                    for (let pos = 0; pos < basePattern.length; pos++) {
                        if (
                            ["+", "-", "*", "/"].includes(basePattern[pos]) &&
                            basePattern[pos - 1] !== "(" &&
                            basePattern[pos + 1] !== ")"
                        ) {
                            opPositions.push(pos);
                        }
                    }

                    const opCombinations: string[] = [];
                    function generateOpCombinations(
                        positions: number[],
                        index: number,
                        current: string
                    ) {
                        if (index === positions.length) {
                            opCombinations.push(current);
                            return;
                        }

                        for (const op of operations) {
                            const nextCurrent =
                                current.substring(0, positions[index]) +
                                op +
                                current.substring(positions[index] + 1);
                            generateOpCombinations(
                                positions,
                                index + 1,
                                nextCurrent
                            );
                        }
                    }

                    generateOpCombinations(opPositions, 0, basePattern);

                    for (const expr of opCombinations) {
                        if (puzzles.length >= numPuzzles) break;

                        const value = safeEval(expr);
                        if (value === target) {
                            puzzles.push({
                                questionId: uuidv4(),
                                solution: expr,
                                digits: digitSet.slice(),
                            });

                            usedDigitCombinations.add(combinationKey);
                            break;
                        }
                    }

                    if (
                        usedDigitCombinations.has(combinationKey) ||
                        puzzles.length >= numPuzzles
                    )
                        break;
                }
            }
        }

        const sortedPuzzles = [...puzzles];
        if (difficulty === "easy") {
            sortedPuzzles.sort(
                (a, b) =>
                    getComplexityScore(a.solution) -
                    getComplexityScore(b.solution)
            );
        } else if (difficulty === "difficult") {
            sortedPuzzles.sort(
                (a, b) =>
                    getComplexityScore(b.solution) -
                    getComplexityScore(a.solution)
            );
        }

        return sortedPuzzles;
    }
}
