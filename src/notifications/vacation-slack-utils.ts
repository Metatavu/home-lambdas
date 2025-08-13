import { WebClient, LogLevel, ChatPostMessageResponse } from "@slack/web-api";
import * as dotenv from "dotenv";
dotenv.config();

const SLACK_BOT_TOKEN = process.env.METATAVU_BOT_TOKEN;
if (!SLACK_BOT_TOKEN) {
    throw new Error("Missing METATAVU_BOT_TOKEN in environment variables");
}

const slackClient = new WebClient(SLACK_BOT_TOKEN, { logLevel: LogLevel.DEBUG });

/**
 * Find Slack user by email (requires users:read.email scope)
 */
async function findSlackUserByEmail(email: string) {
    const result = await slackClient.users.lookupByEmail({ email });
    if (!result.ok || !result.user) {
        throw new Error(`Slack user not found for email: ${email}`);
    }
    return result.user;
}

/**
 * Open a direct message channel with a user
 */
async function openDirectMessageChannel(userId: string): Promise<string> {
    const result = await slackClient.conversations.open({ users: userId });
    if (!result.ok || !result.channel) {
        throw new Error(`Failed to open DM with user ${userId}: ${result.error}`);
    }
    return result.channel.id;
}

/**
 * Send Slack message to a channel or user ID
 */
async function sendSlackMessage(channelId: string, message: string): Promise<ChatPostMessageResponse> {
    return await slackClient.chat.postMessage({
        channel: channelId,
        text: message,
    });
}

/**
 * Generic function to notify admins about a vacation
 */
async function notifyAdminsVacation(
    vacationDetails: { user: string; startDate: string; endDate: string; type?: string },
    messageHeader: string
) {
    const adminUserIds = process.env.ADMIN_SLACK_USERS?.split(",") || [];

    if (adminUserIds.length === 0) {
        throw new Error("No admin Slack user IDs provided in ADMIN_SLACK_USERS");
    }

    const message = `
        ${messageHeader}
        User: ${vacationDetails.user}
        Start date: ${vacationDetails.startDate}
        End date: ${vacationDetails.endDate}
        Type: ${vacationDetails.type || "Not provided"}
    `;

    for (const userId of adminUserIds) {
        const dmChannelId = await openDirectMessageChannel(userId.trim());
        await sendSlackMessage(dmChannelId, message);
    }
}

/**
 * Notify admins when a vacation is submitted
 */
export async function notifyAdminsVacationSubmitted(vacationDetails: Parameters<typeof notifyAdminsVacation>[0]) {
    await notifyAdminsVacation(vacationDetails, ":new: *New Vacation Submitted* :new:");
}

/**
 * Notify admins when a vacation request is deleted
 */
export async function notifyAdminsVacationDeleted(vacationDetails: Parameters<typeof notifyAdminsVacation>[0]) {
    await notifyAdminsVacation(vacationDetails, ":x: *Vacation Request Deleted* :x:");
}


/**
 * Notify user when their vacation status is updated
 */
export async function notifyUserVacationStatusUpdated(userEmail: string, updatedStatus: string) {
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