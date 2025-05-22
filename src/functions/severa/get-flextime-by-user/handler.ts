import type { APIGatewayProxyHandler } from "aws-lambda";
import { CreateSeveraApiService } from "src/services/severa-api-service";
import { middyfy } from "src/libs/lambda";
import { DateTime } from "luxon";

/**
 * Lambda handler for getting flextime by Severa user ID,
 * but only if the user has opted in (has "isOptIn" keyword).
 *
 * @param event - API Gateway event containing the Severa user ID
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

    const isOptedIn = severaUser.keywords?.some(
      (keyword) => keyword.value === "isSeveraOptIn"
    );

    if (!isOptedIn) {
      return {
        statusCode: 403,
        body: JSON.stringify({ message: "User has not opted in to flextime tracking." }),
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
