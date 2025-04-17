import { LogLevel, WebClient } from "@slack/web-api";
import { DateTime } from "luxon";
import TimeUtilities from "../generic/time-utils";
import MessageUtilities from "../generic/message-utils";
var SlackUtilities;
(function (SlackUtilities) {
    SlackUtilities.client = new WebClient(process.env.METATAVU_BOT_TOKEN, {
        logLevel: LogLevel.DEBUG
    });
    const slackOverride = process.env.SLACK_USER_OVERRIDE ? process.env.SLACK_USER_OVERRIDE.split(",") : undefined;
    const slackChannelId = process.env.CHANNEL_ID;
    SlackUtilities.getSlackUsers = async () => {
        const result = await SlackUtilities.client.users.list();
        if (!result.ok)
            throw new Error(`Error while loading slack users list, ${result.error}`);
        return result.members;
    };
    const getSlackUserId = async (createdBy) => {
        try {
            const users = await SlackUtilities.getSlackUsers();
            const matchedUser = users.find(user => user.real_name === createdBy);
            if (!matchedUser)
                throw new Error(`User with name ${createdBy} not found in Slack`);
            return matchedUser.id;
        }
        catch (error) {
            console.error(`Error finding user ID for ${createdBy}:`, error);
            return;
        }
    };
    SlackUtilities.findSlackUser = async (firstName, lastName) => {
        try {
            const users = await SlackUtilities.getSlackUsers();
            return users.find(slackUser => slackUser.profile.first_name === firstName && slackUser.profile.last_name === lastName);
        }
        catch (error) {
            console.error(`Error finding user ID for ${firstName} ${lastName}:`, error);
            return;
        }
    };
    const constructDailyMessage = (user, numberOfToday) => {
        const { firstName, date, minimumBillableRate } = user;
        const { totalLoggedTime, expectedHours, projectTime, totalBillableTime, nonBillableProject, } = TimeUtilities.handleTimeFormatting(user);
        const { message, billableHoursPercentage } = MessageUtilities.calculateWorkedTimeAndBillableHours(user);
        const displayDate = DateTime.fromISO(date).toFormat("dd.MM.yyyy");
        const customMessage = `
      Hi ${firstName},
      ${numberOfToday === 1 ? "Last friday" : "Yesterday"} (${displayDate}) you worked ${totalLoggedTime} with an expected time of ${expectedHours}.
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
    const constructWeeklySummaryMessage = (user, weekStart, weekEnd, vacationTime) => {
        const { name, firstName } = user;
        user.selectedWeek.expected -= vacationTime;
        const week = Number(user.selectedWeek.timePeriod.split(",")[2]);
        const minimumBillableRate = 75;
        const startDate = DateTime.fromISO(weekStart).toFormat("dd.MM.yyyy");
        const endDate = DateTime.fromISO(weekEnd).toFormat("dd.MM.yyyy");
        const { logged, loggedProject, expected, internal, billableProject, nonBillableProject } = TimeUtilities.handleTimeFormatting(user.selectedWeek);
        const { message, billableHoursPercentage } = MessageUtilities.calculateWorkedTimeAndBillableHours(user.selectedWeek);
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
    const constructMemoDocCreatedMessage = async (summary, name) => {
        const cleanName = name.slice(0, -4);
        const message = `
:checkered_flag: New summary *${cleanName}* is available: \n\`${summary.split("|")[0]}\`
    `;
        return message;
    };
    const sendMessage = (channelId, message) => (SlackUtilities.client.chat.postMessage({
        channel: channelId,
        text: message
    }));
    SlackUtilities.postDailyMessageToUsers = async (dailyCombinedData, previousWorkDays) => {
        const { numberOfToday } = previousWorkDays;
        const messageResults = [];
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
    SlackUtilities.postWeeklyMessageToUsers = async (weeklyCombinedData, timeRegistrations, previousWorkDays, nonProjectTimes) => {
        const { weekStartDate, weekEndDate } = TimeUtilities.getlastWeeksDates();
        const { yesterday, today } = previousWorkDays;
        const messageResults = [];
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
    SlackUtilities.postSummaryToChannel = async (summary, name) => {
        let message;
        message = await constructMemoDocCreatedMessage(summary, name);
        const messageResults = {
            message: message,
            response: await sendMessage(slackChannelId, message)
        };
        return messageResults;
    };
})(SlackUtilities || (SlackUtilities = {}));
export default SlackUtilities;
//# sourceMappingURL=slack-utils.js.map