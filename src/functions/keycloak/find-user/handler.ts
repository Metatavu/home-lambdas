import type { APIGatewayProxyEvent, APIGatewayProxyHandler } from "aws-lambda";
import { CreateKeycloakApiService } from "src/database/services/keycloak-api-service";
import { middyfy } from "src/libs/lambda";
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
    const userById = await api.findUser(id);
    if (!userById) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "User not found" }),
      };
    }
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
