import { WebClient, LogLevel, ChatPostMessageResponse } from "@slack/web-api";
import Config from "src/app/config";
import { VacationDetails } from "src/types";

const slackConfig = Config.get().slack;

if (!slackConfig.botToken) {
    throw new Error("Missing Slack bot token in configuration");
}

const slackClient = new WebClient(slackConfig.botToken, { logLevel: LogLevel.DEBUG });

/**
 * Format a date string from yyyy-mm-dd to dd-mm-yyyy
 *
 * @param date - Date string in yyyy-mm-dd format
 * @returns Date string in dd-mm-yyyy format
 */
function formatDate(date: string): string {
    return date.split("-").reverse().join("-");
}

/**
 * Find Slack user by email (requires users:read.email scope)
 *
 * @param email - Email address of the Slack user
 * @returns Slack user object
 */
async function findSlackUserByEmail(email: string) {
    const result = await slackClient.users.lookupByEmail({ email });
    if (!result.ok || !result.user) {
        throw new Error(`Slack user not found for email: ${email}`);
    }
    return result.user;
}

/**
 * Open a direct message channel with a Slack user
 *
 * @param userId - Slack user ID
 * @returns Channel ID for the direct message
 */
async function openDirectMessageChannel(userId: string): Promise<string> {
    const result = await slackClient.conversations.open({ users: userId });
    if (!result.ok || !result.channel) {
        throw new Error(`Failed to open DM with user ${userId}: ${result.error}`);
    }
    return result.channel.id;
}

/**
 * Send a Slack message to an admin or user
 *
 * @param channelId - Slack channel ID
 * @param message - Message text to send
 * @returns Slack API response for the message
 */
async function sendSlackMessage(channelId: string, message: string): Promise<ChatPostMessageResponse> {
    return await slackClient.chat.postMessage({
        channel: channelId,
        text: message,
    });
}

/**
 * Generic function to notify admins about a vacation
 *
 * @param vacationDetails - Vacation details for the notification
 * @param messageHeader - Message header to display
 */
async function notifyAdminsVacation(
    vacationDetails: VacationDetails,
    messageHeader: string
) {
    const adminUserIds = slackConfig.adminUsers;

    const message = `
      ${messageHeader}
      Applicant: ${vacationDetails.user}
      Start date: ${formatDate(vacationDetails.startDate)}
      End date: ${formatDate(vacationDetails.endDate)}
      Type: ${vacationDetails.type || "Not provided"}
    `;

    for (const userId of adminUserIds) {
        const dmChannelId = await openDirectMessageChannel(userId.trim());
        await sendSlackMessage(dmChannelId, message);
    }
}

/**
 * Notify admins when a vacation is submitted
 *
 * @param vacationDetails - Details of the submitted vacation
 */
export async function notifyAdminsVacationSubmittedSlack(vacationDetails: VacationDetails ) {
    await notifyAdminsVacation(vacationDetails, ":new: *New Vacation Submitted* :new:");
}

/**
 * Notify admins when a vacation request is deleted
 *
 * @param vacationDetails - Details of the deleted vacation
 */
export async function notifyAdminsVacationDeletedSlack(vacationDetails: VacationDetails ) {
    await notifyAdminsVacation(vacationDetails, ":x: *Vacation Request Deleted* :x:");
}

/**
 * Notify a user when their vacation status is updated
 *
 * @param userEmail - Email of the user
 * @param updatedStatus - New status of the vacation
 * @returns Slack API response for the message
 */
export async function notifyUserVacationStatusUpdatedSlack(
    userEmail: string,
    updatedStatus: string
): Promise<ChatPostMessageResponse> {
    const user = await findSlackUserByEmail(userEmail);

    if (!user || !user.id) {
        throw new Error(`Slack user not found for email: ${userEmail}`);
    }

    const dmChannelId = await openDirectMessageChannel(user.id);

    const message = `
      :information_source: Your vacation status has been updated to *${updatedStatus}*.
      If you have questions, please contact your admin.
    `;

    return await sendSlackMessage(dmChannelId, message);
}