import type { APIGatewayProxyEvent, APIGatewayProxyHandler } from "aws-lambda";
import { CreateKeycloakApiService } from "src/database/services/keycloak-api-service";
import { middyfy } from "src/libs/lambda";

const getUserRolesHandler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent) => {
  try {
    const { userId } = event.pathParameters ?? {};

    if (!userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Missing userId"
        })
      };
    }

    const api = CreateKeycloakApiService();

    const roles = await api.getUserRoles(userId);

    return {
      statusCode: 200,
      body: JSON.stringify({
        userId,
        roles
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message
      })
    };
  }
};

export const main = middyfy(getUserRolesHandler);
