interface OnCallEntry {
  Year: number;
  Week: number;
  Username: string;
  Email?: string | null;
  Paid?: boolean;
}

export interface OnCallImportEntry {
  Week: number;
  Person: string;
}

export type OnCallImportError = {
  entry?: OnCallImportEntry;
  error: string | unknown;
};

export default OnCallEntry;
