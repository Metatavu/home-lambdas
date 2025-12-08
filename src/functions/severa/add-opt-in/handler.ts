import type { APIGatewayProxyHandler } from "aws-lambda";
import { CreateSeveraApiService } from "src/services/severa-api-service";
import { CreateKeycloakApiService } from "src/database/services/keycloak-api-service";
import { middyfy } from "src/libs/lambda";

/**
 * Lambda handler for adding a user's Severa opt-in (keyword and Keycloak attribute).
 *
 * @param event API Gateway event containing the userId path parameter.
 */
export const addSeveraOptInHandler: APIGatewayProxyHandler = async (event) => {
  const keycloakUserId = event.pathParameters?.userId;
  if (!keycloakUserId) {
    return { 
      statusCode: 400, 
      body: JSON.stringify({ message: "Keycloak user id is required" }) 
    };
  }

  try {
    const severaApi = CreateSeveraApiService();
    const keycloakApi = CreateKeycloakApiService();

    // Get severaUserId from Keycloak
    let severaUserId: string | undefined;
    try {
      const severaUser = await severaApi.fetchUserByKeycloakId(keycloakUserId);
      severaUserId = severaUser.guid;
    } catch {
      return { 
        statusCode: 502, 
        body: JSON.stringify({ message: "Failed to fetch Severa user by Keycloak id." }) 
      };
    }

    await keycloakApi.updateUserAttributes(keycloakUserId, { severaUserId: [severaUserId] });

    // Add the isSeveraOptIn keyword to Severa user
    const keyword = await severaApi.checkKeywordExists("isSeveraOptIn");
    const keywordGuid = keyword.guid;
    if (!keywordGuid) {
      return { 
        statusCode: 502, 
          body: JSON.stringify({ message: "Failed to add the isSeveraOptIn keyword." }) 
        };
      }

    await severaApi.updateSeveraOptInKeyword(severaUserId, "true", keywordGuid);

    return { 
      statusCode: 200, 
      body: JSON.stringify({ message: "Opt-in completed." }) 
    };
  } catch {
    return { 
      statusCode: 500, 
      body: JSON.stringify({ message: "Opt-in failed." }) 
    };
  }
};

export const main = middyfy(addSeveraOptInHandler);