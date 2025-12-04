import { DateTime } from "luxon";
import { CreateKeycloakApiService } from "src/database/services/keycloak-api-service";
import { CreateSeveraApiService } from "src/services/severa-api-service";

/**
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
 * Splits a vacation period into the number of vacation days per year. Uses Severa as the source of truth.
 * Calculates the number of vacation days using 6 day work week logic.
 *
 * @param startDate - The start date of the vacation in ISO format (YYYY-MM-DD).
 * @param endDate - The end date of the vacation in ISO format (YYYY-MM-DD).
 * @param contractedWeek - An array of numbers representing the user's contracted work week (1 = Monday, 7 = Sunday).
 * @param workDays - The number of work days in a full work week.
 *
 * @returns An object where the keys are years and the values are the number of vacation days in that year.
 */
export const splitVacationDaysByYear = (
  startDate: string,
  endDate: string,
  contractedWeek: number[]
): Record<string, number> => {
  const startDateObj = DateTime.fromISO(startDate);
  const endDateObj = DateTime.fromISO(endDate);
  const workDays = contractedWeek.length;

  let workDaysInRange = 0;
  let currentDate = startDateObj;

  while (currentDate <= endDateObj) {
    if (contractedWeek.includes(currentDate.weekday)) {
      workDaysInRange++;
    }
    currentDate = currentDate.plus({ days: 1 });
  }

  // Calculate weeks & days of request for 6 day work week logic
  const fullWeeks = Math.floor(workDaysInRange / workDays);
  const extraDays = workDaysInRange % workDays;

  const totalDays = fullWeeks * 6 + extraDays;

  const daysByYear: Record<string, number> = {};
  currentDate = startDateObj;
  let daysLeft = totalDays;

  while (currentDate <= endDateObj && daysLeft > 0) {
    const year = currentDate.year.toString();
    if (!daysByYear[year]) daysByYear[year] = 0;

    if (contractedWeek.includes(currentDate.weekday)) {
      daysByYear[year] += 1;
      daysLeft -= 1;
    }

    currentDate = currentDate.plus({ days: 1 });
  }

  return daysByYear;
};

/**
 * Updates the remaining vacation days for a specific user and year.
 *
 * @param userId - The ID of the user whose vacation days are being updated.
 * @param daysToSubtract - The number of vacation days to subtract from the user's remaining days.
 * @param year - The year for which the vacation days are being updated.
 *
 * @returns A promise that resolves when the user's vacation days have been updated.
 */
export const updateRemainingVacationDays = async (
  userId: string,
  daysToSubtract: number,
  status: string,
  year: string
): Promise<boolean> => {
  const keycloakApiService = CreateKeycloakApiService();
  const user = await keycloakApiService.getUserAttributes(userId);

  const unspentVacationDaysByYear = user.unspentVacationDaysByYear || [];

  const currentEntry = unspentVacationDaysByYear.find((s) => s.startsWith(`${year}:`));
  const currentValue = currentEntry ? Number(currentEntry.split(":")[1]) : 0;

  if (currentValue < daysToSubtract) {
    return false;
  }
  const remainingDays = Math.max(currentValue - daysToSubtract, 0);
  const formattedValue = `${year}:${String(remainingDays).padStart(3, "0")}`;

  const updatedUnspent = [...unspentVacationDaysByYear];
  const existingIndex = updatedUnspent.findIndex((s) => s.startsWith(`${year}:`));

  if (existingIndex >= 0) {
    updatedUnspent[existingIndex] = formattedValue;
  } else {
    updatedUnspent.push(formattedValue);
  }

  user.unspentVacationDaysByYear = [...new Set(updatedUnspent)];
  if (status === "APPROVED") {
    await keycloakApiService.updateUserAttributes(userId, user);
  }
  return true;
};
