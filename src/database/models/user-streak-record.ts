/**
 * Represents a user's streak record, including the user's Slack ID, the current streak count, and the date of the last update.
 */
export interface UserStreakRecord {
  slackUserId: string;
  streak: number;
  lastUpdated: string;
}
