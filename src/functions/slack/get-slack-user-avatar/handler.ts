import type { APIGatewayProxyEvent, APIGatewayProxyHandler } from "aws-lambda";
import Auth from "src/meta-assistant/auth/auth-provider";
import SlackUtilities from "src/meta-assistant/slack/slack-utils";

/**
 * Lambda to receive user's slack avatar by email
 *
 * @param event event containing path parameter 'email'
 * @return A response object with statuscode and avatar URL
 */
const getSlackUserAvatarHandler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent) => {
  try {
    const { accessToken } = await Auth.getAccessToken();
    if (!accessToken) {
      throw new Error("User authentication failed");
    }

    const rawEmail = event.pathParameters?.email;

    if (!rawEmail) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Path parameter 'email' is required" })
      };
    }

    const email = decodeURIComponent(rawEmail.trim().toLowerCase());
    const slackUser = await SlackUtilities.getSlackUserByEmail(email);

    if (!slackUser?.profile?.image_original) {
      return {
        statusCode: 204,
        body: ""
      };
    }

    const response = {
      image_original: slackUser.profile.image_original
    };

    return {
      statusCode: 200,
      body: JSON.stringify(response)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Internal server error",
        details: error.message
      })
    };
  }
};

export const main = getSlackUserAvatarHandler;
