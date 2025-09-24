import { middyfy } from "src/libs/lambda";
import { CreateKeycloakApiService } from "src/database/services/keycloak-api-service";
import type { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { YearlyVacationDays } from "src/generated/homeLambdasModels/model/yearlyVacationDays";

// vacationDays matches the OpenAPI spec
const keycloakApiService = CreateKeycloakApiService();

/**
 * Lambda handler to update a user's vacation day attributes in Keycloak.
 *
 * @param event - API Gateway event containing userId and vacationDays in body
 * @returns Response message as JSON string
 */
// NOTE: Returned vacationDays matches the OpenAPI spec: object with years as keys and YearlyVacationDays as values.
const updateVacationHandler: APIGatewayProxyHandlerV2 = async (event) => {
  const userId = event.pathParameters?.userId;

  if (!userId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "User ID is required" }),
    };
  }

  try {
    const requestBody =
      typeof event.body === "string" ? JSON.parse(event.body) : event.body;

    const { vacationDays } = requestBody as { vacationDays: Record<string, YearlyVacationDays> };

    if (
      !vacationDays ||
      typeof vacationDays !== "object" ||
      Array.isArray(vacationDays)
    ) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Vacation days are required" }),
      };
    }

    const userAttributes = await keycloakApiService.getUserAttributes(userId);

    const vacationDaysByYear = userAttributes.vacationDaysByYear || [];
    const unspentVacationDaysByYear =
      userAttributes.unspentVacationDaysByYear || [];

    const currentYear = new Date().getFullYear();

    const updatedVacationDays: Record<string, YearlyVacationDays> = {};

/**
 * Formats a numeric value for a given year into a consistent "YYYY:NNN" string.
 * This format helps with easy lookup and updating in Keycloak user attributes.
 *
 * Example:
 *   formatValue("2024", 5) => "2024:005"
 *
 * @param year - The year as a string (e.g., "2024")
 * @param value - The numeric value (e.g., vacation days)
 * @returns Formatted string "YYYY:NNN"
 */

    const formatValue = (year: string, value: number) =>
      `${year}:${String(value).padStart(3, "0")}`;

/**
 * Updates a year-specific value in a string array (e.g., ["2023:020"]).
 * If the year already exists in the array, its value is replaced.
 * If not, the new "year:value" string is added.
 *
 * @param arr - Array of year-value strings (e.g., vacationDaysByYear)
 * @param value - The new or updated "YYYY:NNN" string
 */

    const updateEntry = (arr: string[], value: string) => {
      const index = arr.findIndex((v) => v.startsWith(`${value.split(":")[0]}:`));
      if (index !== -1) arr[index] = value;
      else arr.push(value);
    };

    Object.entries(vacationDays).forEach(([year, data]) => {
      const yearInt = Number.parseInt(year, 10);
      if (
        Number.isNaN(yearInt) ||
        yearInt > currentYear ||
        typeof data.total !== "number" ||
        typeof data.remaining !== "number"
      ) {
        console.warn(`Invalid vacation data for year: ${year}`, { data });
        return;
      }

      const formattedTotal = formatValue(year, data.total);
      const formattedRemaining = formatValue(year, data.remaining);

      updateEntry(vacationDaysByYear, formattedTotal);
      updateEntry(unspentVacationDaysByYear, formattedRemaining);

      updatedVacationDays[year] = {
        total: data.total,
        remaining: data.remaining,
      };

      userAttributes[`vacation_${year}`] = [String(data.total)];
      userAttributes[`vacation_${year}_remaining`] = [String(data.remaining)];
    });

    userAttributes.vacationDaysByYear = [...new Set(vacationDaysByYear)];
    userAttributes.unspentVacationDaysByYear = [
      ...new Set(unspentVacationDaysByYear),
    ];

    await keycloakApiService.updateUserAttributes(userId, userAttributes);

    return {
      statusCode: 200,
      body: JSON.stringify({
        id: userId,
        vacationDays: updatedVacationDays,
      }),
    };
  } catch (error) {
    console.error("Error updating vacation:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Failed to update vacation days",
        error: error instanceof Error ? error.message : JSON.stringify(error),
      }),
    };
  }
};

export const main = middyfy(updateVacationHandler);
