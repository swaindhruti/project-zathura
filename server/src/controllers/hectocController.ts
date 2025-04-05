import { Request, Response, NextFunction } from "express";
import { HectocService } from "@/services/hectocService";
import prisma from "@/lib/prisma";

const hectocService = new HectocService();

export const getPuzzle = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return {
                valid: false,
                reason: "Please Login to continue",
            };
        }
        const { difficulty } = req.body;

        const puzzle = await hectocService.createHectocGame(userId, {
            difficulty,
        });

        res.status(200).json({
            puzzle,
        });
    } catch (error) {
        next(error);
    }
};

export const verifyPuzzleSolution = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        // const userId = req.user?.id;
        // if (!userId) {
        //     return res.status(401).json({
        //         valid: false,
        //         reason: "Please Login to continue",
        //     });
        // }
        const { digits, solution, target = 100 } = req.body;

        if (digits.length !== 6) {
            return res.status(400).json({
                valid: false,
                reason: "Invalid request. Please provide 6 digits.",
            });
        }

        if (!solution) {
            return res.status(400).json({
                valid: false,
                reason: "Invalid request. Please provide a solution.",
            });
        }

        const verification = hectocService.verifyHectocSolution(
            solution,
            digits,
            target
        );

        res.status(200).json(verification);
    } catch (error) {
        next(error);
    }
};

export const getSolution = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                valid: false,
                reason: "Please Login to continue",
            });
        }
        const { questionId } = req.body;
        if (!questionId) {
            return res.status(400).json({
                valid: false,
                reason: "Invalid request. Please provide a question ID.",
            });
        }
        const solution = await hectocService.getSolution(questionId);
        res.status(200).json(solution);
    } catch (error) {
        console.error("Error in getSolution:", error);
        res.status(500).json({
            valid: false,
            reason: "An error occurred while processing your request.",
        });
    }
};

export const saveScores = async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
        return res.status(401).json({
            valid: false,
            reason: "Please Login to continue",
        });
    }

    try {
        const { gameId, results, totalScore, totalTime } = req.body;

        if (!gameId) {
            return res.status(400).json({
                valid: false,
                reason: "Invalid request. Game ID is required.",
            });
        }

        if (!results || !Array.isArray(results)) {
            return res.status(400).json({
                valid: false,
                reason: "Invalid request. Results data is required.",
            });
        }

        const savedResult = await hectocService.saveGameResults({
            userId,
            gameId,
            results,
            totalScore: totalScore || 0,
            totalTime: totalTime || 0,
        });

        res.status(200).json({
            success: true,
            result: savedResult,
        });
    } catch (error) {
        console.error("Error in saveScores:", error);
        res.status(500).json({
            valid: false,
            reason: "An error occurred while saving scores.",
        });
    }
};

export const getGameResults = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                reason: "Please Login to continue",
            });
        }

        const results = await prisma.result.findMany({
            where: {
                userId: userId,
            },
            include: {
                game: {
                    select: {
                        difficulty: true,
                        target: true,
                        isDuel: true,
                        status: true,
                        startedAt: true,
                        endedAt: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        res.status(200).json({
            success: true,
            results,
        });
    } catch (error) {
        console.error("Error retrieving game results:", error);
        res.status(500).json({
            success: false,
            reason: "Failed to retrieve game results",
        });
    }
};
