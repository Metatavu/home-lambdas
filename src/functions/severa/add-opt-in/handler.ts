import type { APIGatewayProxyHandler } from "aws-lambda";
import { CreateSeveraApiService } from "src/services/severa-api-service";
import { CreateKeycloakApiService } from "src/database/services/keycloak-api-service";
import { middyfy } from "src/libs/lambda";

export const addSeveraOptInHandler: APIGatewayProxyHandler = async (event) => {
  const keycloakUserId = event.pathParameters?.userId;
  if (!keycloakUserId) {
    return { statusCode: 400, body: JSON.stringify({ message: "Keycloak user id is required" }) };
  }

  try {
    const severaApi = CreateSeveraApiService();
    const keycloakApi = CreateKeycloakApiService();

    // get severaUserId from Keycloak
    let severaUserId;
    try {
      const keycloakUser = await keycloakApi.findUser(keycloakUserId);
      if (!keycloakUser) return { statusCode: 404, body: JSON.stringify({ message: "Keycloak user not found." }) };
      const attrs = keycloakUser.attributes || {};
      severaUserId = attrs.severaUserId && attrs.severaUserId[0];
    } catch {
      return { statusCode: 502, body: JSON.stringify({ message: "Failed to fetch Keycloak user." }) };
    }

    // fallback: find Severa user by Keycloak id
    if (!severaUserId) {
      try {
        const severaUser = await severaApi.fetchUserByKeycloakId(keycloakUserId);
        severaUserId = severaUser && (severaUser.guid || (severaUser as any).id);
      } catch {
        // ignore - handled below
      }
    }

    if (!severaUserId) {
      return { statusCode: 400, body: JSON.stringify({ message: "severaUserId missing." }) };
    }

    // persist severaUserId to Keycloak (best-effort)
    try {
      await keycloakApi.updateUserAttributes(keycloakUserId, { severaUserId: [severaUserId] });
    } catch {
      // ignore
    }

    // update or add isSeveraOptIn in Severa (log responses)
    try {
      const keyword = await severaApi.checkKeywordExists("isSeveraOptIn");
      console.log("[Severa] checkKeywordExists response:", JSON.stringify(keyword));
      const keywordGuid = keyword && (keyword.guid ?? (keyword as any).id);
      if (!keywordGuid) {
        return { statusCode: 502, body: JSON.stringify({ message: "Failed to ensure isSeveraOptIn keyword." }) };
      }

      await severaApi.addKeywordToUser(severaUserId, keywordGuid);

      // verify
      try {
        const after = await severaApi.getUserKeywords(severaUserId);
        console.log(`[Severa] user keywords after add for ${severaUserId}:`, JSON.stringify(after));
      } catch (e) {
        console.log("Failed to fetch user keywords after add:", (e as Error).message);
      }
    } catch (e) {
      return { statusCode: 502, body: JSON.stringify({ message: "Failed to assign isSeveraOptIn in Severa.", detail: (e as Error)?.message ?? String(e) }) };
    }

    return { statusCode: 200, body: JSON.stringify({ message: "Severa opt-in added successfully." }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ message: "Severa opt-in failed.", detail: (e as Error)?.message ?? String(e) }) };
  }
};

export const main = middyfy(addSeveraOptInHandler);