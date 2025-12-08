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

export interface MemoInput {
  id?: string;
  fileId: string;
  fileName: string;
  language: string;
  translatedBase64: string;
}
