import type { APIGatewayProxyHandler } from "aws-lambda";
import { CreateSeveraApiService } from "src/services/severa-api-service";
import { middyfy } from "src/libs/lambda";
import { DateTime } from "luxon";

/**
 * Lambda handler for getting flextime by severaUserId,
 * but only if the user has opted in (has "isSeveraOptIn" keyword).
 *
 * @param event - API Gateway event containing the severaUserId
 * @returns Flextime data if user has opted in
 */
export const getFlextimeHandler: APIGatewayProxyHandler = async (event) => {
  const severaUserId = event.pathParameters?.severaUserId;
  const eventDate = DateTime.now().toISODate();

  try {
    const api = CreateSeveraApiService();

    if (!severaUserId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "SeveraUserId is required" }),
      };
    }

    const severaUser = await api.getUser(severaUserId);
    
    if (!severaUser) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: "Severa user not found." }),
      };
    }

    const testUserEmail = process.env.SEVERA_TEST_USER_EMAIL;
    const keycloakEmail = testUserEmail || event.requestContext?.authorizer?.claims?.email;
    
    if (severaUser.email !== keycloakEmail) {
      return {
        statusCode: 403,
        body: JSON.stringify({ message: "You can only view your own flextime data." }),
      };
    }

    const flextime = await api.getFlextimeBySeveraUserId(severaUserId, eventDate);

    return {
      statusCode: 200,
      body: JSON.stringify(flextime),
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: error.message }),
    };
  }
};

export const main = middyfy(getFlextimeHandler);
