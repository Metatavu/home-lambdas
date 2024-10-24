import { middyfy } from "@libs/lambda";
import type { APIGatewayProxyHandler } from "aws-lambda";
import { CreateKeycloakApiService } from "src/database/services/keycloak-api-service";
import { User } from "src/types/keycloak/user";
/**
 * FIXME: At this moment in KeyCloak its called: severa-user-id (string);
 */

/**
 * Lambda for listing users
 */
const listUsersHandler: APIGatewayProxyHandler = async () => {
  try {
    const api = CreateKeycloakApiService();

    const users = await api.getUsers();

    const filteredUsers: User[] = [];

    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      filteredUsers.push({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        isActive: user.isActive,
        severaGuid: user.severaGuid,
        forecastId: user.forecastId,
      });
    }

    return {
      statusCode: 200,
      body: JSON.stringify(filteredUsers),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Error when listing users" }),
    };
  }
};

export const main = middyfy(listUsersHandler);
