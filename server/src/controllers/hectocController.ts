import { Request, Response, NextFunction } from "express";
import { HectocService } from "@/services/hectocService";

const hectocService = new HectocService();

export const getPuzzle = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { difficulty } = req.query;

        const puzzle = await hectocService.generatePuzzle(difficulty as string);

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
        const { digits } = req.body;
        if (digits.length !== 6) {
            return res.status(400).json({
                valid: false,
                reason: "Invalid request. Please provide 6 digits.",
            });
        }
        const solution = await hectocService.getSolution(digits);
        res.status(200).json(solution);
    } catch (error) {
        console.error("Error in getSolution:", error);
        res.status(500).json({
            valid: false,
            reason: "An error occurred while processing your request.",
        });
    }
};
