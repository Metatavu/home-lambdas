export interface OnCallEntry {
  Year: number;
  Week: number;
  Username: string;
  Paid?: boolean;
}

export interface OnCallImportEntry {
  Week: number;
  Person: string;
}

export type OnCallImportError = {
  entry: OnCallImportEntry;
  error: string | unknown;
};