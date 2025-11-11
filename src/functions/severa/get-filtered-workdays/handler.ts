import type { APIGatewayProxyHandler } from "aws-lambda";
import { DateTime } from "luxon";
import Config from "src/app/config";
import { middyfy } from "src/libs/lambda";
import { CreateSeveraApiService } from "src/services/severa-api-service";
import type SeveraResponseWorkDays from "src/types/severa/workDays/severaResponseWorkDays";

/**
 * Find the contracted work week of a user from Severa.
 * Test user email matches requested severaUserId.
 */
export const getContractedWorkWeekHandler: APIGatewayProxyHandler = async (event) => {
  const severaUserId = event.pathParameters?.userId;

  try {
    if (!severaUserId) {
      return {
        statusCode: 401,
        body: JSON.stringify({
          message: "You need to opt in with the Severa service, Severa User ID required"
        })
      };
    }

    const severaApi = CreateSeveraApiService();

    const severaUser = await severaApi.getUser(severaUserId);

    const testUserEmail = Config.get().testUser.email;
    const keycloakEmail = testUserEmail || event.requestContext.authorizer.claims.email;

    if (severaUser.email !== keycloakEmail) {
      return {
        statusCode: 403,
        body: JSON.stringify({
          message: "You can only view your own information"
        })
      };
    }

    const today = DateTime.now();
    let contractedWeek: number[] = [];

    /**
     * Find week without holidays and then users workdays
     */
    for (let weeksBack = 0; weeksBack < 5; weeksBack++) {
      const weekStart = today.minus({ weeks: weeksBack }).startOf("week");
      const weekEnd = weekStart.plus({ days: 6 });

      const workWeekData: SeveraResponseWorkDays[] = await severaApi.getWorkWeek(
        severaUserId,
        weekStart.toISODate(),
        weekEnd.toISODate()
      );

      const hasHoliday = workWeekData.some((day) => day.isHoliday);
      if (hasHoliday) {
        continue;
      }

      const workdays = workWeekData.filter((day) => day.expectedHours > 0);

      if (workdays.length > 0) {
        contractedWeek = workdays.map((day) => DateTime.fromISO(day.date).weekday);
        break;
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        contractedWeek,
        contractedDaysCount: contractedWeek.length
      })
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: error.message })
    };
  }
};

export const main = middyfy(getContractedWorkWeekHandler);
