import type { APIGatewayProxyHandler } from "aws-lambda";
import { CreateSeveraApiService } from "src/services/severa-api-service";
import { middyfy } from "src/libs/lambda";

/**
 * Type representing user with their flextime data.
 */
type UserWithFlextime = {
  user: {
    id: string;
    firstName: string;
    lastName: string;
  };
  flextime: {
    totalFlextimeBalance: number;
    monthFlextimeBalance: number;
  };
};
/**
 * Lambda handler for listing users with their flextime data.
 * Only returns users who have opted in to Severa integration.
 * 
 * @param event - API Gateway proxy event containing query parameters
 * @returns Promise resolving to API Gateway proxy result with user flextime data
 */
export const listUsersFlextimeHandler: APIGatewayProxyHandler = async () => {
  try {
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
          //TODO: This should be typed according to the spec response type from the severa general spec generated client
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
          const statusCode = error instanceof Error && (error as any).statusCode ? (error as any).statusCode : 500;
          return {
            statusCode,
            body: JSON.stringify({
              code: statusCode,
              message: `Failed to fetch flextime for user ${severaUser.guid}`,
              error: error instanceof Error ? error.message : "Unknown error"
            })
          };
        }
      })
    );
    /**
     * Extract only the successful flextime results from the settled promises
     */
    const successfulResults = usersWithFlextime
      .filter((result): result is PromiseFulfilledResult<UserWithFlextime> => result.status === "fulfilled")
      .map((result) => result.value);
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