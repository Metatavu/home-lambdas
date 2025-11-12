import type { APIGatewayProxyHandler } from "aws-lambda";
import { CreateSeveraApiService } from "src/services/severa-api-service";
import { CreateKeycloakApiService } from "src/database/services/keycloak-api-service";
import { middyfy } from "src/libs/lambda";

/**
 * Lambda handler for removing a user's Severa opt-in (keyword and Keycloak attribute).
 * 
 * @param event API Gateway event containing the userId path parameter.
 */
export const removeSeveraOptInHandler: APIGatewayProxyHandler = async (event) => {
  const keycloakUserId = event.pathParameters?.userId;

  if (!keycloakUserId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "KeycloakUserId is required" }),
    };
  }

  try {
    const severaApi = CreateSeveraApiService();
    const keycloakApi = CreateKeycloakApiService();

    /**
     * Fetch Keycloak user and severaUserId attribute
     */
    let keycloakUser = await keycloakApi.findUser(keycloakUserId);
    if (Array.isArray(keycloakUser)) keycloakUser = keycloakUser[0];
    const attrs = (keycloakUser as any)?.attributes || {};
    const severaUserId: string | undefined = Array.isArray(attrs.severaUserId)
      ? attrs.severaUserId[0]
      : attrs.severaUserId;

    /**
     * If we have Severa user id, try to remove the opt-in keyword from Severa
     */
    if (severaUserId) {
      let keywordGuid: string | null = null;
      try {
        keywordGuid = await severaApi.getKeywordIdForUser(severaUserId, "isSeveraOptIn");
      } catch {
        keywordGuid = null;
      }

      if (keywordGuid) {
        try {
          await severaApi.removeKeyWordFromUser(severaUserId, keywordGuid);
        } catch {
          return {
            statusCode: 502,
            body: JSON.stringify({ message: "Failed to remove isSeveraOptIn keyword from Severa user." })
          };
        }
      }
    }

    try {
      await keycloakApi.removeUserAttribute(keycloakUserId, "isSeveraOptIn");
    } catch {
      try {
        await keycloakApi.updateUserAttributes(keycloakUserId, { isSeveraOptIn: [] });
      } catch {
        return {
          statusCode: 502,
          body: JSON.stringify({ message: "Failed to remove/clear isSeveraOptIn attribute." })
        };
      } 
    }

    /**
     * If direct removal fails, fallback by clearing the 'severaUserId' attribute
     * using updateUserAttributes method to ensure the user is opted out.
     */

    try {
      await keycloakApi.removeUserAttribute(keycloakUserId, "severaUserId");
    } catch {
      try {
        await keycloakApi.updateUserAttributes(keycloakUserId, { severaUserId: [] });
      } catch {
        return {
          statusCode: 502,
          body: JSON.stringify({ message: "Failed to remove severaUserId attribute." }),
        };
      }
    }

    return { statusCode: 200, body: JSON.stringify({ message: "Opt-out completed" }) };
  } catch {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Severa opt-out failed." }),
    };
  }
};

export const main = middyfy(removeSeveraOptInHandler);