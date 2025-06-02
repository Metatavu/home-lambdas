import type { DailyCombinedData, WeeklyCombinedData, TimeRegistrations, PreviousWorkdayDates, NonProjectTime, DailyMessageData, DailyMessageResult, WeeklyMessageData, WeeklyMessageResult } from "src/types/meta-assistant/index";
import { type ChatPostMessageResponse, LogLevel, WebClient } from "@slack/web-api";
import type { Member } from "@slack/web-api/dist/response/UsersListResponse";
import { DateTime } from "luxon";
import TimeUtilities from "../generic/time-utils";
import MessageUtilities from "../generic/message-utils";
import type { NotificationMessageResult } from "src/types/trello-notification";

/**
 * Namespace for Slack utilities
 */
namespace SlackUtilities {

  export const client = new WebClient(process.env.METATAVU_BOT_TOKEN, {
    logLevel: LogLevel.DEBUG
  });

  const slackOverride = process.env.SLACK_USER_OVERRIDE ? process.env.SLACK_USER_OVERRIDE.split(",") : undefined;
  const slackChannelId = process.env.CHANNEL_ID;

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
   * Gets Slack ID of card creator
   *
   * @param createdBy card creator full name
   * @returns Slack user ID
   */
  const getSlackUserId = async (createdBy: string): Promise<string> => {
    try {
      const users = await getSlackUsers();
      const matchedUser = users.find(user => user.real_name === createdBy);
    
      if (!matchedUser) throw new Error(`User with name ${createdBy} not found in Slack`);
      return matchedUser.id;
    } catch (error) {
      console.error(`Error finding user ID for ${createdBy}:`, error);
      return 
    }
  };

  /**
  * Find the corresponding Slack user
  * @param firstName user first name
  * @param lastName user last name
  */
  export const findSlackUser = async (firstName: string, lastName: string) => {
    try {
      const users = await getSlackUsers();
      return users.find(slackUser => slackUser.profile.first_name === firstName && slackUser.profile.last_name === lastName);
    } catch (error) {
      console.error(`Error finding user ID for ${firstName} ${lastName}:`, error);
      return 
    }
  };

  /**
   * Create message based on specific users severa data
   *
   * @param user severa data
   * @param numberOfToday Todays number
   * @returns string message if id match
   */
  const constructDailyMessage = (user: DailyCombinedData, numberOfToday: number): DailyMessageData => {
    const { firstName, date, minimumBillableRate } = user;

    const { 
      totalLoggedTime, 
      expectedHours, 
      projectTime,
      totalBillableTime,
      nonBillableProject,
    } = TimeUtilities.handleTimeFormatting(user);

    const {
      message,
      billableHoursPercentage
    } = MessageUtilities.calculateWorkedTimeAndBillableHours(user);

    const displayDate = DateTime.fromISO(date).toFormat("dd.MM.yyyy");
    
    const customMessage = `
      Hi ${firstName},
      ${numberOfToday === 1 ? "Last friday" :"Yesterday"} (${displayDate}) you worked ${totalLoggedTime} with an expected time of ${expectedHours}.
      ${message}
      Logged project time: ${projectTime}, Billable project time: ${totalBillableTime}, Non billable project time: ${nonBillableProject}.
      Your percentage of billable hours was: ${billableHoursPercentage}% ${Number.parseInt(billableHoursPercentage) >= minimumBillableRate ? ":+1:" : ":-1:"}
      Have a great rest of the day!
      `;
  
    return {
      message: customMessage,
      name: firstName,
      displayDate: displayDate,
      displayTotalLoggedTime: totalLoggedTime,
      displayExpected: expectedHours,
      displayNonBillableProject: nonBillableProject,
    };
  };

  /**
   * Create weekly message from users severa data
   *
   * @param user severa data
   * @param weekStart date for data
   * @param weekEnd date for data
   * @returns message
   */
  const constructWeeklySummaryMessage = (user: WeeklyCombinedData, weekStart: string, weekEnd: string, vacationTime: number): WeeklyMessageData => {
    const { name, firstName } = user;
    user.selectedWeek.expected -= vacationTime;
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
   * Create notification message about summary creation
   * 
   * @param summary text summary
   * @param name file name
   * @returns message
   */
  const constructMemoDocCreatedMessage = async (summary: string, name: string): Promise<string> => {
    const cleanName = name.slice(0, -4);
    const message = `
:checkered_flag: New summary *${cleanName}* is available: \n\`${summary.split("|")[0]}\`
    `;  
    return message;
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
   * @param dailyCombinedData list of combined severa and slack user data
   * @param timeRegistrations all time registrations after yesterday
   * @param previousWorkDays dates and the number of today
   * @param nonProjectTimes all non project times
   */
  export const postDailyMessageToUsers = async (
    dailyCombinedData: DailyCombinedData[],
    previousWorkDays: PreviousWorkdayDates,
  ): Promise<DailyMessageResult[]> => {
    const { numberOfToday } = previousWorkDays;

    const messageResults: DailyMessageResult[] = [];
    for (const userData of dailyCombinedData) {
      const { slackId } = userData;
      const message = constructDailyMessage(userData, numberOfToday);
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
      return messageResults;
    };

  /**
   * Post a weekly summary slack message to users
   *
   * @param weeklyCombinedData list of combined severa and slack user data
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
      const vacationTime = TimeUtilities.checkIfVacationCaseExists(personId, timeRegistrations, nonProjectTimes, weekStartDate, weekEndDate);
      const isAway = TimeUtilities.checkIfUserShouldRecieveMessage(timeRegistrations, personId, expected, today.toISODate(), nonProjectTimes);
      const firstDayBack = TimeUtilities.checkIfUserShouldRecieveMessage(timeRegistrations, personId, expected, yesterday.toISODate(), nonProjectTimes);
      const message = constructWeeklySummaryMessage(userData, weekStartDate.toISODate(), weekEndDate.toISODate(), vacationTime);

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

  /**
   * Post an instant slack summary message to users
   *
   * @param summary text summary
   * @param name file name
   */
  export const postSummaryToChannel = async (summary: string, name: string): Promise<NotificationMessageResult> => {
    let message;
      message = await constructMemoDocCreatedMessage(summary, name);
  
    const messageResults: NotificationMessageResult = {
      message: message,
      response: await sendMessage(slackChannelId, message)
    };
    return messageResults;
  }
}

export default SlackUtilities;