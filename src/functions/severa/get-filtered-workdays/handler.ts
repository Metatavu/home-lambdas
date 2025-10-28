import type { APIGatewayProxyHandler } from "aws-lambda";
import { DateTime } from "luxon";
import { middyfy } from "src/libs/lambda";
import { CreateSeveraApiService } from "src/services/severa-api-service";
import type SeveraResponseWorkDays from "src/types/severa/workDays/severaResponseWorkDays";

/**
 * Lambda handler to calculate the contracted work week of a user from Severa.
 * Get logged-in user's email from the authorizer, then fetch Severa GUID for user.
 * Lastly find a holiday free week for the user to find a normal expecetd work week.
 */
export const getContractedWorkWeekHandler: APIGatewayProxyHandler = async (event) => {
  try {
    const api = CreateSeveraApiService();

    const userEmail = event.requestContext.authorizer.claims.email;
    if (!userEmail) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "User email not found" })
      };
    }

    const user = await api.fetchUserByEmail(userEmail);
    const userGuid = user.guid;
    const today = DateTime.now();
    let contractedWeek: number[] = [];
    let foundWeek = false;

    for (let i = 0; i < 4 && !foundWeek; i++) {
      const weekStart = today.minus({ weeks: i }).startOf("week");
      const weekEnd = weekStart.plus({ days: 6 });

      const workWeekData: SeveraResponseWorkDays[] = await api.getWorkWeek(
        userGuid,
        weekStart.toISODate(),
        weekEnd.toISODate()
      );

      /**
       * Filter out zero hour days and holidays
       *
       * @return a numeric array of normal work days in a week for the user where 0=Sunday - 6=Saturday
       */
      const workdays = workWeekData.filter((day) => day.expectedHours > 0 && !day.isHoliday);

      if (workdays.length > 0 && workdays.length <= 7) {
        contractedWeek = workdays.map((day) => DateTime.fromISO(day.date).weekday % 7);
        foundWeek = true;
      }
    }

    if (!foundWeek) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: "No holiday-free week found in recent weeks" })
      };
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
