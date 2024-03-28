import { DailyCombinedData, WeeklyCombinedData, TimeRegistrations, PreviousWorkdayDates, NonProjectTime, DailyMessageData, DailyMessageResult, WeeklyMessageData, WeeklyMessageResult } from "src/types/meta-assistant/index";
import { ChatPostMessageResponse, LogLevel, WebClient } from "@slack/web-api";
import { Member } from "@slack/web-api/dist/response/UsersListResponse";
import { DateTime } from "luxon";
import TimeUtilities from "../generic/time-utils";
import MessageUtilities from "../generic/message-utils";

/**
 * Namespace for Slack utilities
 */
namespace SlackUtilities {

  export const client = new WebClient(process.env.METATAVU_BOT_TOKEN, {
    logLevel: LogLevel.DEBUG
  });

  const slackOverride = process.env.SLACK_USER_OVERRIDE ? process.env.SLACK_USER_OVERRIDE.split(",") : undefined;

  /**
   * Get list of slack users
   *
   * @returns Promise of slack user data
   */
  export const getSlackUsers = async (): Promise<Member[]> => {
    const result = await client.users.list();

    if (!result.ok) throw new Error(`Error while loading slack users list, ${result.error}`);

    return result.members;
  };

  /**
   * Create message based on specific users timebank data
   *
   * @param user timebank data
   * @param numberOfToday Todays number
   * @returns string message if id match
   */
  const constructDailyMessage = (user: DailyCombinedData, numberOfToday: number): DailyMessageData => {
    const { name, date, firstName, minimumBillableRate } = user;

    const displayDate = DateTime.fromISO(date).toFormat("dd.MM.yyyy");

    const {
      logged,
      loggedProject,
      expected,
      internal,
      billableProject,
      nonBillableProject
    } = TimeUtilities.handleTimeFormatting(user);

    const {
      message,
      billableHoursPercentage
    } = MessageUtilities.calculateWorkedTimeAndBillableHours(user);

    const customMessage = `
Hi ${firstName},
${numberOfToday === 1 ? "Last friday" :"Yesterday"} (${displayDate}) you worked ${logged} with an expected time of ${expected}.
${message}
Logged project time: ${loggedProject}, Billable project time: ${billableProject}, Non billable project time: ${nonBillableProject}, Internal time: ${internal}.
Your percentage of billable hours was: ${billableHoursPercentage}% ${parseInt(billableHoursPercentage) >= minimumBillableRate ? ":+1:" : ":-1:"}
Have a great rest of the day!
    `;

    return {
      message: customMessage,
      name: name,
      displayDate: displayDate,
      displayLogged: logged,
      displayLoggedProject: loggedProject,
      displayExpected: expected,
      displayBillableProject: billableProject,
      displayNonBillableProject: nonBillableProject,
      displayInternal: internal,
      billableHoursPercentage: billableHoursPercentage
    };
  };

  /**
   * Create weekly message from users timebank data
   *
   * @param user timebank data
   * @param weekStart date for data
   * @param weekEnd date for data
   * @returns message
   */
  const constructWeeklySummaryMessage = (user: WeeklyCombinedData, weekStart: string, weekEnd: string): WeeklyMessageData => {
    const { name, firstName } = user;
    const week = Number(user.selectedWeek.timePeriod.split(",")[2]);
    // TODO: minimumBillableRate should come from the user but this needs to be updated on the back end for most users, so using this for now
    const minimumBillableRate = 75;

    const startDate = DateTime.fromISO(weekStart).toFormat("dd.MM.yyyy");
    const endDate = DateTime.fromISO(weekEnd).toFormat("dd.MM.yyyy");

    const {
      logged,
      loggedProject,
      expected,
      internal,
      billableProject,
      nonBillableProject
    } = TimeUtilities.handleTimeFormatting(user.selectedWeek);

    const {
      message,
      billableHoursPercentage
    } = MessageUtilities.calculateWorkedTimeAndBillableHours(user.selectedWeek);

    const customMessage = `
Hi ${firstName},
Last week (week: ${week}, ${startDate} - ${endDate}) you worked ${logged} with an expected time of ${expected}.
${message}
Logged project time: ${loggedProject}, Billable project time: ${billableProject}, Non billable project time: ${nonBillableProject}, Internal time: ${internal}.
Your percentage of billable hours was: ${billableHoursPercentage}%
You ${+parseInt(billableHoursPercentage) >= minimumBillableRate ? `worked the target ${minimumBillableRate}% billable hours last week:+1:` : `did not work the target ${minimumBillableRate}% billable hours last week:-1:`}.
Have a great week!
    `;

    return {
      message: customMessage,
      name: name,
      week: week,
      startDate: startDate,
      endDate: endDate,
      displayLogged: logged,
      displayLoggedProject: loggedProject,
      displayExpected: expected,
      displayBillableProject: billableProject,
      displayNonBillableProject: nonBillableProject,
      displayInternal: internal,
      billableHoursPercentage: billableHoursPercentage
    };
  };

  /**
   * Sends given message to given slack channel
   *
   * @param channelId channel ID
   * @param message message to be send
   * @returns Promise of ChatPostMessageResponse
   */
  const sendMessage = (channelId: string, message: string): Promise<ChatPostMessageResponse> => (
    client.chat.postMessage({
      channel: channelId,
      text: message
    })
  );

  /**
   * Post a daily slack message to users
   *
   * @param dailyCombinedData list of combined timebank and slack user data
   * @param timeRegistrations all time registrations after yesterday
   * @param previousWorkDays dates and the number of today
   * @param nonProjectTimes all non project times
   */
  export const postDailyMessageToUsers = async (
    dailyCombinedData: DailyCombinedData[],
    timeRegistrations: TimeRegistrations[],
    previousWorkDays: PreviousWorkdayDates,
    nonProjectTimes: NonProjectTime[]
  ): Promise<DailyMessageResult[]> => {
    const { numberOfToday, yesterday, today } = previousWorkDays;

    let messageResults: DailyMessageResult[] = [];
    for (const userData of dailyCombinedData) {
      const { slackId, personId, expected } = userData;

      const isAway = TimeUtilities.checkIfUserShouldRecieveMessage(timeRegistrations, personId, expected, today.toISODate(), nonProjectTimes);
      const firstDayBack= TimeUtilities.checkIfUserShouldRecieveMessage(timeRegistrations, personId, expected, yesterday.toISODate(), nonProjectTimes);

      const message = constructDailyMessage(userData, numberOfToday);

      if (!isAway && !firstDayBack) {
        if (!slackOverride) {
          messageResults.push({
            message: message,
            response: await sendMessage(slackId, message.message)
          });
        }
        else {
          for (const stagingid of slackOverride) {
            messageResults.push({
              message: message,
              response: await sendMessage(stagingid, message.message)
            });
          }
        }
      }
    }
    return messageResults;
  };

  /**
   * Post a weekly summary slack message to users
   *
   * @param weeklyCombinedData list of combined timebank and slack user data
   * @param nonProjectTimes all non project times
   * @param timeRegistrations all time registrations after yesterday
   * @param previousWorkDays dates and the number of today
   */
  export const postWeeklyMessageToUsers = async (
    weeklyCombinedData: WeeklyCombinedData[],
    timeRegistrations:TimeRegistrations[],
    previousWorkDays: PreviousWorkdayDates,
    nonProjectTimes: NonProjectTime[]
  ): Promise<WeeklyMessageResult[]> => {
    const { weekStartDate, weekEndDate } = TimeUtilities.getlastWeeksDates();
    const { yesterday, today } = previousWorkDays;

    const messageResults: WeeklyMessageResult[] = [];

    for (const userData of weeklyCombinedData) {
      const { slackId, personId, expected } = userData;

      const isAway = TimeUtilities.checkIfUserShouldRecieveMessage(timeRegistrations, personId, expected, today.toISODate(), nonProjectTimes);
      const firstDayBack = TimeUtilities.checkIfUserShouldRecieveMessage(timeRegistrations, personId, expected, yesterday.toISODate(), nonProjectTimes);

      const message = constructWeeklySummaryMessage(userData, weekStartDate.toISODate(), weekEndDate.toISODate());

      if (!isAway && !firstDayBack) {
        if (!slackOverride) {
          messageResults.push({
            message: message,
            response: await sendMessage(slackId, message.message)
          });
        } else {
          for (const stagingid of slackOverride) {
            messageResults.push({
              message: message,
              response: await sendMessage(stagingid, message.message)
            });
          }
        }
      }
    }
    return messageResults;
  };
}

export default SlackUtilities;