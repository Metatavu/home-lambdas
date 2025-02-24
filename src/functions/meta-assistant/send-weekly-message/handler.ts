import { type ValidatedAPIGatewayProxyEvent, type ValidatedEventAPIGatewayProxyEvent, formatJSONResponse, type WeeklyHandlerResponse } from "src/libs/api-gateway";
import TimeUtilities from "src/meta-assistant/generic/time-utils";
import SlackUtilities from "src/meta-assistant/slack/slack-utils";
import { CreateSeveraApiService } from "src/services/severa-api-service";
import type schema from "src/types/meta-assistant/index";
import type { WeeklyCombinedData } from "src/types/meta-assistant/index";

/**
 * Handler for sendWeeklyMessage
 *
 * @returns Promise of WeeklyHandlerResponse
 */
export const sendWeeklyMessageHandler = async (): Promise<WeeklyHandlerResponse> => {
  try {
    const severaApi = CreateSeveraApiService();
    const severaUsers = await severaApi.getOptInUsers();
    const previousWorkDays = TimeUtilities.getPreviousTwoWorkdays();

    const { dayBeforeYesterday } = previousWorkDays;
    const { weekStartDate, weekEndDate } = TimeUtilities.getlastWeeksDates(dayBeforeYesterday);

    if (!severaUsers) {
      throw new Error("No users retrieved from Severa");
    }

    const personTotalTimes: WeeklyCombinedData[] = [];

    for (const severaUser of severaUsers) {
      const workWeek = await severaApi.getWorkWeek(severaUser.guid);
      const workWeekHours = await severaApi.getPreviousWeekHours(severaUser.guid)

      let totalWorkHours = 0;
      let totalExpectedHours = 0;
      let totalProjectTime = 0;
      let enteredTimeEntries = 0;

      if (workWeek) {
        for (const day of workWeek) {
          console.log("day", day.enteredHours);
          totalWorkHours += day.enteredHours;
          totalExpectedHours += day.expectedHours;
          enteredTimeEntries += day.enteredTimeEntries;
        }
        for (const day of workWeekHours) {
          totalProjectTime += day.quantity;
        }
        personTotalTimes.push({
          userId: severaUser.guid,
          firstName: severaUser.firstName,
          totalExpectedHours: totalExpectedHours,
          totalEnteredHours: totalWorkHours,
          enteredTimeEntries: enteredTimeEntries,
          minimumBillableRate: 75,
          projectTime: totalProjectTime,
          week: weekStartDate.weekNumber,
          startDate: weekStartDate.toISODate(),
          endDate: weekEndDate.toISODate()
        });
      }
    }

    const messagesSent = await SlackUtilities.postWeeklyMessageToUsers(personTotalTimes);
    const errors = messagesSent.filter(messageSent => messageSent.response.error);

    if (errors.length) {
      let errorMessage = "Error while posting slack messages, ";
      errors.forEach(error => {
        errorMessage += `${error.response.error}\n`;
      });
      console.error(errorMessage);
    }
    return {
      message: "Everything went well sending the weekly, see data for message breakdown...",
      data: messagesSent
    };
  } catch (error) {
    return {
      message: `Error while sending slack message: ${error}`
    };
  }
  };

  /**
   * Lambda for sending weekly messages
   *
   * @param event API Gateway proxy event
   * @returns JSON response
   */
  const sendWeeklyMessage: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event: ValidatedAPIGatewayProxyEvent<typeof schema>) => (
  formatJSONResponse({
    ...await sendWeeklyMessageHandler(),
    event: event
  })
);

export const main = sendWeeklyMessage;