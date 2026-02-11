import type { APIGatewayProxyHandler } from "aws-lambda";
import { CreateKeycloakApiService } from "src/database/services/keycloak-api-service";
import { middyfy } from "src/libs/lambda";
import { CreateSeveraApiService } from "src/services/severa-api-service";
import { getLookupEmail } from "src/utils/severa";

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
      body: JSON.stringify({ message: "Keycloak userId is required" })
    };
  }

  try {
    const severaApi = CreateSeveraApiService();
    const keycloakApi = CreateKeycloakApiService();

    // Fetch Keycloak user and check for existing severaUserId attribute
    let severaUserId: string;

    try {
      const keycloakUser = await keycloakApi.findUser(keycloakUserId);
      if (!keycloakUser) {
        return {
          statusCode: 404,
          body: JSON.stringify({ message: "Keycloak user not found." })
        };
      }

      const attr = keycloakUser?.attributes || {};
      const existingSeveraUserId = attr.severaUserId?.[0];

      // If severaUserId already exists, use it; otherwise resolve by email
      if (existingSeveraUserId) {
        severaUserId = existingSeveraUserId;
      } else {
        const userEmail = getLookupEmail(keycloakUser.email);
        if (!userEmail) {
          return {
            statusCode: 502,
            body: JSON.stringify({ message: "Failed to lookup email." })
          };
        }

        const severaUser = await severaApi.fetchUserByEmail(userEmail);
        if (!severaUser.guid) {
          return {
            statusCode: 502,
            body: JSON.stringify({ message: "Severa user missing guid." })
          };
        }

        severaUserId = severaUser.guid;
      }
    } catch {
      return {
        statusCode: 502,
        body: JSON.stringify({ message: "Failed to fetch Severa user." })
      };
    }

    // Ensure global keyword exists
    let globalGuid: string;
    try {
      const globalKeyword = await severaApi.checkKeywordExists("isSeveraOptIn");
      globalGuid = globalKeyword?.guid;
      if (!globalGuid) {
        return {
          statusCode: 502,
          body: JSON.stringify({ message: "Global keyword missing." })
        };
      }
    } catch {
      return {
        statusCode: 502,
        body: JSON.stringify({
          message: "Failed to check global keyword.",
        })
      };
    }

    // Check if user already has the keyword, and add it only if not present
    try {
      const existingKeywordGuid = await severaApi.getKeywordIdForUser(
        severaUserId,
        "isSeveraOptIn"
      );
      if (!existingKeywordGuid) {
        await severaApi.addKeywordToUser(severaUserId, globalGuid);
      }
    } catch {
      // If checking fails, try adding anyway (fallback to original behavior)
      try {
        await severaApi.addKeywordToUser(severaUserId, globalGuid);
      } catch {
        return {
          statusCode: 502,
          body: JSON.stringify({ message: "Failed to add isSeveraOptIn keyword to Severa user." })
        };
      }
    }

    // Persist severaUserId attribute to Keycloak
    try {
      await keycloakApi.updateUserAttributes(keycloakUserId, { severaUserId: [severaUserId] });
    } catch {
      return {
        statusCode: 502,
        body: JSON.stringify({ message: "Failed to persist severaUserId to Keycloak." })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Opt-in completed." })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Opt-in failed.", error: String(error) })
    };
  }
};

export const main = middyfy(addSeveraOptInHandler);