import type { APIGatewayProxyHandler } from "aws-lambda";
import { DateTime } from "luxon";
import Config from "src/app/config";
import { middyfy } from "src/libs/lambda";
import { CreateSeveraApiService } from "src/services/severa-api-service";
import type SeveraResponseWorkDays from "src/types/severa/workDays/severaResponseWorkDays";

/**
 * Lambda handler to calculate the contracted work week of a user from Severa. Check user has SeveraId which should come from opting in.
 * Tests email matches requested user data so url cannot be manipulated.
 * Lastly find a holiday free week for the user to find a normal expecetd work week.
 */
export const getContractedWorkWeekHandler: APIGatewayProxyHandler = async (event) => {
  const severaUserId = event.pathParameters?.userId;

  try {
    if (!severaUserId) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "You need to opt in with the Severa service, Severa User ID required"
        })
      };
    }

    const api = CreateSeveraApiService();

    const severaUser = await api.getUser(severaUserId);

    const testUserEmail = Config.get().testUser.email;
    const keycloakEmail = testUserEmail || event.requestContext.authorizer.claims.email;

    if (severaUser.email !== keycloakEmail) {
      return {
        statusCode: 403,
        body: JSON.stringify({ message: "You can only view your own information" })
      };
    }

    const today = DateTime.now();
    let contractedWeek: number[] = [];
    let foundWeek = false;

    for (let i = 0; i < 4 && !foundWeek; i++) {
      const weekStart = today.minus({ weeks: i }).startOf("week");
      const weekEnd = weekStart.plus({ days: 6 });

      const workWeekData: SeveraResponseWorkDays[] = await api.getWorkWeek(
        severaUserId,
        weekStart.toISODate(),
        weekEnd.toISODate()
      );

      /**
       * Filter out zero hour days and holidays
       *
       * @return a numeric array of normal work days in a week for the user where Monday = 1...Sunday = 7, and number of active workdays in a week.
       */
      const workdays = workWeekData.filter((day) => day.expectedHours > 0 && !day.isHoliday);

      if (workdays.length > 0 && workdays.length <= 7) {
        contractedWeek = workdays.map((day) => DateTime.fromISO(day.date).weekday);
        foundWeek = true;
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
