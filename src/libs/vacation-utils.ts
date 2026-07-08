import { DateTime } from "luxon";
import type { VacationRequestStatus } from "src/generated/homeLambdasModels/model/vacationRequestStatus";
import { CreateKeycloakApiService } from "src/services/keycloak-api-service";
import { CreateSeveraApiService } from "src/services/severa-api-service";

/**TODO: This is not used, should it be removed?
 *
 * Fetches the contracted work week for a given user from Severa.
 *
 * @param userId - Employee ID to get contracted week for.
 */
export const getContractedWeek = async (userId: string): Promise<number[]> => {
  const severaApi = CreateSeveraApiService();
  const today = DateTime.now();

  // Check over past 5 weeks to find a week without holidays
  try {
    for (let weeksBack = 0; weeksBack < 5; weeksBack++) {
      const weekStart = today.minus({ weeks: weeksBack }).startOf("week");
      const weekEnd = weekStart.plus({ days: 6 });

      const workWeekData = await severaApi.getWorkWeek(
        userId,
        weekStart.toISODate(),
        weekEnd.toISODate()
      );

      const hasHoliday = workWeekData.some((day) => day.isHoliday);
      if (hasHoliday) continue;

      // Assign workdays based on expected hours for a work week without vacation days.
      const workdays = workWeekData.filter((day) => day.expectedHours > 0);
      if (workdays.length > 0) {
        return workdays.map((day) => DateTime.fromISO(day.date).weekday);
      }
    }
  } catch (error) {
    console.warn("Could not fetch contracted work week, defaulting to Mon–Fri", error);
  }

  return [1, 2, 3, 4, 5];
};

/**
 * Gets a correct vacation year for the vacation and formats it to include the year and vacation days.
 *
 * @param startDate - The start date of the vacation in ISO format (YYYY-MM-DD).
 * @param daysConsumed - Number of days the vacation consumes.
 *
 * @returns An object where the keys are years and the values are the number of vacation days in that year.
 */
export const splitVacationDaysByYear = (
  startDate: string,
  daysConsumed: number
): Record<string, number> => {
  const startDateObj = DateTime.fromISO(startDate);

  // Assumes vacation year runs 01/04/YYYY → 31/03/(YYYY+1)
  const getVacationYear = (date: DateTime): string => {
    return date.month >= 4 ? String(date.year) : String(date.year - 1);
  };

  // Assign totalDays to the correct vacation year
  const vacationYear = getVacationYear(startDateObj);
  const daysByYear: Record<string, number> = {};
  daysByYear[vacationYear] = daysConsumed;

  return daysByYear;
};

/**
 * Validates if a user has enough vacation days WITHOUT modifying Keycloak.
 * @param userId - The ID of the user whose vacation days are being validated.
 * @param daysNeeded - The number of vacation days needed.
 * @param year - The year for which the vacation days are being validated.
 *
 * @returns True if user has enough days, false otherwise.
 */
export const validateVacationDays = async (
  userId: string,
  daysNeeded: number,
  year: string
): Promise<boolean> => {
  const keycloakApiService = CreateKeycloakApiService();
  const user = await keycloakApiService.getUserAttributes(userId);

  const unspentVacationDaysByYear = user.unspentVacationDaysByYear || [];
  const currentEntry = unspentVacationDaysByYear.find((s) => s.startsWith(`${year}:`));
  const currentValue = currentEntry ? Number(currentEntry.split(":")[1]) : 0;

  return currentValue >= Math.max(daysNeeded, 0);
};

/**
 * Checks if the start and end dates of a vacation request are valid (not in the past, start before end).
 *
 * @param startDate string
 * @param endDate string
 */
export const validateVacationDates = (startDate: string, endDate: string): boolean => {
  const start = DateTime.fromISO(startDate).startOf("day");
  const end = DateTime.fromISO(endDate).startOf("day");
  const today = DateTime.now().startOf("day");

  return start >= today && end >= today && start <= end;
};

/**
 * Deducts vacation days from Keycloak user.
 * @param userId - The ID of the user whose vacation days are being deducted.
 * @param daysToDeduct - The number of vacation days to deduct.
 * @param year - The year for which the vacation days are being deducted.
 */
export const deductVacationDays = async (
  userId: string,
  daysToDeduct: number,
  year: string
): Promise<void> => {
  const keycloakApiService = CreateKeycloakApiService();
  const user = await keycloakApiService.getUserAttributes(userId);

  const unspentVacationDaysByYear = user.unspentVacationDaysByYear || [];
  const currentEntry = unspentVacationDaysByYear.find((s) => s.startsWith(`${year}:`));
  const currentValue = currentEntry ? Number(currentEntry.split(":")[1]) : 0;

  const remainingDays = Math.max(currentValue - daysToDeduct, 0);
  const formattedValue = `${year}:${String(remainingDays).padStart(3, "0")}`;

  const updatedUnspent = [...unspentVacationDaysByYear];
  const yearUnspentVacationIndex = updatedUnspent.findIndex((s) => s.startsWith(`${year}:`));

  if (yearUnspentVacationIndex >= 0) {
    updatedUnspent[yearUnspentVacationIndex] = formattedValue;
  } else {
    updatedUnspent.push(formattedValue);
  }

  user.unspentVacationDaysByYear = [...new Set(updatedUnspent)];
  await keycloakApiService.updateUserAttributes(userId, user);
};

/**
 * Returns vacation days to Keycloak user(adds them back).
 * @param userId - The ID of the user whose vacation days are being returned.
 * @param daysToReturn - The number of vacation days to return.
 * @param year - The year for which the vacation days are being returned.
 */
export const returnVacationDays = async (
  userId: string,
  daysToReturn: number,
  year: string
): Promise<void> => {
  const keycloakApiService = CreateKeycloakApiService();
  const user = await keycloakApiService.getUserAttributes(userId);

  const unspentVacationDaysByYear = user.unspentVacationDaysByYear || [];
  const currentEntry = unspentVacationDaysByYear.find((s) => s.startsWith(`${year}:`));
  const currentValue = currentEntry ? Number(currentEntry.split(":")[1]) : 0;

  const newRemainingDays = currentValue + daysToReturn;
  const formattedValue = `${year}:${String(newRemainingDays).padStart(3, "0")}`;

  const updatedUnspent = [...unspentVacationDaysByYear];
  const yearUnspentVacationIndex = updatedUnspent.findIndex((s) => s.startsWith(`${year}:`));

  if (yearUnspentVacationIndex >= 0) {
    updatedUnspent[yearUnspentVacationIndex] = formattedValue;
  } else {
    updatedUnspent.push(formattedValue);
  }

  user.unspentVacationDaysByYear = [...new Set(updatedUnspent)];
  await keycloakApiService.updateUserAttributes(userId, user);
};

/**
 * Gets the latest status from a vacation request status array
 */
export const getLatestStatus = (statusArray: VacationRequestStatus[] | undefined) => {
  if (!Array.isArray(statusArray) || statusArray.length === 0) return undefined;
  return statusArray.at(-1)?.status;
};

/**
 * Validates vacation approval WITHOUT updating Keycloak.
 * Returns validation result for use before database update.
 *
 * @param userId - The ID of the user.
 * @param startDate - The start date of the vacation.
 * @param daysConsumed - Number of days vacation consumes.
 *
 * @returns Error object if validation fails, null if passes.
 */
export const validateVacationApproval = async (
  userId: string,
  startDate: string,
  daysConsumed: number
): Promise<{ statusCode: number; body: string } | null> => {
  const daysByYear = splitVacationDaysByYear(startDate, daysConsumed);
  for (const [year, daysInYear] of Object.entries(daysByYear)) {
    const hasEnoughDays = await validateVacationDays(userId, daysInYear, year);
    if (!hasEnoughDays) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: `Cannot approve request: user does not have enough remaining vacation days for ${year}.`
        })
      };
    }
  }

  return null;
};

/**
 * Deducts vacation days for an approval.
 * Should be called BEFORE database update. If the database update fails, use returnVacationDaysForRejection to rollback.
 *
 * @param userId - The ID of the user.
 * @param startDate - The start date of the vacation.
 * @param daysConsumed - Number of days vacation consumes.
 */
export const deductVacationDaysForApproval = async (
  userId: string,
  startDate: string,
  daysConsumed: number
): Promise<void> => {
  const daysByYear = splitVacationDaysByYear(startDate, daysConsumed);
  for (const [year, daysInYear] of Object.entries(daysByYear)) {
    await deductVacationDays(userId, daysInYear, year);
  }
};

/**
 * Returns vacation days for a rejection or as a compensating transaction for failed approval.
 * For rejections: called AFTER database status update.
 * For rollback: called to compensate when approval database update fails.
 *
 * @param userId - The ID of the user.
 * @param startDate - The start date of the vacation.
 * @param daysConsumed - Number of days to return to user.
 */
export const returnVacationDaysForRejection = async (
  userId: string,
  startDate: string,
  daysConsumed: number
): Promise<void> => {
  const daysByYear = splitVacationDaysByYear(startDate, daysConsumed);
  for (const [year, daysInYear] of Object.entries(daysByYear)) {
    await returnVacationDays(userId, daysInYear, year);
  }
};
