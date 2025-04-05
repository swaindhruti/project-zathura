import { GoogleGenerativeAI } from "@google/generative-ai";

import { env } from "@/config";
import {
    generateSystemInstruction,
    generationConfig,
    safetySettings,
    solutionInstruction,
} from "@/config/gemini";

const genAI = new GoogleGenerativeAI(env.geminiKey!);

async function getGeminiResponse(
    requestedDifficulty: string,
    generateSolutions: boolean = false,
    digitsString: string = ""
) {
    try {
        let prompt = "";

        const parts = [{ text: prompt }];
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            systemInstruction: generateSolutions
                ? solutionInstruction(digitsString)
                : generateSystemInstruction("100", requestedDifficulty),
            generationConfig,
            safetySettings,
        });

        let attempts = 0;
        const maxAttempts = 6;
        let result: any = null;

        while (attempts < maxAttempts) {
            try {
                result = await model.generateContent({
                    contents: [{ role: "user", parts: parts || [] }],
                    safetySettings,
                    generationConfig,
                });

                if (result.response) {
                    break;
                }
            } catch (error: any) {
                console.log(
                    `Attempt ${attempts + 1} failed:`,
                    error.message || error
                );

                if (error.status === 429) {
                    const retryAfter = Math.pow(2, attempts) * 2000;
                    console.log(`Retrying in ${retryAfter / 1000} seconds...`);
                    await new Promise((resolve) =>
                        setTimeout(resolve, retryAfter)
                    );
                } else {
                    throw error;
                }
            }

            attempts++;
        }

        if (!result || !result.response) {
            throw new Error(
                "Max attempts exceeded or no response from the server"
            );
        }
        return result.response.text();
    } catch (e: any) {
        console.error("Gemini API error:", e);
        const errorDetails = e.toString();
        throw new Error(`Failed to get AI response: ${errorDetails}`);
    }
}

export { getGeminiResponse };
