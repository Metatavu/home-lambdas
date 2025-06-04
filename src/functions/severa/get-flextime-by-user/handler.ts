import type { APIGatewayProxyHandler } from "aws-lambda";
import { CreateSeveraApiService } from "src/services/severa-api-service";
import { middyfy } from "src/libs/lambda";
import { DateTime } from "luxon";
import Config from "src/app/config";

/**
 * Lambda handler for getting flextime by severaUserId,
 * but only if the user has opted in (has "isSeveraOptIn" keyword).
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

    try {
      await api.getKeywordIdForUser(severaUserId, "isSeveraOptIn");
    } catch {
      return {
        statusCode: 403,
        body: JSON.stringify({ message: "User has not opted in." }),
      };
    }

    const severaUser = await api.getUser(severaUserId);

    const testUserEmail = Config.get().testUser.email;
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
