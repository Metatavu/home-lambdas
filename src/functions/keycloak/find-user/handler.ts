import type { APIGatewayProxyEvent, APIGatewayProxyHandler } from "aws-lambda";
import { CreateKeycloakApiService } from "src/database/services/keycloak-api-service";
import { middyfy } from "src/libs/lambda";
import { User } from "src/generated/homeLambdasModels/model/user";

/**
 * Lambda for finding user
 *
 * @param event event
 * @returns user information as string
 */
const findUserHandler: APIGatewayProxyHandler = async (
  event: APIGatewayProxyEvent
) => {
  try {
    const { id } = event.pathParameters ?? {};
    const api = CreateKeycloakApiService();
    if (!id) {
      throw new Error("Missing or invalid path parameter: id");
    }
    const userByIdRaw = await api.findUser(id);
    if (!userByIdRaw) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "User not found" }),
      };
    }
    // Map the CustomKeycloakProfile to User model
    const userById: User = {
      id: userByIdRaw.id,
      firstName: userByIdRaw.firstName,
      lastName: userByIdRaw.lastName,
      email: userByIdRaw.email,
      attributes: userByIdRaw.attributes,
    };
    return {
      statusCode: 200,
      body: JSON.stringify(userById),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
export const main = middyfy(findUserHandler);
