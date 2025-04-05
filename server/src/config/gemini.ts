import { HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

export const generationConfig = {
    temperature: 0.1,
    topP: 0.9,
    topK: 40,
    maxOutputTokens: 1024,
    responseMimeType: "text/plain",
};

export const safetySettings = [
    {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
];
export const generateSystemInstruction = (
    target: string,
    requestedDifficulty?: string
) => {
    return `Create a ${requestedDifficulty} level Hectoc puzzle. 
Generate 6 digits (1-9) that can be combined using +, -, *, /, ^ and parentheses 
to reach exactly 100. 

The digits must be used in the order provided without rearrangement, and each digit must be used exactly once.
Validate that at least one solution exists for your selected digits.

Rules:
- Operations allowed: addition (+), subtraction (-), multiplication (*), division (/), and parentheses
- No digit can be combined with another to form multi-digit numbers
- All 6 digits must be used exactly once in the given order
- The final expression must equal exactly 100
- In the sampleSolutions check for the order of operations and parentheses placement
- Provide multiple sample solutions if possible 

Return the result in JSON format with fields:
{
  "digits": [number[]],
  "sampleSolutions": [string[]],
  "difficulty": "easy"|"medium"|"hard"|"expert"
}

For difficulty guidelines:
- easy: Solutions should be intuitive with basic operations
- medium: May require some experimentation but multiple solutions exist
- hard: Requires careful thinking about operation order and parentheses
- expert: Very challenging, may involve complex combinations of operations`;
};

export const solutionInstruction = (digitsString: string) => {
    return `
Your task is to generate valid solutions for a given Hectoc puzzle.

Input: You will be provided with 6 digits ${digitsString} Do operations to make it a 100.

Rules for valid Hectoc solutions:
1. Use all 6 digits exactly once and in the given order
2. Insert mathematical operations (+, -, *, /) and parentheses to reach the target value
3. You cannot combine digits to form multi-digit numbers (e.g., 1 and 2 cannot become 12)
4. Allowed operations: addition (+), subtraction (-), multiplication (*), division (/), exponentiation (^), and parentheses
5. The final expression must evaluate to exactly the target value
6. Only Provide solutions if the taget value is 100 if not then skip the solution
7. The expression should be formatted with spaces between elements for readability

Process:
1. Analyze the given digits and target value
2. Create multiple valid solutions using different combinations of operations
3. Verify each solution by evaluating the expression
4. Ensure all solutions follow the Hectoc rules

Response format:
Return a JSON object with the following structure:
{
  "puzzle": {
    "digits": [<the 6 input digits>],
    "target": <target value>
  },
  "solutions": [
    {
      "expression": "<solution expression with spaces between elements for readability>",
      "operations": "<brief description of operations used>"
    },
    ...
  ],
  "solutionCount": <number of solutions found>,
  "difficulty": "<estimated difficulty level based on solution complexity>"
}

Difficulty estimation guidelines:
- easy: Solutions use basic operations with minimal parentheses
- medium: Requires some combination of operations and parentheses
- hard: Requires careful planning of operation order and nested parentheses
- expert: Uses complex combinations of operations, possibly requiring division or exponentiation

Example:
For digits [1,2,3,4,5,6] and target 100, a valid solution would be:
"1 + (2 + 3 + 4) × (5 + 6) = 100"
`;
};
