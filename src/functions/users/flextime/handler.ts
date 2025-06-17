import type { APIGatewayProxyHandler } from "aws-lambda";
import { CreateSeveraApiService } from "src/services/severa-api-service";
import { middyfy } from "src/libs/lambda";

/**
 * Lambda handler for listing users with their flextime data.
 * Only returns users who have opted in to Severa integration.
 * 
 * @param event - API Gateway proxy event containing query parameters
 * @returns Promise resolving to API Gateway proxy result with user flextime data
 */
export const listUsersFlextimeHandler: APIGatewayProxyHandler = async (event) => {
  try {
    const keywordId = event.queryStringParameters?.keywordId;
    if (!keywordId) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          code: 400,
          message: "keywordId query parameter is required"
        })
      };
    }
    const api = CreateSeveraApiService();
    const optedInUsers = await api.getOptInUsers();
    if (!optedInUsers || optedInUsers.length === 0) {
      return {
        statusCode: 200,
        body: JSON.stringify([])
      };
    }
    const usersWithFlextime = await Promise.allSettled(
      optedInUsers.map(async (severaUser) => {
        try {
          const flextime = await api.getFlextimeBySeveraUserId(severaUser.guid);
          return {
            user: {
              id: severaUser.guid,
              firstName: severaUser.firstName || "",
              lastName: severaUser.lastName || "",
              email: severaUser.email || "",
              attributes: {
                severaUserId: severaUser.guid,
                isActive: true
              }
            },
            flextime: {
              totalFlextimeBalance: flextime?.totalFlextimeBalance || 0,
              monthFlextimeBalance: flextime?.monthFlextimeBalance || 0
            }
          };
        } catch (error) {
          throw error;
        }
      })
    );
    const successfulResults = usersWithFlextime
      .filter((result): result is PromiseFulfilledResult<any> => result.status === "fulfilled")
      .map(result => result.value);
    return {
      statusCode: 200,
      body: JSON.stringify(successfulResults)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        code: 500,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error"
      })
    };
  }
};

/**
 * Main export with middleware wrapper for the users flextime handler.
 */
export const main = middyfy(listUsersFlextimeHandler);