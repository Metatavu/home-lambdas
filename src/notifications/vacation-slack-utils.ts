import { WebClient, LogLevel, ChatPostMessageResponse } from "@slack/web-api";
import * as dotenv from "dotenv";
dotenv.config();

const SLACK_BOT_TOKEN = process.env.METATAVU_BOT_TOKEN;
if (!SLACK_BOT_TOKEN) {
    throw new Error("Missing METATAVU_BOT_TOKEN in environment variables");
}

const slackClient = new WebClient(SLACK_BOT_TOKEN, { logLevel: LogLevel.DEBUG });

/**
 * Get list of Slack users
 */
async function getSlackUsers() {
    const result = await slackClient.users.list();
    if (!result.ok) throw new Error(`Failed to get Slack users: ${result.error}`);
    return result.members || [];
}

/**
 * Find Slack user by full name 
 */
async function findSlackUserByFullName(fullName: string) {
    const users = await getSlackUsers();
    return users.find(user => user.real_name === fullName);
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
 * Notify admins when a vacation is submitted
 */
export async function notifyAdminsVacationSubmitted(
    vacationDetails: {
        userId: string;
        startDate: string;
        endDate: string;
        type?: string;
    }
) {
    const adminUserIds = process.env.ADMIN_SLACK_USERS?.split(",") || [];

    if (adminUserIds.length === 0) {
        throw new Error("No admin Slack user IDs provided in ADMIN_SLACK_USERS");
    }

    const message = `
        :new: *New Vacation Submitted* :new:
        User ID: ${vacationDetails.userId}
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
 * Notify user when their vacation status is updated
 */
export async function notifyUserVacationStatusUpdated(userFullName: string, updatedStatus: string) {
    const user = await findSlackUserByFullName(userFullName);

    if (!user || !user.id) {
        throw new Error(`Slack user not found for name: ${userFullName}`);
    }

    const dmChannelId = await openDirectMessageChannel(user.id);

    const message = `
    :information_source: Your vacation status has been updated to *${updatedStatus}*.
    If you have questions, please contact your admin.
    `;

    return await sendSlackMessage(dmChannelId, message);
}

/**
 * Notify admins when a vacation request is deleted
 */
export async function notifyAdminsVacationDeleted(
    vacationDetails: {
        userId: string;
        startDate: string;
        endDate: string;
        type?: string;
    }
    ) {
    const adminUserIds = process.env.ADMIN_SLACK_USERS?.split(",") || [];

    if (adminUserIds.length === 0) {
        throw new Error("No admin Slack user IDs provided in ADMIN_SLACK_USERS");
    }

    const message = `
        :x: *Vacation Request Deleted* :x:
        User ID: ${vacationDetails.userId}
        Start date: ${vacationDetails.startDate}
        End date: ${vacationDetails.endDate}
        Type: ${vacationDetails.type || "Not provided"}
    `;

    for (const userId of adminUserIds) {
        const dmChannelId = await openDirectMessageChannel(userId.trim());
        await sendSlackMessage(dmChannelId, message);
    }
}
