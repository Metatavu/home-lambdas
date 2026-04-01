import type { UserStreakRecord } from "src/database/models/user-streak-record";
import { securityQuizApiService } from "src/database/services";
import type { QuizAttempt } from "src/generated/homeLambdasModels/model/quizAttempt";
import type { QuizAttemptResponse } from "src/generated/homeLambdasModels/model/quizAttemptResponse";

/**
 * Utility functions for managing user streaks in the security quiz context.
 */
const getYesterday = (date: string): string => {
  const d = new Date(date);
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
};

/**
 * Processes a quiz attempt by recording it, calculating the user's new streak based on their previous attempts, and updating the streak record accordingly.
 * @param attempt - The quiz attempt to process
 * @returns An object containing whether the attempt was successful and the user's new streak count
 */
export const processQuizAttempt = async (attempt: QuizAttempt): Promise<QuizAttemptResponse> => {
  const { slackUserId, answeredCorrectly, date } = attempt;

  // store attempt
  await securityQuizApiService.createQuizAttempt(attempt);

  const currentStreak = await securityQuizApiService.getUserStreak(slackUserId);

  const yesterday = getYesterday(date);

  const yesterdayAttempts = await securityQuizApiService.queryAttemptsByUser(
    slackUserId,
    yesterday,
    yesterday
  );

  let newStreak = 0;

  if (!answeredCorrectly) {
    newStreak = 0;
  } else {
    const hadYesterdaySuccess = yesterdayAttempts.some((attempt) => attempt.answeredCorrectly);
    if (hadYesterdaySuccess) {
      newStreak = currentStreak + 1;
    } else {
      newStreak = 1;
    }
  }

  const record: UserStreakRecord = {
    slack_user_id: slackUserId,
    streak: newStreak,
    last_updated: date
  };

  await securityQuizApiService.putUserStreakRecord(record);

  return {
    success: answeredCorrectly,
    streak: newStreak
  };
};

/**
 * Calculates the difficulty based on the user's current streak.
 * @param streak - the number of consecutive correct days
 * @returns difficulty level as a string: 'easy', 'medium', or 'hard'
 */
export const calculateDifficulty = (streak: number): "easy" | "medium" | "hard" => {
  if (streak <= 2) {
    return "easy";
  } else if (streak <= 5) {
    return "medium";
  } else {
    return "hard";
  }
};
