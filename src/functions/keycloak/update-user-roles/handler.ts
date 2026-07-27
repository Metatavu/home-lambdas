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

    const deleatableRoles = new Set([
      "developer",
      "designer",
      "architect",
      "management",
      "trainee"
    ]);

    const currentRoles = await api.getUserRoles(userId);
    const rolesToDelete = currentRoles
      .filter((role) => !body.roles.includes(role))
      .filter((role) => deleatableRoles.has(role));

    await api.updateUserRoles(userId, body.roles, rolesToDelete);
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
