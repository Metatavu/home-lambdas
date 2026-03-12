import type { SoftwareStatus } from "src/generated/homeLambdasModels/model/softwareStatus";
/**
 * Build from SoftwareStatus instead of using enum to avoid mismatch.
 */

export type Status = SoftwareStatus;

/**
 * Interface for a software.
 */
export interface SoftwareModel {
  id?: string;
  name: string;
  description: string;
  review?: string;
  url: string;
  image: string;
  status?: Status;
  createdBy: string;
  createdAt: string;
  lastUpdatedBy?: string;
  lastUpdatedAt: string;
  recommend?: string[];
  tags?: string[];
  users?: string[];
}
