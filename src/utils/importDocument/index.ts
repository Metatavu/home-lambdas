import pdf from "pdf-parse";

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
