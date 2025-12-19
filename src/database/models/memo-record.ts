/**
 * Dynamodb model for storing a memo file.
 */
export interface MemoRecord {
  id: string;
  PK: string;
  SK: string;
  fileId: string;
  fileName: string;
  language: string;
  translatedBase64: string;
}

/**
 * Input type for creating a memo record.
 */
export interface MemoInput {
  id?: string;
  fileId: string;
  fileName: string;
  language: string;
  translatedBase64: string;
}
