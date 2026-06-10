import { middyfy } from "@libs/lambda";
import type { APIGatewayProxyHandler } from "aws-lambda";
import type { User } from "src/generated/homeLambdasModels/model/user";
import { CreateKeycloakApiService } from "src/services/keycloak-api-service";

/**
 * Lambda for listing users
 */
const listUsersHandler: APIGatewayProxyHandler = async () => {
  try {
    const api = CreateKeycloakApiService();
    const usersRaw = await api.getUsers();

    const users: User[] = usersRaw.map((u: any) => ({
      id: u.id,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      attributes: u.attributes
    }));

    return {
      statusCode: 200,
      body: JSON.stringify(users)
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Error when listing users" })
    };
  }
};

export const main = middyfy(listUsersHandler);
