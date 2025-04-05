import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Extend Request interface to include user property
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                role: string;
            };
        }
    }
}

export const protect = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        // Get token from authorization header or cookies
        let token;

        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith("Bearer")
        ) {
            token = req.headers.authorization.split(" ")[1];
        } else if (req.cookies.jwt) {
            token = req.cookies.jwt;
        }

        if (!token) {
            return res.status(401).json({
                status: "fail",
                message: "You are not logged in. Please log in to get access",
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
            id: string;
        };

        const user = await prisma.user.findUnique({
            where: { id: decoded.id },
            select: {
                id: true,
                role: true,
            },
        });
        if (!user) {
            return res.status(401).json({
                status: "fail",
                message: "The user belonging to this token no longer exists",
            });
        }

        // Grant access to protected route
        req.user = {
            id: user.id,
            role: user.role,
        };

        next();
    } catch (error) {
        console.log(error);
        res.status(401).json({
            status: "fail",
            message: "Not authorized, token failed",
        });
    }
};

export const restrictTo = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({
                status: "fail",
                message: "User not found",
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                status: "fail",
                message: "You do not have permission to perform this action",
            });
        }

        next();
    };
};

export function errorHandler(err: any, req: any, res: any, next: any) {
    res.status(500).json({ message: err.message });
}
