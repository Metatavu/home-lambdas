import type { APIGatewayProxyEvent, APIGatewayProxyHandler } from "aws-lambda";
import { middyfy } from "src/libs/lambda";
import { CreateKeycloakApiService } from "src/services/keycloak-api-service";

const updateUserRolesHandler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent) => {
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

    const body = event.body as unknown as { roles: string[] };

    const api = CreateKeycloakApiService();

    await api.updateUserRoles(userId, body.roles);
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Roles updated sucessfully"
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

export const main = middyfy(updateUserRolesHandler);
