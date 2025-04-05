import Redis from "ioredis";

class RedisClient {
    private static instance: RedisClient;
    private client: Redis;
    private readonly PUZZLE_EXPIRY = 60 * 60 * 24 * 30; // 30 days in seconds

    private constructor() {
        this.client = new Redis(
            process.env.REDIS_URL || "redis://localhost:6379"
        );

        this.client.on("error", (err) => {
            console.error("Redis error:", err);
        });

        this.client.on("connect", () => {
            console.log("Connected to Redis");
        });
    }

    public static getInstance(): RedisClient {
        if (!RedisClient.instance) {
            RedisClient.instance = new RedisClient();
        }
        return RedisClient.instance;
    }

    /**
     * Store a hectoc puzzle in Redis
     */
    async storePuzzle(puzzle: any): Promise<void> {
        if (!puzzle || !puzzle.questionId) {
            throw new Error("Invalid puzzle object");
        }

        try {
            // Store complete puzzle
            await this.client.set(
                `puzzle:${puzzle.questionId}`,
                JSON.stringify(puzzle),
                "EX",
                this.PUZZLE_EXPIRY
            );

            // Store solution separately for quick lookup
            if (puzzle.solution) {
                await this.client.set(
                    `solution:${puzzle.questionId}`,
                    JSON.stringify({ solution: puzzle.solution }),
                    "EX",
                    this.PUZZLE_EXPIRY
                );
            }
        } catch (error) {
            console.error("Failed to store puzzle in Redis:", error);
            throw error;
        }
    }

    /**
     * Store multiple hectoc puzzles in Redis
     */
    async storePuzzles(puzzles: any[]): Promise<void> {
        if (!puzzles || !Array.isArray(puzzles)) {
            throw new Error("Invalid puzzles array");
        }

        try {
            const pipeline = this.client.pipeline();

            for (const puzzle of puzzles) {
                if (puzzle.questionId) {
                    // Store complete puzzle
                    pipeline.set(
                        `puzzle:${puzzle.questionId}`,
                        JSON.stringify(puzzle),
                        "EX",
                        this.PUZZLE_EXPIRY
                    );

                    // Store solution separately for quick lookup
                    if (puzzle.solution) {
                        pipeline.set(
                            `solution:${puzzle.questionId}`,
                            JSON.stringify({ solution: puzzle.solution }),
                            "EX",
                            this.PUZZLE_EXPIRY
                        );
                    }
                }
            }

            await pipeline.exec();
        } catch (error) {
            console.error("Failed to store puzzles in Redis:", error);
            throw error;
        }
    }

    /**
     * Get a complete puzzle by questionId
     */
    async getPuzzle(questionId: string): Promise<any | null> {
        try {
            const puzzleData = await this.client.get(`puzzle:${questionId}`);
            return puzzleData ? JSON.parse(puzzleData) : null;
        } catch (error) {
            console.error(
                `Failed to get puzzle ${questionId} from Redis:`,
                error
            );
            return null;
        }
    }

    /**
     * Get a solution by questionId
     */
    async getSolution(questionId: string): Promise<any | null> {
        try {
            const solutionData = await this.client.get(
                `solution:${questionId}`
            );
            if (solutionData) {
                return JSON.parse(solutionData);
            }

            // Fallback to getting the complete puzzle and extracting solution
            const puzzleData = await this.client.get(`puzzle:${questionId}`);
            if (puzzleData) {
                const puzzle = JSON.parse(puzzleData);
                return puzzle.solution ? { solution: puzzle.solution } : null;
            }

            return null;
        } catch (error) {
            console.error(
                `Failed to get solution for ${questionId} from Redis:`,
                error
            );
            return null;
        }
    }

    /**
     * Store a solution for a specific questionId
     */
    async storeSolution(questionId: string, solution: string): Promise<void> {
        try {
            await this.client.set(
                `solution:${questionId}`,
                JSON.stringify({ solution }),
                "EX",
                this.PUZZLE_EXPIRY
            );
        } catch (error) {
            console.error(
                `Failed to store solution for ${questionId} in Redis:`,
                error
            );
            throw error;
        }
    }
}

export default RedisClient;
