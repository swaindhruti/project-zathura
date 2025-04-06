import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getLeaderboard = async (req: Request, res: Response) => {
  try {
    const { query } = req.query;

    // Set default limit to null (fetch all) unless query is 'top'
    const limit = query === "top" ? 3 : undefined;

    const leaderboardData = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        rating: true,
        // Add any other fields you want to include
      },
      orderBy: {
        rating: "desc", // Sort by rating from high to low
      },
      take: limit, // If limit is undefined, returns all records
    });

    // Return appropriate message based on the query
    const message =
      query === "top"
        ? "Top 3 users fetched successfully"
        : "All users fetched successfully";

    return res.status(200).json({
      success: true,
      message,
      data: leaderboardData,
      count: leaderboardData.length,
    });
  } catch (error: any) {
    console.error("Error fetching leaderboard data:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch leaderboard data",
      error: error.message,
    });
  }
};
