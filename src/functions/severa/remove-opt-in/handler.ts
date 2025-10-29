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
      } catch (error) {
        if (process.env.NODE_ENV !== "production") {
          console.debug(`Failed to get keyword ID for user ${severaUserId}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      if (keywordGuid) {
        try {
          await severaApi.removeKeyWordFromUser(severaUserId, keywordGuid);
        } catch (error) {
          return {
            statusCode: 502,
            body: JSON.stringify({ error: `Failed to remove Severa opt-in keyword: ${error instanceof Error ? error.message : String(error)}` }),
          };
        }
      }
    }

    try {
      await keycloakApi.removeUserAttribute(keycloakUserId, "severaUserId");
    } catch (error) {
      console.warn(`Failed to remove severaUserId attribute for user ${keycloakUserId}: ${error instanceof Error ? error.message : String(error)}`);
    }

    /**
     * If direct removal fails, fallback by clearing the 'severaUserId' attribute
     * using updateUserAttributes method to ensure the user is opted out.
     */

    try {
      await keycloakApi.removeUserAttribute(keycloakUserId, "isSeveraOptIn");
    } catch (error) {
      console.warn(`Failed to remove isSeveraOptIn attribute for user ${keycloakUserId}: ${error instanceof Error ? error.message : String(error)}`);
      try {
        await keycloakApi.updateUserAttributes(keycloakUserId, { severaUserId: [] });
      } catch (updateError) {
        return {
          statusCode: 502,
          body: JSON.stringify({ error: `Failed to remove/clear isSeveraOptIn attribute: ${updateError instanceof Error ? updateError.message : String(updateError)}` }),
        };
      }
    }

    return { statusCode: 200, body: JSON.stringify({ message: "Opt-out completed" }) };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
    };
  }
};

export const main = middyfy(removeSeveraOptInHandler);