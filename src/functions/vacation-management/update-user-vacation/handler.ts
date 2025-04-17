import { middyfy } from "src/libs/lambda";
import { CreateKeycloakApiService } from "src/database/services/keycloak-api-service";
import type { APIGatewayProxyHandlerV2 } from "aws-lambda";

const keycloakApiService = CreateKeycloakApiService();

const corsHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
};

const updatevacationhandler: APIGatewayProxyHandlerV2 = async (event) => {
  const userId = event.pathParameters?.userId;

  if (!userId) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ message: "User ID is required" }),
    };
  }

  try {
    const requestBody =
      typeof event.body === "string" ? JSON.parse(event.body) : event.body;
    const { vacationDays } = requestBody;

    if (!vacationDays) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ message: "Vacation days are required" }),
      };
    }

    const userAttributes = await keycloakApiService.getUserAttributes(userId);
    const updatedAttributes = { ...userAttributes };

    const vacationDaysByYear = userAttributes.vacationDaysByYear || [];
    const unspentVacationDaysByYear =
      userAttributes.unspentVacationDaysByYear || [];

    Object.entries(vacationDays).forEach(([year, data]: [string, any]) => {
      const yearInt = Number.parseInt(year, 10);
      if (!Number.isNaN(yearInt) && yearInt <= new Date().getFullYear()) {
        const formattedTotal = `${year}:${String(data.total).padStart(3, "0")}`;
        const formattedRemaining = `${year}:${String(data.remaining).padStart(
          3,
          "0"
        )}`;

        const updateEntry = (arr: string[], value: string) => {
          const index = arr.findIndex((v) => v.startsWith(`${year}:`));
          if (index !== -1) arr[index] = value;
          else arr.push(value);
        };

        updateEntry(vacationDaysByYear, formattedTotal);
        updateEntry(unspentVacationDaysByYear, formattedRemaining);

        updatedAttributes[`vacation_${year}`] = [String(data.total)];
        updatedAttributes[`vacation_${year}_remaining`] = [
          String(data.remaining),
        ];
      }
    });

    updatedAttributes.vacationDaysByYear = [...new Set(vacationDaysByYear)];
    updatedAttributes.unspentVacationDaysByYear = [
      ...new Set(unspentVacationDaysByYear),
    ];

    await keycloakApiService.updateUserAttributes(userId, updatedAttributes);

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        id: userId,
        updatedFields: Object.keys(updatedAttributes),
      }),
    };
  } catch (error) {
    console.error("Error updating vacation:", error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        message: "Failed to update vacation days",
        error: error instanceof Error ? error.message : JSON.stringify(error),
      }),
    };
  }
};

export const main = middyfy(updatevacationhandler);
