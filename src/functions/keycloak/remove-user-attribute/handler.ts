import type { APIGatewayProxyEvent, APIGatewayProxyHandler } from "aws-lambda";
import { CreateKeycloakApiService } from "src/database/services/keycloak-api-service";
import { middyfy } from "src/libs/lambda";

/**
 * Lambda handler to remove a user's attribute
 *
 * @param event API Gateway event
 * @returns Response message as JSON string
 */
const removeUserAttributeHandler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent) => {
  try {
    const id = event.pathParameters?.id;
    const attributeName = event.pathParameters?.attributeName;

    if (!id || !attributeName) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Missing required path parameters: 'id' or  valid 'attributeName'."
        })
      };
    }

    if (attributeName !== "isSeveraOptIn") {
      return {
        statusCode: 403,
        body: JSON.stringify({
          message: 'Attribute "${attributeName}" cannot be removed. Only isSeveraOptin is allowed.'
        })
      };
    }

    const api = CreateKeycloakApiService();

    await api.removeUserAttribute(id, attributeName);

    return {
      statusCode: 204,
      body: JSON.stringify({ message: `User attribute "${attributeName}" removed successfully.` })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: error.message, stack: error.stack })
    };
  }
};

export const main = middyfy(removeUserAttributeHandler);
