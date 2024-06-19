import { ValidatedEventAPIGatewayProxyEvent } from "@libs/api-gateway";
import Auth from "src/meta-assistant/auth/auth-provider";
import SlackUtilities from "src/meta-assistant/slack/slack-utils";
import TimeBankApiProvider from "src/meta-assistant/timebank/timebank-api";

/**
 * Response schema for lambda
 */
export interface Response {
  personId: number;
  image_original: string;
}

/**
 * Cache for Slack users data
 */
let slackUsersCache: { users: any[], expiresAt: number } | null = null;

/**
 * Exponential backoff function
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Fetch Slack users with retry and exponential backoff
 */
const fetchSlackUsersWithRetry = async (retries = 5): Promise<any[]> => {
  let attempt = 0;
  while (attempt < retries) {
    try {
      const slackUsers = await SlackUtilities.getSlackUsers();
      return slackUsers;
    } catch (error) {
      if (error.data && error.data.error === 'ratelimited') {
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`Rate limited. Retrying in ${delay / 1000} seconds...`);
        await sleep(delay);
        attempt++;
      } else {
        throw error;
      }
    }
  }
  throw new Error('Max retries reached');
};

/**
 * Lambda to receive user's slack avatar by email
 */
const getSlackUserAvatar: ValidatedEventAPIGatewayProxyEvent<any> = async () => {
  const { accessToken } = await Auth.getAccessToken();
  if (!accessToken) {
    throw new Error("Timebank authentication failed");
  }

  try {
    const timebankUsers = await TimeBankApiProvider.getTimebankUsers(accessToken);
    if (!timebankUsers) {
      throw new Error("No persons retrieved from Timebank");
    }

    const cacheTTL = 3600 * 1000;
    const currentTime = Date.now();

    if (!slackUsersCache || slackUsersCache.expiresAt < currentTime) {
      const slackUsers = await fetchSlackUsersWithRetry();
      slackUsersCache = { users: slackUsers, expiresAt: currentTime + cacheTTL };
    }

    const images: Response[] = [];
    for (const timebankUser of timebankUsers) {
      const emailPrefix = timebankUser.email.split("@")[0];
      const slackUser = slackUsersCache.users.find(user => user.name === emailPrefix);
      if (slackUser) {
        images.push({ personId: timebankUser.id, image_original: slackUser.profile.image_original });
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify(images)
    };
  } catch (error) {
    return {
      statusCode: 500,
      message: `Error while receiving users data: ${error.message}`,
      body: JSON.stringify([])
    };
  }
};

export const main = getSlackUserAvatar;
