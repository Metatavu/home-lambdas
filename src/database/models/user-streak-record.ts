/**
 * Represents a user's streak record, including the user's Slack ID, the current streak count, and the date of the last update.
 */
export interface UserStreakRecord {
  slack_user_id: string;
  streak: number;
  last_updated: string;
}
