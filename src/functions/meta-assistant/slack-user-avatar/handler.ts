import { ValidatedEventAPIGatewayProxyEvent } from "@libs/api-gateway";
import { middyfy } from "@libs/lambda";
import SlackUtilities from "src/meta-assistant/slack/slack-utils";

/**
 * Parameters for lambda
 */
export interface SlackUsersAvatarsParameters {
  email: string,
}

/**
 * Response schema for lambda
 */
export interface Response {
  image_original: string,
	image_24: string,
	image_32: string,
}

/**
 * Lambda to receive user's slack avatar by email
 * 
 * @param event event
 */
const getSlackUserAvatar: ValidatedEventAPIGatewayProxyEvent<any> = async event => {
  const { queryStringParameters } = event;
	
  if (!queryStringParameters && !queryStringParameters.email) {
    return {
      statusCode: 400,
      body: "Missing parameters"
    };
  }

  const slackUsers = await SlackUtilities.getSlackUsers();
	const selectedUser = slackUsers.find((user) => user.name === queryStringParameters.email.split("@")[0])
  const response : Response = {
    image_original: selectedUser && selectedUser.profile.image_original,
    image_24: selectedUser && selectedUser.profile.image_24,
    image_32: selectedUser && selectedUser.profile.image_32
  }

  return {
    statusCode: 200,
    body: JSON.stringify(response)
  };
}

export const main = middyfy(getSlackUserAvatar);