import { getGeminiResponse } from "@/lib/getGeminiResponse";
import { cleanJsonResponse } from "@/utils/cleanJson";

export class HectocService {
    async generateGeminiPuzzle(difficulty: string) {
        const response = await getGeminiResponse(difficulty);
        console.log("Gemini response:", response);
        const json = JSON.parse(cleanJsonResponse(response));
        return json;
    }

    async generatePuzzle(difficulty: string) {
        const puzzle = this.generateGeminiPuzzle(difficulty);
        return puzzle;
    }

    verifyHectocSolution(
        inputExpression: string,
        digits: number[],
        target = 100
    ) {
        let cleanExpression = inputExpression
            .replace(/×/g, "*") // Replace × with *
            .replace(/÷/g, "/") // Replace ÷ with /
            .replace(/\s+/g, "") // Remove all whitespace
            .replace(/\^/g, "**"); // Replace ^ with ** for JavaScript exponentiation

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

    async getSolution(digits: string[]) {
        const digitsString = digits.join(",");
        const response = await getGeminiResponse("100", true, digitsString);
        // console.log(response);
        // return cleanJsonResponse(response);
        const json = JSON.parse(cleanJsonResponse(response));
        return json;
    }
}
