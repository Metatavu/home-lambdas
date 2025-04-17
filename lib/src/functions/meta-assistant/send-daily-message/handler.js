import { formatJSONResponse } from "src/libs/api-gateway";
import SlackUtilities from "src/meta-assistant/slack/slack-utils";
import TimeUtilities from "src/meta-assistant/generic/time-utils";
import { CreateSeveraApiService } from "src/services/severa-api-service";
export const sendDailyMessageHandler = async () => {
    try {
        const severaApi = CreateSeveraApiService();
        const severaUsers = await severaApi.getOptInUsers();
        const previousWorkDays = TimeUtilities.getPreviousTwoWorkdays();
        const workHours = await severaApi.getPreviousWorkHours();
        if (!severaUsers) {
            throw new Error("No users retrieved from Severa");
        }
        const workHoursUserGuids = workHours.map(hour => hour.user.guid);
        const filteredSeveraUsers = severaUsers.filter(user => workHoursUserGuids.includes(user.guid));
        const combinedUserData = await Promise.all(filteredSeveraUsers.map(async (user) => {
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
        }));
        const messageSent = await SlackUtilities.postDailyMessageToUsers(combinedUserData, previousWorkDays);
        return {
            message: "Daily messages constructed successfully",
            data: messageSent
        };
    }
    catch (error) {
        console.error(error.toString());
        return {
            message: `Error while sending slack message: ${error}`
        };
    }
};
const sendDailyMessage = async (event) => (formatJSONResponse({
    ...await sendDailyMessageHandler(),
    event: event
}));
export const main = sendDailyMessage;
//# sourceMappingURL=handler.js.map