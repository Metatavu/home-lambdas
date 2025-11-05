import type { APIGatewayProxyHandler } from "aws-lambda";
import Config from "src/app/config";
import { middyfy } from "src/libs/lambda";
import { CreateSeveraApiService } from "src/services/severa-api-service";
import type SeveraResponseWorkDays from "src/types/severa/workDays/severaResponseWorkDays";

/**
 * Lambda handler that lists a user's workdays from Severa within a given date range.
 *
 * @param event - API Gateway event with Severa user ID and optional start/end dates.
 * @returns HTTP response with workday data or an error message.
 */
export const listWorkdaysForUserHandler: APIGatewayProxyHandler = async (event) => {
  const severaUserId = event.pathParameters?.severaUserId;

  try {
    const SeveraApi = CreateSeveraApiService();

    if (!severaUserId) {
      return {
        statusCode: 401,
        body: JSON.stringify({
          message: "You need to opt in with the Severa service, Severa User ID required"
        })
      };
    }

    try {
      await SeveraApi.getKeywordIdForUser(severaUserId, "isSeveraOptIn");
    } catch {
      return {
        statusCode: 403,
        body: JSON.stringify({ message: "User has not opted in." })
      };
    }

    const severaUser = await SeveraApi.getUser(severaUserId);

    const testUserEmail = Config.get().testUser.email;
    const keycloakEmail = testUserEmail || event.requestContext.authorizer.claims.email;

    if (severaUser.email !== keycloakEmail) {
      return {
        statusCode: 403,
        body: JSON.stringify({ message: "You can only view your own information" })
      };
    }

    const startDate = event.queryStringParameters?.startDate;
    const endDate = event.queryStringParameters?.endDate;

    const rawWorkWeekData: SeveraResponseWorkDays[] = await SeveraApi.getWorkWeek(
      severaUserId,
      startDate,
      endDate
    );

    const workWeekData = rawWorkWeekData.map((day) => ({
      date: day.date,
      userGuid: day.userGuid,
      expectedHours: day.expectedHours ?? 0,
      enteredHours: day.enteredHours ?? 0,
      isHoliday: day.isHoliday ?? false,
      holidayName: day.holidayName ?? null
    }));

    return {
      statusCode: 200,
      body: JSON.stringify(workWeekData)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: error.message })
    };
  }
};

export const main = middyfy(listWorkdaysForUserHandler);
