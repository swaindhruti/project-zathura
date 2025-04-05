import { v4 as uuidv4 } from "uuid";
import RedisClient from "@/lib/redisClient";

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
