import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

// Validation schemas
const registerSchema = z.object({
  email: z.string().email("Invalid email format"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string(),
});

// Generate tokens
const generateTokens = (userId: string) => {
  const accessToken = jwt.sign(
    { id: userId },
    process.env.JWT_SECRET as string,
    {
      expiresIn: process.env.JWT_EXPIRES_IN
        ? parseInt(process.env.JWT_EXPIRES_IN)
        : undefined,
    }
  );

  const refreshToken = jwt.sign(
    { id: userId },
    process.env.JWT_SECRET as string,
    { expiresIn: "30d" }
  );

  return { accessToken, refreshToken };
};

// Set JWT cookie
const sendTokenCookie = (res: Response, token: string) => {
  const cookieOptions = {
    expires: new Date(
      Date.now() +
        parseInt(process.env.JWT_COOKIE_EXPIRES_IN as string) *
          24 *
          60 *
          60 *
          1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };

  res.cookie("jwt", token, cookieOptions);
};

// Controllers
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Validate input
    const validatedData = registerSchema.parse(req.body);

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: validatedData.email },
          { username: validatedData.username },
        ],
      },
    });

    if (existingUser) {
      return next(
        console.log("User with this email or username already exists", 400)
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 12);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        email: validatedData.email,
        username: validatedData.username,
        password: hashedPassword,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      },
    });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(newUser.id);

    // Update refresh token in database
    await prisma.user.update({
      where: { id: newUser.id },
      data: { refreshToken },
    });

    // Set JWT cookie
    sendTokenCookie(res, accessToken);

    // Send response
    res.status(201).json({
      status: "success",
      token: accessToken,
      data: {
        user: newUser,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Validate input
    const validatedData = loginSchema.parse(req.body);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (!user) {
      return next(console.log("Invalid email or password", 401));
    }

    // Check password
    const isPasswordCorrect = await bcrypt.compare(
      validatedData.password,
      user.password
    );

    if (!isPasswordCorrect) {
      return next(console.log("Invalid email or password", 401));
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id);

    // Update refresh token in database
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    // Set JWT cookie
    sendTokenCookie(res, accessToken);

    // Send response
    res.status(200).json({
      status: "success",
      token: accessToken,
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get user from request
    const userId = req.user?.id;

    if (userId) {
      // Clear refresh token in database
      await prisma.user.update({
        where: { id: userId },
        data: { refreshToken: null },
      });
    }

    // Clear JWT cookie
    res.clearCookie("jwt");

    // Send response
    res.status(200).json({
      status: "success",
      message: "Logged out successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get refresh token from cookies or authorization header
    const refreshToken =
      req.cookies.jwt ||
      (req.headers.authorization?.startsWith("Bearer") &&
        req.headers.authorization.split(" ")[1]);

    if (!refreshToken) {
      return next(
        console.log("No refresh token found, please login again", 401)
      );
    }

    // Verify token
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_SECRET as string
    ) as { id: string };

    // Find user with that refresh token
    const user = await prisma.user.findFirst({
      where: {
        id: decoded.id,
        refreshToken,
      },
    });

    if (!user) {
      return next(console.log("Invalid refresh token", 401));
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(
      user.id
    );

    // Update refresh token in database
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: newRefreshToken },
    });

    // Set JWT cookie
    sendTokenCookie(res, accessToken);

    // Send response
    res.status(200).json({
      status: "success",
      token: accessToken,
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // User is already available from auth middleware
    const user = await prisma.user.findUnique({
      where: { id: req.user?.id },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      return next(console.log("User not found", 404));
    }

    res.status(200).json({
      status: "success",
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};
