import type { APIGatewayProxyEvent, APIGatewayProxyHandler } from "aws-lambda";
import { CreateKeycloakApiService } from "src/database/services/keycloak-api-service";
import { middyfy } from "src/libs/lambda";
import { optInSeveraUser } from "src/utils/severa";

/**
 * Lambda handler to update a user's keycloak attributes and severa keywords
 *
 * @param event API Gateway event
 * @returns Response message as JSON string
 */
const updateUserAttributeHandler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent) => {
  try {
    if (!event.body) {
      throw new Error("Request body is missing.");
    }

    const body = JSON.parse(JSON.stringify(event.body));
    const email = body;
    const { id, attributeName } = event.pathParameters ?? {};

    const allowedAttributes = ["isSeveraOptIn"];

    if (!id || !email || !attributeName) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Missing required parameters: id, email, or attributeName." })
      };
    }

    if (!allowedAttributes.includes(attributeName)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Invalid attribute name." })
      };
    }

    const severaKeywords: Record<string, string[]> = {
      "isSeveraOptIn": [attributeName]
    };
    const severaUser = await optInSeveraUser(email, severaKeywords);
    if (!severaUser?.email || !severaUser?.guid) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: "Severa user not found." })
      };
    }

    const keycloakAttributes: Record<string, string[]> = {
      "severaUserId": [severaUser.guid]
    };
    const api = CreateKeycloakApiService();
    const keycloakUpdateResult = await api.updateUserAttribute(id, keycloakAttributes);

    return {
      statusCode: 200,
      body: JSON.stringify({
        id,
        updatedKeycloakAttributes: {
          severaUserId: keycloakUpdateResult.updatedFields.severaUserId[0]
        },
        severaUser: {
          email: severaUser.email,
          severaUserId: severaUser.guid,
          severaKeyword: severaUser.isSeveraOptIn
        }
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: error.message, stack: error.stack })
    };
  }
};

export const main = middyfy(updateUserAttributeHandler);