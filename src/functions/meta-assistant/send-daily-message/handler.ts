import { type ValidatedAPIGatewayProxyEvent, type ValidatedEventAPIGatewayProxyEvent, formatJSONResponse, type DailyHandlerResponse } from "src/libs/api-gateway";
import type { DailyCombinedData } from "src/types/meta-assistant/index";
import type schema from "src/types/meta-assistant/index";
import SlackUtilities from "src/meta-assistant/slack/slack-utils";
import TimeUtilities from "src/meta-assistant/generic/time-utils";
import { CreateSeveraApiService } from "src/services/severa-api-service";
import type SeveraResponsePreviousWorkHours from "src/types/severa/previousWorkHours/severaResponsePreviousWorkHours";
import type SeveraResponseUser from "src/types/severa/user/severaResponseUser";

/**
 * Handler for sendDailyMessage
 *
 * @returns Promise of DailyHandlerResponse
 */
export const sendDailyMessageHandler = async (): Promise<DailyHandlerResponse> => {
  try {
    const severaApi = CreateSeveraApiService();
    const severaUsers = await severaApi.getOptInUsers() as SeveraResponseUser[];
    const previousWorkDays = TimeUtilities.getPreviousTwoWorkdays();
    const workHours = await severaApi.getPreviousWorkHours() as SeveraResponsePreviousWorkHours[];
    if (!severaUsers) {
      throw new Error("No users retrieved from Severa");
    }

    // Get the user's guids from workHours
    const workHoursUserGuids = workHours.map(hour => hour.user.guid);

    // Filter severaUsers to include only those who worked in the selected time frame
    const filteredSeveraUsers = severaUsers.filter(user => workHoursUserGuids.includes(user.guid));

    // Combine user data
    const combinedUserData: DailyCombinedData[] = await Promise.all(
      filteredSeveraUsers.map(async user => {
        const userWorkHours = workHours.filter(hour => hour.user.guid === user.guid);
        const workDays = await severaApi.getWorkDays(user.guid);
        const projectTime = userWorkHours[0]?.quantity || 0;
        const totalLoggedTime = workDays[0]?.enteredHours || 0;
        const expectedHours = user.workContract.dailyHours || 0;
        const minimumBillableRate = 75;

        let totalBillableTime = 0;

        userWorkHours.forEach(hour => {
          if (hour.isBillable && hour.user.guid === user.guid) {
            totalBillableTime += hour.quantity;
          }
        });

        const nonBillableProject = totalLoggedTime - totalBillableTime;

        // Find the corresponding Slack user
        const slackUser = await SlackUtilities.findSlackUser(user.firstName, user.lastName);

        const result = {
          userId: user.guid,
          firstName: user.firstName,
          lastName: user.lastName,
          totalLoggedTime: totalLoggedTime,
          expectedHours: expectedHours,
          projectTime: projectTime,
          minimumBillableRate: minimumBillableRate,
          totalBillableTime: totalBillableTime,
          nonBillableProject: nonBillableProject,
          date: previousWorkDays.yesterday.toISO(),
          slackId: slackUser ? slackUser.id : null
        };

        return result;
      })
    );

    const messageSent = await SlackUtilities.postDailyMessageToUsers(combinedUserData, previousWorkDays);

    return {
      message: "Daily messages constructed successfully",
      data: messageSent
    };
  } catch (error) {
    console.error(error.toString());
    return {
      message: `Error while sending slack message: ${error}`
    };
  }
};

/**
 * Lambda function for sending slack message
 *
 * @param event API Gateway proxy event
 * @returns JSON response
 */
const sendDailyMessage: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event: ValidatedAPIGatewayProxyEvent<typeof schema>) => (
  formatJSONResponse({
    ...await sendDailyMessageHandler(),
    event: event
  })
);

export const main = sendDailyMessage;