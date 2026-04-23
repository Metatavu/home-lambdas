import type { APIGatewayProxyHandler } from "aws-lambda";
import { middyfy } from "src/libs/lambda";
import { CreateKeycloakApiService } from "src/services/keycloak-api-service";
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

  const severaApi = CreateSeveraApiService();
  const keycloakApi = CreateKeycloakApiService();

  try {
    const keycloakUser = await keycloakApi.findUser(keycloakUserId);
    if (!keycloakUser) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: "Keycloak user not found." })
      };
    }

    const attr = keycloakUser.attributes || {};
    let severaUserId = attr.severaUserId?.[0];
    if (!severaUserId) {
      const userEmail = getLookupEmail(keycloakUser.email);
      if (!userEmail) {
        return {
          statusCode: 502,
          body: JSON.stringify({ message: "Failed to lookup email." })
        };
      }

      const severaUser = await severaApi.fetchUserByEmail(userEmail);
      if (!severaUser?.guid) {
        return {
          statusCode: 502,
          body: JSON.stringify({ message: "Severa user missing guid." })
        };
      }

      severaUserId = severaUser.guid;
    }
    const globalKeyword = await severaApi.checkKeywordExists("isSeveraOptIn");
    if (!globalKeyword?.guid) {
      return {
        statusCode: 502,
        body: JSON.stringify({ message: "Global keyword missing." })
      };
    }
    const globalGuid = globalKeyword.guid;
    try {
      const existingKeywordGuid = await severaApi.getKeywordIdForUser(
        severaUserId,
        "isSeveraOptIn"
      );
      if (!existingKeywordGuid) {
        await severaApi.addKeywordToUser(severaUserId, globalGuid);
      }
    } catch {
      await severaApi.addKeywordToUser(severaUserId, globalGuid);
    }
    await keycloakApi.updateUserAttributes(keycloakUserId, {
      severaUserId: [severaUserId]
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Opt-in completed." })
    };
  } catch (error) {
    return {
      statusCode: 502,
      body: JSON.stringify({
        message: "Opt-in failed.",
        error: String(error)
      })
    };
  }
};

export const main = middyfy(addSeveraOptInHandler);
