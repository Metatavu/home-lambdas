import pdf from "pdf-parse";
import { responseHeaders } from "src/libs/http/headers";
/**
 * Converts a string into a URL-safe slug segment.
 *
 * @param value Title value
 */
export const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replaceAll(/[^a-z0-9\s-]/g, "")
    .replaceAll(/\s+/g, "-");

/**
 * Makes sure that uploaded file is PDF
 */
export const isPdfFile = (contentType: string | undefined, key: string): boolean => {
  return contentType === "application/pdf" || key.toLowerCase().endsWith(".pdf");
};

/**
 * Creates a standardized HTTP response object.
 * @param statusCode HTTP status code for the response
 * @param payload Response body payload, will be JSON-stringified
 * @returns An object representing the HTTP response, with appropriate headers and body
 */
export const createResponse = (statusCode: number, payload: unknown) => ({
  statusCode,
  headers: responseHeaders,
  body: JSON.stringify(payload)
});

/**
 * Extracts text from PDF bytes and normalizes it into markdown.
 *
 * @param bytes - PDF file content as bytes.
 * @returns Normalized markdown-like text content.
 */
export const extractMarkdownFromPdf = async (bytes: Uint8Array): Promise<string> => {
  try {
    const parsed = await pdf(Buffer.from(bytes));

    return (parsed.text || "")
      .split("\n")
      .map((line: string) => line.trim())
      .filter(Boolean)
      .join("\n\n");
  } catch (error) {
    console.error("PDF parsing failed:", error);
    throw error;
  }
};
