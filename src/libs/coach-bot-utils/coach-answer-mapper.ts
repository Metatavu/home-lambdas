import { CoachAnswer } from "src/generated/homeLambdasModels/model/coachAnswer";

/**
 * Roles accepted from external quiz-related inputs (for example Keycloak attributes).
 */
const allowedQuizRoles = ["devops", "developer", "management"] as const;

type QuizRole = (typeof allowedQuizRoles)[number];

type QuizDifficulty = "easy" | "medium" | "hard";

const isQuizRole = (value: string): value is QuizRole => {
  return allowedQuizRoles.includes(value as QuizRole);
};

const isQuizDifficulty = (value: string): value is QuizDifficulty => {
  return ["easy", "medium", "hard"].includes(value);
};

/**
 * Normalizes an optional raw role value to a known quiz role.
 *
 * This function acts as a boundary guard for untrusted string values coming
 * from external systems. Unknown or missing values are mapped to a safe fallback.
 *
 * @param role Raw role string from external input
 * @param fallback Role returned when input is missing or invalid (defaults to "developer")
 * @returns A validated internal quiz role
 */
export const normalizeQuizRole = (
  role: string | undefined,
  fallback: QuizRole = "developer"
): QuizRole => {
  if (!role) {
    return fallback;
  }

  return isQuizRole(role) ? role : fallback;
};

/**
 * Normalizes a raw difficulty string to a known quiz difficulty.
 *
 * @param difficulty Raw difficulty value from external input
 * @param fallback Difficulty returned when input is invalid (defaults to "medium")
 * @returns A validated internal quiz difficulty
 */
export const normalizeDifficulty = (
  difficulty: string | undefined,
  fallback: QuizDifficulty = "medium"
): QuizDifficulty => {
  if (!difficulty) {
    return fallback;
  }

  return isQuizDifficulty(difficulty) ? difficulty : fallback;
};

/**
 * Converts a validated internal quiz role to the corresponding enum value.
 *
 * @param role Valid internal quiz role
 * @returns Role enum value
 */
export const roleToEnum = (role: QuizRole): CoachAnswer.RoleEnum => {
  switch (role) {
    case "devops":
      return CoachAnswer.RoleEnum.Devops;
    case "developer":
      return CoachAnswer.RoleEnum.Developer;
    case "management":
      return CoachAnswer.RoleEnum.Management;
  }
};

/**
 * Converts internal difficulty values to the corresponding enum value.
 *
 * @param difficulty Difficulty value
 * @returns Difficulty enum value
 */
export const difficultyToEnum = (difficulty: QuizDifficulty): CoachAnswer.DifficultyEnum => {
  switch (difficulty) {
    case "easy":
      return CoachAnswer.DifficultyEnum.Easy;
    case "medium":
      return CoachAnswer.DifficultyEnum.Medium;
    case "hard":
      return CoachAnswer.DifficultyEnum.Hard;
  }
};

/**
 * Creates a normalized CoachAnswer from raw request body data.
 *
 * This factory method handles all validation and enum conversion in one place,
 * normalizing untrusted input to safe enum values.
 *
 * @param body Raw request body object
 * @returns A fully validated and normalized CoachAnswer instance
 */
export const createCoachBotAnswer = (body: any): CoachAnswer => {
  const attempt = new CoachAnswer();
  attempt.slackUserId = body.slack_user_id;
  attempt.answeredCorrectly = body.answered_correctly;
  attempt.role = roleToEnum(normalizeQuizRole(body.role as string));
  attempt.topic = body.topic;
  attempt.topicKey = body.topic_key;
  attempt.difficulty = difficultyToEnum(normalizeDifficulty(body.difficulty as string));
  attempt.date = body.date;
  return attempt;
};
