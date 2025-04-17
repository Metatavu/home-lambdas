import Auth from "src/meta-assistant/auth/auth-provider";
import SlackUtilities from "src/meta-assistant/slack/slack-utils";
let slackUsersCache = null;
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const fetchSlackUsersWithRetry = async (retries = 5) => {
    let attempt = 0;
    while (attempt < retries) {
        try {
            const slackUsers = await SlackUtilities.getSlackUsers();
            return slackUsers;
        }
        catch (error) {
            if (error.data && error.data.error === 'ratelimited') {
                const delay = Math.pow(2, attempt) * 1000;
                console.log(`Rate limited. Retrying in ${delay / 1000} seconds...`);
                await sleep(delay);
                attempt++;
            }
            else {
                throw error;
            }
        }
    }
    throw new Error('Max retries reached');
};
const getSlackUserAvatar = async () => {
    const { accessToken } = await Auth.getAccessToken();
    if (!accessToken) {
        throw new Error("User authentication failed");
    }
    try {
        const cacheTimeToExpire = 3600 * 1000;
        const currentTime = Date.now();
        if (!slackUsersCache) {
            console.log("Slack users cache is null. Fetching new data...");
        }
        else if (slackUsersCache.expiresAt < currentTime) {
            console.log("Slack users cache is expired. Fetching new data...");
        }
        else {
            console.log("Using cached Slack users data.");
        }
        if (!slackUsersCache || slackUsersCache.expiresAt < currentTime) {
            const slackUsers = await fetchSlackUsersWithRetry();
            slackUsersCache = { users: slackUsers, expiresAt: currentTime + cacheTimeToExpire };
        }
        const images = [];
        return {
            statusCode: 200,
            body: JSON.stringify(images)
        };
    }
    catch (error) {
        return {
            statusCode: 500,
            message: `Error while receiving users data: ${error.message}`,
            body: JSON.stringify([])
        };
    }
};
export const main = getSlackUserAvatar;
//# sourceMappingURL=handler.js.map