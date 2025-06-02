/**
 * Interface for general file properties
 */
export interface File {
  id?: string;
  name?: string;
  mimeType?: string;
}

/**
 * Interface for PDF files
 */
export interface PdfFile {
  id?: string;
  name: string;
  content: Buffer;
}