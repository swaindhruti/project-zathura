export function cleanJsonResponse(response: string): string {
    let cleaned = response.replace(/```json\s*/g, "").replace(/```\s*$/g, "");

    cleaned = cleaned.replace(/```\s*/g, "");

    cleaned = cleaned.trim();

    const startIndex = cleaned.indexOf("{");
    const endIndex = cleaned.lastIndexOf("}");

    if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
        cleaned = cleaned.substring(startIndex, endIndex + 1);
    }

    return cleaned;
}
