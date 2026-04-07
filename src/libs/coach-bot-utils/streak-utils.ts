import type { UserStreakRecord } from "src/database/models/user-streak-record";
import { coachBotApiService } from "src/database/services";
import type { CoachAnswer } from "src/generated/homeLambdasModels/model/coachAnswer";
import type { CoachAnswerResponse } from "src/generated/homeLambdasModels/model/coachAnswerResponse";

/**
 * Utility functions for managing user streaks in the coach bot context.
 */
const getYesterday = (date: string): string => {
  const d = new Date(date);
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
};

/**
 * Processes a coach bot answer by recording it, calculating the user's new streak based on their previous attempts, and updating the streak record accordingly.
 * @param answer - The coach bot answer to process
 * @returns An object containing whether the answer was successful and the user's new streak count
 */
export const processCoachBotAnswer = async (answer: CoachAnswer): Promise<CoachAnswerResponse> => {
  const { slackUserId, answeredCorrectly, date } = answer;

  try {
    await coachBotApiService.createCoachBotAnswer(answer);
  } catch (error: any) {
    if (error.name === "ConditionalCheckFailedException") {
      throw new DuplicateAnswerError();
    }
    throw error;
  }

  const currentStreak = await coachBotApiService.getUserStreak(slackUserId);

  const yesterday = getYesterday(date);

  const yesterdayAnswers = await coachBotApiService.queryAnswersByUser(
    slackUserId,
    yesterday,
    yesterday
  );

  let newStreak = 0;

  if (!answeredCorrectly) {
    newStreak = 0;
  } else {
    const hadYesterdaySuccess = yesterdayAnswers.some((a) => a.answeredCorrectly);
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

  await coachBotApiService.putUserStreakRecord(record);

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

/**
 * Custom error class for handling duplicate answer attempts.
 */
export class DuplicateAnswerError extends Error {
  constructor(message = "User has already answered today's question") {
    super(message);
    this.name = "DuplicateAnswerError";
  }
}
