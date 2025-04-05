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
      return next(
        console.log("You are not logged in. Please log in to get access", 401)
      );
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      id: string;
    };

    // Check if user still exists
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        role: true,
      },
    });

    if (!user) {
      return next(
        console.log("The user belonging to this token no longer exists", 401)
      );
    }

    // Grant access to protected route
    req.user = {
      id: user.id,
      role: user.role,
    };

    next();
  } catch (error) {
    next(console.log("Not authorized, token failed", 401));
  }
};

export const restrictTo = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(console.log("User not found", 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        console.log("You do not have permission to perform this action", 403)
      );
    }

    next();
  };
};
