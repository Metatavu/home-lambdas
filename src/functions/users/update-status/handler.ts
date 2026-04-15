import type { APIGatewayProxyHandler } from "aws-lambda";
import { CreateKeycloakApiService } from "src/database/services/keycloak-api-service";
import { middyfy } from "src/libs/lambda";

/**
 *
 * updates user's active status in keycloak.
 *
 * @param event - API Gateway event containing userId and isActive flag
 * @returns API response indicating success or failure
 */
export const updateUserStatusHandler: APIGatewayProxyHandler = async (event) => {
  const userId = event.pathParameters?.userId;
  const body = typeof event.body === "string" ? JSON.parse(event.body) : event.body;
  const isActive = body?.isActive;

  if (!userId || typeof isActive !== "boolean") {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Invalid request" })
    };
  }

  const keycloakApi = CreateKeycloakApiService();
  try {
    if (isActive) {
      await keycloakApi.updateUserAttributes(userId, {
        isActive: ["Active"]
      });
    } else {
      await keycloakApi.removeUserAttribute(userId, "isActive");
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "User status updated" })
    };
  } catch (error) {
    console.error(error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error updating user"
      })
    };
  }
};

export const main = middyfy(updateUserStatusHandler);
