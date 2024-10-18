/**
 * Enum for possible statuses of a software.
 */
export enum Status {
  PENDING = "PENDING",
  UNDER_REVIEW = "UNDER_REVIEW",
  ACCEPTED = "ACCEPTED",
  DEPRECATED = "DEPRECATED",
  DECLINED = "DECLINED"
}

/**
 * Interface for a software.
 */
export interface SoftwareModel {
  id?: string;
  name: string;
  description: string;
  review: string;
  url: string;
  image: string;
  status?: Status;
  createdBy: string;
  createdAt?: string;
  lastUpdatedBy?: string;
  lastUpdatedAt?: string;
  recommend?: string[];
  tags?: string[];
  users?: string[];
}
