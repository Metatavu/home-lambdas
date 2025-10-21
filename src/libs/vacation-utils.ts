import { DateTime } from "luxon";
import { CreateKeycloakApiService } from "src/database/services/keycloak-api-service";

/**
 * Splits a vacation period into the number of vacation days per year.
 *
 * Counts weekdays (Monday to Friday) by default, and optionally includes Saturdays
 * if the vacation period is longer than 7 days.
 *
 * @param startDate - The start date of the vacation in ISO format (YYYY-MM-DD).
 * @param endDate - The end date of the vacation in ISO format (YYYY-MM-DD).
 *
 * @returns An object where the keys are years and the values are the number of vacation days in that year.
 */
export const splitVacationDaysByYear = (
  startDate: string,
  endDate: string
): Record<string, number> => {
  const start = DateTime.fromISO(startDate);
  const end = DateTime.fromISO(endDate);

  const allDays = end.diff(start, "days").days + 1;
  const includeSaturdays = allDays > 7;

  const daysByYear: Record<string, number> = {};
  let current = start;

  while (current <= end) {
    const weekday = current.weekday;
    if (weekday <= 5 || (includeSaturdays && weekday === 6)) {
      const year = current.year.toString();
      daysByYear[year] = (daysByYear[year] || 0) + 1;
    }

    current = current.plus({ days: 1 });
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
