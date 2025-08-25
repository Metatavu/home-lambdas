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
    // Comment: keywowordID not necessary
    // const keywordId = event.queryStringParameters?.keywordId;
    /*
      return {
        statusCode: 400,
        body: JSON.stringify({
          code: 400,
          message: "keywordId query parameter is required"
        })
      };
    }
    */
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
          // TODO: This should be typed according to the spec response type for the lambda function
          // Spec in the lambdas for the future
          const flextime = await api.getFlextimeBySeveraUserId(severaUser.guid);
          return {
            user: {
              id: severaUser.guid,
              firstName: severaUser.firstName || "",
              lastName: severaUser.lastName || "",
            },
            flextime: {
              totalFlextimeBalance: flextime?.totalFlextimeBalance || 0,
              monthFlextimeBalance: flextime?.monthFlextimeBalance || 0
            }
          };
        } catch (error) {
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
            flextime: null,
            error: true,
            statusCode: 500,
            message: `Failed to fetch flextime for user ${severaUser.guid}: ${error instanceof Error ? error.message : "Unknown error"}`
          };
        }
      })
    );
    const results = usersWithFlextime.map((result) => 
      result.status === "fulfilled" ? result.value : { error: true, message: "Unexpected promise rejection" }
    );
    return {
      statusCode: 200,
      body: JSON.stringify(results)
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