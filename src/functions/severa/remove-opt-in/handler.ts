import type { APIGatewayProxyHandler } from "aws-lambda";
import { middyfy } from "src/libs/lambda";
import { CreateKeycloakApiService } from "src/services/keycloak-api-service";
import { CreateSeveraApiService } from "src/services/severa-api-service";
import { getLookupEmail } from "src/utils/severa";

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
      body: JSON.stringify({ message: "KeycloakUserId is required" })
    };
  }

  try {
    const severaApi = CreateSeveraApiService();
    const keycloakApi = CreateKeycloakApiService();

    // Fetch Keycloak user and severaUserId attribute
    let severaUserId: string | undefined;
    let keycloakUserEmail: string | undefined;
    const keycloakUser = await keycloakApi.findUser(keycloakUserId);
    if (!keycloakUser) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: "Keycloak user not found." })
      };
    }

    const attr = keycloakUser?.attributes || {};
    severaUserId = attr.severaUserId?.[0];
    keycloakUserEmail = keycloakUser.email;

    // If severaUserId missing, try resolving by email using shared util
    if (!severaUserId) {
      const lookupEmail = getLookupEmail(keycloakUserEmail);
      if (lookupEmail) {
        try {
          const found = await severaApi.fetchUserByEmail(lookupEmail);
          if (found?.guid) {
            severaUserId = found.guid;
          }
        } catch {
          return {
            statusCode: 502,
            body: JSON.stringify({ message: "Failed to fetch Severa user by email." })
          };
        }
      }
    }

    // If we have Severa user id, try to remove the opt-in keyword from Severa
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
            body: JSON.stringify({
              message: "Failed to remove isSeveraOptIn keyword from Severa user."
            })
          };
        }
      }
    }

    try {
      await keycloakApi.removeUserAttribute(keycloakUserId, "isSeveraOptIn");
    } catch {
      return {
        statusCode: 502,
        body: JSON.stringify({ message: "Failed to remove isSeveraOptIn attribute." })
      };
    }

    // Remove severaUserId attribute as well
    try {
      await keycloakApi.removeUserAttribute(keycloakUserId, "severaUserId");
    } catch {
      return {
        statusCode: 502,
        body: JSON.stringify({ message: "Failed to remove severaUserId attribute." })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Opt-out completed" })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Severa opt-out failed.", error: String(error) })
    };
  }
};

export const main = middyfy(removeSeveraOptInHandler);
