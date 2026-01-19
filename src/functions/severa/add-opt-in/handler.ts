import type { APIGatewayProxyHandler } from "aws-lambda";
import { CreateSeveraApiService } from "src/services/severa-api-service";
import { CreateKeycloakApiService } from "src/database/services/keycloak-api-service";
import { middyfy } from "src/libs/lambda";
import { getLookupEmail } from "src/utils/severa";

export const addSeveraOptInHandler: APIGatewayProxyHandler = async (event) => {
  const keycloakUserId = event.pathParameters?.userId;
  if (!keycloakUserId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Keycloak userId is required" })
    };
  }

  try {
    const severaApi = CreateSeveraApiService();
    const keycloakApi = CreateKeycloakApiService();

    // Fetch Keycloak user and email
    let userEmail: string | undefined;
    try {
      const keycloakUser = await keycloakApi.findUser(keycloakUserId);
      if (!keycloakUser) {
        return {
          statusCode: 404,
          body: JSON.stringify({ message: "Keycloak user not found." })
        };
      }

      // Use util to decide lookup email
      const lookupEmail = getLookupEmail(keycloakUser.email);
      userEmail = lookupEmail;

    } catch {
      return {
        statusCode: 502,
        body: JSON.stringify({ message: "Failed to fetch Keycloak user." })
      };
    }

    if (!userEmail) {
      return {
        statusCode: 502,
        body: JSON.stringify({ message: "No email available for Severa lookup." })
      };
    }

    // Resolve Severa user by email
    let severaUserId: string;
    try {
      const severaUser = await severaApi.fetchUserByEmail(userEmail);
      if (!severaUser || !severaUser.guid) {
        return {
          statusCode: 502,
          body: JSON.stringify({ message: "Severa user missing guid." })
        };
      }
      severaUserId = severaUser.guid;
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
        body: JSON.stringify({ message: "Failed to check global keyword." })
      };
    }

    // Add isSeveraOptIn keyword to user
    try {
      await severaApi.addKeywordToUser(severaUserId, globalGuid);
    } catch {
      return {
        statusCode: 502,
        body: JSON.stringify({ message: "Failed to add isSeveraOptIn keyword to Severa user." })
      };
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