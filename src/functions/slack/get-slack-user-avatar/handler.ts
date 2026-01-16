import type { APIGatewayProxyEvent, APIGatewayProxyHandler } from "aws-lambda";
import { SlackAvatarResponse } from "src/generated/homeLambdasModels/model/slackAvatarResponse";
import SlackUtilities from "src/meta-assistant/slack/slack-utils";

/**
 * Lambda to receive user's slack avatar by email
 *
 * @param event event with query parameter email
 * @return SlackAvatarResponse object with image URL or reason for failure
 */
const getSlackUserAvatarHandler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent) => {
  try {
    const rawEmail = event.queryStringParameters?.email;

    if (!rawEmail) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Query parameter 'email' is required" })
      };
    }

    const email = decodeURIComponent(rawEmail.trim().toLowerCase());
    const slackUser = await SlackUtilities.getSlackUserByEmail(email);
    const image_original = slackUser?.profile?.image_original ?? null;
    let reason: SlackAvatarResponse.ReasonEnum;

    if (!image_original) {
      reason = slackUser
        ? SlackAvatarResponse.ReasonEnum.NoAvatar
        : SlackAvatarResponse.ReasonEnum.EmailMismatch;
    }

    const responseBody: SlackAvatarResponse = { imageOriginal: image_original };
    if (reason) responseBody.reason = reason;

    return {
      statusCode: 200,
      body: JSON.stringify(responseBody)
    };
  } catch (error) {
    console.error("getSlackUserAvatarHandler failed", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Internal server error"
      })
    };
  }
};

export const main = getSlackUserAvatarHandler;
